// src/controllers/sessionController.js [corrigido]
// FIX: aceita e persiste zombiePauses no encerramento
//      FIX: getWeeklySummary retorna todayMins corretamente

const { getPrisma }      = require('../config/database');
const { generateAlerts } = require('../services/pedagogicAlerts');

// POST /api/sessions/start
async function startSession(req, res) {
  try {
    const { childId } = req.body;
    const prisma = getPrisma();

    // Encerra sessão fantasma se existir
    const open = await prisma.session.findFirst({ where: { childId, endedAt: null } });
    if (open) {
      await prisma.session.update({
        where: { id: open.id },
        data: { endedAt: new Date(), endReason: 'CHILD_EXITED' },
      });
    }

    const session = await prisma.session.create({ data: { childId } });
    return res.status(201).json({ session });
  } catch (e) {
    console.error('[startSession]', e);
    return res.status(500).json({ error: 'Erro ao iniciar sessão' });
  }
}

// POST /api/sessions/end
// FIX: persiste zombiePauses enviado pelo useSession
async function endSession(req, res) {
  try {
    const {
      sessionId,
      reason       = 'CHILD_EXITED',
      durationMins = 0,
      seedsEarned  = 0,
      zombiePauses = 0,               // FIX: recebe o valor real
    } = req.body;

    const prisma   = getPrisma();
    const session  = await prisma.session.update({
      where: { id: sessionId },
      data: {
        endedAt:      new Date(),
        durationMins,
        endReason:    reason,
        seedsEarned,
        zombiePauses,                 // FIX: salva no banco
      },
    });

    await prisma.progress.update({
      where: { childId: session.childId },
      data:  { totalMinutes: { increment: Math.ceil(durationMins) } },
    });

    return res.json({ session });
  } catch (e) {
    console.error('[endSession]', e);
    return res.status(500).json({ error: 'Erro ao encerrar sessão' });
  }
}

// GET /api/parents/summary/:childId
// FIX: calcula todayMins separadamente e inclui na resposta
async function getWeeklySummary(req, res) {
  try {
    const { childId } = req.params;
    const prisma      = getPrisma();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [sessions, answers, todaySessions, progress] = await Promise.all([
      prisma.session.findMany({
        where: { childId, startedAt: { gte: sevenDaysAgo }, endedAt: { not: null } },
        orderBy: { startedAt: 'asc' },
      }),
      prisma.quizAnswer.findMany({
        where: { childId, answeredAt: { gte: sevenDaysAgo } },
        include: { activity: { include: { track: { select: { name: true, slug: true } } } } },
      }),
      // FIX: busca sessões de hoje separadamente para calcular todayMins
      prisma.session.findMany({
        where: { childId, startedAt: { gte: todayStart }, endedAt: { not: null } },
      }),
      prisma.progress.findUnique({ where: { childId } }),
    ]);

    // FIX: todayMins somado de todas as sessões de hoje
    const todayMins = todaySessions.reduce((s, sess) => s + (sess.durationMins || 0), 0);

    const totalMins     = sessions.reduce((s, sess) => s + (sess.durationMins || 0), 0);
    const totalSeeds    = sessions.reduce((s, sess) => s + sess.seedsEarned, 0);
    const totalCorrect  = answers.filter((a) => a.isCorrect).length;
    const accuracy      = answers.length > 0 ? Math.round((totalCorrect / answers.length) * 100) : 0;

    // Agrupa por trilha
    const byTrack = {};
    for (const ans of answers) {
      const { slug, name } = ans.activity.track;
      if (!byTrack[slug]) byTrack[slug] = { name, slug, total: 0, correct: 0 };
      byTrack[slug].total++;
      if (ans.isCorrect) byTrack[slug].correct++;
    }

    // FIX: dailyActivity com chaves em pt-BR minúsculas para bater com formatChartData()
    const DAY_NAMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const dailyActivity = {};
    for (const sess of sessions) {
      const day = DAY_NAMES[new Date(sess.startedAt).getDay()];
      dailyActivity[day] = (dailyActivity[day] || 0) + (sess.durationMins || 0);
    }

    const childData = await prisma.childProfile.findUnique({
      where:  { id: childId },
      select: { name: true },
    });
    const alerts = await generateAlerts(childId, childData?.name || 'a criança').catch(() => []);

    return res.json({
      summary: {
        totalMins:      Math.round(totalMins),
        totalSeeds,
        totalSessions:  sessions.length,
        accuracy,
        todayMins:      Math.round(todayMins),          // FIX: inclui todayMins
        streakDays:     progress?.streakDays  || 0,
        gardenLevel:    progress?.gardenLevel || 1,
        lastActivityAt: progress?.lastActivityAt || null,
        byTrack:        Object.values(byTrack),
        dailyActivity,
        alerts,
      },
    });
  } catch (e) {
    console.error('[getWeeklySummary]', e);
    return res.status(500).json({ error: 'Erro ao gerar resumo semanal' });
  }
}

module.exports = { startSession, endSession, getWeeklySummary };
