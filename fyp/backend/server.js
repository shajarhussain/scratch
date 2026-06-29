const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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

// Serve frontend build in production (single-service deploy)
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Database Connection — tries MONGO_URI first, falls back to in-process MongoMemoryServer
const connectDB = async () => {
    const tryAtlas = async () => {
        if (!process.env.MONGO_URI || process.env.USE_MEMORY_DB === 'true') return false;
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return true;
        } catch (error) {
            console.warn(`Atlas connection failed (${error.message}). Falling back to in-process MongoMemoryServer.`);
            return false;
        }
    };

    if (await tryAtlas()) return;

    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create({
        instance: { dbName: 'fyp', storageEngine: 'wiredTiger' },
    });
    const uri = mem.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`MongoMemoryServer started at ${uri}`);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed default users so the app is usable immediately
    await seedDefaultUsers();
};

const seedDefaultUsers = async () => {
    const User = require('./models/userModel');
    const defaults = [
        { name: 'System Admin',     email: 'admin@fyp.com',         password: 'admin123',    role: 'Admin',            department: 'Administration' },
        { name: 'Demo Student',     email: 'student@demo.com',      password: 'password123', role: 'Student',          department: 'CS', studentId: 'S12345' },
        { name: 'Dr. Demo',         email: 'supervisor@demo.com',   password: 'password123', role: 'Supervisor',       department: 'CS' },
        { name: 'Coordinator Demo', email: 'coordinator@demo.com',  password: 'password123', role: 'Coordinator',      department: 'CS' },
        { name: 'HOD Demo',         email: 'hod@demo.com',          password: 'password123', role: 'HOD',              department: 'CS' },
        { name: 'Internal Eval',    email: 'internal@demo.com',     password: 'password123', role: 'InternalEvaluator',department: 'CS' },
        { name: 'External Eval',    email: 'external@demo.com',     password: 'password123', role: 'ExternalEvaluator',department: 'CS', affiliation: 'External University' },
    ];
    for (const u of defaults) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) await User.create(u);
    }
    console.log(`Seeded ${defaults.length} default users (admin@fyp.com / admin123, etc.)`);
};

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host,
    });
});

// SPA fallback: any non-API route serves the React index.html (express 5 regex)
app.get(/^(?!\/api|\/uploads).*/, (req, res, next) => {
    const indexFile = path.join(distPath, 'index.html');
    if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
    }
    return res.send('FYP Management System API is running...');
});

// Start Server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Fatal DB error:', err);
        process.exit(1);
    });
