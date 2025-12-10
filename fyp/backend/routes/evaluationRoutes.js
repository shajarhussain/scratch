const express = require('express');
const router = express.Router();
const { scheduleDefense, getAllEvaluations, getGroupEvaluations, submitMarks } = require('../controllers/evaluationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Coordinator', 'Admin'), getAllEvaluations);
router.post('/schedule', protect, authorize('Coordinator'), scheduleDefense);
router.get('/group/:groupId', protect, getGroupEvaluations);
router.put('/:id/marks', protect, authorize('Supervisor', 'InternalEvaluator', 'ExternalEvaluator'), submitMarks);
router.get('/schedule/:scheduleId', protect, require('../controllers/evaluationController').getEvaluationBySchedule);

module.exports = router;
