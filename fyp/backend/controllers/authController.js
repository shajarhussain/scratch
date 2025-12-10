const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Check if role matches
            if (req.body.role && user.role !== req.body.role) {
                return res.status(401).json({ message: 'Invalid role selected for this user' });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public (or Admin only in production)
const registerUser = async (req, res) => {
    const { name, email, password, role, studentId, department } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            studentId,
            department,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all supervisors
// @route   GET /api/users/supervisors
// @access  Public (or Private)
const getSupervisors = async (req, res) => {
    try {
        const supervisors = await User.find({ role: 'Supervisor' }).select('_id name department');
        res.json(supervisors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password using enrollment/registration number
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { identifier, newPassword } = req.body; // identifier can be studentId or registrationNumber

    try {
        // Try to find user by studentId or registrationNumber
        let user = await User.findOne({
            $or: [
                { studentId: identifier },
                { registrationNumber: identifier }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'No user found with this enrollment/registration number' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser, registerUser, getSupervisors, forgotPassword, getAllUsers };
