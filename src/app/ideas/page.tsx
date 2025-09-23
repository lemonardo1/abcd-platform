"use client"

import { listIdeas, getUserTokenBalance } from "@/lib/api"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Plus, Search, Coins, Users, BarChart3, DollarSign } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import InvestmentModal from "@/components/InvestmentModal"

export default function IdeasPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [ideas, setIdeas] = useState<any[]>([])
  const [visible, setVisible] = useState(12)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState<'latest' | 'top'>('latest')
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<any>(null)
  const [tokenBalance, setTokenBalance] = useState(0)

  async function loadIdeas() {
    try {
      setLoading(true)
      const data = await listIdeas(query)
      const sorted = sort === 'top'
        ? [...data].sort((a, b) => (b.total_investment || 0) - (a.total_investment || 0))
        : data
      setIdeas(sorted)
      setVisible(12)
    } catch (error) {
      console.error("아이디어 로딩 오류:", error)
      toast.error("아이디어 목록을 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  async function loadTokenBalance() {
    if (user) {
      try {
        const balance = await getUserTokenBalance()
        setTokenBalance(balance.balance)
      } catch (error) {
        console.error('토큰 잔액 로드 오류:', error)
      }
    }
  }

  useEffect(() => {
    loadIdeas()
    loadTokenBalance()
  }, [user, sort])

  const handleInvestClick = (idea: any) => {
    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }
    setSelectedIdea(idea)
    setInvestmentModalOpen(true)
  }

  const handleInvestmentComplete = async () => {
    await loadIdeas()
    await loadTokenBalance()
  }

  // 통계 계산
  const totalInvestment = ideas.reduce((sum, idea) => sum + (idea.total_investment || 0), 0)
  const totalIdeas = ideas.length
  const averageInvestment = totalIdeas > 0 ? Math.round(totalInvestment / totalIdeas) : 0
  const topIdeas = [...ideas].sort((a, b) => (b.total_investment || 0) - (a.total_investment || 0)).slice(0, 3)

  const visibleIdeas = ideas.slice(0, visible)
  const hasMore = visible < ideas.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            아이디어 투자 대시보드
          </h1>
          <p className="text-gray-600 mt-1">혁신적인 아이디어에 투자하고 성장을 함께하세요</p>
        </div>
        <Link href="/ideas/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            새 아이디어 제출
          </Button>
        </Link>
      </div>

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 투자액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvestment.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">토큰</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 아이디어</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIdeas}</div>
            <p className="text-xs text-muted-foreground">개</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 투자액</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageInvestment.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">토큰</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">내 토큰</CardTitle>
            <Coins className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{tokenBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">토큰</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목, 도메인, 문제, AI 솔루션으로 검색..."
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && loadIdeas()}
          />
        </div>
        <Button onClick={loadIdeas} disabled={loading}>
          {loading ? "검색 중..." : "검색"}
        </Button>
        <div className="ml-auto text-sm flex items-center gap-2">
          <span className="text-gray-500">정렬:</span>
          <Button
            variant={sort === 'latest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSort('latest')}
            className="h-8"
          >
            최신순
          </Button>
          <Button
            variant={sort === 'top' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSort('top')}
            className="h-8"
          >
            투자 많은 순
          </Button>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleIdeas.map((idea) => (
          <Card key={idea.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-200">
            <CardContent className="p-4 space-y-3">
              <Link href={`/ideas/detail?ideaId=${idea.id}`}>
                <div className="cursor-pointer">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 hover:underline">
                    {idea.title}
                  </h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {idea.domain}
                  </Badge>
                </div>
              </Link>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">문제:</span>
                  <p className="text-gray-600 line-clamp-2 mt-1">
                    {idea.problem}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">AI 솔루션:</span>
                  <p className="text-gray-600 line-clamp-2 mt-1">
                    {idea.ai_solution}
                  </p>
                </div>
              </div>

              {idea.tags && idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {idea.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{idea.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{idea.stage}</span>
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-yellow-600" />
                      {(idea.total_investment || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {idea.investor_count || 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInvestClick(idea)}
                    className="h-8 px-2 flex-1 text-green-600 border-green-200 hover:bg-green-50"
                    disabled={!user}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    투자하기
                  </Button>
                  <Link href={`/teams/new?ideaId=${idea.id}`}>
                    <Button size="sm" className="h-8 px-2">
                      팀 만들기
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {ideas.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">아이디어가 없습니다</div>
          <Link href="/ideas/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 아이디어 제출하기
            </Button>
          </Link>
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setVisible(v => v + 12)}
          >
            더보기 ({visible} / {ideas.length})
          </Button>
        </div>
      )}

      {!hasMore && ideas.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          모든 아이디어를 확인했습니다
        </div>
      )}

      {/* 투자 모달 */}
      {selectedIdea && (
        <InvestmentModal
          isOpen={investmentModalOpen}
          onClose={() => setInvestmentModalOpen(false)}
          idea={selectedIdea}
          onInvestmentComplete={handleInvestmentComplete}
        />
      )}
    </div>
  )
}