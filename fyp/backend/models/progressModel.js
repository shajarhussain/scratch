const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    weekNumber: {
        type: Number,
        required: true
    },
    weekStartDate: {
        type: Date,
        required: true
    },
    tasksCompleted: {
        type: String,
        required: true
    },
    nextWeekTasks: {
        type: String,
        required: true
    },
    challenges: {
        type: String
    },
    hoursSpent: {
        type: Number,
        min: 0
    },
    supervisorFeedback: {
        type: String
    },
    status: {
        type: String,
        enum: ['Submitted', 'Reviewed'],
        default: 'Submitted'
    }
}, {
    timestamps: true
});

// Index for efficient queries
progressSchema.index({ group: 1, weekNumber: -1 });
progressSchema.index({ submittedBy: 1, createdAt: -1 });

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
