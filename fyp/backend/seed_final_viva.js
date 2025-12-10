const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { generateSecureToken, generateMagicLink } = require('./utils/tokenGenerator');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const scheduleSchema = new mongoose.Schema({}, { strict: false });
const Schedule = mongoose.model('Schedule', scheduleSchema);
const User = mongoose.model('User', new mongoose.Schema({
    name: String, email: String, role: String
}, { strict: false }));
const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false }));
const ExternalToken = mongoose.model('ExternalToken', new mongoose.Schema({}, { strict: false }));

const seedFinalViva = async () => {
    await connectDB();

    try {
        // 1. Get External Evaluator
        let extEval = await User.findOne({ role: 'ExternalEvaluator' });
        if (!extEval) {
            console.log('No External Evaluator found. Creating one...');
            extEval = await User.create({
                name: 'Test External',
                email: 'test@external.com',
                password: 'password123',
                role: 'ExternalEvaluator'
            });
        }
        console.log('Using External Evaluator:', extEval._id);

        // 2. Get a Student Group (create if mostly empty db)
        let group = await Group.findOne({});
        if (!group) {
            console.log('No group found. Creating dummy group...');
            // Create a dummy student first
            const student = await User.create({
                name: 'Test Student',
                email: `student${Date.now()}@test.com`,
                password: 'password123',
                role: 'Student'
            });
            group = await Group.create({
                groupCode: 'GP-TEST',
                members: [student._id],
                projectTitle: 'Test Project'
            });
        }
        console.log('Using Group:', group._id);

        // FIX: Drop legacy index if exists
        try {
            await ExternalToken.collection.dropIndex('token_1');
            console.log('⚠️ Dropped legacy index "token_1"');
        } catch (e) {
            // Index might not exist, ignore
        }

        // 3. Create Final Viva Schedule
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + 5); // 5 days from now

        console.log('Creating Final Viva Schedule...');

        // Simulating the controller logic for magic link
        const token = generateSecureToken();
        const expiryDate = new Date(eventDate);
        expiryDate.setDate(expiryDate.getDate() + 2);

        await ExternalToken.create({
            tokenHash: token,
            user: extEval._id,
            expiresAt: expiryDate,
            isActive: true
        });

        const magicLink = generateMagicLink(token, process.env.FRONTEND_URL || 'http://localhost:5173');

        const schedule = await Schedule.create({
            eventType: 'Final Viva',
            eventDate: eventDate,
            startTime: '10:00',
            endTime: '11:00',
            venue: 'Lab 1',
            group: group._id,
            students: group.members,
            supervisor: group.members[0], // Just putting someone
            externalEvaluator: extEval._id,
            magicLink: magicLink, // Saving the link!
            status: 'Scheduled'
        });

        console.log('✅ Schedule Created Successfully!');
        console.log('Schedule ID:', schedule._id);
        console.log('Magic Link:', schedule.magicLink);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

seedFinalViva();
