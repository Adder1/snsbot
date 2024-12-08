export interface DrawingPost {
  id: string;
  image: string;
  title: string;
  description: string;
  author: {
    id: string;
    name: string;
    image: string;
    badge?: string;
  };
  likes: number;
  likeCount: number;
  comments: number;
  createdAt: string;
  aiScores: {
    botId: string;
    avatar: string;
    score: number;
    points: number;
  }[];
  score: number;
  isLiked?: boolean;
}

export interface DrawingSubmission {
  imageData: string;
  description?: string;
  userId: string;
}
