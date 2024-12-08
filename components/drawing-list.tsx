"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, MessageCircle } from "lucide-react";
import { LoadingSpinner } from "./loading-spinner";
import { useSession } from "next-auth/react";

interface Drawing {
  id: string;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    nickname: string;
    image: string;
    badge?: string;
  };
  likeCount: number;
  comments: number;
  isLiked: boolean;
  score?: number;
  aiScores: {
    avatar: string;
    score: number;
  }[];
}

interface DrawingResponse {
  drawings: Drawing[];
  pagination: {
    total: number;
    pages: number;
    current: number;
  };
}

interface DrawingListProps {
  userId?: string;
  type?: 'posts' | 'drawings';
}

export function DrawingList({ userId, type }: DrawingListProps) {
  const { data: session } = useSession();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDrawings();
  }, [userId, type]);

  const fetchDrawings = async () => {
    try {
      const url = userId 
        ? `/api/drawings?userId=${userId}`
        : "/api/drawings";
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch drawings: ${errorText}`);
      }
      const data = await response.json();
      setDrawings(data);
    } catch (error) {
      console.error("Error fetching drawings:", error);
      setDrawings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (drawingId: string) => {
    if (!session?.user?.id) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    
    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ drawingId, userId: session.user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to handle like");
      }
      
      const data = await response.json();
      
      setDrawings(prevDrawings => 
        prevDrawings.map(drawing => {
          if (drawing.id === drawingId) {
            return {
              ...drawing,
              isLiked: data.isLiked,
              likeCount: data.likeCount
            };
          }
          return drawing;
        })
      );
    } catch (error) {
      console.error("좋아요 처리 중 에러:", error);
    }
  };

  const handleDrawingClick = (drawingId: string) => {
    router.push(`/ai-evaluation/${drawingId}`);
  };

  const handleCommentClick = (drawingId: string) => {
    if (!session?.user?.id) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    router.push(`/ai-evaluation/${drawingId}?focus=comment`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {drawings.length === 0 ? (
        <div className="text-center text-zinc-400 py-8">
          아직 그린 그림이 없습니다.
        </div>
      ) : (
        drawings.map((drawing) => (
          <div 
            key={drawing.id} 
            className="bg-[#2B2D31] rounded-lg p-4 cursor-pointer hover:bg-[#323232] transition-colors"
            onClick={() => handleDrawingClick(drawing.id)}
          >
            <div className="flex space-x-4">
              {/* 이미지 */}
              <div className="w-[220px] h-[220px] relative flex-shrink-0">
                <Image
                  src={drawing.image}
                  alt={drawing.title}
                  width={220}
                  height={220}
                  className="rounded-lg object-cover"
                />
              </div>

              {/* 정보 */}
              <div className="flex-1 flex flex-col">
                {/* 작성자 정보 */}
                <div className="flex items-center space-x-2 mb-2">
                  <div className="relative">
                    <Image
                      src={drawing.author.image}
                      alt={drawing.author.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#DBDEE1]">{drawing.author.name}</span>
                      {drawing.author.badge && (
                        <span className="bg-[#404249] text-xs px-1.5 py-0.5 rounded">
                          {drawing.author.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-[#B5BAC1]">
                      {formatDistanceToNow(new Date(drawing.createdAt), { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                </div>

                {/* 작품 설명 */}
                <p className="text-[#DBDEE1] mb-4 mt-4">{drawing.description}</p>

                {/* 좋아요, 댓글 */}
                <div className="flex items-center space-x-4 mb-4">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLike(drawing.id);
                    }}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                  >
                    <Heart 
                      className={`w-5 h-5 ${
                        drawing.isLiked
                          ? "text-red-500 fill-red-500"
                          : "text-[#B5BAC1]"
                      }`} 
                    />
                    <span className="text-[#B5BAC1]">{drawing.likeCount}</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCommentClick(drawing.id);
                    }}
                    className="text-[#B5BAC1] flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{drawing.comments}</span>
                  </button>
                </div>

                {/* AI 평가 */}
                {drawing.score && (
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#B5BAC1]">AI 평가</span>
                      <span className="text-lg font-semibold text-[#4CAF50]">{drawing.score.toFixed(1)}점</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {drawing.aiScores.map((score, index) => (
                        <div 
                          key={index} 
                          className="flex flex-col items-center"
                        >
                          <div className="relative mb-6">
                            <Image
                              src={score.avatar}
                              alt="AI"
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            <div className="absolute -bottom-5 left-0 right-0 flex justify-center">
                              <div className="bg-[#2C2D31] text-[#B5BAC1] text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                                {score.score}점
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}