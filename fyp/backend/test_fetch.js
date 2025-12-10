const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const run = async () => {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/users/login`, {
            email: 's1001@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token:', token.substring(0, 20) + '...');

        // 2. Fetch Attendance Logs
        console.log('Fetching Attendance Logs...');
        try {
            const logsRes = await axios.get(`${API_URL}/attendance/my-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Attendance Logs Response:');
            console.log(JSON.stringify(logsRes.data, null, 2));
        } catch (err) {
            console.error('Fetch Logs Error:', err.response ? err.response.data : err.message);
        }

    } catch (error) {
        console.error('Login Error:', error.response ? error.response.data : error.message);
    }
};

run();
