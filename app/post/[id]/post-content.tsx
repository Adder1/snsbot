"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { Comment } from "@/components/comment";
import { LoadingSpinner } from "@/components/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    nickname: string | null;
    image: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  likes: Array<{ userId: string }>;
}

type CommentAuthor = {
  id: string;
  name: string | null;
  nickname: string | null;
  image: string | null;
  email?: string;
  role?: string;
};

type CommentType = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  postId: string;
  parentId: string | null;
  isAI?: boolean;
  aiType?: string;
  author: CommentAuthor;
  replies?: CommentType[];
};

export function PostContent({ id }: { id: string }) {
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const [replyingTo, setReplyingTo] = useState<{ [key: string]: boolean }>({});
  const [replyContents, setReplyContents] = useState<{ [key: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const fetchPostAndComments = async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${id}`),
        fetch(`/api/posts/${id}/comments`),
      ]);

      if (!postRes.ok || !commentsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const postData = await postRes.json();
      const commentsData = await commentsRes.json();

      setPost(postData);
      setComments(commentsData.comments);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !commentContent.trim()) return;

    try {
      const response = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: commentContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const { comment } = await response.json();
      
      setComments((prevComments) => [
        {
          ...comment,
          replies: [],
        },
        ...prevComments,
      ]);
      setCommentContent("");

      // 일일미션 �료 처리 추가
      try {
        const missionResponse = await fetch("/api/daily-mission/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            missionType: "comment"
          }),
        });

        if (missionResponse.ok) {
          const result = await missionResponse.json();
          if (result.xpGained) {
            toast.success(`일일미션 완료! ${result.xpGained}XP를 획득했습니다!`);
          }
        }
      } catch (error) {
        console.error("일일미션 완료 처리 실패:", error);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("댓글 작성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleReplyContentChange = (commentId: string, content: string) => {
    setReplyContents(prev => ({
      ...prev,
      [commentId]: content
    }));
  };

  const handleReplySubmit = async (parentId: string, content: string) => {
    if (!session || !content.trim()) return;

    try {
      const response = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          content,
          parentId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add reply");
      }

      const { comment, aiReply } = await response.json();
      
      setComments((prevComments) => {
        const updateReplies = (comments: CommentType[]): CommentType[] => {
          return comments.map(c => {
            if (c.id === parentId) {
              const newReplies = [{
                ...comment,
                replies: []
              }];
              if (aiReply) {
                newReplies.push({
                  ...aiReply,
                  replies: []
                });
              }
              return {
                ...c,
                replies: c.replies ? [...newReplies, ...c.replies] : newReplies,
              };
            }
            if (c.replies) {
              return {
                ...c,
                replies: updateReplies(c.replies),
              };
            }
            return c;
          });
        };
        return updateReplies(prevComments);
      });

      // 답글 작성 후 상태 초기화
      setReplyContents(prev => ({
        ...prev,
        [parentId]: ''
      }));
      setReplyingTo(prev => ({
        ...prev,
        [parentId]: false
      }));

      // 일일미션 �료 처리 추가
      try {
        const missionResponse = await fetch("/api/daily-mission/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            missionType: "comment"
          }),
        });

        if (missionResponse.ok) {
          const result = await missionResponse.json();
          if (result.xpGained) {
            toast.success(`일일미션 완료! ${result.xpGained}XP를 획득했습니다!`);
          }
        }
      } catch (error) {
        console.error("일일미션 완료 처리 실패:", error);
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("댓글 작성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const toggleReply = (commentId: string) => {
    setReplyingTo(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const ReplyComponent = ({ 
    reply, 
    parentId,
    onReplySubmit,
    depth = 0 
  }: { 
    reply: CommentType;
    parentId: string;
    onReplySubmit: (parentId: string, content: string) => Promise<void>;
    depth?: number;
  }) => {
    const { data: session } = useSession();
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    const handleSubmit = async () => {
      await onReplySubmit(reply.id, replyContent);
      setReplyContent("");
      setIsReplying(false);
    };

    return (
      <div className={`border-l border-[#3A3A3A] ${depth > 0 ? 'ml-4' : 'ml-8'}`}>
        <div className="p-4 bg-[#2B2B2B]">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {reply.author.image ? (
                <Image
                  src={reply.author.image}
                  alt={reply.author.nickname || reply.author.name || '사용자'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-sm">
                    {(reply.author.nickname || reply.author.name || '?')[0]}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">
                  {reply.author.nickname || reply.author.name}
                </span>
                <span className="text-sm text-zinc-500">
                  {formatDistanceToNow(new Date(reply.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
              <p className="text-sm mb-2">{reply.content}</p>
　
              {session && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-sm text-zinc-500 hover:text-zinc-300"
                >
                  답글 달기
                </button>
              )}
            </div>
          </div>

          {isReplying && (
            <div className="mt-2 pl-4">
              <div className="bg-[#232323] rounded-lg p-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답글을 입력하세요"
                  className="bg-[#232323] border-none resize-none focus:ring-0 placeholder:text-zinc-600 min-h-[80px] mb-2"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setIsReplying(false)}
                    variant="ghost"
                    className="text-zinc-400 hover:text-zinc-300"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!replyContent.trim()}
                    className="bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
                  >
                    답글 작성
                  </Button>
                </div>
              </div>
            </div>
          )}

          {reply.replies?.map((nestedReply) => (
            <ReplyComponent 
              key={nestedReply.id} 
              reply={nestedReply} 
              parentId={reply.id}
              onReplySubmit={onReplySubmit}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (!post) return <div className="text-center py-8">게시물을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* 게시물 내용 */}
      <div className="bg-[#2A2A2A] rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt={post.author.nickname || post.author.name || "사용자"}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-sm">
                {(post.author.nickname || post.author.name || "?")[0]}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium">
              {post.author.nickname || post.author.name}
            </div>
            <div className="text-sm text-zinc-500">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </div>
          </div>
        </div>
        <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
        <div className="flex items-center gap-4 text-zinc-400">
          <div className="flex items-center gap-1">
            <Heart className="w-5 h-5" />
            <span>{post._count.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-5 h-5" />
            <span>{post._count.comments}</span>
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">댓글 ({post._count.comments})</h2>
        
        {/* 댓글 작성 영역 */}
        {session ? (
          <div className="overflow-hidden rounded-lg bg-[#2A2A2A]">
            <Textarea
              ref={commentRef}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="bg-[#2A2A2A] border-none resize-none focus:ring-0 placeholder:text-zinc-600"
              rows={3}
            />
            <div className="flex justify-end p-2 border-t border-[#3A3A3A]">
              <Button
                onClick={handleCommentSubmit}
                disabled={!commentContent.trim()}
                className="bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80 rounded-[15px]"
              >
                댓글 작성
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-[#2A2A2A] text-center text-zinc-400 py-4 rounded-lg">
            댓글을 작성하려면 로그인이 필요합니다.
          </div>
        )}

        {/* 댓글 목록 */}
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-[#2A2A2A] rounded-lg overflow-hidden">
              {/* 메인 댓글 */}
              <div className="p-4 border-b border-[#3A3A3A]">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {comment.author.image ? (
                      <Image
                        src={comment.author.image}
                        alt={comment.author.nickname || comment.author.name || '사용자'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          {(comment.author.nickname || comment.author.name || '?')[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {comment.author.nickname || comment.author.name}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{comment.content}</p>
                    
                    {session && (
                      <button
                        onClick={() => toggleReply(comment.id)}
                        className="text-sm text-zinc-500 hover:text-zinc-300"
                      >
                        답글 달기
                      </button>
                    )}
                  </div>
                </div>

                {/* 메인 댓글의 답글 입력 폼 추가 */}
                {replyingTo[comment.id] && (
                  <div className="mt-4 pl-8">
                    <div className="bg-[#232323] rounded-lg p-3">
                      <Textarea
                        value={replyContents[comment.id] || ''}
                        onChange={(e) => handleReplyContentChange(comment.id, e.target.value)}
                        placeholder="답글을 입력하세요"
                        className="bg-[#232323] border-none resize-none focus:ring-0 placeholder:text-zinc-600 min-h-[80px] mb-2"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => toggleReply(comment.id)}
                          variant="ghost"
                          className="text-zinc-400 hover:text-zinc-300"
                        >
                          취소
                        </Button>
                        <Button
                          onClick={() => handleReplySubmit(comment.id, replyContents[comment.id] || '')}
                          disabled={!(replyContents[comment.id] || '').trim()}
                          className="bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
                        >
                          답글 작성
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 답글 목록 - 메인 댓글 아래에 바로 표시 */}
              {comment.replies?.map((reply) => (
                <ReplyComponent 
                  key={reply.id} 
                  reply={reply}
                  parentId={comment.id}
                  onReplySubmit={handleReplySubmit}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 