/**
 * Add Performance Logging to Complaint Service
 * This script adds timing logs to help diagnose slow complaint submissions
 */

const fs = require('fs');
const path = require('path');

const serviceFilePath = path.join(__dirname, 'src/services/complaint.service.ts');

console.log('Adding performance logging to complaint service...');

// Read the file
let content = fs.readFileSync(serviceFilePath, 'utf8');

// Add logging at key points
const replacements = [
    {
        search: 'async createComplaint(input: CreateComplaintInput) {\n    try {',
        replace: 'async createComplaint(input: CreateComplaintInput) {\n    const startTime = Date.now();\n    try {\n      console.log(\'[SERVICE] Starting complaint creation service...\');'
    },
    {
        search: '// Check daily complaint limit',
        replace: '// Check daily complaint limit\n      const limitCheckStart = Date.now();'
    },
    {
        search: 'if (dailyCount >= limit) {',
        replace: 'console.log(`[SERVICE] Daily limit check took ${Date.now() - limitCheckStart}ms`);\n\n        if (dailyCount >= limit) {'
    },
    {
        search: '// Validate category and subcategory combination',
        replace: '// Validate category and subcategory combination\n      const categoryCheckStart = Date.now();'
    },
    {
        search: '// Auto-fetch user\'s city corporation',
        replace: 'console.log(`[SERVICE] Category validation took ${Date.now() - categoryCheckStart}ms`);\n\n      // Auto-fetch user\'s city corporation\n      const userFetchStart = Date.now();'
    },
    {
        search: '// Check ward image upload limit',
        replace: 'console.log(`[SERVICE] User fetch took ${Date.now() - userFetchStart}ms`);\n\n      // Check ward image upload limit\n      const wardLimitCheckStart = Date.now();'
    },
    {
        search: '// Generate tracking number',
        replace: 'console.log(`[SERVICE] Ward limit check took ${Date.now() - wardLimitCheckStart}ms`);\n\n      // Generate tracking number\n      const trackingStart = Date.now();'
    },
    {
        search: 'const trackingNumber = await this.generateTrackingNumber();',
        replace: 'const trackingNumber = await this.generateTrackingNumber();\n      console.log(`[SERVICE] Tracking number generation took ${Date.now() - trackingStart}ms`);'
    },
    {
        search: '// Process uploaded files if provided',
        replace: '// Process uploaded files if provided\n      const fileProcessStart = Date.now();'
    },
    {
        search: 'if (input.uploadedFiles) {',
        replace: 'if (input.uploadedFiles) {\n        console.log(\'[SERVICE] Starting file upload processing...\');'
    }
];

// Apply replacements
let modified = false;
for (const { search, replace } of replacements) {
    if (content.includes(search) && !content.includes(replace)) {
        content = content.replace(search, replace);
        modified = true;
        console.log(`✓ Added logging for: ${search.substring(0, 50)}...`);
    }
}

if (modified) {
    // Write back to file
    fs.writeFileSync(serviceFilePath, content, 'utf8');
    console.log('\n✅ Performance logging added successfully!');
    console.log('The service will now log timing information for each step.');
} else {
    console.log('\n⚠️  No changes made - logging may already be present.');
}
