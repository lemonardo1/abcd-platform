"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { addTokenTransaction } from '@/lib/api'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 확인
    const getSession = async () => {
      try {
        console.log('초기 세션 확인 중...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('세션 확인 오류:', error)
        } else {
          console.log('초기 세션:', session?.user?.email || 'null')
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('세션 확인 중 예외 발생:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'null')
        
        // 로그아웃 이벤트 처리
        if (event === 'SIGNED_OUT') {
          console.log('사용자가 로그아웃됨')
          setSession(null)
          setUser(null)
        } else if (event === 'SIGNED_IN') {
          console.log('사용자가 로그인됨:', session?.user?.email)
          setSession(session)
          setUser(session?.user ?? null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error

    // 회원가입 성공 시, 사용자가 확인되면 토큰 지급
    // 이메일 확인이 필요한 경우는 trigger_handle_new_user에서 처리됨
    // 이메일 확인이 불필요한 경우 여기서 직접 처리
    if (data.user && !data.user.email_confirmed_at) {
      console.log('이메일 확인 필요 - 토큰은 확인 후 자동 지급됩니다')
    } else if (data.user) {
      try {
        // 즉시 확인된 사용자의 경우 토큰 지급
        await addTokenTransaction(1000, 'signup_bonus', '회원가입 축하 토큰')
        console.log('회원가입 토큰 1000원 지급 완료')
      } catch (tokenError) {
        console.error('토큰 지급 오류:', tokenError)
        // 토큰 지급 실패해도 회원가입은 성공으로 처리
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    try {
      console.log('로그아웃 시도...')
      
      // 로컬 상태 먼저 정리
      setUser(null)
      setSession(null)
      
      // Supabase 로그아웃
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase 로그아웃 오류:', error)
        throw error
      }
      
      console.log('로그아웃 성공')
      
      // 페이지 새로고침으로 상태 완전 초기화 (배포 환경에서 안전)
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/'
        }, 100)
      }
      
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error)
      
      // 오류가 발생해도 로컬 상태는 정리
      setUser(null)
      setSession(null)
      
      // 강제 새로고침
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
      
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
