import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkCommentAchievements, createNotification } from "@/lib/utils";
import { generateAIReply } from "@/lib/ai-bots/generate";

type Params = {
  params: Promise<{ id: string }>;
};

interface CommentResponse {
  id: string;
  content: string;
  author: {
    id: string;
    name: string | null;
    nickname?: string | null;
    image: string | null;
  };
  replies: any[];
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, parentId } = await request.json();
    const comment = await prisma.comment.create({
      data: {
        content,
        postId: id,
        authorId: session.user.id,
        parentId: parentId || null,
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
        post: {
          select: {
            authorId: true,
            content: true,
          }
        },
        parent: {
          select: {
            authorId: true,
            content: true,
            isAI: true,
            aiType: true,
            author: {
              select: {
                id: true,
                name: true,
                nickname: true,
                image: true,
              }
            }
          }
        }
      },
    });

    // AI 봇의 댓글에 대한 대댓글인 경우, AI 봇이 자동으로 답글을 생성
    let aiReplyComment = null;
    if (parentId && comment.parent?.isAI && comment.parent.aiType) {
      try {
        console.log("AI 봇 답글 생성 시작", {
          postId: id,
          parentCommentId: parentId,
          userComment: content
        });

        const aiReply = await generateAIReply(
          content,
          comment.parent.aiType,
          comment.post?.content || ""
        );

        aiReplyComment = await prisma.comment.create({
          data: {
            content: aiReply,
            postId: id,
            authorId: comment.parent.authorId,
            parentId: comment.id,
            isAI: true,
            aiType: comment.parent.aiType
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                nickname: true,
                image: true,
              }
            },
            parent: true
          }
        });

        console.log("AI 봇 답글 생성 완료", {
          postId: id,
          parentCommentId: comment.id,
          aiReply: aiReply.substring(0, 100)
        });
      } catch (error) {
        console.error("AI 봇 답글 생성 실패:", error);
      }
    }

    // 게시물 작성자에게 알림
    if (comment.post?.authorId !== session.user.id) {
      await createNotification(
        comment.post!.authorId,
        'COMMENT',
        '새로운 댓글',
        `${comment.author.nickname || comment.author.name}님이 회원님의 게시물에 댓글을 남겼습니다: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
        `/post/${id}`
      );
    }

    // 대댓글인 경우 원 댓글 작성자에게도 알림
    if (parentId && comment.parent?.authorId && comment.parent.authorId !== session.user.id) {
      await createNotification(
        comment.parent.authorId,
        'COMMENT',
        '새로운 답글',
        `${comment.author.nickname || comment.author.name}님이 회원님의 댓글에 답글을 남겼습니다: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
        `/post/${id}`
      );
    }

    // 업적 체크
    await checkCommentAchievements(session.user.id);

    const commentResponse: CommentResponse = {
      ...comment,
      author: {
        id: session.user.id,
        name: session.user.name || null,
        nickname: comment.author.nickname || null,
        image: session.user.image || null,
      },
      replies: []
    };

    const aiReplyResponse = aiReplyComment ? {
      ...aiReplyComment,
      replies: []
    } : null;

    return NextResponse.json({ 
      comment: commentResponse,
      aiReply: aiReplyResponse
    });

  } catch (error) {
    console.error("Error in comment creation:", error);
    return NextResponse.json(
      { error: "댓글 작성에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: {
        postId: id,
        parentId: null,
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
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                nickname: true,
                image: true,
              },
            },
            replies: {
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
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const total = await prisma.comment.count({
      where: {
        postId: id,
        parentId: null,
      },
    });

    return NextResponse.json({
      comments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "댓글을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}