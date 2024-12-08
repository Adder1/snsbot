import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      nickname?: string;
      image: string;
    };
    replies?: CommentProps['comment'][];
  };
  onReply: (parentId: string) => void;
}

export function UserComment({ comment, onReply }: CommentProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);

  return (
    <div className="space-y-4">
      {/* 기존 댓글 UI */}
      <div className="flex gap-3 p-4 bg-zinc-900 rounded-lg">
        <Image
          src={comment.author.image || '/default-avatar.png'}
          alt={comment.author.nickname || comment.author.name}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {comment.author.nickname || comment.author.name}
            </span>
            <span className="text-xs text-zinc-500">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-300">{comment.content}</p>
          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="text-xs text-zinc-500 mt-2 hover:text-zinc-300"
          >
            답글 달기
          </button>
        </div>
      </div>

      {/* 답글 입력 폼 */}
      {showReplyInput && (
        <div className="ml-8">
          <ReplyInput
            parentId={comment.id}
            onReply={onReply}
            onCancel={() => setShowReplyInput(false)}
          />
        </div>
      )}

      {/* 답글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-4">
          {comment.replies.map((reply) => (
            <UserComment
              key={reply.id}
              comment={reply}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 답글 입력 컴포넌트
function ReplyInput({ parentId, onReply, onCancel }: {
  parentId: string;
  onReply: (parentId: string) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onReply(parentId);
      setContent('');
      onCancel();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="답글을 입력하세요..."
        className="flex-1 bg-zinc-800 rounded px-3 py-2"
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 rounded text-sm"
      >
        답글
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-zinc-700 rounded text-sm"
      >
        취소
      </button>
    </div>
  );
}

// default export 추가
export default UserComment;
