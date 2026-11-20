import 'dotenv/config';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD;
const name = process.env.INITIAL_ADMIN_NAME?.trim() || 'Store owner';

if (!connectionString) {
  throw new Error('Set DATABASE_URL before creating the initial owner.');
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Set a valid INITIAL_ADMIN_EMAIL in the process environment.');
}
const ownerEmail = email;
if (!password || password.length < 14) {
  throw new Error('Set INITIAL_ADMIN_PASSWORD to a unique password of at least 14 characters.');
}
const ownerPassword = password;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const owners = await prisma.adminUser.findMany({ where: { role: 'OWNER' } });
  if (owners.some((owner) => owner.email !== ownerEmail)) {
    throw new Error('An owner already exists. Use the existing owner account or perform a reviewed recovery procedure.');
  }

  const passwordHash = await argon2.hash(ownerPassword, { type: argon2.argon2id });
  const user = await prisma.adminUser.upsert({
    where: { email: ownerEmail },
    create: { email: ownerEmail, name, passwordHash, role: 'OWNER', isActive: true },
    update: { name, passwordHash, role: 'OWNER', isActive: true },
    select: { email: true, role: true },
  });

  console.log('Owner account is ready for sign-in: ' + user.email);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Owner account setup failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

