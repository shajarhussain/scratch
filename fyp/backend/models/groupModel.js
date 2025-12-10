const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupCode: {
    type: String,
    unique: true,
    sparse: true // Allows creation before code is generated
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  leader: { // Although "no leader" logic, we might need a contact point, but strictly following "all equal" we can omit or just use index 0
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  supervisorRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  supervisorApprovalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  rejectionReason: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  }
}, {
  timestamps: true
});

// Ensure max 3 members
groupSchema.path('members').validate(function (value) {
  return value.length >= 1 && value.length <= 3;
}, 'Group must have between 1 and 3 members');

// Auto-generate group code before saving
groupSchema.pre('save', async function () {
  if (!this.groupCode && this.isNew) {
    const year = new Date().getFullYear();

    // Find the highest group number for this year
    const lastGroup = await this.constructor.findOne({
      groupCode: new RegExp(`^FYP-${year}-`)
    }).sort({ groupCode: -1 });

    let nextNumber = 1;
    if (lastGroup && lastGroup.groupCode) {
      const match = lastGroup.groupCode.match(/FYP-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Generate code with zero-padding (e.g., FYP-2025-001)
    this.groupCode = `FYP-${year}-${String(nextNumber).padStart(3, '0')}`;
  }
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
