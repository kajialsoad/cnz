
import axios from 'axios';

const url = 'http://portal.khudebarta.com:3775/sendtext';
const credentials = {
    apikey: '2957ffac1569fc37',
    secretkey: '51dbfe93',
    callerID: 'inoxt',
    to: '8801711111111',
    message: 'Test'
};

async function testNested() {
    console.log(`Testing Nested Structures on: ${url}`);

    const structures = [
        // 1. Root level (Baseline)
        { ...credentials },
        
        // 2. Authentication wrapper
        {
            authentication: { apikey: credentials.apikey, secretkey: credentials.secretkey },
            to: credentials.to,
            message: credentials.message,
            callerID: credentials.callerID
        },

        // 3. SMS wrapper
        {
            apikey: credentials.apikey,
            secretkey: credentials.secretkey,
            sms: {
                to: credentials.to,
                message: credentials.message,
                callerID: credentials.callerID
            }
        },

        // 4. Message wrapper
        {
            apikey: credentials.apikey,
            secretkey: credentials.secretkey,
            message: {
                to: credentials.to,
                text: credentials.message,
                callerID: credentials.callerID
            }
        },

        // 5. Data wrapper
        {
            apikey: credentials.apikey,
            secretkey: credentials.secretkey,
            data: {
                to: credentials.to,
                message: credentials.message,
                callerID: credentials.callerID
            }
        },
        
        // 6. Request wrapper
        {
            request: {
                apikey: credentials.apikey,
                secretkey: credentials.secretkey,
                to: credentials.to,
                message: credentials.message,
                callerID: credentials.callerID
            }
        }
    ];

    for (let i = 0; i < structures.length; i++) {
        try {
            const res = await axios.post(url, structures[i]);
            if (res.data && res.data.StatusDescription !== 'Destination ID Empty') {
                console.log(`\n🎉 MATCH FOUND! Structure #${i + 1}`);
                console.log('Payload:', JSON.stringify(structures[i]));
                console.log('Response:', res.data);
                return;
            }
        } catch (e) {}
    }
    console.log('❌ No match found in nested structures.');
}

testNested();
