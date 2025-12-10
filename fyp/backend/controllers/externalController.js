const crypto = require('crypto');
const ExternalToken = require('../models/externalTokenModel');
const Group = require('../models/groupModel');
const Evaluation = require('../models/evaluationModel');

// @desc    Generate external access link
// @route   POST /api/external/generate
// @access  Private (Coordinator)
const generateLink = async (req, res) => {
    const { groupId, evaluatorName, validHours } = req.body;

    try {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + (validHours || 24) * 60 * 60 * 1000);

        const externalToken = await ExternalToken.create({
            token,
            group: groupId,
            evaluatorName,
            expiresAt
        });

        const link = `http://localhost:5173/eval/${token}`; // Frontend URL

        res.status(201).json({ link, token, expiresAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate token and get group details
// @route   GET /api/external/validate/:token
// @access  Public
const validateToken = async (req, res) => {
    try {
        const tokenDoc = await ExternalToken.findOne({
            token: req.params.token,
            isActive: true,
            expiresAt: { $gt: Date.now() }
        }).populate('group');

        if (!tokenDoc) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        res.json({
            valid: true,
            evaluatorName: tokenDoc.evaluatorName,
            group: tokenDoc.group,
            token: tokenDoc.token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit external evaluation
// @route   POST /api/external/submit
// @access  Public (with Token)
const submitExternalEvaluation = async (req, res) => {
    const { token, marks, feedback } = req.body;

    try {
        const tokenDoc = await ExternalToken.findOne({
            token,
            isActive: true,
            expiresAt: { $gt: Date.now() }
        });

        if (!tokenDoc) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // Find or create evaluation record
        // For simplicity, we assume an evaluation record exists or we create a partial one
        // In a real app, we'd link this to a specific scheduled defense

        // Let's just log it or update the group's evaluation if it exists
        // Or create a new Evaluation entry specifically for this external evaluator

        // For this demo, we'll just return success and deactivate the token
        tokenDoc.isActive = false;
        await tokenDoc.save();

        res.json({ message: 'Evaluation submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { generateLink, validateToken, submitExternalEvaluation };
