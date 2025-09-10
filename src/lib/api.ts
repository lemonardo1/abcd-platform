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
    .select(`
      *,
      idea_investments (
        amount,
        user_id
      )
    `)
    .order('created_at', { ascending: false })

  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,domain.ilike.%${query}%,problem.ilike.%${query}%,ai_solution.ilike.%${query}%`)
  }

  const { data, error } = await queryBuilder
  if (error) throw error
  
  // 투자 정보를 계산하여 추가
  const ideasWithInvestments = (data || []).map(idea => {
    const investments = idea.idea_investments || []
    const totalInvestment = investments.reduce((sum: number, inv: any) => sum + inv.amount, 0)
    const investorCount = investments.length
    
    return {
      ...idea,
      total_investment: totalInvestment,
      investor_count: investorCount,
      investments: investments
    }
  })
  
  return ideasWithInvestments
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
        problem,
        ai_solution
      ),
      team_members (
        user_id,
        role,
        status
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // 멤버 정보를 정리해서 반환
  const teamsWithMembers = (data || []).map(team => ({
    ...team,
    members: team.team_members?.filter((member: any) => member.status === '승인됨') || []
  }))
  
  return teamsWithMembers
}

export async function joinTeam(teamId: string, skills: string[] = []) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  // 이미 참여 중인지 확인
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    throw new Error('이미 참여 중인 팀입니다')
  }

  // 팀 정보 확인
  const { data: team } = await supabase
    .from('teams')
    .select('current_members, max_members, status')
    .eq('id', teamId)
    .single()

  if (!team) throw new Error('팀을 찾을 수 없습니다')
  if (team.current_members >= team.max_members) {
    throw new Error('팀 인원이 가득 찼습니다')
  }
  if (team.status !== '모집중') {
    throw new Error('모집이 마감된 팀입니다')
  }

  // 팀 멤버로 추가
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: user.id,
      role: '팀원',
      skills: skills,
      status: '승인됨'
    })
    .select()
    .single()

  if (error) throw error

  // 팀의 current_members 증가
  await supabase
    .from('teams')
    .update({ current_members: team.current_members + 1 })
    .eq('id', teamId)

  return data
}

// 토큰 관련 API
export async function getUserTokenBalance() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { data, error } = await supabase
    .from('user_tokens')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // 토큰 데이터가 없는 경우 0 반환
    if (error.code === 'PGRST116') {
      return { balance: 0 }
    }
    throw error
  }
  
  return data
}

export async function getTokenTransactions(limit = 50) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { data, error } = await supabase
    .from('token_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function addTokenTransaction(
  amount: number, 
  transactionType: string, 
  description?: string, 
  referenceId?: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { data, error } = await supabase
    .from('token_transactions')
    .insert({
      user_id: user.id,
      amount,
      transaction_type: transactionType,
      description,
      reference_id: referenceId
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function useTokens(amount: number, description: string, referenceId?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  // 현재 잔액 확인
  const balance = await getUserTokenBalance()
  if (balance.balance < amount) {
    throw new Error('토큰 잔액이 부족합니다')
  }

  // 토큰 사용 트랜잭션 추가 (음수로)
  return await addTokenTransaction(-amount, 'usage', description, referenceId)
}

// 아이디어 투자 관련 API
export async function investInIdea(ideaId: string, amount: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  // 현재 잔액 확인
  const balance = await getUserTokenBalance()
  if (balance.balance < amount) {
    throw new Error('토큰 잔액이 부족합니다')
  }

  // 기존 투자 확인
  const { data: existingInvestment } = await supabase
    .from('idea_investments')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .single()

  if (existingInvestment) {
    // 기존 투자가 있으면 업데이트
    const { error: updateError } = await supabase
      .from('idea_investments')
      .update({ amount: existingInvestment.amount + amount })
      .eq('id', existingInvestment.id)

    if (updateError) throw updateError
  } else {
    // 새로운 투자
    const { error: insertError } = await supabase
      .from('idea_investments')
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        amount
      })

    if (insertError) throw insertError
  }

  // 토큰 사용 트랜잭션 추가
  await addTokenTransaction(-amount, 'investment', `아이디어 투자`, ideaId)
  
  return { success: true }
}

export async function getIdeaInvestments(ideaId: string) {
  const { data, error } = await supabase
    .from('idea_investments')
    .select(`
      *,
      auth.users (
        email
      )
    `)
    .eq('idea_id', ideaId)
    .order('amount', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getUserInvestments() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { data, error } = await supabase
    .from('idea_investments')
    .select(`
      *,
      ideas (
        title,
        domain
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}