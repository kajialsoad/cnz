"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const w207 = await prisma.ward.findUnique({ where: { id: 207 }, select: { id: true, wardNumber: true } });
    // Ward model doesn't have a 'name' field in schema provided earlier!
    // Let me check schema again.
    // model Ward { ... wardNumber Int?, number Int ... }
    // No 'name' field. 
    // It has 'inspectorName', but not ward name.
    // Frontend displays `displayName` which probably uses `wardNumber`.
    // Wait, let's check `ward_model.dart`.
}
main().finally(() => prisma.$disconnect());
