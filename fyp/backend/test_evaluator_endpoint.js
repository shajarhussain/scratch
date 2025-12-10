const axios = require('axios');

const testEvaluatorEndpoint = async () => {
    try {
        // First check if server is running
        const healthCheck = await axios.get('http://127.0.0.1:5000/api/users');
        console.log('✅ Server is running');
        console.log('Users endpoint works:', healthCheck.status);

        // Try evaluator endpoint (should fail without proper auth but at least show if route exists)
        try {
            await axios.get('http://127.0.0.1:5000/api/evaluator/assignments');
        } catch (err) {
            if (err.response) {
                console.log('\n✅ Evaluator route EXISTS');
                console.log('Status:', err.response.status);
                console.log('Message:', err.response.data?.message || 'Requires authentication');
            } else {
                console.log('\n❌ Evaluator route NOT FOUND');
                console.log('Error:', err.message);
            }
        }

    } catch (error) {
        console.log('❌ Server not responding');
        console.log('Error:', error.message);
        console.log('\n💡 Solution: Start the backend server with: npm start');
    }
};

testEvaluatorEndpoint();
