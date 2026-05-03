// src/routes/auth.js
// Rotas de autenticação e gerenciamento de perfis

const express    = require('express');
const router     = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate, authorizeChild }  = require('../middleware/auth');
const authController = require('../controllers/authController');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// Pública
router.post('/register',
  [body('idToken').notEmpty(), body('name').trim().isLength({ min: 2, max: 100 })],
  validate, authController.register
);

// Autenticadas
router.get('/me', authenticate, authController.getMe);

router.post('/children', authenticate,
  [body('name').trim().isLength({ min: 2, max: 50 }),
   body('age').isInt({ min: 4, max: 12 }),
   body('dailyLimitMins').optional().isInt({ min: 5, max: 120 }),
   body('avatar').optional().isString()],
  validate, authController.createChildProfile
);

router.put('/children/:childId', authenticate,
  [param('childId').isUUID(),
   body('name').optional().trim().isLength({ min: 2, max: 50 }),
   body('dailyLimitMins').optional().isInt({ min: 5, max: 120 }),
   body('avatar').optional().isString()],
  validate, authorizeChild, authController.updateChildProfile
);

router.delete('/children/:childId', authenticate,
  [param('childId').isUUID()],
  validate, authorizeChild, authController.deleteChildProfile
);

// PIN parental (PRD §5.2)
router.post('/set-pin', authenticate,
  [body('pin').matches(/^\d{4}$/).withMessage('PIN deve ter 4 digitos')],
  validate, authController.setParentPin
);

router.post('/verify-pin', authenticate,
  [body('pin').matches(/^\d{4}$/).withMessage('PIN invalido')],
  validate, authController.verifyParentPin
);

// Trilhas ativas por filho (PRD §5.1)
router.patch('/children/:childId/tracks', authenticate,
  [param('childId').isUUID(),
   body('activeSlugs').isArray({ min: 1 })],
  validate, authorizeChild, authController.updateChildTracks
);

module.exports = router;
