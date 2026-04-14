const Schedule = require('../models/scheduleModel');

// @desc    Upload SRS Document (Student)
// @route   POST /api/schedules/:id/srs/upload
// @access  Private (Student)
const uploadSRS = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Time-based validation
        // Time-based validation
        const now = new Date();
        const end = new Date(schedule.eventDate); // Deadline is the event date (presentation day)

        // 1. Check Start Date (if set)
        if (schedule.srsUploadStartDate) {
            const start = new Date(schedule.srsUploadStartDate);
            // Reset times to compare dates only to avoid timezone confusion for start date
            start.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (today < start) {
                return res.status(400).json({
                    message: `SRS uploads are not open yet. Starts on ${start.toLocaleDateString()}`
                });
            }
        }

        // 2. Check Deadline
        // Set end time to end of the day or exact event time if desired. 
        // For now, let's allow upload until the end of the event day? 
        // Or strictly before event starts. Usually before event starts.
        // Let's assume end of that day for simplicity or raw date comparison.
        // If eventDate is 00:00, then "now > end" triggers as soon as that day starts, which might be wrong.
        // Let's set deadline to End of Day of Event Date.
        end.setHours(23, 59, 59, 999);

        if (now > end) {
            return res.status(400).json({ message: 'SRS upload deadline has passed (Event Date).' });
        }

        let fileUrl = req.body.fileUrl;

        if (req.file) {
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        if (!fileUrl) {
            return res.status(400).json({ message: 'No file uploaded or URL provided' });
        }

        schedule.srsDeliverable = {
            fileUrl,
            submittedAt: now,
            status: 'Submitted',
            supervisorApproved: false
        };

        await schedule.save();
        res.json({ message: 'SRS uploaded successfully', schedule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Supervisor Review SRS
// @route   PUT /api/schedules/:id/srs/review
// @access  Private (Supervisor)
const reviewSRS = async (req, res) => {
    try {
        const { status, comments } = req.body; // status: 'Approved' | 'Changes Requested'
        const schedule = await Schedule.findById(req.params.id);

        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        // Ensure user is the assigned supervisor
        if (schedule.supervisor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to review this SRS' });
        }

        if (status === 'Approved') {
            schedule.srsDeliverable.status = 'Approved';
            schedule.srsDeliverable.supervisorApproved = true;
            schedule.srsDeliverable.supervisorApprovedAt = new Date();
        } else if (status === 'Changes Requested') {
            schedule.srsDeliverable.status = 'Changes Requested';
            schedule.srsDeliverable.supervisorApproved = false;
        } else {
            schedule.srsDeliverable.status = 'Under Review';
        }

        schedule.srsDeliverable.supervisorComments = comments;

        await schedule.save();
        res.json({ message: 'SRS review submitted', schedule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteSRS = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Allow if window is open (or maybe just allow if not approved?)
        // For simplicity, allow delete if not 'Approved' yet.
        if (schedule.srsDeliverable && schedule.srsDeliverable.status === 'Approved') {
            return res.status(400).json({ message: 'Cannot delete an approved SRS document.' });
        }

        schedule.srsDeliverable = {
            fileUrl: null,
            submittedAt: null,
            status: 'Pending',
            supervisorApproved: false,
            supervisorComments: null
        };

        await schedule.save();
        res.json({ message: 'SRS document deleted successfully', schedule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// @desc    Upload Additional Artifacts (Student)
// @route   POST /api/schedules/:id/artifacts
// @access  Private (Student)
const uploadArtifact = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        // Enforce SRS Approval rule ONLY for Interim Evaluation I
        // For Mid-Term Evaluation II and Final Viva, artifacts ARE the deliverable, so allow upload immediately.
        // if (schedule.eventType !== 'Mid-Term Evaluation II' && schedule.eventType !== 'Final Viva') {
        // if (!schedule.srsDeliverable || !schedule.srsDeliverable.supervisorApproved) {
        // return res.status(400).json({ message: 'Cannot upload artifacts until SRS is approved by supervisor.' });
        // }
        // }

        const { name, type, description, fileUrl: bodyFileUrl } = req.body;
        let fileUrl = bodyFileUrl;

        if (req.file) {
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        if (!fileUrl) {
            return res.status(400).json({ message: 'No file uploaded or URL provided' });
        }

        schedule.artifacts.push({
            name: name || req.file?.originalname || 'Artifact',
            fileUrl,
            type: type || 'Other',
            description,
            uploadedAt: new Date()
        });

        await schedule.save();
        res.json({ message: 'Artifact uploaded successfully', schedule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Artifact
// @route   DELETE /api/schedules/:id/artifacts/:artifactId
// @access  Private (Student)
const deleteArtifact = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        schedule.artifacts = schedule.artifacts.filter(
            art => art._id.toString() !== req.params.artifactId
        );

        await schedule.save();
        res.json({ message: 'Artifact deleted successfully', schedule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { sendEmail } = require('../utils/emailService');

// @desc    Submit Deliverable Status (Student)
// @route   POST /api/schedules/:id/deliverable/submit
// @access  Private (Student)
const submitDeliverable = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id).populate('externalEvaluator');
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        // Ensure artifacts are present if required
        if (schedule.eventType === 'Mid-Term Evaluation II') {
            const hasPPT = schedule.artifacts.some(a => a.type === 'Presentation');
            const hasCode = schedule.artifacts.some(a => a.type === 'Code');

            if (!hasPPT || !hasCode) {
                return res.status(400).json({ message: 'You must upload Presentation and Code before submitting.' });
            }
        } else if (schedule.eventType === 'Final Viva') {
            const requiredTypes = ['Report', 'SRS', 'SDS', 'Code', 'Plagiarism', 'Presentation'];
            const uploadedTypes = schedule.artifacts.map(a => a.type);
            const missing = requiredTypes.filter(t => !uploadedTypes.includes(t));

            if (missing.length > 0) {
                return res.status(400).json({ message: `Missing required documents: ${missing.join(', ')}` });
            }
        }

        schedule.srsDeliverable = {
            ...schedule.srsDeliverable,
            submittedAt: new Date(),
            status: 'Submitted',
            supervisorApproved: false,
            // Preserve fileUrl if it exists, or set to a placeholder/null if strictly artifact based
            fileUrl: schedule.srsDeliverable?.fileUrl || null
        };

        await schedule.save();

        // Notify External Evaluator for Final Viva
        if (schedule.eventType === 'Final Viva' && schedule.externalEvaluator && schedule.externalEvaluator.email) {
            const subject = `Final Year Project Deliverables Submitted - Group ${schedule.group || 'Unknown'}`;
            const message = `
                <p>Dear ${schedule.externalEvaluator.username},</p>
                <p>The student group has submitted their final deliverables for the Final Viva.</p>
                <p><strong>Event Date:</strong> ${new Date(schedule.eventDate).toDateString()}</p>
                <p>You can now access the artifacts via your evaluation portal.</p>
                <p>Best regards,<br/>FYP Management System</p>
            `;
            await sendEmail(schedule.externalEvaluator.email, subject, message);
        }

        res.json({ message: 'Deliverable submitted successfully', schedule });
    } catch (error) {
        console.error("Submit Deliverable Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { uploadSRS, reviewSRS, deleteSRS, uploadArtifact, deleteArtifact, submitDeliverable };
