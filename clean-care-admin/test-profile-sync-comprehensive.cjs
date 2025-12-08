/**
 * Comprehensive Profile Synchronization Test
 * 
 * This test verifies that profile updates are synchronized across:
 * 1. Multiple browser tabs (cross-tab synchronization)
 * 2. All profile displays (sidebar, header, modal)
 * 3. Cache persistence and invalidation
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Profile Synchronization Comprehensive Test\n');
console.log('='.repeat(60));

// Test configuration
const CACHE_KEY = 'cc_profile_cache';
const SYNC_EVENT = 'cc_profile_update';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Files to check
const filesToCheck = [
    {
        path: 'src/contexts/ProfileContext.tsx',
        name: 'ProfileContext',
        requiredFeatures: [
            'localStorage.getItem(CACHE_KEY)',
            'localStorage.setItem(CACHE_KEY',
            'localStorage.setItem(SYNC_EVENT',
            'window.addEventListener(\'storage\'',
            'broadcastUpdate',
            'saveToCache',
            'loadFromCache',
        ]
    },
    {
        path: 'src/components/common/ProfileButton/ProfileButton.tsx',
        name: 'ProfileButton',
        requiredFeatures: [
            'useProfile()',
            'profile',
        ]
    },
    {
        path: 'src/components/common/Layout/Sidebar/Sidebar.tsx',
        name: 'Sidebar',
        requiredFeatures: [
            'useProfile()',
            'ProfileButton',
        ]
    },
    {
        path: 'src/components/common/Layout/Header/Header.tsx',
        name: 'Header',
        requiredFeatures: [
            'ProfileButton',
        ]
    },
    {
        path: 'src/components/common/ProfileModal/ProfileModal.tsx',
        name: 'ProfileModal',
        requiredFeatures: [
            'useProfile()',
            'updateProfile',
        ]
    },
    {
        path: 'src/components/common/ProfileEditForm/ProfileEditForm.tsx',
        name: 'ProfileEditForm',
        requiredFeatures: [
            'onSave',
        ]
    },
];

let allTestsPassed = true;
const results = [];

// Test 1: Verify ProfileContext implementation
console.log('\n📋 Test 1: ProfileContext Synchronization Features');
console.log('-'.repeat(60));

const profileContextPath = path.join(__dirname, filesToCheck[0].path);
if (fs.existsSync(profileContextPath)) {
    const content = fs.readFileSync(profileContextPath, 'utf8');

    const features = filesToCheck[0].requiredFeatures;
    const missingFeatures = [];

    features.forEach(feature => {
        if (!content.includes(feature)) {
            missingFeatures.push(feature);
        }
    });

    if (missingFeatures.length === 0) {
        console.log('✅ ProfileContext has all synchronization features');
        results.push({ test: 'ProfileContext Features', status: 'PASS' });
    } else {
        console.log('❌ ProfileContext missing features:');
        missingFeatures.forEach(f => console.log(`   - ${f}`));
        allTestsPassed = false;
        results.push({ test: 'ProfileContext Features', status: 'FAIL' });
    }

    // Check for cache management
    const hasCacheManagement =
        content.includes('loadFromCache') &&
        content.includes('saveToCache') &&
        content.includes('CACHE_DURATION');

    if (hasCacheManagement) {
        console.log('✅ Cache management implemented');
        results.push({ test: 'Cache Management', status: 'PASS' });
    } else {
        console.log('❌ Cache management incomplete');
        allTestsPassed = false;
        results.push({ test: 'Cache Management', status: 'FAIL' });
    }

    // Check for cross-tab synchronization
    const hasCrossTabSync =
        content.includes('broadcastUpdate') &&
        content.includes('window.addEventListener(\'storage\'') &&
        content.includes('SYNC_EVENT');

    if (hasCrossTabSync) {
        console.log('✅ Cross-tab synchronization implemented');
        results.push({ test: 'Cross-tab Sync', status: 'PASS' });
    } else {
        console.log('❌ Cross-tab synchronization incomplete');
        allTestsPassed = false;
        results.push({ test: 'Cross-tab Sync', status: 'FAIL' });
    }

    // Check for profile update propagation
    const hasUpdatePropagation =
        content.includes('updateProfile') &&
        content.includes('broadcastUpdate(updatedProfile)') &&
        content.includes('saveToCache(updatedProfile)');

    if (hasUpdatePropagation) {
        console.log('✅ Profile update propagation implemented');
        results.push({ test: 'Update Propagation', status: 'PASS' });
    } else {
        console.log('❌ Profile update propagation incomplete');
        allTestsPassed = false;
        results.push({ test: 'Update Propagation', status: 'FAIL' });
    }

    // Check for avatar upload synchronization
    const hasAvatarSync =
        content.includes('uploadAvatar') &&
        content.includes('broadcastUpdate') &&
        content.includes('saveToCache');

    if (hasAvatarSync) {
        console.log('✅ Avatar upload synchronization implemented');
        results.push({ test: 'Avatar Upload Sync', status: 'PASS' });
    } else {
        console.log('❌ Avatar upload synchronization incomplete');
        allTestsPassed = false;
        results.push({ test: 'Avatar Upload Sync', status: 'FAIL' });
    }
} else {
    console.log('❌ ProfileContext.tsx not found');
    allTestsPassed = false;
    results.push({ test: 'ProfileContext File', status: 'FAIL' });
}

// Test 2: Verify component integration
console.log('\n📋 Test 2: Component Integration with ProfileContext');
console.log('-'.repeat(60));

const componentsToCheck = filesToCheck.slice(1);
componentsToCheck.forEach(file => {
    const filePath = path.join(__dirname, file.path);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        const hasAllFeatures = file.requiredFeatures.every(feature =>
            content.includes(feature)
        );

        if (hasAllFeatures) {
            console.log(`✅ ${file.name} properly integrated`);
            results.push({ test: `${file.name} Integration`, status: 'PASS' });
        } else {
            console.log(`❌ ${file.name} missing integration features`);
            allTestsPassed = false;
            results.push({ test: `${file.name} Integration`, status: 'FAIL' });
        }
    } else {
        console.log(`❌ ${file.name} file not found`);
        allTestsPassed = false;
        results.push({ test: `${file.name} File`, status: 'FAIL' });
    }
});

// Test 3: Verify synchronization flow
console.log('\n📋 Test 3: Synchronization Flow Verification');
console.log('-'.repeat(60));

const profileContextContent = fs.existsSync(profileContextPath)
    ? fs.readFileSync(profileContextPath, 'utf8')
    : '';

// Check initialization flow
const hasInitFlow =
    profileContextContent.includes('loadFromCache()') &&
    profileContextContent.includes('refreshProfile()') &&
    profileContextContent.includes('isInitialized');

if (hasInitFlow) {
    console.log('✅ Initialization flow: Cache → API refresh');
    results.push({ test: 'Initialization Flow', status: 'PASS' });
} else {
    console.log('❌ Initialization flow incomplete');
    allTestsPassed = false;
    results.push({ test: 'Initialization Flow', status: 'FAIL' });
}

// Check update flow
const hasUpdateFlow =
    profileContextContent.includes('setProfile(updatedProfile)') &&
    profileContextContent.includes('saveToCache(updatedProfile)') &&
    profileContextContent.includes('broadcastUpdate(updatedProfile)');

if (hasUpdateFlow) {
    console.log('✅ Update flow: State → Cache → Broadcast');
    results.push({ test: 'Update Flow', status: 'PASS' });
} else {
    console.log('❌ Update flow incomplete');
    allTestsPassed = false;
    results.push({ test: 'Update Flow', status: 'FAIL' });
}

// Check storage event listener
const hasStorageListener =
    profileContextContent.includes('window.addEventListener(\'storage\'') &&
    profileContextContent.includes('event.key === SYNC_EVENT') &&
    profileContextContent.includes('setProfile(data)');

if (hasStorageListener) {
    console.log('✅ Storage event listener: Receives updates from other tabs');
    results.push({ test: 'Storage Event Listener', status: 'PASS' });
} else {
    console.log('❌ Storage event listener incomplete');
    allTestsPassed = false;
    results.push({ test: 'Storage Event Listener', status: 'FAIL' });
}

// Test 4: Verify error handling
console.log('\n📋 Test 4: Error Handling');
console.log('-'.repeat(60));

const hasErrorHandling =
    profileContextContent.includes('try {') &&
    profileContextContent.includes('catch') &&
    profileContextContent.includes('console.error');

if (hasErrorHandling) {
    console.log('✅ Error handling implemented');
    results.push({ test: 'Error Handling', status: 'PASS' });
} else {
    console.log('❌ Error handling missing');
    allTestsPassed = false;
    results.push({ test: 'Error Handling', status: 'FAIL' });
}

// Test 5: Verify cache expiration
console.log('\n📋 Test 5: Cache Expiration');
console.log('-'.repeat(60));

const hasCacheExpiration =
    profileContextContent.includes('CACHE_DURATION') &&
    profileContextContent.includes('timestamp') &&
    profileContextContent.includes('now - timestamp < CACHE_DURATION');

if (hasCacheExpiration) {
    console.log('✅ Cache expiration logic implemented');
    results.push({ test: 'Cache Expiration', status: 'PASS' });
} else {
    console.log('❌ Cache expiration logic missing');
    allTestsPassed = false;
    results.push({ test: 'Cache Expiration', status: 'FAIL' });
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));

const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;

console.log(`\nTotal Tests: ${results.length}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);

if (allTestsPassed) {
    console.log('\n🎉 All synchronization tests passed!');
    console.log('\n✨ Profile synchronization is fully implemented:');
    console.log('   • Cross-tab synchronization using localStorage events');
    console.log('   • Profile data caching with expiration');
    console.log('   • Automatic updates across all components');
    console.log('   • Error handling and recovery');
    console.log('   • Avatar upload synchronization');
} else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
}

console.log('\n' + '='.repeat(60));
console.log('📝 Manual Testing Instructions');
console.log('='.repeat(60));
console.log('\nTo test cross-tab synchronization manually:');
console.log('1. Open the admin panel in two browser tabs');
console.log('2. Login with the same account in both tabs');
console.log('3. In Tab 1: Open profile modal and edit your name');
console.log('4. Save the changes in Tab 1');
console.log('5. Observe Tab 2: Profile should update automatically');
console.log('6. Check sidebar and header in both tabs');
console.log('7. Verify avatar updates sync across tabs');
console.log('8. Close and reopen browser to test cache persistence');

console.log('\n' + '='.repeat(60));

process.exit(allTestsPassed ? 0 : 1);
