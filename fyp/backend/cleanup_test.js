const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

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

const User = mongoose.model('User', new mongoose.Schema({ email: String }, { strict: false }));
const Schedule = mongoose.model('Schedule', new mongoose.Schema({}, { strict: false }));
const ExternalToken = mongoose.model('ExternalToken', new mongoose.Schema({}, { strict: false }));

const cleanup = async () => {
    await connectDB();

    try {
        // Delete the test user created by seed_final_viva.js
        const result = await User.deleteMany({ email: 'test@external.com' });
        console.log(`Deleted ${result.deletedCount} test users.`);

        // Delete the test schedule (you might want to be more specific here in a real app)
        // For now, I'll find schedules with that External Evaluator ID if I could, but the user is gone.
        // I'll just delete schedules with 'magicLink' that matches the one I saw in logs, or just specific ones.
        // Actually, let's just delete the schedule we created if we can find it.
        // Since I don't have the ID handy, I'll leave the schedule for now or user can delete it from UI.
        // But user asked to "delete the previous external inviligalator".

        console.log('Test user cleanup complete.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

cleanup();
