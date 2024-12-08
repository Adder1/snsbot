import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 사용자 정보 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = 'then' in params ? await params : params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nickname: true,
        image: true,
        description: true,
        xp: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            drawings: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 로그인한 사용자인 경우 팔로우 상태 확인
    let isFollowing = false;
    if (userId) {
      const followStatus = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: id,
          },
        },
      });
      isFollowing = !!followStatus;
    }

    return NextResponse.json({
      ...user,
      isFollowing,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 사용자 정보 수정
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Full Session in PATCH:", JSON.stringify(session, null, 2));
    console.log("Request params ID:", params.id);
    
    // 세션 전체 검증
    if (!session) {
      console.log("No session found");
      return NextResponse.json(
        { error: "세션이 만료되었습니다. 다시 로그인해주세요.", code: "NO_SESSION" },
        { status: 401 }
      );
    }

    if (!session.user) {
      console.log("No user in session");
      return NextResponse.json(
        { error: "유효하지 않은 세션입니다.", code: "INVALID_SESSION" },
        { status: 401 }
      );
    }

    // 세션 사용자 ID 추출 및 검증
    const sessionUserId = session.user.id;
    console.log("Extracted Session User ID:", sessionUserId);
    
    if (!sessionUserId) {
      console.log("Session user ID is empty");
      return NextResponse.json(
        { 
          error: "사용자 인증에 실패했습니다.", 
          code: "EMPTY_USER_ID",
          sessionUser: session.user 
        },
        { status: 401 }
      );
    }
    
    // 요청한 ID와 세션 사용자 ID 불일치
    if (sessionUserId !== params.id) {
      console.log(`Session user ID (${sessionUserId}) does not match params ID (${params.id})`);
      return NextResponse.json(
        { error: "권한이 없습니다.", code: "ID_MISMATCH" },
        { status: 403 }
      );
    }

    const data = await request.json();
    console.log("Received data:", data);
    
    // 닉네임 유효성 검사 추가
    if (data.nickname && data.nickname.length > 10) {
      return NextResponse.json(
        { error: "닉네임은 10자 이내로 입력해주세요.", code: "NICKNAME_TOO_LONG" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        nickname: data.nickname || undefined,
        description: data.description || undefined,
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        description: true,
        image: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { 
        error: "프로필 수정에 실패했습니다.", 
        details: String(error),
        code: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
} 