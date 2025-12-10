const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const progressRoutes = require('./routes/progressRoutes');
const externalRoutes = require('./routes/externalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const supervisorLogRoutes = require('./routes/supervisorLogRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const evaluatorRoutes = require('./routes/evaluatorRoutes');

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/supervisor-logs', supervisorLogRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/evaluator', evaluatorRoutes);
app.use('/uploads', express.static('uploads'));

// Database Connection
const connectDB = async () => {
    try {
        // Clean and encode the connection string if needed, similar to verify_db.js
        // For now, we assume the .env will contain the correct URI
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('FYP Management System API is running...');
});

// Start Server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
