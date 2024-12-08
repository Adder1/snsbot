"use client";

import { PageLayout } from '@/components/layout/page-layout';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';

interface Drawing {
  id: string;
  imageUrl: string;
  score: number;
  author: {
    id: string;
    name: string;
    nickname: string;
  };
}

export default function HallOfFamePage() {
  const [topDrawings, setTopDrawings] = useState<Drawing[]>([]);
  const [otherDrawings, setOtherDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDrawings();
  }, []);

  const fetchDrawings = async () => {
    try {
      const response = await fetch('/api/drawings/top');
      if (!response.ok) throw new Error('Failed to fetch drawings');
      
      const data = await response.json();
      setTopDrawings(data.topDrawings.slice(0, 3)); // 상위 3개
      setOtherDrawings(data.topDrawings.slice(3)); // 나머지
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen pb-8">
        {/* 상단 안내 메시지 */}
        <div className="flex justify-center mb-4">
          <div className="bg-[#2A4137] rounded-xl px-4 py-2.5 text-sm inline-block">
            <span className="text-[#98B0A8]">⚡ AI가 뽑은 최고의 작품을 전시하는 곳입니다.</span>
          </div>
        </div>

        {/* 베스트 오브 베스트 섹션 */}
        <div className="max-w-6xl mx-auto px-4 mb-4">
          <div className="bg-[#2B2D31] rounded-lg p-2">
            <div className="flex items-center gap-2 text-sm text-[#B5BAC1]">
              <span>🏆</span>
              <span>베스트 오브 베스트</span>
            </div>
          </div>
        </div>

        {/* 왕관 이미지 */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <div className="flex justify-center">
            <Image
              src="/images/crown.png"
              alt="Crown"
              width={600}
              height={400}
              priority
              className="w-full max-w-[600px] h-auto"
            />
          </div>
        </div>

        {/* TOP 3 그림 */}
        <div className="grid grid-cols-3 gap-6 mb-16 max-w-6xl mx-auto px-4">
          {topDrawings.map((drawing, index) => (
            <div 
              key={drawing.id}
              className="relative cursor-pointer group"
              onClick={() => router.push(`/ai-evaluation/${drawing.id}`)}
            >
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src={drawing.imageUrl}
                  alt={`Top ${index + 1} Drawing`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex justify-between items-center text-white">
                  <span className="font-bold">{drawing.score}점</span>
                  <span>{drawing.author.nickname || drawing.author.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 명작 섹션 */}
        <div className="max-w-6xl mx-auto px-4 mb-4">
          <div className="bg-[#2B2D31] rounded-lg p-2">
            <div className="flex items-center gap-2 text-sm text-[#B5BAC1]">
              <span>🎨</span>
              <span>명작</span>
            </div>
          </div>
        </div>

        {/* 나머지 그림들 */}
        <div className="grid grid-cols-5 gap-4 max-w-6xl mx-auto px-4 mb-8">
          {otherDrawings.map((drawing) => (
            <div 
              key={drawing.id}
              className="relative cursor-pointer group"
              onClick={() => router.push(`/ai-evaluation/${drawing.id}`)}
            >
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src={drawing.imageUrl}
                  alt="Drawing"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex justify-between items-center text-white text-sm">
                  <span className="font-bold">{drawing.score}점</span>
                  <span>{drawing.author.nickname || drawing.author.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
