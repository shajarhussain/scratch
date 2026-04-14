const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/userModel');
const Group = require('./models/groupModel');
const Schedule = require('./models/scheduleModel');

const seedSelenium = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Selenium Seeding...');

        // 1. CLEAR EXISTING SELENIUM DATA
        await User.deleteMany({ email: { $regex: '^selenium_' } });
        await Group.deleteMany({ groupCode: { $regex: '^SEL-' } });
        await Schedule.deleteMany({ 'group': { $exists: true } }); // Safest is to find the SEL group first

        // Wipe schedules related to SEL groups
        const oldG = await Group.findOne({ groupCode: 'SEL-2026-001' });
        if (oldG) {
            await Schedule.deleteMany({ group: oldG._id });
        }
        await Group.deleteMany({ groupCode: 'SEL-2026-001' });

        // 2. PROVISION ISOLATED TEST USERS
        const createUsr = async (name, email, role, extra = {}) => {
            const u = new User({ name, email, password: 'password123', role, ...extra });
            return await u.save();
        };

        const uNoGroup = await createUsr('Sel NoGroup', 'selenium_nogroup@test.com', 'Student', { studentId: 'SEL001', registrationNumber: 'SEL001' });
        const uInGroup = await createUsr('Sel InGroup', 'selenium_ingroup@test.com', 'Student', { studentId: 'SEL002', registrationNumber: 'SEL002' });
        const uStudent2 = await createUsr('Sel Member2', 'selenium_member2@test.com', 'Student', { studentId: 'SEL003', registrationNumber: 'SEL003' });
        const uSup1 = await createUsr('Sel SupFree', 'selenium_supfree@test.com', 'Supervisor', { registrationNumber: 'SUPSEL1' });
        const uSupPaired = await createUsr('Sel SupPaired', 'selenium_suppaired@test.com', 'Supervisor', { registrationNumber: 'SUPSEL2' });
        const uCoord = await createUsr('Sel Coord', 'selenium_coord@test.com', 'Coordinator', { registrationNumber: 'COORD1' });
        
        console.log('Users provisioned.');

        // 3. PROVISION REQUIRED GROUP FOR TC-PRG-01, TC-SCH-01 (Coordinator schedule targets), TC-SCH-03B
        const selGroup = new Group({
            groupCode: 'SEL-2026-001',
            members: [uInGroup._id], // It is just an array of ObjectIds in the schema!
            supervisor: uSupPaired._id,
            supervisorApprovalStatus: 'Approved', // Correct enum for supervisorApprovalStatus
            status: 'Approved', // Valid enums: Pending, Approved, Rejected. Not Active.
            projectTitle: 'Selenium Generated Project'
        });
        await selGroup.save();
        console.log('Group SEL-2026-001 provisioned.');

        // 4. PROVISION CONFLICTING SCHEDULE FOR TC-SCH-02
        // Coordinator creates schedule -> it will conflict with Room A at 10:00
        const conflictSch = new Schedule({
            group: selGroup._id,
            supervisor: uSupPaired._id,
            eventType: 'Mid-Term Evaluation II',
            eventDate: new Date('2026-12-01T00:00:00Z'),
            startTime: '10:00',
            endTime: '11:00',
            venue: 'Room A',
            isPublished: false,
            status: 'Scheduled',
            createdBy: uCoord._id
        });
        await conflictSch.save();

        // 5. PROVISION INTERIM EVALUATION EXPLICIT SCHEDULE FOR TC-SCH-03B/08 (SRS Upload)
        const srsSch = new Schedule({
            group: selGroup._id,
            supervisor: uSupPaired._id,
            eventType: 'Interim Evaluation I',
            eventDate: new Date('2026-11-01T00:00:00Z'),
            startTime: '09:00',
            endTime: '10:00',
            venue: 'Room B',
            isPublished: true,
            status: 'Scheduled',
            createdBy: uCoord._id,
            srsUploadStartDate: new Date('2026-10-01T00:00:00Z'), // Past date to allow upload
            srsDeliverable: {
                status: 'Pending',
                fileUrl: '',
                supervisorApproved: false
            }
        });
        await srsSch.save();
        console.log('Schedules provisioned.');
        
        console.log('--- Bootstrap Selenium Data Injection Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedSelenium();
