const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Schedule = require('./models/scheduleModel');
const User = require('./models/userModel');
const ExternalToken = require('./models/externalTokenModel');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Find all "Final Viva" schedules
        const schedules = await Schedule.find({ eventType: 'Final Viva' }).populate('externalEvaluator');
        console.log(`\n----- Final Viva Schedules (${schedules.length}) -----`);

        for (const s of schedules) {
            console.log(`Schedule ID: ${s._id}`);
            console.log(`  Group: ${s.group}`);
            console.log(`  Event Date: ${s.eventDate}`);
            console.log(`  External Evaluator ID in Schedule: ${s.externalEvaluator ? s.externalEvaluator._id : 'NULL'}`);
            console.log(`  External Evaluator Name: ${s.externalEvaluator ? s.externalEvaluator.name : 'N/A'}`);
            console.log(`  Magic Link: ${s.magicLink || 'N/A'}`);
        }

        /*
        // 2. Find all External Evaluator users
        const evaluators = await User.find({ role: 'ExternalEvaluator' });
        console.log(`\n----- External Evaluator Users (${evaluators.length}) -----`);
        
        for (const e of evaluators) {
            console.log(`User ID: ${e._id}`);
            console.log(`  Name: ${e.name}`);
            console.log(`  Email: ${e.email}`);
            
            // Find active tokens for this user
            const tokens = await ExternalToken.find({ user: e._id });
            console.log(`  Active Tokens: ${tokens.length}`);
            tokens.forEach(t => {
                console.log(`    Token: ${t.tokenHash} (Expires: ${t.expiresAt})`);
            });
        }
        */

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
