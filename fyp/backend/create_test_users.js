const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const createTestUsers = async () => {
    try {
        // 1. Create Student
        try {
            await axios.post(`${API_URL}/users`, {
                name: 'Demo Student',
                email: 'student@demo.com',
                password: 'password123',
                role: 'Student',
                studentId: 'S12345',
                department: 'CS'
            });
            console.log('Student Created: student@demo.com / password123');
        } catch (e) {
            console.log('Student might already exist:', e.response?.data?.message || e.message);
        }

        // 2. Create Supervisor
        try {
            await axios.post(`${API_URL}/users`, {
                name: 'Dr. Demo',
                email: 'supervisor@demo.com',
                password: 'password123',
                role: 'Supervisor',
                department: 'CS'
            });
            console.log('Supervisor Created: supervisor@demo.com / password123');
        } catch (e) {
            console.log('Supervisor might already exist:', e.response?.data?.message || e.message);
        }

        // 3. Create Coordinator
        try {
            await axios.post(`${API_URL}/users`, {
                name: 'Coordinator Demo',
                email: 'coordinator@demo.com',
                password: 'password123',
                role: 'Coordinator',
                department: 'CS'
            });
            console.log('Coordinator Created: coordinator@demo.com / password123');
        } catch (e) {
            console.log('Coordinator might already exist:', e.response?.data?.message || e.message);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
};

createTestUsers();
