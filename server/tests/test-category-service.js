const { categoryService } = require('./src/services/category.service.ts');

console.log('Testing Category Service...\n');

// Test 1: Get all categories
console.log('1️⃣ Testing getAllCategories():');
const allCategories = categoryService.getAllCategories();
console.log(`   Total categories: ${allCategories.length}`);
allCategories.forEach(cat => {
    console.log(`   - ${cat.english} (${cat.bangla}): ${cat.subcategories.length} subcategories`);
});

// Test 2: Get category by ID
console.log('\n2️⃣ Testing getCategoryById():');
const homeCategory = categoryService.getCategoryById('home');
console.log(`   Category: ${homeCategory.english} (${homeCategory.bangla})`);
console.log(`   Color: ${homeCategory.color}`);

// Test 3: Get subcategories
console.log('\n3️⃣ Testing getSubcategories():');
const homeSubcategories = categoryService.getSubcategories('home');
console.log(`   Subcategories for 'home':`);
homeSubcategories.forEach(sub => {
    console.log(`   - ${sub.english} (${sub.bangla})`);
});

// Test 4: Validate category/subcategory
console.log('\n4️⃣ Testing validateCategorySubcategory():');
const isValid1 = categoryService.validateCategorySubcategory('home', 'not_collecting_waste');
const isValid2 = categoryService.validateCategorySubcategory('home', 'invalid_subcategory');
console.log(`   Valid (home, not_collecting_waste): ${isValid1}`);
console.log(`   Invalid (home, invalid_subcategory): ${isValid2}`);

// Test 5: Get names
console.log('\n5️⃣ Testing name getters:');
console.log(`   Category name: ${categoryService.getCategoryName('home')}`);
console.log(`   Category name (Bangla): ${categoryService.getCategoryNameBangla('home')}`);
console.log(`   Subcategory name: ${categoryService.getSubcategoryName('home', 'not_collecting_waste')}`);
console.log(`   Subcategory name (Bangla): ${categoryService.getSubcategoryNameBangla('home', 'not_collecting_waste')}`);

// Test 6: Get color
console.log('\n6️⃣ Testing getCategoryColor():');
console.log(`   Home color: ${categoryService.getCategoryColor('home')}`);
console.log(`   Road color: ${categoryService.getCategoryColor('road_environment')}`);

// Test 7: Get counts
console.log('\n7️⃣ Testing count methods:');
console.log(`   Total categories: ${categoryService.getCategoryCount()}`);
console.log(`   Total subcategories: ${categoryService.getSubcategoryCount()}`);

console.log('\n✅ All tests completed!');
