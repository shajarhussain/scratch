const mongoose = require('mongoose');
const User = require('./models/userModel');
const Group = require('./models/groupModel');
const Schedule = require('./models/scheduleModel');
require('dotenv').config();

const assignAleem = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find Aleem
        const aleem = await User.findOne({
            name: { $regex: 'Aleem', $options: 'i' }
            // role: 'InternalEvaluator' // Optional, but let's just find him by name first
        });

        if (!aleem) {
            console.error('❌ User "Aleem" not found!');
            process.exit(1);
        }

        console.log(`✅ Found user: ${aleem.name} (${aleem.email}) - Role: ${aleem.role}`);

        if (aleem.role !== 'InternalEvaluator') {
            console.log('⚠️ User is not an InternalEvaluator. Updating role...');
            aleem.role = 'InternalEvaluator';
            await aleem.save();
            console.log('✅ Role updated to InternalEvaluator');
        }

        // 2. Find a Group
        const group = await Group.findOne();
        if (!group) {
            console.error('❌ No groups found in the system. Please create a group first.');
            process.exit(1);
        }
        console.log(`✅ Found group: ${group.groupCode}`);

        // 3. Find Supervisor (needed for Schedule)
        const supervisor = await User.findOne({ role: 'Supervisor' });

        // 4. Create Schedule
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + 3); // 3 days from now

        const schedule = await Schedule.create({
            eventType: 'Proposal Defense',
            eventDate: eventDate,
            startTime: '10:00',
            endTime: '11:00',
            venue: 'Main Hall',
            group: group._id,
            students: group.members,
            supervisor: supervisor ? supervisor._id : aleem._id, // Fallback if no supervisor found
            internalEvaluators: [aleem._id], // ASSIGN ALEEM
            status: 'Scheduled',
            createdBy: aleem._id // Just for tracking
        });

        console.log(`✅ Created Assignment for Aleem: ${schedule.eventType} on ${schedule.eventDate}`);
        console.log('Now log in and check the dashboard!');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

assignAleem();
