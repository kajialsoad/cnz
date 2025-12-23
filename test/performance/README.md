# Mobile App Performance Tests

This directory contains performance tests for the Clean Care mobile application.

---

## 📋 Available Tests

### Complaint Status Enhancement Performance Tests
**File**: `complaint_status_enhancement_performance_test.dart`

Tests performance of:
- Widget rendering (ResolutionDetailsCard, StatusTimeline, ReviewModal)
- Frame render times (scrolling performance)
- UI responsiveness

**Run**:
```bash
flutter test test/performance/complaint_status_enhancement_performance_test.dart
```

---

## 🎯 Performance Thresholds

| Feature | Target | Critical |
|---------|--------|----------|
| Widget Render Time | < 100ms | < 200ms |
| Frame Render Time | < 17ms (60fps) | < 33ms (30fps) |
| Notification Loading | < 2s | < 3s |
| Review Submission | < 2s | < 3s |
| Image Loading | < 2s | < 4s |

---

## 🚀 Quick Start

### Prerequisites
1. Flutter SDK installed
2. Dependencies installed: `flutter pub get`
3. Test environment configured

### Run Tests
```bash
# Run all performance tests
flutter test test/performance/complaint_status_enhancement_performance_test.dart

# Run with verbose output
flutter test test/performance/complaint_status_enhancement_performance_test.dart --verbose
```

---

## 📊 Test Output

Tests provide detailed metrics:
- **Average**: Mean render/execution time
- **Min**: Best case performance
- **Max**: Worst case performance
- **Median**: 50th percentile
- **P95**: 95th percentile

Example output:
```
📊 MOBILE APP PERFORMANCE TEST SUMMARY

Test                               Avg       Min       Max       P95       Threshold   Status
----------------------------------------------------------------------------------
Resolution Details Card Render     45.2      38.1      67.3      62.1      100ms       ✅ PASS
Status Timeline Render             52.8      44.2      78.9      73.4      100ms       ✅ PASS
Review Modal Render                38.6      32.1      56.7      52.3      100ms       ✅ PASS
Frame Render Time (Scrolling)      12.3      9.8       18.7      17.2      17ms        ✅ PASS
```

---

## 🔧 Configuration

### Test Iterations
Default: 10 iterations per test

Modify in test file:
```dart
const kTestIterations = 10;
```

### Thresholds
Modify in test file:
```dart
const kPerformanceThresholds = {
  'resolutionDetailsRender': 100,
  'frameRenderTime': 17,
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
1. Ensure Flutter SDK is up to date
2. Run `flutter pub get`
3. Clear build cache: `flutter clean`
4. Check for widget errors

### Slow Performance
1. Run in profile mode: `flutter run --profile`
2. Use Flutter DevTools for profiling
3. Check for unnecessary rebuilds
4. Verify const constructors are used

---

## 💡 Optimization Tips

### Widget Performance
```dart
// Use const constructors
const MyWidget(key: key);

// Use RepaintBoundary
RepaintBoundary(
  child: ComplexWidget(),
);

// Use ListView.builder
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(items[index]),
);
```

### Image Performance
```dart
// Use CachedNetworkImage
CachedNetworkImage(
  imageUrl: url,
  placeholder: (context, url) => CircularProgressIndicator(),
  maxWidth: 1200,
);

// Lazy load images
Image.network(
  url,
  loadingBuilder: (context, child, loadingProgress) {
    if (loadingProgress == null) return child;
    return CircularProgressIndicator();
  },
);
```

### State Management
```dart
// Minimize rebuilds
class MyProvider extends ChangeNotifier {
  void updateData(newData) {
    if (_data != newData) {
      _data = newData;
      notifyListeners();
    }
  }
}
```

---

## 🔄 Adding New Tests

To add a new performance test:

1. Create test function:
```dart
testWidgets('New Feature Performance', (WidgetTester tester) async {
  final result = await measureWidgetBuildTime(
    name: 'New Feature',
    widget: NewFeatureWidget(),
    iterations: 10,
    threshold: 100,
  );
  
  expect(result.passed, true);
});
```

2. Add threshold:
```dart
const kPerformanceThresholds = {
  // ...
  'newFeature': 100,
};
```

---

## 📈 Profiling

### Flutter DevTools
```bash
# Start app in profile mode
flutter run --profile

# Open DevTools
flutter pub global activate devtools
flutter pub global run devtools
```

### Performance Overlay
```dart
// Enable in app
MaterialApp(
  showPerformanceOverlay: true,
  // ...
);
```

### Timeline Profiling
```bash
# Record timeline
flutter run --profile --trace-startup

# Analyze
flutter analyze --watch
```

---

## 📊 Monitoring

### Key Metrics
- **Frame Rate**: Target 60fps (16.67ms per frame)
- **Memory Usage**: Peak and average
- **Network Requests**: Count and duration
- **UI Jank**: Frames dropped

### Tools
- **Firebase Performance**: Real-time monitoring
- **Sentry**: Error and performance tracking
- **Flutter DevTools**: Development profiling
- **Custom Analytics**: Track specific flows

---

## 🎯 Performance Goals

### Frame Rate
- **Target**: 60fps (16.67ms per frame)
- **Acceptable**: 30fps (33ms per frame)
- **Critical**: No drops below 30fps

### Widget Rendering
- **Target**: < 100ms
- **Acceptable**: < 200ms
- **Critical**: < 500ms

### Network Operations
- **Target**: < 2s
- **Acceptable**: < 3s
- **Critical**: < 5s

---

## 🔍 Best Practices

1. **Profile Regularly**: Use DevTools during development
2. **Test on Real Devices**: Emulators don't reflect real performance
3. **Monitor Frame Rate**: Keep 60fps target
4. **Optimize Images**: Compress and cache images
5. **Minimize Rebuilds**: Use const and keys appropriately
6. **Lazy Load**: Load data and widgets on demand
7. **Cache Data**: Reduce network requests

---

## 📝 Notes

### Test Limitations
- Some tests require service mocking (marked as skipped)
- Frame rate tests are approximate
- Performance varies by device

### Future Improvements
- Add service mocking for network tests
- Add memory leak detection
- Add battery usage tests
- Add startup time tests

---

**Last Updated**: December 21, 2024  
**Maintained By**: Development Team
