// src/controllers/authController.js
// Registro, login e gerenciamento de perfis

const { getPrisma } = require('../config/database');
const { verifyFirebaseToken } = require('../config/firebase');

/**
 * POST /api/auth/register
 * Chamado APÓS o Firebase criar o usuário no client.
 * Salva o usuário no PostgreSQL com o firebase_uid.
 *
 * Body: { idToken, name }
 */
async function register(req, res) {
  try {
    const { idToken, name } = req.body;

    if (!idToken || !name) {
      return res.status(400).json({ error: 'idToken e name são obrigatórios' });
    }

    // Verifica o token Firebase
    const decoded = await verifyFirebaseToken(idToken);
    const prisma = getPrisma();

    // Verifica se já existe
    const existing = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Usuário já cadastrado',
        user: sanitizeUser(existing),
      });
    }

    // Cria o usuário
    const user = await prisma.user.create({
      data: {
        firebaseUid: decoded.uid,
        email: decoded.email,
        name: name.trim(),
      },
    });

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso!',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('[register]', error);
    if (error.code?.startsWith('auth/')) {
      return res.status(401).json({ error: 'Token Firebase inválido' });
    }
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
}

/**
 * GET /api/auth/me
 * Retorna o usuário autenticado + filhos.
 * Requer middleware `authenticate`.
 */
async function getMe(req, res) {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        children: {
          include: {
            progress: {
              select: {
                seeds: true,
                streakDays: true,
                gardenLevel: true,
                lastActivityAt: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('[getMe]', error);
    return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
}

/**
 * POST /api/auth/children
 * Cria um perfil de criança para o pai autenticado.
 *
 * Body: { name, age, avatar?, dailyLimitMins? }
 */
async function createChildProfile(req, res) {
  try {
    const { name, age, avatar = 'seed_01', dailyLimitMins = 15 } = req.body;

    if (!name || !age) {
      return res.status(400).json({ error: 'Nome e idade são obrigatórios' });
    }

    if (age < 4 || age > 12) {
      return res.status(400).json({ error: 'Idade deve ser entre 4 e 12 anos' });
    }

    if (dailyLimitMins < 5 || dailyLimitMins > 120) {
      return res.status(400).json({
        error: 'Limite diário deve ser entre 5 e 120 minutos',
      });
    }

    const prisma = getPrisma();

    // Máximo de 5 perfis por família
    const childCount = await prisma.childProfile.count({
      where: { parentId: req.user.id },
    });

    if (childCount >= 5) {
      return res.status(400).json({
        error: 'Limite de 5 perfis de crianças por família atingido',
      });
    }

    // Cria o perfil com o progresso inicial (Prisma nested create)
    const child = await prisma.childProfile.create({
      data: {
        parentId: req.user.id,
        name: name.trim(),
        age: parseInt(age),
        avatar,
        dailyLimitMins: parseInt(dailyLimitMins),
        progress: {
          create: {
            seeds: 0,
            streakDays: 0,
            gardenLevel: 1,
          },
        },
      },
      include: { progress: true },
    });

    return res.status(201).json({
      message: `Perfil de ${child.name} criado com sucesso! 🌱`,
      child,
    });
  } catch (error) {
    console.error('[createChildProfile]', error);
    return res.status(500).json({ error: 'Erro ao criar perfil da criança' });
  }
}

/**
 * PUT /api/auth/children/:childId
 * Atualiza configurações do perfil de criança (ex: limite de tempo).
 */
async function updateChildProfile(req, res) {
  try {
    const { name, avatar, dailyLimitMins } = req.body;
    const { childId } = req.params;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (avatar) updateData.avatar = avatar;
    if (dailyLimitMins) {
      if (dailyLimitMins < 5 || dailyLimitMins > 120) {
        return res.status(400).json({
          error: 'Limite diário deve ser entre 5 e 120 minutos',
        });
      }
      updateData.dailyLimitMins = parseInt(dailyLimitMins);
    }

    const prisma = getPrisma();
    const child = await prisma.childProfile.update({
      where: { id: childId },
      data: updateData,
    });

    return res.json({
      message: 'Perfil atualizado!',
      child,
    });
  } catch (error) {
    console.error('[updateChildProfile]', error);
    return res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
}

/**
 * DELETE /api/auth/children/:childId
 * Remove um perfil de criança (e todos os dados vinculados via CASCADE).
 */
async function deleteChildProfile(req, res) {
  try {
    const { childId } = req.params;
    const prisma = getPrisma();

    await prisma.childProfile.delete({ where: { id: childId } });

    return res.json({ message: 'Perfil removido com sucesso' });
  } catch (error) {
    console.error('[deleteChildProfile]', error);
    return res.status(500).json({ error: 'Erro ao remover perfil' });
  }
}

// Remove campos sensíveis antes de enviar
function sanitizeUser(user) {
  const { ...safe } = user;
  return safe;
}

// ── PIN parental (PRD §5.2) ──────────────────────────────────────────────────
const bcrypt = require('bcryptjs');

/**
 * POST /api/auth/set-pin
 * Define ou altera o PIN de 4 dígitos para acesso ao painel dos pais.
 * Body: { pin }
 */
async function setParentPin(req, res) {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN deve ter exatamente 4 dígitos numéricos' });
    }
    const hashed = await bcrypt.hash(pin, 10);
    const prisma  = getPrisma();
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { parentPin: hashed },
    });
    return res.json({ message: 'PIN definido com sucesso!' });
  } catch (e) {
    console.error('[setParentPin]', e);
    return res.status(500).json({ error: 'Erro ao salvar PIN' });
  }
}

/**
 * POST /api/auth/verify-pin
 * Verifica se o PIN informado está correto.
 * Body: { pin }
 */
async function verifyParentPin(req, res) {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN inválido' });
    }
    const prisma = getPrisma();
    const user   = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { parentPin: true },
    });
    if (!user?.parentPin) {
      // PIN ainda não configurado — primeira vez, deixa passar
      return res.json({ message: 'PIN não configurado — acesso liberado', firstTime: true });
    }
    const ok = await bcrypt.compare(pin, user.parentPin);
    if (!ok) return res.status(401).json({ error: 'PIN incorreto' });
    return res.json({ message: 'PIN verificado!' });
  } catch (e) {
    console.error('[verifyParentPin]', e);
    return res.status(500).json({ error: 'Erro ao verificar PIN' });
  }
}


