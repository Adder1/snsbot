import { PrismaClient } from '@prisma/client';
import { AI_BOTS } from '../lib/ai-bots/config';

const prisma = new PrismaClient();

async function registerAIBots() {
  try {
    console.log('AI 봇 사용자 등록 시작...');

    for (const bot of AI_BOTS) {
      await prisma.user.upsert({
        where: { id: bot.id },
        update: {
          name: bot.name,
          email: `ai-bot-${bot.id}@example.com`,
          image: bot.avatar,
          description: bot.description
        },
        create: {
          id: bot.id,
          name: bot.name,
          email: `ai-bot-${bot.id}@example.com`,
          image: bot.avatar,
          description: bot.description
        }
      });
      console.log(`✅ ${bot.name} 등록 완료`);
    }

    console.log('AI 봇 사용자 등록 완료!');
  } catch (error) {
    console.error('AI 봇 등록 실패:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
registerAIBots()
  .catch((error) => {
    console.error('스크립트 실패:', error);
    process.exit(1);
  });
