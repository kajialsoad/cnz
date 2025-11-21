# Implementation Plan: Dynamic City Corporation Management System

- [x] 1. Database Schema and Migration





  - Create CityCorpora tion table with code, name, minWard, maxWard, status fields
  - Create Thana table with name, cityCorpora tionId, status fields
  - Add cityCorpora tionCode field to User table as foreign key
  - Add thanaId field to User table as foreign key
  - Create database indexes on cityCorpora tionCode, ward, thanaId in User table
  - Create unique constraint on CityCorpora tion.code
  - Create unique constraint on Thana (name, cityCorpora tionId)
  - Write migration script to populate DSCC and DNCC data
  - Write migration script to migrate existing user zone data to cityCorpora tionCode
  - Run database migration
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_





- [x] 2. Backend - City Corporation Service





  - [x] 2.1 Create city-corporation.service.ts


    - Implement getCityCorpora tions() method with status filter
    - Implement getCityCorpora tionByCode() method
    - Implement createCityCorpora tion() method with validation
    - Implement updateCityCorpora tion() method
    - Implement getCityCorpora tionStats() method (totalUsers, totalComplaints, activeThanas)


    - Implement validateWard() method to check ward range
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [x] 2.2 Create city-corporation.controller.ts


    - Implement GET /api/admin/city-corporations endpoint
    - Implement GET /api/admin/city-corporations/:code endpoint
    - Implement POST /api/admin/city-corporations endpoint


    - Implement PUT /api/admin/city-corporations/:code endpoint
    - Implement GET /api/admin/city-corporations/:code/statistics endpoint
    - Add SUPER_ADMIN authorization middleware
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.8_

  - [x] 2.3 Create public city corporation endpoints


    - Implement GET /api/city-corporations/active endpoint (no auth required)
    - Implement GET /api/city-corporations/:code/thanas endpoint (no auth required)
    - _Requirements: 12.1, 12.3_

- [x] 3. Backend - Thana Service





  - [x] 3.1 Create thana.service.ts


    - Implement getThanasByCityCorpora tion() method with status filter
    - Implement getThanaById() method
    - Implement createThana() method with validation
    - Implement updateThana() method
    - Implement getThanaStats() method (totalUsers, totalComplaints)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_



  - [x] 3.2 Create thana.controller.ts








    - Implement GET /api/admin/thanas endpoint with cityCorpora tionCode query param
    - Implement GET /api/admin/thanas/:id endpoint
    - Implement POST /api/admin/thanas endpoint
    - Implement PUT /api/admin/thanas/:id endpoint
    - Implement GET /api/admin/thanas/:id/statistics endpoint
    - Add SUPER_ADMIN authorization middleware
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8_


