import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const DATABASE_URL = 'postgresql://lba:local-postgres-password@localhost:5432/lba';
const adapter = new PrismaPg(DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'test@hireflow.dev';
  const password = 'TestPassword123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
    console.log('User already exists — emailVerifiedAt updated.');
    return;
  }

  const passwordHash = await argon2.hash(password, { memoryCost: 65536, timeCost: 3, parallelism: 4 });
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Test User',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Created user: ${email} / ${password}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
