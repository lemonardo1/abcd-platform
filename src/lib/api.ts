import { supabase } from './supabase'

// 아이디어 관련 API
export async function addIdea(idea: {
  title: string
  domain: string
  problem: string
  ai_solution: string
  tags?: string[]
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      title: idea.title,
      domain: idea.domain,
      problem: idea.problem,
      ai_solution: idea.ai_solution,
      tags: idea.tags || [],
      user_id: user.id,
      stage: '아이디어'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function listIdeas(query?: string) {
  let queryBuilder = supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })

  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,domain.ilike.%${query}%,problem.ilike.%${query}%,ai_solution.ilike.%${query}%`)
  }

  const { data, error } = await queryBuilder
  if (error) throw error
  return data || []
}

export async function likeIdea(ideaId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { data: idea } = await supabase
    .from('ideas')
    .select('like_user_ids')
    .eq('id', ideaId)
    .single()

  if (!idea) throw new Error('아이디어를 찾을 수 없습니다')

  const likeUserIds = idea.like_user_ids || []
  const isLiked = likeUserIds.includes(user.id)
  
  const updatedLikes = isLiked 
    ? likeUserIds.filter((id: string) => id !== user.id)
    : [...likeUserIds, user.id]

  const { error } = await supabase
    .from('ideas')
    .update({ like_user_ids: updatedLikes })
    .eq('id', ideaId)

  if (error) throw error
}

// 팀 관련 API
export async function createTeam(team: {
  idea_id: string
  name: string
  description: string
  max_members: number
  required_skills: string[]
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { data, error } = await supabase
    .from('teams')
    .insert({
      idea_id: team.idea_id,
      name: team.name,
      description: team.description,
      max_members: team.max_members,
      required_skills: team.required_skills,
      leader_id: user.id,
      current_members: 1,
      status: '모집중'
    })
    .select()
    .single()

  if (error) throw error

  // 팀장을 팀 멤버로 추가
  await supabase
    .from('team_members')
    .insert({
      team_id: data.id,
      user_id: user.id,
      role: '팀장',
      status: '승인됨'
    })

  return data
}

export async function listTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      ideas (
        title,
        domain,
        problem
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function joinTeam(teamId: string, skills: string[]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: user.id,
      role: '팀원',
      skills: skills,
      status: '대기중'
    })
    .select()
    .single()

  if (error) throw error
  return data
}