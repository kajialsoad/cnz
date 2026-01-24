"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkEmail() {
    const email = 'rajibmiah724@gmail.com';
    console.log(`Checking for user with email: ${email}`);
    const user = await prisma.user.findFirst({
        where: {
            email: email
        }
    });
    if (user) {
        console.log('User found:', user);
    }
    else {
        console.log('No user found with this email.');
    }
}
checkEmail()
    .catch(e => console.error(e))
    .finally(async () => {
    await prisma.$disconnect();
});
