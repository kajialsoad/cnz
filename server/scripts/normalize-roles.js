const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Normalizing roles: CUSTOMER/SERVICE_PROVIDER → ADMIN');
  const result = await prisma.user.updateMany({
    where: { role: { in: ['CUSTOMER', 'SERVICE_PROVIDER'] } },
    data: { role: 'ADMIN' },
  });
  console.log(`✅ Updated ${result.count} users`);
}

main()
  .catch((e) => { console.error('❌ Role normalization failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

