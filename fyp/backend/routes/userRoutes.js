const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getSupervisors, forgotPassword, getAllUsers } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/', registerUser);
router.get('/', getAllUsers); // Changed order or just added it. Note: protect middleware should be used if strict.
router.get('/supervisors', getSupervisors);
router.post('/forgot-password', forgotPassword);

module.exports = router;
