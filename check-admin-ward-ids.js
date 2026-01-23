/**
 * Check Admin's Ward IDs vs Ward Numbers
 * 
 * Problem: Admin has Ward Numbers (15, 20, 4, 6, 10) assigned
 * But backend filters by Ward IDs, not Ward Numbers!
 */

const BASE_URL = 'http://localhost:4000';

async function checkWardMapping() {
    console.log('\n🔍 Checking Ward Number to Ward ID Mapping...\n');

    try {
        // Fetch all wards
        const response = await fetch(`${BASE_URL}/api/public/wards`);
        const data = await response.json();
        const wards = data.data || data;

        console.log('📊 Ward Number → Ward ID Mapping:');
        console.log('');

        const adminWardNumbers = [15, 20, 4, 6, 10];
        const adminWardIds = [];

        adminWardNumbers.forEach(wardNum => {
            const ward = wards.find(w => w.wardNumber === wardNum || w.number === wardNum);
            if (ward) {
                console.log(`   Ward ${wardNum} → ID ${ward.id}`);
                adminWardIds.push(ward.id);
            } else {
                console.log(`   Ward ${wardNum} → NOT FOUND ❌`);
            }
        });

        console.log('');
        console.log(`✅ Admin's Ward IDs should be: [${adminWardIds.join(', ')}]`);
        console.log('');

        // Check Ward 36
        const ward36 = wards.find(w => w.wardNumber === 36 || w.number === 36);
        if (ward36) {
            console.log(`📍 Ward 36 → ID ${ward36.id}`);
            if (adminWardIds.includes(ward36.id)) {
                console.log('   ❌ Ward 36 IS in admin wards - Should NOT show');
            } else {
                console.log('   ✅ Ward 36 is NOT in admin wards - Correct!');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkWardMapping();
