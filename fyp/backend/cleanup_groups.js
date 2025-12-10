const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Group = require('./models/groupModel');

// Load env from current directory explicitly
dotenv.config({ path: path.join(__dirname, '.env') });

const cleanGroups = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Use the URI from env
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is undefined. Check .env file.');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully.');

        // Fetch all groups sorted by newest first
        const groups = await Group.find({}).sort({ createdAt: -1 });

        console.log(`Total groups found: ${groups.length}`);

        if (groups.length <= 3) {
            console.log('3 or fewer groups exist. No action taken.');
            process.exit(0);
        }

        // Keep the first 3 (Newest 3)
        const groupsToKeep = groups.slice(0, 3);
        const keepIds = groupsToKeep.map(g => g._id);

        console.log('\n--- Keeping These 3 Groups ---');
        groupsToKeep.forEach((g, index) => {
            console.log(`${index + 1}. ID: ${g._id} | Created: ${g.createdAt} | Members: ${g.members && g.members.length}`);
        });

        // Delete the rest
        const deleteResult = await Group.deleteMany({ _id: { $nin: keepIds } });

        console.log(`\n--- Deletion Result ---`);
        console.log(`Deleted ${deleteResult.deletedCount} groups.`);
        console.log('Cleanup complete.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanGroups();
