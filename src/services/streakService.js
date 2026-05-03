// src/services/streakService.js
// Lógica da Chama do Saber (PRD §3.2):
//   - Acerto no dia → incrementa streak
//   - Sem acerto no dia → chama PAUSA (não apaga)
//   - Quando a criança volta → retoma de onde parou
//   - A chama só zera se ficar pausada por mais de GRACE_DAYS dias

const GRACE_DAYS = 2; // quantos dias pausada antes de zerar (configurável)

/**
 * Calcula o novo estado do streak após uma resposta correta.
 *
 * @param {{ streakDays: number, lastActivityAt: Date|null, streakPausedAt: Date|null }} progress
 * @returns {{ streakDays: number, streakPausedAt: null, lastActivityAt: Date, streakStatus: string }}
 */
function calculateStreakUpdate(progress) {
  const now      = new Date();
  const today    = now.toDateString();
  const lastDay  = progress.lastActivityAt
    ? new Date(progress.lastActivityAt).toDateString()
    : null;

  // Já estudou hoje — mantém streak, apenas atualiza horário
  if (lastDay === today) {
    return {
      streakDays:     progress.streakDays,
      streakPausedAt: null,          // retoma da pausa se estava pausada
      lastActivityAt: now,
      streakStatus:   'active',
    };
  }

  // Estava pausada — verifica se passou da grace period
  if (progress.streakPausedAt) {
    const pausedDays = Math.floor(
      (now - new Date(progress.streakPausedAt)) / (1000 * 60 * 60 * 24)
    );

    if (pausedDays > GRACE_DAYS) {
      // Passou da grace period → zera e começa novo streak
      return {
        streakDays:     1,
        streakPausedAt: null,
        lastActivityAt: now,
        streakStatus:   'reset',
      };
    }

    // Dentro da grace period → retoma o streak pausado!
    return {
      streakDays:     progress.streakDays + 1,
      streakPausedAt: null,
      lastActivityAt: now,
      streakStatus:   'resumed',
    };
  }

  // Primeiro acerto do dia (sem pausa ativa) → incrementa normalmente
  return {
    streakDays:     (progress.streakDays || 0) + 1,
    streakPausedAt: null,
    lastActivityAt: now,
    streakStatus:   'incremented',
  };
}

/**
 * Verifica se uma criança ficou um dia sem estudar e deve ter a chama pausada.
 * Chamado pelo job noturno (streakWatcher.js).
 *
 * @param {{ streakDays: number, lastActivityAt: Date|null, streakPausedAt: Date|null }} progress
 * @returns {{ shouldPause: boolean, shouldReset: boolean }}
 */
function checkStreakStatus(progress) {
  if (!progress.lastActivityAt) return { shouldPause: false, shouldReset: false };

  const now        = new Date();
  const lastDay    = new Date(progress.lastActivityAt).toDateString();
  const today      = now.toDateString();
  const yesterday  = new Date(now - 86400000).toDateString();

  // Estudou hoje ou ontem → não precisa pausar
  if (lastDay === today || lastDay === yesterday) {
    return { shouldPause: false, shouldReset: false };
  }

  // Já estava pausada → verifica se passa da grace period
  if (progress.streakPausedAt) {
    const pausedDays = Math.floor(
      (now - new Date(progress.streakPausedAt)) / (1000 * 60 * 60 * 24)
    );
    return {
      shouldPause: false,
      shouldReset: pausedDays > GRACE_DAYS,
    };
  }

  // Não estudou ontem e não estava pausada → pausar agora
  return { shouldPause: true, shouldReset: false };
}

module.exports = { calculateStreakUpdate, checkStreakStatus, GRACE_DAYS };
