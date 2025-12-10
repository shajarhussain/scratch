const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testEvaluation = async () => {
    try {
        // 1. Create Group (Reuse or New)
        console.log('Creating Group...');
        const s1Id = `S${Math.floor(Math.random() * 100000)}`;
        const s1 = await axios.post(`${API_URL}/users`, {
            name: 'Student Eval',
            email: `${s1Id}@test.com`,
            password: 'password',
            role: 'Student',
            studentId: s1Id,
            department: 'CS'
        });
        const groupRes = await axios.post(`${API_URL}/groups`, {
            memberIds: [s1.data._id]
        });
        const groupId = groupRes.data._id;
        console.log('Group Created:', groupId);

        // 2. Schedule Defense
        console.log('\nScheduling Defense...');
        const scheduleRes = await axios.post(`${API_URL}/evaluations/schedule`, {
            groupId: groupId,
            stage: 'Proposal Defense',
            panelIds: [], // Empty for now, or create evaluators
            date: new Date().toISOString(),
            venue: 'Room 101'
        });
        console.log('Defense Scheduled:', scheduleRes.data._id);
        const evalId = scheduleRes.data._id;

        // 3. Submit Marks
        console.log('\nSubmitting Marks...');
        const marksRes = await axios.put(`${API_URL}/evaluations/${evalId}/marks`, {
            supervisor: 10,
            internal: 15,
            external: 20,
            feedback: 'Good work, proceed.'
        });
        console.log('Marks Submitted:', marksRes.data);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
};

testEvaluation();
