"use client";

import { PageLayout } from '@/components/layout/page-layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  achievedAt: string | null;
}

export default function AchievementsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/achievements')
        .then(res => res.json())
        .then(data => {
          setAchievements(data.achievements);
          setLoading(false);
        })
        .catch(error => {
          console.error('업적 로딩 실패:', error);
          setLoading(false);
        });
    }
  }, [session?.user?.id]);

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
      <div className="flex justify-center mb-4">
        <div className="bg-[#2A4137] rounded-xl px-4 py-2.5 text-sm inline-block">
          <span className="text-[#98B0A8]">🥇 사용자의 업적을 확인할 수 있습니다.</span>
        </div>
      </div>

      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">나의 업적</h1>
        <div className="h-px bg-zinc-800 mb-6" />
        
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`p-4 rounded-lg ${
                achievement.achievedAt 
                  ? 'bg-[#2A4137] text-[#98B0A8]' 
                  : 'bg-[#2A2A2A] text-zinc-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold mb-1">{achievement.title}</h3>
                  <p className="text-sm mb-1">{achievement.description}</p>
                  <p className="text-xs">보상: {achievement.xpReward} XP</p>
                </div>
                {achievement.achievedAt && (
                  <span className="text-sm">
                    {new Date(achievement.achievedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
