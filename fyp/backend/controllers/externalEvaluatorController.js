const crypto = require('crypto');
const User = require('../models/userModel');
const ExternalToken = require('../models/externalTokenModel');
const sendEmail = require('../utils/emailService');
const generateToken = require('../utils/generateToken'); // Assumed existing utility for JWT

// @desc    Invite External Evaluator
// @route   POST /api/external/invite
// @access  Coordinator/Admin
const inviteEvaluator = async (req, res) => {
    const { name, email, affiliation, assignedGroups } = req.body;

    try {
        // 1. Check if user exists or create new
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                password: crypto.randomBytes(20).toString('hex'), // Random password for now
                role: 'ExternalEvaluator',
                affiliation,
                assignedGroups
            });
        } else {
            // Update existing user with new details/groups
            user.name = name || user.name;
            user.affiliation = affiliation || user.affiliation;
            // Merge assigned groups if needed, or overwrite. For now overwrite to keep clean context.
            user.assignedGroups = assignedGroups;
            user.role = 'ExternalEvaluator'; // Ensure role is set
            await user.save();
        }

        // 2. Generate Magic Link Token
        // Generate random 128-bit token (16 bytes)
        const rawToken = crypto.randomBytes(16).toString('hex');

        // Hash it for storage
        const tokenHash = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');

        // Set expiry (e.g., 24 hours from now) or based on defense date
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await ExternalToken.create({
            tokenHash,
            user: user._id,
            expiresAt,
            coordinatorId: req.user._id // Assumes authMiddleware populates req.user
        });

        // 3. Send Email
        // Construct link (assuming frontend is on port 5173 or similar, need ENV for base URL)
        // using localhost:5173 for dev as standard
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const accessUrl = `${frontendUrl}/eval/access?token=${rawToken}`;

        const message = `
            You have been invited as an External Evaluator for the Final Year Project defense.
            
            Please click the following link to access the evaluation dashboard:
            ${accessUrl}
            
            This link will expire in 24 hours.
        `;

        await sendEmail({
            email: user.email,
            subject: 'FYP External Evaluator Invitation',
            message
        });

        res.status(200).json({ success: true, message: 'Invitation sent', debugToken: rawToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Validate Magic Link Token and Login
// @route   POST /api/external/validate-access
// @access  Public
const validateAccess = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    try {
        // Hash incoming token to match DB
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const externalToken = await ExternalToken.findOne({
            tokenHash,
            isActive: true,
            expiresAt: { $gt: Date.now() }
        }).populate('user');

        if (!externalToken) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const user = externalToken.user;

        // Generate JWT session
        const jwtToken = generateToken(user._id);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: jwtToken,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    inviteEvaluator,
    validateAccess,
};
