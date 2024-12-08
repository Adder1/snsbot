import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkLikeAchievements } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { drawingId } = await request.json();
    if (!drawingId) {
      return NextResponse.json(
        { error: "Drawing ID is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // 기존 좋아요 확인
    const existingLike = await prisma.like.findFirst({
      where: {
        userId,
        drawingId,
      },
    });

    if (existingLike) {
      // 좋아요 취소
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      // 좋아요 추가
      await prisma.like.create({
        data: {
          userId,
          drawingId,
        },
      });

      // 그림 작성자의 업적 체크
      const drawing = await prisma.drawing.findUnique({
        where: { id: drawingId },
        select: { authorId: true }
      });
      
      if (drawing) {
        await checkLikeAchievements(drawing.authorId);
      }
    }

    // 좋아요 수 계산
    const likeCount = await prisma.like.count({
      where: {
        drawingId,
      },
    });

    return NextResponse.json({ 
      success: true,
      isLiked: !existingLike,
      likeCount,
    });
  } catch (error) {
    console.error("Error in like drawing:", error);
    return NextResponse.json(
      { error: "Failed to process like" },
      { status: 500 }
    );
  }
}
