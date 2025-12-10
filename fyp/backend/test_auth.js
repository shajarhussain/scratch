const axios = require('axios');

const API_URL = 'http://localhost:5000/api/users';

const testAuth = async () => {
    try {
        // 1. Register a new user
        console.log('Testing Registration...');
        // Use a random email to avoid "User already exists"
        const randomEmail = `test${Math.floor(Math.random() * 10000)}@student.com`;

        const regRes = await axios.post(API_URL, {
            name: 'Test Student',
            email: randomEmail,
            password: 'password123',
            role: 'Student',
            studentId: 'S12345',
            department: 'CS',
        });
        console.log('Registration Success:', regRes.data);

        // 2. Login
        console.log('\nTesting Login...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: randomEmail,
            password: 'password123',
        });
        console.log('Login Success:', loginRes.data);

    } catch (error) {
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
        }
    }
};

testAuth();
