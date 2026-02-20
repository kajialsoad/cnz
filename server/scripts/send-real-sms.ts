
import axios from 'axios';

const url = 'http://portal.khudebarta.com:3775/sendtext';
const credentials = {
    apikey: '2957ffac1569fc37',
    secretkey: '51dbfe93',
    callerID: 'inoxt',
    toUser: '8801639038994', // Added 88 prefix
    messageContent: 'Test SMS from Clean Care API verification - ' + new Date().toLocaleTimeString()
};

async function sendTestSms() {
    console.log(`Sending SMS to ${credentials.toUser}...`);

    try {
        const params = new URLSearchParams();
        params.append('apikey', credentials.apikey);
        params.append('secretkey', credentials.secretkey);
        params.append('callerID', credentials.callerID);
        params.append('toUser', credentials.toUser);
        params.append('messageContent', credentials.messageContent);

        const res = await axios.post(url, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log('Response:', res.data);
        
        if (res.data.Status === '0' || res.data.Text === 'ACCEPTD') {
            console.log('✅ SMS Sent Successfully!');
        } else {
            console.log('❌ SMS Failed:', res.data.StatusDescription);
        }
    } catch (e: any) {
        console.error('Error sending SMS:', e.message);
        if (e.response) {
            console.error('Response data:', e.response.data);
        }
    }
}

sendTestSms();
