const express = require('express');
const router = express.Router();
const {
    createLog,
    updateLog,
    getMySupervisorLogs,
    getStudentLogs,
    getCoordinatorAnalytics,
    getGroupLogs,
    getAtRiskGroups,
    deleteLog
} = require('../controllers/supervisorLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Supervisor routes
router.post('/', protect, authorize('Supervisor'), createLog);
router.put('/:id', protect, authorize('Supervisor'), updateLog);
router.delete('/:id', protect, authorize('Supervisor'), deleteLog);
router.get('/my-logs', protect, authorize('Supervisor'), getMySupervisorLogs);

// Student routes
router.get('/student/my-logs', protect, authorize('Student'), getStudentLogs);

// Coordinator routes
router.get('/coordinator/analytics', protect, authorize('Coordinator', 'Admin'), getCoordinatorAnalytics);
router.get('/coordinator/group/:groupId', protect, authorize('Coordinator', 'Admin'), getGroupLogs);
router.get('/coordinator/at-risk', protect, authorize('Coordinator', 'Admin'), getAtRiskGroups);

module.exports = router;
