import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { prisma } from "@/lib/prisma"
import { io } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { Achievement, ACHIEVEMENTS } from "./achievements";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function getXPForNextLevel(xp: number): number {
  return 200 - (xp % 200);
}

// KST 기준으로 오늘 날짜 가져오기
export function getKSTDate(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (9 * 60 * 60 * 1000));
}

// 업적 달성 체크 및 보상 지급 함수
export async function checkAndAwardAchievement(userId: string, achievementId: string) {
  console.log(`Checking achievement ${achievementId} for user ${userId}`);
  
  // 이미 획득한 업적인지 확인
  const existingAchievement = await prisma.userAchievement.findFirst({
    where: {
      userId,
      achievementId
    }
  });

  if (existingAchievement) {
    console.log(`Achievement ${achievementId} already awarded to user ${userId}`);
    return;
  }

  // 업적 정보 조회
  const achievement = ACHIEVEMENTS.find((a: Achievement) => a.id === achievementId);
  if (!achievement) {
    console.error(`Achievement ${achievementId} not found`);
    return;
  }

  console.log(`Awarding achievement ${achievementId} to user ${userId}`);
  
  // 업적 부여
  await prisma.userAchievement.create({
    data: {
      userId,
      achievementId,
      achievedAt: new Date()
    }
  });

  // 알림 생성
  await createNotification(
    userId,
    'ACHIEVEMENT',
    '새로운 업적 달성!',
    `"${achievement.title}" 업적을 달성하여 ${achievement.xpReward}XP를 획득했습니다!`,
    '/achievements'
  );

  console.log(`Achievement ${achievementId} successfully awarded to user ${userId}`);
}

// 특정 조건의 업적 체크 함수들
export async function checkPostAchievements(userId: string) {
  try {
    console.log("checkPostAchievements 시작", userId);
    
    const postCount = await prisma.post.count({
      where: { authorId: userId }
    });

    console.log("게시물 수 확인:", postCount);

    if (postCount === 1) {
      console.log("첫 게시물 업적 체크");
      await checkAndAwardAchievement(userId, 'first-post');
    }
    if (postCount === 10) {
      console.log("10개 게시물 업적 체크");
      await checkAndAwardAchievement(userId, 'post-master');
    }
  } catch (error) {
    console.error("checkPostAchievements 오류:", error);
    throw error;
  }
}

export async function checkCommentAchievements(userId: string) {
  const commentCount = await prisma.comment.count({
    where: { authorId: userId }
  });

  if (commentCount === 1) {
    await checkAndAwardAchievement(userId, 'first-comment');
  }
  if (commentCount === 30) {
    await checkAndAwardAchievement(userId, 'comment-master');
  }
}

export async function checkLikeAchievements(userId: string) {
  const likeCount = await prisma.like.count({
    where: {
      post: {
        authorId: userId
      }
    }
  });

  if (likeCount === 1) {
    await checkAndAwardAchievement(userId, 'first-like-received');
  }
  if (likeCount === 50) {
    await checkAndAwardAchievement(userId, 'like-master');
  }
}

// 그림 관련 업적 체크
export async function checkDrawingAchievements(userId: string) {
  const drawingCount = await prisma.drawing.count({
    where: { authorId: userId }
  });

  if (drawingCount === 1) {
    await checkAndAwardAchievement(userId, 'first-drawing');
  }
  if (drawingCount === 10) {
    await checkAndAwardAchievement(userId, 'drawing-master');
  }
}

// 일일미션 관련 업적 체크
export async function checkDailyMissionAchievements(userId: string) {
  const missions = await prisma.dailyMission.findMany({
    where: { 
      userId,
      postCompleted: true,
      drawCompleted: true,
      commentCompleted: true,
      bonusCompleted: true
    },
    orderBy: { date: 'desc' }
  });

  if (missions.length === 1) {
    await checkAndAwardAchievement(userId, 'daily-mission-complete');
  }

  // 연속 5일 체크
  if (missions.length >= 5) {
    const lastFiveDays = missions.slice(0, 5);
    const isStreak = lastFiveDays.every((mission, index, array) => {
      if (index === 0) return true;
      const prevDate = new Date(array[index - 1].date);
      const currentDate = new Date(mission.date);
      const diffDays = (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays === 1;
    });

    if (isStreak) {
      await checkAndAwardAchievement(userId, 'daily-mission-streak');
    }
  }
}

// 레벨 관련 업적 체크
export async function checkLevelAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true }
  });

  if (!user) return;

  if (user.level === 10) {
    await checkAndAwardAchievement(userId, 'level-10');
  }
  if (user.level === 30) {
    await checkAndAwardAchievement(userId, 'level-30');
  }
}

// 알림 생성 함수
export async function createNotification(
  userId: string,
  type: 'COMMENT' | 'AI_EVALUATION' | 'ACHIEVEMENT' | 'DAILY_MISSION' | 'LEVEL_UP',
  title: string,
  content: string,
  link?: string
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      link,
    },
  });

  // Socket.IO를 통해 실시간 알림 전송
  const socket = getSocket();
  if (socket) {
    socket.emit('newNotification', { userId, notification });
  }

  return notification;
}
