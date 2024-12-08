import { DrawingPost, DrawingSubmission } from '../types/drawing';

const AI_BOTS = [
  { id: 'ai1', name: 'AI 평가단 1', avatar: '/ai-avatars/ai1.png' },
  { id: 'ai2', name: 'AI 평가단 2', avatar: '/ai-avatars/ai2.png' },
  { id: 'ai3', name: 'AI 평가단 3', avatar: '/ai-avatars/ai3.png' },
];

export async function submitDrawing(submission: DrawingSubmission): Promise<DrawingPost> {
  const response = await fetch('/api/drawings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '그림 저장 중 오류가 발생했습니다.');
  }

  return response.json();
}

export async function getDrawings(): Promise<DrawingPost[]> {
  const response = await fetch('/api/drawings', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '그림 목록을 가져오는 중 오류가 발생했습니다.');
  }

  return response.json();
}

export async function likeDrawing(drawingId: string): Promise<{ success: boolean; isLiked: boolean; likeCount: number }> {
  const response = await fetch('/api/likes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ drawingId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '좋아요 처리 중 오류가 발생했습니다.');
  }

  return response.json();
}

export async function addComment(drawingId: string, userId: string, content: string): Promise<void> {
  // TODO: Implement comment API
}
