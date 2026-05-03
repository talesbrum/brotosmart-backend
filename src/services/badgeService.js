// src/services/badgeService.js
// Sistema de distintivos por conquistas (PRD §3.2).
// Verificação automática após cada atividade, sessão e login.

const { getPrisma } = require('../config/database');

// Definição de todos os badges do BrotoSmart
const BADGE_DEFINITIONS = [
  // ── Streak ────────────────────────────────────────────────────────────────
  { slug: 'streak_3',   name: '3 dias seguidos',    description: 'Estudou por 3 dias consecutivos!',  icon: '🔥',  category: 'STREAK',   threshold: 3   },
  { slug: 'streak_7',   name: 'Uma semana!',         description: 'Estudou por 7 dias consecutivos!',  icon: '🔥🔥', category: 'STREAK',  threshold: 7   },
  { slug: 'streak_14',  name: 'Duas semanas!',       description: 'Estudou por 14 dias consecutivos!', icon: '⚡',  category: 'STREAK',   threshold: 14  },
  { slug: 'streak_30',  name: 'Um mês de chama!',    description: 'Estudou por 30 dias seguidos!',     icon: '🏆',  category: 'STREAK',   threshold: 30  },

  // ── Sementes ──────────────────────────────────────────────────────────────
  { slug: 'seeds_50',   name: 'Primeiras 50!',       description: 'Ganhou 50 sementes no total.',      icon: '🌱',  category: 'SEEDS',    threshold: 50  },
  { slug: 'seeds_200',  name: 'Jardineiro nato',     description: 'Ganhou 200 sementes no total.',     icon: '🌿',  category: 'SEEDS',    threshold: 200 },
  { slug: 'seeds_500',  name: 'Mestre das sementes', description: 'Ganhou 500 sementes no total.',     icon: '🌻',  category: 'SEEDS',    threshold: 500 },

  // ── Aprendizado ───────────────────────────────────────────────────────────
  { slug: 'mat_10',     name: '10 em Matemática',    description: 'Completou 10 atividades de Mat!',   icon: '🔢',  category: 'LEARNING', threshold: 10  },
  { slug: 'mat_50',     name: 'Matemático!',         description: 'Completou 50 atividades de Mat!',   icon: '📐',  category: 'LEARNING', threshold: 50  },
  { slug: 'port_10',    name: '10 em Português',     description: 'Completou 10 atividades de Port!',  icon: '📚',  category: 'LEARNING', threshold: 10  },
  { slug: 'port_50',    name: 'Escritor!',           description: 'Completou 50 atividades de Port!',  icon: '✍️',  category: 'LEARNING', threshold: 50  },
  { slug: 'cg_10',      name: '10 em C. Gerais',     description: 'Completou 10 atividades de CG!',    icon: '🌍',  category: 'LEARNING', threshold: 10  },
  { slug: 'perfect_5',  name: 'Quiz perfeito!',      description: 'Acertou todas as questões de um quiz!', icon: '⭐', category: 'LEARNING', threshold: 1 },

  // ── Jardim ────────────────────────────────────────────────────────────────
  { slug: 'garden_2',   name: 'Jardim verde',        description: 'Jardim chegou ao Nível 2!',         icon: '🌿',  category: 'GARDEN',   threshold: 2   },
  { slug: 'garden_3',   name: 'Jardim florido',      description: 'Jardim chegou ao Nível 3!',         icon: '🌸',  category: 'GARDEN',   threshold: 3   },
  { slug: 'garden_5',   name: 'Paraíso!',            description: 'Jardim chegou ao nível máximo!',    icon: '🌈',  category: 'GARDEN',   threshold: 5   },

  // ── Sessões ───────────────────────────────────────────────────────────────
  { slug: 'sessions_5',  name: '5 sessões',          description: 'Completou 5 sessões de estudo!',    icon: '📖',  category: 'SESSIONS', threshold: 5   },
  { slug: 'sessions_20', name: '20 sessões',         description: 'Completou 20 sessões de estudo!',   icon: '🎓',  category: 'SESSIONS', threshold: 20  },
];

