"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, MessageCircle } from "lucide-react";
import { LoadingSpinner } from "./loading-spinner";
import { useSession } from "next-auth/react";

interface Post {
  id: string;
  content: string;
  style: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    nickname: string;
    image: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
  likes: {
    userId: string;
  }[];
}

interface PostResponse {
  posts: Post[];
  pagination: {
    total: number;
    pages: number;
    current: number;
  };
}

interface PostListProps {
  userId?: string;
  type?: string;
  onRefresh?: () => void;
}

export function PostList({ userId, type, onRefresh }: PostListProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const router = useRouter();

  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMorePosts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, isFetchingMore]);

  const fetchPosts = async (resetPosts = true) => {
    try {
      const url = userId 
        ? `/api/user/${userId}/posts${type ? `?type=${type}` : ''}`
        : "/api/posts";
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMorePosts = async () => {
    if (!nextCursor || isFetchingMore) return;

    setIsFetchingMore(true);
    try {
      const url = userId 
        ? `/api/user/${userId}/posts?cursor=${nextCursor}${type ? `&type=${type}` : ''}`
        : `/api/posts?cursor=${nextCursor}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch more posts");
      const data = await response.json();
      
      setPosts(prev => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Error fetching more posts:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [userId, type]);

  const refresh = () => {
    fetchPosts();
    onRefresh?.();
  };

  const handleLike = async (postId: string) => {
    if (!session?.user?.id) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    
    const userId = session.user.id;

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to handle like");
      }
      
      const data = await response.json();
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const userLiked = post.likes.some(like => like.userId === userId);
            return {
              ...post,
              _count: {
                ...post._count,
                likes: userLiked ? post._count.likes - 1 : post._count.likes + 1
              },
              likes: userLiked 
                ? post.likes.filter(like => like.userId !== userId)
                : [...post.likes, { userId }]
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("좋아요 처리 중 에러:", error);
    }
  };

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleCommentClick = (postId: string) => {
    if (!session?.user?.id) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    router.push(`/post/${postId}?focus=comment`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div 
          key={post.id} 
          ref={index === posts.length - 1 ? lastPostElementRef : undefined}
          className="bg-[#2A2A2A] rounded-[20px] p-4 cursor-pointer hover:bg-[#323232] transition-colors"
          onClick={() => handlePostClick(post.id)}
        >
          <div className="flex items-center gap-3 mb-3">
            <Image
              src={post.author?.image || "/default-profile.png"}
              alt={post.author?.nickname || post.author?.name}
              width={40}
              height={40}
              className="rounded-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/profile/${post.author.id}`);
              }}
            />
            <div>
              <div 
                className="font-medium cursor-pointer hover:text-violet-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile/${post.author.id}`);
                }}
              >
                {post.author?.nickname || post.author?.name}
              </div>
              <div className="text-sm text-zinc-400">
                {formatDistanceToNow(new Date(post.createdAt), { 
                  addSuffix: true,
                  locale: ko 
                })}
              </div>
            </div>
          </div>
          <div className="mb-4 whitespace-pre-wrap">{post.content}</div>
          <div className="flex items-center gap-4 text-zinc-400">
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
                  post.likes?.some(like => like.userId === session?.user?.id)
                    ? "text-red-500 fill-red-500"
                    : ""
                }`} 
              />
              <span>{post._count.likes}</span>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCommentClick(post.id);
              }}
              className="flex items-center gap-1 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post._count.comments}</span>
            </button>
          </div>
        </div>
      ))}
      {isFetchingMore && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
} 