const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'student@demo.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User found:', {
                name: user.name,
                email: user.email,
                role: user.role,
                passwordHash: user.password.substring(0, 10) + '...'
            });
        } else {
            console.log('User not found');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
