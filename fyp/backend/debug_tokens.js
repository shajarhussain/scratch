const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ExternalToken = require('./models/externalTokenModel');
const User = require('./models/userModel');

dotenv.config();

const debugTokens = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find the 5 most recent tokens
        const tokens = await ExternalToken.find().sort({ createdAt: -1 }).limit(5).populate('user');

        console.log('\n--- Recent External Tokens ---');
        tokens.forEach(t => {
            console.log(`\nID: ${t._id}`);
            console.log(`Token Hash: ${t.tokenHash}`);
            console.log(`User: ${t.user?.name} (${t.user?.email})`);
            console.log(`Created: ${t.createdAt}`);
            console.log(`Expires: ${t.expiresAt}`);
            console.log(`Active: ${t.isActive}`);

            // Check validity logic
            const now = new Date();
            const isValid = t && t.isActive && now < t.expiresAt;
            console.log(`✅ IS VALID? ${isValid ? 'YES' : 'NO'}`);

            if (!isValid) {
                console.log(`   Reasons: Active=${t.isActive}, NotExpired=${now < t.expiresAt}`);
            }

            console.log(`🔗 Mock Link: ${process.env.FRONTEND_URL}/external/access/${t.tokenHash}`);
        });

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

debugTokens();
