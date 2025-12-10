const mongoose = require('mongoose');
require('dotenv').config();
const SupervisorLog = require('./models/supervisorLogModel');

const testHook = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Allow creating without required refs for just testing the HOOK
        // We might fail validation, so we need valid-ish data
        // But hook runs BEFORE validation? No, validation runs before save.
        // We need valid data.

        // Mocking ObjectIds
        const id = new mongoose.Types.ObjectId();

        const log = new SupervisorLog({
            group: id,
            groupCode: 'TEST-CODE',
            logNumber: 1,
            meetingDate: new Date(),
            attendanceStatus: 'Present',
            workReviewed: 'Test',
            progressStatus: 'On Track',
            qualityAssessment: 'Good',
            logStatus: 'Approved',
            supervisor: id
        });

        console.log('Saving log...');
        await log.save();
        console.log('Log saved successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

testHook();
