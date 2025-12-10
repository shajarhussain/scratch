const mongoose = require('mongoose');

const progressLogSchema = mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    weekNumber: {
        type: Number,
        required: true
    },
    tasksCompleted: {
        type: String,
        required: true
    },
    tasksPlanned: {
        type: String,
        required: true
    },
    issues: {
        type: String
    },
    supervisorComment: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed'],
        default: 'Pending'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ProgressLog', progressLogSchema);
