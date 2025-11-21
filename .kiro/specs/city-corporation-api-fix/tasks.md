# Implementation Plan

- [x] 1. Fix public city corporation API response formats




  - [ ] 1.1 Update `/api/city-corporations/active` endpoint to return `cityCorporations` field
    - Modify the response in `server/src/routes/public-city-corporation.routes.ts`
    - Change `data: publicData` to `cityCorporations: publicData`
    - Ensure `success: true` is included in response


    - _Requirements: 1.1, 3.1, 3.3, 3.5_
  
  - [ ] 1.2 Update `/api/city-corporations/:code/thanas` endpoint to return `thanas` field
    - Modify the response in `server/src/routes/public-city-corporation.routes.ts`


    - Change `data: activeThanas` to `thanas: activeThanas`
    - Ensure `success: true` is included in response
    - _Requirements: 1.2, 3.1, 3.3, 3.5_
  
  - [ ] 1.3 Verify error responses include proper format
    - Check that all error responses include `success: false`
    - Check that all error responses include `message` field
    - Ensure appropriate HTTP status codes are used
    - _Requirements: 1.4, 3.2, 4.2, 4.3_

- [ ] 2. Test mobile app integration
  - [ ] 2.1 Test signup page loads city corporations
    - Start the backend server
    - Open mobile app signup page
    - Verify city corporation dropdown populates correctly
    - Verify no console errors
    - _Requirements: 1.1_
  
  - [ ] 2.2 Test thana loading for selected city corporation
    - Select a city corporation in signup page
    - Verify thanas load correctly for that city corporation
    - Verify no console errors
    - _Requirements: 1.2_
  
  - [ ] 2.3 Test error handling
    - Simulate network error
    - Verify error message displays correctly
    - Verify app doesn't crash
    - _Requirements: 1.4, 4.3_

- [ ] 3. Verify admin panel still works
  - [ ] 3.1 Test admin city corporation management page
    - Login to admin panel
    - Navigate to city corporation management
    - Verify city corporations load correctly
    - Verify no console errors
    - _Requirements: 2.1_





  
  - [ ] 3.2 Test admin dashboard city corporation filters
    - Navigate to admin dashboard
    - Verify city corporation filter dropdown works

    - Verify data loads correctly when filtering
    - _Requirements: 2.1_

- [ ] 4. Add unit tests for response formats
  - [x] 4.1 Write unit test for public active city corporations endpoint

    - Test that response contains `cityCorporations` field
    - Test that response contains `success: true`
    - Test that array items have correct structure
    - _Requirements: 1.1, 3.1, 3.3_
  
  - [ ] 4.2 Write unit test for public thanas endpoint
    - Test that response contains `thanas` field
    - Test that response contains `success: true`
    - Test that array items have correct structure
    - _Requirements: 1.2, 3.1, 3.3_
  
  - [ ] 4.3 Write unit test for error responses
    - Test that error responses contain `success: false`
    - Test that error responses contain `message` field
    - Test appropriate HTTP status codes
    - _Requirements: 1.4, 3.2, 4.2_

- [ ] 5. Final verification checkpoint
  - Ensure all tests pass
  - Verify mobile app signup works end-to-end
  - Verify admin panel city corporation features work
  - Ask the user if questions arise
