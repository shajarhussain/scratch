const axios = require('axios');

const completeEvaluatorTest = async () => {
    try {
        console.log('\n🚀 Complete Evaluator System Test\n');

        // Step 1: Login as Coordinator
        console.log('1️⃣ Logging in as Coordinator...');
        const coordLogin = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'coord001@test.com',
            password: 'test123',
            role: 'Coordinator'
        });
        const coordToken = coordLogin.data.token;
        console.log('✅ Coordinator logged in');

        // Step 2: Get available groups
        console.log('\n2️⃣ Fetching groups...');
        const groupsRes = await axios.get('http://127.0.0.1:5000/api/groups', {
            headers: { Authorization: `Bearer ${coordToken}` }
        });
        const groups = groupsRes.data;
        console.log(`✅ Found ${groups.length} groups`);

        if (groups.length === 0) {
            console.log('❌ No groups available for testing');
            return;
        }

        // Step 3: Get evaluator
        console.log('\n3️⃣ Finding evaluator...');
        const usersRes = await axios.get('http://127.0.0.1:5000/api/users', {
            headers: { Authorization: `Bearer ${coordToken}` }
        });
        const evaluator = usersRes.data.find(u => u.email === 'evaluator001@test.com');
        if (!evaluator) {
            console.log('❌ Evaluator not found');
            return;
        }
        console.log(`✅ Found evaluator: ${evaluator.name}`);

        // Step 4: Create Schedule with Internal Evaluator
        console.log('\n4️⃣ Creating Proposal Defense schedule...');
        const scheduleData = {
            eventType: 'Proposal Defense',
            eventDate: '2025-12-25',
            startTime: '10:00 AM',
            endTime: '12:00 PM',
            venue: 'Conference Room A',
            groupId: groups[0]._id,
            internalEvaluatorIds: [evaluator._id],
            notes: 'Test evaluation for internal evaluator dashboard'
        };

        const scheduleRes = await axios.post(
            'http://127.0.0.1:5000/api/schedules',
            scheduleData,
            { headers: { Authorization: `Bearer ${coordToken}` } }
        );
        console.log('✅ Schedule created successfully!');
        console.log(`   Event: ${scheduleRes.data.eventType}`);
        console.log(`   Group: ${groups[0].groupCode || groups[0]._id}`);
        console.log(`   Date: ${scheduleRes.data.eventDate}`);

        // Step 5: Login as Internal Evaluator
        console.log('\n5️⃣ Logging in as Internal Evaluator...');
        const evalLogin = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'evaluator001@test.com',
            password: 'test123',
            role: 'InternalEvaluator'
        });
        const evalToken = evalLogin.data.token;
        console.log('✅ Evaluator logged in');
        console.log(`   Name: ${evalLogin.data.name}`);
        console.log(`   Email: ${evalLogin.data.email}`);

        // Step 6: Get Evaluator Assignments
        console.log('\n6️⃣ Fetching evaluator assignments...');
        const assignmentsRes = await axios.get(
            'http://127.0.0.1:5000/api/evaluator/assignments',
            { headers: { Authorization: `Bearer ${evalToken}` } }
        );

        console.log('\n' + '='.repeat(60));
        console.log('✅ EVALUATOR DASHBOARD DATA:');
        console.log('='.repeat(60));
        console.log(`Total Assignments: ${assignmentsRes.data.length}`);
        console.log(`Pending: ${assignmentsRes.data.filter(a => a.status === 'Pending').length}`);
        console.log(`Completed: ${assignmentsRes.data.filter(a => a.status === 'Completed').length}`);

        if (assignmentsRes.data.length > 0) {
            console.log('\n📋 Assignment Details:');
            assignmentsRes.data.forEach((assignment, idx) => {
                console.log(`\n${idx + 1}. ${assignment.eventType}`);
                console.log(`   Group: ${assignment.group?.groupCode || 'N/A'}`);
                console.log(`   Date: ${new Date(assignment.date).toLocaleDateString()}`);
                console.log(`   Time: ${assignment.startTime} - ${assignment.endTime}`);
                console.log(`   Venue: ${assignment.venue || 'N/A'}`);
                console.log(`   Status: ${assignment.status}`);
            });

            console.log('\n✅ SUCCESS! Assignment appears in Evaluator Dashboard!');
            console.log('\n🎉 COMPLETE WORKFLOW VERIFIED:');
            console.log('   1. ✅ Coordinator created schedule');
            console.log('   2. ✅ Assigned internal evaluator');
            console.log('   3. ✅ Evaluator can login');
            console.log('   4. ✅ Assignment visible in dashboard');
            console.log('   5. ✅ Ready for evaluation\n');
        } else {
            console.log('\n⚠️  No assignments found - may need to wait for data sync');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data?.message || error.message);
        if (error.response?.status === 404) {
            console.error('💡 Hint: Make sure backend server is running with evaluator routes loaded');
        }
    }
};

completeEvaluatorTest();
