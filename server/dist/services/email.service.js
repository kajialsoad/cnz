"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const system_config_service_1 = require("./system-config.service");
class EmailService {
    async createTransporter() {
        const host = await system_config_service_1.systemConfigService.get('smtp_host', process.env.SMTP_HOST || 'smtp.gmail.com');
        const portStr = await system_config_service_1.systemConfigService.get('smtp_port', process.env.SMTP_PORT || '587');
        const secureStr = await system_config_service_1.systemConfigService.get('smtp_secure', process.env.SMTP_SECURE || 'false');
        const user = await system_config_service_1.systemConfigService.get('smtp_user', process.env.SMTP_USER || '');
        const pass = await system_config_service_1.systemConfigService.get('smtp_pass', process.env.SMTP_PASS || '');
        return nodemailer_1.default.createTransport({
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
    async sendEmail(options) {
        try {
            const transporter = await this.createTransporter();
            const fromName = await system_config_service_1.systemConfigService.get('smtp_from_name', process.env.SMTP_FROM_NAME || 'Clean Care Bangladesh');
            const fromEmail = await system_config_service_1.systemConfigService.get('smtp_from_email', process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@cleancare.bd');
            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            };
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
        }
        catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }
    /**
     * Send verification code email
     */
    async sendVerificationEmail(email, data) {
        try {
            // Load and render email template
            const templatePath = path_1.default.join(__dirname, '../templates/verification-email.html');
            // Check if template exists, otherwise use simple HTML
            let htmlTemplate = '';
            if (fs_1.default.existsSync(templatePath)) {
                htmlTemplate = fs_1.default.readFileSync(templatePath, 'utf-8');
                // Replace placeholders
                htmlTemplate = htmlTemplate
                    .replace(/{{userName}}/g, data.userName)
                    .replace(/{{verificationCode}}/g, data.verificationCode)
                    .replace(/{{expiryMinutes}}/g, data.expiryMinutes.toString());
            }
            else {
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
        }
        catch (error) {
            console.error('Error sending verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }
    /**
     * Test email service connection
     */
    async testConnection() {
        try {
            const transporter = await this.createTransporter();
            await transporter.verify();
            console.log('Email service connection successful');
            return true;
        }
        catch (error) {
            console.error('Email service connection failed:', error);
            return false;
        }
    }
}
exports.default = new EmailService();
