// src/services/pedagogicAlerts.js
// Analisa padrões de erros e gera alertas pedagógicos automáticos (PRD §5.1).
// Ex: "Ana travou 3x esta semana em multiplicação"
// Chamado pelo endpoint /parents/summary e pelo job diário.

const { getPrisma } = require('../config/database');

// Quantas repetições de erro na mesma atividade disparam o alerta
const ERROR_THRESHOLD = 3;
// Janela de tempo em dias para análise
const ANALYSIS_WINDOW_DAYS = 7;

/**
 * Categorias de alertas pedagógicos.
 * Cada alerta tem: tipo, prioridade, título e mensagem para o pai.
 */
const ALERT_TYPES = {
  REPEATED_ERRORS: {
    priority: 'high',
    icon: '⚠️',
    title: (childName, topic, count) =>
      `${childName} errou "${topic}" ${count}x esta semana`,
    message: (childName, topic, track) =>
      `${childName} está tendo dificuldade em ${topic} (${track}). Considere praticar juntos!`,
  },
  INACTIVITY: {
    priority: 'medium',
    icon: '💤',
    title: (childName, days) =>
      `${childName} não estuda há ${days} dia${days > 1 ? 's' : ''}`,
    message: (childName) =>
      `Que tal lembrar ${childName} de acender a Chama do Saber hoje?`,
  },
  LOW_ACCURACY: {
    priority: 'medium',
    icon: '📉',
    title: (childName, track, pct) =>
      `Taxa de acerto baixa em ${track}: ${pct}%`,
    message: (childName, track) =>
      `${childName} está acertando menos de 50% em ${track}. O nível pode estar avançado demais.`,
  },
  GREAT_STREAK: {
    priority: 'low',
    icon: '🔥',
    title: (childName, days) =>
      `${childName} está com ${days} dias seguidos!`,
    message: (childName, days) =>
      `Incrível! ${childName} completou ${days} dias consecutivos de estudo. Hora de celebrar!`,
  },
  LEVEL_UP: {
    priority: 'low',
    icon: '⭐',
    title: (childName, badge) =>
      `${childName} conquistou: ${badge}`,
    message: (childName, badge) =>
      `${childName} ganhou o distintivo "${badge}". Parabenize ela!`,
  },
};

/**
 * Gera todos os alertas pedagógicos de uma criança para os últimos 7 dias.
 * @param {string} childId
 * @param {string} childName
 * @returns {Promise<object[]>} lista de alertas ordenados por prioridade
 */
async function generateAlerts(childId, childName) {
  const prisma    = getPrisma();
  const since     = new Date();
  since.setDate(since.getDate() - ANALYSIS_WINDOW_DAYS);

  const alerts = [];

  // ── 1. Erros repetidos na mesma atividade ─────────────────────────────────
  const wrongAnswers = await prisma.quizAnswer.findMany({
    where:   { childId, isCorrect: false, answeredAt: { gte: since } },
    include: {
      activity: {
        select: {
          title: true,
          track: { select: { name: true } },
        },
      },
    },
  });

  // Agrupa erros por título de atividade
  const errorMap = {};
  for (const ans of wrongAnswers) {
    const key = ans.activity.title;
    if (!errorMap[key]) {
      errorMap[key] = { count: 0, track: ans.activity.track.name };
    }
    errorMap[key].count++;
  }

  for (const [topic, { count, track }] of Object.entries(errorMap)) {
    if (count >= ERROR_THRESHOLD) {
      alerts.push({
        type:     'REPEATED_ERRORS',
        priority: 'high',
        icon:     ALERT_TYPES.REPEATED_ERRORS.icon,
        title:    ALERT_TYPES.REPEATED_ERRORS.title(childName, topic, count),
        message:  ALERT_TYPES.REPEATED_ERRORS.message(childName, topic, track),
        data:     { topic, count, track },
      });
    }
  }

  // ── 2. Inatividade ─────────────────────────────────────────────────────────
  const progress = await prisma.progress.findUnique({ where: { childId } });
  if (progress?.lastActivityAt) {
    const daysSince = Math.floor(
      (Date.now() - new Date(progress.lastActivityAt)) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 2) {
      alerts.push({
        type:     'INACTIVITY',
        priority: 'medium',
        icon:     ALERT_TYPES.INACTIVITY.icon,
        title:    ALERT_TYPES.INACTIVITY.title(childName, daysSince),
        message:  ALERT_TYPES.INACTIVITY.message(childName),
        data:     { daysSince },
      });
    }
  }

  // ── 3. Taxa de acerto baixa por trilha ─────────────────────────────────────
  const allAnswers = await prisma.quizAnswer.findMany({
    where:   { childId, answeredAt: { gte: since } },
    include: { activity: { select: { track: { select: { name: true, slug: true } } } } },
  });

  const trackStats = {};
  for (const ans of allAnswers) {
    const slug = ans.activity.track.slug;
    if (!trackStats[slug]) {
      trackStats[slug] = { name: ans.activity.track.name, total: 0, correct: 0 };
    }
    trackStats[slug].total++;
    if (ans.isCorrect) trackStats[slug].correct++;
  }

  for (const [slug, stat] of Object.entries(trackStats)) {
    if (stat.total >= 5) {
      const pct = Math.round((stat.correct / stat.total) * 100);
      if (pct < 50) {
        alerts.push({
          type:     'LOW_ACCURACY',
          priority: 'medium',
          icon:     ALERT_TYPES.LOW_ACCURACY.icon,
          title:    ALERT_TYPES.LOW_ACCURACY.title(childName, stat.name, pct),
          message:  ALERT_TYPES.LOW_ACCURACY.message(childName, stat.name),
          data:     { track: stat.name, accuracy: pct },
        });
      }
    }
  }

  // ── 4. Streak positivo (motivação para o pai) ──────────────────────────────
  if (progress?.streakDays >= 7) {
    alerts.push({
      type:     'GREAT_STREAK',
      priority: 'low',
      icon:     ALERT_TYPES.GREAT_STREAK.icon,
      title:    ALERT_TYPES.GREAT_STREAK.title(childName, progress.streakDays),
      message:  ALERT_TYPES.GREAT_STREAK.message(childName, progress.streakDays),
      data:     { streakDays: progress.streakDays },
    });
  }

  // ── 5. Badges recém-ganhos ─────────────────────────────────────────────────
  const recentBadges = await prisma.childBadge.findMany({
    where:   { childId, earnedAt: { gte: since } },
    include: { badge: { select: { name: true, icon: true } } },
    orderBy: { earnedAt: 'desc' },
    take:    3,
  });

  for (const cb of recentBadges) {
    alerts.push({
      type:     'LEVEL_UP',
      priority: 'low',
      icon:     cb.badge.icon,
      title:    ALERT_TYPES.LEVEL_UP.title(childName, cb.badge.name),
      message:  ALERT_TYPES.LEVEL_UP.message(childName, cb.badge.name),
      data:     { badge: cb.badge.name, earnedAt: cb.earnedAt },
    });
  }

  // Ordena: high → medium → low
  const ORDER = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
}

module.exports = { generateAlerts };
