
import axios from 'axios';

const url = 'http://portal.khudebarta.com:3775/sendtext';
const credentials = {
    apikey: '2957ffac1569fc37',
    secretkey: '51dbfe93',
    callerID: 'inoxt',
    messageContent: 'Test SMS normalization'
};

async function testNormalization() {
    console.log('Testing Phone Normalization...');
    
    // Test case from user: 01639038994 (without 88)
    const phoneInput = '01639038994';
    
    let normalizedPhone = phoneInput;
    if (phoneInput.startsWith('01')) {
        normalizedPhone = '88' + phoneInput;
    } else if (phoneInput.startsWith('+88')) {
        normalizedPhone = phoneInput.substring(1);
    }
    
    console.log(`Input: ${phoneInput}`);
    console.log(`Normalized: ${normalizedPhone}`);
    
    try {
        const params = new URLSearchParams();
        params.append('apikey', credentials.apikey);
        params.append('secretkey', credentials.secretkey);
        params.append('callerID', credentials.callerID);
        params.append('toUser', normalizedPhone);
        params.append('messageContent', credentials.messageContent);

        const res = await axios.post(url, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log('Response:', res.data);
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

testNormalization();
