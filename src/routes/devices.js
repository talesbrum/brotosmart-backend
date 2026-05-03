// src/routes/devices.js
const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');
const { authenticate, authorizeChild } = require('../middleware/auth');
const { authenticateChild }            = require('../middleware/childAuth');
const dc = require('../controllers/deviceController');

// ── ROTAS DO PAI ─────────────────────────────────────────────────────────────

// Gera código de convite
router.post('/devices/invite',
  authenticate,
  [body('childId').isUUID()],
  dc.generateInvite
);

// Lista dispositivos de uma criança
router.get('/devices/:childId',
  authenticate,
  [param('childId').isUUID()],
  authorizeChild,
  dc.listDevices
);

// Encerramento remoto de sessão
router.post('/devices/lock/:childId',
  authenticate,
  [param('childId').isUUID()],
  authorizeChild,
  dc.lockChildSession
);

// Desbloquear sessão
router.post('/devices/unlock/:childId',
  authenticate,
  [param('childId').isUUID()],
  authorizeChild,
  dc.unlockChildSession
);

// Revogar dispositivo
router.delete('/devices/sessions/:sessionId',
  authenticate,
  dc.revokeDevice
);

// ── ROTA PÚBLICA — celular da criança insere o código ───────────────────────
router.post('/devices/link',
  [
    body('code').isLength({ min: 6, max: 6 }),
    body('deviceName').optional().isString().isLength({ max: 80 }),
  ],
  dc.linkDevice
);

// ── ROTAS DO CELULAR DA CRIANÇA (usa deviceToken JWT) ──────────────────────
router.get('/child/profile', authenticateChild, dc.getChildProfile);

// Todas as rotas de aprendizado também podem usar childAuth
// (o router principal monta este arquivo, então /api/child/... funciona)

module.exports = router;
