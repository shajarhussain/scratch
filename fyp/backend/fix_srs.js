const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Schedule = require('./models/scheduleModel');

dotenv.config();

const fixData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const schedule = await Schedule.findById('693841198bdbb71075ea1c54');
        if (schedule) {
            schedule.supervisor = '69357a0aa92c9a87ea3cc0b6'; // DR TAMIM AHMAD KHAN
            await schedule.save();
            console.log('✅ Fixed: Assigned Supervisor to Schedule');
        } else {
            console.log('Schedule not found');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixData();
