const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Find a user with complaints
    const user = await prisma.user.findFirst({
      where: {
        role: 'CUSTOMER',
        complaints: {
          some: {}
        }
      }
    });

    if (!user) {
      console.log('No user with complaints found');
      return;
    }

    console.log(`Found user: ${user.firstName} ${user.lastName}`);
    console.log(`Phone: ${user.phone}`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log('✅ Password reset to: Test@123');
    console.log(`\nYou can now login with:`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Password: Test@123`);

  } catch (error) {
    console.error('Error:', error.message)