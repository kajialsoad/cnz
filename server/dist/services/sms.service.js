"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SmsService {
    /**
     * Send OTP to phone number
     */
    async sendOTP(phone, code) {
        try {
            // In a real application, you would integrate with an SMS gateway here
            // e.g., Twilio, InfoBip, etc.
            // For development, we'll log the OTP to the console
            console.log('==================================================');
            console.log(`📱 [DEVELOPMENT MODE] SMS SIMULATION`);
            console.log(`📨 TO: ${phone}`);
            console.log(`🔑 OTP CODE: ${code}`);
            console.log(`ℹ️  Enter this code in the app to verify`);
            console.log('==================================================');
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return;
        }
        catch (error) {
            console.error('Error sending SMS:', error);
            throw new Error('Failed to send verification code');
        }
    }
    /**
     * Send OTP via WhatsApp
     */
    async sendWhatsAppOTP(phone, code) {
        try {
            // In a real application, you would integrate with a WhatsApp Business API provider here
            // e.g., Twilio, Meta Cloud API, etc.
            // For development, we'll log the WhatsApp OTP to the console
            console.log('==================================================');
            console.log(`📱 [DEVELOPMENT MODE] WHATSAPP OTP SIMULATION`);
            console.log(`📨 TO: ${phone}`);
            console.log(`🔑 OTP CODE: ${code}`);
            console.log(`ℹ️  This would be sent via WhatsApp`);
            console.log('==================================================');
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return;
        }
        catch (error) {
            console.error('Error sending WhatsApp OTP:', error);
            throw new Error('Failed to send WhatsApp verification code');
        }
    }
    /**
     * Send welcome message
     */
    async sendWelcomeMessage(phone, name) {
        try {
            console.log('==================================================');
            console.log(`📱 SMS SENT TO: ${phone}`);
            console.log(`👋 Welcome to Clean Care, ${name}!`);
            console.log('==================================================');
            return;
        }
        catch (error) {
            console.error('Error sending welcome SMS:', error);
            // Non-critical, so we don't throw
        }
    }
}
exports.default = new SmsService();
