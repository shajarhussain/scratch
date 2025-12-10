const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config();

const createHOD = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if HOD exists
        const existingHOD = await User.findOne({ email: 'hod@demo.com' });
        if (existingHOD) {
            console.log('HOD user already exists');
            process.exit();
        }

        // Create HOD
        const hod = await User.create({
            name: 'Dr. HOD',
            email: 'hod@demo.com',
            password: 'password123',
            role: 'HOD',
            department: 'Computer Science'
        });

        console.log(`HOD Created: ${hod.name} (${hod.email})`);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

createHOD();
