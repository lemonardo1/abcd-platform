// 공통 타입 정의
export interface User {
  id: string
  email: string
  created_at: string
}

export type UserRole = 'student' | 'teacher'

export interface Profile {
  user_id: string
  full_name: string
  school_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface TeacherStudentLink {
  id: string
  teacher_id: string
  student_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

// 아이디어 관련 타입
export interface Idea {
  id: string
  title: string
  domain: string
  problem: string
  ai_solution: string
  tags: string[]
  user_id: string
  stage: string
  is_visible: boolean
  like_user_ids: string[]
  created_at: string
  updated_at: string
  total_investment?: number
  investor_count?: number
  investments?: IdeaInvestment[]
}

export interface CreateIdeaRequest {
  title: string
  domain: string
  problem: string
  ai_solution: string
  tags?: string[]
}

export interface IdeaInvestment {
  id: string
  idea_id: string
  user_id: string
  amount: number
  created_at: string
}

// 팀 관련 타입
export interface Team {
  id: string
  idea_id: string
  name: string
  description: string
  max_members: number
  current_members: number
  required_skills: string[]
  leader_id: string
  status: '모집중' | '모집완료' | '활동중' | '완료'
  created_at: string
  updated_at: string
  idea?: Idea
  members?: TeamMember[]
  latest_artifact_image?: string
}

export interface CreateTeamRequest {
  idea_id: string
  name: string
  description: string
  max_members: number
  required_skills: string[]
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: '팀장' | '팀원'
  skills: string[]
  status: '대기중' | '승인됨' | '거절됨'
  created_at: string
}

// 토큰 관련 타입
export interface UserTokenBalance {
  balance: number
}

export interface TokenTransaction {
  id: string
  user_id: string
  amount: number
  transaction_type: 'reward' | 'usage' | 'investment'
  description?: string
  reference_id?: string
  created_at: string
}

// 팀 아티팩트 관련 타입
export interface TeamArtifact {
  id: string
  team_id: string
  user_id: string
  image_url?: string
  link_url?: string
  description?: string
  created_at: string
}

export interface CreateArtifactRequest {
  team_id: string
  image_url?: string
  link_url?: string
  description?: string
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T
  error?: string
}

// 페이지네이션 타입
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
}