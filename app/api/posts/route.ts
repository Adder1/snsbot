import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRandomAIComments } from "@/lib/ai-bots/generate";
import { logAIBotActivity } from "@/lib/logger";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { checkAndAwardAchievement, checkPostAchievements } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');  // 커서 기반 페이지네이션
  const limit = 10;  // 한 번에 가져올 게시물 수

  try {
    const posts = await prisma.post.findMany({
      where: {
        isPrivate: false,
      },
      select: {
        id: true,
        content: true,
        style: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
          }
        },
        _count: true,
        likes: {
          select: {
            userId: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      ...(cursor && {
        cursor: {
          id: cursor
        },
        skip: 1  // 현재 커서는 제외
      })
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : undefined;

    return NextResponse.json({
      posts,
      nextCursor
    });
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log("=== POST /api/posts 시작 ===");
  
  try {
    const session = await getServerSession(authOptions);
    console.log("세션 확인:", !!session);
    
    if (!session?.user?.id) {
      console.log("인증되지 않은 요청");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("인증된 사용자:", session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("게시물 생성 시작:", user.id);

    const { content, style, isPrivate, allowComments, blockAI } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // 트랜잭션으로 묶어서 처리
    const result = await prisma.$transaction(async (tx) => {
      // 게시물 생성
      const post = await tx.post.create({
        data: {
          content,
          authorId: user.id,
          style,
          isPrivate,
          allowComments,
          allowAI: !blockAI,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              nickname: true,
              image: true,
            }
          }
        }
      });

      // 게시물 수 확인
      const postCount = await tx.post.count({
        where: { authorId: user.id }
      });

      // 업적 체크
      if (postCount === 1) {
        await checkAndAwardAchievement(user.id, 'first-post');
      }
      if (postCount === 10) {
        await checkAndAwardAchievement(user.id, 'post-master');
      }

      return post;
    });

    // AI 댓글 자동 생성 (비공개가 아니고 AI 댓글이 허용된 경우)
    if (!isPrivate && !blockAI) {
      try {
        logAIBotActivity("시작: 게시물에 대한 AI 댓글 생성", {
          postId: result.id,
          content: content.substring(0, 100) + "..."
        });

        // 모든 AI 봇이 각각 1개씩 댓글 생성
        const aiComments = await generateRandomAIComments(content);
        
        // 이미 존재하는 AI 댓글 확인
        const existingComments = await prisma.comment.findMany({
          where: {
            postId: result.id,
            isAI: true
          }
        });

        // AI 댓글이 없는 경우에만 저장
        if (existingComments.length === 0) {
          const savedComments = await Promise.all(
            aiComments.map(async (comment) => {
              return prisma.comment.create({
                data: {
                  content: comment.content,
                  postId: result.id,
                  authorId: comment.botId,
                  isAI: true,
                  aiType: comment.botId.toString(),
                },
              });
            })
          );

          logAIBotActivity("완료: AI 댓글 저장", {
            postId: result.id,
            savedComments: savedComments.map(c => ({
              id: c.id,
              content: c.content.substring(0, 100) + "..."
            }))
          });
        } else {
          logAIBotActivity("건너뜀: 이미 AI 댓글이 존재함", {
            postId: result.id,
            existingCommentsCount: existingComments.length
          });
        }

      } catch (error: any) {
        logAIBotActivity("오류: AI 댓글 생성 실패", {
          postId: result.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error("Error generating AI comments:", error);
        // AI 댓글 생성 실패해도 게시물 생성은 성공으로 처리
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
} 