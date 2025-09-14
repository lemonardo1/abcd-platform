"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { addTokenTransaction } from '@/lib/api'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1) OAuth code → Session 교환 (필수)
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(window.location.href)
        if (exchangeError) {
          console.error('OAuth 코드 교환 오류:', exchangeError)
          toast.error('로그인에 실패했습니다.')
          router.push('/')
          return
        }

        // 2) 세션 확인
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('OAuth 콜백 오류:', error)
          toast.error('로그인에 실패했습니다.')
          router.push('/')
          return
        }

        if (data.session?.user) {
          const user = data.session.user
          console.log('Google 로그인 성공:', user.email)
          
          // 새 사용자인지 확인 (created_at과 last_sign_in_at이 거의 같으면 새 사용자)
          const createdAt = new Date(user.created_at)
          const lastSignIn = new Date(user.last_sign_in_at || user.created_at)
          const timeDiff = Math.abs(lastSignIn.getTime() - createdAt.getTime())
          
          // 5초 이내 차이면 새 사용자로 간주
          if (timeDiff < 5000) {
            try {
              await addTokenTransaction(1000, 'signup_bonus', 'Google 회원가입 축하 토큰')
              toast.success('Google 로그인 성공! 환영 토큰 1000원이 지급되었습니다.')
              console.log('신규 Google 사용자 토큰 1000원 지급 완료')
            } catch (tokenError) {
              console.error('토큰 지급 오류:', tokenError)
              toast.success('Google 로그인 성공!')
            }
          } else {
            toast.success('Google 로그인 성공!')
          }
          
          // 메인 페이지로 리다이렉트
          router.push('/')
        } else {
          console.log('세션이 없습니다.')
          router.push('/')
        }
      } catch (error) {
        console.error('콜백 처리 중 오류:', error)
        toast.error('로그인 처리 중 오류가 발생했습니다.')
        router.push('/')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}
