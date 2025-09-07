# 팀 빌더 - 아이디어 기반 팀 빌딩 SaaS

아이디어를 제출하고 팀원을 모집하여 프로젝트를 실현하는 플랫폼입니다.

## 주요 기능

- **아이디어 제출**: ABCD 방법론을 활용한 체계적인 아이디어 작성
- **팀 빌딩**: 아이디어를 기반으로 팀 구성 및 팀원 모집
- **실시간 협업**: Supabase Realtime을 활용한 실시간 업데이트
- **사용자 인증**: Supabase Auth를 통한 안전한 사용자 관리

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgREST, Auth, Realtime, RLS)
- **배포**: Cloudflare Pages (정적 배포)
- **UI 컴포넌트**: Radix UI, Lucide React

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성하세요
2. 프로젝트 설정에서 API 정보를 확인하세요:
   - Project URL: `https://your-project.supabase.co`
   - anon public key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. 환경 변수 설정

`.env.example`을 참고하여 `.env.local` 파일을 생성하고 실제 Supabase 정보를 입력하세요:

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어서 다음 값들을 실제 Supabase 프로젝트 값으로 변경하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
```

### 4. Supabase 데이터베이스 설정

다음 SQL을 Supabase SQL Editor에서 실행하여 테이블을 생성하세요:

```sql
-- 아이디어 테이블
CREATE TABLE ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  problem TEXT NOT NULL,
  ai_solution TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  like_user_ids UUID[] DEFAULT '{}',
  stage TEXT DEFAULT '아이디어'
);

-- 팀 테이블
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 4,
  current_members INTEGER NOT NULL DEFAULT 1,
  required_skills TEXT[] DEFAULT '{}',
  leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT '모집중'
);

-- 팀 멤버 테이블
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  status TEXT DEFAULT '대기중'
);

-- RLS 정책 설정
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 아이디어 정책
CREATE POLICY "Anyone can view ideas" ON ideas FOR SELECT USING (true);
CREATE POLICY "Users can insert their own ideas" ON ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideas" ON ideas FOR UPDATE USING (auth.uid() = user_id);

-- 팀 정책
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Users can insert their own teams" ON teams FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Team leaders can update their teams" ON teams FOR UPDATE USING (auth.uid() = leader_id);

-- 팀 멤버 정책
CREATE POLICY "Anyone can view team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Users can insert themselves as team members" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own membership" ON team_members FOR UPDATE USING (auth.uid() = user_id);
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 6. 빌드 및 배포

```bash
npm run build
```

생성된 `out` 폴더를 Cloudflare Pages에 배포하세요.

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── ideas/          # 아이디어 관련 페이지
│   ├── teams/          # 팀 관련 페이지
│   └── layout.tsx      # 레이아웃
├── components/         # 재사용 가능한 컴포넌트
│   └── ui/            # UI 컴포넌트
├── lib/               # 유틸리티 및 API
│   ├── api.ts         # Supabase API 함수
│   ├── supabase.ts    # Supabase 클라이언트
│   └── utils.ts       # 유틸리티 함수
```

## 주요 페이지

- `/` - 홈페이지
- `/ideas` - 아이디어 목록
- `/ideas/new` - 새 아이디어 제출
- `/teams` - 팀 목록
- `/teams/new` - 새 팀 만들기

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.