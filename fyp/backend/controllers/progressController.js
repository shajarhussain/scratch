const Progress = require('../models/progressModel');
const Group = require('../models/groupModel');

// @desc    Submit weekly progress log
// @route   POST /api/progress
// @access  Private (Student)
const submitProgressLog = async (req, res) => {
    const { weekNumber, weekStartDate, tasksCompleted, nextWeekTasks, challenges, hoursSpent } = req.body;

    try {
        // Find the student's group
        const group = await Group.findOne({ members: req.user._id });

        if (!group) {
            return res.status(404).json({ message: 'You are not part of any group' });
        }

        // Check if log already exists for this week
        const existingLog = await Progress.findOne({
            group: group._id,
            weekNumber,
            submittedBy: req.user._id
        });

        if (existingLog) {
            return res.status(400).json({ message: `Log for week ${weekNumber} already submitted` });
        }

        const progressLog = await Progress.create({
            group: group._id,
            submittedBy: req.user._id,
            weekNumber,
            weekStartDate,
            tasksCompleted,
            nextWeekTasks,
            challenges,
            hoursSpent
        });

        const populatedLog = await Progress.findById(progressLog._id)
            .populate('submittedBy', 'name studentId')
            .populate('group', 'members');

        res.status(201).json(populatedLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my group's progress logs
// @route   GET /api/progress/my-group
// @access  Private (Student)
const getMyGroupLogs = async (req, res) => {
    try {
        // Find the student's group
        const group = await Group.findOne({ members: req.user._id });

        if (!group) {
            return res.status(404).json({ message: 'You are not part of any group' });
        }

        const logs = await Progress.find({ group: group._id })
            .populate('submittedBy', 'name studentId')
            .sort({ weekNumber: -1, createdAt: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get progress logs from all supervised groups
// @route   GET /api/progress/supervisor/groups  
// @access  Private (Supervisor)
const getSupervisorGroupsLogs = async (req, res) => {
    try {
        // Find all groups where this user is the supervisor
        const groups = await Group.find({
            supervisorRequest: req.user._id,
            supervisorApprovalStatus: 'Approved'
        });

        const groupIds = groups.map(g => g._id);

        const logs = await Progress.find({ group: { $in: groupIds } })
            .populate('submittedBy', 'name studentId')
            .populate('group', 'members')
            .sort({ createdAt: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add supervisor feedback to progress log
// @route   PATCH /api/progress/:id/feedback
// @access  Private (Supervisor)
const addFeedback = async (req, res) => {
    const { feedback } = req.body;

    try {
        const log = await Progress.findById(req.params.id).populate('group');

        if (!log) {
            return res.status(404).json({ message: 'Progress log not found' });
        }

        // Verify this supervisor is assigned to this group
        if (log.group.supervisorRequest.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only provide feedback to your assigned groups' });
        }

        log.supervisorFeedback = feedback;
        log.status = 'Reviewed';
        await log.save();

        const populatedLog = await Progress.findById(log._id)
            .populate('submittedBy', 'name studentId')
            .populate('group', 'members');

        res.json({ message: 'Feedback added successfully', log: populatedLog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all progress logs (Coordinator view)
// @route   GET /api/progress/coordinator/all
// @access  Private (Coordinator, Admin)
const getCoordinatorAllLogs = async (req, res) => {
    try {
        const logs = await Progress.find({})
            .populate('submittedBy', 'name studentId')
            .populate('group', 'members')
            .sort({ createdAt: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get progress logs for a specific group
// @route   GET /api/progress/group/:groupId
// @access  Private (Coordinator, Supervisor, Admin)
const getGroupLogs = async (req, res) => {
    try {
        const logs = await Progress.find({ group: req.params.groupId })
            .populate('submittedBy', 'name studentId')
            .populate('group', 'members')
            .sort({ weekNumber: -1, createdAt: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitProgressLog,
    getMyGroupLogs,
    getSupervisorGroupsLogs,
    addFeedback,
    getCoordinatorAllLogs,
    getGroupLogs
};
