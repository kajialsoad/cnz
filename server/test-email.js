/**
 * SMTP Email Test Script
 * 
 * This script tests if your SMTP configuration is working correctly.
 * Run this AFTER you've updated your .env file with real credentials.
 * 
 * Usage:
 *   node test-email.js your-email@example.com
 * 
 * Example:
 *   node test-email.js maisha@gmail.com
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Get email from command line argument
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Error: Please provide recipient email address');
  console.log('\nUsage: node test-email.js your-email@example.com');
  console.log('Example: node test-email.js maisha@gmail.com\n');
  process.exit(1);
}

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error('❌ Error: Invalid email address format');
  process.exit(1);
}

console.log('\n📧 SMTP Configuration Test\n');
console.log('================================');
console.log('Configuration:');
console.log(`  SMTP Host: ${process.env.SMTP_HOST || 'NOT SET'}`);
console.log(`  SMTP Port: ${process.env.SMTP_PORT || 'NOT SET'}`);
console.log(`  SMTP User: ${process.env.SMTP_USER || 'NOT SET'}`);
console.log(`  SMTP Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'}`);
console.log(`  Email From: ${process.env.EMAIL_FROM || process.env.SMTP_USER || 'NOT SET'}`);
console.log(`  Recipient: ${recipientEmail}`);
console.log('================================\n');

// Check if credentials are still placeholders
if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
  console.error('❌ SMTP_USER is not configured!');
  console.log('Please update SMTP_USER in your .env file\n');
  process.exit(1);
}

if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'your-app-password') {
  console.error('❌ SMTP_PASS is not configured!');
  console.log('Please follow these steps:');
  console.log('1. Go to https://myaccount.google.com/security');
  console.log('2. Enable 2-Factor Authentication');
  console.log('3. Go to https://myaccount.google.com/apppasswords');
  console.log('4. Generate an App Password');
  console.log('5. Update SMTP_PASS in your .env file\n');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test email content
const mailOptions = {
  from: process.env.EMAIL_FROM || process.env.SMTP_USER,
  to: recipientEmail,
  subject: '✅ Clean Care - SMTP Test Email',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #2E8B57; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">✅ SMTP Test Successful!</h1>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333;">Congratulations! 🎉</h2>
        <p>Your SMTP email configuration is working correctly.</p>
        
        <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <h3 style="color: #2E8B57; margin-top: 0;">Test Details:</h3>
          <ul style="color: #666;">
            <li><strong>Server:</strong> ${process.env.SMTP_HOST}</li>
            <li><strong>Port:</strong> ${process.env.SMTP_PORT}</li>
            <li><strong>Sent from:</strong> ${process.env.SMTP_USER}</li>
            <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        </div>
        
        <h3 style="color: #333;">What's Next?</h3>
        <ol style="color: #666; line-height: 1.8;">
          <li>Your email system is now ready to send verification emails</li>
          <li>Test user registration in your Flutter app</li>
          <li>Check if verification emails arrive correctly</li>
          <li>Set up email verification page in Flutter (currently missing)</li>
        </ol>
        
        <div style="background-color: #fffbea; border-left: 4px solid #f0ad4e; padding: 15px; margin-top: 20px;">
          <p style="margin: 0; color: #8a6d3b;">
            <strong>⚠️ Note:</strong> This is a test email from Clean Care Mobile App.
            If you didn't expect this, you can safely ignore it.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>Clean Care - Waste Management System</p>
        <p>Test Email • ${new Date().getFullYear()}</p>
      </div>
    </div>
  `,
  text: `
SMTP Test Successful!

Congratulations! Your SMTP email configuration is working correctly.

Test Details:
- Server: ${process.env.SMTP_HOST}
- Port: ${process.env.SMTP_PORT}
- Sent from: ${process.env.SMTP_USER}
- Timestamp: ${new Date().toLocaleString()}

What's Next?
1. Your email system is now ready to send verification emails
2. Test user registration in your Flutter app
3. Check if verification emails arrive correctly
4. Set up email verification page in Flutter

This is a test email from Clean Care Mobile App.
  `,
};

// Send test email
console.log('📤 Sending test email...\n');

transporter
  .sendMail(mailOptions)
  .then((info) => {
    console.log('✅ SUCCESS! Email sent successfully!\n');
    console.log('Message Details:');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Response: ${info.response}\n`);
    console.log('📬 Check your inbox:', recipientEmail);
    console.log('   (Don\'t forget to check spam folder if not found)\n');
    console.log('🎉 Your SMTP configuration is working correctly!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ FAILED! Error sending email:\n');
    console.error(`Error: ${error.message}\n`);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid login')) {
      console.log('💡 Solution:');
      console.log('   Your email/password is incorrect.');
      console.log('   1. Make sure you generated an App Password (not your Gmail password)');
      console.log('   2. Go to https://myaccount.google.com/apppasswords');
      console.log('   3. Generate a new App Password');
      console.log('   4. Update SMTP_PASS in .env file (remove spaces)');
      console.log('   5. Restart your server\n');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
      console.log('💡 Solution:');
      console.log('   Connection timeout - possible firewall/network issue.');
      console.log('   1. Check your internet connection');
      console.log('   2. Check if port 587 is blocked by firewall');
      console.log('   3. Try using port 465 with SMTP_SECURE=true in .env');
      console.log('   4. Disable antivirus temporarily and test\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Solution:');
      console.log('   Connection refused - check SMTP host and port.');
      console.log('   1. Verify SMTP_HOST is correct (smtp.gmail.com)');
      console.log('   2. Verify SMTP_PORT is correct (587 or 465)');
      console.log('   3. Check your internet connection\n');
    } else {
      console.log('💡 General troubleshooting:');
      console.log('   1. Verify all SMTP credentials in .env file');
      console.log('   2. Make sure 2FA is enabled on Gmail');
      console.log('   3. Check https://myaccount.google.com/apppasswords');
      console.log('   4. Try generating a new App Password');
      console.log('   5. Restart your Node.js server\n');
    }
    
    process.exit(1);
  });
