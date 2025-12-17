import { PrismaClient } from '@prisma/client';
import { ComplaintService } from '../src/services/complaint.service';
import { ComplaintStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const complaintService = new ComplaintService();
const LOG_FILE = path.join(__dirname, 'verification_log.txt');

function log(message: string) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
}

async function verifyComplaintAssignment() {
    fs.writeFileSync(LOG_FILE, 'Starting verification...\n');
    log('Starting verification of complaint assignment logic...');

    try {
        // 1. Setup: Create a Mock Ward and Admin if they don't exist
        // We'll use a high number to avoid conflict with real data
        const TEST_WARD_NUMBER = 999;
        const TEST_WARD_ID = 999123;
        const TEST_ZONE_ID = 999123;
        const TEST_CC_CODE = 'TEST_CC';

        log('Setting up test data...');

        // Create/Ensure City Corporation
        const cc = await prisma.cityCorporation.upsert({
            where: { code: TEST_CC_CODE },
            update: {},
            create: {
                code: TEST_CC_CODE,
                name: 'Test City Corp',
                minWard: 1,
                maxWard: 100,
                // nameBangla removed
            }
        });

        // Create/Ensure Zone
        const zone = await prisma.zone.upsert({
            where: { id: TEST_ZONE_ID },
            update: {},
            create: {
                id: TEST_ZONE_ID,
                name: 'Test Zone',
                zoneNumber: 99,
                number: 99,
                cityCorporationId: cc.id // Use ID from created CC
            }
        });

        // Create/Ensure Ward
        await prisma.ward.upsert({
            where: { id: TEST_WARD_ID },
            update: {},
            create: {
                id: TEST_WARD_ID,
                wardNumber: TEST_WARD_NUMBER,
                number: TEST_WARD_NUMBER,
                // name removed
                zoneId: zone.id,
                cityCorporationId: cc.id,
                // geoJson removed
            }
        });

        // Create/Ensure Admin User assigned to this Ward
        const adminEmail = 'testwardadmin@example.com';
        const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
        let adminId = existingAdmin?.id;

        if (!existingAdmin) {
            log('Creating test admin user...');
            const randomPhone = '017' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            const admin = await prisma.user.create({
                data: {
                    email: adminEmail,
                    passwordHash: 'hash',
                    phone: randomPhone,
                    firstName: 'Test',
                    lastName: 'Admin',
                    role: 'ADMIN' as any,
                    status: 'ACTIVE',
                    wardId: TEST_WARD_ID,
                    zoneId: TEST_ZONE_ID,
                    cityCorporationCode: TEST_CC_CODE,
                    designation: 'Test Ward Officer'
                }
            });
            adminId = admin.id;
        } else {
            console.log('Test admin user already exists.');
            // Ensure admin has correct properties for test
            await prisma.user.update({
                where: { id: adminId },
                data: {
                    wardId: TEST_WARD_ID,
                    role: 'ADMIN' // ensure role is ADMIN
                }
            });
        }

        // 2. Test Execution: Create a Complaint for this Ward
        // We provide `wardId` but NO specific location string (to test auto-generation)
        // We also provide a dummy userId

        // Create dummy user for submitting complaint
        const userEmail = 'testuser@example.com';
        let subUserId: number;
        const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!existingUser) {
            const randomPhoneUser = '018' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            const u = await prisma.user.create({
                data: {
                    email: userEmail,
                    passwordHash: 'hash',
                    phone: randomPhoneUser,
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'CUSTOMER' as any,
                    status: 'ACTIVE',
                }
            });
            subUserId = u.id;
        } else {
            subUserId = existingUser.id;
        }

        // Create ward if not exists (redundant but safe)
        // ...

        log('Creating test complaint...');
        const complaintInput = {
            description: 'Test complaint for assignment verification',
            category: 'waste_management', // Valid category from service
            subcategory: 'garbage_pile',
            location: {
                address: 'Test Address Line 1',
                district: 'Dhaka',
                thana: 'Ramna',
                ward: '' // Intentionally empty to see if it picks up from wardId
            },
            wardId: TEST_WARD_ID, // This is key
            userId: subUserId
        };

        // Need to bypass validateCategorySubcategory for this test or mock it, 
        // but complaint.service uses a real categoryService. 
        // Let's hope 'waste_management' and 'garbage_pile' are valid or we catch error.
        // Instead of risking validation error, let's insert directly via prisma first OR try/catch service.
        // Ideally we test the Service logic. Let's try to find a valid category/subcategory pair first?
        // Or we just assume the user has valid data. 
        // Let's assume 'others' / 'others' might exist, or 'waste_management'.
        // To be safe, let's try to fetch a valid one or just create one if we could.
        // But modifying service is easier if we just mock the validation? No, can't easily mock in this script without DI.
        // Let's try to run it. If it fails on category, we'll see.
        // Actually, looking at code: `categoryService.validateCategorySubcategory`
        // Let's fallback to 'other' which usually has no subcats or easy ones?

        // Let's assume 'other' category exists.

        const result = await complaintService.createComplaint({
            ...complaintInput as any,
            category: 'other',
            subcategory: 'general' // Valid subcategory for 'other' category
        });

        log('Complaint created: ' + result.id);

        // 3. Verification
        const createdComplaint = await prisma.complaint.findUnique({
            where: { id: result.id },
            include: { assignedAdmin: true }
        });

        if (!createdComplaint) throw new Error('Complaint was not created in DB');

        log('--- Verification Results ---');

        // Check 1: Location String
        const expectedLocationPart = `Ward ${TEST_WARD_NUMBER} `;
        if (createdComplaint.location.includes(expectedLocationPart)) {
            log(`✅ Location string verification parsed: "${createdComplaint.location}" contains "${expectedLocationPart}"`);
        } else {
            log(`❌ Location string verification FAILED: "${createdComplaint.location}" DOES NOT contain "${expectedLocationPart}"`);
        }

        // Check 2: Assigned Admin
        if (createdComplaint.assignedAdminId === adminId) {
            log(`✅ Admin assignment verification PASSED.Assigned ID: ${createdComplaint.assignedAdminId} `);
            log(`   Admin Name: ${createdComplaint.assignedAdmin?.firstName} ${createdComplaint.assignedAdmin?.lastName} `);
        } else {
            log(`❌ Admin assignment verification FAILED.expected ${adminId}, got ${createdComplaint.assignedAdminId} `);
        }

    } catch (error: any) {
        log('Verification failed with error: ' + (error.stack || error.message || error));
    } finally {
        await prisma.$disconnect();
    }
}

verifyComplaintAssignment();

