const AuditLog = require('../models/auditLogModel');

const logAction = async (userId, action, details, entityId = null, entityType = null) => {
    try {
        await AuditLog.create({
            user: userId,
            action,
            details,
            entityId,
            entityType
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

module.exports = { logAction };
