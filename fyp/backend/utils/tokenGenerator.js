const crypto = require('crypto');

/**
 * Generate a secure random token for external evaluator access
 */
const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate magic link URL for external evaluator
 */
const generateMagicLink = (token, baseUrl = 'http://localhost:3000') => {
    return `${baseUrl}/external/access/${token}`;
};

module.exports = {
    generateSecureToken,
    generateMagicLink
};
