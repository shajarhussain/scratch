const express = require('express');
const router = express.Router();
const { inviteEvaluator, validateAccess } = require('../controllers/externalEvaluatorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/invite', protect, authorize('Coordinator', 'Admin'), inviteEvaluator);
router.post('/validate-access', validateAccess);

module.exports = router;
