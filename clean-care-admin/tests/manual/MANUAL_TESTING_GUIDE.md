# Manual Testing Guide - Dynamic Admin Profile System

## Overview
This guide provides comprehensive manual testing procedures for the Dynamic Admin Profile System across different browsers, devices, and user roles.

## Prerequisites
- Admin panel running locally or on staging
- Test accounts for all three roles:
  - ADMIN
  - SUPER_ADMIN
  - MASTER_ADMIN
- Multiple browsers installed
- Access to mobile/tablet devices or browser dev tools

---

## Test Suite 1: Role-Based Profile Display

### Test 1.1: MASTER_ADMIN Role Display
**Steps:**
1. Log in with MASTER_ADMIN credentials
2. Click on profile button in sidebar
3. Verify profile modal opens
4. Check role badge displays "Master Admin"
5. Verify role badge has purple/gold gradient
6. Hover over role badge to see permissions tooltip
7. Verify tooltip shows "Full System Access", "User Management", "System Configuration"

**Expected Results:**
- ✅ Modal opens smoothly
- ✅ Role badge shows "Master Admin" with 👑 icon
- ✅ Purple/gold gradient visible
- ✅ Tooltip displays all permissions
- ✅ All profile information visible

### Test 1.2: SUPER_ADMIN Role Display
**Steps:**
1. Log out and log in with SUPER_ADMIN credentials
2. Click on profile button
3. Verify role badge displays "Super Admin"
4. Check for blue gradient
5. Verify permissions in tooltip

**Expected Results:**
- ✅ Role badge shows "Super Admin" with ⭐ icon
- ✅ Blue gradient visible
- ✅ Correct permissions displayed

### Test 1.3: ADMIN Role Display
**Steps:**
1. Log out and log in with ADMIN credentials
2. Click on profile button
3. Verify role badge displays "Admin"
4. Check for green gradient
5. Verify permissions in tooltip

**Expected Results:**
- ✅ Role badge shows "Admin" with 🛡️ icon
- ✅ Green gradient visible
- ✅ Correct permissions displayed

---

## Test Suite 2: Profile Information Display

### Test 2.1: Complete Profile Information
**Steps:**
1. Log in with any role
2. Open profile modal
3. Verify all fields are displayed:
   - Avatar (or initials if no avatar)
   - First Name
   - Last Name
   - Email
   - Phone
   - Role badge
   - Ward (if applicable)
   - Zone (if applicable)
   - City Corporation
   - Email verification status
   - Phone verification status
   - Last login time

**Expected Results:**
- ✅ All fields visible and properly formatted
- ✅ Verification icons show correct status
- ✅ Dates formatted correctly
- ✅ No missing or undefined values

### Test 2.2: Default Avatar with Initials
**Steps:**
1. Log in with account that has no avatar
2. Open profile modal
3. Verify default avatar shows user's initials

**Expected Results:**
- ✅ Initials displayed (e.g., "JD" for John Doe)
- ✅ Background color consistent
- ✅ Text centered and readable

### Test 2.3: Loading State
**Steps:**
1. Open profile modal
2. Observe loading state (may need to throttle network)
3. Verify skeleton loaders appear

**Expected Results:**
- ✅ Skeleton loaders visible during data fetch
- ✅ Smooth transition to actual data
- ✅ No layout shift

---

## Test Suite 3: Profile Editing

### Test 3.1: Edit First and Last Name
**Steps:**
1. Open profile modal
2. Click "Edit Profile" button
3. Change first name
4. Change last name
5. Click "Save Changes"
6. Verify success message
7. Check that name updates in:
   - Profile modal
   - Sidebar
   - Header

**Expected Results:**
- ✅ Edit mode activates
- ✅ Form fields editable
- ✅ Save button enabled
- ✅ Success toast appears
- ✅ Name updates everywhere immediately

### Test 3.2: Form Validation
**Steps:**
1. Enter edit mode
2. Clear first name field
3. Try to save
4. Verify error message
5. Enter valid name
6. Clear last name
7. Try to save
8. Verify error message

**Expected Results:**
- ✅ Cannot save with empty first name
- ✅ Cannot save with empty last name
- ✅ Error messages clear and helpful
- ✅ Form highlights invalid fields

### Test 3.3: Cancel Edit
**Steps:**
1. Enter edit mode
2. Make changes to name
3. Click "Cancel"
4. Verify changes are not saved
5. Verify modal returns to view mode

