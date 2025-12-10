const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

const testUpload = async () => {
    try {
        // 1. Create a dummy file
        const filePath = path.join(__dirname, 'test_doc.pdf');
        fs.writeFileSync(filePath, 'This is a test proposal document content.');

        // 2. Get a Supervisor (reuse existing or create)
        // For simplicity, let's create a new one to be sure
        const supEmail = `sup${Math.floor(Math.random() * 100000)}@test.com`;
        const supervisor = await axios.post(`${API_URL}/users`, {
            name: 'Dr. Upload',
            email: supEmail,
            password: 'password',
            role: 'Supervisor',
            department: 'CS'
        });
        const supervisorId = supervisor.data._id;

        // 3. Create a Group (reuse existing or create)
        const s1Id = `S${Math.floor(Math.random() * 100000)}`;
        const s1 = await axios.post(`${API_URL}/users`, {
            name: 'Student Upload',
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

        // 4. Submit Proposal with File
        console.log('Submitting Proposal with File...');
        const form = new FormData();
        form.append('groupId', groupId);
        form.append('title', 'Upload Test Proposal');
        form.append('description', 'Testing file upload.');
        form.append('supervisorId', supervisorId);
        form.append('file', fs.createReadStream(filePath));

        const proposalRes = await axios.post(`${API_URL}/proposals`, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Proposal Submitted:', proposalRes.data);

        if (proposalRes.data.fileUrl) {
            console.log('File URL:', proposalRes.data.fileUrl);
            console.log('SUCCESS: File uploaded.');
        } else {
            console.error('FAILURE: No fileUrl returned.');
        }

        // Cleanup
        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
};

testUpload();
