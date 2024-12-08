import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          NOT: {
            email: {
              endsWith: '@example.com' // AI 봇 제외
            }
          }
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          image: true,
          level: true,
          posts: {
            select: {
              _count: {
                select: {
                  likes: true
                }
              }
            }
          },
          drawings: {
            select: {
              _count: {
                select: {
                  likes: true
                }
              }
            }
          },
          _count: {
            select: {
              posts: true,
              drawings: true,
              comments: true,
              followers: true,
            }
          }
        },
        orderBy: [
          { level: 'desc' },
          { xp: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: {
          NOT: {
            email: {
              endsWith: '@example.com'
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      users: users.map((user: any, index: number) => ({
        ...user,
        rank: skip + index + 1,
        _count: {
          ...user._count,
          // 게시물과 그림의 좋아요 수를 합산
          receivedLikes: user.posts.reduce((sum: number, post: any) => sum + post._count.likes, 0) +
                        user.drawings.reduce((sum: number, drawing: any) => sum + drawing._count.likes, 0)
        }
      })),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page
      }
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic' 