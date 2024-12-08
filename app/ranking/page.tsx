"use client";

import { PageLayout } from '@/components/layout/page-layout';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trophy, FileText, Palette, MessageCircle, Users, Heart } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';

interface RankingUser {
  id: string;
  name: string;
  nickname: string;
  image: string;
  level: number;
  rank: number;
  _count: {
    posts: number;
    drawings: number;
    comments: number;
    followers: number;
    receivedLikes: number;
  };
}

interface PaginationInfo {
  total: number;
  pages: number;
  current: number;
}

export default function RankingPage() {
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const router = useRouter();

  const fetchRankings = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ranking?page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch rankings');
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

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
      {/* 상단 알림 박스 추가 */}
      <div className="flex justify-center mb-4">
        <div className="bg-[#2A4137] rounded-xl px-4 py-2.5 text-sm inline-block">
          <span className="text-[#98B0A8]">🏆 배틀포스트 사용자 랭킹</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-8">사용자 랭킹</h1>
        
        <div className="bg-[#1E1F22] rounded-lg overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-8 bg-[#2B2D31] p-4 text-sm font-medium text-[#B5BAC1]">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="col-span-2">사용자</div>
            <div className="text-center">Level</div>
            <div className="text-center flex items-center justify-center gap-1">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <Palette className="w-4 h-4" />
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <Heart className="w-4 h-4" />
            </div>
          </div>

          {/* 사용자 목록 */}
          {users.map((user) => (
            <div 
              key={user.id}
              className="grid grid-cols-8 p-4 hover:bg-[#2B2D31] cursor-pointer border-t border-[#2B2D31]"
              onClick={() => router.push(`/profile/${user.id}`)}
            >
              <div className="flex items-center">
                <span className={`font-medium ${
                  user.rank === 1 ? 'text-yellow-500' :
                  user.rank === 2 ? 'text-gray-400' :
                  user.rank === 3 ? 'text-amber-600' :
                  'text-[#B5BAC1]'
                }`}>
                  {user.rank}
                </span>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Image
                  src={user.image || '/default-avatar.png'}
                  alt={user.nickname || user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="font-medium">{user.nickname || user.name}</span>
              </div>
              <div className="text-center flex items-center justify-center">
                {user.level}
              </div>
              <div className="text-center flex items-center justify-center">
                {user._count.posts}
              </div>
              <div className="text-center flex items-center justify-center">
                {user._count.drawings}
              </div>
              <div className="text-center flex items-center justify-center">
                {user._count.comments}
              </div>
              <div className="text-center flex items-center justify-center">
                {user._count.receivedLikes}
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        {pagination && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button
                key={i}
                onClick={() => fetchRankings(i + 1)}
                className={`px-4 py-2 rounded ${
                  pagination.current === i + 1
                    ? 'bg-[#2B2D31] text-white'
                    : 'bg-[#1E1F22] text-[#B5BAC1] hover:bg-[#2B2D31]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
