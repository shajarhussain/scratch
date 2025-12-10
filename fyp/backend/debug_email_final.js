const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const testEmail = async () => {
    console.log('--- Starting Email Test ---');
    console.log(`User: ${process.env.EMAIL_USER}`);
    console.log(`Pass: ${process.env.EMAIL_PASSWORD ? '******' : 'MISSING'}`);

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        debug: true, // Enable debug logs
        logger: true // Enable logger
    });

    try {
        console.log('Attempting to send mail to self...');
        const info = await transporter.sendMail({
            from: `"FYP Debugger" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self to verify
            subject: "Test Email from FYP System Debugger",
            text: "If you see this, the email configuration is WORKING!",
        });

        console.log('✅ Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('❌ Error occurred while sending email:');
        console.error(error);
    }
};

testEmail();
