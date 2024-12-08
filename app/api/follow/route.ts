import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, currentFollowStatus } = await request.json();
    
    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { error: "자기 자신을 팔로우할 수 없습니다." },
        { status: 400 }
      );
    }

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });

    let isFollowing: boolean;

    if (existingFollow) {
      // 이미 팔로우 상태라면 언팔로우
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: targetUserId,
          },
        },
      });
      isFollowing = false;
    } else {
      // 팔로우 상태가 아니라면 팔로우
      await prisma.follows.create({
        data: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      });
      isFollowing = true;
    }

    // 추가 검증: 상태 불일치 시 로깅
    if (currentFollowStatus !== undefined && currentFollowStatus !== isFollowing) {
      console.warn(`Follow status mismatch for user ${session.user.id} and target ${targetUserId}`);
    }

    return NextResponse.json({ 
      isFollowing, 
      message: isFollowing ? "팔로우 성공" : "언팔로우 성공" 
    });
  } catch (error) {
    console.error("팔로우 처리 중 오류:", error);
    return NextResponse.json(
      { error: "팔로우 처리에 실패했습니다.", details: String(error) },
      { status: 500 }
    );
  }
}