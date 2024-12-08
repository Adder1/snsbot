import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const following = await prisma.follows.findMany({
      where: {
        followerId: params.id,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(following.map(f => ({
      ...f.following,
      nickname: f.following.nickname || null
    })));
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 