// src/controllers/rewardsController.js
// Sistema de Premiações (PRD v2 §4) — fluxo completo em 7 etapas:
// 1. Catálogo → 2. Pedido → 3. Confirmação → 4. Notificação
// 5. Aprovação/Recusa → 6. Desconto de sementes → 7. Celebração

const { getPrisma }  = require('../config/database');
const push           = require('../services/pushNotifications');

// ── GESTÃO DE PREMIAÇÕES (PAIS) ──────────────────────────────────────────────

/**
 * GET /api/rewards
 * Lista premiações ativas cadastradas pelo pai autenticado.
 */
async function listRewards(req, res) {
  try {
    const prisma = getPrisma();
    const rewards = await prisma.reward.findMany({
      where:   { parentId: req.user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            redemptions: { where: { status: 'PENDING' } },
          },
        },
      },
    });

    return res.json({ rewards });
  } catch (e) {
    console.error('[listRewards]', e);
    return res.status(500).json({ error: 'Erro ao listar premiações' });
  }
}

/**
 * POST /api/rewards
 * Cria uma nova premiação no catálogo do pai.
 * Body: { name, type, seedsCost, description?, gameName?, gameDurationMins?,
 *         validUntil?, weeklyLimit? }
 */
async function createReward(req, res) {
  try {
    const {
      name, type, seedsCost, description,
      gameName, gameDurationMins, validUntil, weeklyLimit,
    } = req.body;

    if (type === 'GAME_TIME' && (!gameName || !gameDurationMins)) {
      return res.status(400).json({
        error: 'Premiações de tempo de jogo precisam de nome do jogo e duração',
      });
    }

    const prisma  = getPrisma();
    const reward  = await prisma.reward.create({
      data: {
        parentId:        req.user.id,
        name:            name.trim(),
        type,
        seedsCost:       parseInt(seedsCost),
        description:     description?.trim(),
        gameName:        gameName?.trim(),
        gameDurationMins: gameDurationMins ? parseInt(gameDurationMins) : null,
        validUntil:      validUntil ? new Date(validUntil) : null,
        weeklyLimit:     weeklyLimit ? parseInt(weeklyLimit) : null,
      },
    });

    return res.status(201).json({
      message: `Premiação "${reward.name}" criada com sucesso! 🎁`,
      reward,
    });
  } catch (e) {
    console.error('[createReward]', e);
    return res.status(500).json({ error: 'Erro ao criar premiação' });
  }
}

/**
 * PUT /api/rewards/:rewardId
 * Edita uma premiação existente.
 */
async function updateReward(req, res) {
  try {
    const { rewardId } = req.params;
    const prisma = getPrisma();

    // Verifica se pertence ao pai autenticado
    const existing = await prisma.reward.findFirst({
      where: { id: rewardId, parentId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Premiação não encontrada' });

    const allowed = ['name', 'seedsCost', 'description', 'weeklyLimit', 'validUntil', 'isActive'];
    const data    = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f]; });

    const reward = await prisma.reward.update({ where: { id: rewardId }, data });
    return res.json({ message: 'Premiação atualizada!', reward });
  } catch (e) {
    console.error('[updateReward]', e);
    return res.status(500).json({ error: 'Erro ao atualizar premiação' });
  }
}

/**
 * DELETE /api/rewards/:rewardId
 * Desativa (soft delete) uma premiação.
 */
