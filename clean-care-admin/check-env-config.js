// Check which environment variables are loaded
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Environment Configuration Check ===');
console.log('VITE_USE_PRODUCTION:', process.env.VITE_USE_PRODUCTION);
console.log('VITE_PRODUCTION_API_URL:', process.env.VITE_PRODUCTION_API_URL);
console.log('VITE_LOCAL_API_URL:', process.env.VITE_LOCAL_API_URL);
console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL);
console.log('=====================================');

// Load .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

console.log('\n=== .env File Content ===');
console.log(envContent);
console.log('=========================');
