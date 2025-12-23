/**
 * Performance Tests for Complaint Status Enhancement Feature
 * 
 * Tests performance of:
 * - Image upload (resolution documentation)
 * - Notification delivery
 * - Analytics queries (Others complaints, Reviews)
 * - Review submission
 * 
 * Performance Requirements:
 * - Image upload < 5 seconds
 * - Notification delivery < 2 seconds
 * - Analytics load < 3 seconds
 */

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

const API_URL = process.env.APP_URL || 'http://localhost:4000';
const TEST_ITERATIONS = 10;

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
    imageUpload: 5000,           // 5 seconds
    notificationDelivery: 2000,  // 2 seconds
    othersAnalytics: 3000,       // 3 seconds
    reviewAnalytics: 3000,       // 3 seconds
    reviewSubmission: 2000,      // 2 seconds
    markAsOthers: 1000,          // 1 second
    statusUpdate: 1000,          // 1 second (without images)
    getNotifications: 500,       // 500ms
    getReviews: 500,             // 500ms
};

interface PerformanceResult {
    name: string;
    avg: number | null;
    min: number | null;
    max: number | null;
    median: number | null;
    p95: number | null;
    success: boolean;
    iterations: number;
    threshold?: number;
}

class ComplaintStatusPerformanceTester {
    private client: AxiosInstance;
    private token: string | null = null;
    private results: Record<string, PerformanceResult> = {};
    private testComplaintId: number | null = null;
    private testUserId: number | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            timeout: 30000,
        });
    }

    /**
     * Measure execution time of an async function
     */
    private async measureTime(
        name: string,
        fn: () => Promise<void>,
        threshold?: number
    ): Promise<PerformanceResult> {
        const times: number[] = [];

        for (let i = 0; i < TEST_ITERATIONS; i++) {
            const start = performance.now();
            try {
                await fn();
                const end = performance.now();
                times.push(end - start);
            } catch (error: any) {
                console.error(`  ❌ Error in iteration ${i + 1}:`, error.message);
                times.push(NaN);
            }
        }

        // Filter out NaN values (errors)
        const validTimes = times.filter(t => !isNaN(t));

        if (validTimes.length === 0) {
            return {
                name,
                avg: null,
                min: null,
                max: null,
                median: null,
                p95: null,
                success: false,
                iterations: 0,
                threshold,
            };
        }

        const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const min = Math.min(...validTimes);
        const max = Math.max(...validTimes);
        const sorted = [...validTimes].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const p95Index = Math.floor(sorted.length * 0.95);
        const p95 = sorted[p95Index];

        return {
            name,
            avg: Math.round(avg),
            min: Math.round(min),
            max: Math.round(max),
            median: Math.round(median),
            p95: Math.round(p95),
            success: true,
            iterations: validTimes.length,
            threshold,
        };
    }

    /**
     * Setup: Login and get test data
     */
    async setup(): Promise<void> {
        console.log('🔧 Setting up performance tests...\n');

        // Login
        console.log('  🔐 Logging in...');
        const loginResponse = await this.client.post('/api/auth/login', {
            phone: process.env.TEST_ADMIN_PHONE || '+8801700000000',
            password: process.env.TEST_ADMIN_PASSWORD || 'Test@123',
        });

        this.token = loginResponse.data.data.accessToken;
        this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

        // Get a test complaint
        console.log('  📝 Getting test complaint...');
        const complaintsResponse = await this.client.get('/api/admin/complaints', {
            params: { page: 1, limit: 1, status: 'PENDING' },
        });

        if (complaintsResponse.data.data.complaints.length > 0) {
            this.testComplaintId = complaintsResponse.data.data.complaints[0].id;
            this.testUserId = complaintsResponse.data.data.complaints[0].userId;
        }

        console.log(`  ✅ Setup complete (Complaint ID: ${this.testComplaintId})\n`);
    }

    /**
     * Test 1: Mark complaint as Others performance
     */
    async testMarkAsOthers(): Promise<void> {
        if (!this.testComplaintId) {
            console.log('⏭️  Skipping mark as Others test (no test complaint)\n');
            return;
        }

        console.log('🏷️  Testing mark as Others performance...');

        const result = await this.measureTime(
            'Mark as Others',
            async () => {
                await this.client.patch(
                    `/api/admin/complaints/${this.testComplaintId}/mark-others`,
                    {
                        othersCategory: 'CORPORATION_INTERNAL',
                        othersSubcategory: 'Engineering',
                        note: 'Performance test',
                    }
                );
            },
            THRESHOLDS.markAsOthers
        );

        this.results.markAsOthers = result;
        this.printResult(result);
    }

    /**
     * Test 2: Status update without images performance
     */
    async testStatusUpdate(): Promise<void> {
        if (!this.testComplaintId) {
            console.log('⏭️  Skipping status update test (no test complaint)\n');
            return;
        }

        console.log('🔄 Testing status update performance...');

        const result = await this.measureTime(
            'Status Update (no images)',
            async () => {
                const formData = new FormData();
                formData.append('status', 'IN_PROGRESS');
                formData.append('resolutionNote', 'Performance test note');

                await this.client.patch(
                    `/api/admin/complaints/${this.testComplaintId}/status`,
                    formData,
                    {
                        headers: formData.getHeaders(),
                    }
                );
            },
            THRESHOLDS.statusUpdate
        );

        this.results.statusUpdate = result;
        this.printResult(result);
    }

    /**
     * Test 3: Image upload performance (resolution documentation)
     */
    async testImageUpload(): Promise<void> {
        if (!this.testComplaintId) {
            console.log('⏭️  Skipping image upload test (no test complaint)\n');
            return;
        }

        console.log('📸 Testing image upload performance...');

        // Create a test image file (1MB)
        const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
        const testImageExists = fs.existsSync(testImagePath);

        if (!testImageExists) {
            console.log('  ⚠️  Test image not found, creating dummy file...');
            // Create a dummy file for testing
            const dummyData = Buffer.alloc(1024 * 1024); // 1MB
            fs.writeFileSync(testImagePath, dummyData);
        }

        const result = await this.measureTime(
            'Image Upload (3 images)',
            async () => {
                const formData = new FormData();
                formData.append('status', 'RESOLVED');
                formData.append('resolutionNote', 'Performance test with images');

                // Upload 3 images
                for (let i = 0; i < 3; i++) {
                    formData.append('resolutionImages', fs.createReadStream(testImagePath));
                }

                await this.client.patch(
                    `/api/admin/complaints/${this.testComplaintId}/status`,
                    formData,
                    {
                        headers: formData.getHeaders(),
                        timeout: 30000,
                    }
                );
            },
            THRESHOLDS.imageUpload
        );

        this.results.imageUpload = result;
        this.printResult(result);

        // Cleanup
        if (!testImageExists && fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
    }

    /**
     * Test 4: Notification delivery performance
     */
    async testNotificationDelivery(): Promise<void> {
        if (!this.testComplaintId) {
            console.log('⏭️  Skipping notification delivery test (no test complaint)\n');
            return;
        }

        console.log('🔔 Testing notification delivery performance...');

        const result = await this.measureTime(
            'Notification Delivery',
            async () => {
                // Trigger notification by updating status
                const formData = new FormData();
                formData.append('status', 'IN_PROGRESS');
                formData.append('resolutionNote', 'Notification test');

                await this.client.patch(
                    `/api/admin/complaints/${this.testComplaintId}/status`,
                    formData,
                    {
                        headers: formData.getHeaders(),
                    }
                );

                // Immediately check if notification was created
                await this.client.get('/api/notifications', {
                    params: { page: 1, limit: 1 },
                });
            },
            THRESHOLDS.notificationDelivery
        );

        this.results.notificationDelivery = result;
        this.printResult(result);
    }

    /**
     * Test 5: Get notifications performance
     */
    async testGetNotifications(): Promise<void> {
        console.log('📬 Testing get notifications performance...');

        const result = await this.measureTime(
            'Get Notifications',
            async () => {
                await this.client.get('/api/notifications', {
                    params: { page: 1, limit: 20 },
                });
            },
            THRESHOLDS.getNotifications
        );

        this.results.getNotifications = result;
        this.printResult(result);
    }

    /**
     * Test 6: Others analytics performance
     */
    async testOthersAnalytics(): Promise<void> {
        console.log('📊 Testing Others analytics performance...');

        const result = await this.measureTime(
            'Others Analytics',
            async () => {
                await this.client.get('/api/admin/complaints/analytics/others', {
                    params: {
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        endDate: new Date().toISOString(),
                    },
                });
            },
            THRESHOLDS.othersAnalytics
        );

        this.results.othersAnalytics = result;
        this.printResult(result);
    }

    /**
     * Test 7: Review analytics performance
     */
    async testReviewAnalytics(): Promise<void> {
        console.log('⭐ Testing review analytics performance...');

        const result = await this.measureTime(
            'Review Analytics',
            async () => {
                await this.client.get('/api/admin/complaints/analytics/reviews', {
                    params: {
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        endDate: new Date().toISOString(),
                    },
                });
            },
            THRESHOLDS.reviewAnalytics
        );

        this.results.reviewAnalytics = result;
        this.printResult(result);
    }

    /**
     * Test 8: Review submission performance
     */
    async testReviewSubmission(): Promise<void> {
        if (!this.testComplaintId) {
            console.log('⏭️  Skipping review submission test (no test complaint)\n');
            return;
        }

        console.log('✍️  Testing review submission performance...');

        const result = await this.measureTime(
            'Review Submission',
            async () => {
                try {
                    await this.client.post(`/api/complaints/${this.testComplaintId}/review`, {
                        rating: 5,
                        comment: 'Performance test review',
                    });
                } catch (error: any) {
                    // Ignore duplicate review errors
                    if (error.response?.status !== 409) {
                        throw error;
                    }
                }
            },
            THRESHOLDS.reviewSubmission
        );

        this.results.reviewSubmission = result;
        this.printResult(result);
    }

    /**
     * Test 9: Get reviews performance
     */
    async testGetReviews(): Promise<void> {
        if (!this.testComplaintId) {
            console.log('⏭️  Skipping get reviews test (no test complaint)\n');
            return;
        }

        console.log('📖 Testing get reviews performance...');

        const result = await this.measureTime(
            'Get Reviews',
            async () => {
                await this.client.get(`/api/complaints/${this.testComplaintId}/reviews`);
            },
            THRESHOLDS.getReviews
        );

        this.results.getReviews = result;
        this.printResult(result);
    }

    /**
     * Print individual result
     */
    private printResult(result: PerformanceResult): void {
        if (!result.success) {
            console.log(`  ❌ ${result.name}: FAILED\n`);
            return;
        }

        const status = result.threshold && result.avg! > result.threshold ? '⚠️  SLOW' : '✅ PASS';
        console.log(`  ${status} ${result.name}:`);
        console.log(`     Avg: ${result.avg}ms | Min: ${result.min}ms | Max: ${result.max}ms | P95: ${result.p95}ms`);

        if (result.threshold) {
            const percentage = Math.round((result.avg! / result.threshold) * 100);
            console.log(`     Threshold: ${result.threshold}ms (${percentage}% of threshold)`);
        }
        console.log('');
    }

    /**
     * Print summary report
     */
    printSummary(): void {
        console.log('\n' + '='.repeat(90));
        console.log('📊 COMPLAINT STATUS ENHANCEMENT - PERFORMANCE TEST SUMMARY');
        console.log('='.repeat(90) + '\n');

        console.log(`Test Iterations: ${TEST_ITERATIONS}`);
        console.log(`API URL: ${API_URL}\n`);

        console.log('Results:');
        console.log('-'.repeat(90));
        console.log(
            'Test'.padEnd(30) +
            'Avg'.padEnd(10) +
            'Min'.padEnd(10) +
            'Max'.padEnd(10) +
            'P95'.padEnd(10) +
            'Threshold'.padEnd(12) +
            'Status'
        );
        console.log('-'.repeat(90));

        Object.values(this.results).forEach((result) => {
            if (!result.success) {
                console.log(`${result.name.padEnd(30)}FAILED`);
                return;
            }

            const status = result.threshold && result.avg! > result.threshold ? '⚠️  SLOW' : '✅ PASS';
            const thresholdStr = result.threshold ? `${result.threshold}ms` : 'N/A';

            console.log(
                `${result.name.padEnd(30)}` +
                `${result.avg}ms`.padEnd(10) +
                `${result.min}ms`.padEnd(10) +
                `${result.max}ms`.padEnd(10) +
                `${result.p95}ms`.padEnd(10) +
                thresholdStr.padEnd(12) +
                status
            );
        });

        console.log('-'.repeat(90) + '\n');

        // Check if any tests exceeded thresholds
        const slowTests = Object.values(this.results).filter(
            (result) => result.threshold && result.success && result.avg! > result.threshold
        );

        const failedTests = Object.values(this.results).filter((result) => !result.success);

        if (failedTests.length > 0) {
            console.log('❌ FAILED TESTS:');
            failedTests.forEach((result) => {
                console.log(`  - ${result.name}`);
            });
            console.log('');
        }

        if (slowTests.length > 0) {
            console.log('⚠️  SLOW TESTS (exceeded thresholds):');
            slowTests.forEach((result) => {
                const percentage = Math.round((result.avg! / result.threshold!) * 100);
                console.log(`  - ${result.name}: ${result.avg}ms (${percentage}% of ${result.threshold}ms threshold)`);
            });
            console.log('');
        }

        if (slowTests.length === 0 && failedTests.length === 0) {
            console.log('✅ All tests passed and met performance thresholds!\n');
        }

        // Performance recommendations
        console.log('💡 Performance Optimization Tips:');
        console.log('  - Enable Redis caching for analytics queries');
        console.log('  - Use Cloudinary auto-optimization for images');
        console.log('  - Implement database query result caching');
        console.log('  - Add indexes on frequently queried fields');
        console.log('  - Consider CDN for image delivery');
        console.log('  - Monitor P95 latency in production');
        console.log('');
    }

    /**
     * Run all performance tests
     */
    async runAll(): Promise<void> {
        try {
            console.log('🚀 Starting Complaint Status Enhancement Performance Tests...\n');
            console.log(`Testing against: ${API_URL}`);
            console.log(`Iterations per test: ${TEST_ITERATIONS}\n`);

            await this.setup();

            // Run all tests
            await this.testMarkAsOthers();
            await this.testStatusUpdate();
            await this.testImageUpload();
            await this.testNotificationDelivery();
            await this.testGetNotifications();
            await this.testOthersAnalytics();
            await this.testReviewAnalytics();
            await this.testReviewSubmission();
            await this.testGetReviews();

            this.printSummary();

            console.log('✨ Performance testing completed!\n');

            // Exit with error code if any tests failed or were slow
            const hasFailures = Object.values(this.results).some((r) => !r.success);
            const hasSlow = Object.values(this.results).some(
                (r) => r.threshold && r.success && r.avg! > r.threshold
            );

            if (hasFailures || hasSlow) {
                process.exit(1);
            }
        } catch (error: any) {
            console.error('\n❌ Performance testing failed:', error.message);
            if (error.response) {
                console.error('Response:', error.response.data);
            }
            process.exit(1);
        }
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new ComplaintStatusPerformanceTester();
    tester.runAll();
}

export default ComplaintStatusPerformanceTester;
