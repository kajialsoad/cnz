#!/usr/bin/env node

/**
 * Quick Check Script - Verify Complaint System
 * 
 * This script checks:
 * 1. Server is running
 * 2. Database is accessible
 * 3. Users exist
 * 4. Complaints exist
 * 5. API endpoints work
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function quickCheck() {
    console.log('🔍 Quick System Check\n');
    console.log('='.repeat(50));

    try {
        // 1. Check Database Connection
        console.log('\n1️⃣  Checking Database Connection...');
        await prisma.$connect();
        console.log('   ✅ Database connected');

        // 2. Check Users
        console.log('\n2️⃣  Checking Users...');
        const users = await prisma.user.findMany({
            where: { role: 'CITIZEN' },
            take: 5,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                isActive: true,
            }
        });

        if (users.length === 0) {
            console.log('   ⚠️  No users found!');
            console.log('   💡 Create a test user first');
        } else {
            console.log(`   ✅ Found ${users.length} users`);
            users.forEach(user => {
                console.log(`      - ${user.firstName} ${user.lastName} (${user.phone}) ${user.isActive ? '✅' : '❌ Inactive'}`);
            });
        }

        // 3. Check Complaints
        console.log('\n3️⃣  Checking Complaints...');
        const complaints = await prisma.complaint.findMany({
            take: 10,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (complaints.length === 0) {
            console.log('   ⚠️  No complaints found!');
            console.log('   💡 Create a test complaint through the app');
        } else {
            console.log(`   ✅ Found ${complaints.length} complaints`);
            complaints.forEach(complaint => {
                console.log(`      - #${complaint.id}: ${complaint.description.substring(0, 40)}...`);
                console.log(`        User: ${complaint.user.firstName} ${complaint.user.lastName} (${complaint.user.phone})`);
                console.log(`        Status: ${complaint.status}`);
                console.log(`        Created: ${complaint.createdAt.toLocaleString()}`);
            });
        }

        // 4. Check Server Health
        console.log('\n4️⃣  Checking Server...');
        try {
            const healthResponse = await axios.get(`${BASE_URL}/api/health`, {
                timeout: 5000
            });
            console.log('   ✅ Server is running');
            console.log(`      Status: ${healthResponse.data.status}`);
        } catch (error) {
            console.log('   ❌ Server is not responding');
            console.log('   💡 Start server with: npm run dev');
            return;
        }

        // 5. Test Login (if we have users)
        if (users.length > 0) {
            console.log('\n5️⃣  Testing Login API...');
            const testUser = users[0];

            console.log(`   ℹ️  To test login, use:`);
            console.log(`      Phone: ${testUser.phone}`);
            console.log(`      Password: [your password]`);
            console.log(`\n   💡 Run this command to test:`);
            console.log(`      curl -X POST ${BASE_URL}/api/auth/login \\`);
            console.log(`        -H "Content-Type: application/json" \\`);
            console.log(`        -d '{"phone":"${testUser.phone}","password":"YOUR_PASSWORD"}'`);
        }

        // 6. Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 Summary\n');
        console.log(`   Users: ${users.length}`);
        console.log(`   Complaints: ${complaints.length}`);
        console.log(`   Server: Running ✅`);
        console.log(`   Database: Connected ✅`);

        if (users.length === 0) {
            console.log('\n⚠️  Action Required: Create test users');
            console.log('   Run: node create-test-users-simple.js');
        }

        if (complaints.length === 0) {
            console.log('\n⚠️  Action Required: Create test complaints');
            console.log('   Use the mobile app to create complaints');
        }

        if (users.length > 0 && complaints.length > 0) {
            console.log('\n✅ System is ready for testing!');
            console.log('\n📱 Mobile App Configuration:');
            console.log('   Android Emulator: http://10.0.2.2:3000');
            console.log('   iOS Simulator: http://localhost:3000');
            console.log('   Physical Device: http://YOUR_IP:3000');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'P1001') {
            console.log('\n💡 Database connection failed. Check:');
            console.log('   - Is PostgreSQL running?');
            console.log('   - Is .env configured correctly?');
            console.log('   - Run: npm run migrate');
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Run the check
quickCheck().catch(console.error);
