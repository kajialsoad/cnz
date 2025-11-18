import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

interface VerificationEmailData {
    userName: string;
    verificationCode: string;
    expiryMinutes: number;
}

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    /**
     * Send a generic email
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME || 'Clean Care Bangladesh'} <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    /**
     * Send verification code email
     */
    async sendVerificationEmail(email: string, data: VerificationEmailData): Promise<void> {
        try {
            // Load and render email template
            const templatePath = path.join(__dirname, '../templates/verification-email.html');
            let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

            // Replace placeholders
            htmlTemplate = htmlTemplate
                .replace(/{{userName}}/g, data.userName)
                .replace(/{{verificationCode}}/g, data.verificationCode)
                .replace(/{{expiryMinutes}}/g, data.expiryMinutes.toString());

            await this.sendEmail({
                to: email,
                subject: 'Email Verification - Clean Care Bangladesh',
                html: htmlTemplate,
                text: `Hello ${data.userName},\n\nYour verification code is: ${data.verificationCode}\n\nThis code will expire in ${data.expiryMinutes} minutes.\n\nThank you,\nClean Care Bangladesh`,
            });
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }

    /**
     * Test email service connection
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('Email service connection successful');
            return true;
        } catch (error) {
            console.error('Email service connection failed:', error);
            return false;
        }
    }
}

export default new EmailService();
