const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const createAdmin = async () => {
    try {
        // Create admin user
        const { data } = await axios.post(`${API_URL}/users`, {
            name: 'System Admin',
            email: 'admin@fyp.com',
            password: 'admin123',
            role: 'Admin',
            department: 'Administration'
        });

        console.log('Admin Created:', data);
        console.log('\n=================================');
        console.log('Login Credentials:');
        console.log('Email: admin@fyp.com');
        console.log('Password: admin123');
        console.log('Role: Admin');
        console.log('=================================\n');

    } catch (error) {
        if (error.response?.data?.message === 'User already exists') {
            console.log('Admin user already exists!');
            console.log('\n=================================');
            console.log('Login Credentials:');
            console.log('Email: admin@fyp.com');
            console.log('Password: admin123');
            console.log('Role: Admin');
            console.log('=================================\n');
        } else {
            console.error('Error creating admin:', error.response?.data || error.message);
        }
    }
};

createAdmin();
