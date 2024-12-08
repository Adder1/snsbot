import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getKSTDate } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = getKSTDate();
    today.setHours(0, 0, 0, 0);

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

    return NextResponse.json(dailyMission);
  } catch (error) {
    console.error('Daily mission error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
