import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: params.id,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
          },
        },
      },
    });

    if (post.authorId !== user.id) {
      await createNotification(
        post.authorId,
        'COMMENT',
        '새로운 댓글',
        `${comment.author.nickname || comment.author.name}님이 회원님의 게시물에 댓글을 남겼습니다: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
        `/post/${params.id}`
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyMission = await prisma.dailyMission.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    if (dailyMission) {
      const updatedCount = dailyMission.commentCount + 1;
      const shouldComplete = updatedCount >= 3 && !dailyMission.commentCompleted;

      await prisma.dailyMission.update({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          },
        },
        data: {
          commentCount: updatedCount,
          commentCompleted: shouldComplete ? true : dailyMission.commentCompleted,
        },
      });

      if (shouldComplete) {
        await createNotification(
          user.id,
          'DAILY_MISSION',
          '댓글 미션 완료!',
          '오늘의 댓글 미션을 완료하여 30XP를 획득했습니다!',
          '/daily-mission'
        );
      }
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
