const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Schedule = require('./models/scheduleModel');
const User = require('./models/userModel');
const Group = require('./models/groupModel');
const ExternalToken = require('./models/externalTokenModel'); // Just in case

dotenv.config();

const debugData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const schedules = await Schedule.find({ eventType: 'Interim Evaluation I' })
            .populate('supervisor', 'name email')
            .populate('group', 'groupCode');

        console.log('\n--- INTERIM SCHEDULES ---');
        schedules.forEach(s => {
            console.log(`Schedule ID: ${s._id}`);
            console.log(`Event Date: ${s.eventDate}`);
            console.log(`Supervisor Field (Raw): ${s.supervisor ? s.supervisor._id : 'NULL'}`);
            console.log(`Supervisor Name: ${s.supervisor ? s.supervisor.name : 'N/A'}`);
            console.log(`SRS Status: ${s.srsDeliverable ? s.srsDeliverable.status : 'N/A'}`);
            console.log('-------------------------');
        });

        const supervisors = await User.find({ role: 'Supervisor' });
        console.log('\n--- SUPERVISORS IN DB ---');
        supervisors.forEach(u => {
            console.log(`User ID: ${u._id} | Name: ${u.name} | Role: ${u.role}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debugData();
