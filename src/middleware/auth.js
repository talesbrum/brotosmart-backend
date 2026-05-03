// src/middleware/auth.js
// Middleware que verifica o Firebase ID Token e injeta o usuário na request

const { verifyFirebaseToken } = require('../config/firebase');
const { getPrisma } = require('../config/database');

/**
 * Middleware principal de autenticação.
 * Espera o header: Authorization: Bearer <firebase_id_token>
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autenticação não fornecido',
        code: 'MISSING_TOKEN',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // 1. Verifica o token com o Firebase Admin SDK
    const decoded = await verifyFirebaseToken(idToken);

    // 2. Busca o usuário no PostgreSQL pelo firebase_uid
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: {
        children: {
          select: { id: true, name: true, age: true, avatar: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado. Faça o cadastro primeiro.',
        code: 'USER_NOT_FOUND',
      });
    }

    // 3. Injeta o usuário na request para uso nos controllers
    req.user = user;
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    // Erros comuns do Firebase Auth
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Sessão expirada. Faça login novamente.',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        error: 'Token inválido.',
        code: 'INVALID_TOKEN',
      });
    }

    console.error('[Auth Middleware]', error);
    return res.status(500).json({ error: 'Erro interno de autenticação' });
  }
}

/**
 * Middleware que verifica se o perfil de criança pertence ao pai autenticado.
 * Use em rotas que recebem :childId como parâmetro.
 */
async function authorizeChild(req, res, next) {
  try {
    const { childId } = req.params;
    const prisma = getPrisma();

    const child = await prisma.childProfile.findFirst({
      where: {
        id: childId,
        parentId: req.user.id, // garante que é filho DESTE pai
      },
    });

    if (!child) {
      return res.status(403).json({
        error: 'Acesso negado a este perfil',
        code: 'FORBIDDEN',
      });
    }

    req.child = child;
    next();
  } catch (error) {
    console.error('[AuthorizeChild]', error);
    return res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
}

module.exports = { authenticate, authorizeChild };
