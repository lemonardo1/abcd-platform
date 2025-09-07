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