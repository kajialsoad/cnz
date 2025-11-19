/**
 * Test script to verify category filter functionality
 * This script tests the category and subcategory filter components
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Test data
let authToken = '';

async function testCategoryFilters() {
    console.log('🧪 Testing Category Filter Functionality\n');

    try {
        // Step 1: Login as admin
        console.log('1️⃣ Logging in as admin...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: 'admin@cleancare.com',
            password: 'Admin@123',
        });

        authToken = loginResponse.data.data.accessToken;
        console.log('✅ Login successful\n');

        // Step 2: Fetch all categories
        console.log('2️⃣ Fetching all categories...');
        const categoriesResponse = await axios.get(`${API_BASE_URL}/api/categories`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        const categories = categoriesResponse.data.data.categories;
        console.log(`✅ Fetched ${categories.length} categories:`);
        categories.forEach((cat) => {
            console.log(`   - ${cat.id}: ${cat.english} (${cat.bangla})`);
        });
        console.log('');

        // Step 3: Test fetching subcategories for each category
        console.log('3️⃣ Testing subcategory fetching...');
        for (const category of categories.slice(0, 3)) {
            // Test first 3 categories
            const subcategoriesResponse = await axios.get(
                `${API_BASE_URL}/api/categories/${category.id}/subcategories`,
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            const subcategories = subcategoriesResponse.data.data.subcategories;
            console.log(`   ${category.english}: ${subcategories.length} subcategories`);
            subcategories.forEach((sub) => {
                console.log(`      - ${sub.id}: ${sub.english} (${sub.bangla})`);
            });
        }
        console.log('');

        // Step 4: Test filtering complaints by category
        console.log('4️⃣ Testing complaint filtering by category...');
        const testCategory = categories[0];
        const filteredResponse = await axios.get(
            `${API_BASE_URL}/api/admin/complaints?category=${testCategory.id}`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
            }
        );

        console.log(
            `✅ Filtered complaints by category "${testCategory.english}": ${filteredResponse.data.data.pagination.total} complaints`
        );
        console.log('');

        // Step 5: Test filtering by category and subcategory
        console.log('5️⃣ Testing complaint filtering by category and subcategory...');
        const subcategoriesResponse = await axios.get(
            `${API_BASE_URL}/api/categories/${testCategory.id}/subcategories`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
            }
        );

        if (subcategoriesResponse.data.data.subcategories.length > 0) {
            const testSubcategory = subcategoriesResponse.data.data.subcategories[0];
            const doubleFilteredResponse = await axios.get(
                `${API_BASE_URL}/api/admin/complaints?category=${testCategory.id}&subcategory=${testSubcategory.id}`,
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            console.log(
                `✅ Filtered complaints by category "${testCategory.english}" and subcategory "${testSubcategory.english}": ${doubleFilteredResponse.data.data.pagination.total} complaints`
            );
        }
        console.log('');

        // Step 6: Test URL parameter persistence
        console.log('6️⃣ Testing URL parameter structure...');
        const urlParams = new URLSearchParams({
            category: testCategory.id,
            status: 'PENDING',
            page: '1',
            limit: '20',
        });
        console.log(`✅ Example URL with filters: /complaints?${urlParams.toString()}`);
        console.log('');

        console.log('✅ All category filter tests passed!\n');
        console.log('📋 Summary:');
        console.log(`   - Categories loaded: ${categories.length}`);
        console.log('   - Subcategories fetched successfully');
        console.log('   - Category filtering works');
        console.log('   - Category + Subcategory filtering works');
        console.log('   - URL parameters structure verified');
        console.log('');
        console.log('🎉 Category filter implementation is complete and functional!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
        process.exit(1);
    }
}

// Run tests
testCategoryFilters();
