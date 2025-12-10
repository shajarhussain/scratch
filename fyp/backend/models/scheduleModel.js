const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
    sentTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['Email', 'In-App', 'SMS'],
        default: 'In-App'
    }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
    // Event Type (9 categories)
    eventType: {
        type: String,
        enum: [
            'Proposal Defense',
            'Interim Evaluation I',
            'Mid-Term Evaluation II',
            'Final Viva',
            'External Evaluator Access',
            'Rescheduled Defense',
            'Submission Deadline',
            'Re-Evaluation',
            'Result Publication'
        ],
        required: true
    },

    // Scheduling Details
    eventDate: {
        type: Date,
        required: function () {
            return this.eventType !== 'External Evaluator Access';
        }
    },
    startTime: String,  // Format: "HH:MM"
    endTime: String,    // Format: "HH:MM"
    venue: String,      // Physical location or "Online"
    isOnline: {
        type: Boolean,
        default: false
    },
    meetingLink: String,

    // Group/Student Assignment
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Panel Members
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    internalEvaluators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    externalEvaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Status & Tracking
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'Deferred'],
        default: 'Scheduled'
    },

    // For External Access Window
    accessStartDate: Date,
    accessEndDate: Date,
    groupsAssigned: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],

    // For Deadlines
    deadlineType: {
        type: String,
        enum: ['Final Report', 'Code Submission', 'Presentation', 'Proposal Document']
    },
    allowExtensions: {
        type: Boolean,
        default: false
    },

    // Rescheduling History
    originalDate: Date,
    reschedulingReason: String,
    rescheduledFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule'
    },

    // Result Publication
    resultPublicationDate: Date,
    gradeLockDate: Date,

    // Notifications
    notificationsSent: {
        type: Boolean,
        default: false
    },
    notificationLog: [notificationLogSchema],

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: String,
    attachments: [String],

    // Additional event details
    description: String,
    // SRS Workflow Fields
    srsUploadStartDate: Date, // When students can start uploading
    srsDeliverable: {
        fileUrl: String,
        submittedAt: Date,
        status: {
            type: String,
            enum: ['Pending', 'Submitted', 'Under Review', 'Approved'],
            default: 'Pending'
        },
        supervisorApproved: {
            type: Boolean,
            default: false
        },
        supervisorApprovedAt: Date,
        supervisorComments: String
    },
    artifacts: [new mongoose.Schema({
        name: String,
        fileUrl: String,
        type: String, // e.g., 'Report', 'Slide', 'Code'
        uploadedAt: { type: Date, default: Date.now },
        description: String
    }, { _id: true })],

    // Magic Link (Cached for External Evaluator access)
    magicLink: String,

}, {
    timestamps: true
});

// Indexes for performance
scheduleSchema.index({ eventType: 1, eventDate: 1 });
scheduleSchema.index({ group: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ eventDate: 1, status: 1 });
scheduleSchema.index({ createdBy: 1 });

// Virtual for checking if event is upcoming
scheduleSchema.virtual('isUpcoming').get(function () {
    if (!this.eventDate) return false;
    return this.eventDate > new Date() && this.status === 'Scheduled';
});

// Method to get all participants
scheduleSchema.methods.getAllParticipants = function () {
    const participants = [];

    if (this.students && this.students.length > 0) {
        participants.push(...this.students);
    }
    if (this.supervisor) {
        participants.push(this.supervisor);
    }
    if (this.internalEvaluators && this.internalEvaluators.length > 0) {
        participants.push(...this.internalEvaluators);
    }
    if (this.externalEvaluator) {
        participants.push(this.externalEvaluator);
    }

    // Remove duplicates
    return [...new Set(participants.map(p => p.toString()))];
};

// Method to check if user is a participant
scheduleSchema.methods.isParticipant = function (userId) {
    const participants = this.getAllParticipants();
    return participants.includes(userId.toString());
};

module.exports = mongoose.model('Schedule', scheduleSchema);
