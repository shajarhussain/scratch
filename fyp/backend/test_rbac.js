const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testRBAC = async () => {
    try {
        // 1. Create Users (Student & Supervisor)
        console.log('Creating Users...');
        const s1Id = `S_RBAC_${Math.floor(Math.random() * 1000)}`;
        const supEmail = `sup_rbac_${Math.floor(Math.random() * 1000)}@test.com`;

        const student = await axios.post(`${API_URL}/users`, {
            name: 'Student RBAC',
            email: `${s1Id}@test.com`,
            password: 'password',
            role: 'Student',
            studentId: s1Id,
            department: 'CS'
        });
        const studentToken = student.data.token;

        const supervisor = await axios.post(`${API_URL}/users`, {
            name: 'Dr. RBAC',
            email: supEmail,
            password: 'password',
            role: 'Supervisor',
            department: 'CS'
        });
        const supervisorToken = supervisor.data.token;

        // 2. Test Student Access (Should Succeed)
        console.log('\nTesting Student Access (Create Group)...');
        try {
            await axios.post(`${API_URL}/groups`, { memberIds: [student.data._id] }, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            console.log('SUCCESS: Student created group.');
        } catch (err) {
            console.error('FAILURE: Student failed to create group.', err.response?.data);
        }

        // 3. Test Supervisor Access to Student Route (Should Fail)
        console.log('\nTesting Supervisor Access to Student Route (Create Group)...');
        try {
            await axios.post(`${API_URL}/groups`, { memberIds: [student.data._id] }, {
                headers: { Authorization: `Bearer ${supervisorToken}` }
            });
            console.error('FAILURE: Supervisor was allowed to create group!');
        } catch (err) {
            if (err.response?.status === 403) {
                console.log('SUCCESS: Supervisor denied access (403).');
            } else {
                console.error(`FAILURE: Unexpected error ${err.response?.status}`, err.response?.data);
            }
        }

        // 4. Test Unauthenticated Access (Should Fail)
        console.log('\nTesting Unauthenticated Access...');
        try {
            await axios.post(`${API_URL}/groups`, { memberIds: [student.data._id] });
            console.error('FAILURE: Unauthenticated user allowed!');
        } catch (err) {
            if (err.response?.status === 401) {
                console.log('SUCCESS: Unauthenticated user denied (401).');
            } else {
                console.error(`FAILURE: Unexpected error ${err.response?.status}`, err.response?.data);
            }
        }

    } catch (error) {
        console.error('Setup Error:', error.message);
    }
};

testRBAC();
