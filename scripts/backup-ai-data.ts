import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupAIData() {
  try {
    // AI 봇 데이터 백업
    const bots = await prisma.aIBot.findMany();
    
    // AI 평가 데이터 백업
    const evaluations = await prisma.aIEvaluation.findMany({
      include: {
        bot: true,
        drawing: {
          include: {
            author: true
          }
        }
      }
    });

    // AI 분석 데이터 백업
    const analyses = await prisma.aIAnalysis.findMany({
      include: {
        drawing: {
          include: {
            author: true
          }
        }
      }
    });

    // 백업 데이터 생성
    const backupData = {
      timestamp: new Date().toISOString(),
      bots,
      evaluations,
      analyses
    };

    // 백업 디렉토리 생성
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // 백업 파일 저장
    const backupPath = path.join(backupDir, `ai-data-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`백업이 완료되었습니다: ${backupPath}`);
  } catch (error) {
    console.error('백업 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupAIData();
