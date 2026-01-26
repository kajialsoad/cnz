# Zone-Based Notification System - Complete Implementation

## 🎯 Overview

This document describes the complete zone-based notification and access control system that ensures Super Admins only receive notifications and can only view complaints from their assigned zones.

## 📋 Requirements (বাংলায়)

### User Complaint Submit করার সময়
যখন User complaint submit করবে, সে যে **City Corporation**, **Zone**, **Ward** দিয়ে complaint দেবে:

✅ **শুধু সেই Zone-এর Super Admin:**
- ওই complaint দেখতে পারবে
- ওই complaint-এর notification পাবে

❌ **অন্য Zone-এর Super Admin:**
- complaint দেখতেই পারবে না
- notification-ও পাবে না

## 🔁 Full Flow (End-to-End)

```
User Complaint Submit
  ↓
User selects City + Zone + Ward
  ↓
Complaint saved with location fields:
  - complaintCityCorporationCode
  - complaintZoneId
  - complaintWardId
  ↓
System finds Super Admins of that Zone
  ↓
Only those Super Admins get notification
  ↓
Only they can view complaint details
```

## 🧱 Backend Implementation

### 1️⃣ Complaint Data Structure

**Required Fields in Complaint:**
```typescript
{
  complaintId: number,
  complaintCityCorporationCode: string,
  complaintZoneId: number,
  complaintWardId: number
}
```

❌ **Zone ছাড়া complaint save হতে পারবে না** (এটা খুব দরকার)

### 2️⃣ Super Admin Profile Structure

**Required Fields in User (Super Admin):**
```typescript
{
  superAdminId: number,
  role: 'SUPER_ADMIN',
  cityCorporationCode: string,
  assignedZones: [
    { zoneId: number }
  ]
}
```

### 3️⃣ Notification Logic (MAIN IMPLEMENTATION)

**File:** `server/src/services/notification.service.ts`

**Function:** `notifyAdmins()`

```typescript
async notifyAdmins(
  title: string,
  message: string,
  type: string = 'INFO',
  complaintId?: number,
  metadata?: NotificationMetadata
): Promise<void>
```

**Logic Flow:**

1. **Fetch Complaint Location:**
   ```typescript
   const complaint = await prisma.complaint.findUnique({
     where: { id: complaintId },
     select: {
       complaintZoneId: true,
       zoneId: true, // Fallback
       complaintCityCorporationCode: true,
       cityCorporationCode: true // Fallback
     }
   });
   
   const complaintZoneId = complaint.complaintZoneId ?? complaint.zoneId;
   ```

2. **Find All Active Admins:**
   ```typescript
   const admins = await prisma.user.findMany({
     where: {
       role: { in: ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'] },
       status: 'ACTIVE'
     },
     select: {
       id: true,
       email: true,
       role: true,
       assignedZones: {
         select: { zoneId: true }
       }
     }
   });
   ```

3. **Filter Admins by Zone:**
   ```typescript
   const eligibleAdmins = admins.filter(admin => {
     // MASTER_ADMIN: Can see all complaints
     if (admin.role === 'MASTER_ADMIN') return true;
     
     // ADMIN: Can see all complaints (backward compatibility)
     if (admin.role === 'ADMIN') return true;
     
     // SUPER_ADMIN: Zone-based filtering
     if (admin.role === 'SUPER_ADMIN') {
       // If no complaint zone, deny access (safe default)
       if (!complaintZoneId) return false;
       
       // Check if complaint zone is in admin's assigned zones
       const assignedZoneIds = admin.assignedZones.map(z => z.zoneId);
       return assignedZoneIds.includes(complaintZoneId);
     }
     
     return false;
   });
   ```

4. **Create Notifications:**
   ```typescript
   const notificationsData = eligibleAdmins.map(admin => ({
     userId: admin.id,
     title,
     message,
     type,
     complaintId,
     metadata: metadata ? JSON.stringify(metadata) : null,
     isRead: false,
     createdAt: new Date()
   }));
   
   await prisma.notification.createMany({
     data: notificationsData
   });
   ```

### 4️⃣ Authorization Check (View Complaint)

**File:** `server/src/controllers/admin.complaint.controller.ts`

**Function:** `getAdminComplaintById()`

