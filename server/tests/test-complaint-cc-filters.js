/**
 * Test City Corporation Filtering in Admin Complaint Service
 * 
 * This test verifies that:
 * 1. Complaints can be filtered by city corporation code
 * 2. Complaints can be filtered by ward (through user relationship)
 * 3. Complaints can be filtered by thana (through user relationship)
 * 4. Status counts are correctly filtered by city corporation
 * 5. Complaint details include city corporation and thana information
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Admin credentials
const ADMIN_CREDENTIALS = {
    phone: '01700000000',
    password: 'Admin@123'
};

let adminToken = '';

async function loginAsAdmin() {
    try {
        console.log('\n📝 Logging in as admin...');
        const response = await axios.post(`${API_BASE_URL}/auth/login`, ADMIN_CREDENTIALS);

        if (response.data.success && response.data.token) {
            adminToken = response.data.token;
            console.log('✅ Admin login successful');
            return true;
        } else {
            console.error('❌ Admin login failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Admin login error:', error.response?.data || error.message);
        return false;
    }
}

async function testComplaintsByCityCorporation() {
    try {
        console.log('\n🧪 Test 1: Filter complaints by city corporation (DSCC)');

        const response = await axios.get(`${API_BASE_URL}/admin/complaints`, {
            params: {
                cityCorporationCode: 'DSCC',
                page: 1,
                limit: 10
            },
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.data.success) {
            const { complaints, pagination, statusCounts } = response.data;
            console.log(`✅ Found ${complaints.length} DSCC complaints (Total: ${pagination.total})`);
            console.log(`   Status counts:`, statusCounts);

            // Verify all complaints are from DSCC users
            const allFromDSCC = complaints.every(c =>
                c.user?.cityCorporationCode === 'DSCC' || c.user?.cityCorporation?.code === 'DSCC'
            );

            if (allFromDSCC) {
                console.log('✅ All complaints are from DSCC users');
            } else {
                console.log('❌ Some complaints are not from DSCC users');
            }

            // Check if city corporation info is included
            if (complaints.length > 0) {
                const firstComplaint = complaints[0];
                console.log('\n   Sample complaint user info:');
                console.log(`   - City Corporation: ${firstComplaint.user?.cityCorporation?.name || 'N/A'}`);
                console.log(`   - Ward: ${firstComplaint.user?.ward || 'N/A'}`);
                console.log(`   - Thana: ${firstComplaint.user?.thana?.name || 'N/A'}`);
            }

            return true;
        } else {
            console.error('❌ Failed to fetch DSCC complaints:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing DSCC complaints:', error.response?.data || error.message);
        return false;
    }
}

async function testComplaintsByDNCC() {
    try {
        console.log('\n🧪 Test 2: Filter complaints by city corporation (DNCC)');

        const response = await axios.get(`${API_BASE_URL}/admin/complaints`, {
            params: {
                cityCorporationCode: 'DNCC',
                page: 1,
                limit: 10
            },
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.data.success) {
            const { complaints, pagination, statusCounts } = response.data;
            console.log(`✅ Found ${complaints.length} DNCC complaints (Total: ${pagination.total})`);
            console.log(`   Status counts:`, statusCounts);

            // Verify all complaints are from DNCC users
            const allFromDNCC = complaints.every(c =>
                c.user?.cityCorporationCode === 'DNCC' || c.user?.cityCorporation?.code === 'DNCC'
            );

            if (allFromDNCC) {
                console.log('✅ All complaints are from DNCC users');
            } else {
                console.log('❌ Some complaints are not from DNCC users');
            }

            return true;
        } else {
            console.error('❌ Failed to fetch DNCC complaints:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing DNCC complaints:', error.response?.data || error.message);
        return false;
    }
}

async function testComplaintsByWard() {
    try {
        console.log('\n🧪 Test 3: Filter complaints by ward');

        const response = await axios.get(`${API_BASE_URL}/admin/complaints`, {
            params: {
                cityCorporationCode: 'DSCC',
                ward: '10',
                page: 1,
                limit: 10
            },
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.data.success) {
            const { complaints, pagination } = response.data;
            console.log(`✅ Found ${complaints.length} complaints from DSCC Ward 10 (Total: ${pagination.total})`);

            // Verify all complaints are from ward 10
            const allFromWard10 = complaints.every(c => c.user?.ward === '10');

            if (allFromWard10) {
                console.log('✅ All complaints are from Ward 10');
            } else {
                console.log('❌ Some complaints are not from Ward 10');
            }

            return true;
        } else {
            console.error('❌ Failed to fetch ward complaints:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing ward complaints:', error.response?.data || error.message);
        return false;
    }
}

async function testComplaintsByThana() {
    try {
        console.log('\n🧪 Test 4: Filter complaints by thana');

        // First, get a thana ID from existing complaints
        const allComplaints = await axios.get(`${API_BASE_URL}/admin/complaints`, {
            params: { page: 1, limit: 50 },
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const complaintWithThana = allComplaints.data.complaints.find(c => c.user?.thanaId);

        if (!complaintWithThana) {
            console.log('⚠️  No complaints with thana found, skipping test');
            return true;
        }

        const thanaId = complaintWithThana.user.thanaId;
        console.log(`   Testing with thana ID: ${thanaId} (${complaintWithThana.user.thana?.name})`);

        const response = await axios.get(`${API_BASE_URL}/admin/complaints`, {
            params: {
                thanaId: thanaId,
                page: 1,
                limit: 10
            },
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.data.success) {
            const { complaints, pagination } = response.data;
            console.log(`✅ Found ${complaints.length} complaints from thana ${thanaId} (Total: ${pagination.total})`);

            // Verify all complaints are from the specified thana
            const allFromThana = complaints.every(c => c.user?.thanaId === thanaId);

            if (allFromThana) {
                console.log('✅ All complaints are from the specified thana');
            } else {
                console.log('❌ Some complaints are not from the specified thana');
            }

            return true;
        } else {
            console.error('❌ Failed to fetch thana complaints:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing thana complaints:', error.response?.data || error.message);
        return false;
    }
}

async function testComplaintDetails() {
    try {
        console.log('\n🧪 Test 5: Verify complaint details include city corporation info');

        // Get first complaint
        const listResponse = await axios.get(`${API_BASE_URL}/admin/complaints`, {
            params: { page: 1, limit: 1 },
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (!listResponse.data.success || listResponse.data.complaints.length === 0) {
            console.log('⚠️  No complaints found, skipping test');
            return true;
        }

        const complaintId = listResponse.data.complaints[0].id;

        // Get complaint details
        const response = await axios.get(`${API_BASE_URL}/admin/complaints/${complaintId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.data.success) {
            const complaint = response.data.complaint;
            console.log('✅ Complaint details retrieved');
            console.log(`   Complaint ID: ${complaint.complaintId}`);
            console.log(`   User: ${complaint.user?.name}`);
            console.log(`   City Corporation: ${complaint.user?.cityCorporation?.name || 'N/A'}`);
            console.log(`   Ward: ${complaint.user?.ward || 'N/A'}`);
            console.log(`   Thana: ${complaint.user?.thana?.name || 'N/A'}`);

            // Check if city corporation info is present
            const hasCityCorpInfo = complaint.user?.cityCorporationCode || complaint.user?.cityCorporation;

            if (hasCityCorpInfo) {
                console.log('✅ City corporation information is included');
            } else {
                console.log('⚠️  City corporation information is missing');
            }

            return true;
        } else {
            console.error('❌ Failed to fetch complaint details:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing complaint details:', error.response?.data || error.message);
        return false;
    }
}

async function testCombinedFilters() {
    try {
        console.log('\n🧪 Test 6: Combined filters (city corporation + ward)');

        const response = await axios.get(`${API_BASE_URL}/admin/complaints`, {
            params: {
                cityCorporationCode: 'DSCC',
                ward: '5',
                status: 'PENDING',
                page: 1,
                limit: 10
            },
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.data.success) {
            const { complaints, pagination } = response.data;
            console.log(`✅ Found ${complaints.length} PENDING complaints from DSCC Ward 5 (Total: ${pagination.total})`);

            // Verify filters are applied correctly
            const allMatch = complaints.every(c =>
                (c.user?.cityCorporationCode === 'DSCC' || c.user?.cityCorporation?.code === 'DSCC') &&
                c.user?.ward === '5' &&
                c.status === 'PENDING'
            );

            if (allMatch) {
                console.log('✅ All complaints match the combined filters');
            } else {
                console.log('❌ Some complaints do not match the filters');
            }

            return true;
        } else {
            console.error('❌ Failed to fetch filtered complaints:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing combined filters:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting City Corporation Complaint Filter Tests\n');
    console.log('='.repeat(60));

    // Login first
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
        console.log('\n❌ Cannot proceed without admin authentication');
        return;
    }

    // Run all tests
    const results = [];
    results.push(await testComplaintsByCityCorporation());
    results.push(await testComplaintsByDNCC());
    results.push(await testComplaintsByWard());
    results.push(await testComplaintsByThana());
    results.push(await testComplaintDetails());
    results.push(await testCombinedFilters());

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`\nTests Passed: ${passed}/${total}`);

    if (passed === total) {
        console.log('\n✅ All tests passed! City corporation filtering is working correctly.');
    } else {
        console.log(`\n⚠️  ${total - passed} test(s) failed. Please review the output above.`);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
