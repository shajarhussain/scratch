/**
 * Recovery seed v2 — handles the duplicate registrationNumber case.
 * Strategy: Use the existing supervisor (supervisor@test.com) that already has SUP001,
 * or reassign SUP001 if needed.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/userModel');
const Group = require('./models/groupModel');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Find who has SUP001
    const sup001Owner = await User.findOne({ registrationNumber: 'SUP001' });
    if (sup001Owner) {
        console.log(`SUP001 is owned by: ${sup001Owner.email} (${sup001Owner.name}), role: ${sup001Owner.role}`);
        // Reset their password to a known value
        sup001Owner.password = 'password123';
        await sup001Owner.save(); // pre-save hook will hash
        console.log(`Reset password for ${sup001Owner.email} to password123`);
    } else {
        console.log('No user has SUP001. Assigning to supervisor@demo.com');
        await User.updateOne(
            { email: 'supervisor@demo.com' },
            { $set: { registrationNumber: 'SUP001' } }
        );
    }

    // 2. Ensure coordinator@demo.com exists and has a registrationNumber
    const coord = await User.findOne({ email: 'coordinator@demo.com' });
    if (coord) {
        if (!coord.registrationNumber) {
            // Check if COORD001 is taken
            const coordOwner = await User.findOne({ registrationNumber: 'COORD001' });
            if (!coordOwner) {
                await User.updateOne({ _id: coord._id }, { $set: { registrationNumber: 'COORD001' } });
                console.log('Updated coordinator@demo.com with registrationNumber COORD001');
            } else {
                console.log('COORD001 already owned by', coordOwner.email);
            }
        } else {
            console.log('coordinator@demo.com has registrationNumber:', coord.registrationNumber);
        }
        // Verify password
        const match = await coord.matchPassword('password123');
        if (!match) {
            coord.password = 'password123';
            await coord.save();
            console.log('Reset coordinator password to password123');
        }
    }

    // 3. Ensure student@demo.com exists and password works
    const student = await User.findOne({ email: 'student@demo.com' });
    if (student) {
        const match = await student.matchPassword('password123');
        if (!match) {
            student.password = 'password123';
            await student.save();
            console.log('Reset student password to password123');
        } else {
            console.log('student@demo.com password OK');
        }
    }

    // 4. Ensure evaluator001@test.com exists
    const eval1 = await User.findOne({ email: 'evaluator001@test.com' });
    if (eval1) {
        const match = await eval1.matchPassword('test123');
        if (!match) {
            eval1.password = 'test123';
            await eval1.save();
            console.log('Reset evaluator001 password to test123');
        } else {
            console.log('evaluator001@test.com password OK');
        }
    }

    // 5. Clean up old groups from student@demo.com
    if (student) {
        const oldGroups = await Group.find({ members: student._id });
        if (oldGroups.length > 0) {
            for (const g of oldGroups) {
                await Group.deleteOne({ _id: g._id });
                console.log('Deleted old group:', g.groupCode || g._id);
            }
        } else {
            console.log('No old groups to clean up');
        }
    }

    // 6. Final account matrix
    const accounts = [
        { email: 'student@demo.com', pw: 'password123' },
        { email: 'supervisor@demo.com', pw: 'password123' },
        { email: 'coordinator@demo.com', pw: 'password123' },
        { email: 'evaluator001@test.com', pw: 'test123' }
    ];

    // Also check the SUP001 owner if different
    if (sup001Owner && sup001Owner.email !== 'supervisor@demo.com') {
        accounts.push({ email: sup001Owner.email, pw: 'password123' });
    }

    console.log('\n===== VALIDATED ACCOUNT MATRIX =====');
    for (const acc of accounts) {
        const user = await User.findOne({ email: acc.email });
        if (user) {
            const match = await user.matchPassword(acc.pw);
            console.log(`  ${acc.email.padEnd(30)} | role: ${user.role.padEnd(18)} | regNo: ${(user.registrationNumber || 'N/A').padEnd(8)} | pw: ${match ? 'VALID' : 'INVALID'}`);
        } else {
            console.log(`  ${acc.email.padEnd(30)} | NOT FOUND`);
        }
    }

    console.log('\n===== RECOVERY COMPLETE =====');
    process.exit(0);
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
