import { PrismaClient } from '@prisma/client';
import { AI_BOTS } from '../lib/ai-bots/config';

const prisma = new PrismaClient();

async function createAIBots() {
  console.log('AI 봇 사용자 생성 시작...');

  for (const bot of AI_BOTS) {
    try {
      const user = await prisma.user.upsert({
        where: { id: bot.id.toString() },
        update: {
          name: bot.name,
          nickname: bot.name,
          description: bot.personality,
          image: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + bot.name,
        },
        create: {
          id: bot.id.toString(),
          email: `ai-bot-${bot.id}@example.com`,
          name: bot.name,
          nickname: bot.name,
          description: bot.personality,
          image: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + bot.name,
        },
      });
      console.log(`✅ 생성됨: ${user.name} (ID: ${user.id})`);
    } catch (error) {
      console.error(`❌ 실패: ${bot.name}`, error);
    }
  }

  console.log('AI 봇 사용자 생성 완료!');
}

createAIBots()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
