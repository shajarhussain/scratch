const axios = require('axios');

const testLogs = async () => {
    try {
        // 1. Login as Supervisor
        console.log('Logging in...');
        const loginRes = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'tamim000@gmail.com', // Supervisor email
            password: '123456' // Assume generic password or I might need to reset it if unknown
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // 2. Fetch Logs
        console.log('Fetching logs...');
        const res = await axios.get('http://127.0.0.1:5000/api/supervisor-logs', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Logs fetched successfully:', res.data.length);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 500) {
            console.log('CAUGHT 500 ERROR!');
        }
    }
};

testLogs();
