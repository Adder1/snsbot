import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ACHIEVEMENTS } from "@/lib/achievements";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자의 달성 업적 가져오기
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: session.user.id
      }
    });

    // 전체 업적 목록에 달성 여부 추가
    const achievements = ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      achievedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.achievedAt || null
    }));

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 