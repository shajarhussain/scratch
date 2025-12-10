const mongoose = require('mongoose');

const editHistorySchema = new mongoose.Schema({
    editedAt: {
        type: Date,
        default: Date.now
    },
    editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    changes: String
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
    filename: String,
    filepath: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const supervisorLogSchema = new mongoose.Schema({
    // Basic Metadata
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    groupCode: {
        type: String,
        required: true,
        index: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Null means group log, otherwise individual
    },
    logNumber: {
        type: Number,
        required: true
    },
    meetingDate: {
        type: Date,
        required: true
    },
    meetingType: {
        type: String,
        enum: ['Weekly', 'Bi-weekly', 'Online', 'In-person', 'Ad-hoc'],
        default: 'Weekly'
    },

    // Attendance
    attendanceStatus: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        required: true
    },
    absenceReason: String,

    // Progress Evaluation
    workReviewed: {
        type: String,
        required: true
    },
    progressStatus: {
        type: String,
        enum: ['On Track', 'Slightly Delayed', 'Seriously Delayed'],
        required: true
    },
    qualityAssessment: {
        type: String,
        enum: ['Excellent', 'Good', 'Satisfactory', 'Poor'],
        required: true
    },

    // Supervisor Feedback
    strengthsObserved: String,
    issuesIdentified: String,
    correctionsRequired: String, // Hidden from students
    suggestionsGuidance: String,

    // Internal Notes (NOT visible to students)
    internalRemarks: String,
    utilizationFlag: String,
    performanceIndicators: mongoose.Schema.Types.Mixed,

    // Next Actions
    tasksAssigned: String,
    expectedDeliverables: String,
    nextReviewDeadline: Date,

    // Decision Flags
    logStatus: {
        type: String,
        enum: ['Approved', 'Needs Revision', 'Warning Issued'],
        default: 'Approved'
    },
    warningDetails: String,

    // System Generated
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    lastEditedAt: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    },
    editHistory: [editHistorySchema],

    // Attachments
    attachments: [attachmentSchema],

    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
supervisorLogSchema.index({ group: 1, logNumber: -1 });
supervisorLogSchema.index({ supervisor: 1, meetingDate: -1 });
supervisorLogSchema.index({ student: 1, meetingDate: -1 });
supervisorLogSchema.index({ progressStatus: 1 });
supervisorLogSchema.index({ logStatus: 1 });

// Update lastEditedAt and increment version on save
supervisorLogSchema.pre('save', async function () {
    if (!this.isNew && this.isModified()) {
        this.lastEditedAt = new Date();
        this.version += 1;
    }
});

// Static method to get student-visible fields
supervisorLogSchema.statics.getStudentVisibleFields = function () {
    return [
        'logNumber', 'meetingDate', 'meetingType', 'attendanceStatus',
        'progressStatus', 'qualityAssessment', 'strengthsObserved',
        'issuesIdentified', 'suggestionsGuidance', 'tasksAssigned',
        'expectedDeliverables', 'nextReviewDeadline', 'logStatus',
        'warningDetails', 'attachments', 'submittedAt'
    ];
};

const SupervisorLog = mongoose.model('SupervisorLog', supervisorLogSchema);

module.exports = SupervisorLog;
