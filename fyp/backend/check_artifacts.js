const mongoose = require('mongoose');
const Schedule = require('./models/scheduleModel');
require('dotenv').config();

const checkArtifacts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const id = '6938f7dff791d259c1d596a4';
        const schedule = await Schedule.findById(id);

        if (schedule) {
            console.log('Schedule Found');
            console.log('Event Type:', schedule.eventType);
            console.log('Artifacts Count:', schedule.artifacts?.length);
            console.log('Artifacts:', JSON.stringify(schedule.artifacts, null, 2));
        } else {
            console.log('Schedule NOT Found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

checkArtifacts();
