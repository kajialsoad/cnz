# ওয়েস্ট ম্যানেজমেন্ট অ্যাডমিন — পূর্ণ পরিকল্পনা (বাংলা)

## এক্সিকিউটিভ সামারি
শহর/মিউনিসিপ্যাল ওয়েস্ট ম্যানেজমেন্টে অভিযোগ ইনটেক থেকে রাউটিং, ফিল্ড এক্সিকিউশন, ভেরিফিকেশন, রিপোর্টিং পর্যন্ত এন্ড-টু-এন্ড ফ্লো। অ্যাডমিন মডিউল ইউজার/রোল, ক্যাটাগরি/সাবক্যাটাগরি, SLA/ওয়ার্কফ্লো, নোটিফিকেশন, GIS, বিলিং ও ইন্টেগ্রেশন পরিচালনা করবে।

## লক্ষ্য ও পরিধি
- অভিযোগ/রিকোয়েস্ট → এসাইনমেন্ট → রুট → এক্সিকিউশন → ভেরিফিকেশন → রিপোর্ট
- অ্যাডমিন টুলস: সেটিংস, ইউজার/পারমিশন, জোন/ওয়ার্ড, রুলস, নোটিফিকেশন, রিপোর্ট

## বর্তমান কোডবেস রেফারেন্স
- Admin (React + TypeScript)
  - `clean-care-admin/src/pages/Dashboard/Dashboard.tsx`
  - `clean-care-admin/src/pages/AllComplaints/AllComplaints.tsx`
  - `clean-care-admin/src/pages/AdminChatPage/AdminChatPage.tsx`
  - `clean-care-admin/src/pages/UserManagement/UserManagement.tsx`
  - `clean-care-admin/src/components/layout/AdminNavbar.tsx`
  - `clean-care-admin/src/pages/Settings/Settings.tsx`
  - সার্ভিস: `clean-care-admin/src/services/{complaintService, analyticsService, chatService, userManagementService}.ts`
- Backend (Express + Prisma)
  - `server/src/app.ts` → `/api/admin/{auth, users, complaints, analytics, chat, city-corporations}`
  - `server/src/controllers/admin.user.controller.ts`, `server/src/services/admin.user.service.ts`
  - `server/src/controllers/admin.complaint.controller.ts`, `server/src/services/complaint.service.ts`
  - `server/src/services/category.service.ts`
- Mobile (Flutter)
  - `lib/main.dart` → `'/waste-management'`
  - `lib/pages/waste_management_page.dart`
  - অভিযোগ: `lib/models/complaint.dart`, `lib/providers/complaint_provider.dart`
- Docs
  - `docs/DEPLOYMENT_ARCHITECTURE.md`, `docs/AUTH_SECURITY_SETUP.md`, `docs/PROJECT_STATUS_ANALYSIS.md`

## পারসোনা
- Admin, Supervisor, FieldWorker, Citizen

## ডোমেইন মডেল
- Complaint, WorkOrder, Route, Bin/Asset, Fleet/Vehicle, User, City/Zone/Ward, Billing/Invoice, Notification, Media

## ওয়ার্কফ্লো
1. Intake
2. Triage
3. Assignment (+ Route)
4. Execution (মিডিয়া/লোকেশন প্রুফ)
5. Verification
6. Reporting

## অ্যাডমিন দায়িত্ব
- ক্যাটাগরি/সাবক্যাটাগরি, ইউজার/রোল, জোন/ওয়ার্ড, SLA/রুলস, নোটিফিকেশন, রিপোর্টিং, ইন্টেগ্রেশন

## API ম্যাপিং
- `GET/POST/PUT /api/admin/complaints`
- `GET/PUT /api/admin/users`
- `GET /api/admin/analytics`
- `GET/POST /api/admin/chat`
- `GET /api/admin/city-corporations`
- `POST /api/uploads`

## ড্যাশবোর্ড KPIs
- ওপেন/ইন-প্রগ্রেস/ক্লোজড, SLA ব্রিচ%, এভারেজ রেজল্যুশন, রাউটিং ইফিশিয়েন্সি, টিম প্রোডাক্টিভিটি

## রিপোর্টিং
- দৈনিক/সাপ্তাহিক/মাসিক, CSV/XLSX/PDF, GIS হিটম্যাপ

## GIS
- বাউন্ডারি, অভিযোগ/বিন/ভেহিকল পিনস, রুট ওভারলে

