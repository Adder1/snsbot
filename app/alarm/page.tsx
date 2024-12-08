"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { PageLayout } from "@/components/layout/page-layout";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Bell, MessageCircle, Award, Target, TrendingUp, Palette } from "lucide-react";
import { useSession } from "next-auth/react";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  link: string | null;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'COMMENT':
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    case 'AI_EVALUATION':
      return <Palette className="w-5 h-5 text-purple-500" />;
    case 'ACHIEVEMENT':
      return <Award className="w-5 h-5 text-yellow-500" />;
    case 'DAILY_MISSION':
      return <Target className="w-5 h-5 text-green-500" />;
    case 'LEVEL_UP':
      return <TrendingUp className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
};

export default function AlarmPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  const [loadedNotificationIds] = useState(new Set<string>());

  const fetchNotifications = async () => {
    try {
      const url = new URL('/api/notifications', window.location.origin);
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      
      const newNotifications = data.notifications.filter(
        (notification: Notification) => !loadedNotificationIds.has(notification.id)
      );

      newNotifications.forEach((notification: Notification) => {
        loadedNotificationIds.add(notification.id);
      });

      setNotifications(prev => [...prev, ...newNotifications]);
      setHasMore(!!data.nextCursor);
      if (data.nextCursor) {
        setCursor(data.nextCursor);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const checkNewNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?latest=true');
      if (!response.ok) throw new Error('Failed to fetch latest notifications');
      
      const data = await response.json();
      
      const newNotifications = data.notifications.filter(
        (notification: Notification) => !loadedNotificationIds.has(notification.id)
      );

      if (newNotifications.length > 0) {
        newNotifications.forEach((notification: Notification) => {
          loadedNotificationIds.add(notification.id);
        });

        setNotifications(prev => [...newNotifications, ...prev]);
      }
    } catch (error) {
      console.error('Failed to fetch latest notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(checkNewNotifications, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (inView && hasMore) {
      fetchNotifications();
    }
  }, [inView]);

  return (
    <PageLayout showCategory={false}>
      <div className="max-w-2xl mx-auto pt-6">
        <h1 className="text-2xl font-bold text-center mb-8">알림</h1>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <a
              key={notification.id}
              href={notification.link || '#'}
              className="block bg-zinc-900 rounded-lg p-4 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-zinc-200">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {notification.content}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </p>
                </div>
              </div>
            </a>
          ))}
          {hasMore && (
            <div ref={ref} className="h-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
} 