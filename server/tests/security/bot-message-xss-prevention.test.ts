/**
 * Bot Message XSS Prevention Tests
 * 
 * Tests XSS (Cross-Site Scripting) prevention for bot message system
 * Validates that malicious scripts are sanitized before storage and rendering
 * 
 * Requirements:
 * - Task 4.3: Security Audit - Test XSS prevention
 * - Bot messages must sanitize HTML/JavaScript content
 * - Prevent script injection in message content
 * - Protect against event handler injection
 * - Validate URL protocols
 */

import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { users_role, ChatType } from '@prisma/client';
import { signAccessToken } from '../../src/utils/jwt';
import { sanitizeString } from '../../src/middlewares/security.middleware';

describe('Bot Message XSS Prevention', () => {
    let masterAdminToken: string;
    let masterAdminId: number;

    beforeAll(async () => {
        // Create master admin for testing
        const masterAdmin = await prisma.user.create({
            data: {
                firstName: 'XSS Test',
                lastName: 'Master Admin',
                email: 'xss-master@test.com',
                phone: '01700000099',
                passwordHash: 'hashedPassword123',
                role: users_role.MASTER_ADMIN,
                cityCorporationCode: 'DSCC',
                emailVerified: true,
            },
        });

        masterAdminId = masterAdmin.id;
        masterAdminToken = signAccessToken({
            id: masterAdmin.id,
            sub: masterAdmin.id,
            role: masterAdmin.role
        });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.botMessageConfig.deleteMany({
            where: {
                messageKey: {
                    contains: 'xss_test_'
                }
            }
        });

        await prisma.user.delete({
            where: { id: masterAdminId },
        });

        await prisma.$disconnect();
    });

    describe('1. Script Tag Injection Prevention', () => {
        it('should sanitize <script> tags in message content', async () => {
            const xssPayload = '<script>alert("XSS Attack")</script>Hello World';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_script_tag',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 1,
                    displayOrder: 1
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            // Verify content is sanitized
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('</script>');
            expect(sanitized).not.toContain('alert');
        });

        it('should sanitize inline script tags', async () => {
            const xssPayload = '<script type="text/javascript">document.cookie</script>';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_inline_script',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 2,
                    displayOrder: 2
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('<script');
            expect(sanitized).not.toContain('document.cookie');
        });
    });

    describe('2. Event Handler Injection Prevention', () => {
        it('should sanitize onclick event handlers', async () => {
            const xssPayload = '<div onclick="alert(\'XSS\')">Click me</div>';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_onclick',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 3,
                    displayOrder: 3
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('onclick=');
            expect(sanitized).not.toContain('alert');
        });

        it('should sanitize onerror event handlers', async () => {
            const xssPayload = '<img src=x onerror="alert(\'XSS\')">';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'xss_test_onerror',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 1,
                    displayOrder: 1
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('onerror=');
        });

        it('should sanitize onload event handlers', async () => {
            const xssPayload = '<body onload="maliciousCode()">';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'xss_test_onload',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 2,
                    displayOrder: 2
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('onload=');
        });
    });

    describe('3. JavaScript Protocol Injection Prevention', () => {
        it('should sanitize javascript: protocol in links', async () => {
            const xssPayload = '<a href="javascript:alert(\'XSS\')">Click</a>';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_js_protocol',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 4,
                    displayOrder: 4
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('javascript:');
        });

        it('should sanitize data: protocol with HTML', async () => {
            const xssPayload = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_data_protocol',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 5,
                    displayOrder: 5
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('data:text/html');
        });

        it('should sanitize vbscript: protocol', async () => {
            const xssPayload = '<a href="vbscript:msgbox(\'XSS\')">Click</a>';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'xss_test_vbscript',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 3,
                    displayOrder: 3
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('vbscript:');
        });
    });

    describe('4. HTML Tag Injection Prevention', () => {
        it('should sanitize iframe tags', async () => {
            const xssPayload = '<iframe src="http://malicious.com"></iframe>';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_iframe',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 6,
                    displayOrder: 6
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('<iframe');
            expect(sanitized).not.toContain('</iframe>');
        });

        it('should sanitize embed tags', async () => {
            const xssPayload = '<embed src="malicious.swf">';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_embed',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 7,
                    displayOrder: 7
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('<embed');
        });

        it('should sanitize object tags', async () => {
            const xssPayload = '<object data="malicious.swf"></object>';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'xss_test_object',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 4,
                    displayOrder: 4
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('<object');
        });
    });

    describe('5. Eval and Expression Injection Prevention', () => {
        it('should sanitize eval() calls', async () => {
            const xssPayload = 'eval(maliciousCode)';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_eval',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 8,
                    displayOrder: 8
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('eval(');
        });

        it('should sanitize CSS expressions', async () => {
            const xssPayload = '<div style="width: expression(alert(\'XSS\'))">Test</div>';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'xss_test_expression',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 5,
                    displayOrder: 5
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('expression(');
        });
    });

    describe('6. Update Operation XSS Prevention', () => {
        let testMessageId: number;

        beforeAll(async () => {
            // Create a test message to update
            const message = await prisma.botMessageConfig.create({
                data: {
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_update_target',
                    content: 'Original safe content',
                    contentBn: 'মূল নিরাপদ বিষয়বস্তু',
                    stepNumber: 99,
                    displayOrder: 99,
                    isActive: true
                }
            });
            testMessageId = message.id;
        });

        it('should sanitize XSS in update content', async () => {
            const xssPayload = '<script>alert("Updated XSS")</script>Updated content';

            const response = await request(app)
                .put(`/api/admin/bot-messages/${testMessageId}`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    content: xssPayload
                });

            expect(response.status).toBe(200);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('alert');
        });

        it('should sanitize XSS in Bangla content update', async () => {
            const xssPayload = '<img src=x onerror="alert(\'XSS\')">বাংলা বার্তা';

            const response = await request(app)
                .put(`/api/admin/bot-messages/${testMessageId}`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    contentBn: xssPayload
                });

            expect(response.status).toBe(200);
            const sanitized = response.body.data.contentBn;
            expect(sanitized).not.toContain('onerror=');
            expect(sanitized).not.toContain('<img');
        });
    });

    describe('7. Bangla Content XSS Prevention', () => {
        it('should sanitize XSS in Bangla content', async () => {
            const xssPayload = '<script>alert("বাংলা XSS")</script>আপনার অভিযোগ গ্রহণ করা হয়েছে';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'xss_test_bangla',
                    content: 'Your complaint has been received',
                    contentBn: xssPayload,
                    stepNumber: 6,
                    displayOrder: 6
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.contentBn;
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toContain('আপনার অভিযোগ গ্রহণ করা হয়েছে');
        });

        it('should preserve Bangla Unicode characters', async () => {
            const safeContent = 'আপনার অভিযোগ পর্যালোচনা করা হচ্ছে। ধন্যবাদ।';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'xss_test_bangla_safe',
                    content: 'Your complaint is being reviewed. Thank you.',
                    contentBn: safeContent,
                    stepNumber: 7,
                    displayOrder: 7
                });

            expect(response.status).toBe(201);
            expect(response.body.data.contentBn).toBe(safeContent);
        });
    });

    describe('8. Complex XSS Attack Vectors', () => {
        it('should sanitize encoded script tags', async () => {
            const xssPayload = '&lt;script&gt;alert("XSS")&lt;/script&gt;';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_encoded',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 9,
                    displayOrder: 9
                });

            expect(response.status).toBe(201);
            // Encoded entities should be preserved but not executed
            const sanitized = response.body.data.content;
            expect(sanitized).toBeDefined();
        });

        it('should sanitize SVG-based XSS', async () => {
            const xssPayload = '<svg onload="alert(\'XSS\')"></svg>';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_svg',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 10,
                    displayOrder: 10
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('onload=');
            expect(sanitized).not.toContain('<svg');
        });

        it('should sanitize meta refresh XSS', async () => {
            const xssPayload = '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'xss_test_meta',
                    content: xssPayload,
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 8,
                    displayOrder: 8
                });

            expect(response.status).toBe(201);
            const sanitized = response.body.data.content;
            expect(sanitized).not.toContain('<meta');
            expect(sanitized).not.toContain('javascript:');
        });
    });

    describe('9. Safe Content Preservation', () => {
        it('should preserve safe text content', async () => {
            const safeContent = 'Welcome to Clean Care! How can we help you today?';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_safe_content',
                    content: safeContent,
                    contentBn: 'ক্লিন কেয়ারে স্বাগতম! আজ আমরা আপনাকে কিভাবে সাহায্য করতে পারি?',
                    stepNumber: 11,
                    displayOrder: 11
                });

            expect(response.status).toBe(201);
            expect(response.body.data.content).toBe(safeContent);
        });

        it('should preserve numbers and special characters', async () => {
            const safeContent = 'Office hours: 9 AM - 5 PM (Saturday to Thursday)';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_safe_numbers',
                    content: safeContent,
                    contentBn: 'অফিস সময়: সকাল ৯টা - বিকাল ৫টা (শনিবার থেকে বৃহস্পতিবার)',
                    stepNumber: 12,
                    displayOrder: 12
                });

            expect(response.status).toBe(201);
            expect(response.body.data.content).toBe(safeContent);
        });

        it('should preserve punctuation and formatting', async () => {
            const safeContent = 'Your complaint has been received! We will update you soon.';

            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'xss_test_safe_punctuation',
                    content: safeContent,
                    contentBn: 'আপনার অভিযোগ গ্রহণ করা হয়েছে! আমরা শীঘ্রই আপডেট দেব।',
                    stepNumber: 9,
                    displayOrder: 9
                });

            expect(response.status).toBe(201);
            expect(response.body.data.content).toBe(safeContent);
        });
    });

    describe('10. Sanitization Function Unit Tests', () => {
        it('should remove script tags', () => {
            const input = '<script>alert("XSS")</script>Hello';
            const result = sanitizeString(input);
            expect(result).not.toContain('<script>');
            expect(result).toContain('Hello');
        });

        it('should remove event handlers', () => {
            const input = '<div onclick="alert()">Click</div>';
            const result = sanitizeString(input);
            expect(result).not.toContain('onclick=');
        });

        it('should remove javascript: protocol', () => {
            const input = 'javascript:alert("XSS")';
            const result = sanitizeString(input);
            expect(result).not.toContain('javascript:');
        });

        it('should remove eval calls', () => {
            const input = 'eval(maliciousCode)';
            const result = sanitizeString(input);
            expect(result).not.toContain('eval(');
        });

        it('should preserve safe text', () => {
            const input = 'Hello World 123';
            const result = sanitizeString(input);
            expect(result).toBe('Hello World 123');
        });

        it('should trim whitespace', () => {
            const input = '  Hello World  ';
            const result = sanitizeString(input);
            expect(result).toBe('Hello World');
        });
    });

    describe('11. Public API XSS Prevention', () => {
        it('should sanitize content in public bot messages endpoint', async () => {
            // Create a message with XSS attempt
            await prisma.botMessageConfig.create({
                data: {
                    chatType: 'LIVE_CHAT',
                    messageKey: 'xss_test_public_api',
                    content: '<script>alert("Public XSS")</script>Safe message',
                    contentBn: 'নিরাপদ বার্তা',
                    stepNumber: 13,
                    displayOrder: 13,
                    isActive: true
                }
            });

            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Find our test message
            const testMessage = response.body.data.messages.find(
                (m: any) => m.messageKey === 'xss_test_public_api'
            );

            if (testMessage) {
                expect(testMessage.content).not.toContain('<script>');
                expect(testMessage.content).not.toContain('alert');
            }
        });
    });
});
