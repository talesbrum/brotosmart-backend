// src/controllers/deviceController.js
// Gerencia o fluxo completo de dispositivos múltiplos (PRD multi-device):
//   1. Pai gera código de convite (6 chars, validade 48h)
//   2. Filho insere código no celular dele
//   3. Backend emite JWT de longa duração para o dispositivo filho
//   4. Filho usa o JWT para todas as requisições sem precisar de senha
//   5. Pai pode encerrar sessão remotamente ou revogar o dispositivo

const { getPrisma }  = require('../config/database');
const push           = require('../services/pushNotifications');
const crypto         = require('crypto');
const jwt            = require('jsonwebtoken');

const INVITE_EXPIRY_HOURS  = 48;
const DEVICE_JWT_EXPIRY    = '365d';    // token de longa duração no celular da criança

// ── 1. GERAR CÓDIGO DE CONVITE (pai) ─────────────────────────────────────────

/**
 * POST /api/devices/invite
 * Gera um código de 6 letras maiúsculas para vincular o celular da criança.
 * O pai mostra esse código (ou QR code) para a criança inserir.
 * Body: { childId }
 */
async function generateInvite(req, res) {
  try {
    const { childId } = req.body;
    const prisma = getPrisma();

    // Verifica que a criança pertence ao pai
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: req.user.id },
    });
    if (!child) return res.status(403).json({ error: 'Criança não encontrada' });

    // Gera código único de 6 caracteres
    const code      = generateCode();
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 3600 * 1000);

    await prisma.childProfile.update({
      where: { id: childId },
      data: { inviteCode: code, inviteExpiresAt: expiresAt },
    });

    return res.status(201).json({
      code,
      expiresAt,
      expiresInHours: INVITE_EXPIRY_HOURS,
      message: `Código válido por ${INVITE_EXPIRY_HOURS}h. Informe para a criança inserir no celular dela.`,
    });
  } catch (e) {
    console.error('[generateInvite]', e);
    return res.status(500).json({ error: 'Erro ao gerar convite' });
  }
}

// ── 2. RESGATAR CÓDIGO (celular da criança) ───────────────────────────────────

/**
 * POST /api/devices/link  (rota pública — não requer auth do pai)
 * A criança insere o código no celular dela.
 * Retorna um JWT de longa duração que fica armazenado no AsyncStorage.
 * Body: { code, deviceName? }
 */
async function linkDevice(req, res) {
  try {
    const { code, deviceName } = req.body;
    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    const prisma = getPrisma();
    const child  = await prisma.childProfile.findFirst({
      where: { inviteCode: code.toUpperCase() },
      include: {
        parent:   { select: { id: true, name: true } },
        progress: { select: { seeds: true, streakDays: true, gardenLevel: true } },
      },
    });

    if (!child) {
      return res.status(404).json({ error: 'Código não encontrado' });
    }
    if (child.inviteExpiresAt && new Date() > child.inviteExpiresAt) {
      return res.status(410).json({ error: 'Código expirado. Peça um novo para os responsáveis.' });
    }

    // Emite JWT de longa duração para o dispositivo da criança
    const deviceToken = jwt.sign(
      { childId: child.id, type: 'child_device' },
      process.env.JWT_SECRET,
      { expiresIn: DEVICE_JWT_EXPIRY }
    );

    // Armazena hash do token (não o token em si)
    const tokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');

    await prisma.$transaction([
      prisma.childDeviceSession.create({
        data: { childId: child.id, tokenHash, deviceName: deviceName || 'Celular da criança' },
      }),
      prisma.childProfile.update({
        where: { id: child.id },
        data:  { hasOwnDevice: true, inviteCode: null, inviteExpiresAt: null },
      }),
    ]);

    // Notifica o pai que o celular foi vinculado
    setImmediate(async () => {
      try {
        await push.sendToUser(child.parentId, {
          title: `📱 ${child.name} vinculou o celular!`,
          body:  `O celular "${deviceName || 'Celular da criança'}" foi vinculado com sucesso.`,
          data:  { type: 'device_linked', childId: child.id },
        });
      } catch {}
    });

    return res.json({
      message:     `Bem-vinda, ${child.name}! 🌱`,
      deviceToken,                    // armazenar no AsyncStorage do celular da criança
      child: {
        id:           child.id,
        name:         child.name,
        age:          child.age,
        avatar:       child.avatar,
        dailyLimitMins: child.dailyLimitMins,
        activeTrackSlugs: child.activeTrackSlugs,
        progress:     child.progress,
        parentName:   child.parent.name,
      },
    });
  } catch (e) {
    console.error('[linkDevice]', e);
    return res.status(500).json({ error: 'Erro ao vincular dispositivo' });
  }
}

// ── 3. REFRESH DO PERFIL DA CRIANÇA (celular da criança) ──────────────────────

/**
 * GET /api/devices/child-profile
 * Retorna dados atualizados da criança para o celular dela.
 * Usa o deviceToken (JWT de longa duração) no header Authorization.
 * Também verifica se o pai encerrou a sessão remotamente.
 */
