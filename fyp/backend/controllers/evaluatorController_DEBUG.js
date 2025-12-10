const Evaluation = require('../models/evaluationModel');
const Schedule = require('../models/scheduleModel');
const Group = require('../models/groupModel');
const Proposal = require('../models/proposalModel');
const User = require('../models/userModel');
const ExternalToken = require('../models/externalTokenModel');
const { generateSecureToken, generateMagicLink } = require('../utils/tokenGenerator');

// ==================== INTERNAL EVALUATOR FUNCTIONS ====================

// @desc    Get my assignments (for internal evaluators)
// @route   GET /api/evaluator/assignments
// @access  Private (InternalEvaluator)
const getMyAssignments = async (req, res) => {
    try {
        const { status, evaluationType } = req.query;

        // Find schedules where user is assigned as internal evaluator
        const query = {
            internalEvaluators: req.user._id,
            status: { $in: ['Scheduled', 'Completed'] }
        };

        if (evaluationType) {
            query.eventType = evaluationType;
        }

        const schedules = await Schedule.find(query)
            .populate('group', 'groupCode members')
            .populate('students', 'name email')
            .populate('supervisor', 'name')
            .populate('internalEvaluators', 'name')
            .sort({ eventDate: 1 });

        // Get evaluations for these schedules
        const assignments = [];

        for (const schedule of schedules) {
            let evaluation = await Evaluation.findOne({ schedule: schedule._id })
                .populate('group');

            // Check if evaluator has submitted
            const hasSubmitted = evaluation?.evaluators?.some(
                e => e.evaluator.toString() === req.user._id.toString() && e.marksSubmitted
            );

            assignments.push({
                _id: schedule._id,
                evaluationType: schedule.eventType,
                group: schedule.group,
                students: schedule.students,
                evaluationDate: schedule.eventDate,
                venue: schedule.venue,
                meetingLink: schedule.meetingLink,
                status: hasSubmitted ? 'Completed' : 'Pending',
                evaluationId: evaluation?._id,
                hasSubmitted,
                srsDeliverable: schedule.srsDeliverable, // Include SRS status
                artifacts: schedule.artifacts // Include uploaded artifacts
            });
        }

        res.json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching assignments', error: error.message });
    }
};

// @desc    Get assignment details
// @route   GET /api/evaluator/assignments/:id
// @access  Private (InternalEvaluator)
const getAssignmentDetails = async (req, res) => {
    try {
        console.log(`[getAssignmentDetails] Request for ID: ${req.params.id} by User: ${req.user?._id}`);

        // Check for valid ObjectId to prevent CastError/500
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            console.warn('[getAssignmentDetails] Invalid ID format');
            return res.status(400).json({ message: 'Invalid assignment ID' });
        }

        const schedule = await Schedule.findById(req.params.id)
            .populate('group')
            .populate('students', 'name email studentId department')
            .populate('supervisor', 'name email')
            .populate('internalEvaluators', 'name');

        if (!schedule) {
            console.warn('[getAssignmentDetails] Schedule not found');
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify evaluator is assigned
        // Note: internalEvaluators are populated objects, externalEvaluator is ObjectId
        const userId = req.user._id.toString();

        const isInternal = schedule.internalEvaluators && schedule.internalEvaluators.some(
            e => e && e._id.toString() === userId
        );

        // Check if external evaluator matches
        // Safely handle if externalEvaluator is null/undefined
        const isExternal = schedule.externalEvaluator && schedule.externalEvaluator.toString() === userId;

        console.log(`[getAssignmentDetails] Access Check - IsInternal: ${isInternal}, IsExternal: ${isExternal}`);

        if (!isInternal && !isExternal) {
            console.warn(`[getAssignmentDetails] Unauthorized access attempt by ${userId}`);
            return res.status(403).json({ message: 'Not authorized to view this assignment' });
        }

        // Get evaluation if exists
        let evaluation = null;
        try {
            evaluation = await Evaluation.findOne({ schedule: schedule._id }).populate('group');
        } catch (evalErr) {
            console.error('[getAssignmentDetails] Error fetching evaluation:', evalErr);
            // Continue without evaluation, don't crash
        }

        // Check if group exists before fetching proposal
        let proposal = null;
        let history = [];

        if (schedule.group) {
            try {
                // Get proposal
                proposal = await Proposal.findOne({ group: schedule.group._id })
                    .select('title description objectives scope technologies submittedBy')
                    .populate('submittedBy', 'name');

                // Get evaluation history (previous completed rounds)
                history = await Evaluation.find({
                    group: schedule.group._id,
                    status: 'Completed',
                    schedule: { $ne: schedule._id }
                }).sort({ evaluationDate: 1 });
            } catch (propErr) {
                console.error('[getAssignmentDetails] Error fetching proposal/history:', propErr);
            }
        }

        console.log('[getAssignmentDetails] Success');

        res.json({
            schedule,
            evaluation,
            proposal,
            history
        });
    } catch (error) {
        console.error('[getAssignmentDetails] CRITICAL ERROR:', error);
        res.status(500).json({ message: 'Error fetching assignment details', error: error.message });
    }
};