```typescript
// 🔒 ZONE-BASED AUTHORIZATION CHECK
if (req.user?.role === 'SUPER_ADMIN') {
  // Get admin's assigned zones
  const adminZones = await prisma.userZone.findMany({
    where: { userId: req.user.id },
    select: { zoneId: true }
  });
  
  const assignedZoneIds = adminZones.map(z => z.zoneId);
  
  // Get complaint zone (with fallback)
  const complaintZoneId = complaint.complaintZoneId ?? complaint.zoneId;
  
  // If complaint has no zone, deny access (safe default)
  if (!complaintZoneId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: You do not have access to this complaint'
    });
  }
  
  // Check if complaint zone is in admin's assigned zones
  if (!assignedZoneIds.includes(complaintZoneId)) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: This complaint is not in your assigned zones'
    });
  }
}
```

## 🖥️ Frontend Behavior

### Super Admin Dashboard
- শুধু তার zone-এর complaint list দেখবে
- অন্য zone-এর complaint UI-তেই আসবে না
- Notification badge শুধু তার zone-এর complaints count দেখাবে

### Master Admin Dashboard
- সব zone-এর complaint দেখতে পারবে
- সব notification পাবে

## 🧠 Important Security Notes

### ❌ What NOT to Do:
1. শুধু frontend filter করলে চলবে না
2. Notification send করার সময় "all super admins" করা যাবে না
3. Backend validation ছাড়া কোনো data trust করা যাবে না

### ✅ What to Do:
1. Backend-এ strict validation MUST
2. Location based filtering mandatory
3. Safe default: যদি zone না থাকে → deny access

## 🧩 One-Line Rule (সবচেয়ে গুরুত্বপূর্ণ)

> **User যে zone select করে complaint দেবে, শুধু সেই zone-এর Super Admin-ই ওই complaint + notification দেখতে পাবে।**

## 📊 Database Schema

### Complaint Table
```sql
CREATE TABLE complaints (
  id INT PRIMARY KEY,
  complaintCityCorporationCode VARCHAR(255),
  complaintZoneId INT,
  complaintWardId INT,
  -- ... other fields
  INDEX idx_complaint_location (complaintCityCorporationCode, complaintZoneId, complaintWardId)
);
```

### UserZone Table (Junction Table)
```sql
CREATE TABLE user_zones (
  id INT PRIMARY KEY,
  userId INT,
  zoneId INT,
  assignedAt DATETIME,
  UNIQUE KEY unique_user_zone (userId, zoneId),
  INDEX idx_user_zones_user (userId),
  INDEX idx_user_zones_zone (zoneId)
);
```

## 🔍 Testing Checklist

### Test Case 1: Notification Filtering
- [ ] Create complaint in Zone 1
- [ ] Verify only Zone 1 Super Admins receive notification
- [ ] Verify Zone 2 Super Admins do NOT receive notification
- [ ] Verify Master Admin receives notification

### Test Case 2: View Authorization
- [ ] Zone 1 Super Admin tries to view Zone 1 complaint → ✅ Success
- [ ] Zone 1 Super Admin tries to view Zone 2 complaint → ❌ 403 Forbidden
- [ ] Master Admin tries to view any complaint → ✅ Success

### Test Case 3: Multi-Zone Super Admin
- [ ] Super Admin assigned to Zone 1 and Zone 2
- [ ] Receives notifications for both zones
- [ ] Can view complaints from both zones

### Test Case 4: No Zone Complaint
- [ ] Complaint without zone → No Super Admin receives notification
- [ ] Super Admin tries to view → ❌ 403 Forbidden
- [ ] Master Admin can still view → ✅ Success

## 🚀 Deployment Notes

1. **Migration Required:** Ensure all existing complaints have `complaintZoneId` populated
2. **User Zones:** Ensure all Super Admins have zones assigned in `user_zones` table
3. **Backward Compatibility:** Old complaints use fallback to `zoneId` field
4. **Logging:** All authorization checks are logged for audit purposes

## 📝 API Endpoints Affected

### GET /api/admin/complaints
- Filters complaints by Super Admin's assigned zones
- Query parameter: `zoneId` (optional, must be in assigned zones)

### GET /api/admin/complaints/:id
- Authorization check before returning complaint details
- Returns 403 if complaint zone not in assigned zones

### GET /api/admin/notifications
- Returns only notifications for complaints in assigned zones
- Automatically filtered by `notifyAdmins()` function

## 🔧 Configuration

No additional configuration required. The system automatically:
- Detects user role
- Fetches assigned zones
- Filters notifications and complaints accordingly

## 📞 Support

For issues or questions, refer to:
- `server/src/services/notification.service.ts` - Notification logic
- `server/src/controllers/admin.complaint.controller.ts` - Authorization logic
- `server/src/services/admin-complaint.service.ts` - Complaint filtering logic
