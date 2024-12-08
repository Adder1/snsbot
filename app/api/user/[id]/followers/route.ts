import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const followers = await prisma.follows.findMany({
      where: {
        followingId: params.id,
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(followers.map(f => ({
      ...f.follower,
      nickname: f.follower.nickname || null
    })));
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 