- [x] 4. Backend - Enhanced Auth Service



  - [x] 4.1 Update auth.service.ts register method

    - Add cityCorpora tionCode validation (check if exists and active)
    - Add ward validation (check if within city corporation's range)
    - Add thanaId validation (check if belongs to selected city corporation)
    - Update user creation to include cityCorpora tionCode and thanaId
    - Add error messages for invalid city corporation, ward, or thana
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 12.4, 12.5, 12.6_

- [x] 5. Backend - Enhanced User Management Service







  - [x] 5.1 Update admin.user.service.ts





    - Add cityCorpora tionCode filter to getUsers() method
    - Add ward filter to getUsers() method
    - Add thanaId filter to getUsers() method
    - Update getUserStatistics() to accept cityCorpora tionCode filter
    - Include cityCorpora tion and thana data in user responses
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 13.1, 13.2, 13.3, 13.4, 13.5_



  - [-] 5.2 Update admin.user.controller.ts








    - Add cityCorpora tionCode query parameter to GET /api/admin/users
    - Add ward query parameter to GET /api/admin/users
    - Add thanaId query parameter to GET /api/admin/users
    - Add cityCorpora tionCode query parameter to GET /api/admin/users/statistics
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 13.1, 13.2, 13.3_

- [x] 6. Backend - Enhanced Complaint Service





  - [x] 6.1 Update complaint.service.ts





    - Auto-fetch user's cityCorpora tion when creating complaint
    - Include user's cityCorpora tion and thana in complaint response
    - _Requirements: 3.1, 3.2, 14.1, 14.2_

  - [x] 6.2 Update admin-complaint.service.ts





    - Add cityCorpora tionCode filter to getAdminComplaints() method (filter through user relationship)
    - Add ward filter to getAdminComplaints() method
    - Add thanaId filter to getAdminComplaints() method
    - Update complaint statistics to accept cityCorpora tionCode filter
    - Include user's cityCorpora tion and thana in complaint details
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 14.2, 14.3, 14.4_

  - [x] 6.3 Update admin.complaint.controller.ts





    - Add cityCorpora tionCode query parameter to GET /api/admin/complaints
    - Add ward query parameter to GET /api/admin/complaints
    - Add thanaId query parameter to GET /api/admin/complaints
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 14.3_

- [x] 7. Backend - Enhanced Chat Service




  - [x] 7.1 Update chat.service.ts


    - Add cityCorpora tionCode filter to getChatConversations() method
    - Add thanaId filter to getChatConversations() method
    - Include user's cityCorpora tion and thana in chat list responses
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 7.2 Update admin.chat.controller.ts


    - Add cityCorpora tionCode query parameter to GET /api/admin/chats
    - Add thanaId query parameter to GET /api/admin/chats
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. Frontend - City Corporation Management Page





  - [x] 8.1 Create CityCorpora tionManagement.tsx page


    - Create page layout with city corporation list and thana management sections
    - Display list of all city corporations with status badges
    - Show statistics for each city corporation (users, complaints, thanas)
    - Add "Add City Corporation" button
    - _Requirements: 10.1, 10.8_

  - [x] 8.2 Create CityCorpora tionForm modal component


    - Create form with fields: code, name, minWard, maxWard
    - Add validation for required fields
    - Add validation for unique code
    - Add validation for ward range (min < max, both > 0)
    - Handle create and update operations
    - _Requirements: 10.2, 10.3_

  - [x] 8.3 Create ThanaManagement component


    - Display thanas for selected city corporation
    - Show statistics for each thana (users, complaints)
    - Add "Add Thana" button
    - Add edit and activate/deactivate actions
    - _Requirements: 11.1, 11.8_

  - [x] 8.4 Create ThanaForm modal component


    - Create form with fields: name, status
    - Add validation for required fields
    - Add validation for unique name within city corporation
    - Handle create and update operations
    - _Requirements: 11.2, 11.3, 11.4_

  - [x] 8.5 Create cityCorpora tionService.ts


    - Implement getCityCorpora tions() API call
    - Implement getCityCorpora tionByCode() API call
    - Implement createCityCorpora tion() API call
    - Implement updateCityCorpora tion() API call
    - Implement getCityCorpora tionStats() API call
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.8_

  - [x] 8.6 Create thanaService.ts


    - Implement getThanasByCityCorpora tion() API call
    - Implement createThana() API call
    - Implement updateThana() API call
    - Implement getThanaStats() API call
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.8_

- [x] 9. Frontend - Enhanced User Management Page





  - [x] 9.1 Update UserManagement.tsx with city corporation filter


    - Add city corporation dropdown filter (fetch from API)
    - Update ward dropdown to show range based on selected city corporation
    - Add thana dropdown filter (fetch based on selected city corporation)
    - Update fetchUsers() to include city corporation, ward, and thana filters
    - Update statistics to reflect filtered data
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 13.1, 13.2, 13.3, 13.4, 13.5_


  - [x] 9.2 Update user table to display city corporation

    - Add city corporation column to user table
    - Display city corporation name instead of code
    - Update location column to show: City Corporation, Ward, Thana
    - _Requirements: 2.6, 13.4_

- [x] 10. Frontend - Enhanced Complaint Management Page





  - [x] 10.1 Update AllComplaints.tsx with city corporation filter


    - Add city corporation dropdown filter
    - Update ward dropdown based on selected city corporation
    - Add thana dropdown filter
    - Update fetchComplaints() to include filters
    - Update statistics to reflect filtered data
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 14.3, 14.4_

  - [x] 10.2 Update ComplaintDetailsModal to show city corporation


    - Display complainant's city corporation name
    - Display complainant's ward and thana
    - _Requirements: 4.5, 14.2_

- [x] 11. Frontend - Enhanced Chat Page




  - [x] 11.1 Update AdminChatPage.tsx with city corporation filter


    - Add city corporation dropdown filter
    - Add thana dropdown filter (based on selected city corporation)
    - Update fetchChats() to include filters
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

  - [x] 11.2 Update ChatListItem to show city corporation


    - Display user's city corporation and thana in chat list
    - _Requirements: 5.4_

- [x] 12. Frontend - Enhanced Dashboard




  - [x] 12.1 Update Dashboard with city corporation filter

    - Add city corporation dropdown filter at top of dashboard
    - Update all statistics cards to reflect filtered data
    - Add comparison view showing stats across all city corporations
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 13. Mobile App - Enhanced Signup Page




  - [x] 13.1 Update signup_page.dart with dynamic city corporation


    - Replace hardcoded DSCC/DNCC with dynamic city corporation dropdown
    - Fetch active city corporations from API on page load
    - Update ward dropdown to use selected city corporation's ward range
    - Add thana dropdown that fetches thanas for selected city corporation
    - Update form validation to use city corporation's ward range
    - Update registration API call to include cityCorpora tionCode and thanaId
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.2, 9.3, 9.4, 9.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 13.2 Create city_corporation_model.dart


    - Define CityCorpora tion model with fromJson and toJson methods
    - _Requirements: 12.1_

  - [x] 13.3 Create thana_model.dart


    - Define Thana model with fromJson and toJson methods
    - _Requirements: 12.3_

  - [x] 13.4 Update auth_repository.dart


    - Add getActiveCityCorpora tions() method
    - Add getThanasByCityCorpora tion() method
    - Update register() method to accept cityCorpora tionCode and thanaId
    - _Requirements: 12.1, 12.3, 12.6_

- [x] 14. Testing and Validation





  - [x] 14.1 Test city corporation management



    - Test creating new city corporation
    - Test updating city corporation ward range
    - Test activating/deactivating city corporation
    - Test city corporation statistics
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.8_

  - [x] 14.2 Test thana management


    - Test creating thana for city corporation
    - Test updating thana
    - Test activating/deactivating thana
    - Test thana statistics
    - Test unique name constraint within city corporation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8_

  - [x] 14.3 Test user signup with city corporation


    - Test signup with valid city corporation and ward
    - Test signup with invalid ward (outside range)
    - Test signup with invalid thana (doesn't belong to city corporation)
    - Test signup with inactive city corporation (should fail)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.4, 12.5_

  - [x] 14.4 Test user management filtering


    - Test filtering users by city corporation
    - Test filtering users by ward
    - Test filtering users by thana
    - Test combined filters (city corporation + ward + thana)
    - Test statistics update with filters
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 13.1, 13.2, 13.3_

  - [x] 14.5 Test complaint filtering


    - Test filtering complaints by city corporation
    - Test filtering complaints by ward
    - Test filtering complaints by thana
    - Test complaint auto-association with user's city corporation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 14.1, 14.2, 14.3_

  - [x] 14.6 Test chat filtering


    - Test filtering chats by city corporation
    - Test filtering chats by thana
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 15. Documentation and Deployment
  - [ ] 15.1 Update API documentation
    - Document city corporation management endpoints
    - Document thana management endpoints
    - Document enhanced user/complaint/chat endpoints with new filters
    - Add examples for all new endpoints
    - _Requirements: 10.1, 10.2, 10.3, 11.1, 11.2, 11.3_

  - [ ] 15.2 Create admin user guide
    - Document how to add new city corporation
    - Document how to add thanas for city corporation
    - Document how to configure ward ranges
    - Document how to use filters in user/complaint/chat management
    - _Requirements: 10.1, 10.2, 10.3, 11.1, 11.2, 11.3_

  - [ ] 15.3 Create deployment checklist
    - Run database migration in production
    - Verify DSCC and DNCC data migration
    - Deploy backend API changes
    - Deploy admin panel changes
    - Deploy mobile app update
    - Verify all endpoints work in production
    - Monitor for errors
    - _Requirements: All_

- [x] 16. Final Checkpoint





  - Ensure all tests pass
  - Verify city corporation management works end-to-end
  - Verify user signup with dynamic city corporation works
  - Verify all filters work correctly in admin panels
  - Ask user if any issues arise
