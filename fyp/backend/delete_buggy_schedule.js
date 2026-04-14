const mongoose = require('mongoose');
const Schedule = require('./models/scheduleModel');
require('dotenv').config();

const deleteBuggySchedule = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find the specific buggy schedule seen in the screenshot
        // Final Viva, 12/15/2025, Lab 1
        const start = new Date('2025-12-15T00:00:00.000Z');
        const end = new Date('2025-12-15T23:59:59.999Z');

        const schedules = await Schedule.find({
            eventType: 'Final Viva',
            eventDate: { $gte: start, $lte: end },
            venue: 'Lab 1'
        });

        console.log(`Found ${schedules.length} candidate schedules.`);

        for (const s of schedules) {
            console.log(`Checking Schedule ID: ${s._id}`);
            console.log(`Group: ${s.group}`);
            console.log(`Status: ${s.status}`);

            // Logic to identify the "buggy" one (missing group)
            if (!s.group) {
                console.log(`🚨 Found buggy schedule (No Group)! Deleting ID: ${s._id}`);
                await Schedule.findByIdAndDelete(s._id);
                console.log('✅ Deleted successfully.');
            } else {
                // Check if group exists in DB? 
                // Maybe the group ID is there but the group doc is gone.
                const Group = require('./models/groupModel');
                const groupDoc = await Group.findById(s.group);
                if (!groupDoc) {
                    console.log(`🚨 Found buggy schedule (Group Ref ${s.group} not found)! Deleting ID: ${s._id}`);
                    await Schedule.findByIdAndDelete(s._id);
                    console.log('✅ Deleted successfully.');
                } else {
                    console.log(`ℹ️ This schedule seems fine (Group: ${groupDoc.groupCode}). Skipping.`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

deleteBuggySchedule();
