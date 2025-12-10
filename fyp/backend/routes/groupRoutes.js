const express = require('express');
const router = express.Router();
const { verifyMember, verifySupervisor, createGroup, getAllGroups, approveSupervisorAssignment, getMyGroupRequests, getMyGroup, getSupervisorStats } = require('../controllers/groupController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Coordinator', 'Admin', 'Supervisor'), getAllGroups);
router.post('/verify-member', protect, authorize('Student'), verifyMember);
router.post('/verify-supervisor', protect, authorize('Student'), verifySupervisor);
router.get('/supervisor/requests', protect, authorize('Supervisor'), getMyGroupRequests);
router.get('/supervisor/stats', protect, authorize('Supervisor'), getSupervisorStats);
router.get('/my-group', protect, authorize('Student'), getMyGroup);
router.post('/', protect, authorize('Student'), createGroup);
router.patch('/:id/supervisor-approval', protect, authorize('Supervisor'), approveSupervisorAssignment);

module.exports = router;
