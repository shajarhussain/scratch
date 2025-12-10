const AttendanceLog = require('../models/attendanceLogModel');
const Group = require('../models/groupModel');
const SupervisorLog = require('../models/supervisorLogModel');
const mongoose = require('mongoose');

// @desc    Mark attendance for a session
// @route   POST /api/attendance/mark
// @access  Private (Student)
const markAttendance = async (req, res) => {
    const { sessionDate, attendanceStatus, remarks } = req.body;

    try {
        // Find the student's group
        const group = await Group.findOne({ members: req.user._id });

        if (!group) {
            return res.status(404).json({ message: 'You are not part of any group' });
        }

        // Check if attendance already marked for this date
        const existingLog = await AttendanceLog.findOne({
            group: group._id,
            student: req.user._id,
            sessionDate: new Date(sessionDate)
        });

        if (existingLog) {
            return res.status(400).json({ message: 'Attendance already marked for this date' });
        }

        const attendanceLog = await AttendanceLog.create({
            group: group._id,
            groupCode: group.groupCode,
            student: req.user._id,
            sessionDate: new Date(sessionDate),
            timestamp: new Date(),
            attendanceStatus,
            remarks
        });

        const populatedLog = await AttendanceLog.findById(attendanceLog._id)
            .populate('student', 'name studentId')
            .populate('group', 'groupCode members');

        res.status(201).json(populatedLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my attendance logs
// @route   GET /api/attendance/my-logs
// @access  Private (Student)
const getMyAttendanceLogs = async (req, res) => {
    try {
        console.log(`[DEBUG] Fetching logs for user: ${req.user._id}`);
        // Ensure userId is ObjectId for reliable querying
        const userId = new mongoose.Types.ObjectId(req.user._id);

        // 1. Find User's Group
        const group = await Group.findOne({ members: userId });

        if (group) {
            console.log(`[DEBUG] User found in group: ${group.groupCode} (${group._id})`);
        } else {
            console.log(`[DEBUG] User NOT found in any group`);
        }

        // 2. Fetch Legacy AttendanceLogs
        const legacyLogs = await AttendanceLog.find({ student: userId })
            .populate('group', 'groupCode members')
            .lean();

        console.log(`[DEBUG] Found ${legacyLogs.length} legacy logs`);

        let supervisorLogs = [];
        if (group) {
            // 3. Fetch SupervisorLogs (Meeting Records)
            const query = {
                group: group._id,
                $or: [
                    { student: null }, // Group-wide log
                    { student: userId } // Specific to this student
                ],
                isDeleted: false
            };
            console.log(`[DEBUG] SupervisorLog Query:`, JSON.stringify(query, null, 2));

            supervisorLogs = await SupervisorLog.find(query)
                .populate('group', 'groupCode')
                .lean();

            console.log(`[DEBUG] Found ${supervisorLogs.length} supervisor logs`);
        }

        // 4. Normalize and Merge
        const normalizedLegacy = legacyLogs.map(l => ({
            _id: l._id,
            sessionDate: l.sessionDate,
            attendanceStatus: l.attendanceStatus,
            remarks: l.remarks,
            supervisorFeedback: l.supervisorFeedback,
            type: 'Legacy Log',
            timestamp: l.timestamp,
            grade: l.grade,
            totalMarks: l.totalMarks
        }));

        const normalizedSupervisor = supervisorLogs.map(l => ({
            _id: l._id,
            sessionDate: l.meetingDate,
            attendanceStatus: l.attendanceStatus,
            remarks: `Weekly Meeting (${l.meetingType})`,
            supervisorFeedback: l.suggestionsGuidance, // Map guidance to feedback
            type: 'Meeting Log',
            timestamp: l.createdAt,
            // Map quality to a pseudo-grade if needed, or leave blank
            grade: l.qualityAssessment
        }));

        const allLogs = [...normalizedLegacy, ...normalizedSupervisor].sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));

        console.log(`[DEBUG] Total merged logs: ${allLogs.length}`);

        // 5. Calculate Stats
        const totalLogs = allLogs.length;
        const presentCount = allLogs.filter(log => log.attendanceStatus === 'Present').length;
        // Absent logic: Count Absent + Late? Or just Absent. Usually Late counts as present or partial. 
        // For now, let's count Present as Present.
        const attendanceRate = totalLogs > 0 ? ((presentCount / totalLogs) * 100).toFixed(0) : 0;

        res.json({
            logs: allLogs,
            statistics: {
                total: totalLogs,
                present: presentCount,
                absent: totalLogs - presentCount,
                attendanceRate: parseFloat(attendanceRate)
            }
        });
    } catch (error) {
        console.error('[ERROR] getMyAttendanceLogs:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get session attendance (for a specific date)
// @route   GET /api/attendance/session/:date
// @access  Private (Supervisor)
const getSessionAttendance = async (req, res) => {
    try {
        const { date } = req.params;
        const { groupId } = req.query;

        const query = {
            sessionDate: new Date(date)
        };

        if (groupId) {
            query.group = groupId;
        }

        const logs = await AttendanceLog.find(query)
            .populate('student', 'name studentId')
            .populate('group', 'groupCode members')
            .sort({ timestamp: 1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Grade student based on attendance log
// @route   PUT /api/attendance/grade/:logId
// @access  Private (Supervisor)
const gradeStudent = async (req, res) => {
    const { supervisorMarks, internalMarks, externalMarks, supervisorFeedback, isImportant } = req.body;

    try {
        const log = await AttendanceLog.findById(req.params.logId).populate('group');

        if (!log) {
            return res.status(404).json({ message: 'Attendance log not found' });
        }

        // Verify attendance was marked (can only grade if present)
        if (log.attendanceStatus === 'Absent') {
            return res.status(400).json({ message: 'Cannot grade absent student' });
        }

        // Update grading fields
        if (supervisorMarks !== undefined) log.supervisorMarks = supervisorMarks;
        if (internalMarks !== undefined) log.internalMarks = internalMarks;
        if (externalMarks !== undefined) log.externalMarks = externalMarks;
        if (supervisorFeedback !== undefined) log.supervisorFeedback = supervisorFeedback;
        if (isImportant !== undefined) log.isImportant = isImportant;

        await log.save(); // This will trigger pre-save hook to calculate total and grade

        const populatedLog = await AttendanceLog.findById(log._id)
            .populate('student', 'name studentId')
            .populate('group', 'groupCode members');

        res.json({ message: 'Student graded successfully', log: populatedLog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get coordinator insights dashboard
// @route   GET /api/attendance/insights
// @access  Private (Coordinator, Admin)
const getCoordinatorInsights = async (req, res) => {
    try {
        // Get all groups
        const groups = await Group.find({}).populate('members', 'name studentId');

        // Get Supervisor Logs (Weekly Meetings) for analytics
        const supervisorLogs = await SupervisorLog.find({ isDeleted: false })
            .populate('group', 'groupCode')
            .sort({ meetingDate: -1 });

        // --- Overall Statistics ---
        const totalGroups = groups.length;

        // Calculate Average Attendance based on Meeting Records
        // "Present" meeting counts as 100% for that instance
        const totalMeetings = supervisorLogs.length;
        const presentMeetings = supervisorLogs.filter(log => log.attendanceStatus === 'Present').length;
        const averageAttendance = totalMeetings > 0
            ? ((presentMeetings / totalMeetings) * 100).toFixed(1)
            : 0;

        // Calculate "At Risk" (Low Attendance) Groups
        // Logic: < 75% attendance in their logs
        let lowAttendanceCount = 0;
        groups.forEach(group => {
            const groupLogs = supervisorLogs.filter(l => l.group && l.group._id.toString() === group._id.toString());
            if (groupLogs.length >= 3) { // Only count if enough data
                const absentCount = groupLogs.filter(l => l.attendanceStatus === 'Absent').length;
                const presenceRate = (groupLogs.length - absentCount) / groupLogs.length;
                if (presenceRate < 0.75) lowAttendanceCount++;
            }
        });

        // --- Recent Attendance Status (Latest Meeting) ---
        // Mapping latest meeting status to the "Today's Attendance" view structure
        const recentAttendanceMap = groups.map(group => {
            // Find latest log for this group
            const latestLog = supervisorLogs.find(l => l.group && l.group._id.toString() === group._id.toString());

            const isPresent = latestLog ? latestLog.attendanceStatus === 'Present' : false; // Default to Absent/No Data
            const totalMembers = group.members.length;

            return {
                groupCode: group.groupCode,
                totalMembers: totalMembers,
                present: isPresent ? totalMembers : 0, // If meeting Present, all members Present
                absent: isPresent ? [] : group.members.map(m => m.name), // If Absent, all members Absent
                statusNote: latestLog ? `Meeting: ${new Date(latestLog.meetingDate).toLocaleDateString()}` : 'No Meetings'
            };
        });

        // --- Important/Flagged Feedback ---
        // Retaining existing logic + Adding "Absent/Late" flags
        let importantFeedback = await AttendanceLog.find({ isImportant: true })
            .populate('student', 'name studentId')
            .populate('group', 'groupCode')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            overallStats: {
                totalGroups,
                averageAttendance: parseFloat(averageAttendance),
                lowAttendanceCount
            },
            todayAttendance: recentAttendanceMap,
            importantFeedback
        });
    } catch (error) {
        console.error('Insights Error:', error);
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get list of absent students
// @route   GET /api/attendance/absent
// @access  Private (Coordinator, Admin)
const getAbsentStudents = async (req, res) => {
    try {
        const { date } = req.query;
        const queryDate = date ? new Date(date) : new Date();
        queryDate.setHours(0, 0, 0, 0);

        const absentLogs = await AttendanceLog.find({
            sessionDate: queryDate,
            attendanceStatus: { $in: ['Absent'] }
        }).populate('student', 'name studentId email')
            .populate('group', 'groupCode');

        res.json(absentLogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get important feedback
// @route   GET /api/attendance/important-feedback
// @access  Private (Coordinator, Admin)
const getImportantFeedback = async (req, res) => {
    try {
        const feedback = await AttendanceLog.find({ isImportant: true })
            .populate('student', 'name studentId')
            .populate('group', 'groupCode')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    markAttendance,
    getMyAttendanceLogs,
    getSessionAttendance,
    gradeStudent,
    getCoordinatorInsights,
    getAbsentStudents,
    getImportantFeedback
};
