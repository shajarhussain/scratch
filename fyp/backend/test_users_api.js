const axios = require('axios');

const checkEndpoint = async () => {
    try {
        console.log('Testing GET http://127.0.0.1:5000/api/users/');
        const res = await axios.get('http://127.0.0.1:5000/api/users/');
        console.log(`Status: ${res.status}`);
        console.log(`Data type: ${Array.isArray(res.data) ? 'Array' : typeof res.data}`);
        console.log(`Count: ${res.data.length}`);
        if (res.data.length > 0) {
            console.log('Sample user:', res.data[0]);
        }
    } catch (error) {
        console.error('Error hitting endpoint:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
};

checkEndpoint();
