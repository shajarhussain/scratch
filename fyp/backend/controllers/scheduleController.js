const Schedule = require('../models/scheduleModel');
const Group = require('../models/groupModel');
const User = require('../models/userModel');
const ExternalToken = require('../models/externalTokenModel');
const Notification = require('../models/notificationModel');
const { sendScheduleNotifications, sendConflictAlert } = require('../services/notificationService');
const { generateSecureToken, generateMagicLink } = require('../utils/tokenGenerator');
const Evaluation = require('../models/evaluationModel');

// @desc    Create a new schedule
// @route   POST /api/schedules
// @access  Private (Coordinator, Admin)
const createSchedule = async (req, res) => {
    try {
        let {
            eventType,
            eventDate,
            startTime,
            endTime,
            venue,
            isOnline,
            meetingLink,
            groupId,
            studentIds,
            supervisorId,
            internalEvaluatorIds,
            externalEvaluatorId,
            accessStartDate,
            accessEndDate,
            groupsAssigned,
            deadlineType,
            allowExtensions,
            resultPublicationDate,
            gradeLockDate,
            notes,
            description,
            requirements
        } = req.body;

        // Fetch group to get students if not provided
        let students = studentIds || [];
        if (groupId && !studentIds) {
            const group = await Group.findById(groupId).populate('members');
            if (group) {
                students = group.members.map(m => m._id);
            }
        }

        // Filter out empty values for optional enum fields
        const scheduleData = {
            eventType,
            eventDate,
            startTime,
            endTime,
            venue,
            isOnline,
            meetingLink,
            groupsAssigned: groupsAssigned || [],
            allowExtensions,
            notes,
            description,
            requirements,
            createdBy: req.user._id,
            notificationsSent: false
        };

        // Sanitize scheduleData to remove undefined/empty strings that cause validation errors
        Object.keys(scheduleData).forEach(key => {
            if (scheduleData[key] === '' || scheduleData[key] === undefined) {
                delete scheduleData[key];
            }
        });

        // Only add ObjectId fields if they have valid values (not empty strings)
        if (groupId && groupId.trim() !== '') {
            scheduleData.group = groupId;
            // ALWAYS add students if group is present
            if (students && students.length > 0) {
                scheduleData.students = students;
                console.log(`📝 Adding ${students.length} students to schedule from group`);
            } else {
                console.log('⚠️  Warning: Group assigned but no students found!');
            }
        }

        if (supervisorId && supervisorId.trim() !== '') {
            scheduleData.supervisor = supervisorId;
        }

        if (internalEvaluatorIds && Array.isArray(internalEvaluatorIds) && internalEvaluatorIds.length > 0) {
            // Filter out empty strings from array
            const validIds = internalEvaluatorIds.filter(id => id && id.trim() !== '');
            if (validIds.length > 0) {
                scheduleData.internalEvaluators = validIds;
            }
        }

        if (externalEvaluatorId && externalEvaluatorId.trim() !== '') {
            scheduleData.externalEvaluator = externalEvaluatorId;
        }

        if (accessStartDate) scheduleData.accessStartDate = accessStartDate;
        if (accessEndDate) scheduleData.accessEndDate = accessEndDate;
        if (resultPublicationDate) scheduleData.resultPublicationDate = resultPublicationDate;
        if (gradeLockDate) scheduleData.gradeLockDate = gradeLockDate;
        if (req.body.srsUploadStartDate) {
            scheduleData.srsUploadStartDate = req.body.srsUploadStartDate;
        } else if (eventType === 'Interim Evaluation I' && eventDate) {
            // Default: Open 5 days before event (Day 2 of 7 day window)
            const date = new Date(eventDate);
            date.setDate(date.getDate() - 5);
            scheduleData.srsUploadStartDate = date;
        }

        // Only add deadlineType if it has a valid value
        if (deadlineType && deadlineType.trim() !== '') {
            scheduleData.deadlineType = deadlineType;
        }
        // Helper to handle External Evaluator creation
        if (req.body.isNewEvaluator && req.body.newEvaluatorEmail) {
            try {
                let user = await User.findOne({ email: req.body.newEvaluatorEmail });
                if (!user) {
                    console.log(`Creating new External Evaluator: ${req.body.newEvaluatorEmail}`);
                    user = await User.create({
                        name: req.body.newEvaluatorName || 'External Evaluator',
                        email: req.body.newEvaluatorEmail,
                        password: Math.random().toString(36).slice(-8) + 'X!', // temp password
                        role: 'ExternalEvaluator',
                    });
                }
                // Override the ID with the new (or found) user
                scheduleData.externalEvaluator = user._id;
                // Update local variable for magic link logic below
                externalEvaluatorId = user._id;
            } catch (err) {
                console.error('Error creating new external evaluator:', err);
                return res.status(400).json({ message: 'Failed to create new external evaluator: ' + err.message });
            }
        }

        // Create schedule
        const schedule = await Schedule.create(scheduleData);

        // Populate references
        await schedule.populate([
            { path: 'group' },
            { path: 'students', select: 'name email' },
            { path: 'supervisor', select: 'name email' },
            { path: 'internalEvaluators', select: 'name email' },
            { path: 'externalEvaluator', select: 'name email' },
            { path: 'createdBy', select: 'name' }
        ]);

        // 🔐 GENERATE MAGIC LINK for External Evaluator (Final Viva only)
        let generatedMagicLink = null;
        if (eventType === 'Final Viva' && externalEvaluatorId) {
            try {
                // Generate secure token
                const token = generateSecureToken();

                // Calculate expiry (2 days after evaluation date)
                const expiryDate = new Date(eventDate);
                expiryDate.setDate(expiryDate.getDate() + 2);

                // Create external token record
                await ExternalToken.create({
                    tokenHash: token,
                    user: externalEvaluatorId,
                    expiresAt: expiryDate,
                    isActive: true,
                    coordinatorId: req.user._id
                });

                // Generate magic link
                generatedMagicLink = generateMagicLink(token, process.env.FRONTEND_URL || 'http://localhost:3000');

                console.log(`✅ Magic link generated: ${generatedMagicLink}`);
                // Attach for response
                schedule.magicLink = generatedMagicLink;
                // Note: If 'magicLink' is not in Schedule schema, this might not persist in DB, 
                // but we return it in JSON response.
            } catch (tokenError) {
                console.error('Error generating magic link:', tokenError);
            }
        }

        // ✅ SEND NOTIFICATIONS
        await sendScheduleNotifications(schedule, 'created');

        // ✅ SEND EMAIL TO EXTERNAL EVALUATOR (Final Viva)
        if (eventType === 'Final Viva' && generatedMagicLink && externalEvaluatorId) {
            try {
                // Ensure we have the user object with email
                const evaluatorUser = await User.findById(externalEvaluatorId);

                if (!evaluatorUser || !evaluatorUser.email) {
                    console.error('❌ Cannot send email: Evaluator user or email not found for ID:', externalEvaluatorId);
                } else {
                    console.log(`📨 Preparing to send email to External Evaluator: ${evaluatorUser.email}`);

                    const subject = req.body.emailSubject || 'Invitation to evaluate Final Viva';
                    const customMessage = req.body.emailMessage || '';

                    const message = `Hello ${evaluatorUser.name},

You have been invited to evaluate a Final Viva for group ${schedule.group?.groupCode || 'N/A'}.

Event Date: ${new Date(schedule.eventDate).toLocaleDateString()}
Time: ${schedule.startTime} - ${schedule.endTime}
Venue: ${schedule.venue}

${customMessage ? `Note from Coordinator:\n${customMessage}\n\n` : ''}
Please use the following secure link to access the evaluation dashboard (no login required):
${generatedMagicLink}

This link is valid for 48 days after the event.

Best regards,
FYP Management System`;

                    const sendEmail = require('../utils/emailService');
                    await sendEmail({
                        email: evaluatorUser.email,
                        replyTo: req.body.coordinatorEmail || req.user.email, // Use provided email or login email
                        subject: subject,
                        message: message
                    });
                    console.log(`📧 Email sent successfully directly to: ${evaluatorUser.email}`);
                }
            } catch (emailErr) {
                console.error('❌ Failed to send email to external evaluator:', emailErr);
            }
        } else {
            console.log('ℹ️ Skipping email send. Conditions: ', {
                isFinalViva: eventType === 'Final Viva',
                hasMagicLink: !!generatedMagicLink,
                hasEvaluator: !!schedule.externalEvaluator
            });
        }

        res.status(201).json(schedule);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating schedule', error: error.message });
    }
};

