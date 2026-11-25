import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.adminUser.deleteMany({ where: { email: 'admin@example.com' } });
  console.log('Deleted old admin');
}

main()
  .catch((error) => console.error(error))
  .finally(async () => { await prisma.$disconnect(); });