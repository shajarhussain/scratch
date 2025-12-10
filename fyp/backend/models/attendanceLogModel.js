const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
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
        required: true
    },
    sessionDate: {
        type: Date,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    attendanceStatus: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Excused'],
        required: true
    },
    remarks: {
        type: String
    },

    // Grading fields
    supervisorMarks: {
        type: Number,
        min: 0,
        max: 100
    },
    internalMarks: {
        type: Number,
        min: 0,
        max: 100
    },
    externalMarks: {
        type: Number,
        min: 0,
        max: 100
    },
    totalMarks: {
        type: Number
    },
    grade: {
        type: String,
        enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', '']
    },

    supervisorFeedback: {
        type: String
    },
    isImportant: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Pending', 'Graded', 'Reviewed'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
attendanceLogSchema.index({ group: 1, sessionDate: -1 });
attendanceLogSchema.index({ student: 1, sessionDate: -1 });
attendanceLogSchema.index({ groupCode: 1, sessionDate: -1 });
attendanceLogSchema.index({ isImportant: 1 });

// Calculate total marks before saving
attendanceLogSchema.pre('save', function (next) {
    if (this.supervisorMarks || this.internalMarks || this.externalMarks) {
        this.totalMarks = (this.supervisorMarks || 0) + (this.internalMarks || 0) + (this.externalMarks || 0);

        // Auto-calculate grade based on percentage
        const percentage = (this.totalMarks / 300) * 100;
        if (percentage >= 90) this.grade = 'A+';
        else if (percentage >= 85) this.grade = 'A';
        else if (percentage >= 80) this.grade = 'A-';
        else if (percentage >= 75) this.grade = 'B+';
        else if (percentage >= 70) this.grade = 'B';
        else if (percentage >= 65) this.grade = 'B-';
        else if (percentage >= 60) this.grade = 'C+';
        else if (percentage >= 55) this.grade = 'C';
        else if (percentage >= 50) this.grade = 'C-';
        else if (percentage >= 40) this.grade = 'D';
        else this.grade = 'F';

        this.status = 'Graded';
    }
    next();
});

const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);

module.exports = AttendanceLog;
