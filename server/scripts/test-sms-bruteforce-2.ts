
import axios from 'axios';

const url = 'http://portal.khudebarta.com:3775/sendtext';
const credentials = {
    apikey: '2957ffac1569fc37',
    secretkey: '51dbfe93',
    callerID: 'inoxt',
    phone: '8801711111111',
    message: 'Test'
};

const potentialParams = [
    'to', 'To', 'TO',
    'phone', 'Phone', 'PHONE',
    'mobile', 'Mobile', 'MOBILE',
    'number', 'Number', 'NUMBER',
    'contact', 'Contact', 'CONTACT',
    'recipient', 'Recipient', 'RECIPIENT',
    'destination', 'Destination', 'DESTINATION',
    'dest', 'Dest', 'DEST',
    'destinationID', 'DestinationID', 'DESTINATIONID',
    'destinationId', 'DestinationId',
    'destID', 'DestID', 'DESTID',
    'destId', 'DestId',
    'destination_id', 'Destination_Id', 'DESTINATION_ID',
    'dest_id', 'Dest_Id', 'DEST_ID',
    'id', 'ID', 'Id',
    'dst', 'Dst', 'DST',
    'receiver', 'Receiver', 'RECEIVER',
    'target', 'Target', 'TARGET',
    'msisdn', 'MSISDN', 'Msisdn',
    'gsm', 'GSM', 'Gsm',
    'cell', 'Cell', 'CELL',
    'tel', 'Tel', 'TEL',
    'address', 'Address', 'ADDRESS',
    'sms_to', 'SMS_TO',
    'send_to', 'Send_To',
    'user', 'User', 'USER',
    'userid', 'UserID', 'UserId',
    'uid', 'UID',
    'mobiles', 'Mobiles',
    'numbers', 'Numbers',
    'contacts', 'Contacts',
    'recipients', 'Recipients'
];

async function bruteForce2() {
    console.log(`Starting brute force 2 on: ${url}`);
    
    for (const param of potentialParams) {
        try {
            const params: any = {
                apikey: credentials.apikey,
                secretkey: credentials.secretkey,
                callerID: credentials.callerID,
                message: credentials.message
            };
            params[param] = credentials.phone;
            
            const res = await axios.get(url, { params });
            
            if (res.data && res.data.StatusDescription !== 'Destination ID Empty') {
                console.log(`\n🎉 MATCH FOUND! Parameter: "${param}"`);
                console.log('Response:', res.data);
                return;
            }
        } catch (e: any) {
            // Ignore errors
        }
    }
    console.log('❌ No match found in list 2.');
}

bruteForce2();
