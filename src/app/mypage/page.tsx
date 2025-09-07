"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserTokenBalance, getTokenTransactions, getUserInvestments } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Coins, History, User, CreditCard, TrendingUp, Target } from 'lucide-react'

interface TokenTransaction {
  id: string
  amount: number
  transaction_type: string
  description: string | null
  created_at: string
}

interface UserInvestment {
  id: string
  amount: number
  created_at: string
  ideas: {
    title: string
    domain: string
  }
}

export default function MyPage() {
  const { user } = useAuth()
  const [tokenBalance, setTokenBalance] = useState(0)
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const [investments, setInvestments] = useState<UserInvestment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadTokenData()
    }
  }, [user])

  const loadTokenData = async () => {
    try {
      setLoading(true)
      const [balanceData, transactionsData, investmentsData] = await Promise.all([
        getUserTokenBalance(),
        getTokenTransactions(20),
        getUserInvestments()
      ])
      
      setTokenBalance(balanceData.balance)
      setTransactions(transactionsData)
      setInvestments(investmentsData)
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'signup_bonus': '회원가입 보너스',
      'purchase': '토큰 구매',
      'investment': '아이디어 투자',
      'usage': '토큰 사용',
      'refund': '환불'
    }
    return typeMap[type] || type
  }

  const getTransactionTypeBadge = (type: string, amount: number) => {
    if (amount > 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800">충전</Badge>
    } else {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">사용</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <User className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 사용자 정보 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  계정 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">이메일</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">가입일</span>
                    <span className="font-medium">
                      {user?.created_at ? formatDate(user.created_at) : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 토큰 잔액 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-600" />
                  토큰 현황
                </CardTitle>
                <CardDescription>
                  내 토큰 잔액과 투자 현황입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-yellow-600">
                        {tokenBalance.toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-600">토큰</span>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      토큰 충전
                    </Button>
                  </div>
                  
                  {investments.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {investments.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">총 투자액</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {investments.length}
                        </div>
                        <div className="text-xs text-gray-500">투자 건수</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 투자 현황 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  내 투자 현황
                </CardTitle>
                <CardDescription>
                  투자한 아이디어들의 현황을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {investments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    아직 투자한 아이디어가 없습니다
                  </div>
                ) : (
                  <div className="space-y-3">
                    {investments.slice(0, 5).map((investment) => (
                      <div
                        key={investment.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-900">
                              {investment.ideas.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="outline" className="text-xs">
                              {investment.ideas.domain}
                            </Badge>
                            <span>•</span>
                            <span>{formatDate(investment.created_at)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">
                            {investment.amount.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">토큰</span>
                        </div>
                      </div>
                    ))}
                    {investments.length > 5 && (
                      <div className="text-center text-sm text-gray-500">
                        총 {investments.length}개의 투자 중 5개 표시
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 토큰 내역 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  토큰 거래 내역
                </CardTitle>
                <CardDescription>
                  최근 20개의 토큰 거래 내역입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    아직 토큰 거래 내역이 없습니다
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            {getTransactionTypeBadge(transaction.transaction_type, transaction.amount)}
                            <span className="font-medium">
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </span>
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-gray-600">{transaction.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-lg font-bold ${
                              transaction.amount > 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}
                          >
                            {transaction.amount > 0 ? '+' : ''}
                            {transaction.amount.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">토큰</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
