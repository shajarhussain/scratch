const mongoose = require('mongoose');

const deliveryStatusSchema = new mongoose.Schema({
    sent: {
        type: Boolean,
        default: false
    },
    sentAt: Date,
    readAt: Date
}, { _id: false });

const notificationSchema = new mongoose.Schema({
    // Recipient
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipientRole: {
        type: String,
        required: true
    },

    // Notification Type
    type: {
        type: String,
        enum: [
            'Schedule Created',
            'Schedule Updated',
            'Schedule Cancelled',
            'Schedule Rescheduled',
            'Upcoming Event Reminder',
            'Conflict Alert',
            'Access Granted',
            'Deadline Approaching',
            'Coordinator Confirmation'
        ],
        required: true
    },

    // Related Schedule (if applicable)
    schedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule'
    },
    eventType: String,
    eventDate: Date,

    // Content
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    actionRequired: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },

    // Delivery Channels
    channels: {
        inApp: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: false
        },
        sms: {
            type: Boolean,
            default: false
        }
    },

    // Delivery Status
    deliveryStatus: {
        inApp: deliveryStatusSchema,
        email: deliveryStatusSchema
    },

    // Read Status
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,

    // Metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ schedule: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Mark as read method
notificationSchema.methods.markAsRead = function () {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
