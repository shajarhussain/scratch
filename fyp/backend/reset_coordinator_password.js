const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config();

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ email: 'coordinator@demo.com' });

        if (user) {
            user.password = 'password123';
            await user.save();
            console.log('Coordinator password reset to: password123');
        } else {
            console.log('Coordinator user not found');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetPassword();
