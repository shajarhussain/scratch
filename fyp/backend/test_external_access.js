const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';

const testExternalAccess = async () => {
    try {
        // 1. Login as Admin/Coordinator
        // Assuming 'admin@example.com' / '123456' exists from seed or we create one.
        // Let's try to login, if fail, we might need to seed.
        let coordinatorToken;
        try {
            const loginRes = await axios.post(`${API_URL}/users/login`, {
                email: 'coordinator@demo.com',
                password: 'password123'
            });
            coordinatorToken = loginRes.data.token;
            console.log('Logged in as Coordinator');
        } catch (e) {
            console.log('Coordinator login failed, trying Admin');
            try {
                const adminRes = await axios.post(`${API_URL}/users/login`, {
                    email: 'admin@example.com',
                    password: 'password123'
                });
                coordinatorToken = adminRes.data.token;
                console.log('Logged in as Admin');
            } catch (err) {
                console.error('Login failed completely. Make sure users are seeded.');
                return;
            }
        }

        // 2. Invite Evaluator
        const invitePayload = {
            name: 'Dr. External',
            email: 'Dr.External@example.com',
            affiliation: 'Tech Corp',
            assignedGroups: [] // Can add group IDs if we have them
        };

        const inviteRes = await axios.post(`${API_URL}/external/invite`, invitePayload, {
            headers: { Authorization: `Bearer ${coordinatorToken}` }
        });

        console.log('Invitation Response:', inviteRes.data);
        const { debugToken } = inviteRes.data;

        if (!debugToken) {
            console.error('No debug token returned!');
            return;
        }

        // 3. Validate Access with Token
        const accessRes = await axios.post(`${API_URL}/external/validate-access`, {
            token: debugToken
        });

        console.log('Access Validation Response:', accessRes.data);

        if (accessRes.data.token && accessRes.data.role === 'ExternalEvaluator') {
            console.log('SUCCESS: External Evaluator logged in via Magic Link!');
        } else {
            console.error('FAILURE: Could not validate access properly.');
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
};

testExternalAccess();
