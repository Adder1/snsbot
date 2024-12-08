import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getKSTDate, createNotification, checkLevelAchievements } from "@/lib/utils";
import { ACHIEVEMENTS } from "@/lib/achievements";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { achievementId } = await request.json();
    const achievement = ACHIEVEMENTS.find((a: { id: string }) => a.id === achievementId);
    
    if (!achievement) {
      return NextResponse.json(
        { error: "Achievement not found" },
        { status: 404 }
      );
    }

    // 이미 달성한 업적인지 확인
    const existingAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: session.user.id,
          achievementId: achievementId
        }
      }
    });

    if (existingAchievement) {
      return NextResponse.json(
        { error: "Achievement already completed" },
        { status: 400 }
      );
    }

    // 업적 달성 기록
    await prisma.userAchievement.create({
      data: {
        userId: session.user.id,
        achievementId: achievementId,
        achievedAt: new Date()
      }
    });

    // 경험치 부여
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, level: true }
    });

    let newXp = 0;
    let newLevel = 1;

    if (user) {
      newXp = user.xp + achievement.xpReward;
      newLevel = Math.floor(newXp / 200) + 1;

      // 레벨업 했을 경우
      if (newLevel > user.level) {
        // 레벨업 알림 생성
        await createNotification(
          session.user.id,
          'LEVEL_UP',
          '레벨 업!',
          `축하합니다! 레벨이 ${user.level}에서 ${newLevel}로 상승했습니다!`,
          '/profile'
        );

        // 레벨 업적 체크
        await checkLevelAchievements(session.user.id);
      }

      // 업적 달성 알림 생성
      await createNotification(
        session.user.id,
        'ACHIEVEMENT',
        '새로운 업적 달성!',
        `"${achievement.title}" 업적을 달성하여 ${achievement.xpReward}XP를 획득했습니다!`,
        '/achievements'
      );

      // 경험치와 레벨 업데이트를 마지막에 수행
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          xp: newXp,
          level: newLevel
        }
      });
    }

    return NextResponse.json({
      success: true,
      xpGained: achievement.xpReward,
      newXp,  // 변수로 저장된 값 사용
      newLevel  // 변수로 저장된 값 사용
    });
  } catch (error) {
    console.error('Achievement completion error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 