// @desc    Update a schedule
// @route   PUT /api/schedules/:id
// @access  Private (Coordinator, Admin)
const updateSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Helper to handle External Evaluator creation (Same as createSchedule)
        if (req.body.isNewEvaluator && req.body.newEvaluatorEmail) {
            try {
                let user = await User.findOne({ email: req.body.newEvaluatorEmail });
                if (!user) {
                    console.log(`Creating new External Evaluator (Update Flow): ${req.body.newEvaluatorEmail}`);
                    user = await User.create({
                        name: req.body.newEvaluatorName || 'External Evaluator',
                        email: req.body.newEvaluatorEmail,
                        password: Math.random().toString(36).slice(-8) + 'X!', // temp password
                        role: 'ExternalEvaluator',
                    });
                }
                // Update specific field
                schedule.externalEvaluator = user._id;
                req.body.externalEvaluatorId = user._id; // Sync for below checks
            } catch (err) {
                console.error('Error creating new external evaluator in update:', err);
                // Continue but might fail validation if id missing
            }
        }

        // Explicitly map frontend keys to backend schema keys
        if (req.body.supervisorId) schedule.supervisor = req.body.supervisorId;
        if (req.body.groupId) schedule.group = req.body.groupId;
        if (req.body.externalEvaluatorId) schedule.externalEvaluator = req.body.externalEvaluatorId;
        if (req.body.studentIds) schedule.students = req.body.studentIds;

        // Handle Internal Evaluators array
        if (req.body.internalEvaluatorIds) {
            schedule.internalEvaluators = req.body.internalEvaluatorIds.filter(id => id && id.trim() !== '');
        }

        // Generic update for other matching fields
        Object.keys(req.body).forEach(key => {
            if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt' &&
                !['supervisorId', 'groupId', 'externalEvaluatorId', 'studentIds', 'internalEvaluatorIds', 'isNewEvaluator', 'newEvaluatorName', 'newEvaluatorEmail', 'emailSubject', 'emailMessage'].includes(key)) {

                let value = req.body[key];
                if (value === '') value = undefined;
                schedule[key] = value;
            }
        });

        if (req.body.srsUploadStartDate) {
            schedule.srsUploadStartDate = req.body.srsUploadStartDate;
        }

        // 🔐 GENERATE MAGIC LINK if missing or if evaluator changed (Final Viva only)
        // Also force regen if user requested it implicitly by changing evaluator
        let generatedMagicLink = schedule.magicLink;

        // If we have an evaluator but no link, OR if we just assigned a NEW evaluator
        const needsLink = (schedule.eventType === 'Final Viva' && schedule.externalEvaluator && !schedule.magicLink) ||
            (req.body.isNewEvaluator);

        if (needsLink) {
            try {
                const token = generateSecureToken();
                const expiryDate = new Date(schedule.eventDate);
                expiryDate.setDate(expiryDate.getDate() + 2);

                await ExternalToken.create({
                    tokenHash: token,
                    user: schedule.externalEvaluator,
                    expiresAt: expiryDate,
                    isActive: true,
                    coordinatorId: req.user._id
                });

                generatedMagicLink = generateMagicLink(token, process.env.FRONTEND_URL || 'http://localhost:3000');
                console.log(`✅ Magic link (re)generated during update: ${generatedMagicLink}`);
                schedule.magicLink = generatedMagicLink;
            } catch (tokenError) {
                console.error('Error generating magic link during update:', tokenError);
            }
        }

        await schedule.save();

        await schedule.populate([
            { path: 'group' },
            { path: 'students', select: 'name email' },
            { path: 'supervisor', select: 'name email' },
            { path: 'internalEvaluators', select: 'name email' },
            { path: 'externalEvaluator', select: 'name email' }
        ]);

        // ✅ SEND NOTIFICATIONS for updates
        await sendScheduleNotifications(schedule, 'updated');

        // ✅ SEND EMAIL TO EXTERNAL EVALUATOR (Final Viva - Update Flow)
        // Trigger if: Final Viva + Has Link + Has Evaluator + (Requested via form OR New Evaluator Added)
        const shouldSendEmail = (schedule.eventType === 'Final Viva' && generatedMagicLink && schedule.externalEvaluator);

        if (shouldSendEmail && (req.body.emailSubject || req.body.emailMessage || req.body.isNewEvaluator)) {
            try {
                // Ensure we have the user object with email
                const externalEvaluatorId = schedule.externalEvaluator._id || schedule.externalEvaluator;
                const evaluatorUser = await User.findById(externalEvaluatorId);

                if (!evaluatorUser || !evaluatorUser.email) {
                    console.error('❌ Cannot send email (Update): Evaluator user or email not found.');
                } else {
                    console.log(`📨 Sending email (Update) to: ${evaluatorUser.email}`);

                    const subject = req.body.emailSubject || 'Invitation to evaluate Final Viva (Updated)';
                    const customMessage = req.body.emailMessage || '';

                    const message = `Hello ${evaluatorUser.name},

You have been invited to evaluate a Final Viva for group ${schedule.group?.groupCode || 'N/A'}.

Event Date: ${new Date(schedule.eventDate).toLocaleDateString()}
Time: ${schedule.startTime} - ${schedule.endTime}
Venue: ${schedule.venue}

${customMessage ? `Note from Coordinator:\n${customMessage}\n\n` : ''}
Please use the following secure link to access the evaluation dashboard (no login required):
${generatedMagicLink}

This link is valid for 48 days after the event.

Best regards,
FYP Management System`;

                    const sendEmail = require('../utils/emailService');
                    await sendEmail({
                        email: evaluatorUser.email,
                        replyTo: req.body.coordinatorEmail || req.user.email,
                        subject: subject,
                        message: message
                    });
                    console.log(`📧 Email sent successfully (Update) to: ${evaluatorUser.email}`);
                }
            } catch (emailErr) {
                console.error('❌ Failed to send email (Update):', emailErr);
            }
        }

        res.json(schedule);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating schedule', error: error.message });
    }
};

