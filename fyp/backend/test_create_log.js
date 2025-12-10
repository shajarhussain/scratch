const axios = require('axios');

const createLog = async () => {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'tamim000@gmail.com',
            password: '123456'
        });

        const token = loginRes.data.token;
        console.log('Login successful.');

        const logData = {
            groupId: '6935821cbf8755f3c23591a7', // The group for Abdul Wahab
            logNumber: 1,
            meetingDate: new Date().toISOString(),
            meetingType: 'Weekly',
            attendanceStatus: 'Present',
            workReviewed: 'Initial setup',
            progressStatus: 'On Track',
            qualityAssessment: 'Good',
            logStatus: 'Approved'
        };

        console.log('Creating log...');
        await axios.post('http://127.0.0.1:5000/api/supervisor-logs', logData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Log created successfully.');

        // Now fetch
        console.log('Fetching logs...');
        const res = await axios.get('http://127.0.0.1:5000/api/supervisor-logs/my-logs', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Logs fetched:', res.data.length);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

createLog();
