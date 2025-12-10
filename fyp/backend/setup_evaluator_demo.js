const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fyp_management')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const User = require('./models/userModel');
const Group = require('./models/groupModel');
const Schedule = require('./models/scheduleModel');

const setupEvaluatorDemo = async () => {
    try {
        console.log('\n🚀 Setting up Internal Evaluator Demo...\n');

        // 1. Create Internal Evaluator
        console.log('1️⃣ Creating Internal Evaluator...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('evaluator123', salt);

        let evaluator = await User.findOne({ email: 'sarah.wilson@test.com' });
        if (!evaluator) {
            evaluator = await User.create({
                name: 'Dr. Sarah Wilson',
                email: 'sarah.wilson@test.com',
                password: hashedPassword,
                role: 'InternalEvaluator',
                registrationNumber: 'IE001',
                department: 'CS'
            });
            console.log('   ✅ Created: Dr. Sarah Wilson (sarah.wilson@test.com)');
        } else {
            console.log('   ⏭️  Already exists: Dr. Sarah Wilson');
        }

        // 2. Create a test group (if doesn't exist)
        console.log('\n2️⃣ Creating Test Group...');
        let group = await Group.findOne({ groupCode: 'FYP-2025-001' });
        if (!group) {
            // Create test students first
            const student1 = await User.findOne({ email: 's1001@test.com' }) || await User.create({
                name: 'Alice Smith',
                email: 's1001@test.com',
                password: hashedPassword,
                role: 'Student',
                studentId: 'S1001',
                department: 'CS'
            });

            const student2 = await User.findOne({ email: 's1002@test.com' }) || await User.create({
                name: 'Bob Jones',
                email: 's1002@test.com',
                password: hashedPassword,
                role: 'Student',
                studentId: 'S1002',
                department: 'CS'
            });

            // Create supervisor
            const supervisor = await User.findOne({ email: 'supervisor@test.com' }) || await User.create({
                name: 'Dr. John Supervisor',
                email: 'supervisor@test.com',
                password: hashedPassword,
                role: 'Supervisor',
                registrationNumber: 'SUP001',
                department: 'CS'
            });

            group = await Group.create({
                groupCode: 'FYP-2025-001',
                projectTitle: 'AI-Powered Learning Management System',
                members: [student1._id, student2._id],
                supervisor: supervisor._id,
                status: 'Approved'
            });
            console.log('   ✅ Created: Group FYP-2025-001');
        } else {
            console.log('   ⏭️  Already exists: Group FYP-2025-001');
        }

        // 3. Create coordinator (needed for creating schedules)
        console.log('\n3️⃣ Creating Coordinator...');
        let coordinator = await User.findOne({ email: 'coordinator@test.com' });
        if (!coordinator) {
            coordinator = await User.create({
                name: 'Coordinator Test',
                email: 'coordinator@test.com',
                password: hashedPassword,
                role: 'Coordinator',
                registrationNumber: 'COORD001',
                department: 'CS'
            });
            console.log('   ✅ Created: Coordinator (coordinator@test.com)');
        } else {
            console.log('   ⏭️  Already exists: Coordinator');
        }

        // 4. Create test schedules with evaluator assigned
        console.log('\n4️⃣ Creating Test Schedules...');

        const scheduleTypes = [
            {
                eventType: 'Proposal Defense',
                date: new Date('2025-12-15T10:00:00'),
                status: 'Scheduled'
            },
            {
                eventType: 'Interim Evaluation I',
                date: new Date('2025-12-20T14:00:00'),
                status: 'Scheduled'
            }
        ];

        for (const scheduleData of scheduleTypes) {
            const existing = await Schedule.findOne({
                eventType: scheduleData.eventType,
                group: group._id
            });

            if (!existing) {
                await Schedule.create({
                    eventType: scheduleData.eventType,
                    eventDate: scheduleData.date,
                    startTime: '10:00 AM',
                    endTime: '12:00 PM',
                    venue: 'Conference Room A',
                    isOnline: false,
                    group: group._id,
                    students: group.members,
                    supervisor: group.supervisor,
                    internalEvaluators: [evaluator._id], // Assign our evaluator
                    status: scheduleData.status,
                    createdBy: coordinator._id,
                    notificationsSent: false
                });
                console.log(`   ✅ Created: ${scheduleData.eventType} schedule`);
            } else {
                console.log(`   ⏭️  Already exists: ${scheduleData.eventType}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 SETUP COMPLETE! You can now test the Internal Evaluator Dashboard');
        console.log('='.repeat(60));
        console.log('\n📋 LOGIN CREDENTIALS:\n');
        console.log('   Email: sarah.wilson@test.com');
        console.log('   Password: evaluator123');
        console.log('\n🎯 NEXT STEPS:\n');
        console.log('   1. Go to http://localhost:5173/login');
        console.log('   2. Login with the credentials above');
        console.log('   3. Click "Evaluator Dashboard" in the sidebar');
        console.log('   4. You should see 2 pending assignments');
        console.log('   5. Click "Evaluate" to test the rubric form\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error setting up demo:', error);
        process.exit(1);
    }
};

setupEvaluatorDemo();
