# Manual Offline Mode Test Guide

## Purpose
This guide provides step-by-step instructions to manually verify that the offline mode displays cached complaint data correctly.

## Prerequisites
- Flutter app installed on a physical device or emulator
- User account with at least 2-3 existing complaints
- Ability to toggle device network connectivity

## Test Scenarios

### Scenario 1: Initial Load with Internet Connection
**Expected Behavior**: App loads fresh data from API and caches it

1. Ensure device has active internet connection (WiFi or mobile data)
2. Open the Clean Care app
3. Login with valid credentials
4. Navigate to "My Complaints" page
5. **Verify**: Complaints load from the server
6. **Verify**: No offline banner is displayed
7. **Verify**: Complaint list displays correctly with all details

### Scenario 2: Load Cached Data When Offline
**Expected Behavior**: App displays cached data when no internet connection

1. Complete Scenario 1 first (to ensure data is cached)
2. Close the app completely
3. **Turn OFF all network connections** (WiFi and mobile data)
4. Open the Clean Care app
5. Login (if session is still valid) or use cached session
6. Navigate to "My Complaints" page
7. **Verify**: Orange offline banner appears at the top
8. **Verify**: Banner shows "You are offline" message
9. **Verify**: Banner shows "Last updated: Xm/Xh/Xd ago"
10. **Verify**: Cached complaints are displayed in the list
11. **Verify**: All complaint details are visible (ID, title, location, status, time)
12. **Verify**: Status badges show correct colors
13. **Verify**: No loading spinner appears (data loads instantly from cache)

### Scenario 3: Automatic Refresh When Coming Back Online
**Expected Behavior**: App automatically fetches fresh data when connection is restored

1. Start with app open on "My Complaints" page in offline mode (Scenario 2)
2. **Verify**: Offline banner is visible
3. **Turn ON network connection** (WiFi or mobile data)
4. Wait 2-3 seconds
5. **Verify**: Offline banner disappears
6. **Verify**: "Updating..." indicator appears briefly at the top
7. **Verify**: Complaint list refreshes with latest data from server
8. **Verify**: Last sync time is updated

### Scenario 4: Pull-to-Refresh While Offline
**Expected Behavior**: Pull-to-refresh shows cached data when offline

1. Open "My Complaints" page while offline
2. **Verify**: Offline banner is visible
3. Pull down on the complaint list to trigger refresh
4. **Verify**: Refresh animation plays
5. **Verify**: Cached data is displayed (no new data fetched)
6. **Verify**: Offline banner remains visible
7. **Verify**: No error message is shown

### Scenario 5: Pull-to-Refresh While Online
**Expected Behavior**: Pull-to-refresh fetches fresh data from server

1. Open "My Complaints" page while online
2. **Verify**: No offline banner is visible
3. Pull down on the complaint list to trigger refresh
4. **Verify**: "Updating..." indicator appears
5. **Verify**: Fresh data is fetched from server
6. **Verify**: Complaint list updates with latest data
7. **Verify**: Last sync time is updated

### Scenario 6: Empty Cache on First Load Offline
**Expected Behavior**: App shows appropriate message when no cached data exists

1. Clear app data/cache (or fresh install)
2. **Turn OFF all network connections**
3. Open the app and login
4. Navigate to "My Complaints" page
5. **Verify**: Offline banner appears
6. **Verify**: Error message or empty state is shown
7. **Verify**: No crash or unexpected behavior

### Scenario 7: View Complaint Details While Offline
**Expected Behavior**: Cached complaint details are accessible offline

1. Open "My Complaints" page while offline with cached data
2. **Verify**: Offline banner is visible
3. Tap on any complaint card
4. **Verify**: Complaint detail page opens
5. **Verify**: All complaint information is displayed correctly
6. **Verify**: Images are visible (if cached)
7. **Verify**: Audio player is visible (if cached)
8. Navigate back to complaint list
9. **Verify**: Offline banner still visible

### Scenario 8: Last Sync Time Accuracy
**Expected Behavior**: Last sync time displays accurate time elapsed

1. Load complaints while online (note the current time)
2. Wait 5 minutes
3. Turn OFF network connection
4. Open "My Complaints" page
5. **Verify**: Offline banner shows "Last updated: 5m ago" (approximately)
6. Wait 1 hour
7. Refresh the page
8. **Verify**: Banner shows "Last updated: 1h ago" (approximately)

## Test Results Checklist

- [ ] Scenario 1: Initial load with internet - PASSED
- [ ] Scenario 2: Load cached data when offline - PASSED
- [ ] Scenario 3: Automatic refresh when back online - PASSED
- [ ] Scenario 4: Pull-to-refresh while offline - PASSED
- [ ] Scenario 5: Pull-to-refresh while online - PASSED
- [ ] Scenario 6: Empty cache on first load offline - PASSED
- [ ] Scenario 7: View complaint details while offline - PASSED
- [ ] Scenario 8: Last sync time accuracy - PASSED

## Known Limitations

1. **Platform-specific tests**: Unit tests for Hive require platform-specific setup and may fail in standard test environment
2. **Image/Audio caching**: Currently only complaint metadata is cached, not media files
3. **Complaint submission**: Cannot submit new complaints while offline (future enhancement)

## Code Verification

The following components have been implemented:

✅ **OfflineCacheService** (`lib/services/offline_cache_service.dart`)
- Caches complaint list as JSON
- Stores last sync timestamp
- Provides cache retrieval methods

✅ **ConnectivityService** (`lib/services/connectivity_service.dart`)
- Monitors network connectivity in real-time
- Provides connectivity status stream
- Detects online/offline transitions

✅ **ComplaintProvider** (`lib/providers/complaint_provider.dart`)
- Integrates offline services
- Loads from cache when offline
- Auto-refreshes when connection restored
- Exposes offline status and last sync time

✅ **ComplaintListPage** (`lib/pages/complaint_list_page.dart`)
- Displays offline indicator banner
- Shows last sync time
- Handles offline state gracefully
- Provides pull-to-refresh functionality

## Conclusion

The offline mode implementation is complete and ready for manual testing. All code components are in place and follow the design specifications. The functionality allows users to view cached complaints when offline and automatically syncs when connection is restored.
