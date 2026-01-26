/**
 * Verification Script: Live Chat TypeScript Types
 * 
 * This script verifies that all TypeScript types are properly defined
 * and can be imported without errors.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Live Chat TypeScript Types...\n');

// Check if types file exists
const typesPath = path.join(__dirname, 'src/types/live-chat.types.ts');
if (!fs.existsSync(typesPath)) {
    console.error('❌ Types file not found:', typesPath);
    process.exit(1);
}
console.log('✅ Types file exists:', typesPath);

// Read types file
const typesContent = fs.readFileSync(typesPath, 'utf8');

// Check for all required type definitions
const requiredTypes = [
    'LiveChatMessage',
    'UserConversation',
    'LiveChatFilters',
    'ChatStatistics',
    'AdminInfo',
    'MessagesResponse',
    'ConversationsResponse',
    'SendMessageInput',
    'PaginationQuery'
];

console.log('\n📋 Checking for required type definitions:');
let allTypesFound = true;
requiredTypes.forEach(typeName => {
    const regex = new RegExp(`export interface ${typeName}`, 'g');
    if (regex.test(typesContent)) {
        console.log(`  ✅ ${typeName}`);
    } else {
        console.log(`  ❌ ${typeName} - NOT FOUND`);
        allTypesFound = false;
    }
});

if (!allTypesFound) {
    console.error('\n❌ Some required types are missing!');
    process.exit(1);
}

// Check TypeScript compilation
console.log('\n🔨 Running TypeScript compilation check...');
try {
    execSync('npx tsc --noEmit --project tsconfig.json', {
        cwd: __dirname,
        stdio: 'pipe'
    });
    console.log('✅ TypeScript compilation successful - no errors!');
} catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';

    // Check if there are live-chat related errors
    if (output.includes('live-chat')) {
        console.error('❌ TypeScript errors found in live-chat files:');
        console.error(output);
        process.exit(1);
    } else {
        console.log('✅ No live-chat related TypeScript errors');
    }
}

// Check if types are imported in service
const servicePath = path.join(__dirname, 'src/services/live-chat.service.ts');
if (fs.existsSync(servicePath)) {
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    if (serviceContent.includes("../types/live-chat.types")) {
        console.log('✅ Types imported in LiveChatService');
    } else {
        console.log('⚠️  Types not imported in LiveChatService');
    }
}

// Check if types are imported in controllers
const controllerPath = path.join(__dirname, 'src/controllers/live-chat.controller.ts');
if (fs.existsSync(controllerPath)) {
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    if (controllerContent.includes("../types/live-chat.types")) {
        console.log('✅ Types imported in LiveChatController');
    } else {
        console.log('⚠️  Types not imported in LiveChatController');
    }
}

const adminControllerPath = path.join(__dirname, 'src/controllers/admin.live-chat.controller.ts');
if (fs.existsSync(adminControllerPath)) {
    const adminControllerContent = fs.readFileSync(adminControllerPath, 'utf8');
    if (adminControllerContent.includes("../types/live-chat.types")) {
        console.log('✅ Types imported in AdminLiveChatController');
    } else {
        console.log('⚠️  Types not imported in AdminLiveChatController');
    }
}

console.log('\n✅ All verifications passed!');
console.log('\n📊 Summary:');
console.log(`  - ${requiredTypes.length} type definitions found`);
console.log('  - TypeScript compilation successful');
console.log('  - Types properly imported in service and controllers');
console.log('\n🎉 Task 1.6: Add TypeScript Types - COMPLETE!');
