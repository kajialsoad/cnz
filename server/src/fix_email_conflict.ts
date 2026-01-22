
import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEmailConflict() {
    const email = 'rajibmiah724@gmail.com';
    const conflictingUserId = 426; // ID found in previous step

    console.log(`Fixing conflict for email: ${email}`);

    // Update the conflicting user
    const updatedUser = await prisma.user.update({
        where: { id: conflictingUserId },
        data: {
            email: `rajibmiah724_old@gmail.com`, // Rename email
            status: UserStatus.INACTIVE // Mark as inactive (optional but good for cleanup)
        }
    });

    console.log('Conflicting user updated:', updatedUser);
}

fixEmailConflict()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
