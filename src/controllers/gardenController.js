// src/controllers/gardenController.js
// Jardim Virtual: plantar, colher e consultar jardim da criança

const { getPrisma } = require('../config/database');

const PLANT_COST = 20; // sementes por planta

/**
 * POST /api/learning/garden/plant
 * Planta uma planta em um slot do jardim.
 * Body: { childId, slotIndex, plantId }
 */
async function plantInSlot(req, res) {
  try {
    const { childId, slotIndex, plantId } = req.body;
    const prisma = getPrisma();

    // Busca progresso atual
    const progress = await prisma.progress.findUnique({ where: { childId } });
    if (!progress) return res.status(404).json({ error: 'Progresso não encontrado' });

    if (progress.seeds < PLANT_COST) {
      return res.status(400).json({
        error: `Sementes insuficientes. Necessário: ${PLANT_COST}, disponível: ${progress.seeds}`,
      });
    }

    // Verifica se slot está dentro do limite do nível atual
    const SLOTS_PER_LEVEL = [0, 1, 3, 6, 10, 16]; // índice = nível
    const maxSlots = SLOTS_PER_LEVEL[progress.gardenLevel] || 1;
    if (slotIndex >= maxSlots) {
      return res.status(400).json({ error: 'Slot não desbloqueado neste nível' });
    }

    // Lê jardim atual (JSON armazenado no campo gardenSlots)
    const currentSlots = progress.gardenSlots || [];

    // Remove entrada anterior deste slot se houver
    const updatedSlots = [
      ...currentSlots.filter((s) => s.slotIndex !== slotIndex),
      { slotIndex, plantId, plantedAt: new Date().toISOString() },
    ];

    // Desconta sementes e salva jardim
    const updated = await prisma.progress.update({
      where: { childId },
      data: {
        seeds: { decrement: PLANT_COST },
        gardenSlots: updatedSlots,
      },
    });

    return res.json({
      message: `🌱 Plantado com sucesso!`,
      seeds: updated.seeds,
      gardenSlots: updated.gardenSlots,
    });
  } catch (error) {
    console.error('[plantInSlot]', error);
    return res.status(500).json({ error: 'Erro ao plantar' });
  }
}

/**
 * GET /api/learning/garden/:childId
 * Retorna o estado completo do jardim.
 */
async function getGarden(req, res) {
  try {
    const { childId } = req.params;
    const prisma = getPrisma();

    const progress = await prisma.progress.findUnique({
      where: { childId },
      select: {
        seeds: true,
        gardenLevel: true,
        gardenSlots: true,
      },
    });

    if (!progress) return res.status(404).json({ error: 'Jardim não encontrado' });
    return res.json({ garden: progress });
  } catch (error) {
    console.error('[getGarden]', error);
    return res.status(500).json({ error: 'Erro ao buscar jardim' });
  }
}

module.exports = { plantInSlot, getGarden };
