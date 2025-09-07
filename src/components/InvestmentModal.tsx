"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { investInIdea, getUserTokenBalance } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Coins, TrendingUp, X } from 'lucide-react'

interface InvestmentModalProps {
  isOpen: boolean
  onClose: () => void
  idea: {
    id: string
    title: string
    domain: string
    total_investment?: number
    investor_count?: number
  }
  onInvestmentComplete: () => void
}

export default function InvestmentModal({ 
  isOpen, 
  onClose, 
  idea, 
  onInvestmentComplete 
}: InvestmentModalProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleInvest = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }

    const investmentAmount = parseInt(amount)
    if (!investmentAmount || investmentAmount <= 0) {
      toast.error('올바른 투자 금액을 입력해주세요')
      return
    }

    if (investmentAmount < 100) {
      toast.error('최소 투자 금액은 100토큰입니다')
      return
    }

    try {
      setLoading(true)
      
      // 현재 잔액 확인
      const balance = await getUserTokenBalance()
      if (balance.balance < investmentAmount) {
        toast.error('토큰 잔액이 부족합니다')
        return
      }

      await investInIdea(idea.id, investmentAmount)
      toast.success(`${investmentAmount.toLocaleString()}토큰을 투자했습니다!`)
      
      onInvestmentComplete()
      onClose()
      setAmount('')
    } catch (error: any) {
      console.error('투자 오류:', error)
      toast.error(error.message || '투자에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [100, 500, 1000, 2000]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            아이디어 투자
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* 아이디어 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-1">{idea.title}</h3>
            <p className="text-sm text-gray-600">{idea.domain}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>총 투자: {(idea.total_investment || 0).toLocaleString()}토큰</span>
              <span>투자자: {idea.investor_count || 0}명</span>
            </div>
          </div>

          {/* 투자 금액 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              투자할 토큰 수량
            </label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-600" />
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="최소 100토큰"
                className="pl-10"
                min="100"
              />
            </div>
          </div>

          {/* 빠른 선택 버튼 */}
          <div>
            <p className="text-sm text-gray-600 mb-2">빠른 선택</p>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="text-xs"
                >
                  {quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
            <p className="font-medium mb-1">💡 투자 안내</p>
            <ul className="text-xs space-y-1">
              <li>• 최소 투자 금액: 100토큰</li>
              <li>• 같은 아이디어에 중복 투자 가능</li>
              <li>• 투자한 토큰은 환불되지 않습니다</li>
            </ul>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={handleInvest}
              className="flex-1"
              disabled={loading || !amount}
            >
              {loading ? '투자 중...' : `${parseInt(amount || '0').toLocaleString()}토큰 투자하기`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
