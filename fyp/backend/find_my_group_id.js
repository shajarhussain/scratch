require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Group = require('./models/groupModel');

const findGroup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find user Abdul Wahab or Malik Shajar Hussain
        const student = await User.findOne({
            $or: [
                { email: 'abd001@gmail.com' },
                { email: 'malikshajarlive@gmail.com' }
            ]
        });

        if (!student) {
            console.log('❌ Could not find student');
            process.exit(0);
        }

        console.log(`✅ Found Student: ${student.name} (${student._id})`);

        const group = await Group.findOne({ members: student._id });

        if (group) {
            console.log('\n==========================================');
            console.log(`🎯 GROUP ID: ${group._id}`);
            console.log(`   Group Code: ${group.groupCode}`);
            console.log('==========================================\n');
        } else {
            console.log('❌ Student is not in a group');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

findGroup();