**Expected Results:**
- ✅ Changes discarded
- ✅ Original values restored
- ✅ No API call made

---

## Test Suite 4: Avatar Upload

### Test 4.1: Upload via Click
**Steps:**
1. Enter edit mode
2. Click on avatar
3. Select image file (JPG, PNG, or WebP)
4. Verify preview appears
5. Save changes
6. Verify avatar updates

**Expected Results:**
- ✅ File picker opens
- ✅ Preview shows before upload
- ✅ Upload progress indicator visible
- ✅ Avatar updates after save
- ✅ New avatar visible in sidebar and header

### Test 4.2: Upload via Drag and Drop
**Steps:**
1. Enter edit mode
2. Drag image file over avatar area
3. Drop file
4. Verify preview appears
5. Save changes

**Expected Results:**
- ✅ Drag over state visible
- ✅ Drop accepted
- ✅ Preview shows
- ✅ Upload completes successfully

### Test 4.3: File Validation - Invalid Type
**Steps:**
1. Enter edit mode
2. Try to upload PDF or text file
3. Verify error message

**Expected Results:**
- ✅ Upload rejected
- ✅ Error message: "Please select an image file (JPG, PNG, or WebP)"
- ✅ No upload attempted

### Test 4.4: File Validation - Too Large
**Steps:**
1. Enter edit mode
2. Try to upload image > 5MB
3. Verify error message

**Expected Results:**
- ✅ Upload rejected
- ✅ Error message about file size
- ✅ No upload attempted

---

## Test Suite 5: Data Synchronization

### Test 5.1: Sidebar Synchronization
**Steps:**
1. Open profile modal
2. Update name
3. Save changes
4. Close modal
5. Verify sidebar shows updated name

**Expected Results:**
- ✅ Sidebar updates immediately
- ✅ No page refresh needed
- ✅ Avatar updates if changed

### Test 5.2: Header Synchronization
**Steps:**
1. Update profile
2. Check header profile display
3. Verify updates reflected

**Expected Results:**
- ✅ Header shows updated information
- ✅ Synchronization is immediate

### Test 5.3: Cross-Tab Synchronization
**Steps:**
1. Open admin panel in two browser tabs
2. In Tab 1, update profile
3. Switch to Tab 2
4. Verify profile updates automatically

**Expected Results:**
- ✅ Tab 2 receives update
- ✅ Profile data synchronized
- ✅ No manual refresh needed

### Test 5.4: Login Persistence
**Steps:**
1. Update profile
2. Log out
3. Log back in
4. Verify updated information persists

**Expected Results:**
- ✅ Changes saved to database
- ✅ Updated data loads on login
- ✅ No data loss

---

## Test Suite 6: Error Handling

### Test 6.1: Network Error
**Steps:**
1. Open DevTools Network tab
2. Set network to "Offline"
3. Try to update profile
4. Verify error message

**Expected Results:**
- ✅ Error message displayed
- ✅ User informed of network issue
- ✅ Can retry after reconnecting

### Test 6.2: API Error
**Steps:**
1. Update profile with invalid data (if possible)
2. Verify error handling

**Expected Results:**
- ✅ Error message from server displayed
- ✅ Form remains in edit mode
- ✅ User can correct and retry

### Test 6.3: Upload Error
**Steps:**
1. Simulate upload failure
2. Verify error handling

**Expected Results:**
- ✅ Error message displayed
- ✅ Previous avatar retained
- ✅ Can retry upload

---

## Test Suite 7: Responsive Design

### Test 7.1: Mobile (< 640px)
**Steps:**
1. Open DevTools
2. Set viewport to iPhone SE (375px)
3. Open profile modal
4. Verify full-screen modal
5. Test all interactions

**Expected Results:**
- ✅ Modal is full-screen
- ✅ All content visible
- ✅ Touch targets large enough
- ✅ Scrolling works smoothly
- ✅ Edit form usable

### Test 7.2: Tablet (640px - 1024px)
**Steps:**
1. Set viewport to iPad (768px)
2. Open profile modal
3. Verify medium-sized modal
4. Test all interactions

**Expected Results:**
- ✅ Modal appropriately sized
- ✅ Two-column layout where appropriate
- ✅ All features accessible

