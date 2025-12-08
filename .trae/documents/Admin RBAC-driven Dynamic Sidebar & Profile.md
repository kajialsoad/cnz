## লক্ষ্য
- অ্যাডমিন রোল ৩টি করা: `MASTER_ADMIN` → `SUPER_ADMIN` → `ADMIN` (প্রায়োরিটি ক্রমে)।
- মেনু পরে; এখন কেবল প্রোফাইল কন্টেইনার (Sidebar ও Header)কে role/auth অনুসারে ডায়নামিক করা।

## স্কিমা/ব্যাকএন্ড পরিবর্তন (রোল যোগ)
1) Prisma enum আপডেট
- ফাইল: `server/prisma/schema.prisma:247–252`
- `UserRole`-এ `MASTER_ADMIN` যোগ করা হবে।
- মাইগ্রেশন দরকার: `prisma migrate dev` (পরবর্তীতে চালাবো)।

2) Admin auth গার্ড আপডেট
- ফাইল: `server/src/controllers/admin.auth.controller.ts:40–45, 77–83`
- রোল চেক এখন `ADMIN`/`SUPER_ADMIN`; এটিতে `MASTER_ADMIN` যুক্ত হবে।
- অর্থাৎ: `if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MASTER_ADMIN')` → 403।

3) RBAC middleware আপডেট
- ফাইল: `server/src/middlewares/auth.middleware.ts`
- `rbacGuard(...roles)` ব্যবহারে অ্যাডমিন রুটে `MASTER_ADMIN` যুক্ত করা হবে, যেমন: `rbacGuard('ADMIN','SUPER_ADMIN','MASTER_ADMIN')`।

## ফ্রন্টএন্ড পরিবর্তন (প্রোফাইল ডায়নামিক)
1) টাইপ এলাইনমেন্ট
- ফাইল: `clean-care-admin/src/types/auth.types.ts:1–16`
- `User`-এ `role?: 'ADMIN'|'SUPER_ADMIN'|'MASTER_ADMIN'|'CUSTOMER'|'SERVICE_PROVIDER'` যোগ।

2) Sidebar প্রোফাইল ব্লক
- ফাইল: `clean-care-admin/src/components/common/Layout/Sidebar/Sidebar.tsx`
- হার্ডকোডেড নাম/রোল রিপ্লেস:
  - নাম: `:209` → `${user.firstName} ${user.lastName}`
  - রোল চিপ: `:213` → `roleToBnLabel(user.role)`
  - ডিজাইনেশন টেক্সট: `Chief Controller`/`Controller` — role অনুযায়ী ম্যাপ
- `roleToBnLabel(role)` ম্যাপ:
  - `MASTER_ADMIN` → `MASTER ADMIN / Chief Controller`
  - `SUPER_ADMIN` → `SUPER ADMIN / Controller`
  - `ADMIN` → `ADMIN / Controller`
- অ্যাভাটার: `user.avatar` থাকলে সেট; নাহলে ইনিশিয়াল।

3) Header প্রোফাইল ব্লক
- ফাইল: `clean-care-admin/src/components/common/Layout/Header/Header.tsx:320–325`
- `user?.roles?.[0]?.name` এর বদলে `roleToShortBn(user.role)` দেখানো:
  - `MASTER_ADMIN` → `MASTER ADMIN`
  - `SUPER_ADMIN` → `SUPER ADMIN`
  - `ADMIN` → `ADMIN`

## ভ্যালিডেশন
- তিন ধরনের ইউজার দিয়ে লগইন টেস্ট:
  - `MASTER_ADMIN` → Sidebar/Header-এ “MASTER ADMIN / Chief Controller”
  - `SUPER_ADMIN` → “SUPER ADMIN / Controller”
  - `ADMIN` → “ADMIN / Controller”
- ব্যাকএন্ডে `admin/auth/me` রেসপন্সে নতুন রোল সঠিকভাবে আসে কিনা যাচাই; ফ্রন্টএন্ডে `AuthContext` `user`-এ সেট হয় কিনা যাচাই।

এপ্রুভ করলে আমি প্রথমে স্কিমা/ব্যাকএন্ড রোল আপডেট করব, তারপর ফ্রন্টএন্ড Sidebar/Header প্রোফাইল ডায়নামিক করে লোকাল টেস্ট সম্পন্ন করব।