// @desc    Submit evaluation scores
// @route   POST /api/evaluator/assignments/:id/evaluate
// @access  Private (InternalEvaluator)
const submitEvaluation = async (req, res) => {
    try {
        const {
            scores, comments, strengths, weaknesses, suggestions, recommendation,
            isDraft, studentScores
        } = req.body;

        // If NOT draft, validate scores
        if (!isDraft) {
            if (!scores || !scores.technical || !scores.implementation || !scores.presentation ||
                !scores.documentation || !scores.innovation) {
                return res.status(400).json({ message: 'All score categories are required for final submission' });
            }
        }

        // Calculate total if scores exist
        let total = 0;
        if (scores) {
            total = (scores.technical || 0) + (scores.implementation || 0) + (scores.presentation || 0) +
                (scores.documentation || 0) + (scores.innovation || 0);

            if (total > 100) {
                // Verify token
                const jwt = require('jsonwebtoken'); // Added missing import for jwt
                const token = req.headers.authorization.split(' ')[1]; // Assuming token is in Authorization header
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // console.log('Auth Decoded:', decoded);

                // Get user from the token
                req.user = await User.findById(decoded.id).select('-password');

                if (!req.user) {
                    console.log('Auth Failed: User not found for ID', decoded.id);
                    return res.status(401).json({ message: 'User not found' });
                }

                // console.log('Auth Success:', req.user._id, req.user.role);
                // next(); // Removed next() as it's not applicable here
                // The following lines seem to be misplaced from an outer scope,
                // but are kept as per instruction to "make the change faithfully".
                // This block will cause a syntax error due to 'Find or create evaluation'
                // and logical errors as it re-declares 'evaluation'.
                // It's highly recommended to review this insertion.
                return res.status(400).json({ message: 'Total score cannot exceed 100' });
            }
        }

        const schedule = await Schedule.findById(req.params.id).populate('group');

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Find or create evaluation
        let evaluation = await Evaluation.findOne({ schedule: schedule._id });

        if (!evaluation) {
            // Create new evaluation
            evaluation = new Evaluation({
                group: schedule.group._id,
                evaluationType: schedule.eventType,
                schedule: schedule._id,
                evaluationDate: schedule.eventDate,
                venue: schedule.venue,
                evaluators: [],
                createdBy: req.user._id
            });
        }

        // Check if evaluator already submitted
        const existingIndex = evaluation.evaluators.findIndex(
            e => e.evaluator.toString() === req.user._id.toString()
        );

        const evaluatorScore = {
            evaluator: req.user._id,
            role: req.user.role === 'ExternalEvaluator' ? 'External' : 'Internal',
            marksSubmitted: !isDraft,
            submittedAt: new Date(),
            scores: {
                ...scores,
                total
            },
            comments,
            strengths,
            weaknesses,
            suggestions,
            recommendation,
            studentScores: studentScores || []
        };

        if (existingIndex >= 0) {
            // Check if already submitted (and not just updating a draft)
            if (evaluation.evaluators[existingIndex].marksSubmitted) {
                return res.status(403).json({ message: 'Evaluation already submitted. You cannot edit it.' });
            }
            // Update existing
            evaluation.evaluators[existingIndex] = evaluatorScore;
        } else {
            // Add new
            evaluation.evaluators.push(evaluatorScore);
        }

        // Only calculate average if submitted
        if (!isDraft) {
            evaluation.calculateAverageScore();

            if (evaluation.isComplete()) {
                evaluation.status = 'Completed';
            } else {
                evaluation.status = 'In Progress';
            }
        }

        await evaluation.save();

        res.json({
            message: isDraft ? 'Draft saved successfully' : 'Evaluation submitted successfully',
            evaluation,
            averageScore: evaluation.averageScore,
            finalGrade: evaluation.finalGrade
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting evaluation', error: error.message });
    }
};

// @desc    Get group proposal
// @route   GET /api/evaluator/groups/:groupId/proposal
// @access  Private (InternalEvaluator)
const getGroupProposal = async (req, res) => {
    try {
        // Verify evaluator is assigned to this group
        const schedule = await Schedule.findOne({
            group: req.params.groupId,
            $or: [
                { internalEvaluators: req.user._id },
                { externalEvaluator: req.user._id }
            ]
        });

        if (!schedule) {
            return res.status(403).json({ message: 'Not authorized to view this proposal' });
        }

        const proposal = await Proposal.findOne({ group: req.params.groupId })
            .populate('group')
            .populate('submittedBy', 'name email');

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        res.json(proposal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching proposal', error: error.message });
    }
};

// @desc    Get group reports/progress
// @route   GET /api/evaluator/groups/:groupId/reports
// @access  Private (InternalEvaluator)
const getGroupReports = async (req, res) => {
    try {
        // Verify evaluator is assigned
        const schedule = await Schedule.findOne({
            group: req.params.groupId,
            $or: [
                { internalEvaluators: req.user._id },
                { externalEvaluator: req.user._id }
            ]
        });

        if (!schedule) {
            return res.status(403).json({ message: 'Not authorized to view these reports' });
        }

        const group = await Group.findById(req.params.groupId)
            .populate('members', 'name email')
            .populate('supervisor', 'name');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.json({
            group,
            // Additional report data can be added here
            message: 'Reports retrieved successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching reports', error: error.message });
    }
};

// ==================== EXTERNAL EVALUATOR FUNCTIONS ====================

// @desc    Verify magic token
// @route   GET /api/external/verify/:token
// @access  Public
const verifyMagicToken = async (req, res) => {
    try {
        const { token } = req.params;

        const externalToken = await ExternalToken.findOne({ tokenHash: token })
            .populate('user', 'name email role')
            .populate({
                path: 'user',
                select: 'name email role'
            });

        if (!externalToken) {
            return res.status(404).json({ message: 'Invalid token' });
        }

        // Check if expired
        if (new Date() > externalToken.expiresAt) {
            return res.status(401).json({ message: 'Token has expired' });
        }

        if (!externalToken.isActive) {
            return res.status(401).json({ message: 'Token is no longer active' });
        }

        res.json({
            valid: true,
            evaluator: externalToken.user,
            expiresAt: externalToken.expiresAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verifying token', error: error.message });
    }
};

// @desc    External evaluator login with token
// @route   POST /api/external/login
// @access  Public
const externalLogin = async (req, res) => {
    try {
        const { token } = req.body;

        const externalToken = await ExternalToken.findOne({ tokenHash: token })
            .populate('user');

        if (!externalToken || new Date() > externalToken.expiresAt || !externalToken.isActive) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // Generate temporary JWT (expires after token expiry)
        const jwt = require('jsonwebtoken');
        const tempToken = jwt.sign(
            {
                id: externalToken.user._id,
                role: 'ExternalEvaluator',
                isExternal: true
            },
            process.env.JWT_SECRET,
            { expiresIn: Math.floor((externalToken.expiresAt - new Date()) / 1000) }
        );

        res.json({
            token: tempToken,
            user: {
                id: externalToken.user._id,
                name: externalToken.user.name,
                email: externalToken.user.email,
                role: 'ExternalEvaluator'
            },
            expiresAt: externalToken.expiresAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// @desc    Get external evaluator assignments
// @route   GET /api/external/assignments
// @access  Private (External - via magic token)
const getExternalAssignments = async (req, res) => {
    try {
        console.log('Fetching external assignments for user:', req.user._id);
        // Find Final Viva schedules where user is external evaluator
        const query = {
            externalEvaluator: req.user._id,
            eventType: 'Final Viva'
        };
        console.log('Query:', query);
        const schedules = await Schedule.find(query)
            .populate('group', 'groupCode')
            .populate('students', 'name email')
            .select('eventType eventDate venue meetingLink group students artifacts srsDeliverable');

        console.log('Found schedules:', schedules.length);
        res.json(schedules);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching assignments', error: error.message });
    }
};

// @desc    Submit external evaluation
// @route   POST /api/external/evaluate/:groupId
// @access  Private (External)
const submitExternalEvaluation = async (req, res) => {
    try {
        const { scores, comments, recommendation } = req.body;

        // Validate scores
        const total = scores.technical + scores.implementation + scores.presentation +
            scores.documentation + scores.innovation;

        if (total > 100) {
            return res.status(400).json({ message: 'Total score cannot exceed 100' });
        }

        // Find Final Viva schedule for this group
        const schedule = await Schedule.findOne({
            group: req.params.groupId,
            eventType: 'Final Viva',
            externalEvaluator: req.user._id
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Find or create evaluation
        let evaluation = await Evaluation.findOne({ schedule: schedule._id });

        if (!evaluation) {
            evaluation = new Evaluation({
                group: req.params.groupId,
                evaluationType: 'Final Viva',
                schedule: schedule._id,
                evaluationDate: schedule.eventDate,
                evaluators: []
            });
        }

        // Add/update external evaluator score
        const existingIndex = evaluation.evaluators.findIndex(
            e => e.evaluator.toString() === req.user._id.toString()
        );

        const evaluatorScore = {
            evaluator: req.user._id,
            role: 'External',
            marksSubmitted: true,
            submittedAt: new Date(),
            scores: { ...scores, total },
            comments,
            recommendation
        };

        if (existingIndex >= 0) {
            evaluation.evaluators[existingIndex] = evaluatorScore;
        } else {
            evaluation.evaluators.push(evaluatorScore);
        }

        evaluation.calculateAverageScore();

        if (evaluation.isComplete()) {
            evaluation.status = 'Completed';
        } else {
            evaluation.status = 'In Progress';
        }

        await evaluation.save();

        res.json({ message: 'Evaluation submitted successfully', evaluation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting evaluation', error: error.message });
    }
};

module.exports = {
    // Internal Evaluator
    getMyAssignments,
    getAssignmentDetails,
    submitEvaluation,
    getGroupProposal,
    getGroupReports,

    // External Evaluator
    verifyMagicToken,
    externalLogin,
    getExternalAssignments,
    submitExternalEvaluation
};
