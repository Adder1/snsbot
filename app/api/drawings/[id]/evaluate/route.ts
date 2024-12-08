import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drawingId = params.id;

    // 그림 존재 여부 확인
    const drawing = await prisma.drawing.findUnique({
      where: { id: drawingId },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            name: true,
          }
        }
      }
    });

    if (!drawing) {
      return NextResponse.json(
        { error: '그림을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // AI 봇 목록 가져오기
    const bots = await prisma.aIBot.findMany();

    // 각 AI 봇의 평가 생성
    const evaluations = await Promise.all(
      bots.map(async (bot) => {
        const score = Math.floor(Math.random() * 41) + 60;
        let comment = '';
        if (score >= 90) {
          comment = '탁월한 작품입니다. 예술적 완성도가 매우 높습니다.';
        } else if (score >= 80) {
          comment = '우수한 작품입니다. 창의성이 돋보입니다.';
        } else if (score >= 70) {
          comment = '좋은 작품입니다. 계속해서 발전해 나가세요.';
        } else {
          comment = '기본기를 잘 갖추었습니다. 더 많은 연습을 추천드립니다.';
        }

        return prisma.aIEvaluation.create({
          data: {
            score: score,
            comment: comment,
            botId: bot.id,
            drawingId: drawingId,
          },
        });
      })
    );

    // 평균 점수 계산
    const avgScore = evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length;

    // 그림의 상태를 EVALUATED로 업데이트
    await prisma.drawing.update({
      where: { id: drawingId },
      data: { 
        status: 'EVALUATED',
        score: avgScore
      },
    });

    // AI 평가 알림 생성
    await createNotification(
      drawing.author.id,
      'AI_EVALUATION',
      'AI 평가 완료',
      `회원님의 그림이 AI에 의해 평가되었습니다. 평균 점수: ${avgScore.toFixed(1)}점`,
      `/drawing/${drawingId}`
    );

    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error('Error creating evaluations:', error);
    return NextResponse.json(
      { error: '평가 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
