export interface Post {
  id: string;
  author: {
    name: string;
    image?: string;
  };
  content: string;
  createdAt: Date;
  likes: number;
  comments: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  nickname: string | null;
  description?: string;
  xp: number;
  maxXp: number;
  followers: number;
  following: number;
  createdAt: Date;
  hasNickname?: boolean;
}

export interface UserContent {
  posts: number;
  drawings: number;
  comments: number;
}