const axios = require('axios');

// Try to find working coordinator credentials
const testLogin = async () => {
    const credentials = [
        { email: 'coordinator@test.com', password: 'coordinator123' },
        { email: 'coordinator@demo.com', password: 'coordinator123' },
        { email: 'hod@test.com', password: 'hod123' }
    ];

    console.log('Testing credentials...\n');

    for (const cred of credentials) {
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/users/login', {
                ...cred,
                role: 'Coordinator'
            });
            console.log(`✅ WORKING: ${cred.email} / ${cred.password}`);
            console.log(`   Token: ${res.data.token.substring(0, 20)}...`);
            console.log(`   Name: ${res.data.name}`);
            console.log(`   Role: ${res.data.role}\n`);
            return cred;
        } catch (err) {
            console.log(`❌ Failed: ${cred.email}`);
        }
    }

    console.log('\n⚠️  No working coordinator found. Trying to create one...');

    // Try creating via admin
    try {
        const adminLogin = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'admin@test.com',
            password: 'admin123',
            role: 'Admin'
        });
        console.log('✅ Admin login successful');

        // Create coordinator
        const created = await axios.post(
            'http://127.0.0.1:5000/api/admin/users',
            {
                name: 'Test Coordinator',
                email: 'coord001@test.com',
                password: 'test123',
                role: 'Coordinator',
                registrationNumber: 'COORD001',
                department: 'CS'
            },
            { headers: { Authorization: `Bearer ${adminLogin.data.token}` } }
        );
        console.log('✅ Created new coordinator: coord001@test.com / test123');
        return { email: 'coord001@test.com', password: 'test123' };
    } catch (err) {
        console.log('❌ Could not create coordinator:', err.response?.data?.message || err.message);
    }
};

testLogin();
