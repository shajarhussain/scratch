const express = require('express');
const router = express.Router();
const {
    getMyAssignments,
    getAssignmentDetails,
    submitEvaluation,
    getGroupProposal,
    getGroupReports,
    verifyMagicToken,
    externalLogin,
    getExternalAssignments,
    submitExternalEvaluation
} = require('../controllers/evaluatorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================== INTERNAL EVALUATOR ROUTES ====================
router.get('/assignments', protect, authorize('InternalEvaluator'), getMyAssignments);
router.get('/assignments/:id', protect, authorize('InternalEvaluator', 'ExternalEvaluator'), getAssignmentDetails);
router.post('/assignments/:id/evaluate', protect, authorize('InternalEvaluator', 'ExternalEvaluator'), submitEvaluation);
router.get('/groups/:groupId/proposal', protect, authorize('InternalEvaluator', 'ExternalEvaluator'), getGroupProposal);
router.get('/groups/:groupId/reports', protect, authorize('InternalEvaluator', 'ExternalEvaluator'), getGroupReports);

// ==================== EXTERNAL EVALUATOR ROUTES ====================
// Public routes (token-based)
router.get('/external/verify/:token', verifyMagicToken);
router.post('/external/login', externalLogin);

// Protected external routes (requires JWT from external login)
router.get('/external/assignments', protect, authorize('ExternalEvaluator'), getExternalAssignments);
router.post('/external/evaluate/:groupId', protect, authorize('ExternalEvaluator'), submitExternalEvaluation);

module.exports = router;
