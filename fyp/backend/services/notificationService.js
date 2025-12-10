const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

/**
 * Format date for display in notifications
 */
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Create a notification record
 */
const createNotification = async (recipientId, content, schedule = null) => {
    try {
        const recipient = await User.findById(recipientId);
        if (!recipient) return null;

        const notification = await Notification.create({
            recipient: recipientId,
            recipientRole: recipient.role,
            schedule: schedule?._id || null,
            eventType: schedule?.eventType || null,
            eventDate: schedule?.eventDate || null,
            ...content,
            deliveryStatus: {
                inApp: {
                    sent: content.channels?.inApp || false,
                    sentAt: new Date()
                },
                email: {
                    sent: false  // Will be updated by email service
                }
            }
        });

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

/**
 * Create multiple notifications
 */
const createNotifications = async (recipientIds, content, schedule = null) => {
    const notifications = [];
    for (const recipientId of recipientIds) {
        const notification = await createNotification(recipientId, content, schedule);
        if (notification) {
            notifications.push(notification);
        }
    }
    return notifications;
};

/**
 * 1️⃣ Notify Students
 * ALWAYS notified for: Proposal defense, Interim/Mid evals, Final viva, Deadlines, Rescheduled
 */
const notifyStudents = async (schedule) => {
    const studentEventTypes = [
        'Proposal Defense',
        'Interim Evaluation I',
        'Mid-Term Evaluation II',
        'Final Viva',
        'Submission Deadline',
        'Rescheduled Defense',
        'Re-Evaluation'
    ];

    if (!studentEventTypes.includes(schedule.eventType) || !schedule.students || schedule.students.length === 0) {
        return [];
    }

    const priority = schedule.eventType === 'Final Viva' || schedule.eventType === 'Submission Deadline'
        ? 'Urgent'
        : 'High';

    const content = {
        type: 'Schedule Created',
        title: `${schedule.eventType} Scheduled`,
        message: `Event: ${schedule.eventType}
Date: ${formatDate(schedule.eventDate)}
Time: ${schedule.startTime} - ${schedule.endTime}
Venue: ${schedule.venue || 'TBD'}
${schedule.isOnline && schedule.meetingLink ? '\n🔗 Meeting Link: ' + schedule.meetingLink : ''}

${schedule.requirements ? 'Required: ' + schedule.requirements : ''}

Important: Please arrive 15 minutes early.`,
        priority,
        actionRequired: true,
        channels: { inApp: true, email: true },
        metadata: {
            venue: schedule.venue,
            meetingLink: schedule.meetingLink,
            requirements: schedule.requirements
        }
    };

    const studentIds = schedule.students.map(s => s._id || s);
    return await createNotifications(studentIds, content, schedule);
};

/**
 * 2️⃣ Notify Supervisor
 * ALWAYS notified for: Proposal defense, All interim evals, Final viva, Reschedules
 */
const notifySupervisor = async (schedule, action = 'created') => {
    const supervisorEventTypes = [
        'Proposal Defense',
        'Interim Evaluation I',
        'Mid-Term Evaluation II',
        'Final Viva',
        'Rescheduled Defense'
    ];

    if (!supervisorEventTypes.includes(schedule.eventType) || !schedule.supervisor) {
        return [];
    }

    const role = schedule.eventType === 'Final Viva' ? 'Panel Member' : 'Supervisor';
    const externalInfo = schedule.eventType === 'Final Viva' && schedule.externalEvaluator
        ? `\n\nExternal Evaluator: ${schedule.externalEvaluator.name}`
        : '';

    let title, message;

    if (action === 'completed') {
        title = `${schedule.eventType} - Completed`;
        message = `The evaluation for your group has been completed.
         
Group: ${schedule.group?.groupCode || 'N/A'}
Date Held: ${formatDate(schedule.eventDate)}
Status: Results pending your final review (if applicable).

Please log in to view feedback and scores.`;
    } else if (action === 'cancelled') {
        title = `${schedule.eventType} - CANCELLED`;
        message = `The scheduled event has been cancelled.

Group: ${schedule.group?.groupCode}
Date: ${formatDate(schedule.eventDate)}

Please contact the coordinator for more details.`;
    } else {
        // Created / Updated / Rescheduled
        title = `${schedule.eventType} - ${schedule.group?.groupCode || 'Group'}`;
        message = `Your supervisee group has been scheduled for ${schedule.eventType}.

Group: ${schedule.group?.groupCode || 'N/A'}
Role: ${role}
Date: ${formatDate(schedule.eventDate)}
Time: ${schedule.startTime} - ${schedule.endTime}
Venue: ${schedule.venue || 'TBD'}${externalInfo}

${schedule.notes ? 'Notes: ' + schedule.notes : ''}`;
    }

    const content = {
        type: 'Schedule Update',
        title: title,
        message: message,
        priority: 'High',
        actionRequired: true,
        channels: { inApp: true, email: true },
        metadata: {
            groupCode: schedule.group?.groupCode,
            role,
            action
        }
    };

    const supervisorId = schedule.supervisor._id || schedule.supervisor;
    return await createNotification(supervisorId, content, schedule);
};

/**
 * 3️⃣ Notify Internal Evaluators
 * Only when assigned to evaluations
 */
const notifyInternalEvaluators = async (schedule) => {
    const evaluatorEventTypes = [
        'Proposal Defense',
        'Interim Evaluation I',
        'Mid-Term Evaluation II',
        'Final Viva'
    ];

    if (!evaluatorEventTypes.includes(schedule.eventType) ||
        !schedule.internalEvaluators ||
        schedule.internalEvaluators.length === 0) {
        return [];
    }

    const content = {
        type: 'Schedule Created',
        title: `Evaluator Assignment: ${schedule.eventType}`,
        message: `You have been assigned as an evaluator.

Evaluation: ${schedule.eventType}
Group: ${schedule.group?.groupCode || 'N/A'}
Date: ${formatDate(schedule.eventDate)}
Time: ${schedule.startTime} - ${schedule.endTime}
Venue: ${schedule.venue || 'TBD'}
${schedule.isOnline && schedule.meetingLink ? '\n🔗 Meeting Link: ' + schedule.meetingLink : ''}

Rubric will be available in your dashboard.`,
        priority: 'Medium',
        actionRequired: true,
        channels: { inApp: true, email: true },
        metadata: {
            hideOtherEvaluators: true,
            showOnlyAssignedGroup: true,
            groupCode: schedule.group?.groupCode
        }
    };

    const evaluatorIds = schedule.internalEvaluators.map(e => e._id || e);
    return await createNotifications(evaluatorIds, content, schedule);
};

/**
 * 4️⃣ Notify External Evaluator
 * ONLY for Final Viva - with secure magic link
 */
const notifyExternalEvaluator = async (schedule) => {
    if (schedule.eventType !== 'Final Viva' || !schedule.externalEvaluator) {
        return [];
    }

    // Check if magic link is available (generated during schedule creation)
    const magicLinkText = schedule.magicLink
        ? `\n\n🔐 Secure Access Link:\n${schedule.magicLink}\n\nThis link is valid until: ${schedule.accessEndDate ? formatDate(schedule.accessEndDate) : 'End of evaluation period'}`
        : `\n\nA secure access link will be sent to your email shortly.`;

    const content = {
        type: 'Access Granted',
        title: `Final Viva Evaluation Assignment`,
        message: `You have been invited to evaluate a Final Year Project.

Event: Final Viva / Final Defense
Date: ${formatDate(schedule.eventDate)}
Time: ${schedule.startTime} - ${schedule.endTime}
Venue: ${schedule.venue || 'TBD'}${magicLinkText}

IMPORTANT: 
- This is a secure, time-limited access
- You will have access to project materials
- Please complete your evaluation before the deadline`,
        priority: 'Urgent',
        actionRequired: true,
        channels: { inApp: false, email: true },  // Email only for security
        metadata: {
            securityLevel: 'High',
            expiryDate: schedule.accessEndDate,
            eventType: 'Final Viva',
            magicLink: schedule.magicLink || null
        }
    };

    const evaluatorId = schedule.externalEvaluator._id || schedule.externalEvaluator;
    return await createNotification(evaluatorId, content, schedule);
};

/**
 * 5️⃣ Notify Coordinator (Self-Confirmation)
 */
const notifyCoordinator = async (schedule, action = 'created') => {
    if (!schedule.createdBy) return [];

    const participantCount = {
        students: schedule.students?.length || 0,
        evaluators: schedule.internalEvaluators?.length || 0,
        supervisor: schedule.supervisor ? 1 : 0,
        external: schedule.externalEvaluator ? 1 : 0
    };

    const content = {
        type: 'Coordinator Confirmation',
        title: `Schedule ${action}: ${schedule.eventType}`,
        message: `Action: Schedule ${action}
Event: ${schedule.eventType}
Group: ${schedule.group?.groupCode || 'All Groups'}
Date: ${formatDate(schedule.eventDate)}

Notifications sent to:
- ${participantCount.students} student(s)
- ${participantCount.evaluators} internal evaluator(s)
- ${participantCount.supervisor ? 'Supervisor' : 'No supervisor'}
${participantCount.external ? '- External evaluator' : ''}`,
        priority: 'Low',
        actionRequired: false,
        channels: { inApp: true, email: false },
        metadata: {
            action,
            participantCount
        }
    };

    const coordinatorId = schedule.createdBy._id || schedule.createdBy;
    return await createNotification(coordinatorId, content, schedule);
};

/**
 * 6️⃣ Notify HOD (Summary-Level)
 * Only for: Final Viva, Re-Evaluation, Result Publication
 */
const notifyHOD = async (schedule) => {
    const hodNotificationEvents = [
        'Final Viva',
        'Re-Evaluation',
        'Result Publication'
    ];

    if (!hodNotificationEvents.includes(schedule.eventType)) {
        return [];
    }

    const hodUser = await User.findOne({ role: 'HOD' });
    if (!hodUser) return [];

    const additionalInfo = schedule.eventType === 'Re-Evaluation'
        ? '\n\nReason: Fairness audit / Committee request'
        : '';

    const content = {
        type: 'Schedule Created',
        title: `${schedule.eventType} - Summary Update`,
        message: `Event Type: ${schedule.eventType}
${schedule.group ? 'Group: ' + schedule.group.groupCode : 'All Groups'}
Date: ${formatDate(schedule.eventDate)}${additionalInfo}`,
        priority: 'Medium',
        actionRequired: false,
        channels: { inApp: true, email: true },
        metadata: {
            summaryLevel: true,
            eventType: schedule.eventType
        }
    };

    return await createNotification(hodUser._id, content, schedule);
};

/**
 * Send Conflict Alert to Coordinator
 */
const sendConflictAlert = async (conflicts, coordinatorId) => {
    if (!conflicts || conflicts.length === 0) return null;

    const conflictList = conflicts.map(c => `- ${c.type}: ${c.message}`).join('\n');

    const content = {
        type: 'Conflict Alert',
        title: `⚠️ Scheduling Conflict Detected`,
        message: `${conflicts.length} conflict(s) found:

${conflictList}

Please review and reschedule if necessary.`,
        priority: 'High',
        actionRequired: true,
        channels: { inApp: true, email: true },
        metadata: {
            conflicts
        }
    };

    return await createNotification(coordinatorId, content, null);
};

/**
 * Main function: Send all schedule notifications
 */
const sendScheduleNotifications = async (schedule, action = 'Schedule Created') => {
    try {
        console.log('\n📧 ========== SENDING SCHEDULE NOTIFICATIONS ==========');
        console.log(`Event: ${schedule.eventType}`);
        console.log(`Action: ${action}`);
        console.log('=====================================================\n');

        const notifications = [];

        // Populate schedule if needed
        if (!schedule.populated('students')) {
            await schedule.populate([
                { path: 'students', select: 'name email' },
                { path: 'supervisor', select: 'name email' },
                { path: 'internalEvaluators', select: 'name email' },
                { path: 'externalEvaluator', select: 'name email' },
                { path: 'group', select: 'groupCode' },
                { path: 'createdBy', select: 'name email' }
            ]);
        }

        // 1. Notify Students
        console.log('1️⃣ Notifying Students...');
        // ACTION CHECK: Only notify students on created, updated, rescheduled, cancelled
        if (action !== 'completed') {
            const studentNotifications = await notifyStudents(schedule);
            if (studentNotifications.length > 0) {
                console.log(`   ✅ Sent to ${studentNotifications.length} students`);
                notifications.push(...studentNotifications);
            }
        } else {
            console.log(`   ⏭️  Skipping students for completion event`);
        }

        // 2. Notify Supervisor (Handles all actions including completed)
        console.log('\n2️⃣ Notifying Supervisor...');
        const supervisorNotification = await notifySupervisor(schedule, action);
        if (supervisorNotification) {
            console.log(`   ✅ Sent to ${schedule.supervisor?.name || 'Supervisor'} (${schedule.supervisor?.email || 'N/A'})`);
            notifications.push(supervisorNotification);
        } else {
            console.log(`   ⏭️  No supervisor assigned or not applicable for this event`);
        }

        // 3. Notify Internal Evaluators
        // Only notify on Creation/Update/Cancel, not completion (they did it!)
        console.log('\n3️⃣ Notifying Internal Evaluators...');
        if (action !== 'completed') {
            const evaluatorNotifications = await notifyInternalEvaluators(schedule);
            if (evaluatorNotifications.length > 0) {
                console.log(`   ✅ Sent to ${evaluatorNotifications.length} internal evaluators`);
                notifications.push(...evaluatorNotifications);
            }
        }

        // 4. Notify External Evaluator
        // Only notify on Creation/Update/Cancel
        if (action !== 'completed') {
            console.log('\n4️⃣ Notifying External Evaluator...');
            const externalNotification = await notifyExternalEvaluator(schedule);
            if (externalNotification) {
                console.log(`   ✅ Sent to External Evaluator`);
                notifications.push(externalNotification);
            }
        }

        // 5. Notify Coordinator (Self-confirmation)
        console.log('\n5️⃣ Notifying Coordinator...');
        const coordinatorNotification = await notifyCoordinator(schedule, action);
        if (coordinatorNotification) {
            console.log(`   ✅ Confirmation sent to Coordinator`);
            notifications.push(coordinatorNotification);
        }

        // 6. Notify HOD
        // Only notify HOD on Final Viva Completion
        if (action === 'completed' && schedule.eventType === 'Final Viva') {
            console.log('\n6️⃣ Notifying HOD...');
            const hodNotification = await notifyHOD(schedule);
            if (hodNotification) {
                console.log(`   ✅ Summary sent to HOD`);
                notifications.push(hodNotification);
            }
        }

        console.log('\n=====================================================');
        console.log(`✅ TOTAL: Sent ${notifications.length} notifications for ${schedule.eventType}`);
        console.log('=====================================================\n');

        return notifications;
    } catch (error) {
        console.error('\n❌ ERROR sending schedule notifications:', error);
        console.error('Stack:', error.stack);
        return [];
    }
};

module.exports = {
    sendScheduleNotifications,
    sendConflictAlert,
    createNotification,
    createNotifications
};
