import { useState, useEffect } from "react";
import AIComment from "./AIComment";
import UserComment from "./UserComment";

interface CommentListProps {
  postId: string;
}

interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: Date;
  isAIComment: boolean;
  authorId: string;
  author: {
    id: string;
    name: string;
    nickname?: string;
    image: string;
  };
}

export default function CommentList({ postId }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        const data = await response.json();
        if (data.comments) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchComments();
    }
  }, [postId]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id}>
          {comment.isAIComment ? (
            <AIComment
              botId={comment.authorId}
              content={comment.content}
              createdAt={comment.createdAt}
            />
          ) : (
            <UserComment
              comment={{
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt.toString(),
                author: comment.author,
                replies: []
              }}
              onReply={(parentId: string) => {
                // 답글 처리 로직 구현
                console.log('Reply to:', parentId);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
