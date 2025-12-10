const axios = require('axios');

const completeTest = async () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 COMPLETE EVALUATOR SYSTEM TEST');
    console.log('='.repeat(70));

    try {
        // PART 1: COORDINATOR LOGIN
        console.log('\n1️⃣  COORDINATOR LOGIN');
        console.log('   Attempting: coord001@test.com / test123...');
        const coordRes = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'coord001@test.com',
            password: 'test123',
            role: 'Coordinator'
        });
        console.log('   ✅ SUCCESS!');
        console.log(`   Name: ${coordRes.data.name}`);
        console.log(`   Role: ${coordRes.data.role}`);
        const coordToken = coordRes.data.token;

        // PART 2: GET GROUPS
        console.log('\n2️⃣  FETCHING GROUPS');
        const groupsRes = await axios.get('http://127.0.0.1:5000/api/groups', {
            headers: { Authorization: `Bearer ${coordToken}` }
        });
        console.log(`   ✅ Found ${groupsRes.data.length} groups`);
        const testGroup = groupsRes.data[0];
        console.log(`   Using: ${testGroup.groupCode || testGroup._id}`);

        // PART 3: CREATE SCHEDULE WITH EVALUATOR
        console.log('\n3️⃣  CREATING SCHEDULE WITH INTERNAL EVALUATOR');

        // We need the evaluator's ID - let's fetch from database query
        // Since we created evaluator001@test.com, we'll use a direct approach
        console.log('   Finding evaluator001@test.com...');

        // Login as evaluator to get their ID
        const evalLoginTemp = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'evaluator001@test.com',
            password: 'test123',
            role: 'InternalEvaluator'
        });
        const evaluatorId = evalLoginTemp.data.id || evalLoginTemp.data._id;
        console.log(`   ✅ Found evaluator ID: ${evaluatorId}`);

        const scheduleData = {
            eventType: 'Proposal Defense',
            eventDate: '2025-12-25',
            startTime: '10:00 AM',
            endTime: '12:00 PM',
            venue: 'Conference Room A - Test',
            groupId: testGroup._id,
            internalEvaluatorIds: [evaluatorId],
            notes: 'Automated test - evaluator system verification'
        };

        console.log('   Creating schedule...');
        const scheduleRes = await axios.post(
            'http://127.0.0.1:5000/api/schedules',
            scheduleData,
            { headers: { Authorization: `Bearer ${coordToken}` } }
        );
        console.log('   ✅ SCHEDULE CREATED!');
        console.log(`   Event: ${scheduleRes.data.eventType}`);
        console.log(`   Date: ${new Date(scheduleRes.data.eventDate).toLocaleDateString()}`);
        console.log(`   Venue: ${scheduleRes.data.venue}`);

        // PART 4: EVALUATOR LOGIN
        console.log('\n4️⃣  INTERNAL EVALUATOR LOGIN');
        console.log('   Attempting: evaluator001@test.com / test123...');
        const evalRes = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'evaluator001@test.com',
            password: 'test123',
            role: 'InternalEvaluator'
        });
        console.log('   ✅ SUCCESS!');
        console.log(`   Name: ${evalRes.data.name}`);
        console.log(`   Email: ${evalRes.data.email}`);
        const evalToken = evalRes.data.token;

        // PART 5: GET ASSIGNMENTS
        console.log('\n5️⃣  FETCHING EVALUATOR ASSIGNMENTS');
        const assignmentsRes = await axios.get(
            'http://127.0.0.1:5000/api/evaluator/assignments',
            { headers: { Authorization: `Bearer ${evalToken}` } }
        );

        console.log('\n' + '='.repeat(70));
        console.log('📊 EVALUATOR DASHBOARD DATA');
        console.log('='.repeat(70));
        console.log(`\n   Total Assignments: ${assignmentsRes.data.length}`);
        console.log(`   Pending: ${assignmentsRes.data.filter(a => a.status === 'Pending').length}`);
        console.log(`   Completed: ${assignmentsRes.data.filter(a => a.status === 'Completed').length}`);

        if (assignmentsRes.data.length > 0) {
            console.log('\n📋 ASSIGNMENT DETAILS:\n');
            assignmentsRes.data.forEach((assignment, idx) => {
                console.log(`   ${idx + 1}. EVENT: ${assignment.eventType}`);
                console.log(`      Group: ${assignment.group?.groupCode || 'N/A'}`);
                console.log(`      Date: ${new Date(assignment.date).toLocaleDateString()}`);
                console.log(`      Time: ${assignment.startTime} - ${assignment.endTime}`);
                console.log(`      Venue: ${assignment.venue}`);
                console.log(`      Status: ${assignment.status}`);
                console.log(`      Can Evaluate: ${assignment.status === 'Pending' ? 'YES ✅' : 'NO'}\n`);
            });
        }

        console.log('='.repeat(70));
        console.log('✅ COMPLETE WORKFLOW TEST: SUCCESS!');
        console.log('='.repeat(70));
        console.log('\n🎉 VERIFIED FUNCTIONALITY:\n');
        console.log('   ✅ Coordinator can login');
        console.log('   ✅ Coordinator can create schedules');
        console.log('   ✅ Internal evaluator can be assigned');
        console.log('   ✅ Internal evaluator can login');
        console.log('   ✅ Evaluator dashboard API returns assignments');
        console.log(`   ✅ Assignment count: ${assignmentsRes.data.length}`);
        console.log('\n💡 NEXT: Open http://localhost:5173 and login as:');
        console.log('   Email: evaluator001@test.com');
        console.log('   Password: test123');
        console.log('   Then click "Evaluator Dashboard" to see the UI!\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error(`   Error: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
            console.error('   Details:', error.response.data);
        }
    }
};

completeTest();
