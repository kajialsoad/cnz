-- Waste Management Demo Posts
-- এই SQL script চালিয়ে 5টি demo post তৈরি করুন

-- Note: createdBy = 1 (প্রথম admin user এর ID)
-- আপনার admin user এর ID ভিন্ন হলে এটি পরিবর্তন করুন

-- Post 1: বর্তমান বর্জ্য সংগ্রহ ব্যবস্থা
INSERT INTO waste_posts (
  title, 
  content, 
  imageUrl, 
  category, 
  status, 
  createdBy, 
  publishedAt, 
  createdAt, 
  updatedAt
) VALUES (
  'ঢাকা উত্তর সিটি কর্পোরেশনে দৈনিক বর্জ্য সংগ্রহ',
  'প্রতিদিন সকাল ৮টা থেকে ১০টা পর্যন্ত আমাদের বর্জ্য সংগ্রহ দল আপনার এলাকায় বর্জ্য সংগ্রহ করে। অনুগ্রহ করে নির্ধারিত সময়ের আগে বর্জ্যের ব্যাগ বাইরে রাখুন। আমরা প্রতিদিন ৫০০+ টন বর্জ্য সংগ্রহ করি এবং পরিবেশ বান্ধব উপায়ে নিষ্পত্তি করি।',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1920&q=100',
  'CURRENT_WASTE',
  'PUBLISHED',
  1,
  NOW(),
  NOW(),
  NOW()
);

-- Post 2: জৈব ও অজৈব বর্জ্য পৃথকীকরণ
INSERT INTO waste_posts (
  title, 
  content, 
  imageUrl, 
  category, 
  status, 
  createdBy, 
  publishedAt, 
  createdAt, 
  updatedAt
) VALUES (
  'জৈব ও অজৈব বর্জ্য পৃথকীকরণ কর্মসূচি',
  'আমরা এখন জৈব এবং অজৈব বর্জ্য আলাদাভাবে সংগ্রহ করছি। সবুজ ব্যাগে জৈব বর্জ্য (খাবারের উচ্ছিষ্ট, পাতা) এবং কালো ব্যাগে অজৈব বর্জ্য (প্লাস্টিক, কাগজ) রাখুন। এতে পুনর্ব্যবহার সহজ হয় এবং পরিবেশ রক্ষা পায়।',
  'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=1920&q=100',
  'CURRENT_WASTE',
  'PUBLISHED',
  1,
  NOW(),
  NOW(),
  NOW()
);

-- Post 3: পুনর্ব্যবহারযোগ্য বর্জ্য সংগ্রহ
INSERT INTO waste_posts (
  title, 
  content, 
  imageUrl, 
  category, 
  status, 
  createdBy, 
  publishedAt, 
  createdAt, 
  updatedAt
) VALUES (
  'পুনর্ব্যবহারযোগ্য বর্জ্য সংগ্রহ কেন্দ্র',
  'প্রতি শনিবার আমরা বিশেষ পুনর্ব্যবহারযোগ্য বর্জ্য সংগ্রহ করি। প্লাস্টিক বোতল, কাগজ, ধাতু এবং কাচের জিনিস আলাদা করে রাখুন। এই উদ্যোগে অংশ নিয়ে পরিবেশ রক্ষায় সহায়তা করুন।',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1920&q=100',
  'CURRENT_WASTE',
  'PUBLISHED',
  1,
  NOW(),
  NOW(),
  NOW()
);

-- Post 4: স্মার্ট বর্জ্য ব্যবস্থাপনা সিস্টেম (ভবিষ্যত)
INSERT INTO waste_posts (
  title, 
  content, 
  imageUrl, 
  category, 
  status, 
  createdBy, 
  publishedAt, 
  createdAt, 
  updatedAt
) VALUES (
  'স্মার্ট বর্জ্য ব্যবস্থাপনা সিস্টেম আসছে ২০২৬ সালে',
  'আগামী ৬ মাসে আমরা স্মার্ট বর্জ্য ব্যবস্থাপনা সিস্টেম চালু করব। এতে GPS ট্র্যাকিং, রিয়েল-টাইম আপডেট এবং মোবাইল অ্যাপ থাকবে। আপনি জানতে পারবেন কখন বর্জ্য সংগ্রহ গাড়ি আপনার এলাকায় আসবে।',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=100',
  'FUTURE_WASTE',
  'PUBLISHED',
  1,
  NOW(),
  NOW(),
  NOW()
);

-- Post 5: বর্জ্য থেকে বিদ্যুৎ উৎপাদন প্রকল্প (ভবিষ্যত)
INSERT INTO waste_posts (
  title, 
  content, 
  imageUrl, 
  category, 
  status, 
  createdBy, 
  publishedAt, 
  createdAt, 
  updatedAt
) VALUES (
  'বর্জ্য থেকে বিদ্যুৎ উৎপাদন প্রকল্প',
  '২০২৬ সালের শেষে আমরা বর্জ্য থেকে বিদ্যুৎ উৎপাদন প্রকল্প শুরু করব। প্রতিদিন ৩০০ টন বর্জ্য থেকে ১০ মেগাওয়াট বিদ্যুৎ উৎপাদন করা হবে। এটি পরিবেশ বান্ধব এবং টেকসই সমাধান যা শহরের বিদ্যুৎ চাহিদা পূরণে সহায়তা করবে।',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1920&q=100',
  'FUTURE_WASTE',
  'PUBLISHED',
  1,
  NOW(),
  NOW(),
  NOW()
);

-- সফলভাবে 5টি post তৈরি হয়েছে!
-- এখন mobile app থেকে দেখতে পারবেন
