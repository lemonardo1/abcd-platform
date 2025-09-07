"use client"

import { listTeams } from "@/lib/api"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, MapPin } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadTeams() {
    try {
      const data = await listTeams()
      setTeams(data)
    } catch (error) {
      console.error("팀 로딩 오류:", error)
      toast.error("팀 목록을 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">팀 목록을 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">팀 둘러보기</h1>
          <p className="text-gray-600">활발히 활동 중인 팀들을 확인하고 참여해보세요</p>
        </div>
        <Link href="/ideas">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            아이디어에서 팀 만들기
          </Button>
        </Link>
      </div>

      {/* Teams Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {team.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={team.status === '모집중' ? 'default' : 'secondary'}>
                      {team.status}
                    </Badge>
                    <Badge variant="outline">
                      {team.ideas?.domain}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {team.current_members}/{team.max_members}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 기반 아이디어 */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">기반 아이디어</h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {team.ideas?.title}
                </p>
              </div>

              {/* 팀 설명 */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">팀 소개</h4>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {team.description}
                </p>
              </div>

              {/* 필요 스킬 */}
              {team.required_skills && team.required_skills.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">필요한 스킬</h4>
                  <div className="flex flex-wrap gap-1">
                    {team.required_skills.slice(0, 4).map((skill: string) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {team.required_skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{team.required_skills.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-2">
                <Link href={`/teams/${team.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    자세히 보기
                  </Button>
                </Link>
                {team.status === '모집중' && team.current_members < team.max_members && (
                  <Link href={`/teams/${team.id}/join`} className="flex-1">
                    <Button className="w-full">
                      참여하기
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">아직 팀이 없습니다</h3>
          <p className="text-gray-600 mb-6">
            첫 번째 팀을 만들어 프로젝트를 시작해보세요
          </p>
          <Link href="/ideas">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              아이디어에서 팀 만들기
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}