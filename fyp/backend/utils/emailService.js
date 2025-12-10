const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create a transporter
    // For local dev, we could use Ethereal or just console logs if creds are missing.
    // Assuming user will provide real Gmail creds in .env later.
    // Check if env vars exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️  Email credentials missing in .env. Skipping actual email send.');
        console.log('📧  Emulated Email:');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: \n${options.message}`);
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: `FYP Manager <${process.env.EMAIL_USER}>`,
        to: options.email,
        replyTo: options.replyTo, // allow reply-to
        subject: options.subject,
        text: options.message,
        // html: options.html // In future we can add HTML support
    };

    // 3) Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
