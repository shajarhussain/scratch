const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testProposal = async () => {
    try {
        // 1. Create a Supervisor
        console.log('Creating Supervisor...');
        const supEmail = `sup${Math.floor(Math.random() * 10000)}@test.com`;
        const supervisor = await axios.post(`${API_URL}/users`, {
            name: 'Dr. Supervisor',
            email: supEmail,
            password: 'password',
            role: 'Supervisor',
            department: 'CS'
        });
        console.log('Supervisor Created:', supervisor.data._id);

        // 2. Create Students & Group
        console.log('\nCreating Group...');
        const s1Id = `S${Math.floor(Math.random() * 10000)}`;
        const s1 = await axios.post(`${API_URL}/users`, {
            name: 'Student Prop 1',
            email: `${s1Id}@test.com`,
            password: 'password',
            role: 'Student',
            studentId: s1Id,
            department: 'CS'
        });

        const groupRes = await axios.post(`${API_URL}/groups`, {
            memberIds: [s1.data._id]
        });
        console.log('Group Created:', groupRes.data._id);

        // 3. Submit Proposal
        console.log('\nSubmitting Proposal...');
        const proposalRes = await axios.post(`${API_URL}/proposals`, {
            groupId: groupRes.data._id,
            title: 'AI Based FYP System',
            description: 'A system to manage FYPs using AI.',
            supervisorId: supervisor.data._id
        });
        console.log('Proposal Submitted:', proposalRes.data);

        // 4. Verify Duplicate Prevention
        console.log('\nTesting Duplicate Submission...');
        try {
            await axios.post(`${API_URL}/proposals`, {
                groupId: groupRes.data._id,
                title: 'Another Title',
                description: 'Desc',
                supervisorId: supervisor.data._id
            });
        } catch (err) {
            if (err.response) {
                console.log('Duplicate Check Passed:', err.response.data.message);
            } else {
                console.error('Duplicate Check Failed (Unexpected Error):', err.message);
            }
        }

    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
            if (error.code === 'ECONNREFUSED') {
                console.error('Connection refused. Is the server running on port 5000?');
            }
        }
    }
};

testProposal();
