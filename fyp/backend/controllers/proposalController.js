const Proposal = require('../models/proposalModel');
const { scanDocument } = require('../utils/plagiarismService');
const { logAction } = require('../utils/auditLogger');
const Group = require('../models/groupModel');
const User = require('../models/userModel');

// @desc    Submit a new proposal
// @route   POST /api/proposals
// @access  Private (Student)
const submitProposal = async (req, res) => {
    const { groupId, title, description, supervisorId } = req.body;

    try {
        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if supervisor exists and is a supervisor
        const supervisor = await User.findOne({ _id: supervisorId, role: 'Supervisor' });
        if (!supervisor) {
            return res.status(404).json({ message: 'Supervisor not found or invalid role' });
        }

        // Check if group already has a pending or approved proposal
        const existingProposal = await Proposal.findOne({
            group: groupId,
            status: { $in: ['Pending Supervisor', 'Pending Coordinator', 'Approved'] }
        });

        if (existingProposal) {
            // If proposal exists but is rejected or needs revision, add new version?
            // For simplicity in this demo, if it exists, we just update it and add a version.
            // But the previous check prevents "Pending" ones.
            // Let's allow re-submission if status is 'Revision Required' (not implemented yet) or just update logic.

            // Actually, let's modify the check. If it exists, we update it.
            existingProposal.title = title;
            existingProposal.description = description;
            if (req.file) {
                existingProposal.fileUrl = req.file.path;
                existingProposal.versions.push({
                    fileUrl: req.file.path,
                    versionNumber: existingProposal.versions.length + 1
                });
                // Reset plagiarism on new file
                existingProposal.plagiarismScore = 0;
                existingProposal.plagiarismStatus = 'Pending';
            }
            await existingProposal.save();

            await logAction(req.user._id, 'PROPOSAL_UPDATED', `Updated proposal: ${title}`, existingProposal._id, 'Proposal');

            return res.status(200).json(existingProposal);
        }

        const proposal = await Proposal.create({
            group: groupId,
            title,
            description,
            supervisor: supervisorId,
            fileUrl: req.file ? req.file.path : null,
            versions: req.file ? [{ fileUrl: req.file.path, versionNumber: 1 }] : []
        });

        await logAction(req.user._id, 'PROPOSAL_SUBMITTED', `Submitted proposal: ${title}`, proposal._id, 'Proposal');

        // Update group status? Maybe not yet, keep group as "Pending" until proposal approved?
        // For now, just create proposal.

        res.status(201).json(proposal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get proposals for a group
// @route   GET /api/proposals/group/:groupId
// @access  Private
const getGroupProposals = async (req, res) => {
    try {
        const proposals = await Proposal.find({ group: req.params.groupId })
            .populate('supervisor', 'name')
            .sort({ createdAt: -1 });
        res.json(proposals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Run plagiarism check
// @route   POST /api/proposals/:id/check-plagiarism
// @access  Private (Supervisor/Coordinator)
const checkPlagiarism = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        // Mock scan
        const score = await scanDocument(proposal.fileUrl);

        proposal.plagiarismScore = score;
        proposal.plagiarismStatus = score > 20 ? 'Flagged' : 'Clean';
        await proposal.save();

        res.status(200).json({
            message: 'Plagiarism check completed',
            score,
            status: proposal.plagiarismStatus
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update proposal status (Supervisor/Coordinator)
// @route   PATCH /api/proposals/:id/status
// @access  Private (Supervisor, Coordinator)
const updateProposalStatus = async (req, res) => {
    const { status, comment } = req.body; // status: 'Approved', 'Rejected', 'Changes Requested'

    try {
        const proposal = await Proposal.findById(req.params.id);

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        // REMOVED OWNERSHIP CHECK - Any Supervisor or Coordinator can update any proposal

        proposal.status = status;
        if (comment) {
            proposal.comments.push({
                user: req.user._id,
                text: comment,
                createdAt: Date.now()
            });
        }

        await proposal.save();

        await logAction(req.user._id, 'PROPOSAL_STATUS_UPDATE', `Changed status to ${status}`, proposal._id, 'Proposal');

        res.status(200).json(proposal);
    } catch (error) {
        console.error('Error updating proposal status:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all proposals
// @route   GET /api/proposals
// @access  Private (Supervisor/Coordinator/Admin)
// @desc    Archive proposal (remove from supervisor list)
// @route   PATCH /api/proposals/:id/archive
// @access  Private (Supervisor)
const archiveProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);
        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        // Only allow if status is Rejected
        if (proposal.status !== 'Rejected') {
            return res.status(400).json({ message: 'Can only archive rejected proposals' });
        }

        proposal.archivedBySupervisor = true;
        await proposal.save();

        res.json({ message: 'Proposal archived' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all proposals
// @route   GET /api/proposals
// @access  Private (Supervisor/Coordinator/Admin)
const getAllProposals = async (req, res) => {
    try {
        // Filter out archived proposals
        const query = { archivedBySupervisor: { $ne: true } };

        // If supervisor, maybe we should strictly filter? 
        // For now, general filter is fine as requested functionality is for supervisor list.

        const proposals = await Proposal.find(query)
            .populate('supervisor', 'name')
            .populate('group', 'groupName')
            .sort({ createdAt: -1 });
        res.json(proposals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitProposal, getAllProposals, getGroupProposals, checkPlagiarism, updateProposalStatus, archiveProposal };
