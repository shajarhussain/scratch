const User = require('../models/userModel');
const Group = require('../models/groupModel');
const Proposal = require('../models/proposalModel');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Admin
const createUser = async (req, res) => {
    const { name, email, password, role, studentId, registrationNumber, department, affiliation } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if studentId or registrationNumber already exists
        if (studentId) {
            const studentExists = await User.findOne({ studentId });
            if (studentExists) {
                return res.status(400).json({ message: 'Student ID already exists' });
            }
        }

        if (registrationNumber) {
            const regExists = await User.findOne({ registrationNumber });
            if (regExists) {
                return res.status(400).json({ message: 'Registration number already exists' });
            }
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            studentId,
            registrationNumber,
            department,
            affiliation
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                registrationNumber: user.registrationNumber,
                message: 'User created successfully'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        user.department = req.body.department || user.department;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Admin
const getSystemStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'Student' });
        const totalSupervisors = await User.countDocuments({ role: 'Supervisor' });
        const totalCoordinators = await User.countDocuments({ role: 'Coordinator' });
        const totalGroups = await Group.countDocuments();
        const totalProposals = await Proposal.countDocuments();
        const approvedProposals = await Proposal.countDocuments({ status: 'Approved' });
        const pendingProposals = await Proposal.countDocuments({ status: 'Pending' });

        res.json({
            totalUsers,
            totalStudents,
            totalSupervisors,
            totalCoordinators,
            totalGroups,
            totalProposals,
            approvedProposals,
            pendingProposals
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getSystemStats
};
