const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  try {
    const stores = await prisma.store.findMany({ select: { id: true, userId: true, name: true, username: true, status: true } });
    console.log('stores:', JSON.stringify(stores, null, 2));
  } catch (e) {
    console.error('ERROR', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
