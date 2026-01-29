import { PrismaClient, NoticeType, NoticePriority } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDemoNotices() {
    console.log('🌱 Seeding demo notices...');

    try {
        // First, get or create categories
        const categories = await Promise.all([
            prisma.noticeCategory.upsert({
                where: { id: 1 },
                update: {},
                create: {
                    name: 'General Announcement',
                    nameBn: 'সাধারণ ঘোষণা',
                    color: '#3FA564',
                    icon: '📢',
                    isActive: true,
                },
            }),
            prisma.noticeCategory.upsert({
                where: { id: 2 },
                update: {},
                create: {
                    name: 'Service Update',
                    nameBn: 'সেবা আপডেট',
                    color: '#2196F3',
                    icon: '🔔',
                    isActive: true,
                },
            }),
            prisma.noticeCategory.upsert({
                where: { id: 3 },
                update: {},
                create: {
                    name: 'Emergency Alert',
                    nameBn: 'জরুরি সতর্কতা',
                    color: '#F44336',
                    icon: '🚨',
                    isActive: true,
                },
            }),
            prisma.noticeCategory.upsert({
                where: { id: 4 },
                update: {},
                create: {
                    name: 'Event',
                    nameBn: 'ইভেন্ট',
                    color: '#FF9800',
                    icon: '🎉',
                    isActive: true,
                },
            }),
            prisma.noticeCategory.upsert({
                where: { id: 5 },
                update: {},
                create: {
                    name: 'Maintenance',
                    nameBn: 'রক্ষণাবেক্ষণ',
                    color: '#9C27B0',
                    icon: '🔧',
                    isActive: true,
                },
            }),
        ]);

        console.log(`✅ Created ${categories.length} categories`);

        // Get a MASTER_ADMIN user to be the creator
        const masterAdmin = await prisma.user.findFirst({
            where: { role: 'MASTER_ADMIN' },
        });

        if (!masterAdmin) {
            console.error('❌ No MASTER_ADMIN user found. Please create one first.');
            return;
        }

        // Create 20 demo notices
        const demoNotices = [
            {
                title: 'Welcome to Clean Care Bangladesh',
                titleBn: 'ক্লিন কেয়ার বাংলাদেশে স্বাগতম',
                description: 'We are excited to launch our new complaint management system',
                descriptionBn: 'আমরা আমাদের নতুন অভিযোগ ব্যবস্থাপনা সিস্টেম চালু করতে পেরে উত্সাহিত',
                content: 'Clean Care Bangladesh is committed to providing efficient waste management and complaint resolution services to all citizens. Our new digital platform makes it easier than ever to report issues and track their resolution.',
                contentBn: 'ক্লিন কেয়ার বাংলাদেশ সকল নাগরিকদের দক্ষ বর্জ্য ব্যবস্থাপনা এবং অভিযোগ সমাধান সেবা প্রদানে প্রতিশ্রুতিবদ্ধ। আমাদের নতুন ডিজিটাল প্ল্যাটফর্ম সমস্যা রিপোর্ট করা এবং তাদের সমাধান ট্র্যাক করা আগের চেয়ে সহজ করে তোলে।',
                categoryId: categories[0].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'New Waste Collection Schedule',
                titleBn: 'নতুন বর্জ্য সংগ্রহের সময়সূচী',
                description: 'Updated waste collection timings for all zones',
                descriptionBn: 'সকল জোনের জন্য আপডেট করা বর্জ্য সংগ্রহের সময়',
                content: 'Starting from next week, waste collection will be done twice a week - Monday and Thursday for residential areas, Tuesday and Friday for commercial areas.',
                contentBn: 'আগামী সপ্তাহ থেকে, সপ্তাহে দুইবার বর্জ্য সংগ্রহ করা হবে - আবাসিক এলাকার জন্য সোমবার এবং বৃহস্পতিবার, বাণিজ্যিক এলাকার জন্য মঙ্গলবার এবং শুক্রবার।',
                categoryId: categories[1].id,
                type: NoticeType.SCHEDULED,
                priority: NoticePriority.HIGH,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Emergency: Flood Alert',
                titleBn: 'জরুরি: বন্যা সতর্কতা',
                description: 'Heavy rainfall expected, please take precautions',
                descriptionBn: 'ভারী বৃষ্টিপাত প্রত্যাশিত, অনুগ্রহ করে সতর্কতা অবলম্বন করুন',
                content: 'Due to heavy rainfall forecast, residents in low-lying areas are advised to take necessary precautions. Emergency services are on standby.',
                contentBn: 'ভারী বৃষ্টিপাতের পূর্বাভাসের কারণে, নিচু এলাকার বাসিন্দাদের প্রয়োজনীয় সতর্কতা অবলম্বন করার পরামর্শ দেওয়া হচ্ছে। জরুরি সেবা প্রস্তুত রয়েছে।',
                categoryId: categories[2].id,
                type: NoticeType.URGENT,
                priority: NoticePriority.URGENT,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Community Cleanup Drive',
                titleBn: 'কমিউনিটি পরিচ্ছন্নতা অভিযান',
                description: 'Join us for a city-wide cleanup event this Saturday',
                descriptionBn: 'এই শনিবার শহরব্যাপী পরিচ্ছন্নতা ইভেন্টে আমাদের সাথে যোগ দিন',
                content: 'We are organizing a community cleanup drive this Saturday from 8 AM to 12 PM. Volunteers are welcome to participate and make our city cleaner.',
                contentBn: 'আমরা এই শনিবার সকাল ৮টা থেকে দুপুর ১২টা পর্যন্ত একটি কমিউনিটি পরিচ্ছন্নতা অভিযান আয়োজন করছি। স্বেচ্ছাসেবকদের অংশগ্রহণ এবং আমাদের শহরকে পরিচ্ছন্ন করতে স্বাগত জানানো হচ্ছে।',
                categoryId: categories[3].id,
                type: NoticeType.EVENT,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'System Maintenance Notice',
                titleBn: 'সিস্টেম রক্ষণাবেক্ষণ নোটিশ',
                description: 'Scheduled maintenance on Sunday night',
                descriptionBn: 'রবিবার রাতে নির্ধারিত রক্ষণাবেক্ষণ',
                content: 'Our system will undergo scheduled maintenance on Sunday from 11 PM to 2 AM. Services may be temporarily unavailable during this time.',
                contentBn: 'আমাদের সিস্টেম রবিবার রাত ১১টা থেকে ভোর ২টা পর্যন্ত নির্ধারিত রক্ষণাবেক্ষণের মধ্য দিয়ে যাবে। এই সময়ে সেবা সাময়িকভাবে অনুপলব্ধ থাকতে পারে।',
                categoryId: categories[4].id,
                type: NoticeType.SCHEDULED,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'New Mobile App Features',
                titleBn: 'নতুন মোবাইল অ্যাপ ফিচার',
                description: 'Check out the latest features in our mobile app',
                descriptionBn: 'আমাদের মোবাইল অ্যাপে সর্বশেষ ফিচারগুলি দেখুন',
                content: 'We have added new features including real-time tracking, photo upload, and instant notifications. Update your app to enjoy these features.',
                contentBn: 'আমরা রিয়েল-টাইম ট্র্যাকিং, ফটো আপলোড এবং তাৎক্ষণিক বিজ্ঞপ্তি সহ নতুন ফিচার যুক্ত করেছি। এই ফিচারগুলি উপভোগ করতে আপনার অ্যাপ আপডেট করুন।',
                categoryId: categories[1].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Holiday Service Schedule',
                titleBn: 'ছুটির দিনের সেবা সময়সূচী',
                description: 'Service timings during upcoming holidays',
                descriptionBn: 'আগামী ছুটির দিনগুলিতে সেবার সময়',
                content: 'During the upcoming Eid holidays, waste collection will be done on alternate days. Emergency services will remain operational 24/7.',
                contentBn: 'আগামী ঈদের ছুটির সময়, বিকল্প দিনে বর্জ্য সংগ্রহ করা হবে। জরুরি সেবা ২৪/৭ চালু থাকবে।',
                categoryId: categories[1].id,
                type: NoticeType.SCHEDULED,
                priority: NoticePriority.HIGH,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Recycling Initiative Launch',
                titleBn: 'পুনর্ব্যবহার উদ্যোগ চালু',
                description: 'New recycling program starting next month',
                descriptionBn: 'আগামী মাসে নতুন পুনর্ব্যবহার কর্মসূচি শুরু',
                content: 'We are launching a comprehensive recycling program. Separate bins for plastic, paper, and organic waste will be provided to all households.',
                contentBn: 'আমরা একটি ব্যাপক পুনর্ব্যবহার কর্মসূচি চালু করছি। প্লাস্টিক, কাগজ এবং জৈব বর্জ্যের জন্য আলাদা বিন সকল পরিবারে সরবরাহ করা হবে।',
                categoryId: categories[0].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Customer Service Hours Extended',
                titleBn: 'গ্রাহক সেবা সময় বৃদ্ধি',
                description: 'We are now available for longer hours',
                descriptionBn: 'আমরা এখন দীর্ঘ সময়ের জন্য উপলব্ধ',
                content: 'Our customer service is now available from 8 AM to 8 PM on weekdays and 9 AM to 5 PM on weekends.',
                contentBn: 'আমাদের গ্রাহক সেবা এখন সপ্তাহের দিনে সকাল ৮টা থেকে রাত ৮টা এবং সপ্তাহান্তে সকাল ৯টা থেকে বিকাল ৫টা পর্যন্ত উপলব্ধ।',
                categoryId: categories[1].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Dengue Prevention Campaign',
                titleBn: 'ডেঙ্গু প্রতিরোধ প্রচারাভিযান',
                description: 'Important measures to prevent dengue',
                descriptionBn: 'ডেঙ্গু প্রতিরোধের গুরুত্বপূর্ণ ব্যবস্থা',
                content: 'Please ensure there is no stagnant water around your premises. Our team will conduct regular inspections and fogging operations.',
                contentBn: 'অনুগ্রহ করে নিশ্চিত করুন যে আপনার প্রাঙ্গণের চারপাশে কোনো জমা পানি নেই। আমাদের দল নিয়মিত পরিদর্শন এবং ফগিং অপারেশন পরিচালনা করবে।',
                categoryId: categories[2].id,
                type: NoticeType.URGENT,
                priority: NoticePriority.HIGH,
                createdBy: masterAdmin.id,
            },
            {
                title: 'New Payment Options Available',
                titleBn: 'নতুন পেমেন্ট অপশন উপলব্ধ',
                description: 'Pay your bills using multiple payment methods',
                descriptionBn: 'একাধিক পেমেন্ট পদ্ধতি ব্যবহার করে আপনার বিল পরিশোধ করুন',
                content: 'You can now pay your service bills using bKash, Nagad, Rocket, or credit/debit cards through our mobile app.',
                contentBn: 'আপনি এখন আমাদের মোবাইল অ্যাপের মাধ্যমে বিকাশ, নগদ, রকেট বা ক্রেডিট/ডেবিট কার্ড ব্যবহার করে আপনার সেবা বিল পরিশোধ করতে পারেন।',
                categoryId: categories[1].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Road Closure for Maintenance',
                titleBn: 'রক্ষণাবেক্ষণের জন্য রাস্তা বন্ধ',
                description: 'Temporary road closure in Zone 3',
                descriptionBn: 'জোন ৩-এ সাময়িক রাস্তা বন্ধ',
                content: 'Main road in Zone 3 will be closed for maintenance work from Monday to Wednesday. Please use alternative routes.',
                contentBn: 'জোন ৩-এর প্রধান রাস্তা সোমবার থেকে বুধবার পর্যন্ত রক্ষণাবেক্ষণ কাজের জন্য বন্ধ থাকবে। অনুগ্রহ করে বিকল্প রুট ব্যবহার করুন।',
                categoryId: categories[4].id,
                type: NoticeType.SCHEDULED,
                priority: NoticePriority.HIGH,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Awareness Workshop on Waste Segregation',
                titleBn: 'বর্জ্য পৃথকীকরণ সচেতনতা কর্মশালা',
                description: 'Free workshop for all residents',
                descriptionBn: 'সকল বাসিন্দাদের জন্য বিনামূল্যে কর্মশালা',
                content: 'Join our free workshop to learn about proper waste segregation and its benefits. Register through our mobile app.',
                contentBn: 'সঠিক বর্জ্য পৃথকীকরণ এবং এর সুবিধা সম্পর্কে জানতে আমাদের বিনামূল্যে কর্মশালায় যোগ দিন। আমাদের মোবাইল অ্যাপের মাধ্যমে নিবন্ধন করুন।',
                categoryId: categories[3].id,
                type: NoticeType.EVENT,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'New Complaint Categories Added',
                titleBn: 'নতুন অভিযোগ বিভাগ যুক্ত',
                description: 'More specific categories for better service',
                descriptionBn: 'উন্নত সেবার জন্য আরও নির্দিষ্ট বিভাগ',
                content: 'We have added new complaint categories including street lighting, drainage, and road conditions for more accurate issue reporting.',
                contentBn: 'আমরা আরও সঠিক সমস্যা রিপোর্টিংয়ের জন্য রাস্তার আলো, নিকাশী এবং রাস্তার অবস্থা সহ নতুন অভিযোগ বিভাগ যুক্ত করেছি।',
                categoryId: categories[1].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Monsoon Preparedness',
                titleBn: 'বর্ষা প্রস্তুতি',
                description: 'Get ready for the monsoon season',
                descriptionBn: 'বর্ষা মৌসুমের জন্য প্রস্তুত হন',
                content: 'Monsoon season is approaching. Please ensure your drainage systems are clear and report any blockages immediately.',
                contentBn: 'বর্ষা মৌসুম আসছে। অনুগ্রহ করে নিশ্চিত করুন যে আপনার নিকাশী ব্যবস্থা পরিষ্কার এবং কোনো বাধা থাকলে অবিলম্বে রিপোর্ট করুন।',
                categoryId: categories[2].id,
                type: NoticeType.URGENT,
                priority: NoticePriority.HIGH,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Annual Report Published',
                titleBn: 'বার্ষিক প্রতিবেদন প্রকাশিত',
                description: 'View our achievements and statistics',
                descriptionBn: 'আমাদের অর্জন এবং পরিসংখ্যান দেখুন',
                content: 'Our annual report for 2024 is now available. We have successfully resolved 95% of complaints and collected 50,000 tons of waste.',
                contentBn: '২০২৪ সালের জন্য আমাদের বার্ষিক প্রতিবেদন এখন উপলব্ধ। আমরা সফলভাবে ৯৫% অভিযোগ সমাধান করেছি এবং ৫০,০০০ টন বর্জ্য সংগ্রহ করেছি।',
                categoryId: categories[0].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Smart Bin Installation',
                titleBn: 'স্মার্ট বিন ইনস্টলেশন',
                description: 'IoT-enabled bins coming to your area',
                descriptionBn: 'আপনার এলাকায় IoT-সক্ষম বিন আসছে',
                content: 'We are installing smart bins with sensors that will notify us when they are full, ensuring timely collection.',
                contentBn: 'আমরা সেন্সর সহ স্মার্ট বিন ইনস্টল করছি যা পূর্ণ হলে আমাদের অবহিত করবে, সময়মত সংগ্রহ নিশ্চিত করবে।',
                categoryId: categories[1].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
            {
                title: 'Feedback Survey',
                titleBn: 'প্রতিক্রিয়া সমীক্ষা',
                description: 'Help us improve our services',
                descriptionBn: 'আমাদের সেবা উন্নত করতে সাহায্য করুন',
                content: 'Please take 5 minutes to complete our service feedback survey. Your input is valuable for improving our services.',
                contentBn: 'অনুগ্রহ করে আমাদের সেবা প্রতিক্রিয়া সমীক্ষা সম্পূর্ণ করতে ৫ মিনিট সময় নিন। আমাদের সেবা উন্নত করার জন্য আপনার মতামত মূল্যবান।',
                categoryId: categories[0].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.LOW,
                createdBy: masterAdmin.id,
            },
            {
                title: 'COVID-19 Safety Protocols',
                titleBn: 'COVID-19 নিরাপত্তা প্রোটোকল',
                description: 'Safety measures for waste collection',
                descriptionBn: 'বর্জ্য সংগ্রহের জন্য নিরাপত্তা ব্যবস্থা',
                content: 'Our staff follows strict COVID-19 safety protocols. Please maintain social distancing during waste collection.',
                contentBn: 'আমাদের কর্মীরা কঠোর COVID-19 নিরাপত্তা প্রোটোকল অনুসরণ করে। বর্জ্য সংগ্রহের সময় অনুগ্রহ করে সামাজিক দূরত্ব বজায় রাখুন।',
                categoryId: categories[2].id,
                type: NoticeType.URGENT,
                priority: NoticePriority.HIGH,
                createdBy: masterAdmin.id,
            },
            {
                title: 'New Zone Added',
                titleBn: 'নতুন জোন যুক্ত',
                description: 'Service expanded to Zone 15',
                descriptionBn: 'জোন ১৫-এ সেবা সম্প্রসারিত',
                content: 'We are pleased to announce that our services are now available in Zone 15. Welcome to Clean Care Bangladesh!',
                contentBn: 'আমরা ঘোষণা করতে পেরে আনন্দিত যে আমাদের সেবা এখন জোন ১৫-এ উপলব্ধ। ক্লিন কেয়ার বাংলাদেশে স্বাগতম!',
                categoryId: categories[0].id,
                type: NoticeType.GENERAL,
                priority: NoticePriority.NORMAL,
                createdBy: masterAdmin.id,
            },
        ];

        // Create notices with proper date handling
        const createdNotices = [];
        for (let i = 0; i < demoNotices.length; i++) {
            const notice = demoNotices[i];
            const publishDate = new Date();
            publishDate.setDate(publishDate.getDate() - (20 - i)); // Stagger dates

            const created = await prisma.notice.create({
                data: {
                    ...notice,
                    publishDate,
                    isActive: true,
                    viewCount: Math.floor(Math.random() * 500),
                    readCount: Math.floor(Math.random() * 300),
                },
            });
            createdNotices.push(created);
        }

        console.log(`✅ Created ${createdNotices.length} demo notices`);
        console.log('🎉 Demo notices seeding completed successfully!');

        return createdNotices;
    } catch (error) {
        console.error('❌ Error seeding demo notices:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed function
seedDemoNotices()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
