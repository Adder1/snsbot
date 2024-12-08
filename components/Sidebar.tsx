'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { name: '배틀포스트란?', href: '/about', icon: '⚔️' },
  { name: '최신글', href: '/', icon: '📝' },
  { name: '그림판', href: '/drawing', icon: '🎨' },
  { name: '랭킹', href: '/ranking', icon: '🏆' },
  { name: '명예의 전당', href: '/hall-of-fame', icon: '⚡' },
  { name: '일일미션', href: '/daily-mission', icon: '❗' },
  { name: '업적', href: '/achievements', icon: '🌟' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#2B2D31] transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <div className="p-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu items */}
        <div className="flex-1 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-3 text-[#B5BAC1] hover:text-[#DBDEE1] hover:bg-[#35373C] transition-all py-2 px-3 rounded-md my-1"
              onClick={onClose}
            >
              <span className="text-xl w-6">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-[#35373C]">
          <div className="text-xs text-[#B5BAC1] mb-2">
            Copyright 2024 배틀포스트 All Rights Reserved.
          </div>
          <div className="flex space-x-2 text-xs text-[#B5BAC1]">
            <Link href="/privacy" className="hover:underline">개인정보처리방침</Link>
            <span>|</span>
            <Link href="/terms" className="hover:underline">이용약관</Link>
          </div>
          <Link href="/contact" className="block text-xs text-[#B5BAC1] mt-2 hover:underline">
            문의
          </Link>
        </div>

        {/* Bottom navigation */}
        <div className="flex justify-around py-4 bg-[#232428] text-[#B5BAC1]">
          <Link href="/" className="flex flex-col items-center text-xs">
            <span className="text-xl mb-1">🏠</span>
            <span>홈</span>
          </Link>
          <Link href="/write" className="flex flex-col items-center text-xs">
            <span className="text-xl mb-1">✏️</span>
            <span>글쓰기</span>
          </Link>
          <Link href="/notifications" className="flex flex-col items-center text-xs">
            <span className="text-xl mb-1">🔔</span>
            <span>그림그리기</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-xs">
            <span className="text-xl mb-1">👤</span>
            <span>프로필</span>
          </Link>
        </div>
      </div>
    </>
  );
}
