const axios = require('axios');

const checkEndpoint = async () => {
    try {
        console.log('Testing GET http://127.0.0.1:5000/api/users');
        const res = await axios.get('http://127.0.0.1:5000/api/users');
        console.log(`Status: ${res.status}`);
        console.log(`Count: ${res.data.length}`);
        if (res.data.length > 0) {
            const first = res.data[0];
            console.log(`First User: ${first.name} (${first.role})`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Response:', error.response.status);
    }
};

checkEndpoint();
