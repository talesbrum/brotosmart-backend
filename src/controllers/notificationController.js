// src/controllers/notificationController.js
// Salva e gerencia tokens de push notification dos usuários

const { getPrisma } = require('../config/database');
const push = require('../services/pushNotifications');

/**
 * POST /api/users/push-token
 * Salva o Expo Push Token do dispositivo do usuário.
 * Body: { token }
 */
async function savePushToken(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token obrigatório' });

    const prisma = getPrisma();
    await prisma.user.update({
      where: { id: req.user.id },
      data: { pushToken: token },
    });

    return res.json({ message: 'Token salvo com sucesso' });
  } catch (error) {
    console.error('[savePushToken]', error);
    return res.status(500).json({ error: 'Erro ao salvar token' });
  }
}

/**
 * POST /api/notifications/test
 * Envia uma notificação de teste para o usuário autenticado (dev only).
 */
async function sendTestNotification(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Apenas em desenvolvimento' });
  }

  const result = await push.sendToUser(req.user.id, {
    title: '🌱 BrotoSmart — Teste!',
    body: 'Notificações configuradas com sucesso.',
    data: { type: 'test' },
  });

  return res.json(result);
}

module.exports = { savePushToken, sendTestNotification };
