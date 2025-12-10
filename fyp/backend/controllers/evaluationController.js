const Evaluation = require('../models/evaluationModel');
const Group = require('../models/groupModel');
const User = require('../models/userModel');

// @desc    Schedule a defense (Coordinator)
// @route   POST /api/evaluations/schedule
// @access  Private (Coordinator)
const scheduleDefense = async (req, res) => {
    const { groupId, stage, panelIds, date, venue } = req.body;

    try {
        // Validate Group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Validate Panel
        // In a real app, verify each ID exists and has correct role (Internal/External)

        const evaluation = await Evaluation.create({
            group: groupId,
            stage,
            panel: panelIds,
            date,
            venue
        });

        res.status(201).json(evaluation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get evaluations for a group
// @route   GET /api/evaluations/group/:groupId
// @access  Private
const getGroupEvaluations = async (req, res) => {
    try {
        const evaluations = await Evaluation.find({ group: req.params.groupId })
            .populate('panel', 'name role')
            .sort({ date: 1 });
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit marks (Evaluator)
// @route   PUT /api/evaluations/:id/marks
// @access  Private (Evaluator/Supervisor)
const submitMarks = async (req, res) => {
    const { supervisor, internal, external, feedback } = req.body;

    try {
        // Validate ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid evaluation ID format. Please provide a valid evaluation ID from the system.'
            });
        }

        const evaluation = await Evaluation.findById(req.params.id);

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        // Update marks if provided
        if (supervisor !== undefined) evaluation.marks.supervisor = supervisor;
        if (internal !== undefined) evaluation.marks.internal = internal;
        if (external !== undefined) evaluation.marks.external = external;

        // Calculate total (Simple sum for now, can be weighted)
        evaluation.marks.total = evaluation.marks.supervisor + evaluation.marks.internal + evaluation.marks.external;

        if (feedback) evaluation.feedback = feedback;

        evaluation.status = 'Completed';

        await evaluation.save();
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all evaluations
// @route   GET /api/evaluations
// @access  Private (Coordinator, Admin)
const getAllEvaluations = async (req, res) => {
    try {
        const evaluations = await Evaluation.find({})
            .populate('group', 'members')
            .populate('panel', 'name role')
            .sort({ date: -1 });
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEvaluationBySchedule = async (req, res) => {
    try {
        const evaluation = await Evaluation.findOne({ schedule: req.params.scheduleId })
            .populate('group', 'groupCode members')
            .populate('panel', 'name role')
            .populate({
                path: 'evaluators.evaluator',
                select: 'name role email'
            }); // Deep populate evaluator details

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { scheduleDefense, getAllEvaluations, getGroupEvaluations, submitMarks, getEvaluationBySchedule };
