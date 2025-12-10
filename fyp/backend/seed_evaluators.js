const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api/admin/users';

const seedEvaluators = async () => {
    // You'll need an admin token first
    // Login as admin to get token
    console.log('Starting evaluator seed...');
    console.log('Please ensure you have admin credentials ready.');

    // Internal Evaluators
    const internalEvaluators = [
        {
            name: 'Dr. Sarah Wilson',
            email: 'sarah.wilson@university.edu',
            password: 'evaluator123',
            role: 'InternalEvaluator',
            registrationNumber: 'IE001',
            department: 'CS'
        },
        {
            name: 'Dr. Michael Chen',
            email: 'michael.chen@university.edu',
            password: 'evaluator123',
            role: 'InternalEvaluator',
            registrationNumber: 'IE002',
            department: 'SE'
        },
        {
            name: 'Dr. Emily Roberts',
            email: 'emily.roberts@university.edu',
            password: 'evaluator123',
            role: 'InternalEvaluator',
            registrationNumber: 'IE003',
            department: 'CS'
        }
    ];

    // External Evaluators
    const externalEvaluators = [
        {
            name: 'Dr. James Anderson',
            email: 'james.anderson@external.com',
            password: 'external123',
            role: 'ExternalEvaluator',
            registrationNumber: 'EE001',
            affiliation: 'Tech Industry Expert'
        },
        {
            name: 'Dr. Lisa Martinez',
            email: 'lisa.martinez@company.com',
            password: 'external123',
            role: 'ExternalEvaluator',
            registrationNumber: 'EE002',
            affiliation: 'Software Architect - TechCorp'
        }
    ];

    // Get admin token
    console.log('\n=== LOGIN AS ADMIN ===');
    let adminToken;
    try {
        const loginRes = await axios.post('http://127.0.0.1:5000/api/users/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });
        adminToken = loginRes.data.token;
        console.log('✅ Admin logged in successfully');
    } catch (error) {
        console.error('❌ Failed to login as admin:', error.response?.data?.message || error.message);
        console.error('Please ensure admin account exists with email: admin@test.com, password: admin123');
        return;
    }

    // Create Internal Evaluators
    console.log('\n=== CREATING INTERNAL EVALUATORS ===');
    for (const evaluator of internalEvaluators) {
        try {
            await axios.post(API_URL, evaluator, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`✅ Created: ${evaluator.name} (${evaluator.email})`);
        } catch (error) {
            if (error.response?.data?.message === 'User already exists') {
                console.log(`⏭️  Skipped: ${evaluator.name} - Already exists`);
            } else {
                console.error(`❌ Failed: ${evaluator.name}`, error.response?.data?.message || error.message);
            }
        }
    }

    // Create External Evaluators
    console.log('\n=== CREATING EXTERNAL EVALUATORS ===');
    for (const evaluator of externalEvaluators) {
        try {
            await axios.post(API_URL, evaluator, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`✅ Created: ${evaluator.name} (${evaluator.email})`);
        } catch (error) {
            if (error.response?.data?.message === 'User already exists') {
                console.log(`⏭️  Skipped: ${evaluator.name} - Already exists`);
            } else {
                console.error(`❌ Failed: ${evaluator.name}`, error.response?.data?.message || error.message);
            }
        }
    }

    console.log('\n=== SEED COMPLETE ===');
    console.log('\n📋 CREDENTIALS FOR TESTING:\n');

    console.log('INTERNAL EVALUATORS:');
    internalEvaluators.forEach(e => {
        console.log(`  Email: ${e.email}`);
        console.log(`  Password: evaluator123`);
        console.log(`  Role: InternalEvaluator\n`);
    });

    console.log('EXTERNAL EVALUATORS:');
    externalEvaluators.forEach(e => {
        console.log(`  Email: ${e.email}`);
        console.log(`  Password: external123`);
        console.log(`  Role: ExternalEvaluator`);
        console.log(`  (Use magic link for access)\n`);
    });

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Login as coordinator');
    console.log('2. Create a Final Viva schedule');
    console.log('3. Assign an external evaluator (Dr. James Anderson or Dr. Lisa Martinez)');
    console.log('4. Magic link will be auto-generated in console');
    console.log('5. Test internal evaluator by logging in as Dr. Sarah Wilson');
    console.log('6. Test external evaluator by using the magic link\n');
};

seedEvaluators();
