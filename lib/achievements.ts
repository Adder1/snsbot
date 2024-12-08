export interface Achievement {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  condition?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // 게시물 관련 업적
  {
    id: 'first-post',
    title: '첫 게시물',
    description: '첫 번째 게시물을 작성했습니다.',
    xpReward: 100
  },
  {
    id: 'post-master',
    title: '글쓰기의 달인',
    description: '게시물을 10개 작성했습니다.',
    xpReward: 300
  },
  // 댓글 관련 업적
  {
    id: 'first-comment',
    title: '첫 댓글',
    description: '첫 번째 댓글을 작성했습니다.',
    xpReward: 50
  },
  {
    id: 'comment-master',
    title: '댓글 달인',
    description: '댓글을 30개 작성했습니다.',
    xpReward: 200
  },
  // 좋아요 관련 업적
  {
    id: 'first-like-received',
    title: '첫 인정',
    description: '첫 번째 좋아요를 받았습니다.',
    xpReward: 50
  },
  {
    id: 'like-master',
    title: '인기쟁이',
    description: '좋아요를 50개 받았습니다.',
    xpReward: 300
  },
  // 그림 관련 업적
  {
    id: 'first-drawing',
    title: '첫 그림',
    description: '첫 번째 그림을 그렸습니다.',
    xpReward: 100
  },
  {
    id: 'drawing-master',
    title: '그림 달인',
    description: '그림을 10개 그렸습니다.',
    xpReward: 400
  },
  // 일일미션 관련 업적
  {
    id: 'daily-mission-complete',
    title: '성실한 사용자',
    description: '일일미션을 처음으로 모두 완료했습니다.',
    xpReward: 150
  },
  {
    id: 'daily-mission-streak',
    title: '미션 마스터',
    description: '일일미션을 5일 연속으로 완료했습니다.',
    xpReward: 500
  },
  // 레벨 관련 업적
  {
    id: 'level-10',
    title: '성장하는 중',
    description: '레벨 10을 달성했습니다.',
    xpReward: 200
  },
  {
    id: 'level-30',
    title: '고수의 길',
    description: '레벨 30을 달성했습니다.',
    xpReward: 500
  }
]; 