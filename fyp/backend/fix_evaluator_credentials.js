const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fyp_management')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const User = require('./models/userModel');

const fixEvaluatorCredentials = async () => {
    try {
        console.log('\n🔧 Fixing Internal Evaluator Credentials...\n');

        // Find the evaluator
        const evaluator = await User.findOne({ email: 'sarah.wilson@test.com' });

        if (!evaluator) {
            console.log('❌ Evaluator not found. Creating new one...');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('evaluator123', salt);

            const newEvaluator = await User.create({
                name: 'Dr. Sarah Wilson',
                email: 'sarah.wilson@test.com',
                password: hashedPassword,
                role: 'InternalEvaluator',
                registrationNumber: 'IE001',
                department: 'CS'
            });

            console.log('✅ Created new evaluator');
        } else {
            console.log('✅ Found evaluator:', evaluator.name);
            console.log('   Email:', evaluator.email);
            console.log('   Role:', evaluator.role);

            // Reset password
            console.log('\n🔄 Resetting password...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('evaluator123', salt);

            evaluator.password = hashedPassword;
            await evaluator.save();

            console.log('✅ Password reset successfully');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ CREDENTIALS FIXED!');
        console.log('='.repeat(60));
        console.log('\n📋 USE THESE CREDENTIALS TO LOGIN:\n');
        console.log('   Email: sarah.wilson@test.com');
        console.log('   Password: evaluator123');
        console.log('   Role: InternalEvaluator\n');
        console.log('🎯 Try logging in now at http://localhost:5173/login\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
};

fixEvaluatorCredentials();
