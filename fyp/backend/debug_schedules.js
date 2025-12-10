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

const scheduleSchema = new mongoose.Schema({}, { strict: false });
const Schedule = mongoose.model('Schedule', scheduleSchema);
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

const debugSchedules = async () => {
    await connectDB();

    try {
        const schedules = await Schedule.find({});
        console.log(`Found ${schedules.length} schedules.`);

        const finalViva = schedules.filter(s => s.eventType === 'Final Viva');
        console.log(`Found ${finalViva.length} 'Final Viva' schedules.`);

        finalViva.forEach(s => {
            console.log('--- Schedule ---');
            console.log('ID:', s._id);
            console.log('Event Date:', s.eventDate);
            console.log('Ext Evaluator ID:', s.externalEvaluator);
            console.log('Magic Link:', s.magicLink);
        });

        const externalEvaluators = await User.find({ role: 'ExternalEvaluator' });
        console.log(`\nFound ${externalEvaluators.length} External Evaluator users.`);
        externalEvaluators.forEach(u => {
            console.log('User ID:', u._id, 'Name:', u.name, 'Email:', u.email);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

debugSchedules();
