const express = require('express');
const router = express.Router();
const { submitProposal, getAllProposals, getGroupProposals, checkPlagiarism, updateProposalStatus, archiveProposal } = require('../controllers/proposalController');
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Supervisor', 'Coordinator', 'Admin'), getAllProposals);
router.post('/', protect, authorize('Student'), upload.single('file'), submitProposal);
router.get('/group/:groupId', protect, getGroupProposals);
router.post('/:id/check-plagiarism', protect, authorize('Supervisor', 'Coordinator'), checkPlagiarism);
router.patch('/:id/status', protect, authorize('Supervisor', 'Coordinator'), updateProposalStatus);
router.patch('/:id/archive', protect, authorize('Supervisor'), archiveProposal);

module.exports = router;
