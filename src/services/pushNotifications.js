// src/services/pushNotifications.js
// Serviço backend para enviar push notifications via Expo Push API.
// Não exige SDK nativo — usa a API HTTP do Expo.

const { getPrisma } = require('../config/database');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envia uma notificação push para um usuário específico.
 * @param {string} userId
 * @param {{ title: string, body: string, data?: object }} payload
 */
async function sendToUser(userId, payload) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  });

  if (!user?.pushToken) return { sent: false, reason: 'No push token' };
  return sendRaw([user.pushToken], payload);
}

/**
 * Envia para múltiplos tokens de uma vez (batch).
 * @param {string[]} tokens
 * @param {{ title: string, body: string, data?: object }} payload
 */
async function sendRaw(tokens, payload) {
  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    channelId: 'brotosmart',
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const json = await res.json();
    return { sent: true, result: json };
  } catch (e) {
    console.error('[PushNotifications] Erro ao enviar:', e);
    return { sent: false, error: e.message };
  }
}

// ── Notificações específicas do BrotoSmart ────────────────────────────────────

/**
 * Envia push quando a criança completa o quiz do dia.
 * @param {string} parentId
 * @param {string} childName
 * @param {number} seedsEarned
 */
async function notifyQuizCompleted(parentId, childName, seedsEarned) {
  return sendToUser(parentId, {
    title: `${childName} completou uma atividade! 🎉`,
    body: `Ela ganhou ${seedsEarned} sementes hoje. Veja o progresso no painel!`,
    data: { type: 'quiz_completed', childName },
  });
}

/**
 * Envia push de lembrete de streak em risco.
 * @param {string} parentId
 * @param {string} childName
 * @param {number} streakDays
 */
async function notifyStreakAtRisk(parentId, childName, streakDays) {
  return sendToUser(parentId, {
    title: `⚠️ Chama em risco!`,
    body: `${childName} não estudou hoje. Sequência de ${streakDays} dias pode ser perdida!`,
    data: { type: 'streak_risk', childName, streakDays },
  });
}

/**
 * Envia push quando a criança sobe de nível no jardim.
 * @param {string} parentId
 * @param {string} childName
 * @param {string} levelName
 */
async function notifyLevelUp(parentId, childName, levelName) {
  return sendToUser(parentId, {
    title: `🌻 ${childName} evoluiu o jardim!`,
    body: `O jardim agora é "${levelName}". Parabéns!`,
    data: { type: 'level_up', childName, levelName },
  });
}

module.exports = { sendToUser, sendRaw, notifyQuizCompleted, notifyStreakAtRisk, notifyLevelUp };
