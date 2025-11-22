#!/usr/bin/env node

/**
 * Create Test Complaint for User
 * 
 * This script creates a test complaint for a specific user
 * Useful when testing the mobile app complaint list
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration
const USER_PHONE = '01712345678'; // ⚠️ CHANGE THIS to your test user's phone

async function createTestComplaint() {
    console.log('🔧 Creating Test Complaint\n');
    console.log('='.repeat(50));

    try {
        // 1. Find user by phone
        console.log(`\n1️⃣  Finding user with phone: ${USER_PHONE}...`);
        const user = await prisma.user.findUnique({
            where: { phone: USER_PHONE }
        });

        if (!user) {
            console.log(`   ❌ User not found with phone: ${USER_PHONE}`);
            console.log(`   💡 Update USER_PHONE in this script or create user first`);
            return;
        }

        console.log(`   ✅ Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

        // 2. Create test complaint
        console.log('\n2️⃣  Creating test complaint...');

        const testComplaints = [
            {
                title: 'রাস্তায় গর্ত',
                description: 'আমাদের এলাকার রাস্তায় বড় গর্ত হয়েছে। দয়া করে দ্রুত মেরামত করুন।',
                category: 'ROAD',
                subcategory: 'POTHOLE',
                priority: 'HIGH',
                status: 'PENDING',
                location: JSON.stringify({
                    address: 'মিরপুর ১০, ঢাকা',
                    district: 'Dhaka',
                    thana: 'Mirpur',
                    ward: '10'
                })
            },
            {
                title: 'ময়লা জমে আছে',
                description: 'আমাদের বাসার সামনে অনেকদিন ধরে ময়লা জমে আছে। দুর্গন্ধ হচ্ছে।',
                category: 'WASTE',
                subcategory: 'GARBAGE_NOT_COLLECTED',
                priority: 'MEDIUM',
                status: 'IN_PROGRESS',
                location: JSON.stringify({
                    address: 'ধানমন্ডি ৫, ঢাকা',
                    district: 'Dhaka',
                    thana: 'Dhanmondi',
                    ward: '5'
                })
            },
            {
                title: 'স্ট্রিট লাইট নষ্ট',
                description: 'আমাদের এলাকার স্ট্রিট লাইট কাজ করছে না। রাতে অন্ধকার হয়ে যায়।',
                category: 'ELECTRICITY',
                subcategory: 'STREET_LIGHT',
                priority: 'HIGH',
                status: 'PENDING',
                location: JSON.stringify({
                    address: 'গুলশান ২, ঢাকা',
                    district: 'Dhaka',
                    thana: 'Gulshan',
                    ward: '2'
                })
            }
        ];

        const createdComplaints = [];

        for (const complaintData of testComplaints) {
            const complaint = await prisma.complaint.create({
                data: {
                    ...complaintData,
                    userId: user.id
                }
            });
            createdComplaints.push(complaint);
            console.log(`   ✅ Created: #${complaint.id} - ${complaint.title}`);
        }

        // 3. Summary
        console.log('\n' + '='.repeat(50));
        console.log('✅ Success!\n');
        console.log(`   Created ${createdComplaints.length} test complaints for:`);
        console.log(`   User: ${user.firstName} ${user.lastName}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`\n   Complaint IDs: ${createdComplaints.map(c => `#${c.id}`).join(', ')}`);

        console.log('\n📱 Now test in mobile app:');
        console.log('   1. Login with this user');
        console.log('   2. Go to complaint list');
        console.log('   3. Pull to refresh');
        console.log('   4. You should see the complaints!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'P2002') {
            console.log('   💡 Duplicate entry - complaint might already exist');
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
createTestComplaint().catch(console.error);
