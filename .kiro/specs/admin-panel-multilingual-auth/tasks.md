# Implementation Plan

- [x] 1. Set up authentication infrastructure



  - Create AuthContext with user state management, login/logout methods, and authentication status tracking
  - Implement AuthService with login, logout, refreshToken, and getProfile API methods
  - Configure axios interceptors for automatic token refresh on 401 errors
  - Add httpOnly cookie support with credentials: true in axios configuration
  - _Requirements: 1.1, 1.2, 1.3, 9.1, 9.2, 9.3_



- [ ] 2. Create Login page with authentication
  - Build Login page component with email and password input fields
  - Implement form validation and error message display
  - Add loading state during authentication process
  - Connect login form to AuthContext.login() method



  - Implement redirect to dashboard on successful login
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.4_

- [ ] 3. Implement protected routing system
  - Create ProtectedRoute component that checks authentication status


  - Add loading spinner while checking authentication
  - Implement redirect to /login for unauthenticated users
  - Update App.tsx to wrap all admin routes with ProtectedRoute
  - Store original destination for post-login redirect
  - _Requirements: 2.4, 9.4_



- [ ] 4. Build AdminNavbar component
  - Create AdminNavbar component with Material-UI AppBar
  - Display logged-in user's name and avatar in top-right corner
  - Add navigation links for Dashboard, Complaints, Users, Reports, Settings
  - Implement active route highlighting based on current location


  - Add logout button that calls AuthContext.logout()
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1_

- [ ] 5. Make AdminNavbar responsive
  - Implement hamburger menu for mobile screens (< 768px)
  - Create mobile drawer with navigation items



  - Add responsive layout adjustments for tablet and desktop
  - Test navbar on different screen sizes
  - _Requirements: 4.1, 4.2_

- [x] 6. Set up multilingual infrastructure



  - Create LanguageContext with language state and translation methods
  - Implement TranslationService with Google Translate API integration
  - Add translation caching using Map data structure
  - Implement localStorage persistence for language preference

  - Add clearCache method for language switching
  - _Requirements: 5.3, 5.4, 6.2, 6.3, 6.4_

- [ ] 7. Create TranslatedText component
  - Build TranslatedText component that uses LanguageContext
  - Implement useEffect hook to translate text when language changes
  - Add fallback to original text while translation is loading

  - Support custom component prop for different HTML elements


  - Pass through additional props to underlying component
  - _Requirements: 6.1, 6.3_

- [x] 8. Add language selector to AdminNavbar

  - Create language selector dropdown with English and Bangla options
  - Display visual indicator (checkmark) for currently selected language
  - Connect selector to LanguageContext.setLanguage() method
  - Show language labels in native script (English, বাংলা)
  - _Requirements: 5.1, 5.2, 5.5_


- [ ] 9. Integrate multilingual support in Login page
  - Add language selector to Login page before authentication
  - Replace all static text with TranslatedText components
  - Translate form labels, buttons, and error messages
  - Ensure language selection persists to authenticated session
  - Test translation updates within 2 seconds

  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10. Update Dashboard page with authentication and multilingual support
  - Add AdminNavbar to Dashboard page
  - Display welcome message with admin's name using user state
  - Replace all static text with TranslatedText components

  - Add key metrics cards (total users, complaints, etc.)
  - Implement quick action buttons with translated labels
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 6.1_

- [ ] 11. Integrate multilingual support in All Complaints page
  - Add AdminNavbar to All Complaints page

  - Replace all static text (headings, labels, buttons) with TranslatedText
  - Ensure table headers and filter labels are translated
  - Test language switching updates all visible text
  - _Requirements: 6.1, 7.1, 7.4_

- [x] 12. Integrate multilingual support in User Management page

  - Add AdminNavbar to User Management page
  - Replace all static text with TranslatedText components
  - Translate table headers, action buttons, and form labels
  - Ensure role-based UI elements respect permissions
  - _Requirements: 6.1, 7.1, 7.4_

- [x] 13. Integrate multilingual support in Reports page

  - Add AdminNavbar to Reports page
  - Replace all static text with TranslatedText components
  - Translate chart labels and report titles
  - Ensure date formats respect language preference
  - _Requirements: 6.1, 7.1, 7.4_


- [ ] 14. Integrate multilingual support in Settings page
  - Add AdminNavbar to Settings page
  - Replace all static text with TranslatedText components
  - Translate settings labels and descriptions
  - Add language preference setting in Settings page
  - _Requirements: 6.1, 7.1, 7.4_


- [ ] 15. Integrate multilingual support in Notifications page
  - Add AdminNavbar to Notifications page
  - Replace all static text with TranslatedText components
  - Translate notification titles and action buttons
  - Keep notification content in original language (user-generated)
  - _Requirements: 6.1, 7.1, 7.2_

- [ ] 16. Implement logout functionality
  - Connect logout button in AdminNavbar to AuthContext.logout()
  - Call AuthService.logout() to invalidate backend token
  - Clear user state from AuthContext
  - Redirect to /login page after logout
  - Preserve language preference in localStorage after logout
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 17. Add dynamic navbar features
  - Implement active route highlighting in navigation menu
  - Update displayed account name when profile is modified
  - Add role-based navigation item visibility
  - Test navbar updates without page reload
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 18. Implement translation performance optimizations
  - Add batch translation for common UI texts on app load
  - Implement debouncing for rapid language switches
  - Preload translations for critical UI elements
  - Monitor and log cache hit rate for optimization
  - _Requirements: 6.4, 6.5_

- [ ] 19. Add error handling and fallbacks
  - Implement error handling for failed login attempts
  - Add fallback to English text when translation fails
  - Handle token expiration with automatic refresh
  - Display user-friendly error messages for network issues
  - _Requirements: 1.4, 6.3, 9.4_

- [x] 20. Configure environment variables and API keys

  - Add VITE_GOOGLE_TRANSLATE_API_KEY to .env file
  - Update .env.example with all required variables
  - Configure Google Cloud Translation API with key restrictions
  - Set up CORS configuration in backend for admin panel
  - _Requirements: 9.1, 9.2_

- [x] 21. Write integration tests for authentication flow

  - Test complete login flow from form submission to dashboard redirect
  - Test protected route redirects for unauthenticated users
  - Test logout clears session and redirects to login
  - Test token refresh on expiration
  - _Requirements: 1.1, 1.2, 1.3, 2.4, 10.2_


- [ ] 22. Write integration tests for multilingual system
  - Test language switching updates all visible text
  - Test language preference persists across page reloads
  - Test translation caching reduces API calls
  - Test fallback to English when translation fails
  - _Requirements: 5.2, 5.4, 6.4, 6.5, 7.5_



- [ ] 23. Perform end-to-end testing
  - Test complete user journey: login → navigate pages → switch language → logout
  - Test responsive navbar on mobile, tablet, and desktop
  - Test all pages display correctly in both English and Bangla
  - Verify performance with translation caching
  - _Requirements: 4.1, 4.2, 7.1, 7.3_
