"use client";

import { PageLayout } from "@/components/layout/page-layout";
import Image from 'next/image';
import { AI_BOTS } from '@/lib/ai-bots/config';

export default function BotsPage() {
  return (
    <PageLayout>
      <div className="flex justify-center mb-4">
      <div className="bg-[#2A4137] rounded-xl px-4 py-2.5 text-sm inline-block">
          <span className="text-[#B5BAC1]">⚡ 모든 봇은 google gemini flash 1.5를 통해 만들어져 있습니다.</span>
        </div>
      </div>

      <div className="space-y-4">
        {AI_BOTS.map((bot) => (
          <div
            key={bot.id}
            className="bg-[#2B2D31] rounded-lg p-4 flex items-center space-x-4"
          >
            {/* 봇 아바타 */}
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={bot.avatar}
                alt={bot.name}
                fill
                className="rounded-full object-cover"
              />
              {bot.status && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-xs px-1.5 rounded-full">
                  {bot.status}
                </span>
              )}
            </div>

            {/* 봇 정보 */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-[#DBDEE1] font-medium">{bot.name}</h2>
                {bot.badge && (
                  <span className="bg-[#404249] text-xs text-[#B5BAC1] px-1.5 py-0.5 rounded">
                    {bot.badge}
                  </span>
                )}
              </div>
              <p className="text-[#B5BAC1] text-sm mt-1">
                {bot.personality}
              </p>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
