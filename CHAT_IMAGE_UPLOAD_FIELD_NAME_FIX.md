# Chat Image Upload Field Name Fix

## সমস্যা (Problem)

Chat modal থেকে image upload করার সময় এই error আসছিল:

```
Error: Invalid file field
    at fileFilter (F:\claen_app_bangladesh\server\src\config\upload.config.ts:68:8)
```

Console log দেখাচ্ছিল:
```
File filter called: {
  fieldname: 'image',
  originalname: '369909831_1647849399037417_2727219465348805185_n.jpg',
  mimetype: 'image/jpeg'
}
```

## মূল কারণ (Root Cause)

**Mismatch between route configuration and upload config:**

### Route Configuration (admin.chat.routes.ts):
```typescript
router.post('/:complaintId', uploadConfig.single('image'), sendChatMessage);
//                                                  ^^^^^^ singular
```

### Upload Config (upload.config.ts):
```typescript
if (file.fieldname === 'images') {  // ❌ Only accepting 'images' (plural)
    // ...
}
```

Route `'image'` (singular) পাঠাচ্ছিল কিন্তু upload config শুধু `'images'` (plural) accept করছিল।

## সমাধান (Solution)

`upload.config.ts` এ `fileFilter` এবং `storage.destination` উভয় জায়গায় `'image'` (singular) support যোগ করা হয়েছে।

### পরিবর্তন 1: File Filter

**আগে:**
```typescript
if (file.fieldname === 'images') {
    // Only 'images' (plural)
}
```

**এখন:**
```typescript
if (file.fieldname === 'image' || file.fieldname === 'images') {
    // Both 'image' (singular) and 'images' (plural)
}
```

### পরিবর্তন 2: Storage Destination

**আগে:**
```typescript
if (file.fieldname === 'images') {
    uploadPath += 'images/';
}
```

**এখন:**
```typescript
if (file.fieldname === 'image' || file.fieldname === 'images') {
    uploadPath += 'images/';
}
```

## কেন এই সমস্যা হয়েছিল? (Why This Happened)

1. **Complaint upload** → `'images'` (plural) ব্যবহার করে (multiple images)
2. **Chat upload** → `'image'` (singular) ব্যবহার করে (single image)
3. Upload config শুধু complaint এর জন্য configured ছিল

## এখন কি হবে? (What Happens Now)

✅ **Chat image upload** → `'image'` field accept করবে
✅ **Complaint image upload** → `'images'` field accept করবে (আগের মতো)
✅ **Both work together** → কোনো conflict নেই

## টেস্টিং (Testing)

### Test করতে:

1. Server restart করুন (যদি running থাকে)
2. Admin panel এ login করুন
3. যেকোনো complaint এর chat modal খুলুন
4. একটি image select করুন
5. Message পাঠান

### Expected Results:

- ✅ "Sending message with file to backend" console log
- ✅ Image Cloudinary তে upload হবে
- ✅ Message successfully sent
- ✅ Image chat এ দেখাবে
- ❌ "Invalid file field" error আসবে না

## সম্পর্কিত Files (Related Files)

- ✅ `server/src/config/upload.config.ts` - Fixed fileFilter and storage
- ✅ `server/src/routes/admin.chat.routes.ts` - Uses 'image' (singular)
- ✅ `server/src/routes/complaint.routes.ts` - Uses 'images' (plural)

## সমাপ্তি (Conclusion)

এই fix এর পর, chat image upload সঠিকভাবে কাজ করবে। Upload config এখন both `'image'` (singular) এবং `'images'` (plural) field names support করে।

**Key Point:** একই upload config multiple field names support করতে পারে। এটা flexible এবং maintainable।
