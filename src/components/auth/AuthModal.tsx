"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { X, Mail, Lock, User } from 'lucide-react'

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
  const { signIn, signUp } = useAuth()

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

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setEmail('')
    setPassword('')
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
