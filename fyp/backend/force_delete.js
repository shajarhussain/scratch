const mongoose = require('mongoose');
const Schedule = require('./models/scheduleModel');
const Notification = require('./models/notificationModel');
const ExternalToken = require('./models/externalTokenModel');
require('dotenv').config();

const forceDeleteSchedule = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const scheduleId = '6938e2060b6c6de7672693c0';

        console.log(`Attempting to delete Schedule ID: ${scheduleId}`);

        // Delete dependencies first
        const notifResult = await Notification.deleteMany({ schedule: scheduleId });
        console.log(`Deleted ${notifResult.deletedCount} notifications.`);

        // Delete schedule
        const schedResult = await Schedule.deleteOne({ _id: scheduleId });

        if (schedResult.deletedCount > 0) {
            console.log('✅ Schedule deleted successfully.');
        } else {
            console.log('⚠️ Schedule not found (already deleted?).');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

forceDeleteSchedule();
