const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('--- Email Debug Test ---');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    // Don't log full password, just check if it's there and length
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `[Present, length: ${process.env.EMAIL_PASSWORD.length}]` : '[Missing]');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ Credentials missing. Cannot test.');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        console.log('Attempting to verify transporter connection...');
        await transporter.verify();
        console.log('✅ Transporter connection verified!');

        console.log('Attempting to send test email to self...');
        const info = await transporter.sendMail({
            from: `"Test Debugger" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: "Test Email from FYP System Debugger",
            text: "If you see this, the email configuration is WORKING!",
        });

        console.log('✅ Message sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Email Failed:');
        console.error(error);
    }
};

testEmail();
