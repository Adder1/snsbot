import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ACHIEVEMENTS } from "@/lib/achievements";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { postId, drawingId } = await request.json();
    const userId = session.user.id;

    if (!postId && !drawingId) {
      return new Response("Post ID or Drawing ID is required", { status: 400 });
    }

    // 기존 좋아요 확인
    const existingLike = await prisma.like.findFirst({
      where: {
        userId,
        ...(postId ? { postId } : { drawingId }),
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
          ...(postId ? { postId } : { drawingId }),
        },
      });

      // 게시물 작성자의 첫 좋아요 업적 체크
      if (postId) {
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { authorId: true }
        });

        if (post) {
          try {
            await fetch("/api/achievements/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: post.authorId,
                achievementId: 'first-like-received'
              })
            });
          } catch (error) {
            console.error("업적 체크 실패:", error);
          }
        }
      }
    }

    // 좋아요 수 계산
    const likeCount = await prisma.like.count({
      where: {
        ...(postId ? { postId } : { drawingId }),
      },
    });

    return NextResponse.json({ 
      success: true,
      isLiked: !existingLike,
      likeCount,
    });
  } catch (error) {
    console.error("Error handling like:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
