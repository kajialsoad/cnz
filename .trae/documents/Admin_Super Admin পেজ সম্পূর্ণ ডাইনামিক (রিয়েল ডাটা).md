## লক্ষ্য
- Admin Management ও Super Admin Management—দুই পেজেই রিয়েল API ডাটা দেখানো, স্ট্যাটস/ফিল্টার/পেজিনেশন/CRUD সহ।

## টাস্ক-তালিকা
1. AdminManagement.tsx ডাইনামিক করা
- React Query দিয়ে `getUsers({role:'ADMIN'})`
- সার্চ/ফিল্টার/পেজিনেশন state → query
- টেবিল ও স্ট্যাটস রিয়েল ডাটা ম্যাপ
- Create/Update/Delete ডায়ালগ → API কল + ইনভ্যালিডেট

2. SuperAdminManagement.tsx ডাইনামিক করা
- React Query দিয়ে `getUsers({role:'SUPER_ADMIN'})`
- স্ট্যাটস কার্ড: মোট/সক্রিয়/নিষ্ক্রিয়/আজ নতুন
- অ্যাক্টিভিটি কার্ড রিয়েল ডাটা থেকে
- টেবিল ম্যাপিং ও CRUD

3. ইউটিলিটি
- `src/utils/userStats.ts` যোগ: `computeStatusBreakdown`, `isOnline(lastLoginAt)`, `formatArea`

4. UX/লোডিং/এরর
- লোডিং স্কেলেটন, এরর টোস্ট, 300ms ডিবাউন্স
- React Query: `staleTime: 60s`, `keepPreviousData`

5. যাচাই/প্রিভিউ
- দুই পেজে রিয়েল ডাটা; ফিল্টার/সার্চ/CRUD সকল কাজ করে
- কাউন্ট/স্ট্যাটস সঠিক দেখায়; অনলাইন/অফলাইন হিউরিস্টিক OK

## ডেলিভারেবলস
- আপডেটেড: `src/pages/AdminManagement/AdminManagement.tsx`
- আপডেটেড: `src/pages/SuperAdminManagement/SuperAdminManagement.tsx`
- নতুন: `src/utils/userStats.ts`

## নোট
- API-তে `role` ফিল্টার ইতিমধ্যেই টাইপে আছে; সার্ভার সাপোর্ট থাকলে সরাসরি কাজ করবে।

আপনি অনুমতি দিলে আমি এখনই এই টাস্কগুলো ইমপ্লিমেন্ট করে টেস্ট+প্রিভিউ দেখাবো।