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

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_domain ON ideas(domain);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX idx_teams_idea_id ON teams(idea_id);
CREATE INDEX idx_teams_leader_id ON teams(leader_id);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- 토큰 잔액 테이블
CREATE TABLE user_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 토큰 트랜잭션 테이블
CREATE TABLE token_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 양수: 충전, 음수: 사용
  transaction_type TEXT NOT NULL, -- 'signup_bonus', 'purchase', 'usage', 'refund' 등
  description TEXT,
  reference_id UUID, -- 관련 아이디어나 팀 ID 등
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- 토큰 정책 (본인만 조회 가능)
CREATE POLICY "Users can view their own tokens" ON user_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert user tokens" ON user_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update user tokens" ON user_tokens FOR UPDATE USING (true);

-- 트랜잭션 정책 (본인만 조회 가능)
CREATE POLICY "Users can view their own transactions" ON token_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON token_transactions FOR INSERT WITH CHECK (true);

-- 인덱스 생성
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX idx_token_transactions_type ON token_transactions(transaction_type);

-- 토큰 잔액 업데이트 함수
CREATE OR REPLACE FUNCTION update_token_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- 토큰 잔액 업데이트
  INSERT INTO user_tokens (user_id, balance, updated_at)
  VALUES (NEW.user_id, NEW.amount, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = user_tokens.balance + NEW.amount,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트랜잭션 추가 시 잔액 자동 업데이트 트리거
CREATE TRIGGER trigger_update_token_balance
  AFTER INSERT ON token_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_token_balance();

-- 회원가입 시 1000원 토큰 지급 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 신규 사용자에게 1000원 토큰 지급
  INSERT INTO token_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 1000, 'signup_bonus', '회원가입 축하 토큰');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 새 사용자 등록 시 토큰 지급 트리거
CREATE TRIGGER trigger_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 아이디어 투자 테이블
CREATE TABLE idea_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, user_id) -- 한 사용자당 하나의 아이디어에 한 번만 투자 가능
);

-- 아이디어 투자 RLS 정책
ALTER TABLE idea_investments ENABLE ROW LEVEL SECURITY;

-- 투자 정책
CREATE POLICY "Anyone can view investments" ON idea_investments FOR SELECT USING (true);
CREATE POLICY "Users can invest in ideas" ON idea_investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investments" ON idea_investments FOR UPDATE USING (auth.uid() = user_id);

-- 투자 인덱스
CREATE INDEX idx_idea_investments_idea_id ON idea_investments(idea_id);
CREATE INDEX idx_idea_investments_user_id ON idea_investments(user_id);
CREATE INDEX idx_idea_investments_amount ON idea_investments(amount DESC);

-- 팀 결과물(아티팩트) 테이블
CREATE TABLE IF NOT EXISTS team_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT, -- Supabase Storage public URL
  link_url TEXT,  -- 외부 사이트 링크
  description TEXT
);

-- 팀 결과물 RLS 비활성화 (열림)
ALTER TABLE team_artifacts DISABLE ROW LEVEL SECURITY;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_team_artifacts_team_id ON team_artifacts(team_id);
CREATE INDEX IF NOT EXISTS idx_team_artifacts_user_id ON team_artifacts(user_id);

-- Supabase Storage: artifacts 버킷 생성 (존재하면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('artifacts', 'artifacts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책: 공개 읽기, 인증 사용자 업로드 허용
DROP POLICY IF EXISTS "Public read artifacts bucket" ON storage.objects;
CREATE POLICY "Public read artifacts bucket" ON storage.objects FOR SELECT
USING (bucket_id = 'artifacts');

DROP POLICY IF EXISTS "Authenticated can upload artifacts" ON storage.objects;
CREATE POLICY "Authenticated can upload artifacts" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'artifacts' AND auth.role() = 'authenticated');

-- =============================================
-- 사용자 프로필 및 교사-학생 연결 스키마 추가
-- =============================================

-- 프로필 테이블: 사용자 이름, 학교명, 역할 저장
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','teacher')) DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필 조회/수정/삽입 허용
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 교사 목록 공개 조회 허용 (교사만 공개)
DROP POLICY IF EXISTS "Anyone can view teachers" ON profiles;
CREATE POLICY "Anyone can view teachers" ON profiles
  FOR SELECT USING (role = 'teacher');

-- 갱신 시각 자동 갱신 트리거
CREATE OR REPLACE FUNCTION set_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profiles_updated_at();

-- 교사-학생 연결 테이블
CREATE TABLE IF NOT EXISTS teacher_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

-- RLS 활성화
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;

-- 학생은 자신의 요청을 생성/조회 가능
DROP POLICY IF EXISTS "Students can create link to teacher" ON teacher_students;
CREATE POLICY "Students can create link to teacher" ON teacher_students
  FOR INSERT WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "Students can view own links" ON teacher_students;
CREATE POLICY "Students can view own links" ON teacher_students
  FOR SELECT USING (auth.uid() = student_id);

-- 교사는 자신의 학생 링크를 조회/승인/거절/삭제 가능
DROP POLICY IF EXISTS "Teachers manage own student links (select)" ON teacher_students;
CREATE POLICY "Teachers manage own student links (select)" ON teacher_students
  FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Teachers manage own student links (update)" ON teacher_students;
CREATE POLICY "Teachers manage own student links (update)" ON teacher_students
  FOR UPDATE USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Teachers manage own student links (delete)" ON teacher_students;
CREATE POLICY "Teachers manage own student links (delete)" ON teacher_students
  FOR DELETE USING (auth.uid() = teacher_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON profiles(school_name);
CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_student ON teacher_students(student_id);

DROP POLICY IF EXISTS "Authenticated can update own artifacts" ON storage.objects;
CREATE POLICY "Authenticated can update own artifacts" ON storage.objects FOR UPDATE
USING (bucket_id = 'artifacts' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'artifacts' AND auth.role() = 'authenticated');

--
