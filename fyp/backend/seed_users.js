const axios = require('axios');

const API_URL = 'http://localhost:5000/api/users';

const seedUsers = async () => {
    const students = [
        { name: 'Alice Smith', id: 'S1001', dept: 'CS' },
        { name: 'Bob Jones', id: 'S1002', dept: 'CS' },
        { name: 'Charlie Brown', id: 'S1003', dept: 'SE' },
        { name: 'Diana Prince', id: 'S1004', dept: 'SE' },
    ];

    console.log('Seeding Users...');

    for (const s of students) {
        try {
            await axios.post(API_URL, {
                name: s.name,
                email: `${s.id.toLowerCase()}@test.com`,
                password: 'password123',
                role: 'Student',
                studentId: s.id,
                department: s.dept
            });
            console.log(`Created: ${s.name} (${s.id})`);
        } catch (error) {
            if (error.response && error.response.data.message === 'User already exists') {
                console.log(`Skipped: ${s.name} (${s.id}) - Already exists`);
            } else {
                console.error(`Failed: ${s.name}`, error.message);
            }
        }
    }
};

seedUsers();
