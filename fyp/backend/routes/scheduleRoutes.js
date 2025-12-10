const express = require('express');
const router = express.Router();
const {
    createSchedule,
    updateSchedule,
    getSchedules,
    getCalendarView,
    rescheduleEvent,
    markAsCompleted,
    cancelSchedule,
    getUpcomingEvents,
    checkConflicts
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

const { uploadSRS, reviewSRS, deleteSRS, uploadArtifact, deleteArtifact } = require('../controllers/srsController');

// Coordinator/Admin only routes
router.post('/', protect, authorize('Coordinator', 'Admin'), createSchedule);
router.put('/:id', protect, authorize('Coordinator', 'Admin'), updateSchedule);
router.post('/:id/resend-invite', protect, authorize('Coordinator', 'Admin'), require('../controllers/scheduleController').resendExternalInvitation);
router.post('/:id/reschedule', protect, authorize('Coordinator', 'Admin'), rescheduleEvent);
router.post('/:id/complete', protect, authorize('Coordinator', 'Admin'), markAsCompleted);
router.delete('/:id', protect, authorize('Coordinator', 'Admin'), cancelSchedule);
router.post('/check-conflicts', protect, authorize('Coordinator', 'Admin'), checkConflicts);

// SRS Routes
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `SRS-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /doc|docx|pdf|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
        cb(null, true);
    } else {
        cb(new Error('Only .doc, .docx, .pdf and .zip files are allowed!'));
    }
};

const upload = multer({ storage, fileFilter });

// SRS Routes
router.post('/:id/srs/upload', protect, authorize('Student'), upload.single('file'), uploadSRS);
router.delete('/:id/srs', protect, authorize('Student', 'Coordinator'), deleteSRS);
router.put('/:id/srs/review', protect, authorize('Supervisor'), reviewSRS);

// Artifact Routes
router.post('/:id/artifacts', protect, authorize('Student'), upload.single('file'), uploadArtifact);
router.delete('/:id/artifacts/:artifactId', protect, authorize('Student', 'Coordinator'), deleteArtifact);
router.post('/:id/deliverable/submit', protect, authorize('Student'), require('../controllers/srsController').submitDeliverable);

// Multi-role access routes (with role-based filtering in controller)
router.get('/', protect, getSchedules);
router.get('/calendar/:month', protect, getCalendarView);
router.get('/upcoming', protect, getUpcomingEvents);

module.exports = router;
