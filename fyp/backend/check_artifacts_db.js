const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Schedule = require('./models/scheduleModel');
const Group = require('./models/groupModel');
const User = require('./models/userModel');

dotenv.config();

const checkArtifacts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const schedules = await Schedule.find({ eventType: 'Interim Evaluation I' })
            .populate('group', 'groupCode');

        console.log('\n--- ARTIFACTS IN INTERIM SCHEDULES ---');
        schedules.forEach(s => {
            console.log(`\nSchedule ID: ${s._id}`);
            console.log(`Group: ${s.group ? s.group.groupCode : 'N/A'}`);
            console.log(`SRS Status: ${s.srsDeliverable ? s.srsDeliverable.status : 'N/A'}`);
            if (s.artifacts && s.artifacts.length > 0) {
                console.log(`Artifacts (${s.artifacts.length}):`);
                s.artifacts.forEach(a => {
                    console.log(` - [${a.type}] ${a.name} (${a.fileUrl})`);
                });
            } else {
                console.log('No Artifacts Uploaded.');
            }
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkArtifacts();
