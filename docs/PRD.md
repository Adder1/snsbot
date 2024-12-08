SNS Bot 개발을 위한 제품 요구사항 문서(PRD)

1. 프로젝트 개요

SNS Bot은 사용자들이 텍스트와 이미지를 공유하고, AI와 상호 작용하며, 다양한 미션과 업적을 달성할 수 있는 소셜 네트워킹 서비스입니다. Google Gemini AI를 활용하여 글 내용을 특정 말투로 변환하고, AI 봇들이 사용자들의 게시물에 댓글을 달아주는 등 독특한 사용자 경험을 제공합니다. 또한, 일일 미션과 업적 시스템을 통해 사용자 참여를 촉진하고 보상을 제공합니다.

2. 유저 플로우
	1.	홈 화면 접근
	•	사용자가 사이트에 접속하면 홈 화면이 나타나며, 최신 글들이 무한 스크롤 형태로 표시됩니다.
	2.	카테고리 탐색
	•	상단에 카테고리 버튼(최신글, 그림판, 랭킹, 명예의 전당, 일일 미션, 업적)이 제공되어 원하는 콘텐츠를 선택하여 볼 수 있습니다.
	3.	게시물 상호작용
	•	로그인하지 않은 사용자는 게시물을 열람할 수 있지만, 좋아요 및 댓글 기능은 사용할 수 없습니다.
	•	로그인한 사용자는 좋아요를 누르고 댓글을 달 수 있습니다.
	4.	하단 네비게이션
	•	하단에는 홈, 글쓰기, 그림 그리기, 로그인 버튼이 있습니다.
	•	로그인하지 않은 경우 글쓰기와 그림 그리기 버튼을 누르면 로그인 페이지로 이동합니다.
	5.	로그인
	•	로그인 버튼을 누르면 Google Login API를 통해 로그인할 수 있습니다.
	•	로그인 후 닉네임을 설정할 수 있습니다.
	•	로그인하면 하단의 로그인 버튼이 사용자의 Google 프로필 이미지로 변경됩니다.
	6.	내 정보 확인
	•	프로필 이미지를 클릭하면 내 정보 페이지로 이동합니다.
	•	내 정보 페이지에서 이름, 팔로워 수, 팔로잉 수, 프로필 수정, 경험치, 내 콘텐츠(글, 그림, 댓글)를 확인할 수 있습니다.
	7.	글쓰기
	•	글쓰기 버튼을 클릭하면 최대 500자의 글을 작성할 수 있는 텍스트 필드와 말투 선택 옵션이 제공됩니다.
	•	말투 옵션: 진지, 친근, 유머러스, 분노조절 실패, 짜증나게, 기쁘게, 슬프게, 냉소적으로, 열정적으로, 공손하게
	•	글을 작성하고 말투를 선택하면 Google Gemini AI를 이용하여 해당 말투로 글 내용이 변환됩니다.
	•	변환은 최대 5번까지 시도할 수 있습니다.
	•	이미지 첨부 및 게시 전 옵션 설정(나만 보기, 댓글 사용 안 함, AI 차단)이 가능합니다.
	•	글을 게시하면 홈 화면으로 이동하며, 시간이 지나면 다양한 AI 봇들이 댓글을 달아줍니다.
	8.	그림 그리기
	•	그림 그리기 버튼을 클릭하면 캔버스가 제공됩니다.
	•	최소 4번의 액션으로 그림을 그리고 작품 설명을 입력한 후 출품하기 버튼을 누릅니다.
	•	그림판 카테고리에서 내 그림을 확인할 수 있으며, “평가 대기중” 상태로 표시됩니다.
	•	AI들이 그림을 평가하여 점수를 매기며, 높은 점수의 작품은 명예의 전당에 게시됩니다.
	9.	일일 미션 및 업적
	•	일일 미션을 완료하면 경험치를 획득할 수 있으며, 모든 미션 완료 시 추가 경험치를 제공합니다.
	•	업적을 달성하면 경험치를 추가로 획득할 수 있습니다.
	•	알림을 통해 미션 및 업적 달성 상황을 확인할 수 있습니다.
	10.	알림 확인
	•	누가 내 글에 댓글을 남겼는지, 그림에 평가를 했는지, 업적이나 일일 미션을 달성했는지에 대한 알림이 제공됩니다.

3. 핵심 기능

3.1 홈 화면 및 콘텐츠 열람

	•	최신 글 무한 스크롤 방식으로 표시
	•	카테고리별 콘텐츠 필터링 기능
	•	게시물에 대한 좋아요 및 댓글 기능

3.2 사용자 인증 및 프로필 관리

	•	Google Login API를 이용한 간편 로그인
	•	닉네임 설정 및 프로필 이미지 연동
	•	내 정보 페이지에서 개인 정보 및 활동 내역 확인
	•	팔로워 및 팔로잉 기능 (MVP 범위 외 개선 사항으로 고려 가능)

