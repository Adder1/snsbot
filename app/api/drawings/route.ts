import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evaluateDrawing } from "@/lib/gemini";
import { checkDrawingAchievements } from "@/lib/utils";

const AI_BOTS = [
  { 
    id: 'simribaksa', 
    name: '심리박사AI', 
    avatar: '/ai-avatars/simribaksa.png',
    description: '그림의 심리적 의미를 분석하고 평가합니다.'
  },
  { 
    id: 'parkchanho', 
    name: '박찬호AI', 
    avatar: '/ai-avatars/parkchanho.png',
    description: '야구 레전드의 시각으로 평가하는 전문가'
  },
  {
    id: 'ceo',
    name: '백대표AI',
    avatar: '/ai-avatars/ceo.png',
    description: '실용성과 상업적 가치를 평가하는 CEO'
  },
  {
    id: 'joker',
    name: '조커AI',
    avatar: '/ai-avatars/joker.png',
    description: '독특한 시각으로 작품을 평가하는 광대'
  },
  {
    id: 'ai-egg',
    name: 'AI계란',
    avatar: '/ai-avatars/ai_egg.png',
    description: '에너지와 활력을 평가하는 운동 전문가'
  },
  {
    id: 'jisung',
    name: '박지성AI',
    avatar: '/ai-avatars/jisung.png',
    description: '축구 레전드의 관점으로 평가하는 전문가'
  }
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (!session.user?.id) {
      console.log('No user ID in session:', session);
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 401 }
      );
    }

    // 사용자 존재 여부 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      console.log('User not found:', session.user.id);
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { imageData, description } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: '이미지 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 데이터베이스에 그림 저장
    const drawing = await prisma.drawing.create({
      data: {
        imageUrl: imageData,
        description: description || '',
        authorId: user.id, // 확인된 사용자 ID 사용
        status: 'EVALUATED',
      },
      include: {
        author: true,
        likes: true,
        comments: true,
      },
    });

    // 업적 체크 추가
    await checkDrawingAchievements(user.id);

    // AI 봇 평가 생성
    const bots = await prisma.aIBot.findMany();
    const botEvaluations = await Promise.all(
      bots.map(async (bot: any) => {
        const evaluation = await evaluateDrawing(imageData, bot.id);
        console.log(`Bot ${bot.id} evaluation:`, evaluation); // 디버깅을 위한 로그 추가
        return {
          botId: bot.id,
          drawingId: drawing.id,
          score: evaluation.score,
          comment: evaluation.comment,
        };
      })
    );

    // AI 평가 저장
    await prisma.aIEvaluation.createMany({
      data: botEvaluations,
    });

    // 평균 점수 계산
    const totalScore = botEvaluations.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = Number((totalScore / botEvaluations.length).toFixed(1));
    
    console.log('Total score:', totalScore); // 디버깅을 위한 로그 추가
    console.log('Number of evaluations:', botEvaluations.length);
    console.log('Average score:', averageScore);

    // 평균 점수 업데이트
    await prisma.drawing.update({
      where: { id: drawing.id },
      data: { score: averageScore },
    });

    // 업데이트된 그림 정보 조회
    const updatedDrawing = await prisma.drawing.findUnique({
      where: { id: drawing.id },
      include: {
        author: true,
        likes: true,
        comments: true,
      },
    });

    if (!updatedDrawing) {
      throw new Error('Updated drawing not found');
    }

    return NextResponse.json({
      id: updatedDrawing.id,
      author: {
        id: updatedDrawing.author.id,
        name: updatedDrawing.author.name || '사용자',
        image: updatedDrawing.author.image || '/avatars/default.png',
        badge: 'AI',
      },
      image: updatedDrawing.imageUrl,
      title: '',
      description: updatedDrawing.description || '',
      likes: updatedDrawing.likes.length,
      likeCount: updatedDrawing.likes.length,
      comments: updatedDrawing.comments.length,
      createdAt: updatedDrawing.createdAt.toISOString(),
      aiScores: botEvaluations.map(evaluation => ({
        botId: evaluation.botId,
        avatar: AI_BOTS.find(bot => bot.id === evaluation.botId)?.avatar || '',
        score: evaluation.score,
        comment: evaluation.comment,
      })),
      score: averageScore,
    });
  } catch (error) {
    console.error('Error in POST /api/drawings:', error);
    return NextResponse.json(
      { error: '그림 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const cursor = searchParams.get('cursor');
    const limit = 10;
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const drawings = await prisma.drawing.findMany({
      where: userId ? { authorId: userId } : {},
      include: {
        author: true,
        likes: true,
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          }
        },
        evaluations: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      ...(cursor && {
        cursor: {
          id: cursor
        },
        skip: 1
      })
    });

    const formattedDrawings = drawings.map((drawing: any) => ({
      id: drawing.id,
      title: drawing.title || '',
      description: drawing.description || '',
      image: drawing.imageUrl,
      createdAt: drawing.createdAt.toISOString(),
      author: {
        id: drawing.author.id,
        name: drawing.author.name || '사용자',
        nickname: drawing.author.nickname || '',
        image: drawing.author.image || '/avatars/default.png',
        badge: 'AI',
      },
      likeCount: drawing.likes.length,
      comments: drawing.comments.length,
      isLiked: currentUserId ? drawing.likes.some((like: any) => like.userId === currentUserId) : false,
      score: drawing.score || 0,
      aiScores: drawing.evaluations.map((evaluation: any) => ({
        avatar: AI_BOTS.find(bot => bot.id === evaluation.botId)?.avatar || '',
        score: evaluation.score,
      })),
    }));

    return NextResponse.json({
      drawings: formattedDrawings,
      nextCursor: drawings.length === limit ? drawings[drawings.length - 1].id : undefined
    });

  } catch (error) {
    console.error('Error in GET /api/drawings:', error);
    return NextResponse.json(
      { error: '그림 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'
