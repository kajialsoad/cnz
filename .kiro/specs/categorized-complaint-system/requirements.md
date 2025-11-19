# Requirements Document - Categorized Complaint System

## Introduction

This document outlines the requirements for implementing backend and admin panel support for the categorized complaint system already implemented in the Clean Care mobile app. The mobile app currently has 8 primary categories with subcategories. Users select a category, then a subcategory, and submit complaints with photos and voice recordings. The backend database and admin panel need to be updated to store, retrieve, and filter complaints by category and subcategory.

## Glossary

- **Mobile App**: The Flutter-based mobile application where categorized complaint submission is already implemented
- **Primary Category**: The main category of complaint - 8 categories total
- **Subcategory**: The specific issue within a primary category
- **Category ID**: The unique identifier for each category (e.g., 'home', 'road_environment')
- **Subcategory ID**: The unique identifier for each subcategory (e.g., 'not_collecting_waste', 'billing_issue')
- **Backend API**: The Node.js/Express server that needs to store category and subcategory fields
- **Admin Panel**: The React-based web application that needs category/subcategory filtering
- **Database Schema**: The Prisma schema that needs category and subcategory fields added to Complaint model

## Complete Category and Subcategory Structure (From Mobile App UI)

### Category 1: বাসা/বাড়ি (Home/House)
- **Category ID**: `home`
- **Color**: Green (#3FA564)
- **Icon**: house.svg
- **Subcategories**:
  1. `not_collecting_waste`: বাসা বাড়ির ময়লা নিচ্ছে না (Not collecting household waste)
  2. `worker_behavior`: ময়লা কর্মীদের ব্যবহার আচরণ (Poor behavior of waste workers)
  3. `billing_issue`: বিল সংক্রান্ত ইস্যু (Billing related issue)

### Category 2: রাস্তা ও পরিবেশ (Road & Environment)
- **Category ID**: `road_environment`
- **Color**: Green (#3FA564)
- **Icon**: road.svg
- **Subcategories**:
  1. `road_waste`: রাস্তার ধারে ময়লা (Waste beside the road)
  2. `water_logging`: রাস্তায় পানি জমে আছে (Water logging on road)
  3. `manhole_issue`: ম্যানহোল ঢাকনা নেই (Missing manhole cover)

### Category 3: ব্যবসা প্রতিষ্ঠান (Business Place)
- **Category ID**: `business`
- **Color**: Yellow (#FFD85B)
- **Icon**: house2.svg
- **Subcategories**:
  1. `not_collecting`: ময়লা নিচ্ছে না (Not collecting waste)
  2. `worker_behavior`: ময়লা কর্মীদের ব্যবহার খারাপ (Poor behavior of waste workers)
  3. `billing_issue`: বিল সংক্রান্ত সমস্যা (Billing related issue)

### Category 4: অফিস (Office)
- **Category ID**: `office`
- **Color**: Blue (#5B9FFF)
- **Icon**: office.svg
- **Subcategories**:
  1. `not_collecting`: ময়লা নিচ্ছে না (Not collecting waste)
  2. `worker_behavior`: ময়লা কর্মীদের ব্যবহার খারাপ (Poor behavior of waste workers)
  3. `billing_issue`: বিল সংক্রান্ত সমস্যা (Billing related issue)

### Category 5: শিক্ষা প্রতিষ্ঠান (Educational Institution)
- **Category ID**: `education`
- **Color**: Purple (#9B59B6)
- **Icon**: graduate.svg
- **Subcategories**:
  1. `not_collecting`: ময়লা নিচ্ছে না (Not collecting waste)
  2. `worker_behavior`: ময়লা কর্মীদের ব্যবহার খারাপ (Poor behavior of waste workers)
  3. `billing_issue`: বিল সংক্রান্ত সমস্যা (Billing related issue)

### Category 6: হাসপাতাল (Hospital)
- **Category ID**: `hospital`
- **Color**: Red (#E74C3C)
- **Icon**: hospital.svg
- **Subcategories**:
  1. `not_collecting`: ময়লা নিচ্ছে না (Not collecting waste)
  2. `worker_behavior`: ময়লা কর্মীদের ব্যবহার খারাপ (Poor behavior of waste workers)
  3. `billing_issue`: বিল সংক্রান্ত সমস্যা (Billing related issue)

### Category 7: ধর্মীয় ও সেবামূলক (Religious & Service)
- **Category ID**: `religious`
- **Color**: Orange (#F39C12)
- **Icon**: church.svg
- **Subcategories**:
  1. `not_collecting`: ময়লা নিচ্ছে না (Not collecting waste)
  2. `worker_behavior`: ময়লা কর্মীদের ব্যবহার খারাপ (Poor behavior of waste workers)
  3. `billing_issue`: বিল সংক্রান্ত সমস্যা (Billing related issue)

### Category 8: মেলা ও আনন্দোৎসব (Events & Celebration)
- **Category ID**: `events`
- **Color**: Pink (#E91E63)
- **Icon**: congratulations.svg
- **Subcategories**:
  1. `event_description`: বর্ণনা দিন (Provide description)

## Summary
- **Total Categories**: 8
- **Total Subcategories**: 22 (7 categories × 3 subcategories + 1 category × 1 subcategory)
- **Category IDs**: home, road_environment, business, office, education, hospital, religious, events
- **Common Subcategories** (used in 7 categories): not_collecting, worker_behavior, billing_issue
- **Unique Subcategories**: 
  - Home category: not_collecting_waste (instead of not_collecting)
  - Road & Environment: road_waste, water_logging, manhole_issue
  - Events: event_description

## Requirements

### Requirement 1: Database Schema for Categories

**User Story:** As a system administrator, I want the database to store category and subcategory information for each complaint, so that complaints can be properly classified and filtered.

#### Acceptance Criteria

1. WHEN a complaint is created, THE Complaint System SHALL store the category field as a required string value
2. WHEN a complaint is created, THE Complaint System SHALL store the subcategory field as a required string value
3. THE Complaint System SHALL support exactly 8 categories: "home", "road_environment", "business", "office", "education", "hospital", "religious", "events"
4. THE Complaint System SHALL support 22 total subcategories across all 8 categories
5. THE Complaint System SHALL maintain referential integrity between category and subcategory fields
6. WHEN querying complaints, THE Complaint System SHALL provide indexed access to category and subcategory fields for efficient filtering

### Requirement 2: Category and Subcategory Validation

**User Story:** As a developer, I need to understand all subcategories for each category, so that backend validation matches mobile app

#### Acceptance Criteria

1. FOR 'home' category, THE subcategories SHALL be:
   - 'not_collecting_waste': বাসা বাড়ির ময়লা নিচ্ছে না (Not collecting household waste)
   - 'worker_behavior': ময়লা কর্মীদের ব্যবহার আচরণ (Poor behavior of waste workers)
   - 'billing_issue': বিল সংক্রান্ত ইস্যু (Billing related issue)

2. FOR 'road_environment' category, THE subcategories SHALL be:
   - 'road_waste': রাস্তার ধারে ময়লা (Waste beside the road)
   - 'water_logging': রাস্তায় পানি জমে আছে (Water logging on road)
   - 'manhole_issue': ম্যানহোল ঢাকনা নেই (Missing manhole cover)

3. FOR 'business', 'office', 'education', 'hospital', 'religious' categories, THE subcategories SHALL be:
   - 'not_collecting': ময়লা নিচ্ছে না (Not collecting waste)
   - 'worker_behavior': ময়লা কর্মীদের ব্যবহার খারাপ (Poor behavior of waste workers)
   - 'billing_issue': বিল সংক্রান্ত সমস্যা (Billing related issue)

4. FOR 'events' category, THE subcategory SHALL be:
   - 'event_description': বর্ণনা দিন (Provide description)

5. THE Backend API SHALL validate that submitted category and subcategory combinations are valid
6. THE Backend API SHALL store both category ID and subcategory ID as separate fields in the database

### Requirement 3: Category-Aware Complaint Form

**User Story:** As a citizen, I want to see my selected category and subcategory in the complaint form, so that I can confirm my selection before submitting

#### Acceptance Criteria

1. WHEN a user reaches the complaint form, THE Mobile App SHALL display the selected primary category and subcategory at the top
2. THE Mobile App SHALL provide a "Change Category" button to go back to category selection
3. THE Mobile App SHALL include the category and subcategory in the complaint submission data
4. THE Mobile App SHALL validate that category and subcategory are selected before allowing submission
5. THE Mobile App SHALL display category-specific placeholder text in the description field to guide users

### Requirement 4: Photo and Voice Recording Attachment

**User Story:** As a citizen, I want to attach photos and voice recordings to my categorized complaint, so that I can provide evidence of the issue

#### Acceptance Criteria

1. THE Mobile App SHALL allow users to upload up to 6 photos for each complaint
2. WHEN a user taps the photo upload area, THE Mobile App SHALL display options to take a photo or select from gallery
3. THE Mobile App SHALL display thumbnail previews of selected photos with a remove button
4. THE Mobile App SHALL provide a voice recording button with a red circular record interface
5. WHEN a user taps the record button, THE Mobile App SHALL start recording audio and display recording duration
6. WHEN a user taps stop, THE Mobile App SHALL save the audio recording and display a playback interface
7. THE Mobile App SHALL allow users to re-record audio by tapping the record button again

### Requirement 5: Backend Category Data Model

**User Story:** As a developer, I want a proper database schema for categorized complaints, so that category data is stored and queryable

#### Acceptance Criteria

1. THE Backend API SHALL add a "category" field to the Complaint table to store the primary category
2. THE Backend API SHALL add a "subcategory" field to the Complaint table to store the specific issue
3. THE Backend API SHALL add a "categoryIcon" field to store the icon identifier for the category
4. THE Backend API SHALL validate that category and subcategory are valid values from the predefined list
5. THE Backend API SHALL create indexes on category and subcategory fields for efficient filtering

### Requirement 6: Backend Category Management API

**User Story:** As a developer, I want API endpoints to manage categories and subcategories, so that the mobile app can fetch the latest category structure

#### Acceptance Criteria

1. THE Backend API SHALL provide a GET endpoint to fetch all primary categories with their subcategories
2. THE Backend API SHALL provide a GET endpoint to fetch subcategories for a specific primary category
3. THE Backend API SHALL return category data in both English and Bangla
4. THE Backend API SHALL include icon identifiers in the category response
5. THE Backend API SHALL allow admins to add, update, or disable categories through admin-only endpoints

### Requirement 7: Admin Panel Category Filtering

**User Story:** As an admin, I want to filter complaints by category and subcategory, so that I can manage complaints by department or issue type

#### Acceptance Criteria

1. THE Admin Panel SHALL display category and subcategory filters on the complaints page
2. WHEN an admin selects a primary category filter, THE Admin Panel SHALL show only complaints in that category
3. WHEN an admin selects a subcategory filter, THE Admin Panel SHALL show only complaints in that subcategory
4. THE Admin Panel SHALL display the category and subcategory in each complaint card
5. THE Admin Panel SHALL allow filtering by multiple categories simultaneously

### Requirement 8: Admin Panel Category Statistics

**User Story:** As an admin, I want to see complaint statistics by category, so that I can identify which areas need the most attention

#### Acceptance Criteria

1. THE Admin Panel SHALL display a category breakdown chart on the dashboard
2. THE Admin Panel SHALL show the count of complaints for each primary category
3. THE Admin Panel SHALL show the count of complaints for each subcategory within a category
4. THE Admin Panel SHALL calculate the percentage of total complaints for each category
5. THE Admin Panel SHALL highlight categories with the highest complaint volume

### Requirement 9: Category-Based Complaint Routing

**User Story:** As an admin, I want complaints to be automatically assigned to the appropriate department based on category, so that issues are handled by the right team

#### Acceptance Criteria

1. THE Backend API SHALL map each primary category to a department or team
2. WHEN a complaint is created, THE Backend API SHALL automatically assign it to the appropriate department based on category
3. THE Backend API SHALL send notifications to the assigned department when a new complaint is created
4. THE Admin Panel SHALL display the assigned department for each complaint
5. THE Admin Panel SHALL allow admins to reassign complaints to different departments if needed

### Requirement 10: Multilingual Category Support

**User Story:** As a citizen, I want to see category names in my preferred language (Bangla or English), so that I can understand the categories clearly

#### Acceptance Criteria

1. THE Mobile App SHALL display category names in Bangla when the app language is set to Bangla
2. THE Mobile App SHALL display category names in English when the app language is set to English
3. THE Backend API SHALL store category names in both Bangla and English
4. THE Mobile App SHALL use the TranslatedText widget for all category labels
5. THE Admin Panel SHALL display category names in English with Bangla translations in parentheses

### Requirement 11: Category Icon Management

**User Story:** As a developer, I want to manage category icons centrally, so that icons are consistent across mobile and admin interfaces

#### Acceptance Criteria

1. THE Backend API SHALL store icon identifiers for each category (e.g., "home", "road", "hospital")
2. THE Mobile App SHALL map icon identifiers to Flutter icon assets or SVG files
3. THE Admin Panel SHALL map icon identifiers to React icon components
4. THE Backend API SHALL validate that icon identifiers are valid before saving
5. THE Backend API SHALL provide default icons for categories without custom icons

### Requirement 12: Category Search and Autocomplete

**User Story:** As a citizen, I want to search for categories by name, so that I can quickly find the right category for my complaint

#### Acceptance Criteria

1. THE Mobile App SHALL provide a search bar on the category selection page
2. WHEN a user types in the search bar, THE Mobile App SHALL filter categories by name in real-time
3. THE Mobile App SHALL search in both Bangla and English category names
4. THE Mobile App SHALL highlight matching text in search results
5. THE Mobile App SHALL display a "No results found" message when no categories match the search

### Requirement 13: Category-Based Complaint Templates

**User Story:** As a citizen, I want to see suggested complaint descriptions based on my selected category, so that I can quickly fill out the form

#### Acceptance Criteria

1. THE Mobile App SHALL display suggested description templates for each subcategory
2. WHEN a user selects a subcategory, THE Mobile App SHALL show 2-3 common complaint templates
3. WHEN a user taps a template, THE Mobile App SHALL populate the description field with that template text
4. THE Mobile App SHALL allow users to edit the template text before submitting
5. THE Backend API SHALL store template text for each subcategory in both Bangla and English

### Requirement 14: Category Validation and Error Handling

**User Story:** As a citizen, I want clear error messages if I try to submit a complaint without selecting a category, so that I know what to fix

#### Acceptance Criteria

1. WHEN a user tries to submit a complaint without selecting a category, THE Mobile App SHALL display an error message "Please select a category"
2. WHEN a user tries to submit a complaint without selecting a subcategory, THE Mobile App SHALL display an error message "Please select a specific issue"
3. THE Backend API SHALL return a 400 error if category or subcategory is missing
4. THE Backend API SHALL return a 400 error if category or subcategory is not in the valid list
5. THE Mobile App SHALL display backend validation errors to the user

### Requirement 15: Category Analytics and Reporting

**User Story:** As an admin, I want to generate reports on complaint trends by category, so that I can make data-driven decisions

#### Acceptance Criteria

1. THE Admin Panel SHALL provide a category analytics page with charts and graphs
2. THE Admin Panel SHALL show complaint trends over time for each category
3. THE Admin Panel SHALL show the average resolution time for each category
4. THE Admin Panel SHALL allow exporting category reports as CSV or PDF
5. THE Admin Panel SHALL show the most common subcategories within each primary category