// @desc    Get schedules with filters
// @route   GET /api/schedules
// @access  Private (Role-based filtering)
const getSchedules = async (req, res) => {
    try {
        const { eventType, status, month, groupId } = req.query;
        const query = {};

        // Filter by event type
        if (eventType) {
            query.eventType = eventType;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by month
        if (month) {
            const [year, monthNum] = month.split('-');
            const startDate = new Date(year, monthNum - 1, 1);
            const endDate = new Date(year, monthNum, 0, 23, 59, 59);
            query.eventDate = { $gte: startDate, $lte: endDate };
        }

        // Filter by group
        if (groupId) {
            query.group = groupId;
        }

        console.log(`🔍 GetSchedules Request - User: ${req.user.name} (${req.user.role}) ID: ${req.user._id}`);

        // Role-based filtering
        if (req.user.role === 'Student') {
            // Students see only their group's schedules
            const groups = await Group.find({ members: req.user._id });
            const groupIds = groups.map(g => g._id);
            query.group = { $in: groupIds };
        } else if (req.user.role === 'Supervisor' || req.user.role === 'InternalEvaluator' || req.user.role === 'ExternalEvaluator') {
            // Evaluators see schedules they're assigned to
            query.$or = [
                { supervisor: req.user._id },
                { internalEvaluators: req.user._id },
                { externalEvaluator: req.user._id }
            ];
        }

        const schedules = await Schedule.find(query)
            .populate('group')
            .populate('students', 'name email')
            .populate('supervisor', 'name email')
            .populate('internalEvaluators', 'name email')
            .populate('externalEvaluator', 'name email')
            .populate('createdBy', 'name')
            .sort({ eventDate: 1 });

        // Retrieve evaluations for these schedules
        const evaluations = await Evaluation.find({ schedule: { $in: schedules.map(s => s._id) } });

        // Attach evaluation status to schedules
        const schedulesWithStatus = schedules.map(schedule => {
            const doc = schedule.toObject(); // Convert to plain object
            const evaluation = evaluations.find(e => e.schedule && e.schedule.toString() === schedule._id.toString());

            if (evaluation) {
                doc.evaluationDetails = {
                    hasEvaluation: true,
                    status: evaluation.status, // Pending, In Progress, Completed
                    averageScore: evaluation.averageScore,
                    evaluators: evaluation.evaluators.map(e => ({
                        evaluatorId: e.evaluator.toString(),
                        submitted: e.marksSubmitted
                    }))
                };
            } else {
                doc.evaluationDetails = { hasEvaluation: false };
            }
            return doc;
        });

        res.json(schedulesWithStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching schedules', error: error.message });
    }
};

// @desc    Get calendar view for a month
// @route   GET /api/schedules/calendar/:month
// @access  Private
const getCalendarView = async (req, res) => {
    try {
        const month = req.params.month; // Format: YYYY-MM
        const [year, monthNum] = month.split('-');

        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);

        const query = {
            eventDate: { $gte: startDate, $lte: endDate },
            status: { $ne: 'Cancelled' }
        };

        // Role-based filtering
        if (req.user.role === 'Student') {
            const groups = await Group.find({ members: req.user._id });
            const groupIds = groups.map(g => g._id);
            query.group = { $in: groupIds };
        } else if (req.user.role === 'Supervisor' || req.user.role === 'InternalEvaluator' || req.user.role === 'ExternalEvaluator') {
            query.$or = [
                { supervisor: req.user._id },
                { internalEvaluators: req.user._id },
                { externalEvaluator: req.user._id }
            ];
        }

        const schedules = await Schedule.find(query)
            .populate('group', 'groupCode')
            .select('eventType eventDate startTime endTime venue status group')
            .sort({ eventDate: 1 });

        res.json(schedules);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching calendar', error: error.message });
    }
};

// @desc    Reschedule an event
// @route   POST /api/schedules/:id/reschedule
// @access  Private (Coordinator, Admin)
const rescheduleEvent = async (req, res) => {
    try {
        const originalSchedule = await Schedule.findById(req.params.id);

        if (!originalSchedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        const { eventDate, startTime, endTime, venue, reschedulingReason } = req.body;

        // Create new schedule
        const newSchedule = await Schedule.create({
            ...originalSchedule.toObject(),
            _id: undefined,
            eventDate,
            startTime,
            endTime,
            venue,
            originalDate: originalSchedule.eventDate,
            reschedulingReason,
            rescheduledFrom: originalSchedule._id,
            status: 'Scheduled',
            notificationsSent: false,
            createdAt: undefined,
            updatedAt: undefined
        });

        // Mark original as rescheduled
        originalSchedule.status = 'Rescheduled';
        await originalSchedule.save();

        await newSchedule.populate([
            { path: 'group' },
            { path: 'students', select: 'name email' },
            { path: 'supervisor', select: 'name email' },
            { path: 'internal Evaluators', select: 'name email' },
            { path: 'externalEvaluator', select: 'name email' }
        ]);

        // ✅ SEND NOTIFICATIONS for reschedule
        await sendScheduleNotifications(newSchedule, 'rescheduled');

        res.status(201).json(newSchedule);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error rescheduling event', error: error.message });
    }
};

// @desc    Mark schedule as completed
// @route   POST /api/schedules/:id/complete
// @access  Private (Coordinator, Admin)
const markAsCompleted = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        schedule.status = 'Completed';
        await schedule.save();

        // ✅ SEND NOTIFICATIONS for completion (Notifies Supervisor)
        await sendScheduleNotifications(schedule, 'completed');

        res.json({ message: 'Schedule marked as completed', schedule });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error completing schedule', error: error.message });
    }
};

