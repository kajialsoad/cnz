import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOfficerReviews() {
    console.log('🌱 Seeding Officer Reviews...');

    // Clear existing data
    await prisma.officerReviewMessage.deleteMany({});
    await prisma.officerReview.deleteMany({});

    // Seed data from existing hardcoded mayor statement banner
    const officerReviews = [
        {
            name: 'Mayor Md. Badrul Alam',
            nameBn: 'মেয়র মোঃ বদরুল আলম',
            designation: 'Mayor',
            designationBn: 'মেয়র',
            imageUrl: 'assets/profile.png',
            displayOrder: 0,
            isActive: true,
            messages: [
                {
                    content: 'We need everyone\'s cooperation to keep our city clean and beautiful. Through the Clean Care app, you can easily access services.',
                    contentBn: 'আমাদের শহরকে পরিচ্ছন্ন ও সুন্দর রাখতে সবার সহযোগিতা দরকার। ক্লিন কেয়ার অ্যাপের মাধ্যমে আপনি সহজেই সেবা পেতে পারবেন।',
                    displayOrder: 0,
                },
                {
                    content: 'Taking care of our environment every day is everyone\'s responsibility. Let\'s build a green and sustainable Dhaka together.',
                    contentBn: 'প্রতিদিন আমাদের পরিবেশের যত্ন নেওয়া সবার দায়িত্ব। চলুন একসঙ্গে একটি সবুজ ও সুস্থ ঢাকা গড়ি।',
                    displayOrder: 1,
                },
                {
                    content: 'We are committed to realizing the dream of Digital Bangladesh. We are delivering services to your doorstep through modern technology.',
                    contentBn: 'আমরা ডিজিটাল বাংলাদেশের স্বপ্ন বাস্তবায়নে প্রতিশ্রুতিবদ্ধ। আধুনিক প্রযুক্তির মাধ্যমে আপনার দোরগোড়ায় সেবা পৌঁছে দিচ্ছি।',
                    displayOrder: 2,
                },
            ],
        },
        {
            name: 'Mohammad Azaz',
            nameBn: 'মোহাম্মদ আজাজ',
            designation: 'Chief Executive Officer',
            designationBn: 'প্রধান নির্বাহী কর্মকর্তা',
            imageUrl: 'assets/profile2.jpeg',
            displayOrder: 1,
            isActive: true,
            messages: [
                {
                    content: 'A cleaner Dhaka North is our pledge for the future. Every citizen\'s awareness and cooperation will help fulfill that pledge.',
                    contentBn: 'পরিচ্ছন্ন ঢাকা উত্তর আমাদের ভবিষ্যতের অঙ্গীকার। প্রতিটি নাগরিকের সচেতনতা ও সহযোগিতাই এই অঙ্গীকারকে সফল করবে।',
                    displayOrder: 0,
                },
                {
                    content: 'Your small action—disposing waste in the right place—can make our city more livable. Let us move forward together toward a healthy, green, and clean Dhaka North.',
                    contentBn: 'আপনার ছোট্ট উদ্যোগ—সঠিক স্থানে বর্জ্য ফেলানো—আমাদের শহরকে আরও বাসযোগ্য করে তুলতে পারে। চলুন সবাই মিলে একটি সুস্থ, সবুজ ও পরিচ্ছন্ন উত্তরের পথে এগিয়ে যাই।',
                    displayOrder: 1,
                },
                {
                    content: 'In our journey toward cleanliness and transparency, citizens are our strength. Your participation will build a modern and clean Dhaka North.',
                    contentBn: 'স্বচ্ছতা ও পরিচ্ছন্নতার যাত্রায় নাগরিকই আমাদের শক্তি। আপনার অংশগ্রহণই গড়ে তুলবে একটি আধুনিক, পরিচ্ছন্ন ঢাকা উত্তর।',
                    displayOrder: 2,
                },
            ],
        },
        {
            name: 'Md. Shahjahan Miah',
            nameBn: 'মোঃ শাহজাহান মিয়া',
            designation: 'Chief Executive Officer',
            designationBn: 'প্রধান নির্বাহী কর্মকর্তা',
            imageUrl: 'assets/profile3.jpeg',
            displayOrder: 2,
            isActive: true,
            messages: [
                {
                    content: 'A clean Dhaka South is the responsibility of us all. There is no alternative to collective citizen cooperation to keep the city beautiful.',
                    contentBn: 'একটি পরিচ্ছন্ন ঢাকা দক্ষিণ আমাদের সবার দায়িত্ব। শহরকে সুন্দর রাখতে নাগরিক সহযোগিতার কোনো বিকল্প নেই।',
                    displayOrder: 0,
                },
                {
                    content: 'Active participation in waste management will help build a better and more aesthetic Dhaka South. Let us be part of this positive change.',
                    contentBn: 'বর্জ্য ব্যবস্থাপনায় সক্রিয় অংশগ্রহণই একটি উন্নত ও নান্দনিক দক্ষিণ গড়ে তুলতে সাহায্য করবে। চলুন পরিবর্তনের অংশ হই।',
                    displayOrder: 1,
                },
                {
                    content: 'A culture of cleanliness strengthens the development of our families, society, and city. Your awareness as a citizen will make Dhaka South even better.',
                    contentBn: 'পরিচ্ছন্নতার সংস্কৃতি আমাদের পরিবার, সমাজ ও শহরের উন্নয়নকে ত্বরান্বিত করে। নাগরিক হিসেবে আপনার সচেতনতা দক্ষিণ নগরকে আরও উন্নত করবে।',
                    displayOrder: 2,
                },
            ],
        },
    ];

    for (const review of officerReviews) {
        await prisma.officerReview.create({
            data: {
                name: review.name,
                nameBn: review.nameBn,
                designation: review.designation,
                designationBn: review.designationBn,
                imageUrl: review.imageUrl,
                displayOrder: review.displayOrder,
                isActive: review.isActive,
                messages: {
                    create: review.messages,
                },
            },
        });
    }

    console.log('✅ Officer Reviews seeded successfully!');
}

// Run seed if called directly
if (require.main === module) {
    seedOfficerReviews()
        .catch((e) => {
            console.error('❌ Error seeding officer reviews:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

export { seedOfficerReviews };
