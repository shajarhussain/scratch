const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

const testGroupCreation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fyp_management');
        console.log('✅ MongoDB Connected');

        // 1. Find a valid Supervisor
        const supervisor = await User.findOne({ role: 'Supervisor' });
        if (!supervisor) throw new Error('No supervisor found');
        console.log(`Found Supervisor: ${supervisor.name} (${supervisor._id})`);

        // 2. Find a valid Student (who is not in a group)
        // We'll create a temp student to avoid conflicts
        const rand = Math.floor(Math.random() * 10000);
        const student = await User.create({
            name: `Test Student ${rand}`,
            email: `student${rand}@test.com`,
            password: 'password123',
            role: 'Student',
            studentId: `S${rand}`,
            department: 'CS'
        });
        console.log(`Created Test Student: ${student.name} (${student._id})`);

        // 3. Attempt to create group via API (hitting the running server)
        // Note: Using the LOGIN token of the student would be required if the route is protected.
        // Let's generate a token or mock the request if we were calling controller directly.
        // But since we want to test the full stack including middleware, let's look at `authMiddleware` or just call controller function directly in this script context?
        // Calling controller directly is easier for debugging the logic error (like model issues), but won't catch middleware issues.
        // Given 500 is usually controller/model logic, let's call logic directly.

        const Group = require('./models/groupModel');
        const { createGroup } = require('./controllers/groupController');

        // Mock Req/Res
        const req = {
            body: {
                memberIds: [student._id.toString()],
                supervisorId: supervisor._id.toString()
            },
            user: student // In case it uses req.user
        };

        const res = {
            status: (code) => {
                console.log(`Response Status: ${code}`);
                return res;
            },
            json: (data) => {
                console.log('Response Data:', JSON.stringify(data, null, 2));
                return res;
            }
        };

        console.log('Testing createGroup controller...');
        await createGroup(req, res);

    } catch (error) {
        console.error('❌ Error caught in test script:', error);
    } finally {
        await mongoose.disconnect();
    }
};

testGroupCreation();
