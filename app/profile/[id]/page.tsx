"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageLayout } from "@/components/layout/page-layout";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostList } from "@/components/post-list";
import { DrawingList } from "@/components/drawing-list";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Edit, LogOut, UserPlus, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileEditModal } from "@/components/profile-edit-modal";
import { FollowModal } from "@/components/follow-modal"; // Import FollowModal
import { User } from "@/lib/types";
import { calculateLevel } from '@/lib/utils';

interface UserProfile extends User {
  _count: {
    posts: number;
    drawings: number;
    comments: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  post: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      nickname: string;
      image: string;
    };
  };
}

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followUsers, setFollowUsers] = useState<User[]>([]);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (activeTab === "comments") fetchComments();
  }, [activeTab, id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/${id}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data);
      
      // 로컬 스토리지에서 팔로우 상태 확인
      if (typeof window !== 'undefined') {
        const storedFollowStatus = localStorage.getItem(`follow_${id}`);
        if (storedFollowStatus) {
          const { isFollowing, timestamp } = JSON.parse(storedFollowStatus);
          // 24시간 이내의 캐시된 상태만 사용
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setIsFollowing(isFollowing);
            return;
          }
        }
      }
      
      // 서버에서 받은 isFollowing 상태 설정
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/user/${id}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleProfileUpdate = (updatedProfile: User) => {
    setProfile(prev => ({
      ...prev!,
      ...updatedProfile,
      _count: prev!._count  // _count 유지
    }));
    
    // 탭 컨텐츠 리프레시
    if (activeTab === "posts") {
      fetchPosts();
    } else if (activeTab === "comments") {
      fetchComments();
    }
  };

  const fetchPosts = async () => {
    // PostList 컴포넌트가 자체적으로 데이터를 다시 불러올 수 있도록
    setActiveTab("other");  // 임시로 다른 값으로 변경
    setTimeout(() => setActiveTab("posts"), 0);  // 다시 posts로 변경
  };

  const handleFollow = async () => {
    if (!session?.user?.id) {
      alert('팔로우하려면 로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.id}` // 추가 인증 헤더
        },
        body: JSON.stringify({ 
          targetUserId: id,
          currentFollowStatus: isFollowing // 현재 상태 전송
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "팔로우 처리 실패");
      }
      
      const data = await response.json();
      
      // 서버에서 받은 최종 상태로 업데이트
      setIsFollowing(data.isFollowing);
      
      // 팔로워/팔로잉 수 업데이트
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          _count: {
            ...prev._count,
            followers: data.isFollowing 
              ? prev._count.followers + 1 
              : prev._count.followers - 1
          }
        };
      });

      // 로컬 스토리지에 팔로우 상태 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem(`follow_${id}`, JSON.stringify({
          isFollowing: data.isFollowing,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error("팔로우 처리 중 에러:", error);
      alert('팔로우 처리 중 오류가 발생했습니다.');
    }
  };

  const fetchFollowUsers = async (type: 'followers' | 'following') => {
    try {
      setIsFollowLoading(true);
      const response = await fetch(`/api/user/${id}/${type}`);
      if (!response.ok) throw new Error('Failed to fetch follow users');
      const data = await response.json();
      setFollowUsers(data);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setFollowUsers([]);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleFollowersClick = () => {
    fetchFollowUsers('followers');
    setShowFollowersModal(true);
  };

  const handleFollowingClick = () => {
    fetchFollowUsers('following');
    setShowFollowingModal(true);
  };

  if (isLoading || !profile) {
    return (
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* 프로필 정보 */}
        <div className="flex items-center gap-4">
          <Image
            src={profile.image}
            alt={profile.nickname || profile.name}
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{profile.nickname || profile.name}</h1>
              <span className="px-2 py-1 text-sm bg-[#2A4137] text-[#98B0A8] rounded-lg">
                Lv.{calculateLevel(profile.xp)}
              </span>
            </div>
            <div className="mt-1 mb-2">
              <div className="w-48 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#98B0A8]" 
                  style={{ 
                    width: `${(profile.xp % 200) / 200 * 100}%`
                  }}
                />
              </div>
              <span className="text-xs text-zinc-400">
                {profile.xp % 200}/200 XP
              </span>
            </div>
            <div className="flex gap-4 text-sm text-zinc-400">
              <span 
                onClick={handleFollowersClick} 
                className="cursor-pointer hover:text-white transition-colors group relative"
              >
                팔로우 {profile._count.followers}
              </span>
              <span 
                onClick={handleFollowingClick} 
                className="cursor-pointer hover:text-white transition-colors group relative"
              >
                팔로잉 {profile._count.following}
              </span>
            </div>
            {session?.user?.id === profile.id ? (
              // 자신의 프로필일 경우 수정/로그아웃 버튼
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-[#323232]"
                >
                  <Edit className="w-4 h-4" />
                  프로필 수정
                </Button>
                <Button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-[#323232] text-red-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </Button>
              </div>
            ) : session?.user?.id ? (
              // 다른 사람의 프로필이고 로그인한 경우 팔로우 버튼
              <div className="mt-2">
                <Button
                  onClick={handleFollow}
                  className={`flex items-center gap-2 ${
                    isFollowing 
                      ? "bg-[#2A2A2A] hover:bg-[#323232]" 
                      : "bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      언팔로우
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      팔로우
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs defaultValue="posts" onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[#2A2A2A]">
            <TabsTrigger value="posts" className="flex-1">
              글 ({profile._count.posts})
            </TabsTrigger>
            <TabsTrigger value="drawings" className="flex-1">
              그림 ({profile._count.drawings})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex-1">
              댓글 ({profile._count.comments})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            <PostList 
              userId={id as string} 
              type="posts"
              onRefresh={fetchPosts}  // 리프레시 함수 전달
            />
          </TabsContent>

          <TabsContent value="drawings" className="mt-4">
            <DrawingList userId={id as string} type="drawings" />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-[#2A2A2A] rounded-[20px] p-4 mb-4">
                <div className="text-sm text-zinc-400 mb-2">
                  {comment.post.author.nickname || comment.post.author.name}의 글:
                </div>
                <div className="mb-2 text-zinc-400">{comment.post.content}</div>
                <div className="pl-4 border-l-2 border-[#3A3A3A]">
                  <div className="whitespace-pre-wrap">{comment.content}</div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* 팔로워/팔로잉 모달 */}
        <FollowModal 
          isOpen={showFollowersModal} 
          onClose={() => setShowFollowersModal(false)}
          title="팔로워" 
          users={followUsers}
          isLoading={isFollowLoading}
        />
        <FollowModal 
          isOpen={showFollowingModal} 
          onClose={() => setShowFollowingModal(false)}
          title="팔로잉" 
          users={followUsers}
          isLoading={isFollowLoading}
        />

        {/* 프로필 수정 모달 */}
        {showEditModal && profile && (
          <ProfileEditModal 
            user={profile} 
            onClose={() => setShowEditModal(false)}
            onUpdate={handleProfileUpdate}
          />
        )}
      </div>
    </PageLayout>
  );
} 