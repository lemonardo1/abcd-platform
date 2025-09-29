import { supabase } from '@/lib/supabase'
import { CreateIdeaRequest, Idea, IdeaInvestment } from '@/types'

export async function addIdea(idea: CreateIdeaRequest) {
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

export async function listIdeas(query?: string): Promise<Idea[]> {
  let queryBuilder = supabase
    .from('ideas')
    .select(`
      *,
      idea_investments (
        amount,
        user_id
      )
    `)
    .eq('is_visible', true)
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

export async function getIdeaById(ideaId: string): Promise<Idea> {
  const { data, error } = await supabase
    .from('ideas')
    .select(`
      *,
      idea_investments (
        amount,
        user_id
      )
    `)
    .eq('id', ideaId)
    .single()

  if (error) throw error

  const investments = (data as any)?.idea_investments || []
  const totalInvestment = investments.reduce((sum: number, inv: any) => sum + inv.amount, 0)
  const investorCount = investments.length

  return {
    ...data,
    total_investment: totalInvestment,
    investor_count: investorCount,
    investments
  }
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

export async function investInIdea(ideaId: string, amount: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  // 현재 잔액 확인
  const { getUserTokenBalance } = await import('./tokenService')
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
  const { addTokenTransaction } = await import('./tokenService')
  await addTokenTransaction(-amount, 'investment', `아이디어 투자`, ideaId)
  
  return { success: true }
}

export async function getIdeaInvestments(ideaId: string): Promise<IdeaInvestment[]> {
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

export async function getUserInvestments(): Promise<IdeaInvestment[]> {
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