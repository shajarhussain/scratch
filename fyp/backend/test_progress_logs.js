const axios = require('axios');

const testProgress = async () => {
    try {
        console.log('Logging in as Supervisor...');
        const loginRes = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'tamim000@gmail.com',
            password: '123456'
        });

        const token = loginRes.data.token;
        const role = loginRes.data.role; // Check what role login returns
        console.log('Login successful. Role:', role);

        console.log('Fetching Supervisor Progress Logs...');
        const res = await axios.get('http://127.0.0.1:5000/api/progress/supervisor/groups', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Logs fetched successfully:', res.data.length);
    } catch (error) {
        console.error('Error fetching logs:', error.response ? error.response.data : error.message);
    }
};

testProgress();