## মিডিয়া/ফাইল
- আপলোড, থাম্বনেইল, EXIF/জিওডাটা, রিটেনশন

## সিকিউরিটি
- JWT, RBAC, অডিট লগ, PII মাস্কিং, ব্যাকআপ/রিস্টোর

## পারফরম্যান্স
- ক্যাশিং, পেজিনেশন, ইনডেক্সিং, ব্যাচ প্রসেস

## টেস্টিং
- ইউনিট/ইন্টিগ্রেশন/E2E, লোড টেস্ট

## ডিপ্লয়মেন্ট
- Dev/Staging/Prod, CI/CD, অবজারভেবিলিটি

## রোডম্যাপ
- Phase 1: অভিযোগ/ইউজার/ড্যাশবোর্ড
- Phase 2: রুট অপ্টিমাইজেশন, GIS
- Phase 3: বিলিং/পেমেন্ট, কমপ্লায়েন্স
- Phase 4: অটো-অ্যাসাইনমেন্ট, অ্যানালিটিক্স

---

## অ্যাডমিন সেটিংস পেজ — কাঠামো
- নেভিগেশন: `AdminNavbar` → `'/settings'`
- লেআউট: বাম ট্যাব, ডানে ফর্ম/গ্রিড

### ট্যাব/ফিচার
- General: প্রতিষ্ঠান, ভাষা, টাইমজোন, নোটিস
- Organization: City→Zone→Ward→Beat→Team; GeoJSON ইমপোর্ট
- Users & Roles: রোল/পারমিশন ম্যাট্রিক্স
- Categories: ডোমেইন/সাবক্যাটাগরি, ফর্ম স্কিমা; রেফ: `server/src/services/category.service.ts`
- Workflow & SLA: স্টেজিং, ক্যাটাগরি/জোন-ভিত্তিক SLA
- GIS & Locations: ম্যাপ প্রোভাইডার, লেয়ার ম্যানেজমেন্ট
- Assets & Fleet: বিন টাইপ/ক্যাপাসিটি, মেইনটেন্যান্স, রুট-কস্টিং
- Work Orders: টেমপ্লেট, অটো-জেনারেশন, এসাইনমেন্ট পলিসি
- Notifications: SMS/Push/Email টেমপ্লেট ও ট্রিগার
- Integrations: পেমেন্ট/SMS/স্টোরেজ, ওয়েবহুক
- Billing: ফি টেবিল, ইনভয়েস এক্সপোর্ট
- Security: JWT/সেশন, পাসওয়ার্ড পলিসি, 2FA, IP allowlist
- Data: রিটেনশন/আর্কাইভিং, ইমপোর্ট/এক্সপোর্ট
- Automation: if-then রুল, স্কোরিং/প্রিয়োরিটাইজেশন
- Feature Toggles: বিটা ফিচার অন/অফ
- Theming: ব্র্যান্ড কালার/টাইপোগ্রাফি
- Audit Logs: পরিবর্তন ট্র্যাক/এক্সপোর্ট
- Backup & Restore: স্ন্যাপশট/শিডিউল
- Developer: API কী, স্যান্ডবক্স, রেট-লিমিট

### উদাহরণ কনফিগ (JSON)
```json
{
  "general": { "locale": "bn", "timezone": "Asia/Dhaka" },
  "roles": {
    "Admin": ["manage_settings", "manage_users", "export_reports"],
    "Supervisor": ["assign_work", "verify_work", "view_reports"],
    "FieldWorker": ["update_work", "upload_media"],
    "Analyst": ["view_analytics", "export_reports"]
  },
  "sla": [
    { "category": "drainage_waterlogging", "severity": "high", "hours": 24 },
    { "category": "canal_waste", "severity": "medium", "hours": 48 }
  ],
  "notifications": {
    "channels": ["sms", "push", "email"],
    "events": ["assignment", "sla_breach", "closure"]
  }
}
```

### UI/UX নোটস
- ডায়নামিক ফর্ম স্কিমা, রোল-ভিত্তিক কন্ডিশনাল রেন্ডার
- সেভে অডিট লগ + সাকসেস টোস্ট

### ইমপ্লিমেন্টেশন রেফারেন্স
- FE: `clean-care-admin/src/pages/Settings/Settings.tsx`
- BE: `/api/admin/*`, Zod, Prisma
