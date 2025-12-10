require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');

const checkSupervisor = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');

        // Check all supervisors
        const supervisors = await User.find({ role: 'Supervisor' });
        console.log(`📋 Total Supervisors: ${supervisors.length}\n`);

        if (supervisors.length > 0) {
            supervisors.forEach((s, i) => {
                console.log(`${i + 1}. Name: ${s.name}`);
                console.log(`   Email: ${s.email}`);
                console.log(`   Registration Number: ${s.registrationNumber || 'NOT SET'}`);
                console.log(`   Role: ${s.role}`);
                console.log('');
            });
        }

        // Check for RE08 specifically
        const re08 = await User.findOne({ registrationNumber: 'RE08', role: 'Supervisor' });
        if (re08) {
            console.log('✅ Found supervisor with RE08:');
            console.log(`   Name: ${re08.name}`);
            console.log(`   Email: ${re08.email}`);
        } else {
            console.log('❌ No supervisor found with registrationNumber: RE08');

            // Check if exists with different field name
            const anyRE08 = await User.findOne({
                $or: [
                    { registrationNumber: 'RE08' },
                    { studentId: 'RE08' },
                    { employeeId: 'RE08' }
                ]
            });

            if (anyRE08) {
                console.log('\n⚠️  User with RE08 found but field mismatch:');
                console.log(JSON.stringify(anyRE08.toObject(), null, 2));
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkSupervisor();