### Test 7.3: Desktop (> 1024px)
**Steps:**
1. Set viewport to desktop (1920px)
2. Open profile modal
3. Verify desktop layout
4. Test all interactions

**Expected Results:**
- ✅ Modal centered on screen
- ✅ Optimal width maintained
- ✅ All features accessible

### Test 7.4: Orientation Changes
**Steps:**
1. On mobile viewport
2. Rotate to landscape
3. Verify layout adapts
4. Rotate back to portrait

**Expected Results:**
- ✅ Layout adapts smoothly
- ✅ No content cut off
- ✅ Usability maintained

---

## Test Suite 8: Browser Compatibility

### Test 8.1: Chrome/Edge
**Steps:**
1. Open in Chrome
2. Run through all test suites
3. Verify all features work

**Expected Results:**
- ✅ All features functional
- ✅ No console errors
- ✅ Smooth animations

### Test 8.2: Firefox
**Steps:**
1. Open in Firefox
2. Run through all test suites
3. Verify all features work

**Expected Results:**
- ✅ All features functional
- ✅ No console errors
- ✅ Consistent appearance

### Test 8.3: Safari
**Steps:**
1. Open in Safari
2. Run through all test suites
3. Verify all features work

**Expected Results:**
- ✅ All features functional
- ✅ No console errors
- ✅ Consistent appearance

---

## Test Suite 9: Accessibility

### Test 9.1: Keyboard Navigation
**Steps:**
1. Use only keyboard (Tab, Enter, Esc)
2. Navigate to profile button
3. Press Enter to open modal
4. Tab through all elements
5. Press Esc to close

**Expected Results:**
- ✅ All elements reachable via keyboard
- ✅ Focus indicators visible
- ✅ Logical tab order
- ✅ Esc closes modal

### Test 9.2: Screen Reader
**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate profile system
3. Verify all content announced

**Expected Results:**
- ✅ All labels read correctly
- ✅ Role information announced
- ✅ Form fields properly labeled
- ✅ Error messages announced

### Test 9.3: Color Contrast
**Steps:**
1. Use browser accessibility tools
2. Check color contrast ratios
3. Verify WCAG AA compliance

**Expected Results:**
- ✅ All text meets contrast requirements
- ✅ Role badges readable
- ✅ Icons distinguishable

---

## Test Suite 10: Performance

### Test 10.1: Load Time
**Steps:**
1. Open profile modal
2. Measure time to display
3. Should be < 500ms

**Expected Results:**
- ✅ Modal opens quickly
- ✅ Data loads efficiently
- ✅ No lag or stuttering

### Test 10.2: Image Upload Performance
**Steps:**
1. Upload large image (but < 5MB)
2. Verify compression works
3. Check upload time

**Expected Results:**
- ✅ Image compressed before upload
- ✅ Upload completes in reasonable time
- ✅ Progress indicator accurate

---

## Bug Reporting Template

When you find a bug, report it using this template:

```
**Bug Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Test Suite:** [Which test suite]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Environment:**
- Browser: 
- Device: 
- Screen Size: 
- User Role: 

**Screenshots:**
[Attach if applicable]

**Console Errors:**
[Copy any errors from console]
```

---

## Test Completion Checklist

- [ ] All role-based display tests passed
- [ ] All profile information display tests passed
- [ ] All profile editing tests passed
- [ ] All avatar upload tests passed
- [ ] All data synchronization tests passed
- [ ] All error handling tests passed
- [ ] All responsive design tests passed
- [ ] All browser compatibility tests passed
- [ ] All accessibility tests passed
- [ ] All performance tests passed
- [ ] All bugs documented and reported
- [ ] Regression testing completed after bug fixes

---

## Notes for Testers

1. **Test with Real Data:** Use actual admin accounts, not mock data
2. **Test Edge Cases:** Try unusual inputs, long names, special characters
3. **Test Slowly:** Don't rush through tests - observe carefully
4. **Document Everything:** Take screenshots of issues
5. **Test Combinations:** Try different roles on different devices
6. **Clear Cache:** Between tests, clear browser cache if needed
7. **Check Console:** Always have DevTools console open
8. **Network Throttling:** Test with slow 3G to simulate poor connections

---

## Sign-Off

**Tester Name:** ___________________

**Date:** ___________________

**Test Environment:** ___________________

**Overall Result:** Pass / Fail

**Comments:**
___________________
___________________
___________________
