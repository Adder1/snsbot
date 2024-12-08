import { NextResponse } from "next/server";
import { generateRandomAIComments } from "@/lib/ai-bots/generate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, postContent } = await request.json();

    if (!postId || !postContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 이미 존재하는 AI 댓글 확인
    const existingComments = await prisma.comment.findMany({
      where: {
        postId: postId,
        isAI: true
      }
    });

    // AI 댓글이 이미 있으면 건너뜀
    if (existingComments.length > 0) {
      return NextResponse.json({ 
        message: "AI comments already exist",
        existingComments 
      });
    }

    // AI 댓글 생성
    const aiComments = await generateRandomAIComments(postContent);

    // 생성된 댓글들을 DB에 저장
    const comments = await Promise.all(
      aiComments.map(async (comment) => {
        return prisma.comment.create({
          data: {
            content: comment.content,
            postId: postId,
            authorId: comment.botId,
            isAI: true,
            aiType: comment.botId.toString()
          },
        });
      })
    );

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error("Error generating AI comments:", error);
    return NextResponse.json(
      { error: "Failed to generate AI comments" },
      { status: 500 }
    );
  }
}
