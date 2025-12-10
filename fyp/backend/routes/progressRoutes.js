const express = require('express');
const router = express.Router();
const { submitProgressLog, getMyGroupLogs, getSupervisorGroupsLogs, addFeedback, getCoordinatorAllLogs, getGroupLogs } = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('Student'), submitProgressLog);
router.get('/my-group', protect, authorize('Student'), getMyGroupLogs);
router.get('/supervisor/groups', protect, authorize('Supervisor'), getSupervisorGroupsLogs);
router.get('/coordinator/all', protect, authorize('Coordinator', 'Admin'), getCoordinatorAllLogs);
router.get('/group/:groupId', protect, authorize('Coordinator', 'Supervisor', 'Admin'), getGroupLogs);
router.patch('/:id/feedback', protect, authorize('Supervisor'), addFeedback);

module.exports = router;
