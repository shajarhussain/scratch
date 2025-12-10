const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testGroup = async () => {
    try {
        // 1. Register 2 Students
        const student1Id = `S${Math.floor(Math.random() * 10000)}`;
        const student2Id = `S${Math.floor(Math.random() * 10000)}`;

        console.log(`Creating Student 1 (${student1Id})...`);
        const s1 = await axios.post(`${API_URL}/users`, {
            name: 'Student One',
            email: `${student1Id}@test.com`,
            password: 'password',
            role: 'Student',
            studentId: student1Id,
            department: 'CS'
        });
        console.log('Student 1 Created:', s1.data._id);

        console.log(`Creating Student 2 (${student2Id})...`);
        const s2 = await axios.post(`${API_URL}/users`, {
            name: 'Student Two',
            email: `${student2Id}@test.com`,
            password: 'password',
            role: 'Student',
            studentId: student2Id,
            department: 'CS'
        });
        console.log('Student 2 Created:', s2.data._id);

        console.log('Student 2 Created:', s2.data._id);

        // LOGIN as Student 1
        console.log('\nLogging in as Student 1...');
        const loginRes = await axios.post(`${API_URL}/users/login`, {
            email: `${student1Id}@test.com`,
            password: 'password'
        });
        const token = loginRes.data.token;
        console.log('Login Successful, Token received.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Verify Member 1
        console.log('\nVerifying Member 1...');
        const v1 = await axios.post(`${API_URL}/groups/verify-member`, {
            studentId: student1Id
        }, config);
        console.log('Verification Result:', v1.data);

        // 3. Create Group
        console.log('\nCreating Group...');
        const groupRes = await axios.post(`${API_URL}/groups`, {
            memberIds: [s1.data._id, s2.data._id]
        }, config);
        console.log('Group Created:', groupRes.data);

    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
            if (error.code === 'ECONNREFUSED') {
                console.error('Connection refused. Is the server running on port 5000?');
            }
        }
    }
};

testGroup();
