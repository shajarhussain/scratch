const mongoose = require('mongoose');

// Sub-schema for individual evaluator scores
const evaluatorScoreSchema = new mongoose.Schema({
    evaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['Supervisor', 'Internal', 'External'],
        required: true
    },
    marksSubmitted: {
        type: Boolean,
        default: false
    },
    submittedAt: Date,

    // Rubric-based scores
    scores: {
        technical: { type: Number, min: 0, max: 30, default: 0 },
        implementation: { type: Number, min: 0, max: 25, default: 0 },
        presentation: { type: Number, min: 0, max: 20, default: 0 },
        documentation: { type: Number, min: 0, max: 15, default: 0 },
        innovation: { type: Number, min: 0, max: 10, default: 0 },
        total: { type: Number, min: 0, max: 100, default: 0 }
    },

    comments: String,
    strengths: String,
    weaknesses: String,
    suggestions: String,

    recommendation: {
        type: String,
        enum: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Fail', '']
    },

    // Individual student assessment (optional/if required)
    studentScores: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        vivaScore: { type: Number, default: 0 },
        contributionScore: { type: Number, default: 0 },
        comments: String
    }]
}, { _id: false });

const evaluationSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    evaluationType: {
        type: String,
        enum: [
            'Proposal Defense',
            'Interim Evaluation I',
            'Mid-Term Evaluation II',
            'Final Viva'
        ],
        required: true
    },

    // Link to schedule
    schedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule'
    },

    // Old panel field (keep for backward compatibility)
    panel: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // NEW: Individual evaluator scores
    evaluators: [evaluatorScoreSchema],

    // Evaluation details
    evaluationDate: Date,
    deadline: Date,
    venue: String,

    // Aggregate scores
    averageScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    finalGrade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C', 'F', 'Pending', ''],
        default: 'Pending'
    },

    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },

    // Old marks field (keep for backward compatibility)
    marks: {
        supervisor: { type: Number, default: 0 },
        internal: { type: Number, default: 0 },
        external: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },

    feedback: String,

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Method: Check if evaluator can submit scores
evaluationSchema.methods.canEvaluatorSubmit = function (userId) {
    const evaluator = this.evaluators.find(e => e.evaluator.toString() === userId.toString());
    return evaluator && !evaluator.marksSubmitted;
};

// Method: Calculate average score from all evaluators
evaluationSchema.methods.calculateAverageScore = function () {
    const submittedScores = this.evaluators.filter(e => e.marksSubmitted);

    if (submittedScores.length === 0) {
        this.averageScore = 0;
        return 0;
    }

    const totalScore = submittedScores.reduce((sum, e) => sum + e.scores.total, 0);
    this.averageScore = Math.round(totalScore / submittedScores.length);

    // Calculate grade
    this.finalGrade = this.calculateGrade(this.averageScore);

    return this.averageScore;
};

// Method: Calculate grade from score
evaluationSchema.methods.calculateGrade = function (score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'F';
};

// Method: Check if evaluation is complete
evaluationSchema.methods.isComplete = function () {
    return this.evaluators.every(e => e.marksSubmitted);
};

// Method: Get pending evaluators
evaluationSchema.methods.getPendingEvaluators = function () {
    return this.evaluators.filter(e => !e.marksSubmitted);
};

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation;