/**
 * Popula os badges no banco na primeira execução (idempotente).
 */
async function seedBadges() {
  const prisma = getPrisma();
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where:  { slug: badge.slug },
      create: badge,
      update: badge,
    });
  }
  console.log(`[BadgeService] ${BADGE_DEFINITIONS.length} badges sincronizados.`);
}

/**
 * Verifica e concede todos os badges que a criança ainda não tem mas já merece.
 * Retorna os badges recém-concedidos (para mostrar na UI).
 *
 * @param {string} childId
 * @param {{ seeds: number, streakDays: number, gardenLevel: number }} progress
 * @param {object} [extras] — { perfectQuiz?: boolean, trackSlug?: string, correctAnswers?: number, sessions?: number }
 * @returns {Promise<object[]>} badges recém-ganhos
 */
async function checkAndAward(childId, progress, extras = {}) {
  const prisma = getPrisma();

  // Busca badges que a criança já tem
  const existing = await prisma.childBadge.findMany({
    where:  { childId },
    select: { badgeId: true },
  });
  const ownedIds = new Set(existing.map((b) => b.badgeId));

  // Busca todos os badges
  const allBadges = await prisma.badge.findMany();

  // Conta atividades corretas por trilha se necessário
  let trackCounts = {};
  if (extras.trackSlug !== undefined || true) {
    const answers = await prisma.quizAnswer.findMany({
      where:  { childId, isCorrect: true },
      include: { activity: { select: { track: { select: { slug: true } } } } },
    });
    answers.forEach((a) => {
      const slug = a.activity.track.slug;
      trackCounts[slug] = (trackCounts[slug] || 0) + 1;
    });
  }

  // Conta sessões completas
  let sessionCount = 0;
  if (!extras.sessions) {
    sessionCount = await prisma.session.count({
      where: { childId, endedAt: { not: null } },
    });
  } else {
    sessionCount = extras.sessions;
  }

  const newBadges = [];

  for (const badge of allBadges) {
    if (ownedIds.has(badge.id)) continue; // já tem

    let earned = false;

    switch (badge.category) {
      case 'STREAK':
        earned = progress.streakDays >= badge.threshold;
        break;

      case 'SEEDS':
        earned = progress.seeds >= badge.threshold;
        break;

      case 'GARDEN':
        earned = progress.gardenLevel >= badge.threshold;
        break;

      case 'SESSIONS':
        earned = sessionCount >= badge.threshold;
        break;

      case 'LEARNING':
        if (badge.slug === 'perfect_5') {
          earned = extras.perfectQuiz === true;
        } else if (badge.slug.startsWith('mat_')) {
          earned = (trackCounts['matematica'] || 0) >= badge.threshold;
        } else if (badge.slug.startsWith('port_')) {
          earned = (trackCounts['portugues'] || 0) >= badge.threshold;
        } else if (badge.slug.startsWith('cg_')) {
          earned = (trackCounts['conhecimentos-gerais'] || 0) >= badge.threshold;
        }
        break;
    }

    if (earned) {
      await prisma.childBadge.create({ data: { childId, badgeId: badge.id } });
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Busca todos os badges de uma criança (com status de conquista).
 */
async function getChildBadges(childId) {
  const prisma = getPrisma();
  const [allBadges, earned] = await Promise.all([
    prisma.badge.findMany({ orderBy: [{ category: 'asc' }, { threshold: 'asc' }] }),
    prisma.childBadge.findMany({ where: { childId }, include: { badge: true } }),
  ]);

  const earnedSlugs = new Set(earned.map((e) => e.badge.slug));

  return allBadges.map((b) => ({
    ...b,
    earned:   earnedSlugs.has(b.slug),
    earnedAt: earned.find((e) => e.badge.slug === b.slug)?.earnedAt || null,
  }));
}

module.exports = { seedBadges, checkAndAward, getChildBadges, BADGE_DEFINITIONS };
