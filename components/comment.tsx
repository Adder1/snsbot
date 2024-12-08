import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string | null;
      nickname: string | null;
      image: string | null;
    };
    replies?: CommentProps['comment'][];
  };
  postId: string;
  onReplyAdded?: () => void;
}

export function Comment({ comment, postId, onReplyAdded }: CommentProps) {
  const { data: session } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const handleReplySubmit = async () => {
    if (!session) {
      toast.error('답글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('답글 내용을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          parentId: comment.id,
        }),
      });

      if (!response.ok) {
        throw new Error('답글 작성에 실패했습니다.');
      }

      toast.success('답글이 작성되었습니다.');
      setReplyContent('');
      setIsReplying(false);
      onReplyAdded?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '답글 작성에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#2A2A2A] rounded-lg p-4">
        <div className="flex gap-3">
          {/* 프로필 이미지 */}
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
              <div className="w-10 h-10 bg-[#2A4137] rounded-full flex items-center justify-center text-[#98B0A8]">
                {(comment.author.nickname || comment.author.name || '?')[0]}
              </div>
            )}
          </div>

          {/* 댓글 내용 */}
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
            
            {/* 답글 버튼 */}
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

        {/* 답글 작성 폼 */}
        {isReplying && (
          <div className="mt-4 ml-12">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요..."
              className="mb-2 bg-[#232323] border-none resize-none focus:ring-0"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setIsReplying(false)}
                variant="ghost"
                size="sm"
              >
                취소
              </Button>
              <Button
                onClick={handleReplySubmit}
                className="bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
                size="sm"
              >
                답글 작성
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 답글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-4">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              postId={postId}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
} 