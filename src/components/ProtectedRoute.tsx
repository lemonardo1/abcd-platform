"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import AuthModal from '@/components/auth/AuthModal'
import { Card, CardContent } from '@/components/ui/card'
import { User, Lock } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true)
    }
  }, [loading, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {fallback || (
          <div className="max-w-md mx-auto mt-12">
            <Card>
              <CardContent className="text-center p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  로그인이 필요합니다
                </h2>
                <p className="text-gray-600 mb-4">
                  이 기능을 사용하려면 먼저 로그인해주세요.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <User className="h-4 w-4 mr-2" />
                    로그인하기
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      </>
    )
  }

  return <>{children}</>
}
