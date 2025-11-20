/**
 * Manual API test for category endpoints
 * Run this to verify the category API is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testCategoryEndpoints() {
    console.log('=================================================');
    console.log('Category API Manual Test');
    console.log('=================================================\n');

    try {
        // Test 1: Get all categories
        console.log('Test 1: GET /api/categories');
        console.log('----------------------------');
        const categoriesResponse = await axios.get(`${BASE_URL}/categories`);
        console.log('Status:', categoriesResponse.status);
        console.log('Categories found:', categoriesResponse.data.data.categories.length);
        console.log('\nFirst category:');
        console.log(JSON.stringify(categoriesResponse.data.data.categories[0], null, 2));

        // Test 2: Get specific category
        console.log('\n\nTest 2: GET /api/categories/home');
        console.log('----------------------------');
        const categoryResponse = await axios.get(`${BASE_URL}/categories/home`);
        console.log('Status:', categoryResponse.status);
        console.log('Category:');
        console.log(JSON.stringify(categoryResponse.data.data.category, null, 2));

        // Test 3: Get subcategories
        console.log('\n\nTest 3: GET /api/categories/home/subcategories');
        console.log('----------------------------');
        const subcategoriesResponse = await axios.get(`${BASE_URL}/categories/home/subcategories`);
        console.log('Status:', subcategoriesResponse.status);
        console.log('Subcategories:');
        console.log(JSON.stringify(subcategoriesResponse.data.data.subcategories, null, 2));

        console.log('\n\n🎉 All category endpoints are working!');

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
    }
}

testCategoryEndpoints();
