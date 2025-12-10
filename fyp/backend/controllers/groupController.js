const Group = require('../models/groupModel');
const User = require('../models/userModel');

// @desc    Verify student eligibility
// @route   POST /api/groups/verify-member
// @access  Private (Student)
const verifyMember = async (req, res) => {
    const { studentId } = req.body;

    try {
        const user = await User.findOne({ studentId, role: 'Student' });

        if (!user) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if already in a group
        const existingGroup = await Group.findOne({ members: user._id });
        if (existingGroup) {
            return res.status(400).json({ message: 'Student is already in a group' });
        }

        res.status(200).json({
            message: 'Student is eligible',
            user: { _id: user._id, name: user.name, studentId: user.studentId }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify supervisor by registration ID
// @route   POST /api/groups/verify-supervisor
// @access  Private (Student)
const verifySupervisor = async (req, res) => {
    const { registrationId } = req.body;

    try {
        // FIX: Use registrationNumber (correct field name in User model)
        const supervisor = await User.findOne({ registrationNumber: registrationId, role: 'Supervisor' });

        if (!supervisor) {
            return res.status(404).json({ message: 'Supervisor not found with this registration ID' });
        }

        res.status(200).json({
            message: 'Supervisor verified',
            supervisor: { _id: supervisor._id, name: supervisor.name, registrationNumber: supervisor.registrationNumber }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private (Student)
const createGroup = async (req, res) => {
    const { memberIds, supervisorId } = req.body;

    if (!memberIds || memberIds.length < 1 || memberIds.length > 3) {
        return res.status(400).json({ message: 'Group must have 1-3 members' });
    }

    if (!supervisorId) {
        return res.status(400).json({ message: 'Supervisor is required' });
    }

    try {
        // Verify all members again
        for (const id of memberIds) {
            const existingGroup = await Group.findOne({ members: id });
            if (existingGroup) {
                return res.status(400).json({ message: `User ${id} is already in a group` });
            }
        }

        const group = await Group.create({
            members: memberIds,
            leader: memberIds[0],
            supervisorRequest: supervisorId,
            supervisorApprovalStatus: 'Pending'
        });

        const populatedGroup = await Group.findById(group._id)
            .populate('members', 'name studentId')
            .populate('supervisorRequest', 'name registrationId');

        res.status(201).json(populatedGroup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private (Coordinator, Admin, Supervisor)
const getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find({})
            .populate('members', 'name studentId email')
            .populate('leader', 'name email studentId')
            .populate('supervisorRequest', 'name registrationId')
            .populate('proposal', 'title')
            .sort({ createdAt: -1 });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or reject supervisor assignment
// @route   PATCH /api/groups/:id/supervisor-approval
// @access  Private (Supervisor)
const approveSupervisorAssignment = async (req, res) => {
    const { status, rejectionReason } = req.body;

    try {
        const group = await Group.findById(req.params.id)
            .populate('members', 'name studentId')
            .populate('supervisorRequest', 'name');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Verify this supervisor is the one requested
        if (group.supervisorRequest._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only approve groups that requested you' });
        }

        group.supervisorApprovalStatus = status;
        if (status === 'Rejected' && rejectionReason) {
            group.rejectionReason = rejectionReason;
        }

        await group.save();
        res.json({ message: `Group ${status.toLowerCase()} successfully`, group });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get groups requesting this supervisor
// @route   GET /api/groups/supervisor/requests
// @access  Private (Supervisor)
const getMyGroupRequests = async (req, res) => {
    try {
        const groups = await Group.find({
            supervisorRequest: req.user._id
        })
            .populate('members', 'name studentId email')
            .populate('supervisorRequest', 'name registrationId')
            .sort({ createdAt: -1 });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's own group
// @route   GET /api/groups/my-group
// @access  Private (Student)
const getMyGroup = async (req, res) => {
    try {
        const group = await Group.findOne({ members: req.user._id })
            .populate('members', 'name studentId email')
            .populate('leader', 'name email')
            .populate('supervisorRequest', 'name registrationNumber'); // Updated to registrationNumber based on prior fix

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Proposal = require('../models/proposalModel');

// @desc    Get dashboard stats for supervisor
// @route   GET /api/groups/supervisor/stats
// @access  Private (Supervisor)
const getSupervisorStats = async (req, res) => {
    try {
        const myGroupsCount = await Group.countDocuments({
            supervisorRequest: req.user._id,
            supervisorApprovalStatus: 'Approved'
        });

        // Use regex for case-insensitive 'pending' check or specific enum
        const pendingProposalsCount = await Proposal.countDocuments({
            supervisor: req.user._id,
            status: { $regex: 'Pending', $options: 'i' }
        });

        res.json({
            myGroupsCount,
            pendingProposalsCount,
            completedEvalsCount: 0 // Placeholder or implement real count later
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    verifyMember,
    verifySupervisor,
    createGroup,
    getAllGroups,
    approveSupervisorAssignment,
    getMyGroupRequests,
    getMyGroup,
    getSupervisorStats
};
