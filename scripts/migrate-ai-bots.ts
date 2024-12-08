import { PrismaClient } from '@prisma/client';
import { AI_BOTS } from '../lib/ai-bots/config';

const prisma = new PrismaClient();

// 기존 봇 ID와 새로운 봇 ID 매핑
const BOT_ID_MAPPING = {
  'tech-expert': 'parkchanho',    // 기술전문가 -> 박찬호AI
  'creative-director': 'jisung',   // 크리에이티브 디렉터 -> 박지성AI
  'art-critic': 'simribaksa',     // 심리박사(art-critic) -> 심리박사AI(simribaksa)
  'ceo': 'ceo',                   // 백대표AI (변경 없음)
  'joker': 'joker',               // 조커AI (변경 없음)
  'ai-egg': 'ai-egg'              // AI계란 (변경 없음)
};

async function migrateAIBots() {
  try {
    console.log('AI 봇 마이그레이션 시작...');

    // 1. 기존 평가 데이터의 botId 업데이트
    for (const [oldId, newId] of Object.entries(BOT_ID_MAPPING)) {
      const updateCount = await prisma.aIEvaluation.updateMany({
        where: { botId: oldId },
        data: { botId: newId }
      });
      console.log(`${oldId} -> ${newId} 평가 데이터 업데이트: ${updateCount.count}개`);
    }

    // 2. 봇 데이터 업데이트 또는 생성
    for (const bot of AI_BOTS) {
      await prisma.aIBot.upsert({
        where: { id: bot.id },
        update: {
          name: bot.name,
          avatar: bot.avatar,
          description: bot.description
        },
        create: {
          id: bot.id,
          name: bot.name,
          avatar: bot.avatar,
          description: bot.description
        }
      });
      console.log(`봇 업데이트/생성 완료: ${bot.name} (${bot.id})`);
    }

    console.log('AI 봇 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
migrateAIBots()
  .catch((error) => {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  });