async function getChildProfile(req, res) {
  // req.child é injetado pelo middleware authenticateChild
  const child = req.child;

  // Verifica bloqueio remoto pelo pai
  if (child.sessionLockedAt) {
    const lockedMsAgo = Date.now() - new Date(child.sessionLockedAt).getTime();
    if (lockedMsAgo < 30 * 60 * 1000) { // bloqueio válido por 30 min
      return res.status(423).json({
        error:  'Sessão encerrada pelo responsável',
        code:   'SESSION_LOCKED',
        lockedAt: child.sessionLockedAt,
      });
    }
  }

  return res.json({
    child: {
      id:               child.id,
      name:             child.name,
      age:              child.age,
      avatar:           child.avatar,
      dailyLimitMins:   child.dailyLimitMins,
      activeTrackSlugs: child.activeTrackSlugs,
      hasOwnDevice:     child.hasOwnDevice,
      progress:         child.progress,
    },
  });
}

// ── 4. ENCERRAMENTO REMOTO DE SESSÃO (pai) ────────────────────────────────────

/**
 * POST /api/devices/lock/:childId
 * Pai encerra a sessão do filho remotamente.
 * O celular da criança detecta o bloqueio na próxima requisição.
 */
async function lockChildSession(req, res) {
  try {
    const { childId } = req.params;
    const prisma = getPrisma();

    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: req.user.id },
      select: { id: true, name: true, childDeviceToken: true },
    });
    if (!child) return res.status(403).json({ error: 'Criança não encontrada' });

    await prisma.childProfile.update({
      where: { id: childId },
      data:  { sessionLockedAt: new Date() },
    });

    // Push direto para o celular da criança
    if (child.childDeviceToken) {
      setImmediate(async () => {
        try {
          await push.sendRaw([child.childDeviceToken], {
            title: '⏰ Hora de parar!',
            body:  'Os responsáveis encerraram a sessão. Até amanhã! 👋',
            data:  { type: 'session_locked' },
          });
        } catch {}
      });
    }

    return res.json({ message: `Sessão de ${child.name} encerrada remotamente.` });
  } catch (e) {
    console.error('[lockChildSession]', e);
    return res.status(500).json({ error: 'Erro ao encerrar sessão' });
  }
}

/**
 * POST /api/devices/unlock/:childId
 * Pai desbloqueia a sessão da criança (ex: deu mais tempo).
 */
async function unlockChildSession(req, res) {
  try {
    const { childId } = req.params;
    const prisma = getPrisma();

    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: req.user.id },
    });
    if (!child) return res.status(403).json({ error: 'Criança não encontrada' });

    await prisma.childProfile.update({
      where: { id: childId },
      data:  { sessionLockedAt: null },
    });

    return res.json({ message: `Sessão de ${child.name} desbloqueada!` });
  } catch (e) {
    console.error('[unlockChildSession]', e);
    return res.status(500).json({ error: 'Erro ao desbloquear' });
  }
}

// ── 5. LISTAR E REVOGAR DISPOSITIVOS (pai) ────────────────────────────────────

/**
 * GET /api/devices/:childId
 * Lista todos os dispositivos vinculados a uma criança.
 */
async function listDevices(req, res) {
  try {
    const { childId } = req.params;
    const prisma = getPrisma();

    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: req.user.id },
    });
    if (!child) return res.status(403).json({ error: 'Sem permissão' });

    const devices = await prisma.childDeviceSession.findMany({
      where:   { childId, revokedAt: null },
      orderBy: { lastSeenAt: 'desc' },
    });

    return res.json({ devices });
  } catch (e) {
    console.error('[listDevices]', e);
    return res.status(500).json({ error: 'Erro ao listar dispositivos' });
  }
}

/**
 * DELETE /api/devices/sessions/:sessionId
 * Pai revoga um dispositivo específico (criança precisará usar novo código).
 */
async function revokeDevice(req, res) {
  try {
    const { sessionId } = req.params;
    const prisma = getPrisma();

    const session = await prisma.childDeviceSession.findUnique({
      where:   { id: sessionId },
      include: { child: { select: { parentId: true, name: true } } },
    });

    if (!session || session.child.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    await prisma.$transaction([
      prisma.childDeviceSession.update({
        where: { id: sessionId },
        data:  { revokedAt: new Date() },
      }),
      prisma.childProfile.update({
        where: { id: session.childId },
        data:  { hasOwnDevice: false },
      }),
    ]);

    return res.json({ message: `Dispositivo de ${session.child.name} desvinculado.` });
  } catch (e) {
    console.error('[revokeDevice]', e);
    return res.status(500).json({ error: 'Erro ao desvincular' });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCode() {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I,O,0,1 (confusos)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

module.exports = {
  generateInvite, linkDevice, getChildProfile,
  lockChildSession, unlockChildSession,
  listDevices, revokeDevice,
};
