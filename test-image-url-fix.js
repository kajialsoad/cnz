// Test image URL fixing logic

const API_BASE_URL = 'http://192.168.0.100:4000';

function fixMediaUrl(url) {
    if (!url) return url;

    // If URL is already using current server, return as is
    if (url.startsWith(API_BASE_URL)) {
        console.log(`✓ Already correct: ${url}`);
        return url;
    }

    // If URL contains localhost:4000 or any other server, replace it
    const urlPattern = /^https?:\/\/[^\/]+/;
    if (urlPattern.test(url)) {
        const fixed = url.replace(urlPattern, API_BASE_URL);
        console.log(`✓ Fixed: ${url}`);
        console.log(`  → ${fixed}`);
        return fixed;
    }

    // If URL is relative (starts with /), prepend base URL
    if (url.startsWith('/')) {
        const fixed = `${API_BASE_URL}${url}`;
        console.log(`✓ Fixed relative: ${url}`);
        console.log(`  → ${fixed}`);
        return fixed;
    }

    // Otherwise, prepend base URL with /
    const fixed = `${API_BASE_URL}/${url}`;
    console.log(`✓ Fixed: ${url}`);
    console.log(`  → ${fixed}`);
    return fixed;
}

console.log('=== Testing Image URL Fix ===\n');
console.log(`Current API Base URL: ${API_BASE_URL}\n`);

// Test cases
const testUrls = [
    'http://localhost:4000/api/uploads/image/1764079718678_730f54198f04dab7.jpg',
    'http://192.168.0.100:4000/api/uploads/image/1764079718678_730f54198f04dab7.jpg',
    'https://munna-production.up.railway.app/api/uploads/image/1764079718678_730f54198f04dab7.jpg',
    '/api/uploads/image/1764079718678_730f54198f04dab7.jpg',
    'api/uploads/image/1764079718678_730f54198f04dab7.jpg'
];

testUrls.forEach((url, index) => {
    console.log(`\nTest ${index + 1}:`);
    fixMediaUrl(url);
});

console.log('\n=== Test Complete ===');
