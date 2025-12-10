require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');
const bcrypt = require('bcryptjs');

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const user = await User.findOneAndUpdate(
            { email: 'tamim000@gmail.com' },
            { password: hashedPassword },
            { new: true }
        );

        if (user) {
            console.log('Password updated for:', user.email);
        } else {
            console.log('User not found');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetPassword();
