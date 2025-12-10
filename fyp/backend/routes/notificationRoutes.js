const express = require('express');
const router = express.Router();
const { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead, clearAllNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/:id/read', protect, markAsRead);
router.put('/mark-all-read', protect, markAllAsRead);
router.delete('/clear-all', protect, clearAllNotifications);

module.exports = router;
