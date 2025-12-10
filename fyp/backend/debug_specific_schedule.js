const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Schedule = require('./models/scheduleModel');
const User = require('./models/userModel');

dotenv.config();

const debugSchedule = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const scheduleId = '6938f7dff791d259c1d596a4';
        const schedule = await Schedule.findById(scheduleId).populate('externalEvaluator');

        if (!schedule) {
            console.log('❌ Schedule NOT FOUND');
        } else {
            console.log('✅ Schedule Found:');
            console.log(`Event Type: '${schedule.eventType}'`); // Quotes to reveal spaces
            console.log(`External Evaluator Field:`, schedule.externalEvaluator);

            if (!schedule.externalEvaluator) {
                console.log('⚠️ WARNING: externalEvaluator is NULL or Undefined.');
            } else {
                console.log('Evaluator ID:', schedule.externalEvaluator._id);
                console.log('Evaluator Name:', schedule.externalEvaluator.name);
                console.log('Evaluator Email:', schedule.externalEvaluator.email);
            }
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

debugSchedule();
