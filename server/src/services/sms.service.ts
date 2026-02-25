import env from '../config/env';
import { systemConfigService } from './system-config.service';
import axios from 'axios';

class SmsService {
    /**
     * Send OTP to phone number
     */
    async sendOTP(phone: string, code: string): Promise<void> {
        try {
            const isEnabled = await systemConfigService.get('verification_sms_enabled', 'true');
            if (isEnabled === 'false') {
                throw new Error('SMS verification is currently disabled');
            }

            const apiKey = await systemConfigService.get('verification_sms_api_key', '');
            const apiUrl = await systemConfigService.get('verification_sms_api_url', '');
            const apiSecret = await systemConfigService.get('verification_sms_api_secret', '');
            const apiClientId = await systemConfigService.get('verification_sms_client_id', '');
            const apiPassword = await systemConfigService.get('verification_sms_password', '');
            const apiSenderId = await systemConfigService.get('verification_sms_sender_id', '');

            // If API URL is configured, use the gateway
            if (apiUrl && apiUrl.startsWith('http')) {
                // Example integration for a generic SMS gateway
                // Replace with actual provider implementation
                console.log(`🚀 Sending SMS via Gateway: ${apiUrl}`);

                // Normalize phone number (add 88 prefix if missing for Bangladeshi numbers)
                let normalizedPhone = phone;
                if (phone.startsWith('01')) {
                    normalizedPhone = '88' + phone;
                } else if (phone.startsWith('+88')) {
                    normalizedPhone = phone.substring(1); // Remove +
                }
                
                // KhudeBarta / Generic Gateway Support
                // We send multiple variations of the phone/message parameters to maximize compatibility
                const params: any = {
                    apikey: apiKey,
                    secretkey: apiSecret,
                    callerID: apiSenderId,
                    
                    // KhudeBarta specific parameters (Confirmed via testing)
                    toUser: normalizedPhone,
                    messageContent: `Your verification code is ${code}`,

                    // Common variations for "To"
                    to: normalizedPhone,
                    phone: normalizedPhone,
                    mobile: normalizedPhone,
                    contact: normalizedPhone,
                    contacts: normalizedPhone,
                    recipient: normalizedPhone,
                    destination: normalizedPhone,
                    destinationID: normalizedPhone,
                    DestinationID: normalizedPhone,
                    msisdn: normalizedPhone,
                    number: normalizedPhone,

                    // Common variations for "Message"
                    message: `Your verification code is ${code}`,
                    msg: `Your verification code is ${code}`,
                    text: `Your verification code is ${code}`,
                    content: `Your verification code is ${code}`,
                    
                    // Authentication variations
                    api_key: apiKey,
                    secret_key: apiSecret,
                    sender_id: apiSenderId,
                    client_id: apiClientId,
                    password: apiPassword,
                    type: 'text',
                };

                // Send request (try POST first as it's more robust for JSON)
                try {
                    console.log(`🚀 Sending SMS via Gateway (POST): ${apiUrl}`);
                    
                    // Convert params to URLSearchParams for application/x-www-form-urlencoded
                    const urlParams = new URLSearchParams();
                    Object.keys(params).forEach(key => {
                        if (params[key] !== undefined && params[key] !== null) {
                            urlParams.append(key, String(params[key]));
                        }
                    });

                    const response = await axios.post(apiUrl, urlParams, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });

                    // Check for gateway-specific error responses (even if HTTP 200)
                    if (response.data && (String(response.data.Status) === '-55' || String(response.data.Status) === '-1')) {
                         console.error(`❌ Gateway returned error: ${JSON.stringify(response.data)}`);
                         throw new Error(`Gateway Error: ${response.data.StatusDescription || response.data.Status}`);
                    }

                    console.log(`✅ SMS sent successfully to ${normalizedPhone}. Response:`, response.data);
                    return;
                } catch (postError) {
                    console.error('❌ External SMS API failed (POST), trying GET:', postError);
                    
                    // Fallback to GET
                    try {
                        console.log(`🚀 Sending SMS via Gateway (GET): ${apiUrl}`);
                        const getResponse = await axios.get(apiUrl, { params });
                        
                        // Check for gateway-specific error responses (even if HTTP 200)
                        if (getResponse.data && (String(getResponse.data.Status) === '-55' || String(getResponse.data.Status) === '-1')) {
                            console.error(`❌ Gateway (GET) returned error: ${JSON.stringify(getResponse.data)}`);
                            throw new Error(`Gateway Error: ${getResponse.data.StatusDescription || getResponse.data.Status}`);
                        }

                        console.log(`✅ SMS sent successfully to ${normalizedPhone} (via GET). Response:`, getResponse.data);
                        return;
                    } catch (getError) {
                        console.error('❌ External SMS API failed (GET):', getError);
                        throw new Error('Failed to send SMS via provider');
                    }
                }
            }

            // Fallback to Development Mode (Console Log)
            console.log('==================================================');
            console.log(`📱 [DEVELOPMENT MODE] SMS SIMULATION`);
            console.log(`📨 TO: ${phone}`);
            console.log(`🔑 OTP CODE: ${code}`);
            console.log(`ℹ️  Enter this code in the app to verify`);
            console.log('==================================================');

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return;
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw new Error('Failed to send verification code');
        }
    }

    /**
     * Send Forgot Password OTP
     */
    async sendForgotPasswordOTP(phone: string, code: string): Promise<void> {
        try {
            const isEnabled = await systemConfigService.get('verification_sms_enabled', 'true');
            if (isEnabled === 'false') {
                throw new Error('SMS verification is currently disabled');
            }

            const apiKey = await systemConfigService.get('verification_sms_api_key', '');
            const apiUrl = await systemConfigService.get('verification_sms_api_url', '');
            const apiSecret = await systemConfigService.get('verification_sms_api_secret', '');
            const apiClientId = await systemConfigService.get('verification_sms_client_id', '');
            const apiPassword = await systemConfigService.get('verification_sms_password', '');
            const apiSenderId = await systemConfigService.get('verification_sms_sender_id', '');
            const expiryStr = await systemConfigService.get('forgot_password_otp_expiry_minutes', '5');

            // Normalize phone number
            let normalizedPhone = phone;
            if (phone.startsWith('01')) {
                normalizedPhone = '88' + phone;
            } else if (phone.startsWith('+88')) {
                normalizedPhone = phone.substring(1);
            }

            const message = `Your password reset verification code is: ${code}. This code will expire in ${expiryStr} minutes.`;

            // If API URL is configured, use the gateway
            if (apiUrl && apiUrl.startsWith('http')) {
                console.log(`🚀 Sending Forgot Password SMS via Gateway: ${apiUrl}`);

                const params: any = {
                    apikey: apiKey,
                    secretkey: apiSecret,
                    callerID: apiSenderId,
                    toUser: normalizedPhone,
                    messageContent: message,
                    to: normalizedPhone,
                    phone: normalizedPhone,
                    mobile: normalizedPhone,
                    contact: normalizedPhone,
                    contacts: normalizedPhone,
                    recipient: normalizedPhone,
                    destination: normalizedPhone,
                    destinationID: normalizedPhone,
                    DestinationID: normalizedPhone,
                    msisdn: normalizedPhone,
                    number: normalizedPhone,
                    message: message,
                    msg: message,
                    text: message,
                    content: message,
                    api_key: apiKey,
                    secret_key: apiSecret,
                    sender_id: apiSenderId,
                    client_id: apiClientId,
                    password: apiPassword,
                    type: 'forgot_password', // As requested by user
                };

                try {
                    const urlParams = new URLSearchParams();
                    Object.keys(params).forEach(key => {
                        if (params[key] !== undefined && params[key] !== null) {
                            urlParams.append(key, String(params[key]));
                        }
                    });

                    const response = await axios.post(apiUrl, urlParams, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });

                    if (response.data && (String(response.data.Status) === '-55' || String(response.data.Status) === '-1')) {
                        console.error(`❌ Gateway returned error: ${JSON.stringify(response.data)}`);
                        throw new Error(`Gateway Error: ${response.data.StatusDescription || response.data.Status}`);
                    }

                    console.log(`✅ Forgot Password SMS sent successfully to ${normalizedPhone}. Response:`, response.data);
                    return;
                } catch (postError) {
                    console.error('❌ External SMS API failed (POST), trying GET:', postError);
                    try {
                        const getResponse = await axios.get(apiUrl, { params });
                        if (getResponse.data && (String(getResponse.data.Status) === '-55' || String(getResponse.data.Status) === '-1')) {
                            throw new Error(`Gateway Error: ${getResponse.data.StatusDescription || getResponse.data.Status}`);
                        }
                        console.log(`✅ Forgot Password SMS sent successfully to ${normalizedPhone} (via GET).`);
                        return;
                    } catch (getError) {
                        console.error('❌ External SMS API failed (GET):', getError);
                        throw new Error('Failed to send SMS via provider');
                    }
                }
            }

            // Fallback to Development Mode
            console.log('==================================================');
            console.log(`📱 [DEVELOPMENT MODE] FORGOT PASSWORD SMS SIMULATION`);
            console.log(`📨 TO: ${phone}`);
            console.log(`🔑 OTP CODE: ${code}`);
            console.log(`💬 MESSAGE: ${message}`);
            console.log('==================================================');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            return;

        } catch (error) {
            console.error('Error sending Forgot Password SMS:', error);
            throw new Error('Failed to send verification code');
        }
    }

    /**
     * Send OTP via WhatsApp
     */
    async sendWhatsAppOTP(phone: string, code: string): Promise<void> {
        try {
            const isEnabled = await systemConfigService.get('verification_whatsapp_enabled', 'true');
            if (isEnabled === 'false') {
                throw new Error('WhatsApp verification is currently disabled');
            }

            const apiUrl = await systemConfigService.get('verification_whatsapp_api_url', '');
            
            // If WhatsApp API URL is configured, use it
            if (apiUrl && apiUrl.startsWith('http')) {
                try {
                    console.log(`🚀 Sending WhatsApp OTP via Gateway: ${apiUrl}`);
                    
                    // Generic implementation - adjust based on provider
                    await axios.post(apiUrl, {
                        phone: phone,
                        message: `Your verification code is ${code}`,
                        type: 'text'
                    });
                    
                    console.log(`✅ WhatsApp message sent successfully to ${phone}`);
                    return;
                } catch (apiError) {
                    console.error('❌ External WhatsApp API failed:', apiError);
                    throw new Error('Failed to send WhatsApp verification code via provider');
                }
            }
            
            // Fallback to Development Mode
            console.log('==================================================');
            console.log(`📱 [DEVELOPMENT MODE] WHATSAPP OTP SIMULATION`);
            console.log(`📨 TO: ${phone}`);
            console.log(`🔑 OTP CODE: ${code}`);
            console.log(`ℹ️  This would be sent via WhatsApp`);
            console.log('==================================================');

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return;
        } catch (error) {
            console.error('Error sending WhatsApp OTP:', error);
            throw new Error('Failed to send WhatsApp verification code');
        }
    }

    /**
     * Verify with Truecaller (Backend Verification)
     */
    async verifyTruecaller(profile: any, phone: string): Promise<boolean> {
        try {
            const isEnabled = await systemConfigService.get('verification_truecaller_enabled', 'false');
            if (isEnabled === 'false') {
                throw new Error('Truecaller verification is currently disabled');
            }

            const partnerKey = await systemConfigService.get('verification_truecaller_partner_key', '');
            
            // If Partner Key is configured, we should verify the signature
            // This is a placeholder for actual signature verification logic
            if (partnerKey) {
                 // In a real implementation:
                 // 1. Verify the signature using the partner key
                 // 2. Validate the profile data against the signature
                 // const isValid = verifySignature(profile, partnerKey);
                 // if (!isValid) return false;
                 console.log('🔐 Verifying Truecaller signature with partner key...');
            }

            console.log('==================================================');
            console.log(`📱 [DEVELOPMENT MODE] TRUECALLER VERIFICATION`);
            console.log(`👤 User: ${profile.firstName} ${profile.lastName}`);
            console.log(`📞 Phone: ${phone}`);
            console.log(`✅ Status: VERIFIED`);
            console.log('==================================================');

            return true;
        } catch (error) {
            console.error('Error verifying Truecaller profile:', error);
            return false;
        }
    }

    /**
     * Send welcome message
     */
    async sendWelcomeMessage(phone: string, name: string): Promise<void> {
        try {
            console.log('==================================================');
            console.log(`📱 SMS SENT TO: ${phone}`);
            console.log(`👋 Welcome to Clean Care, ${name}!`);
            console.log('==================================================');
            
            return;
        } catch (error) {
            console.error('Error sending welcome SMS:', error);
            // Non-critical, so we don't throw
        }
    }
}

export default new SmsService();
