@echo off
echo ========================================
echo Waste Management Demo Posts Creator
echo ========================================
echo.
echo এই script 5টি demo waste management posts তৈরি করবে
echo.
echo Posts:
echo 1. ঢাকা উত্তর সিটি কর্পোরেশনে দৈনিক বর্জ্য সংগ্রহ (বর্তমান)
echo 2. জৈব ও অজৈব বর্জ্য পৃথকীকরণ কর্মসূচি (বর্তমান)
echo 3. পুনর্ব্যবহারযোগ্য বর্জ্য সংগ্রহ কেন্দ্র (বর্তমান)
echo 4. স্মার্ট বর্জ্য ব্যবস্থাপনা সিস্টেম (ভবিষ্যত)
echo 5. বর্জ্য থেকে বিদ্যুৎ উৎপাদন প্রকল্প (ভবিষ্যত)
echo.
echo ========================================
echo.

cd server

echo Database এ posts insert করা হচ্ছে...
echo.

npx prisma db execute --file seed-waste-management-posts.sql --schema prisma/schema.prisma

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ সফলভাবে 5টি demo posts তৈরি হয়েছে!
    echo ========================================
    echo.
    echo এখন করুন:
    echo 1. Mobile app খুলুন
    echo 2. Waste Management পেজে যান
    echo 3. Posts দেখুন এবং like/dislike করুন
    echo.
    echo অথবা Admin Panel থেকে:
    echo 1. http://localhost:5173/admin/waste-management
    echo 2. Posts দেখুন এবং edit করুন
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Error: Posts তৈরি করতে সমস্যা হয়েছে
    echo ========================================
    echo.
    echo সমাধান:
    echo 1. Database connection চেক করুন
    echo 2. .env file এ DATABASE_URL সঠিক আছে কিনা দেখুন
    echo 3. Backend server চালু আছে কিনা চেক করুন
    echo.
)

cd ..

pause
