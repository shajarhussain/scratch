const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fyp_management')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ Connection Error:', err));

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    studentId: String,
    registrationNumber: String,
    department: String
});

const User = mongoose.model('User', userSchema);

const createUsers = async () => {
    try {
        console.log('\n🚀 Creating test users...\n');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('test123', salt);

        await User.deleteOne({ email: 'evaluator001@test.com' });
        console.log('🗑️  Cleaned up old evaluator');

        const evaluator = new User({
            name: 'Dr. Sarah Wilson',
            email: 'evaluator001@test.com',
            password: hashedPassword,
            role: 'InternalEvaluator',
            registrationNumber: 'EVAL001',
            department: 'CS'
        });

        await evaluator.save();
        console.log('✅ Created Internal Evaluator');

        const testUser = await User.findOne({ email: 'evaluator001@test.com' });
        const passwordWorks = await bcrypt.compare('test123', testUser.password);

        console.log('\n' + '='.repeat(60));
        console.log('✅ SETUP COMPLETE!');
        console.log('='.repeat(60));
        console.log('\n📋 LOGIN CREDENTIALS:\n');
        console.log('   Email: evaluator001@test.com');
        console.log('   Password: test123');
        console.log('   Role: InternalEvaluator');
        console.log('\n   Password verification:', passwordWorks ? '✅ WORKING' : '❌ FAILED');
        console.log('\n🎯 Now try logging in!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
};

createUsers();
