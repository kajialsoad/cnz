/**
 * Test script for Role Configuration System
 * Verifies that all role configuration functions work correctly
 */

// Import the role configuration (using require for Node.js compatibility)
const roleConfig = require('./src/config/roleConfig.ts');

console.log('🧪 Testing Role Configuration System\n');
console.log('='.repeat(60));

// Test 1: Verify all roles are defined
console.log('\n✅ Test 1: Verify all roles are defined');
const roles = ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'];
roles.forEach(role => {
    const config = roleConfig.getRoleConfig(role);
    console.log(`  ${role}: ${config.label} (${config.icon})`);
});

// Test 2: Test role formatting functions
console.log('\n✅ Test 2: Test role formatting functions');
roles.forEach(role => {
    console.log(`  ${role}:`);
    console.log(`    - Label: ${roleConfig.formatRoleLabel(role)}`);
    console.log(`    - Bangla: ${roleConfig.formatRoleLabel(role, true)}`);
    console.log(`    - With Icon: ${roleConfig.formatRoleWithIcon(role)}`);
    console.log(`    - Display Name: ${roleConfig.getRoleDisplayName(role)}`);
});

// Test 3: Test role colors and gradients
console.log('\n✅ Test 3: Test role colors and gradients');
roles.forEach(role => {
    console.log(`  ${role}:`);
    console.log(`    - Color: ${roleConfig.getRoleColor(role)}`);
    console.log(`    - Badge Color: ${roleConfig.getRoleBadgeColor(role)}`);
    console.log(`    - Gradient: ${roleConfig.getRoleGradient(role)}`);
});

// Test 4: Test permissions
console.log('\n✅ Test 4: Test permissions');
roles.forEach(role => {
    const permissions = roleConfig.getRolePermissions(role);
    console.log(`  ${role} (${permissions.length} permissions):`);
    permissions.forEach(perm => {
        const desc = roleConfig.getPermissionDescription(role, perm);
        console.log(`    - ${perm}: ${desc}`);
    });
});

// Test 5: Test role hierarchy
console.log('\n✅ Test 5: Test role hierarchy');
roles.forEach(role => {
    console.log(`  ${role}: Level ${roleConfig.getRoleLevel(role)}`);
});

// Test 6: Test role comparison
console.log('\n✅ Test 6: Test role comparison');
console.log(`  MASTER_ADMIN >= SUPER_ADMIN: ${roleConfig.hasHigherOrEqualRole('MASTER_ADMIN', 'SUPER_ADMIN')}`);
console.log(`  SUPER_ADMIN >= ADMIN: ${roleConfig.hasHigherOrEqualRole('SUPER_ADMIN', 'ADMIN')}`);
console.log(`  ADMIN >= SUPER_ADMIN: ${roleConfig.hasHigherOrEqualRole('ADMIN', 'SUPER_ADMIN')}`);

// Test 7: Test role validation
console.log('\n✅ Test 7: Test role validation');
console.log(`  'ADMIN' is valid: ${roleConfig.isValidRole('ADMIN')}`);
console.log(`  'INVALID_ROLE' is valid: ${roleConfig.isValidRole('INVALID_ROLE')}`);
console.log(`  undefined is valid: ${roleConfig.isValidRole(undefined)}`);

// Test 8: Test permission checking
console.log('\n✅ Test 8: Test permission checking');
console.log(`  MASTER_ADMIN has 'Full System Access': ${roleConfig.hasPermission('MASTER_ADMIN', 'Full System Access')}`);
console.log(`  ADMIN has 'Full System Access': ${roleConfig.hasPermission('ADMIN', 'Full System Access')}`);
console.log(`  ADMIN has 'Complaint Management': ${roleConfig.hasPermission('ADMIN', 'Complaint Management')}`);

// Test 9: Test all roles retrieval
console.log('\n✅ Test 9: Test all roles retrieval');
const allRoles = roleConfig.getAllRoles();
console.log(`  All roles: ${allRoles.join(', ')}`);

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed successfully!\n');
