## সমস্যার সারসংক্ষেপ
- localhost:5173 এবং 5174 — উভয় প্রজেক্টেই সাদা/খালি পেজ দেখা যাচ্ছে
- কোডে `App.tsx` (clean-care-admin/src/App.tsx:16–83) রাউটিং ঠিক আছে, `ProtectedRoute` (clean-care-admin/src/components/routing/ProtectedRoute.tsx:11–38) লগইন পেজে রিডাইরেক্ট দেয়
- API base URL `.env` এ `http://localhost:4000/api` (clean-care-admin/.env:3) — সার্ভারের `/api` প্রিফিক্সের সাথে মিলছে (server/src/app.ts:55–65)
- একইসাথে দুটো ভিৎ ডেভ-সার্ভারে ব্ল্যাঙ্ক দেখায় বলে সবচেয়ে সম্ভাব্য কারণ: Vite override (rolldown-vite) বা React Router v7/React 19 কম্প্যাটিবিলিটি সমস্যা

## সম্ভাব্য মূল কারণ
- Vite override: package.json-এ `vite: npm:rolldown-vite@7.1.14` (clean-care-admin/package.json:46–50, clean-care-frontend/package.json:13–17) — প্লাগইন/ট্রান্সফরম ব্যর্থ হলে স্ক্রিপ্ট লোড না হয়ে খালি পেজ দেখা যায়
- React Router v7 ব্যবহার (`react-router-dom@7.9.5`), কিন্তু কোডে v6 স্টাইল `<BrowserRouter><Routes>` (clean-care-admin/src/App.tsx:23–77)। v7-এ অনেক ক্ষেত্রে `createBrowserRouter`+`RouterProvider` রিকমেন্ডেড; ভার্সন মিসম্যাচে রানটাইম এরর হতে পারে
- টাইপ প্যাকেজ মিসম্যাচ: `@types/react-router-dom@5.3.3` (clean-care-admin/package.json:38) — যদিও রানটাইমে প্রভাব কম, কিন্তু বিল্ডে সমস্যা তৈরি করতে পারে

## ডায়াগনস্টিক ধাপ
1. ব্রাউজারের DevTools Console/Network চেক করে জাভাস্ক্রিপ্ট এরর বা 404 স্ক্রিপ্ট দেখা
2. `clean-care-admin/src/main.tsx` (লাইন 6–9) এ টেম্পোরারি `console.log('boot')` দিয়ে নিশ্চিত করা স্ক্রিপ্ট চলছে কি না
3. সার্ভার `http://localhost:4000/api/health` হিট হয় কি না যাচাই (server/src/app.ts:51–53)

## ফিক্স পরিকল্পনা (প্রায়োরিটি)
1. Vite স্ট্যাবল-এ ফিরে যাওয়া
- `vite` override মুছে অফিসিয়াল `vite@^5.4.x` ব্যবহার
- `@vitejs/plugin-react@^5` রেখেই রিইনস্টল
- দুই প্রজেক্টে (`clean-care-admin`, `clean-care-frontend`) একইভাবে আপডেট
2. রাউটার কম্প্যাটিবিলিটি ঠিক করা
- Option A: `react-router-dom`-কে `^6.26.x` এ ডাউনগ্রেড করে বর্তমান `<BrowserRouter><Routes>` রাখি
- Option B: v7 রেখেই `createBrowserRouter` + `RouterProvider` প্যাটার্নে `App.tsx` আপডেট করি
3. টাইপ প্যাকেজ আপডেট
- `@types/react-router-dom` সরিয়ে দিই বা ভার্সন মিলিয়ে নেই; v6/v7 এ আলাদা টাইপ দরকার নেই
4. এসেট পাথ ঠিক করা (লো রিস্ক)
- `Sidebar.tsx`-এ `/src/assets/...` ডাইরেক্ট URL এর বদলে ইমপোর্ট-ভিত্তিক এসেট ব্যবহার, যাতে 404 না হয় (clean-care-admin/src/components/common/Layout/Sidebar/Sidebar.tsx:23–63)

## ভেরিফিকেশন
- `clean-care-admin` ডেভ-সার্ভার রান দিয়ে `/login` পেজ দেখা যাচ্ছে কিনা যাচাই
- `ProtectedRoute` দিয়ে লগইন না থাকলে `/login` রিডাইরেক্ট হচ্ছে (ProtectedRoute.tsx:32–35)
- সার্ভার চালু থাকলে লগইনের পরে ড্যাশবোর্ড রেন্ডার (Dashboard.tsx:9–38)

আপনার কনফার্মেশন পেলে আমি উপরোক্ত স্টেপগুলো প্রয়োগ করে সমস্যা সম্পূর্ণ ঠিক করে দেব এবং রানিং প্রিভিউ দেখিয়ে ভেরিফাই করব।