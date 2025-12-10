const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fyp_management')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ Error:', err));

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    registrationNumber: String,
    department: String
});

const User = mongoose.model('User', userSchema);

const createCoordinator = async () => {
    try {
        console.log('\n🚀 Creating Coordinator for Testing...\n');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('test123', salt);

        await User.deleteOne({ email: 'coord001@test.com' });
        console.log('🗑️  Cleaned up old coordinator');

        const coordinator = new User({
            name: 'Test Coordinator',
            email: 'coord001@test.com',
            password: hashedPassword,
            role: 'Coordinator',
            registrationNumber: 'COORD001',
            department: 'CS'
        });

        await coordinator.save();
        console.log('✅ Created Coordinator\n');

        console.log('='.repeat(60));
        console.log('✅ CREDENTIALS READY FOR TESTING');
        console.log('='.repeat(60));
        console.log('\n📋 COORDINATOR:');
        console.log('   Email: coord001@test.com');
        console.log('   Password: test123');
        console.log('   Role: Coordinator\n');
        console.log('📋 INTERNAL EVALUATOR:');
        console.log('   Email: evaluator001@test.com');
        console.log('   Password: test123');
        console.log('   Role: InternalEvaluator\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
};

createCoordinator();
