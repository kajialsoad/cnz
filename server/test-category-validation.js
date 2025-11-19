/**
 * Simple test for category validation logic
 * Tests the category service validation without requiring authentication
 */

const { categoryService } = require('./dist/services/category.service');

console.log('=================================================');
console.log('Category Validation Tests');
console.log('=================================================\n');

// Test 1: Valid category/subcategory combinations
console.log('Test 1: Valid Category/Subcategory Combinations');
console.log('------------------------------------------------');

const validCombinations = [
    { category: 'home', subcategory: 'not_collecting_waste' },
    { category: 'home', subcategory: 'worker_behavior' },
    { category: 'home', subcategory: 'billing_issue' },
    { category: 'road_environment', subcategory: 'road_waste' },
    { category: 'road_environment', subcategory: 'water_logging' },
    { category: 'road_environment', subcategory: 'manhole_issue' },
    { category: 'business', subcategory: 'not_collecting' },
    { category: 'office', subcategory: 'worker_behavior' },
    { category: 'education', subcategory: 'billing_issue' },
    { category: 'hospital', subcategory: 'not_collecting' },
    { category: 'religious', subcategory: 'worker_behavior' },
    { category: 'events', subcategory: 'event_description' }
];

let passCount = 0;
validCombinations.forEach(combo => {
    const isValid = categoryService.validateCategorySubcategory(combo.category, combo.subcategory);
    if (isValid) {
        console.log(`✅ ${combo.category} / ${combo.subcategory}`);
        passCount++;
    } else {
        console.log(`❌ ${combo.category} / ${combo.subcategory} - Should be valid but failed`);
    }
});

console.log(`\nResult: ${passCount}/${validCombinations.length} valid combinations passed\n`);

// Test 2: Invalid category/subcategory combinations
console.log('Test 2: Invalid Category/Subcategory Combinations');
console.log('------------------------------------------------');

const invalidCombinations = [
    { category: 'home', subcategory: 'road_waste' }, // road_waste belongs to road_environment
    { category: 'business', subcategory: 'not_collecting_waste' }, // not_collecting_waste is specific to home
    { category: 'office', subcategory: 'event_description' }, // event_description belongs to events
    { category: 'invalid_category', subcategory: 'not_collecting' },
    { category: 'home', subcategory: 'invalid_subcategory' }
];

let rejectCount = 0;
invalidCombinations.forEach(combo => {
    const isValid = categoryService.validateCategorySubcategory(combo.category, combo.subcategory);
    if (!isValid) {
        console.log(`✅ ${combo.category} / ${combo.subcategory} - Correctly rejected`);
        rejectCount++;
    } else {
        console.log(`❌ ${combo.category} / ${combo.subcategory} - Should be invalid but passed`);
    }
});

console.log(`\nResult: ${rejectCount}/${invalidCombinations.length} invalid combinations correctly rejected\n`);

// Test 3: Get all categories
console.log('Test 3: Get All Categories');
console.log('------------------------------------------------');

const allCategories = categoryService.getAllCategories();
console.log(`Total categories: ${allCategories.length}`);
allCategories.forEach(cat => {
    console.log(`  - ${cat.id}: ${cat.english} (${cat.bangla}) - ${cat.subcategories.length} subcategories`);
});

// Test 4: Get category names
console.log('\nTest 4: Get Category Names');
console.log('------------------------------------------------');

const testCategoryId = 'home';
const englishName = categoryService.getCategoryName(testCategoryId, 'en');
const banglaName = categoryService.getCategoryName(testCategoryId, 'bn');
console.log(`Category '${testCategoryId}':`);
console.log(`  English: ${englishName}`);
console.log(`  Bangla: ${banglaName}`);

// Test 5: Get subcategory names
console.log('\nTest 5: Get Subcategory Names');
console.log('------------------------------------------------');

const testSubcategoryId = 'not_collecting_waste';
const subEnglishName = categoryService.getSubcategoryName(testCategoryId, testSubcategoryId, 'en');
const subBanglaName = categoryService.getSubcategoryName(testCategoryId, testSubcategoryId, 'bn');
console.log(`Subcategory '${testSubcategoryId}' in category '${testCategoryId}':`);
console.log(`  English: ${subEnglishName}`);
console.log(`  Bangla: ${subBanglaName}`);

// Test 6: Get all subcategory IDs for a category
console.log('\nTest 6: Get All Subcategory IDs');
console.log('------------------------------------------------');

const subcategoryIds = categoryService.getAllSubcategoryIds('home');
console.log(`Subcategories for 'home': ${subcategoryIds.join(', ')}`);

// Summary
console.log('\n=================================================');
console.log('Summary');
console.log('=================================================');
const totalTests = validCombinations.length + invalidCombinations.length;
const totalPassed = passCount + rejectCount;
console.log(`Total: ${totalPassed}/${totalTests} validation tests passed`);

if (totalPassed === totalTests) {
    console.log('🎉 All validation tests passed!');
} else {
    console.log(`⚠️  ${totalTests - totalPassed} test(s) failed`);
}
