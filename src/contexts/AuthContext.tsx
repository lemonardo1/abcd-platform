"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
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
