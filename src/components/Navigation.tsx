"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import { User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function Navigation() {
  const { user, signOut, loading } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return // 중복 클릭 방지
    
    try {
      setIsSigningOut(true)
      toast.info('로그아웃 중...')
      await signOut()
      toast.success('로그아웃되었습니다.')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      toast.error('로그아웃에 실패했습니다. 페이지를 새로고침합니다.')
      
      // 오류 발생 시 강제 새로고침
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } finally {
      setIsSigningOut(false)
    }
  }

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  return (
    <>
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                ABCD Platform
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/ideas" className="text-gray-700 hover:text-gray-900">
                아이디어
              </Link>
              <Link href="/teams" className="text-gray-700 hover:text-gray-900">
                팀
              </Link>
              
              {loading ? (
                <div className="w-20 h-9 bg-gray-200 animate-pulse rounded"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:block">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="flex items-center space-x-1"
                  >
                    {isSigningOut ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    <span className="hidden sm:block">
                      {isSigningOut ? '로그아웃 중...' : '로그아웃'}
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAuthModal('login')}
                  >
                    로그인
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openAuthModal('signup')}
                  >
                    회원가입
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  )
}
