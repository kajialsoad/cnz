/**
 * Test script for Category Routes
 * Tests all category endpoints to verify they work correctly
 */

const BASE_URL = 'http://localhost:3000';

async function testCategoryRoutes() {
    console.log('🧪 Testing Category Routes\n');
    console.log('='.repeat(60));

    try {
        // Test 1: Get all categories
        console.log('\n📋 Test 1: GET /api/categories');
        console.log('-'.repeat(60));
        const allCategoriesRes = await fetch(`${BASE_URL}/api/categories`);
        const allCategoriesData = await allCategoriesRes.json();

        if (allCategoriesData.success) {
            console.log('✅ Success!');
            console.log(`   Total categories: ${allCategoriesData.data.summary.totalCategories}`);
            console.log(`   Total subcategories: ${allCategoriesData.data.summary.totalSubcategories}`);
            console.log(`   Categories:`, allCategoriesData.data.categories.map(c => c.id).join(', '));
        } else {
            console.log('❌ Failed:', allCategoriesData.message);
        }

        // Test 2: Get specific category (home)
        console.log('\n📋 Test 2: GET /api/categories/home');
        console.log('-'.repeat(60));
        const homeRes = await fetch(`${BASE_URL}/api/categories/home`);
        const homeData = await homeRes.json();

        if (homeData.success) {
            console.log('✅ Success!');
            console.log(`   Category: ${homeData.data.category.english} (${homeData.data.category.bangla})`);
            console.log(`   Color: ${homeData.data.category.color}`);
            console.log(`   Subcategories: ${homeData.data.category.subcategories.length}`);
            homeData.data.category.subcategories.forEach(sub => {
                console.log(`     - ${sub.id}: ${sub.english} (${sub.bangla})`);
            });
        } else {
            console.log('❌ Failed:', homeData.message);
        }

        // Test 3: Get subcategories for road_environment
        console.log('\n📋 Test 3: GET /api/categories/road_environment/subcategories');
        console.log('-'.repeat(60));
        const roadSubsRes = await fetch(`${BASE_URL}/api/categories/road_environment/subcategories`);
        const roadSubsData = await roadSubsRes.json();

        if (roadSubsData.success) {
            console.log('✅ Success!');
            console.log(`   Category: ${roadSubsData.data.categoryId}`);
            console.log(`   Subcategories: ${roadSubsData.data.subcategories.length}`);
            roadSubsData.data.subcategories.forEach(sub => {
                console.log(`     - ${sub.id}: ${sub.english} (${sub.bangla})`);
            });
        } else {
            console.log('❌ Failed:', roadSubsData.message);
        }

        // Test 4: Get invalid category
        console.log('\n📋 Test 4: GET /api/categories/invalid_category (should fail)');
        console.log('-'.repeat(60));
        const invalidRes = await fetch(`${BASE_URL}/api/categories/invalid_category`);
        const invalidData = await invalidRes.json();

        if (!invalidData.success && invalidRes.status === 404) {
            console.log('✅ Correctly returned 404 error');
            console.log(`   Message: ${invalidData.message}`);
        } else {
            console.log('❌ Should have returned 404 error');
        }

        // Test 5: Validate valid category/subcategory combination
        console.log('\n📋 Test 5: POST /api/categories/validate (valid combination)');
        console.log('-'.repeat(60));
        const validValidateRes = await fetch(`${BASE_URL}/api/categories/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: 'home',
                subcategory: 'not_collecting_waste'
            })
        });
        const validValidateData = await validValidateRes.json();

        if (validValidateData.success) {
            console.log('✅ Valid combination confirmed!');
            console.log(`   Category: ${validValidateData.data.categoryName} (${validValidateData.data.categoryNameBn})`);
            console.log(`   Subcategory: ${validValidateData.data.subcategoryName} (${validValidateData.data.subcategoryNameBn})`);
        } else {
            console.log('❌ Failed:', validValidateData.message);
        }

        // Test 6: Validate invalid category/subcategory combination
        console.log('\n📋 Test 6: POST /api/categories/validate (invalid combination)');
        console.log('-'.repeat(60));
        const invalidValidateRes = await fetch(`${BASE_URL}/api/categories/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: 'home',
                subcategory: 'road_waste' // This belongs to road_environment, not home
            })
        });
        const invalidValidateData = await invalidValidateRes.json();

        if (!invalidValidateData.success && invalidValidateRes.status === 400) {
            console.log('✅ Correctly identified invalid combination');
            console.log(`   Message: ${invalidValidateData.message}`);
            console.log(`   Valid subcategories for 'home':`, invalidValidateData.data.validSubcategories.join(', '));
        } else {
            console.log('❌ Should have returned 400 error');
        }

        // Test 7: Test all 8 categories
        console.log('\n📋 Test 7: Verify all 8 categories exist');
        console.log('-'.repeat(60));
        const expectedCategories = ['home', 'road_environment', 'business', 'office', 'education', 'hospital', 'religious', 'events'];
        let allExist = true;

        for (const catId of expectedCategories) {
            const res = await fetch(`${BASE_URL}/api/categories/${catId}`);
            const data = await res.json();
            if (data.success) {
                console.log(`   ✅ ${catId}: ${data.data.category.english} (${data.data.category.subcategories.length} subcategories)`);
            } else {
                console.log(`   ❌ ${catId}: Not found`);
                allExist = false;
            }
        }

        if (allExist) {
            console.log('\n✅ All 8 categories exist!');
        } else {
            console.log('\n❌ Some categories are missing');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Category Routes Testing Complete!\n');

    } catch (error) {
        console.error('\n❌ Error during testing:', error.message);
        console.log('\n💡 Make sure the server is running on port 3000');
    }
}

// Run tests
testCategoryRoutes();
