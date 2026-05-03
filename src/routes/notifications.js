// src/routes/notifications.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const notifController = require('../controllers/notificationController');
const gardenController = require('../controllers/gardenController');

// ── Push Tokens ───────────────────────────────────────────────────────────────
router.post(
  '/users/push-token',
  authenticate,
  [body('token').notEmpty().withMessage('Token obrigatório')],
  notifController.savePushToken
);

router.post('/notifications/test', authenticate, notifController.sendTestNotification);

// ── Jardim Virtual ────────────────────────────────────────────────────────────
router.post(
  '/learning/garden/plant',
  authenticate,
  [
    body('childId').isUUID(),
    body('slotIndex').isInt({ min: 0 }),
    body('plantId').isString().notEmpty(),
  ],
  gardenController.plantInSlot
);

router.get('/learning/garden/:childId', authenticate, gardenController.getGarden);

module.exports = router;
