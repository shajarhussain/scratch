const mongoose = require('mongoose');
const Schedule = require('./models/scheduleModel');
const User = require('./models/userModel');
require('dotenv').config();

const debugAssignment = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // Check for duplicate emails
        const targetEmail = 'aw9165184@gmail.com';
        const users = await User.find({ email: targetEmail });
        console.log(`\n--- Users with email ${targetEmail} ---`);
        users.forEach(u => console.log(`${u._id} | Role: ${u.role} | Name: ${u.username || u.name}`));

        // Check Tokens
        const ExternalToken = require('./models/externalTokenModel');
        // Find tokens for these users
        const tokens = await ExternalToken.find({ user: { $in: users.map(u => u._id) } });
        console.log('\n--- Magic Tokens for this email ---');
        tokens.forEach(t => {
            console.log(`TokenID: ${t._id} | User: ${t.user} | Active: ${t.isActive} | Expires: ${t.expiresAt}`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

debugAssignment();