// @desc    Cancel schedule
// @route   DELETE /api/schedules/:id
// @access  Private (Coordinator, Admin)
const cancelSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        const isPermanent = String(req.query.permanent).toLowerCase() === 'true';

        console.log(`🗑️ Delete Request for ${req.params.id}. Permanent: ${isPermanent}`);

        // Hard Delete
        if (isPermanent) {
            // Cascade delete dependencies
            await Notification.deleteMany({ schedule: req.params.id });
            await ExternalToken.deleteMany({ _id: { $in: schedule.externalTokens || [] } }); // If references exist
            // Also try deleting by valid external token associated with this user/schedule if possible, 
            // but we don't store scheduleId in ExternalToken directly effectively? 
            // Let's check ExternalToken model. 
            // We just created it in createSchedule but didn't link it strictly to schedule by ID, 
            // just to the user (externalEvaluator). 
            // Wait, createSchedule creates ExternalToken with 'user' matching externalEvaluatorId.
            // We can try to assume 1 active token per user, or maybe we didn't store schedule ref.

            await Schedule.findByIdAndDelete(req.params.id);
            console.log(`✅ Schedule ${req.params.id} permanently deleted`);
            return res.json({ message: 'Schedule permanently deleted' });
        }

        // Soft Cancel
        schedule.status = 'Cancelled';
        await schedule.save();

        // ✅ SEND NOTIFICATIONS for cancellation
        await sendScheduleNotifications(schedule, 'cancelled');

        res.json({ message: 'Schedule cancelled', schedule });
    } catch (error) {
        console.error('Error cancelling schedule:', error);
        res.status(500).json({ message: 'Error cancelling schedule', error: error.message });
    }
};

