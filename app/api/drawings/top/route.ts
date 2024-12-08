import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const topDrawings = await prisma.drawing.findMany({
      where: {
        score: {
          not: null
        }
      },
      select: {
        id: true,
        imageUrl: true,
        score: true,
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
          }
        }
      },
      orderBy: {
        score: 'desc'
      },
      take: 18 // TOP 3 + 추가 15개
    });

    return NextResponse.json({ topDrawings });
  } catch (error) {
    console.error('Error fetching top drawings:', error);
    return NextResponse.json(
      { error: "Failed to fetch top drawings" },
      { status: 500 }
    );
  }
} 