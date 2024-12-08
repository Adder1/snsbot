import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("Unauthorized: No session or user ID"); // 디버깅용
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { nickname } = await request.json();

    if (!nickname) {
      return NextResponse.json(
        { error: "Nickname is required" },
        { status: 400 }
      );
    }

    // 닉네임 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { nickname },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Nickname already exists" },
        { status: 400 }
      );
    }

    // 닉네임 설정
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { nickname },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error in nickname API:", error); // 디버깅용
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 