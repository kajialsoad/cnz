require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('Testing Email Configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Attempting to verify connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Test Email from Clean Care Server',
            text: 'If you receive this, your email configuration is working correctly.',
        });

        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Email Test Failed:', error);
        if (error.code === 'EAUTH') {
            console.error('Hint: Check your username and password. Use an App Password for Gmail.');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('Hint: Connection timed out. Check SMTP_HOST and SMTP_PORT.');
        }
    }
}

testEmail();
