// 사용자 정보 조회
export async function getUserProfile(userId: string) {
  const res = await fetch(`/api/user/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

// 닉네임 설정
export async function setNickname(nickname: string) {
  const res = await fetch('/api/user/nickname', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to set nickname');
  }
  
  return res.json();
}

// 프로필 수정
export async function updateProfile(userId: string, data: { nickname?: string; description?: string }) {
  const res = await fetch(`/api/user/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update profile');
  }
  
  return res.json();
}

// 팔로우하기
export async function followUser(targetUserId: string) {
  const res = await fetch('/api/follow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetUserId }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to follow user');
  }
  
  return res.json();
}

// 언팔로우하기
export async function unfollowUser(targetUserId: string) {
  const res = await fetch('/api/follow', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetUserId }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to unfollow user');
  }
  
  return res.json();
}

// 팔로워 목록 조회
export async function getUserFollowers(userId: string) {
  const res = await fetch(`/api/user/${userId}/followers`);
  if (!res.ok) throw new Error('Failed to fetch followers');
  return res.json();
}

// 팔로잉 목록 조회
export async function getUserFollowing(userId: string) {
  const res = await fetch(`/api/user/${userId}/following`);
  if (!res.ok) throw new Error('Failed to fetch following');
  return res.json();
} 