3.3 글쓰기 기능

	•	최대 500자까지 글 작성 가능
	•	다양한 말투 선택 옵션 제공
	•	Google Gemini AI를 이용한 말투 변환 (최대 5회 시도)
	•	이미지 첨부 기능
	•	게시 전 옵션 설정: 나만 보기, 댓글 사용 안 함, AI 차단

3.4 AI와의 상호작용

	•	게시물에 AI 봇들이 댓글 작성
	•	다양한 스타일의 AI 봇 제공 (예: 박지성 AI, 박찬호 AI, 오은영 AI 등)
	•	댓글을 통해 AI와 소통 가능

3.5 그림 그리기 기능

	•	캔버스 제공 및 최소 4번의 액션 필요
	•	작품 설명 입력 및 출품하기 기능
	•	AI를 통한 작품 평가 및 점수 부여
	•	명예의 전당에 우수 작품 게시

3.6 일일 미션 및 업적 시스템

	•	일일 미션 제공 및 완료 시 경험치 보상
	•	모든 일일 미션 완료 시 추가 경험치 보상
	•	업적 달성 시 경험치 보상
	•	업적 예시: 첫 글 작성, 첫 그림 업로드 등

3.7 알림 기능

	•	내 글에 대한 댓글 알림
	•	그림 평가 완료 알림
	•	업적 및 일일 미션 달성 알림

3.8 기타 기능

	•	로그인 상태에 따른 하단 네비게이션 버튼 변화
	•	경험치 시스템을 통한 사용자 참여 촉진

4. 기술 스택

4.1 프론트엔드

	•	Next.js App Router: 서버 사이드 렌더링 및 라우팅
	•	ShadCN: UI 컴포넌트 라이브러리
	•	Tailwind CSS: 유틸리티 퍼스트 CSS 프레임워크
	•	Canvas API 또는 라이브러리 (예: Fabric.js): 그림 그리기 기능 구현
	•	React Query 또는 SWR: 상태 관리 및 데이터 페칭
	•	Axios 또는 Fetch API: API 통신

4.2 백엔드

	•	Node.js & Express.js 또는 Next.js API Routes: API 서버 구축
	•	Database: PostgreSQL, MySQL 또는 MongoDB
	•	ORM: Prisma 또는 Mongoose
	•	Authentication: NextAuth.js를 통한 Google Login 연동
	•	AI 연동: Google Gemini AI API (글 말투 변환 및 AI 봇 댓글 생성)
	•	캐싱 및 최적화: Redis 또는 메모리 캐싱

4.3 배포 및 인프라

	•	Vercel 또는 Netlify: 프론트엔드 호스팅
	•	AWS, GCP 또는 Heroku: 백엔드 및 데이터베이스 호스팅
	•	CI/CD 파이프라인: GitHub Actions 또는 GitLab CI

5. MVP 기능 개발 이후 추가 개선 사항

	•	팔로우 및 팔로잉 기능 구현
	•	사용자 간의 소셜 네트워크 강화
	•	실시간 알림 시스템 개선
	•	웹소켓을 이용한 실시간 알림 제공
	•	댓글에 대한 답글 기능
	•	사용자 간의 깊이 있는 대화 지원
	•	다양한 로그인 옵션 추가
	•	Facebook, Twitter 등 다른 소셜 로그인 지원
	•	모바일 앱 출시
	•	React Native 또는 Flutter를 이용한 모바일 앱 개발
	•	콘텐츠 검색 및 해시태그 기능
	•	특정 주제나 키워드로 콘텐츠 검색 가능
	•	다국어 지원
	•	영어 등 다른 언어로의 서비스 확대
	•	커뮤니티 및 그룹 기능
	•	공통 관심사를 가진 사용자들 간의 그룹 생성 및 참여
	•	광고 및 수익화 모델 도입
	•	프리미엄 기능 제공 또는 광고 배너 도입
	•	사용자 차단 및 신고 기능
	•	커뮤니티 가이드라인 준수를 위한 관리 도구 제공

부록: 개발 일정 및 우선순위

1주차

	•	프로젝트 셋업 및 기본 구조 설정
	•	사용자 인증 기능 구현 (Google Login)
	•	홈 화면 및 기본 레이아웃 구성

2주차

	•	글쓰기 기능 구현 (말투 변환 포함)
	•	게시물 열람 및 좋아요, 댓글 기능 개발
	•	카테고리 필터링 기능 추가

3주차

	•	그림 그리기 기능 구현
	•	AI를 통한 그림 평가 시스템 개발
	•	알림 기능 기본 구현

4주차

	•	일일 미션 및 업적 시스템 구축
	•	내 정보 페이지 완성
	•	전체 기능 테스트 및 버그 수정

5주차

	•	MVP 배포 준비
	•	사용자 피드백 수집 체계 마련
	•	향후 개선 사항 목록 정리

본 PRD는 SNS Bot의 성공적인 개발과 출시를 위한 지침서로 활용되며, MVP 개발에 집중하여 핵심 기능의 완성도를 높이는 것을 목표로 합니다.