"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import Image from 'next/image';
import { DrawingPost } from '@/lib/types/drawing';
import { getDrawings, likeDrawing, addComment } from '@/lib/api/drawings';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Heart, Flag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AI_BOTS } from '@/lib/ai-bots/config';
import { LoadingSpinner } from '@/components/loading-spinner';

// 그림 평가에 사용할 AI 봇들만 필터링
const DRAWING_AI_BOTS = AI_BOTS.filter(bot => 
  ['simribaksa', 'parkchanho', 'ai-egg', 'ceo', 'joker', 'jisung'].includes(bot.id)
);

export default function DrawingListPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [drawings, setDrawings] = useState<DrawingPost[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();

  const lastDrawingElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreDrawings();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, isFetchingMore]);

  const loadDrawings = async (resetDrawings = true) => {
    try {
      const url = `/api/drawings`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch drawings');
      const data = await response.json();
      
      setDrawings(data.drawings);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error('Failed to load drawings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreDrawings = async () => {
    if (!nextCursor || isFetchingMore) return;

    setIsFetchingMore(true);
    try {
      const response = await fetch(`/api/drawings?cursor=${nextCursor}`);
      if (!response.ok) throw new Error('Failed to fetch more drawings');
      const data = await response.json();
      
      setDrawings(prev => [...prev, ...data.drawings]);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error('Failed to load more drawings:', error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    loadDrawings();
  }, []);

  const handleLike = async (drawingId: string) => {
    if (!session?.user) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    try {
      const result = await likeDrawing(drawingId);
      
      setDrawings(prevDrawings => 
        prevDrawings.map(drawing => 
          drawing.id === drawingId
            ? {
                ...drawing,
                isLiked: result.isLiked,
                likeCount: result.likeCount
              }
            : drawing
        )
      );
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleComment = (id: string) => {
    router.push(`/ai-evaluation/${id}`);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* 상단 알림 */}
      <div className="flex justify-center mb-4">
        <div className="bg-[#2A4137] rounded-xl px-4 py-2.5 text-sm inline-block">
          <span className="text-[#98B0A8]">🔥 AI가 실시간으로 여러분의 작품을 직접 평가합니다.</span>
        </div>
      </div>

      {/* 그림 목록 */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {drawings.map((post, index) => (
          <div 
            key={post.id} 
            ref={index === drawings.length - 1 ? lastDrawingElementRef : undefined}
            className="bg-[#2B2D31] rounded-lg p-4"
          >
            <div className="flex space-x-4">
              {/* 이미지 */}
              <div className="w-[220px] h-[220px] relative flex-shrink-0">
                <Image
                  src={post.image}
                  alt={post.title}
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
                      src={post.author.image}
                      alt={post.author.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#DBDEE1]">{post.author.name}</span>
                      {post.author.badge && (
                        <span className="bg-[#404249] text-xs px-1.5 py-0.5 rounded">
                          {post.author.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-[#B5BAC1]">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                </div>

                {/* 작품 설명 */}
                <p className="text-[#DBDEE1] mb-4 mt-4">{post.description}</p>

                {/* 좋아요, 깃발 */}
                <div className="flex items-center space-x-4 mb-4">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLike(post.id);
                    }}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                  >
                    <Heart 
                      className={`w-5 h-5 ${
                        post.isLiked
                          ? "text-red-500 fill-red-500"
                          : "text-[#B5BAC1]"
                      }`} 
                    />
                    <span className="text-[#B5BAC1]">{post.likeCount}</span>
                  </button>
                  <button 
                    className="text-[#B5BAC1] flex items-center space-x-1 hover:text-white transition-colors"
                    onClick={() => handleComment(post.id)}
                  >
                    <Flag className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                </div>

                {/* AI 평가 */}
                <div className="mt-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#B5BAC1]">AI 평가</span>
                    <span className="text-lg font-semibold text-[#4CAF50]">{post.score?.toFixed(1)}점</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {post.aiScores.map((score, index) => (
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
              </div>
            </div>
          </div>
        ))}
        
        {isFetchingMore && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}

        {drawings.length === 0 && !isLoading && (
          <div className="text-center text-[#B5BAC1] py-8">
            아직 등록된 그림이 없습니다.
          </div>
        )}
      </div>
    </PageLayout>
  );
}