async function deleteReward(req, res) {
  try {
    const { rewardId } = req.params;
    const prisma = getPrisma();

    const existing = await prisma.reward.findFirst({
      where: { id: rewardId, parentId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Premiação não encontrada' });

    await prisma.reward.update({
      where: { id: rewardId },
      data:  { isActive: false },
    });

    return res.json({ message: 'Premiação removida do catálogo' });
  } catch (e) {
    console.error('[deleteReward]', e);
    return res.status(500).json({ error: 'Erro ao remover premiação' });
  }
}

// ── CATÁLOGO PARA A CRIANÇA ──────────────────────────────────────────────────

/**
 * GET /api/rewards/catalog/:childId
 * Retorna premiações disponíveis para a criança (do pai desta criança).
 * Filtra por: ativas, dentro do prazo e abaixo do limite semanal.
 */
async function getCatalog(req, res) {
  try {
    const { childId } = req.params;
    const prisma      = getPrisma();

    // Busca o pai da criança
    const child = await prisma.childProfile.findUnique({
      where:  { id: childId },
      select: { parentId: true },
    });
    if (!child) return res.status(404).json({ error: 'Criança não encontrada' });

    const now = new Date();

    // Premiações ativas e dentro do prazo
    const rewards = await prisma.reward.findMany({
      where: {
        parentId:   child.parentId,
        isActive:   true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      orderBy: { seedsCost: 'asc' },
    });

    // Verifica limite semanal para cada premiação
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const enriched = await Promise.all(rewards.map(async (r) => {
      if (!r.weeklyLimit) return { ...r, weeklyUsed: 0, canRedeem: true };

      const weeklyUsed = await prisma.redemption.count({
        where: {
          rewardId:    r.id,
          childId,
          status:      { in: ['APPROVED', 'DELIVERED'] },
          requestedAt: { gte: weekStart },
        },
      });

      return {
        ...r,
        weeklyUsed,
        canRedeem: weeklyUsed < r.weeklyLimit,
      };
    }));

    // Saldo de sementes da criança
    const progress = await prisma.progress.findUnique({
      where:  { childId },
      select: { seeds: true },
    });

    return res.json({
      rewards:     enriched,
      childSeeds:  progress?.seeds || 0,
    });
  } catch (e) {
    console.error('[getCatalog]', e);
    return res.status(500).json({ error: 'Erro ao buscar catálogo' });
  }
}

// ── FLUXO DE RESGATE ─────────────────────────────────────────────────────────

/**
 * POST /api/rewards/redeem
 * Etapas 2–4: criança faz o pedido → sistema notifica o pai.
 * Body: { rewardId, childId }
 */
async function requestRedemption(req, res) {
  try {
    const { rewardId, childId } = req.body;
    const prisma = getPrisma();

    // Busca premiação e valida
    const reward = await prisma.reward.findFirst({
      where: { id: rewardId, isActive: true },
    });
    if (!reward) return res.status(404).json({ error: 'Premiação não encontrada' });

    // Valida prazo
    if (reward.validUntil && new Date() > reward.validUntil) {
      return res.status(400).json({ error: 'Esta premiação expirou' });
    }

    // Valida limite semanal
    if (reward.weeklyLimit) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weeklyUsed = await prisma.redemption.count({
        where: {
          rewardId,
          childId,
          status:      { in: ['APPROVED', 'DELIVERED'] },
          requestedAt: { gte: weekStart },
        },
      });
      if (weeklyUsed >= reward.weeklyLimit) {
        return res.status(400).json({ error: 'Limite semanal desta premiação atingido' });
      }
    }

    // Valida sementes suficientes
    const progress = await prisma.progress.findUnique({ where: { childId } });
    if (!progress || progress.seeds < reward.seedsCost) {
      return res.status(400).json({
        error:        'Sementes insuficientes',
        seedsNeeded:  reward.seedsCost,
        seedsHave:    progress?.seeds || 0,
      });
    }

    // Cria o pedido (PENDING — sem descontar sementes ainda)
    const redemption = await prisma.redemption.create({
      data: {
        rewardId,
        childId,
        seedsSpent: reward.seedsCost,
        status:     'PENDING',
      },
      include: { reward: true, child: { select: { name: true, parentId: true } } },
    });

    // Etapa 4: Push notification para o pai
    setImmediate(async () => {
      try {
        const label = reward.type === 'GAME_TIME'
          ? `${reward.gameDurationMins} min de ${reward.gameName}`
          : reward.name;

        await push.sendToUser(redemption.child.parentId, {
          title: `${redemption.child.name} quer uma premiação! 🎁`,
          body:  `"${label}" · Custa ${reward.seedsCost} sementes. Toque para aprovar.`,
          data:  { type: 'reward_request', redemptionId: redemption.id },
        });
      } catch (pushErr) {
        console.warn('[requestRedemption] Push error:', pushErr.message);
      }
    });

    return res.status(201).json({
      message:    '🎁 Pedido enviado! Aguardando aprovação dos pais.',
      redemption: { id: redemption.id, status: 'PENDING', reward: redemption.reward },
    });
  } catch (e) {
    console.error('[requestRedemption]', e);
    return res.status(500).json({ error: 'Erro ao solicitar premiação' });
  }
}

/**
 * PATCH /api/rewards/redemptions/:redemptionId/approve
 * Etapas 5–7: pai aprova → sementes descontadas → celebração na criança.
 * Body: {}
 */
async function approveRedemption(req, res) {
  try {
    const { redemptionId } = req.params;
    const prisma = getPrisma();

    const redemption = await prisma.redemption.findUnique({
      where:   { id: redemptionId },
      include: {
        reward: true,
        child:  { select: { name: true, parentId: true } },
      },
    });

    if (!redemption) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (redemption.child.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para aprovar este pedido' });
    }
    if (redemption.status !== 'PENDING') {
      return res.status(400).json({ error: `Pedido já foi ${redemption.status === 'APPROVED' ? 'aprovado' : 'resolvido'}` });
    }

    // Valida que a criança ainda tem sementes (pode ter mudado)
    const progress = await prisma.progress.findUnique({
      where: { childId: redemption.childId },
    });
    if (!progress || progress.seeds < redemption.seedsSpent) {
      return res.status(400).json({ error: 'A criança não tem sementes suficientes' });
    }

    // Etapa 6: Desconta sementes e atualiza status atomicamente
    const [updatedRedemption] = await prisma.$transaction([
      prisma.redemption.update({
        where: { id: redemptionId },
        data:  { status: 'APPROVED', resolvedAt: new Date() },
      }),
      prisma.progress.update({
        where: { childId: redemption.childId },
        data:  { seeds: { decrement: redemption.seedsSpent } },
      }),
    ]);

    // Push para a criança: celebração (etapa 7)
    setImmediate(async () => {
      try {
        const label = redemption.reward.type === 'GAME_TIME'
          ? `${redemption.reward.gameDurationMins} min de ${redemption.reward.gameName}`
          : redemption.reward.name;

        await push.sendToUser(redemption.child.parentId, {
          title: `🎉 ${redemption.child.name}, aprovado!`,
          body:  `Sua premiação "${label}" foi aprovada! Vai comemorar?`,
          data:  { type: 'reward_approved', redemptionId },
        });
      } catch (e) {
        console.warn('[approveRedemption] Push error:', e.message);
      }
    });

    return res.json({
      message:     `Premiação aprovada! ${redemption.seedsSpent} sementes descontadas. 🎉`,
      redemption:  updatedRedemption,
    });
  } catch (e) {
    console.error('[approveRedemption]', e);
    return res.status(500).json({ error: 'Erro ao aprovar premiação' });
  }
}

/**
 * PATCH /api/rewards/redemptions/:redemptionId/reject
 * Etapa 5b: pai recusa com mensagem (recusa com carinho).
 * Body: { message? }
 */
async function rejectRedemption(req, res) {
  try {
    const { redemptionId } = req.params;
    const { message }      = req.body;
    const prisma           = getPrisma();

    const redemption = await prisma.redemption.findUnique({
      where:   { id: redemptionId },
      include: { child: { select: { name: true, parentId: true } } },
    });

    if (!redemption) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (redemption.child.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    if (redemption.status !== 'PENDING') {
      return res.status(400).json({ error: 'Pedido não está mais pendente' });
    }

    // Sementes NÃO são descontadas na recusa (conforme PRD §4.5)
    const updated = await prisma.redemption.update({
      where: { id: redemptionId },
      data: {
        status:        'REJECTED',
        parentMessage: message?.trim() || null,
        resolvedAt:    new Date(),
      },
    });

    return res.json({
      message:    'Pedido recusado. As sementes não foram descontadas.',
      redemption: updated,
    });
  } catch (e) {
    console.error('[rejectRedemption]', e);
    return res.status(500).json({ error: 'Erro ao recusar premiação' });
  }
}

/**
 * PATCH /api/rewards/redemptions/:redemptionId/deliver
 * Pai confirma que entregou a premiação (APPROVED → DELIVERED).
 */
async function markDelivered(req, res) {
  try {
    const { redemptionId } = req.params;
    const prisma = getPrisma();

    const redemption = await prisma.redemption.findUnique({
      where:   { id: redemptionId },
      include: { child: { select: { parentId: true } } },
    });

    if (!redemption) return res.status(404).json({ error: 'Pedido não encontrado' });
    if (redemption.child.parentId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    if (redemption.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Apenas pedidos aprovados podem ser marcados como entregues' });
    }

    const updated = await prisma.redemption.update({
      where: { id: redemptionId },
      data:  { status: 'DELIVERED' },
    });

    return res.json({ message: 'Premiação marcada como entregue! ✅', redemption: updated });
  } catch (e) {
    console.error('[markDelivered]', e);
    return res.status(500).json({ error: 'Erro ao confirmar entrega' });
  }
}

// ── HISTÓRICO ────────────────────────────────────────────────────────────────

/**
 * GET /api/rewards/history
 * Histórico completo de resgates para o painel dos pais (PRD §4.6).
 * Query: ?childId= (opcional)
 */
async function getHistory(req, res) {
  try {
    const { childId } = req.query;
    const prisma      = getPrisma();

    // Busca IDs dos filhos deste pai
    const children = await prisma.childProfile.findMany({
      where:  { parentId: req.user.id },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);

    const history = await prisma.redemption.findMany({
      where: {
        childId: childId
          ? { equals: childId }
          : { in: childIds },
      },
      orderBy: { requestedAt: 'desc' },
      include: {
        reward: { select: { name: true, type: true, gameName: true, gameDurationMins: true } },
        child:  { select: { name: true, avatar: true } },
      },
    });

    return res.json({ history });
  } catch (e) {
    console.error('[getHistory]', e);
    return res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
}

/**
 * GET /api/rewards/pending
 * Lista pedidos PENDING para o pai ver e agir rapidamente.
 */
async function getPending(req, res) {
  try {
    const prisma   = getPrisma();
    const children = await prisma.childProfile.findMany({
      where:  { parentId: req.user.id },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);

    const pending = await prisma.redemption.findMany({
      where:   { childId: { in: childIds }, status: 'PENDING' },
      orderBy: { requestedAt: 'desc' },
      include: {
        reward: true,
        child:  { select: { name: true, avatar: true } },
      },
    });

    return res.json({ pending, count: pending.length });
  } catch (e) {
    console.error('[getPending]', e);
    return res.status(500).json({ error: 'Erro ao buscar pedidos pendentes' });
  }
}

module.exports = {
  listRewards, createReward, updateReward, deleteReward,
  getCatalog,
  requestRedemption, approveRedemption, rejectRedemption, markDelivered,
  getHistory, getPending,
};
