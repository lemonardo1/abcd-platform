"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getTeamById, joinTeam } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft, UserPlus, Settings } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export default function TeamInternalPage() {
  const params = useParams<{ teamId: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [team, setTeam] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "settings">("overview")
  const [joining, setJoining] = useState(false)

  const teamId = params?.teamId

  const isMember = useMemo(() => {
    if (!user || !team) return false
    return Boolean(team.members?.some((m: any) => m.user_id === user.id))
  }, [user, team])

  const isLeader = useMemo(() => {
    if (!user || !team) return false
    return team.leader_id === user.id
  }, [user, team])

  useEffect(() => {
    const load = async () => {
      if (!teamId) return
      try {
        setLoading(true)
        const data = await getTeamById(String(teamId))
        setTeam(data)
      } catch (error) {
        console.error("팀 로딩 오류:", error)
        toast.error("팀 정보를 불러오지 못했습니다")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [teamId])

  const canJoin = useMemo(() => {
    if (!team) return false
    return (
      team.status === "모집중" &&
      team.current_members < team.max_members &&
      user &&
      !team.members?.some((m: any) => m.user_id === user.id)
    )
  }, [team, user])

  const handleJoin = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다")
      return
    }
    try {
      setJoining(true)
      await joinTeam(String(teamId))
      toast.success("팀에 참여했습니다")
      // reload team data
      const refreshed = await getTeamById(String(teamId))
      setTeam(refreshed)
    } catch (error: any) {
      console.error("팀 참여 오류:", error)
      toast.error(error?.message || "팀 참여에 실패했습니다")
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">불러오는 중...</div>
    )
  }

  if (!team) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> 뒤로가기
        </Button>
        <div className="text-gray-600">팀을 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={team.status === "모집중" ? "default" : "secondary"}>{team.status}</Badge>
            {team.ideas?.domain && <Badge variant="outline">{team.ideas.domain}</Badge>}
            <div className="text-sm text-gray-500 flex items-center ml-2">
              <Users className="h-4 w-4 mr-1" /> {team.current_members}/{team.max_members}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> 목록으로
          </Button>
          {canJoin && (
            <Button onClick={handleJoin} disabled={joining}>
              <UserPlus className="h-4 w-4 mr-2" /> {joining ? "참여 중..." : "팀 참여하기"}
            </Button>
          )}
        </div>
      </div>

      {!isMember ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="text-lg font-semibold">팀 내부 페이지 접근 권한이 없습니다</div>
              <div className="text-gray-600">팀에 참여하면 내부 정보를 확인할 수 있습니다.</div>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={() => router.back()}>목록으로</Button>
                {canJoin ? (
                  <Button onClick={handleJoin} disabled={joining}>
                    <UserPlus className="h-4 w-4 mr-2" /> {joining ? "참여 중..." : "팀 참여하기"}
                  </Button>
                ) : (
                  <Button disabled>참여 불가</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <Button variant={activeTab === "overview" ? "default" : "ghost"} onClick={() => setActiveTab("overview")}>개요</Button>
            <Button variant={activeTab === "members" ? "default" : "ghost"} onClick={() => setActiveTab("members")}>팀원</Button>
            {isLeader && (
              <Button variant={activeTab === "settings" ? "default" : "ghost"} onClick={() => setActiveTab("settings")}>
                <Settings className="h-4 w-4 mr-1" /> 설정
              </Button>
            )}
          </div>

          {activeTab === "overview" && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>팀 소개</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{team.description}</p>
                  {team.required_skills && team.required_skills.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">필요한 스킬</div>
                      <div className="flex flex-wrap gap-2">
                        {team.required_skills.map((s: string) => (
                          <Badge key={s} variant="outline">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {team.ideas && (
                <Card>
                  <CardHeader>
                    <CardTitle>기반 아이디어</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="font-medium">{team.ideas.title}</div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium text-gray-800 mt-2">문제</div>
                      <p>{team.ideas.problem}</p>
                      <div className="font-medium text-gray-800 mt-4">AI 솔루션</div>
                      <p>{team.ideas.ai_solution}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "members" && (
            <Card>
              <CardHeader>
                <CardTitle>팀원 ({team.members?.length || 0}명)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {team.members?.map((member: any, index: number) => (
                  <div key={member.user_id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {member.role === '팀장' ? 'L' : 'M'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">팀원 {index + 1}</div>
                        <div className="text-xs text-gray-500">{member.role}</div>
                      </div>
                    </div>
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.skills.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && isLeader && (
            <Card>
              <CardHeader>
                <CardTitle>팀 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-gray-600">설정 기능은 곧 제공될 예정입니다.</div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
