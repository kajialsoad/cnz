-- Fix ADMIN Ward Assignment
-- This script assigns a ward to ADMIN users who don't have one

-- First, check current ADMIN users and their ward assignments
SELECT 
    id,
    firstName,
    lastName,
    email,
    role,
    wardId,
    zoneId,
    cityCorporationCode
FROM User
WHERE role = 'ADMIN';

-- Example: Assign Ward 5 to ADMIN user with ID 421
-- REPLACE 421 with your actual ADMIN user ID
-- REPLACE 5 with the actual ward ID you want to assign

UPDATE User
SET 
    wardId = 5,  -- Change this to the actual ward ID
    zoneId = 10, -- Change this to the actual zone ID (ward's zone)
    cityCorporationCode = 'DSCC' -- Change if needed
WHERE 
    id = 421 
    AND role = 'ADMIN';

-- Verify the update
SELECT 
    id,
    firstName,
    lastName,
    email,
    role,
    wardId,
    zoneId,
    cityCorporationCode
FROM User
WHERE id = 421;

-- If you need to find available wards:
SELECT 
    id,
    wardNumber,
    zoneId,
    inspectorName,
    status
FROM Ward
WHERE status = 'ACTIVE'
ORDER BY wardNumber;