/**
 * PATCH /api/auth/children/:childId/tracks
 * Ativa ou desativa trilhas específicas para um filho (PRD §5.1).
 * Body: { activeSlugs: string[] }
 */
async function updateChildTracks(req, res) {
  try {
    const { activeSlugs } = req.body;
    const { childId }     = req.params;
    const prisma          = getPrisma();

    if (!Array.isArray(activeSlugs) || activeSlugs.length === 0) {
      return res.status(400).json({ error: 'Pelo menos uma trilha deve estar ativa' });
    }

    // Valida slugs
    const valid = ['matematica', 'portugues', 'conhecimentos-gerais', 'ciencias', 'geografia-brasil'];
    const invalid = activeSlugs.filter((s) => !valid.includes(s));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Trilhas inválidas: ${invalid.join(', ')}` });
    }

    const child = await prisma.childProfile.update({
      where: { id: childId },
      data:  { activeTrackSlugs: activeSlugs },
    });

    return res.json({
      message: 'Trilhas atualizadas!',
      activeTrackSlugs: child.activeTrackSlugs,
    });
  } catch (e) {
    console.error('[updateChildTracks]', e);
    return res.status(500).json({ error: 'Erro ao atualizar trilhas' });
  }
}


// ── Export único consolidado ──────────────────────────────────────────────────
module.exports = {
  // Autenticação
  register,
  getMe,
  // Perfis de crianças
  createChildProfile,
  updateChildProfile,
  deleteChildProfile,
  // PIN parental (PRD §5.2)
  setParentPin,
  verifyParentPin,
  // Trilhas ativas por filho (PRD §5.1)
  updateChildTracks,
  // Utilitários
  sanitizeUser,
};
