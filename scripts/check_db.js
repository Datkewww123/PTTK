const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  try {
    const c = await prisma.store.count();
    console.log('stores:', c);
  } catch (e) {
    console.error('ERROR', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
