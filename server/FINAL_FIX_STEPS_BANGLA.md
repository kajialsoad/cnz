# Vercel SSL Error - Final Fix (বাংলায়)

## সমস্যা
Vercel deployment এ DATABASE_URL ঠিকমতো set হয়নি। SSL error আসছে।

## সমাধান (এই steps follow করুন)

### Step 1: Vercel Dashboard এ যান
1. এই link এ যান: https://vercel.com/kajialsoads-projects/server/settings/environment-variables
2. Login করুন যদি করা না থাকে

### Step 2: DATABASE_URL Add/Update করুন

#### যদি DATABASE_URL already থাকে:
1. DATABASE_URL এর পাশে **Edit** button এ click করুন
2. Value field এ এটা paste করুন (সাবধানে, পুরোটা copy করুন):
```
mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?sslmode=disable
```
3. নিশ্চিত করুন **Production** checkbox টা checked আছে
4. **Save** button এ click করুন

#### যদি DATABASE_URL না থাকে:
1. **Add New** button এ click করুন
2. Name: `DATABASE_URL`
3. Value: `mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?sslmode=disable`
4. Environment: **Production** select করুন
5. **Save** button এ click করুন

### Step 3: Redeploy করুন

#### Option A: Vercel Dashboard থেকে
1. https://vercel.com/kajialsoads-projects/server এ যান
2. **Deployments** tab এ click করুন
3. সবচেয়ে উপরের deployment এর পাশে **three dots (⋮)** এ click করুন
4. **Redeploy** select করুন
5. **"Use existing Build Cache"** checkbox টা **UNCHECK** করুন (এটা important!)
6. **Redeploy** button এ click করুন
7. 2-3 মিনিট wait করুন

#### Option B: Command Line থেকে
Terminal এ এই command run করুন:
```bash
cd server
vercel --prod
```

### Step 4: Test করুন
Deployment complete হলে test করুন:
```bash
cd server
node test-vercel-api.js
```

## Expected Result
সব ঠিক থাকলে এরকম দেখাবে:
```
✅ Health: { ok: true, status: 'healthy' }
✅ City Corporations: { success: true, ... }
✅ Categories: { success: true, ... }
✅ Register: { success: true, ... }
```

## যদি এখনও error আসে
1. Vercel Dashboard এ DATABASE_URL check করুন
2. নিশ্চিত করুন `?sslmode=disable` আছে কিনা
3. আবার redeploy করুন (Build Cache ছাড়া)

## Important Notes
- `?sslmode=disable` অবশ্যই থাকতে হবে
- Extra spaces বা newlines থাকা যাবে না
- Production environment এ set করতে হবে
- Redeploy করার সময় Build Cache disable করতে হবে

## সময় লাগবে
- Environment variable update: 30 seconds
- Redeploy: 2-3 minutes
- Test: 10 seconds
- **Total: প্রায় 3-4 minutes**
