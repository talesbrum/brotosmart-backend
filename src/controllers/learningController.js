// src/controllers/learningController.js
// Seleção de atividades por nível de dificuldade (adaptado à idade da criança)
// registro de respostas, atualização de progresso e push para pais.

const { getPrisma }     = require('../config/database');
const push              = require('../services/pushNotifications');
const { getLevelByAge, getDifficultyLevel, calculateSeedsReward } = require('../config/schoolLevels');
const { calculateStreakUpdate } = require('../services/streakService');
const { checkAndAward }         = require('../services/badgeService');

// ── GET /api/learning/tracks ─────────────────────────────────────────────────
async function getTracks(req, res) {
  try {
    const tracks = await getPrisma().learningTrack.findMany({ orderBy: { name: 'asc' } });
    return res.json({ tracks });
  } catch (e) {
    console.error('[getTracks]', e);
    return res.status(500).json({ error: 'Erro ao buscar trilhas' });
  }
}

// ── GET /api/learning/activities?trackId=&childId= ───────────────────────────
// Seleciona a próxima atividade levando em conta:
//   1. A idade da criança → nível de dificuldade alvo
//   2. Questões ainda não respondidas corretamente (prioridade)
//   3. Sistema de progressão: começa no nível da criança e
//      sobe/desce conforme acertos consecutivos
async function getNextActivity(req, res) {
  try {
    const { trackId, childId } = req.query;
    const prisma = getPrisma();

    // Busca o perfil da criança (idade + trilhas ativas)
    const child = await prisma.childProfile.findUnique({
      where:  { id: childId },
      select: { age: true, activeTrackSlugs: true },
    });

    if (!child) return res.status(404).json({ error: 'Criança não encontrada' });

    // Valida se a trilha solicitada está ativa para esta criança (PRD §5.1)
    const activeSlugs = child.activeTrackSlugs || ['matematica', 'portugues'];
    const requestedTrack = await prisma.learningTrack.findUnique({
      where: { id: trackId }, select: { slug: true },
    });
    if (requestedTrack && !activeSlugs.includes(requestedTrack.slug)) {
      return res.status(403).json({
        error:  'Esta trilha está desativada para esta criança',
        code:   'TRACK_DISABLED',
      });
    }

    const targetLevel    = getDifficultyLevel(child.age);
    const schoolInfo     = getLevelByAge(child.age);

    // Busca respostas recentes para calcular progressão dinâmica
    const recentAnswers = await prisma.quizAnswer.findMany({
      where:   { childId, answeredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { answeredAt: 'desc' },
      take:    10,
      select:  { isCorrect: true },
    });

    // Calcula o nível adaptativo baseado nos últimos acertos
    const adaptiveLevel = getAdaptiveLevel(targetLevel, recentAnswers);

    // IDs já respondidos corretamente neste nível (não repetir o fácil)
    const answeredCorrectly = await prisma.quizAnswer.findMany({
      where: {
        childId,
        isCorrect: true,
        activity:  { trackId, level: adaptiveLevel },
      },
      select:  { activityId: true },
      orderBy: { answeredAt: 'desc' },
      take:    50,
    });
    const answeredIds = answeredCorrectly.map((a) => a.activityId);

    // 1ª tentativa: nível adaptativo, não respondida ainda
    let activity = await prisma.activity.findFirst({
      where: {
        trackId,
        level: adaptiveLevel,
        id:    { notIn: answeredIds },
      },
      orderBy: [{ level: 'asc' }, { createdAt: 'asc' }],
    });

    // 2ª tentativa: qualquer questão do nível adaptativo (repetir se necessário)
    if (!activity) {
      activity = await prisma.activity.findFirst({
        where:   { trackId, level: adaptiveLevel },
        orderBy: { createdAt: 'asc' },
      });
    }

    // 3ª tentativa: nível mais próximo disponível
    if (!activity) {
      activity = await prisma.activity.findFirst({
        where:   { trackId, level: { lte: adaptiveLevel } },
        orderBy: [{ level: 'desc' }, { createdAt: 'asc' }],
      });
    }

    // Fallback: qualquer atividade da trilha
    if (!activity) {
      activity = await prisma.activity.findFirst({ where: { trackId } });
    }

    if (!activity) return res.status(404).json({ error: 'Nenhuma atividade encontrada' });

    // Calcula sementes ajustadas pela idade (mais velhos ganham mais)
    const adjustedSeeds = calculateSeedsReward(child.age, activity.seedsReward);

    return res.json({
      activity: { ...activity, seedsReward: adjustedSeeds },
      meta: {
        childAge:      child.age,
        targetLevel,
        adaptiveLevel,
        schoolYear:    schoolInfo.schoolYear,
        levelLabel:    schoolInfo.levelLabel,
      },
    });
  } catch (e) {
    console.error('[getNextActivity]', e);
    return res.status(500).json({ error: 'Erro ao buscar atividade' });
  }
}

/**
 * Calcula o nível adaptativo baseado nos acertos recentes.
 * - 3+ acertos consecutivos → sobe 1 nível (desafio maior)
 * - 3+ erros consecutivos   → desce 1 nível (não frustra a criança)
 * - Respeita os limites 1–5
 *
 * @param {number} baseLevel  — nível padrão da idade
 * @param {{ isCorrect: boolean }[]} recent — últimas respostas (mais recente primeiro)
 * @returns {number}
 */
function getAdaptiveLevel(baseLevel, recent) {
  if (recent.length < 3) return baseLevel;

  const last3  = recent.slice(0, 3);
  const allOk  = last3.every((r) => r.isCorrect);
  const allErr = last3.every((r) => !r.isCorrect);

  if (allOk)  return Math.min(5, baseLevel + 1);
  if (allErr) return Math.max(1, baseLevel - 1);
  return baseLevel;
}

// ── POST /api/learning/answer ────────────────────────────────────────────────
async function submitAnswer(req, res) {
  try {
    const { childId, activityId, isCorrect } = req.body;
    const prisma = getPrisma();

    const [activity, child] = await Promise.all([
      prisma.activity.findUnique({ where: { id: activityId } }),
      prisma.childProfile.findUnique({ where: { id: childId }, select: { age: true, name: true, parentId: true } }),
    ]);

    if (!activity) return res.status(404).json({ error: 'Atividade não encontrada' });
    if (!child)    return res.status(404).json({ error: 'Criança não encontrada' });

    await prisma.quizAnswer.create({ data: { childId, activityId, isCorrect } });

    let updatedProgress = null;
    const adjustedSeeds = calculateSeedsReward(child.age, activity.seedsReward);

    if (isCorrect) {
      const progress = await prisma.progress.findUnique({ where: { childId } });
      const today    = new Date().toDateString();
      const lastDay  = progress?.lastActivityAt
        ? new Date(progress.lastActivityAt).toDateString()
        : null;

      const isNewDay  = lastDay !== today;
      const newStreak = isNewDay ? (progress?.streakDays || 0) + 1 : (progress?.streakDays || 0);

      const GARDEN_THRESHOLDS = [0, 50, 150, 350, 700];
      const newSeeds  = (progress?.seeds || 0) + adjustedSeeds;
      const newLevel  = GARDEN_THRESHOLDS.reduce(
        (lvl, threshold, idx) => (newSeeds >= threshold ? idx + 1 : lvl), 1
      );

      updatedProgress = await prisma.progress.update({
        where: { childId },
        data: {
          seeds:          { increment: adjustedSeeds },
          streakDays:     newStreak,
          lastActivityAt: new Date(),
          gardenLevel:    newLevel,
        },
      });

      // Verifica e concede badges — não bloqueia a resposta
      setImmediate(async () => {
        try {
          const freshProgress = await prisma.progress.findUnique({ where: { childId } });
          const sessionAnswers = await prisma.quizAnswer.count({
            where: { childId, isCorrect: true,
              answeredAt: { gte: new Date(Date.now() - 20 * 60 * 1000) } },
          });
          const newBadges = await checkAndAward(
            childId,
            freshProgress,
            { trackSlug: activity.trackId, perfectQuiz: sessionAnswers === 5 }
          );
          if (newBadges.length > 0) {
            console.log('[submitAnswer] Badges ganhos:', newBadges.map(b => b.name));
          }
        } catch (badgeErr) {
          console.warn('[submitAnswer] Badge error:', badgeErr.message);
        }
        try {
          await push.notifyQuizCompleted(child.parentId, child.name, adjustedSeeds);
        } catch (pushErr) {
          console.warn('[submitAnswer] Push error:', pushErr.message);
        }
      });
    }

    return res.json({
      message:     isCorrect ? '🎉 Correto!' : '💡 Continue tentando!',
      seedsEarned: isCorrect ? adjustedSeeds : 0,
      progress:    updatedProgress,
    });
  } catch (e) {
    console.error('[submitAnswer]', e);
    return res.status(500).json({ error: 'Erro ao registrar resposta' });
  }
}

// ── GET /api/learning/progress/:childId ──────────────────────────────────────
async function getProgress(req, res) {
  try {
    const prisma    = getPrisma();
    const childId   = req.params.childId;
    const [progress, child] = await Promise.all([
      prisma.progress.findUnique({ where: { childId } }),
      prisma.childProfile.findUnique({ where: { id: childId }, select: { age: true } }),
    ]);
    if (!progress) return res.status(404).json({ error: 'Progresso não encontrado' });

    const schoolInfo = child ? getLevelByAge(child.age) : null;
    return res.json({ progress, schoolInfo });
  } catch (e) {
    console.error('[getProgress]', e);
    return res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
}

// ── GET /api/learning/levels — lista todos os níveis disponíveis ─────────────
module.exports = { getTracks, getNextActivity, submitAnswer, getProgress };
