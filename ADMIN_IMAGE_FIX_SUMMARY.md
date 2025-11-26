# Admin Panel Image Loading Fix

## সমস্যা
Admin panel এ complaint এর image "Failed to load" দেখাচ্ছিল।

## কারণ
Database এ image URL গুলো hardcoded `http://localhost:4000` দিয়ে stored ছিল:
```
http://localhost:4000/api/uploads/image/1764079718678_730f54198f04dab7.jpg
```

কিন্তু admin panel different server এ connect করছিল:
- Local mode: `http://192.168.0.100:4000`
- Production mode: `https://munna-production.up.railway.app`

## সমাধান
`clean-care-admin/src/services/complaintService.ts` এ `fixMediaUrl()` method যোগ করা হয়েছে যেটা:

1. Hardcoded `localhost:4000` কে current server URL দিয়ে replace করে
2. Production URL কে current server URL দিয়ে replace করে  
3. Relative URL গুলোতে current server URL prepend করে

### কিভাবে কাজ করে:
```typescript
// Before fix:
imageUrl: "http://localhost:4000/api/uploads/image/123.jpg"

// After fix (local mode):
imageUrl: "http://192.168.0.100:4000/api/uploads/image/123.jpg"

// After fix (production mode):
imageUrl: "https://munna-production.up.railway.app/api/uploads/image/123.jpg"
```

## Admin Panel Restart করুন

Fix apply করার জন্য admin panel restart করতে হবে:

```cmd
# Admin panel বন্ধ করুন (Ctrl+C)
# তারপর আবার চালু করুন:
cd clean-care-admin
npm run dev
```

অথবা:
```cmd
restart-admin-with-local-server.cmd
```

## Important Notes

### Local Mode (`VITE_USE_PRODUCTION=false`)
- Admin panel `http://192.168.0.100:4000` এ connect করবে
- **Local server অবশ্যই চালু থাকতে হবে** image load করার জন্য
- Local server চালু করুন: `start-local-server.cmd`

### Production Mode (`VITE_USE_PRODUCTION=true`)
- Admin panel production server এ connect করবে
- Image গুলো production server থেকে load হবে
- Local server লাগবে না

## Verification

Admin panel এ complaint details modal খুলে check করুন:
1. Browser console (F12) এ কোনো image loading error আছে কিনা
2. Network tab এ image request গুলো সঠিক URL এ যাচ্ছে কিনা
3. Image successfully load হচ্ছে কিনা

## Future Improvement

Database এ image URL store করার সময় relative path ব্যবহার করা উচিত:
```
/api/uploads/image/123.jpg
```

এতে server URL পরিবর্তন হলেও image URL সঠিক থাকবে।
