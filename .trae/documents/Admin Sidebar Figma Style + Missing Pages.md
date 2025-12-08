## লক্ষ্য
- Admin সাইডবারকে Figma অনুযায়ী রিডিজাইন ও collapse/expand যোগ করা
- Sidebar-এর মেনুগুলোকে কার্যকর রাউটের সাথে যুক্ত করা
- যেসব ম্যানেজমেন্ট পেজ রাউট নেই, শুধু রাউট যোগ করা; নতুন পেজ কেবল প্রয়োজন হলে (Super Admin Management)

## কী কী হবে
- Sidebar আইটেম: Dashboard, City Corporations, Complaints, Messages, Super Admin Management, Admin Management, User Management, Reports, Notifications, Settings, Logout
- Collapse মোডে icons-only, expand মোডে আইকন+লেবেল
- Active আইটেমে পিল স্টাইল (Figma-র মতো)

## ফাইল আপডেট
- `src/components/common/Layout/Sidebar/Sidebar.tsx`
  - Figma-স্টাইলের স্ট্রাকচার ও `collapsed` স্টেট
  - মেনু লিস্ট আপডেট (উপরের আইটেমগুলো)
- `src/components/common/Layout/Sidebar/Sidebar.module.scss`
  - গ্রিন গ্রেডিয়েন্ট, শ্যাডো, স্পেসিং
  - `.sidebar.collapsed` ব্লক: টেক্সট হাইড, 72px উইডথ, আইকন সেন্টার
- `src/App.tsx`
  - রাউট যোগ/ফিক্স:
    - `'/admins'` → Admin Management (আছে: Reuse)
    - `'/super-admins'` → Super Admin Management (নতুন স্কেলেটন লাগলে মিনিমাল পেজ)
    - বাকিগুলো আগেই আছে: `/complaints`, `/chats`, `/users`, `/city-corporations`, `/reports`, `/notifications`, `/settings`
  - সব ProtectedRoute এর আওতায়

## নতুন পেজ (শুধু দরকার হলে)
- `pages/SuperAdminManagement/SuperAdminManagement.tsx` → টেবিল/লিস্টের মিনিমাল স্কেলেটন
  - যদি আগেই থাকে, শুধু রাউট/সাইডবার লিঙ্ক করবো; না থাকলে খুব লাইটওয়েট স্কেলেটন বানাবো

## আইকন
- বর্তমান আইকনগুলোই ব্যবহার; চাইলে Figma অ্যাসেট দিয়ে রিপ্লেস করা যাবে পরে

## ভ্যালিডেশন
- লোকাল রান করে collapse/expand, active state, রাউট ন্যাভিগেশন যাচাই
- Sidebar-এর ভিজ্যুয়াল Figma স্ক্রিনশটের সাথে ম্যাচ করা

## ডেলিভারেবল
- আপডেটেড Sidebar.tsx + Sidebar.module.scss
- `App.tsx`-এ রাউট অ্যাড/ফিক্স
- (প্রয়োজনে) SuperAdminManagement পেজের স্কেলেটন

অনুমোদন দিলে সাথে সাথে কোড আপডেট শুরু করবো ও ভেরিফাই করবো।