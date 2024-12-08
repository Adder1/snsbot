"use client";

import { PageLayout } from '@/components/layout/page-layout';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { calculateLevel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DailyMission {
  postCompleted: boolean;
  drawCompleted: boolean;
  commentCount: number;
  commentCompleted: boolean;
  bonusCompleted: boolean;
}

export default function DailyMissionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [missionData, setMissionData] = useState<DailyMission | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchMissionData();
      fetchUserProfile();
    }
  }, [session]);

  const fetchMissionData = async () => {
    try {
      const res = await fetch('/api/daily-mission');
      const data = await res.json();
      setMissionData(data);
    } catch (error) {
      console.error('Failed to fetch mission data:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`/api/user/${session?.user?.id}`);
      const data = await res.json();
      setUserProfile(data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleLatestPost = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/posts?limit=1');
      const data = await res.json();
      
      if (data && data.posts && data.posts.length > 0) {
        router.push(`/post/${data.posts[0].id}`);
      } else {
        toast.error("작성된 게시물이 없습니다.");
      }
    } catch (error) {
      console.error('Failed to fetch latest post:', error);
      toast.error("게시물을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <p className="text-gray-600">로그인이 필요합니다.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">
            로그인하기
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex justify-center mb-4">
        <div className="bg-[#2A4137] rounded-xl px-4 py-2.5 text-sm inline-block">
          <span className="text-[#98B0A8]">🔥 일일 미션을 모두 달성하면 +100 보너스 경험치!</span>
        </div>
      </div>

      {userProfile && (
        <div className="bg-[#2A2A2A] rounded-[20px] p-6 mb-6">
          <div className="flex items-center gap-4">
            <Image
              src={userProfile.image || '/default-avatar.png'}
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{userProfile.nickname || userProfile.name}</h2>
                <span className="px-2 py-1 text-sm bg-[#2A4137] text-[#98B0A8] rounded-lg">
                  Lv.{calculateLevel(userProfile.xp)}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-48 h-2 bg-[#3A3A3A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#98B0A8]" 
                    style={{ width: `${(userProfile.xp % 200) / 200 * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400">
                  {userProfile.xp % 200}/200 XP
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {missionData && (
        <div className="space-y-4">
          <div className="bg-[#2A2A2A] rounded-[20px] p-6">
            <h3 className="text-lg mb-2">게시글 1개 작성하기</h3>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">진행도: {missionData.postCompleted ? '1' : '0'} / 1</span>
              <span className="text-[#98B0A8]">보상: 50 경험치</span>
            </div>
            <Button 
              onClick={() => router.push('/write')}
              className="mt-4 w-full bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
              disabled={missionData.postCompleted}
            >
              글 작성하기
            </Button>
          </div>

          <div className="bg-[#2A2A2A] rounded-[20px] p-6">
            <h3 className="text-lg mb-2">그림 1개 그리기</h3>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">진행도: {missionData.drawCompleted ? '1' : '0'} / 1</span>
              <span className="text-[#98B0A8]">보상: 80 경험치</span>
            </div>
            <Button 
              onClick={() => router.push('/draw')}
              className="mt-4 w-full bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
              disabled={missionData.drawCompleted}
            >
              그림 그리기
            </Button>
          </div>

          <div className="bg-[#2A2A2A] rounded-[20px] p-6">
            <h3 className="text-lg mb-2">댓글 3개 작성하기</h3>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">진행도: {missionData.commentCount} / 3</span>
              <span className="text-[#98B0A8]">보상: 30 경험치</span>
            </div>
            <Button 
              onClick={handleLatestPost}
              className="mt-4 w-full bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
              disabled={missionData.commentCompleted || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  불러오는 중...
                </>
              ) : (
                '댓글 작성하러 가기'
              )}
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
