"use client";

import { Menu, Bell } from "lucide-react";
import { CategoryNav } from "@/components/category-nav";
import { BottomNav } from "@/components/bottom-nav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

interface PageLayoutProps {
  children: React.ReactNode;
  showCategory?: boolean;
  showBottomNav?: boolean;
  onAuthRequired?: () => void;
  centerContent?: boolean;
}

export function PageLayout({
  children,
  showCategory = true,
  showBottomNav = true,
  onAuthRequired,
  centerContent = false
}: PageLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/notifications/count');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (session?.user?.id) {
      fetchNotificationCount();

      intervalId = setInterval(fetchNotificationCount, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [session?.user?.id]);

  const handleAuthRequired = () => {
    if (onAuthRequired && !session) {
      onAuthRequired();
      return;
    }
  };

  return (
    <>
      <div 
        className="min-h-screen bg-[#3C3C3C] flex justify-center"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '23px 23px'
        }}
      >
        <div className="w-[629.84px] mx-auto">
          <div className="w-[900px] bg-[#1E1E1E] min-h-screen relative -ml-[135.08px]">
            <header className="flex justify-between items-center px-4 py-3 border-b border-[#FEFEFE]/10">
              <button
                className="p-2"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-xl font-bold hover:text-zinc-300 transition-colors"
              >
                BATTLEPOST
              </button>
              <button 
                className="p-2 relative"
                onClick={() => router.push('/alarm')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </header>
            {showCategory && <CategoryNav />}
            <div className={`px-8 pt-0 pb-20 ${centerContent ? "flex min-h-[calc(100vh-180px)]" : "min-h-[calc(100vh-120px)]"} items-center ${centerContent ? "justify-center" : ""}`}>
              {children}
            </div>
            {showBottomNav && (
              <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[900px] bg-[#1E1E1E] border-t border-[#FEFEFE]/10">
                <BottomNav
                  onWriteClick={handleAuthRequired}
                  onDrawClick={handleAuthRequired}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}