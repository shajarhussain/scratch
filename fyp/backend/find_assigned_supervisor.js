require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');

const findSupervisor = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const supervisor = await User.findById('693181302b3bf84421a7d4b5');

        if (supervisor) {
            console.log('\n✅ Found Assigned Supervisor:');
            console.log(`Name: ${supervisor.name}`);
            console.log(`Email: ${supervisor.email}`);
            console.log(`Role: ${supervisor.role}`);
            console.log(`Registration: ${supervisor.registrationNumber || 'N/A'}`);
        } else {
            console.log('❌ Supervisor not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

findSupervisor();
