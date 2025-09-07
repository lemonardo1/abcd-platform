"use client"

import { listIdeas, likeIdea } from "@/lib/api"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Heart, Plus, Search } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function IdeasPage() {
  const [query, setQuery] = useState("")
  const [ideas, setIdeas] = useState<any[]>([])
  const [visible, setVisible] = useState(12)
  const [loading, setLoading] = useState(false)

  async function loadIdeas() {
    try {
      setLoading(true)
      const data = await listIdeas(query)
      setIdeas(data)
      setVisible(12)
    } catch (error) {
      console.error("아이디어 로딩 오류:", error)
      toast.error("아이디어 목록을 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIdeas()
  }, [])

  const handleLike = async (ideaId: string) => {
    try {
      await likeIdea(ideaId)
      await loadIdeas()
    } catch (error) {
      console.error("좋아요 오류:", error)
      toast.error("좋아요 처리에 실패했습니다.")
    }
  }

  const visibleIdeas = ideas.slice(0, visible)
  const hasMore = visible < ideas.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">아이디어 둘러보기</h1>
          <p className="text-gray-600">혁신적인 아이디어들을 확인하고 팀에 참여해보세요</p>
        </div>
        <Link href="/ideas/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 아이디어 제출
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-2">
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
      </div>

      {/* Ideas Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleIdeas.map((idea) => (
          <Card key={idea.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {idea.title}
                </h3>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {idea.domain}
                </Badge>
              </div>

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

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-gray-500">
                  {idea.stage} · 좋아요 {(idea.like_user_ids || []).length}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLike(idea.id)}
                    className="h-8 px-2"
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    좋아요
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
    </div>
  )
}