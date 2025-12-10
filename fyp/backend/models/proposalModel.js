const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // The supervisor they are requesting
    },
    status: {
        type: String,
        enum: ['Pending Supervisor', 'Pending Coordinator', 'Approved', 'Rejected', 'Changes Requested'],
        default: 'Pending Supervisor'
    },
    fileUrl: {
        type: String
    },
    plagiarismScore: {
        type: Number,
        default: 0
    },
    plagiarismStatus: {
        type: String,
        enum: ['Pending', 'Clean', 'Flagged'],
        default: 'Pending'
    },
    versions: [{
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
        versionNumber: Number
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    version: {
        type: Number,
        default: 1
    },
    archivedBySupervisor: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;
