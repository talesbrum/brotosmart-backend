// src/jobs/streakWatcher.js
// Roda diariamente às 19h. Pausa chamas de crianças que não estudaram hoje.
// Com a nova lógica PRD §3.2: chama PAUSA, não apaga (grace de 2 dias).

require('dotenv').config({ path: '../../.env' });
const { getPrisma, connectDB, disconnectDB } = require('../config/database');
const { initFirebase }   = require('../config/firebase');
const push               = require('../services/pushNotifications');
const { checkStreakStatus } = require('../services/streakService');

async function run() {
  console.log('[StreakWatcher] Iniciando —', new Date().toISOString());
  await connectDB();
  initFirebase();

  const prisma = getPrisma();

  // Busca crianças com streak > 0
  const progressList = await prisma.progress.findMany({
    where:   { streakDays: { gt: 0 } },
    include: { child: { include: { parent: { select: { id: true, pushToken: true } } } } },
  });

  console.log(`[StreakWatcher] ${progressList.length} crianças com streak ativo`);

  let paused = 0, reset = 0;

  const ops = progressList.map(async (p) => {
    const { shouldPause, shouldReset } = checkStreakStatus(p);

    if (shouldReset) {
      await prisma.progress.update({
        where: { id: p.id },
        data:  { streakDays: 0, streakPausedAt: null },
      });
      reset++;
      console.log(`  ✗ Streak zerado: ${p.child.name} (${p.streakDays} dias)`);
    } else if (shouldPause) {
      await prisma.progress.update({
        where: { id: p.id },
        data:  { streakPausedAt: new Date() },
      });
      paused++;
      console.log(`  ⏸  Streak pausado: ${p.child.name} (${p.streakDays} dias)`);

      // Notifica pai: chama em risco
      if (p.child.parent?.pushToken) {
        await push.notifyStreakAtRisk(p.child.parent.id, p.child.name, p.streakDays);
      }
    }
  });

  await Promise.allSettled(ops);

  console.log(`[StreakWatcher] Concluído — ${paused} pausados, ${reset} zerados`);
  await disconnectDB();
}

run().catch((e) => { console.error('[StreakWatcher] Erro:', e); process.exit(1); });
