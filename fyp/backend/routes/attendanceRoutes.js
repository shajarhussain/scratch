const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getMyAttendanceLogs,
    getSessionAttendance,
    gradeStudent,
    getCoordinatorInsights,
    getAbsentStudents,
    getImportantFeedback
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Student routes
router.post('/mark', protect, authorize('Student'), markAttendance);
router.get('/my-logs', protect, authorize('Student'), getMyAttendanceLogs);

// Supervisor routes
router.get('/session/:date', protect, authorize('Supervisor', 'Coordinator', 'Admin'), getSessionAttendance);
router.put('/grade/:logId', protect, authorize('Supervisor'), gradeStudent);

// Coordinator routes
router.get('/insights', protect, authorize('Coordinator', 'Admin'), getCoordinatorInsights);
router.get('/absent', protect, authorize('Coordinator', 'Admin'), getAbsentStudents);
router.get('/important-feedback', protect, authorize('Coordinator', 'Admin'), getImportantFeedback);

module.exports = router;
