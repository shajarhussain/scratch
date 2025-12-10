const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Group = require('./models/groupModel');
const Proposal = require('./models/proposalModel');

// Load env from current directory explicitly
dotenv.config({ path: path.join(__dirname, '.env') });

const fixStatus = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Use the URI from env
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is undefined. Check .env file.');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully.');

        // Find all groups with approved supervisor request
        // Sometimes approval is stored in supervisorApprovalStatus
        const groups = await Group.find({}).populate('proposal');

        console.log(`Total Groups: ${groups.length}`);

        for (const group of groups) {
            console.log(`\nProcessing Group: ${group.groupCode || group._id}`);

            // Check if supervisor approved
            if (group.supervisorApprovalStatus === 'Approved') {
                console.log('  Supervisor Request IS Approved.');

                // 1. Ensure Group Status is Approved
                if (group.status !== 'Approved') {
                    console.log(`  Group Status was ${group.status}. Setting to Approved.`);
                    group.status = 'Approved';
                    await group.save();
                } else {
                    console.log('  Group Status is already Approved.');
                }

                // 2. Ensure Proposal Status is Approved
                if (group.proposal) {
                    const proposal = await Proposal.findById(group.proposal._id); // Reload to be safe
                    if (proposal) {
                        if (proposal.status !== 'Approved') {
                            console.log(`  Proposal Status was ${proposal.status}. Setting to Approved.`);
                            proposal.status = 'Approved';
                            await proposal.save();
                        } else {
                            console.log('  Proposal Status is already Approved.');
                        }
                    }
                } else {
                    console.log('  No Proposal Linked in Group object. Searching by group ID...');
                    const prop = await Proposal.findOne({ group: group._id });
                    if (prop) {
                        console.log('  Found orphaned proposal. Linking and Approving...');
                        group.proposal = prop._id;
                        await group.save();

                        if (prop.status !== 'Approved') {
                            prop.status = 'Approved';
                            await prop.save();
                        }
                    } else {
                        console.log('  No Proposal found for this group.');
                    }
                }
            } else {
                console.log(`  Skipping. Supervisor Approval Status: ${group.supervisorApprovalStatus}`);
            }
        }

        console.log('\nFix Complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixStatus();
