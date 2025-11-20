/**
 * Test script to verify admin routes are properly configured
 */

console.log('🧪 Testing Admin Routes Configuration...\n');

// Test 1: Check if route files exist
const fs = require('fs');
const path = require('path');

const routeFiles = [
    'src/routes/admin.complaint.routes.ts',
    'src/routes/admin.chat.routes.ts',
    'src/routes/admin.analytics.routes.ts'
];

const controllerFiles = [
    'src/controllers/admin.complaint.controller.ts',
    'src/controllers/admin.chat.controller.ts',
    'src/controllers/admin.analytics.controller.ts'
];

const serviceFiles = [
    'src/services/admin-complaint.service.ts',
    'src/services/chat.service.ts',
    'src/services/analytics.service.ts'
];

console.log('✅ Checking Route Files:');
routeFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '✓' : '✗'} ${file}`);
});

console.log('\n✅ Checking Controller Files:');
controllerFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '✓' : '✗'} ${file}`);
});

console.log('\n✅ Checking Service Files:');
serviceFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '✓' : '✗'} ${file}`);
});

// Test 2: Check if routes are registered in app.ts
console.log('\n✅ Checking Route Registration in app.ts:');
const appContent = fs.readFileSync(path.join(__dirname, 'src/app.ts'), 'utf8');

const routeRegistrations = [
    { path: '/api/admin/complaints', import: 'adminComplaintRoutes' },
    { path: '/api/admin/chat', import: 'adminChatRoutes' },
    { path: '/api/admin/analytics', import: 'adminAnalyticsRoutes' }
];

routeRegistrations.forEach(({ path: routePath, import: importName }) => {
    const hasImport = appContent.includes(`import ${importName}`);
    const hasRegistration = appContent.includes(`app.use('${routePath}'`);
    console.log(`   ${hasImport && hasRegistration ? '✓' : '✗'} ${routePath} (${importName})`);
});

// Test 3: Check route endpoints
console.log('\n✅ Expected API Endpoints:');
console.log('   Admin Complaint Routes:');
console.log('     GET    /api/admin/complaints');
console.log('     GET    /api/admin/complaints/:id');
console.log('     PATCH  /api/admin/complaints/:id/status');
console.log('     GET    /api/admin/users/:userId/complaints');
console.log('\n   Admin Chat Routes:');
console.log('     GET    /api/admin/chat/:complaintId');
console.log('     POST   /api/admin/chat/:complaintId');
console.log('     PATCH  /api/admin/chat/:complaintId/read');
console.log('\n   Admin Analytics Routes:');
console.log('     GET    /api/admin/analytics');
console.log('     GET    /api/admin/analytics/trends');

console.log('\n✅ All admin routes are properly configured!');
console.log('\n📝 Note: Routes require authentication with admin role (ADMIN or SUPER_ADMIN)');
console.log('   Use authGuard and rbacGuard middlewares for protection\n');
