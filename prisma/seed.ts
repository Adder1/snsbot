import { PrismaClient } from '@prisma/client';
import { AI_BOTS } from '../lib/ai-bots/config';

const prisma = new PrismaClient();

async function main() {
  // AI 봇 생성
  for (const bot of AI_BOTS) {
    await prisma.aIBot.upsert({
      where: { id: bot.id },
      update: {
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        description: bot.description,
      },
      create: {
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        description: bot.description,
      },
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
