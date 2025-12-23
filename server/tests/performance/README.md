# Performance Tests

This directory contains performance tests for the Clean Care application.

---

## 📋 Available Tests

### Complaint Status Enhancement Performance Tests
**File**: `complaint-status-enhancement.performance.test.ts`

Tests performance of:
- Image upload (resolution documentation)
- Notification delivery
- Analytics queries (Others, Reviews)
- Review submission
- API response times

**Run**:
```bash
npm run test:performance
```

---

## 🎯 Performance Thresholds

| Feature | Target | Critical |
|---------|--------|----------|
| Image Upload (3 images) | < 5s | < 8s |
| Notification Delivery | < 2s | < 3s |
| Analytics Queries | < 3s | < 5s |
| API Operations | < 1s | < 2s |
| Data Retrieval | < 500ms | < 1s |

---

## 🚀 Quick Start

### Prerequisites
1. Server running on `http://localhost:4000`
2. Test credentials configured in `.env`:
   ```
   TEST_ADMIN_PHONE=+8801700000000
   TEST_ADMIN_PASSWORD=Test@123
   ```
3. Database with test data

### Run Tests
```bash
# Run all performance tests
npm run test:performance

# Or run directly
npx ts-node tests/performance/complaint-status-enhancement.performance.test.ts
```

---

## 📊 Test Output

Tests provide detailed metrics:
- **Average**: Mean response time
- **Min**: Best case performance
- **Max**: Worst case performance
- **Median**: 50th percentile
- **P95**: 95th percentile (critical for SLA)

Example output:
```
📊 COMPLAINT STATUS ENHANCEMENT - PERFORMANCE TEST SUMMARY

Test                          Avg       Min       Max       P95       Threshold   Status
----------------------------------------------------------------------------------
Image Upload (3 images)       3245ms    2890ms    3678ms    3567ms    5000ms      ✅ PASS
Notification Delivery         1234ms    1100ms    1456ms    1398ms    2000ms      ✅ PASS
Others Analytics              2345ms    2100ms    2678ms    2589ms    3000ms      ✅ PASS
```

---

## 🔧 Configuration

### Environment Variables
```bash
APP_URL=http://localhost:4000
TEST_ADMIN_PHONE=+8801700000000
TEST_ADMIN_PASSWORD=Test@123
```

### Test Iterations
Default: 10 iterations per test

Modify in test file:
```typescript
const TEST_ITERATIONS = 10;
```

### Thresholds
Modify in test file:
```typescript
const THRESHOLDS = {
  imageUpload: 5000,
  notificationDelivery: 2000,
  // ...
};
```

---

## 📚 Documentation

For detailed documentation, see:
- **Full Guide**: `.kiro/specs/admin-complaint-status-enhancement/PERFORMANCE_TESTING_GUIDE.md`
- **Quick Reference**: `.kiro/specs/admin-complaint-status-enhancement/PERFORMANCE_TESTING_QUICK_REFERENCE.md`

---

## 🐛 Troubleshooting

### Tests Failing
1. Ensure server is running
2. Check test credentials
3. Verify database has test data
4. Check network connectivity

### Slow Performance
1. Check server resources (CPU, memory)
2. Verify database indexes
3. Check Cloudinary quota
4. Monitor network latency

---

## 💡 Best Practices

1. **Run Regularly**: Include in CI/CD pipeline
2. **Monitor Trends**: Track performance over time
3. **Set Baselines**: Establish performance baselines
4. **Optimize Proactively**: Address slow tests early
5. **Document Changes**: Note performance impacts of changes

---

## 🔄 Adding New Tests

To add a new performance test:

1. Create test method:
```typescript
async testNewFeature(): Promise<void> {
  console.log('🧪 Testing new feature...');
  
  const result = await this.measureTime(
    'New Feature',
    async () => {
      // Your test code here
    },
    THRESHOLD_MS
  );
  
  this.results.newFeature = result;
  this.printResult(result);
}
```

2. Add to `runAll()`:
```typescript
await this.testNewFeature();
```

3. Add threshold:
```typescript
const THRESHOLDS = {
  // ...
  newFeature: 1000,
};
```

---

## 📈 Monitoring

### Production Monitoring
- Use New Relic / Datadog for real-time monitoring
- Set up alerts for threshold violations
- Track P95 latency continuously
- Monitor error rates

### Key Metrics
- Response times (P50, P95, P99)
- Throughput (requests/second)
- Error rates
- Cache hit rates

---

**Last Updated**: December 21, 2024  
**Maintained By**: Development Team
