const mongoose = require('mongoose');
const Schedule = require('./models/scheduleModel');
const User = require('./models/userModel');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('DB Connection Failed:', error);
        process.exit(1);
    }
};

const debugSchedule = async () => {
    await connectDB();
    const id = '6938f7dff791d259c1d596a4'; // ID from user error

    try {
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('Invalid ID format according to regex');
        } else {
            console.log('Valid ID format');
        }

        const schedule = await Schedule.findById(id)
            .populate('group')
            .populate('internalEvaluators', 'name') // Populate internal evaluators
            .populate('externalEvaluator', 'name'); // Just to see if it populates

        if (!schedule) {
            console.log('Schedule NOT FOUND');
        } else {
            console.log('Schedule Found:', schedule._id);
            console.log('Event Type:', schedule.eventType);
            console.log('Internal Evaluators:', schedule.internalEvaluators);
            console.log('External Evaluator:', schedule.externalEvaluator);
            console.log('Artifacts:', schedule.artifacts);

            // Simulation of controller check
            const userId = "some_valid_external_id"; // hypothetical
            const isInternal = schedule.internalEvaluators && schedule.internalEvaluators.some(
                e => e && e._id && e._id.toString() === userId
            );
            console.log('Is Internal Check (safe):', isInternal);
        }

    } catch (error) {
        console.error('Error fetching schedule:', error);
    } finally {
        mongoose.connection.close();
    }
};

debugSchedule();
