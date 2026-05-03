// src/middleware/childAuth.js
// Middleware de autenticação para o celular próprio da criança.
// Verifica o JWT de longa duração emitido no momento da vinculação.
// Diferente do middleware `authenticate` (que é para os pais via Firebase).

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { getPrisma } = require('../config/database');

/**
 * Middleware para rotas usadas pelo celular da criança.
 * Espera: Authorization: Bearer <device_token>
 */
async function authenticateChild(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de dispositivo não fornecido', code: 'MISSING_TOKEN' });
    }

    const token = header.split('Bearer ')[1];

    // Verifica assinatura JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      const code = e.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      return res.status(401).json({ error: 'Token de dispositivo inválido', code });
    }

    if (payload.type !== 'child_device') {
      return res.status(401).json({ error: 'Tipo de token inválido', code: 'WRONG_TOKEN_TYPE' });
    }

    // Verifica se o token ainda está ativo (não foi revogado)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const prisma    = getPrisma();

    const session = await prisma.childDeviceSession.findUnique({
      where: { tokenHash },
    });

    if (!session || session.revokedAt) {
      return res.status(401).json({
        error: 'Dispositivo desvinculado. Peça um novo código para os responsáveis.',
        code:  'DEVICE_REVOKED',
      });
    }

    // Busca o perfil completo da criança
    const child = await prisma.childProfile.findUnique({
      where:   { id: payload.childId },
      include: {
        progress: true,
        parent:   { select: { id: true, name: true, pushToken: true } },
      },
    });

    if (!child) {
      return res.status(404).json({ error: 'Perfil da criança não encontrado', code: 'CHILD_NOT_FOUND' });
    }

    // Atualiza lastSeenAt em background (não bloqueia)
    setImmediate(() => {
      prisma.childDeviceSession.update({
        where: { id: session.id },
        data:  { lastSeenAt: new Date() },
      }).catch(() => {});
    });

    // Injeta na request
    req.child    = child;
    req.deviceSession = session;
    next();

  } catch (e) {
    console.error('[childAuth]', e);
    return res.status(500).json({ error: 'Erro de autenticação' });
  }
}

module.exports = { authenticateChild };