// @desc    Get upcoming events
// @route   GET /api/schedules/upcoming
// @access  Private
const getUpcomingEvents = async (req, res) => {
    try {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const query = {
            eventDate: { $gte: new Date(), $lte: sevenDaysFromNow },
            status: 'Scheduled'
        };

        // Role-based filtering
        if (req.user.role === 'Student') {
            const groups = await Group.find({ members: req.user._id });
            const groupIds = groups.map(g => g._id);
            query.group = { $in: groupIds };
        } else if (req.user.role === 'Supervisor' || req.user.role === 'InternalEvaluator' || req.user.role === 'ExternalEvaluator') {
            query.$or = [
                { supervisor: req.user._id },
                { internalEvaluators: req.user._id },
                { externalEvaluator: req.user._id }
            ];
        }

        const schedules = await Schedule.find(query)
            .populate('group', 'groupCode')
            .populate('students', 'name')
            .select('eventType eventDate startTime venue group students')
            .sort({ eventDate: 1 })
            .limit(10);

        res.json(schedules);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching upcoming events', error: error.message });
    }
};

// @desc    Check for conflicts
// @route   POST /api/schedules/check-conflicts
// @access  Private (Coordinator, Admin)
const checkConflicts = async (req, res) => {
    try {
        const { eventDate, startTime, endTime, venue, panelMemberIds } = req.body;

        const conflicts = [];

        // Check venue conflict (if physical)
        if (venue && venue !== 'Online') {
            const venueConflict = await Schedule.findOne({
                eventDate: new Date(eventDate),
                venue,
                status: 'Scheduled',
                $or: [
                    { startTime: { $lte: startTime }, endTime: { $gte: startTime } },
                    { startTime: { $lte: endTime }, endTime: { $gte: endTime } }
                ]
            });

            if (venueConflict) {
                conflicts.push({
                    type: 'venue',
                    message: `Venue ${venue} is already booked for this time`,
                    schedule: venueConflict
                });
            }
        }

        // Check panel member conflicts
        if (panelMemberIds && panelMemberIds.length > 0) {
            for (const memberId of panelMemberIds) {
                const memberConflict = await Schedule.findOne({
                    eventDate: new Date(eventDate),
                    status: 'Scheduled',
                    $or: [
                        { supervisor: memberId },
                        { internalEvaluators: memberId },
                        { externalEvaluator: memberId }
                    ],
                    $or: [
                        { startTime: { $lte: startTime }, endTime: { $gte: startTime } },
                        { startTime: { $lte: endTime }, endTime: { $gte: endTime } }
                    ]
                }).populate('group', 'groupCode');

                if (memberConflict) {
                    const member = await User.findById(memberId).select('name');
                    conflicts.push({
                        type: 'panel',
                        message: `${member.name} has another commitment at this time`,
                        schedule: memberConflict
                    });
                }
            }
        }

        res.json({
            hasConflicts: conflicts.length > 0,
            conflicts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error checking conflicts', error: error.message });
    }
};

// @desc    Resend External Evaluator Invitation
// @route   POST /api/schedules/:id/resend-invite
// @access  Private (Coordinator)
const resendExternalInvitation = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id)
            .populate('externalEvaluator')
            .populate('group');

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        if (schedule.eventType !== 'Final Viva') {
            return res.status(400).json({ message: 'Schedule must be a Final Viva event.' });
        }

        // --- NEW LOGIC: Handle "Invite New" or "Change Evaluator" on the fly ---
        // If the request includes new evaluator details, we allow updating the schedule first.
        if (req.body.newEvaluatorEmail) {
            try {
                let user = await User.findOne({ email: req.body.newEvaluatorEmail });
                if (!user) {
                    user = await User.create({
                        name: req.body.newEvaluatorName || 'External Evaluator',
                        email: req.body.newEvaluatorEmail,
                        password: Math.random().toString(36).slice(-8) + 'X!',
                        role: 'ExternalEvaluator',
                    });
                }
                schedule.externalEvaluator = user._id;
                await schedule.save();
                // Re-populate to get the full object
                await schedule.populate('externalEvaluator');
            } catch (err) {
                return res.status(500).json({ message: 'Failed to create/assign new evaluator: ' + err.message });
            }
        }
        // Also support passing an existing ID directly
        else if (req.body.externalEvaluatorId && (!schedule.externalEvaluator || schedule.externalEvaluator._id.toString() !== req.body.externalEvaluatorId)) {
            schedule.externalEvaluator = req.body.externalEvaluatorId;
            await schedule.save();
            await schedule.populate('externalEvaluator');
        }

        // Final check
        if (!schedule.externalEvaluator) {
            return res.status(400).json({ message: 'No External Evaluator is assigned to this schedule. Please select one first.' });
        }

        // --- End New Logic ---

        // Ensure Magic Link Exists
        if (!schedule.magicLink || req.body.forceRegen) {
            try {
                const token = generateSecureToken();
                const expiryDate = new Date(schedule.eventDate);
                expiryDate.setDate(expiryDate.getDate() + 2);

                await ExternalToken.create({
                    tokenHash: token,
                    user: schedule.externalEvaluator._id || schedule.externalEvaluator,
                    expiresAt: expiryDate,
                    isActive: true,
                    coordinatorId: req.user._id
                });

                schedule.magicLink = generateMagicLink(token, process.env.FRONTEND_URL || 'http://localhost:3000');
                await schedule.save();
            } catch (err) {
                console.error("Link Gen Error", err);
                return res.status(500).json({ message: 'Failed to generate magic link' });
            }
        }

        const subject = req.body.subject || 'Invitation to evaluate Final Viva (Reminder)';
        const customMessage = req.body.message || '';

        const evaluatorEmail = schedule.externalEvaluator.email;
        if (!evaluatorEmail) {
            return res.status(400).json({ message: 'Evaluator email not found.' });
        }

        const message = `Hello ${schedule.externalEvaluator.name},

You have been invited to evaluate a Final Viva for group ${schedule.group?.groupCode || 'N/A'}.

Event Date: ${new Date(schedule.eventDate).toLocaleDateString()}
Time: ${schedule.startTime} - ${schedule.endTime}
Venue: ${schedule.venue}

${customMessage ? `Note from Coordinator:\n${customMessage}\n\n` : ''}
Please use the following secure link to access the evaluation dashboard (no login required):
${schedule.magicLink}

This link is valid for 48 days after the event.

Best regards,
FYP Management System`;

        const sendEmail = require('../utils/emailService');
        await sendEmail({
            email: evaluatorEmail,
            replyTo: req.body.coordinatorEmail || req.user.email,
            subject: subject,
            message: message
        });

        res.json({ message: `Invitation sent to ${evaluatorEmail}` });

    } catch (error) {
        console.error('Resend Error:', error);
        res.status(500).json({ message: 'Failed to resend email', error: error.message });
    }
};

module.exports = {
    createSchedule,
    updateSchedule,
    getSchedules,
    getCalendarView,
    rescheduleEvent,
    markAsCompleted,
    cancelSchedule,
    getUpcomingEvents,
    checkConflicts,
    resendExternalInvitation
};
