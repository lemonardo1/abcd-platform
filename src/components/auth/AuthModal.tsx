"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { X, Mail, Lock, User } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [sendingReset, setSendingReset] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      toast.error('이메일과 비밀번호를 입력해주세요.')
      return
    }

    if (password.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    try {
      setLoading(true)
      
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('로그인 성공!')
      } else {
        await signUp(email, password)
        toast.success('회원가입 성공! 이메일을 확인해주세요.')
      }
      
      onClose()
      setEmail('')
      setPassword('')
    } catch (error: any) {
      console.error('인증 오류:', error)
      
      let errorMessage = '오류가 발생했습니다.'
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 잘못되었습니다.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 확인이 필요합니다. 이메일을 확인해주세요.'
      } else if (error.message.includes('User already registered')) {
        errorMessage = '이미 가입된 이메일입니다.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
      // Google 로그인은 리다이렉트되므로 여기서는 모달을 닫지 않음
    } catch (error: any) {
      console.error('Google 로그인 오류:', error)
      toast.error('Google 로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setEmail('')
    setPassword('')
  }

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      toast.error('비밀번호 재설정을 위해 이메일을 입력해주세요.')
      return
    }
    try {
      setSendingReset(true)
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`
      })
      toast.success('재설정 링크가 이메일로 전송되었습니다.')
    } catch (error: any) {
      console.error('비밀번호 재설정 메일 오류:', error)
      toast.error(error?.message || '메일 전송에 실패했습니다.')
    } finally {
      setSendingReset(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <Card className="border-0 shadow-none">
          <CardHeader className="relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {mode === 'login' ? '로그인' : '회원가입'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {mode === 'login' 
                  ? '아이디어를 제출하고 팀에 참여해보세요' 
                  : '새 계정을 만들어 시작해보세요'
                }
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자 이상 입력해주세요"
                    className="pl-10"
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading 
                  ? (mode === 'login' ? '로그인 중...' : '회원가입 중...') 
                  : (mode === 'login' ? '로그인' : '회원가입')
                }
              </Button>
            </form>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">또는</span>
              </div>
            </div>

            {/* Google 로그인 버튼 */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 {mode === 'login' ? '로그인' : '회원가입'}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                {mode === 'login' 
                  ? '계정이 없으신가요? 회원가입' 
                  : '이미 계정이 있으신가요? 로그인'
                }
              </button>
            </div>

            {mode === 'login' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-xs text-gray-500 hover:underline"
                  disabled={loading || sendingReset}
                >
                  {sendingReset ? '메일 전송 중...' : '비밀번호를 잊으셨나요? 비밀번호 재설정'}
                </button>
              </div>
            )}
            
            {mode === 'signup' && (
              <div className="text-xs text-gray-500 text-center">
                회원가입 후 이메일 확인이 필요합니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
