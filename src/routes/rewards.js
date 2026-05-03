// src/routes/rewards.js
const express = require('express');
const router  = express.Router();
const { body, param, query } = require('express-validator');
const { authenticate, authorizeChild } = require('../middleware/auth');
const rc = require('../controllers/rewardsController');

// ── Catálogo para a criança ──────────────────────────────────────────────────
router.get(
  '/rewards/catalog/:childId',
  authenticate,
  [param('childId').isUUID()],
  authorizeChild,
  rc.getCatalog
);

// ── Gestão pelo pai ──────────────────────────────────────────────────────────
router.get('/rewards', authenticate, rc.listRewards);

router.post(
  '/rewards',
  authenticate,
  [
    body('name').trim().notEmpty().isLength({ max: 80 }),
    body('type').isIn(['REAL', 'GAME_TIME']),
    body('seedsCost').isInt({ min: 1, max: 9999 }),
    body('gameName').if(body('type').equals('GAME_TIME')).notEmpty(),
    body('gameDurationMins').if(body('type').equals('GAME_TIME')).isInt({ min: 5, max: 480 }),
    body('weeklyLimit').optional().isInt({ min: 1, max: 99 }),
    body('validUntil').optional().isISO8601(),
  ],
  rc.createReward
);

router.put(
  '/rewards/:rewardId',
  authenticate,
  [param('rewardId').isUUID()],
  rc.updateReward
);

router.delete(
  '/rewards/:rewardId',
  authenticate,
  [param('rewardId').isUUID()],
  rc.deleteReward
);

// ── Fluxo de resgate ─────────────────────────────────────────────────────────
router.post(
  '/rewards/redeem',
  authenticate,
  [
    body('rewardId').isUUID(),
    body('childId').isUUID(),
  ],
  rc.requestRedemption
);

router.patch(
  '/rewards/redemptions/:redemptionId/approve',
  authenticate,
  [param('redemptionId').isUUID()],
  rc.approveRedemption
);

router.patch(
  '/rewards/redemptions/:redemptionId/reject',
  authenticate,
  [
    param('redemptionId').isUUID(),
    body('message').optional().isString().isLength({ max: 500 }),
  ],
  rc.rejectRedemption
);

router.patch(
  '/rewards/redemptions/:redemptionId/deliver',
  authenticate,
  [param('redemptionId').isUUID()],
  rc.markDelivered
);

// ── Histórico e pendentes ────────────────────────────────────────────────────
router.get(
  '/rewards/history',
  authenticate,
  [query('childId').optional().isUUID()],
  rc.getHistory
);

router.get('/rewards/pending', authenticate, rc.getPending);

module.exports = router;
