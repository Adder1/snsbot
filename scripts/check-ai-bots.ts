import { PrismaClient } from '@prisma/client';
import { AI_BOTS } from '../lib/ai-bots/config';

const prisma = new PrismaClient();

async function checkAIBots() {
  console.log('AI 봇 정보 확인 중...');

  for (const bot of AI_BOTS) {
    const user = await prisma.user.findUnique({
      where: { id: bot.id.toString() }
    });
    console.log(`${bot.name}:`, user);
  }

  await prisma.$disconnect();
}

checkAIBots()
  .catch(console.error);
