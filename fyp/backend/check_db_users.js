const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const evaluators = await User.find({
            role: { $in: ['InternalEvaluator', 'Supervisor', 'ExternalEvaluator'] }
        });

        console.log(`Found ${evaluators.length} evaluators/supervisors:`);
        evaluators.forEach(u => {
            console.log(`- ${u.name} (${u.email}) [${u.role}]`);
        });

        const allUsers = await User.find({});
        console.log(`Total users in DB: ${allUsers.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers();
