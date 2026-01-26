-- Add preferredLanguage column to users table
-- ইউজার টেবিলে preferredLanguage কলাম যোগ করা হচ্ছে

ALTER TABLE users 
ADD COLUMN preferredLanguage VARCHAR(5) DEFAULT 'bn' 
COMMENT 'User preferred language: bn for Bangla, en for English';

-- Create index for better query performance
-- ভালো পারফরম্যান্সের জন্য ইনডেক্স তৈরি করা হচ্ছে
CREATE INDEX idx_users_preferredLanguage ON users(preferredLanguage);

-- Update existing users to have Bangla as default
-- বিদ্যমান ইউজারদের জন্য বাংলা ডিফল্ট সেট করা হচ্ছে
UPDATE users 
SET preferredLanguage = 'bn' 
WHERE preferredLanguage IS NULL;
