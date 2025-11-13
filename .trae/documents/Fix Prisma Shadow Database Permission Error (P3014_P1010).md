## সমস্যার সারাংশ

* `prisma migrate dev` চালাতে গেলে Prisma একটি "shadow database" ব্যবহার করে স্কিমা ড্রিফট/ডেটা লস চেক করতে।

* আপনার MySQL ইউজার `cleancar_munna`-এর কাছে নতুন ডেটাবেস তৈরির পারমিশন নেই, তাই Prisma স্বয়ংক্রিয়ভাবে shadow DB তৈরি করতে গিয়ে ব্যর্থ হচ্ছে এবং `P3014` + `P1010` দেখাচ্ছে।

* ক্লাউড/হোস্টেড MySQL-এ (cPanel ইত্যাদি) সাধারণত `CREATE DATABASE` পারমিশন থাকে না; এই ক্ষেত্রে shadow DB ম্যানুয়ালি কনফিগার করতে হয়।

## কীভাবে কাজ করে (সংক্ষেপে)

* Prisma Migrate dev রান করার সময়:

  * shadow DB-তে সব মাইগ্রেশন রিরান করে স্কিমার "current state" বের করে।

  * ডেভ DB-এর সাথে তুলনা করে ড্রিফট/ডেটা লস আছে কি না চেক করে।

* প্রোডাকশন কমান্ড যেমন `prisma migrate deploy` এবং `resolve`-এ shadow DB লাগে না।

* MongoDB-র ক্ষেত্রে shadow DB ব্যবহার হয় না।

## সমাধানের পথ ১: ম্যানুয়াল shadow DB কনফিগার

1. MySQL-এ একটি নতুন ডেটাবেস তৈরি করুন, উদাহরণ: `cleancar_munna_shadow` (cPanel > MySQL Databases)।
2. ইউজার `cleancar_munna`-কে উভয় DB-তে প্রয়োজনীয় প্রিভিলেজ দিন (`SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX`).

   * SQL দিয়ে দিলে:

     * `SHOW GRANTS FOR 'cleancar_munna'@'%';`

     * `GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON cleancar_munna.* TO 'cleancar_munna'@'%';`

     * `GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON cleancar_munna_shadow.* TO 'cleancar_munna'@'%';`

     * `FLUSH PRIVILEGES;`
3. প্রকল্পে shadow DB URL সেট করুন:

   * `server/prisma/schema.prisma:6–9` এ `datasource db` ব্লকে `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")` যোগ করুন।

   * `server/.env` এ `SHADOW_DATABASE_URL="mysql://cleancar_munna:<PASSWORD>@ultra.webfastdns.com:3306/cleancar_munna_shadow"` দিন।

   * সতর্কতা: `DATABASE_URL` এবং `SHADOW_DATABASE_URL` কখনোই একই DB-তে পয়েন্ট করবে না।
4. কমান্ড চালান: `npx prisma migrate dev --name add_ward_zone_and_indexes`

   * এবার Prisma shadow DB-কে ড্রপ/ক্রিয়েট না করে রিসেট করে ব্যবহার করবে, ফলে `P3014/P1010` আর আসবে না।

## সমাধানের পথ ২: লোকাল-ডেভ + রিমোট-ডিপ্লয়

* যদি হোস্টে shadow DB তৈরি করা না যায়:

  * লোকাল MySQL-এ `DATABASE_URL` সেট করে `npx prisma migrate dev --name add_ward_zone_and_indexes` চালান।

  * রিমোট সার্ভারে গিয়ে `npx prisma migrate deploy` চালান; এতে shadow DB লাগে না।

## যাচাই ধাপ

* `SHOW GRANTS FOR 'cleancar_munna'@'%';` দিয়ে পারমিশন ঠিক আছে কি না দেখুন।

* `npx prisma migrate dev` সাকসেস হলে নতুন মাইগ্রেশন জেনারেট/অ্যাপ্লাই হবে, কোনো পারমিশন এরর দেখাবে না।

## নিরাপত্তা নোট

* কখনোই `url` এবং `shadowDatabaseUrl`-কে একই DB-তে সেট করবেন না; এতে ডেটা ডিলিট/ওভাররাইটের ঝুঁকি থাকে।

* `.env`-এ পাসওয়ার্ড/সিক্রেট নিরাপদে রাখুন; লগে প্রিন্ট বা কমিট করবেন না।

## পরবর্তী পদক্ষেপ

* আপনি যদি সম্মতি দেন, আমি ফাইলগুলিতে প্রয়োজনীয় কনফিগারেশন যোগ করতে পারি এবং কমান্ড চালিয়ে সফলতা যাচাই করে ফলাফল শেয়ার করবো।

