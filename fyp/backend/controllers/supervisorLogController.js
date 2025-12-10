const SupervisorLog = require('../models/supervisorLogModel');
const Group = require('../models/groupModel');

// @desc    Create new supervisor log
// @route   POST /api/supervisor-logs
// @access  Private (Supervisor)
const createLog = async (req, res) => {
    try {
        const {
            groupId, studentId, logNumber, meetingDate, meetingType,
            attendanceStatus, absenceReason, workReviewed, progressStatus,
            qualityAssessment, strengthsObserved, issuesIdentified,
            correctionsRequired, suggestionsGuidance, internalRemarks,
            utilizationFlag, performanceIndicators, tasksAssigned,
            expectedDeliverables, nextReviewDeadline, logStatus, warningDetails
        } = req.body;

        // Get group to retrieve groupCode
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const log = await SupervisorLog.create({
            group: groupId,
            groupCode: group.groupCode,
            student: studentId || null,
            logNumber,
            meetingDate,
            meetingType,
            attendanceStatus,
            absenceReason,
            workReviewed,
            progressStatus,
            qualityAssessment,
            strengthsObserved,
            issuesIdentified,
            correctionsRequired,
            suggestionsGuidance,
            internalRemarks,
            utilizationFlag,
            performanceIndicators,
            tasksAssigned,
            expectedDeliverables,
            nextReviewDeadline,
            logStatus,
            warningDetails,
            supervisor: req.user._id
        });

        const populatedLog = await SupervisorLog.findById(log._id)
            .populate('group', 'groupCode members')
            .populate('student', 'name studentId')
            .populate('supervisor', 'name');

        res.status(201).json(populatedLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update supervisor log
// @route   PUT /api/supervisor-logs/:id
// @access  Private (Supervisor)
const updateLog = async (req, res) => {
    try {
        const log = await SupervisorLog.findById(req.params.id);

        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        // Verify ownership
        if (log.supervisor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this log' });
        }

        // Track changes for audit
        const changedFields = Object.keys(req.body).filter(key =>
            log[key] !== req.body[key]
        );

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                log[key] = req.body[key];
            }
        });

        // Add to edit history
        log.editHistory.push({
            editedAt: new Date(),
            editedBy: req.user._id,
            changes: `Updated: ${changedFields.join(', ')}`
        });

        await log.save();

        const populatedLog = await SupervisorLog.findById(log._id)
            .populate('group', 'groupCode members')
            .populate('student', 'name studentId')
            .populate('supervisor', 'name');

        res.json(populatedLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get supervisor's own logs
// @route   GET /api/supervisor-logs/my-logs
// @access  Private (Supervisor)
const getMySupervisorLogs = async (req, res) => {
    try {
        const logs = await SupervisorLog.find({
            supervisor: req.user._id,
            isDeleted: false
        })
            .populate('group', 'groupCode members')
            .populate('student', 'name studentId')
            .sort({ meetingDate: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's logs (filtered view)
// @route   GET /api/supervisor-logs/student/my-logs
// @access  Private (Student)
const getStudentLogs = async (req, res) => {
    try {
        // Find student's group
        const group = await Group.findOne({ members: req.user._id });

        if (!group) {
            return res.status(404).json({ message: 'You are not part of any group' });
        }

        // Get logs for this student or group logs
        const logs = await SupervisorLog.find({
            group: group._id,
            $or: [
                { student: req.user._id },
                { student: null } // Group logs
            ],
            isDeleted: false
        })
            .populate('supervisor', 'name')
            .sort({ meetingDate: -1 });

        // Filter to only student-visible fields
        const visibleFields = SupervisorLog.getStudentVisibleFields();
        const filteredLogs = logs.map(log => {
            const filtered = {};
            visibleFields.forEach(field => {
                filtered[field] = log[field];
            });
            filtered._id = log._id;
            filtered.supervisor = log.supervisor;
            return filtered;
        });

        res.json(filteredLogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get coordinator analytics
// @route   GET /api/supervisor-logs/coordinator/analytics
// @access  Private (Coordinator, Admin)
const getCoordinatorAnalytics = async (req, res) => {
    try {
        // Get all groups
        const groups = await Group.find({}).populate('members', 'name studentId');

        // Get all logs
        let allLogs = await SupervisorLog.find({ isDeleted: false })
            .populate('group', 'groupCode')
            .populate('supervisor', 'name');

        // Filter out orphaned logs from deleted groups
        allLogs = allLogs.filter(log => log.group && log.supervisor);

        // Calculate statistics
        const totalGroups = groups.length;
        const logsThisWeek = allLogs.filter(log => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(log.meetingDate) >= weekAgo;
        }).length;

        const warningsIssued = allLogs.filter(log => log.logStatus === 'Warning Issued').length;

        // Group progress distribution
        const progressCounts = {
            'On Track': allLogs.filter(log => log.progressStatus === 'On Track').length,
            'Slightly Delayed': allLogs.filter(log => log.progressStatus === 'Slightly Delayed').length,
            'Seriously Delayed': allLogs.filter(log => log.progressStatus === 'Seriously Delayed').length
        };

        // At-risk groups (with warnings or seriously delayed)
        const atRiskGroups = [];
        const groupLogCounts = {};

        groups.forEach(group => {
            const groupLogs = allLogs.filter(log => log.group._id.toString() === group._id.toString());
            const latestLog = groupLogs[0];
            const warningCount = groupLogs.filter(log => log.logStatus === 'Warning Issued').length;

            groupLogCounts[group._id] = groupLogs.length;

            if (latestLog && (
                latestLog.progressStatus === 'Seriously Delayed' ||
                latestLog.logStatus === 'Warning Issued' ||
                warningCount >= 2
            )) {
                atRiskGroups.push({
                    groupCode: group.groupCode,
                    groupId: group._id,
                    lastLogDate: latestLog.meetingDate,
                    progressStatus: latestLog.progressStatus,
                    warningCount,
                    supervisor: latestLog.supervisor
                });
            }
        });

        // Supervisor compliance
        const supervisors = {};
        allLogs.forEach(log => {
            const supId = log.supervisor._id.toString();
            if (!supervisors[supId]) {
                supervisors[supId] = {
                    name: log.supervisor.name,
                    totalLogs: 0,
                    groupsSupervised: new Set()
                };
            }
            supervisors[supId].totalLogs++;
            supervisors[supId].groupsSupervised.add(log.group._id.toString());
        });

        const supervisorCompliance = Object.keys(supervisors).map(supId => ({
            name: supervisors[supId].name,
            totalLogs: supervisors[supId].totalLogs,
            groupCount: supervisors[supId].groupsSupervised.size
        }));

        res.json({
            overview: {
                totalGroups,
                logsThisWeek,
                warningsIssued,
                atRiskCount: atRiskGroups.length
            },
            progressDistribution: progressCounts,
            atRiskGroups,
            supervisorCompliance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get group logs (coordinator read-only)
// @route   GET /api/supervisor-logs/coordinator/group/:groupId
// @access  Private (Coordinator, Admin)
const getGroupLogs = async (req, res) => {
    try {
        const logs = await SupervisorLog.find({
            group: req.params.groupId,
            isDeleted: false
        })
            .populate('supervisor', 'name')
            .populate('student', 'name studentId')
            .sort({ meetingDate: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get at-risk groups
// @route   GET /api/supervisor-logs/coordinator/at-risk
// @access  Private (Coordinator, Admin)
const getAtRiskGroups = async (req, res) => {
    try {
        const logs = await SupervisorLog.find({
            isDeleted: false,
            $or: [
                { progressStatus: 'Seriously Delayed' },
                { logStatus: 'Warning Issued' }
            ]
        })
            .populate('group', 'groupCode members')
            .populate('supervisor', 'name')
            .sort({ meetingDate: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Soft delete log
// @route   DELETE /api/supervisor-logs/:id
// @access  Private (Supervisor)
const deleteLog = async (req, res) => {
    try {
        const log = await SupervisorLog.findById(req.params.id);

        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        // Verify ownership
        if (log.supervisor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this log' });
        }

        log.isDeleted = true;
        await log.save();

        res.json({ message: 'Log deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createLog,
    updateLog,
    getMySupervisorLogs,
    getStudentLogs,
    getCoordinatorAnalytics,
    getGroupLogs,
    getAtRiskGroups,
    deleteLog
};
