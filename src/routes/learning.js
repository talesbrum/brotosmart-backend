// src/routes/learning.js
// Rotas de aprendizado, sessões e painel dos pais.
//
// AUTENTICAÇÃO:
//   authenticateAny → aceita Firebase (pai/modo compartilhado) OU deviceToken (celular da criança)
//   authenticate    → apenas Firebase (somente pais: painel, progresso detalhado)

const express = require('express');
const router  = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { authenticate, authorizeChild } = require('../middleware/auth');
const { authenticateChild }            = require('../middleware/childAuth');
const learningController = require('../controllers/learningController');
const sessionController  = require('../controllers/sessionController');
const gardenController   = require('../controllers/gardenController');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// Aceita Firebase OU deviceToken — para rotas usadas pela criança
async function authenticateAny(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao fornecido', code: 'MISSING_TOKEN' });
  }
  const token = header.split('Bearer ')[1];
  try {
    const parts  = token.split('.');
    const hdr    = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    if (hdr.alg === 'RS256') return authenticate(req, res, next);
    return authenticateChild(req, res, next);
  } catch {
    return authenticate(req, res, next);
  }
}

// ── Trilhas ──────────────────────────────────────────────────────────────────
router.get('/tracks', authenticateAny, learningController.getTracks);

// ── Atividades (crianca busca questoes) ──────────────────────────────────────
router.get('/activities', authenticateAny,
  [query('trackId').isUUID(), query('childId').isUUID()],
  validate, learningController.getNextActivity
);

// ── Resposta (crianca responde questao) ──────────────────────────────────────
router.post('/answer', authenticateAny,
  [body('childId').isUUID(), body('activityId').isUUID(), body('isCorrect').isBoolean()],
  validate, learningController.submitAnswer
);

// ── Progresso (pai consulta progresso do filho) ───────────────────────────────
router.get('/progress/:childId', authenticate,
  [param('childId').isUUID()],
  validate, authorizeChild, learningController.getProgress
);

router.get('/learning/levels', learningController.getLevels);

// ── Sessoes ───────────────────────────────────────────────────────────────────
router.post('/sessions/start', authenticateAny,
  [body('childId').isUUID()],
  validate, sessionController.startSession
);

router.post('/sessions/end', authenticateAny,
  [body('sessionId').isUUID(),
   body('durationMins').isFloat({ min: 0 }),
   body('seedsEarned').isInt({ min: 0 })],
  validate, sessionController.endSession
);

// ── Jardim ────────────────────────────────────────────────────────────────────
router.post('/learning/garden/plant', authenticateAny,
  [body('childId').isUUID(), body('slotIndex').isInt({ min: 0 }), body('plantId').isUUID()],
  validate, gardenController.plantInSlot
);

// ── Painel dos pais (somente Firebase) ───────────────────────────────────────
router.get('/parents/summary/:childId', authenticate,
  [param('childId').isUUID()],
  validate, authorizeChild, sessionController.getWeeklySummary
);

module.exports = router;
