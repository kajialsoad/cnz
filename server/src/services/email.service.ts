import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { systemConfigService } from './system-config.service';

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
    
    private async createTransporter(): Promise<nodemailer.Transporter> {
        const host = await systemConfigService.get('smtp_host', process.env.SMTP_HOST || 'smtp.gmail.com');
        const portStr = await systemConfigService.get('smtp_port', process.env.SMTP_PORT || '587');
        const secureStr = await systemConfigService.get('smtp_secure', process.env.SMTP_SECURE || 'false');
        const user = await systemConfigService.get('smtp_user', process.env.SMTP_USER || '');
        const pass = await systemConfigService.get('smtp_pass', process.env.SMTP_PASS || '');
        
        return nodemailer.createTransport({
            host,
            port: parseInt(portStr),
            secure: secureStr === 'true',
            auth: {
                user,
                pass,
            },
        });
    }

    /**
     * Send a generic email
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            const transporter = await this.createTransporter();
            
            const fromName = await systemConfigService.get('smtp_from_name', process.env.SMTP_FROM_NAME || 'Clean Care Bangladesh');
            const fromEmail = await systemConfigService.get('smtp_from_email', process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@cleancare.bd');

            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            };

            const info = await transporter.sendMail(mailOptions);
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
            // Check if template exists, otherwise use simple HTML
            let htmlTemplate = '';
            
            if (fs.existsSync(templatePath)) {
                htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
                // Replace placeholders
                htmlTemplate = htmlTemplate
                    .replace(/{{userName}}/g, data.userName)
                    .replace(/{{verificationCode}}/g, data.verificationCode)
                    .replace(/{{expiryMinutes}}/g, data.expiryMinutes.toString());
            } else {
                htmlTemplate = `
                    <h1>Email Verification</h1>
                    <p>Hello ${data.userName},</p>
                    <p>Your verification code is: <strong>${data.verificationCode}</strong></p>
                    <p>This code will expire in ${data.expiryMinutes} minutes.</p>
                `;
            }

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
            const transporter = await this.createTransporter();
            await transporter.verify();
            console.log('Email service connection successful');
            return true;
        } catch (error) {
            console.error('Email service connection failed:', error);
            return false;
        }
    }
}

export default new EmailService();
