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