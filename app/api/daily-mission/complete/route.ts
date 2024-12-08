import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getKSTDate, createNotification, checkLevelAchievements, checkDailyMissionAchievements } from "@/lib/utils";
import { checkAndAwardAchievement } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { missionType } = await request.json();
    const today = getKSTDate();
    today.setHours(0, 0, 0, 0);

    // 현재 미션 상태 조회
    let dailyMission = await prisma.dailyMission.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    if (!dailyMission) {
      dailyMission = await prisma.dailyMission.create({
        data: {
          userId: session.user.id,
          date: today,
        },
      });
    }

    // 이미 완료된 미션인지 확인
    if (
      (missionType === 'post' && dailyMission.postCompleted) ||
      (missionType === 'draw' && dailyMission.drawCompleted) ||
      (missionType === 'comment' && dailyMission.commentCompleted)
    ) {
      return NextResponse.json(
        { error: "Mission already completed" },
        { status: 400 }
      );
    }

    let xpToAdd = 0;
    let updateData: any = {};

    // 미션 타입별 처리
    switch (missionType) {
      case 'post':
        xpToAdd = 50;
        updateData.postCompleted = true;
        // 글쓰기 미션 완료 알림
        await createNotification(
          session.user.id,
          'DAILY_MISSION',
          '글쓰기 미션 완료!',
          '오늘의 글쓰기 미션을 완료하여 50XP를 획득했습니다!',
          '/daily-mission'
        );
        break;
      case 'draw':
        xpToAdd = 80;
        updateData.drawCompleted = true;
        // 그림 그리기 미션 완료 알림
        await createNotification(
          session.user.id,
          'DAILY_MISSION',
          '그림 그리기 미션 완료!',
          '오늘의 그림 그리기 미션을 완료하여 80XP를 획득했습니다!',
          '/daily-mission'
        );
        break;
      case 'comment':
        // 댓글 카운트 증가
        updateData.commentCount = dailyMission.commentCount + 1;
        
        // 3개 달성 시 완료 처리 및 경험치 부여
        if (updateData.commentCount >= 3 && !dailyMission.commentCompleted) {
          xpToAdd = 30;
          updateData.commentCompleted = true;
          // 댓글 미션 완료 알림
          await createNotification(
            session.user.id,
            'DAILY_MISSION',
            '댓글 미션 완료!',
            '오늘의 댓글 미션을 완료하여 30XP를 획득했습니다!',
            '/daily-mission'
          );
        }
        break;
      default:
        return NextResponse.json(
          { error: "Invalid mission type" },
          { status: 400 }
        );
    }

    // 미션 상태 업데이트
    const updatedMission = await prisma.dailyMission.update({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
      data: updateData,
    });

    // 모든 미션이 완료되었고 보너스를 아직 받지 않았다면 보너스 경험치 추가
    if (
      updatedMission.postCompleted &&
      updatedMission.drawCompleted &&
      updatedMission.commentCompleted &&
      !updatedMission.bonusCompleted
    ) {
      xpToAdd += 100;
      await prisma.dailyMission.update({
        where: {
          userId_date: {
            userId: session.user.id,
            date: today,
          },
        },
        data: {
          bonusCompleted: true,
        },
      });

      // 모든 미션이 완료되었을 때 알림 생성
      await createNotification(
        session.user.id,
        'DAILY_MISSION',
        '일일 미션 완료!',
        '축하합니다! 오늘의 모든 미션을 완료하여 보너스 100XP를 획득했습니다!',
        '/daily-mission'
      );

      // 일일 미션 첫 완료 업적 체크 추가
      // 업적 체크
      await checkDailyMissionAchievements(session.user.id);
    }

    let newXp = 0;
    let newLevel = 1;

    // 경험치 부여 및 레벨업 처리
    if (xpToAdd > 0) {
      // 가장 최신 유저 정보 조회
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { xp: true, level: true },
      });

      if (user) {
        newXp = user.xp + xpToAdd;
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

        // 경험치와 레벨 업데이트를 마지막에 수행
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            xp: newXp,
            level: newLevel,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      xpGained: xpToAdd,
      mission: updatedMission,
      newXp,  // 변수로 저장된 값 사용
      newLevel  // 변수로 저장된 값 사용
    });
  } catch (error) {
    console.error('Mission completion error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 