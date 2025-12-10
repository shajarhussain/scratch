const mongoose = require('mongoose');
const Schedule = require('./models/scheduleModel');
const Group = require('./models/groupModel');
const User = require('./models/userModel');

const testStudentSchedules = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fyp_management');
        console.log('✅ MongoDB Connected\n');

        // Find a student
        const demoStudent = await User.findOne({ role: 'Student' });

        if (!demoStudent) {
            console.log('❌ No student found in database');
            process.exit(1);
        }

        console.log(`📋 Testing for student: ${demoStudent.name} (${demoStudent.email})`);

        // Find groups that this student is in
        const groups = await Group.find({ members: demoStudent._id });
        console.log(`\n🔍 Groups found: ${groups.length}`);
        groups.forEach((g, i) => {
            console.log(`   ${i + 1}. ${g.groupCode} (${g.members.length} members)`);
        });

        const groupIds = groups.map(g => g._id);

        // Find schedules for these groups
        const schedules = await Schedule.find({ group: { $in: groupIds } })
            .populate('group')
            .populate('students', 'name email');

        console.log(`\n📅 Schedules for student's groups: ${schedules.length}`);
        schedules.forEach((s, i) => {
            console.log(`\n   ${i + 1}. ${s.eventType}`);
            console.log(`      Group: ${s.group?.groupCode || 'No group'}`);
            console.log(`      Students array length: ${s.students?.length || 0}`);
            if (s.students && s.students.length > 0) {
                s.students.forEach((st, j) => {
                    console.log(`         ${j + 1}. ${st.name} (${st.email})`);
                });
            } else {
                console.log(`      ⚠️  No students in students array!`);
            }
            console.log(`      Date: ${s.eventDate}`);
            console.log(`      Status: ${s.status}`);
        });

        // Check if student is in ANY schedule's students array
        const schedulesWithStudent = await Schedule.find({ students: demoStudent._id })
            .populate('group');

        console.log(`\n\n🎯 Schedules where student is in students array: ${schedulesWithStudent.length}`);

        if (schedulesWithStudent.length === 0 && schedules.length > 0) {
            console.log('\n❌ ISSUE FOUND: Student has groups but schedules don\'t have students populated!');
            console.log('   This is why students can\'t see schedules.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testStudentSchedules();
