"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getIdeaById, getIdeaInvestments } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Coins, Users, TrendingUp, Share2 } from "lucide-react"
import InvestmentModal from "@/components/InvestmentModal"
import Link from "next/link"

export default function IdeaDetailByQueryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ideaId = searchParams.get('ideaId') || ''
  const [idea, setIdea] = useState<any | null>(null)
  const [investments, setInvestments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false)

  async function load() {
    if (!ideaId) return
    try {
      setLoading(true)
      const [ideaData, invs] = await Promise.all([
        getIdeaById(ideaId),
        getIdeaInvestments(ideaId)
      ])
      setIdea(ideaData)
      setInvestments(invs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId])

  const handleInvestmentComplete = async () => {
    await load()
  }

  if (!ideaId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 text-gray-600">
        잘못된 접근입니다 (ideaId 파라미터 필요).
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 text-gray-600">
        아이디어를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => navigator.share?.({ title: idea.title, url: window.location.href })}>
          <Share2 className="h-4 w-4 mr-2" />
          공유
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{idea.title}</CardTitle>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary">{idea.domain}</Badge>
                {idea.stage && <Badge variant="outline">{idea.stage}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-yellow-600" />
                {(idea.total_investment || 0).toLocaleString()} 토큰
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {idea.investor_count || 0} 투자자
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="font-medium text-gray-900 mb-2">문제</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{idea.problem}</p>
          </section>
          <section>
            <h3 className="font-medium text-gray-900 mb-2">AI 솔루션</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{idea.ai_solution}</p>
          </section>
          {idea.tags && idea.tags.length > 0 && (
            <section>
              <h3 className="font-medium text-gray-900 mb-2">태그</h3>
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">#{tag}</Badge>
                ))}
              </div>
            </section>
          )}
          <div className="flex gap-3">
            <Button onClick={() => setInvestmentModalOpen(true)} className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" /> 투자하기
            </Button>
            <Link href={`/teams/new?ideaId=${idea.id}`}>
              <Button variant="outline" className="flex-1">팀 만들기</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">투자 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-sm text-gray-500">아직 투자가 없습니다.</div>
          ) : (
            <div className="space-y-2 text-sm">
              {investments.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between border-b py-2">
                  <div className="text-gray-700">{inv.auth?.users?.email || '사용자'}</div>
                  <div className="font-medium">{inv.amount.toLocaleString()} 토큰</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {idea && (
        <InvestmentModal
          isOpen={investmentModalOpen}
          onClose={() => setInvestmentModalOpen(false)}
          idea={idea}
          onInvestmentComplete={handleInvestmentComplete}
        />
      )}
    </div>
  )
}


