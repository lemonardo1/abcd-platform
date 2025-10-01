"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getTeamById, joinTeam, listTeamArtifacts, addTeamArtifact, uploadArtifactImage, deleteTeamArtifact, listTeamUpdates, addTeamUpdate, deleteTeamUpdate, listTeamTasks, addTeamTask, toggleTeamTask, deleteTeamTask } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Users, ArrowLeft, UserPlus, Settings } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export default function TeamDetailByQueryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = searchParams.get('teamId') || ''
  const { user } = useAuth()

  const [team, setTeam] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "members" | "settings">("overview")
  const [joining, setJoining] = useState(false)
  const [newUpdate, setNewUpdate] = useState("")
  const [newTask, setNewTask] = useState("")
  const [updates, setUpdates] = useState<Array<{ id: string, content: string, created_at: string, user_id?: string }>>([])
  const [tasks, setTasks] = useState<Array<{ id: string, title: string, done: boolean, created_at: string, user_id?: string }>>([])
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [artifactImage, setArtifactImage] = useState<File | null>(null)
  const [artifactLink, setArtifactLink] = useState("")
  const [artifactDesc, setArtifactDesc] = useState("")
  const [artifactSubmitting, setArtifactSubmitting] = useState(false)
  const artifactFileRef = useRef<HTMLInputElement | null>(null)

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

  // 활동 탭: 백엔드 동기화
  useEffect(() => {
    const loadActivity = async () => {
      if (!teamId) return
      try {
        const [u, t] = await Promise.all([
          listTeamUpdates(String(teamId)),
          listTeamTasks(String(teamId))
        ])
        setUpdates(u as any)
        setTasks(t as any)
      } catch (e) {
        // 조용히 무시
      }
    }
    loadActivity()
  }, [teamId])

  // 결과물 목록 로드
  useEffect(() => {
    const loadArtifacts = async () => {
      if (!teamId) return
      try {
        const items = await listTeamArtifacts(String(teamId))
        setArtifacts(items)
      } catch (e) {
        // 목록 실패는 조용히 무시
      }
    }
    loadArtifacts()
  }, [teamId])

  const handleAddUpdate = async () => {
    const value = newUpdate.trim()
    if (!value || !teamId) return
    try {
      const created = await addTeamUpdate(String(teamId), value)
      setUpdates([created as any, ...updates])
      setNewUpdate("")
    } catch (error: any) {
      toast.error(error?.message || "등록에 실패했습니다")
    }
  }

  const handleAddTask = async () => {
    const value = newTask.trim()
    if (!value || !teamId) return
    try {
      const created = await addTeamTask(String(teamId), value)
      setTasks([created as any, ...tasks])
      setNewTask("")
    } catch (error: any) {
      toast.error(error?.message || "작업 추가에 실패했습니다")
    }
  }

  const toggleTaskChecked = async (id: string, done: boolean) => {
    try {
      const updated = await toggleTeamTask(id, done)
      setTasks(tasks.map(t => t.id === id ? (updated as any) : t))
    } catch (error: any) {
      toast.error(error?.message || "상태 변경에 실패했습니다")
    }
  }

  const removeTask = async (id: string) => {
    try {
      await deleteTeamTask(id)
      setTasks(tasks.filter(t => t.id !== id))
    } catch (error: any) {
      toast.error(error?.message || "삭제에 실패했습니다")
    }
  }

  const handleSubmitArtifact = async () => {
    if (!teamId) return
    if (!artifactImage && !artifactLink.trim() && !artifactDesc.trim()) {
      toast.error("이미지, 링크, 설명 중 최소 1개는 입력해주세요")
      return
    }
    try {
      setArtifactSubmitting(true)
      let imageUrl: string | undefined
      if (artifactImage) {
        imageUrl = await uploadArtifactImage(artifactImage)
      }
      await addTeamArtifact({
        team_id: String(teamId),
        image_url: imageUrl,
        link_url: artifactLink.trim() || undefined,
        description: artifactDesc.trim() || undefined,
      })
      toast.success("결과물이 등록되었습니다")
      setArtifactImage(null)
      setArtifactLink("")
      setArtifactDesc("")
      const items = await listTeamArtifacts(String(teamId))
      setArtifacts(items)
    } catch (error: any) {
      console.error("결과물 업로드 오류:", error)
      toast.error(error?.message || "업로드에 실패했습니다")
    } finally {
      setArtifactSubmitting(false)
    }
  }

  const handleDeleteArtifact = async (artifactId: string) => {
    if (!artifactId) return
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      await deleteTeamArtifact(artifactId)
      toast.success('삭제되었습니다')
      const items = await listTeamArtifacts(String(teamId))
      setArtifacts(items)
    } catch (error: any) {
      console.error('결과물 삭제 오류:', error)
      toast.error(error?.message || '삭제에 실패했습니다')
    }
  }

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
      const refreshed = await getTeamById(String(teamId))
      setTeam(refreshed)
    } catch (error: any) {
      console.error("팀 참여 오류:", error)
      toast.error(error?.message || "팀 참여에 실패했습니다")
    } finally {
      setJoining(false)
    }
  }

  if (!teamId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> 뒤로가기
        </Button>
        <div className="text-gray-600">잘못된 접근입니다 (teamId 파라미터 필요).</div>
      </div>
    )
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
          <div className="flex gap-2 border-b">
            <Button variant={activeTab === "overview" ? "default" : "ghost"} onClick={() => setActiveTab("overview")}>개요</Button>
            <Button variant={activeTab === "activity" ? "default" : "ghost"} onClick={() => setActiveTab("activity")}>활동</Button>
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
                      <div className="text_sm font-medium mb-2">필요한 스킬</div>
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

          {activeTab === "activity" && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 활동 업데이트 */}
              <Card>
                <CardHeader>
                  <CardTitle>활동 업데이트</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      value={newUpdate}
                      onChange={(e) => setNewUpdate(e.target.value)}
                      placeholder="팀 진행 상황이나 공지사항을 작성하세요"
                      rows={4}
                      maxLength={1000}
                      onKeyDown={(e) => {
                        const isMetaEnter = (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                        if (isMetaEnter) {
                          e.preventDefault()
                          handleAddUpdate()
                        }
                      }}
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleAddUpdate} disabled={!newUpdate.trim()}>등록</Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {updates.length === 0 && (
                      <div className="text-sm text-gray-500">아직 등록된 업데이트가 없습니다.</div>
                    )}
                    {updates.map((u) => (
                      <div key={u.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm whitespace-pre-wrap text-gray-800">{u.content}</div>
                        <div className="text-xs text-gray-500 mt-2">{new Date(u.created_at).toLocaleString('ko-KR')}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 작업 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle>작업 목록</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="할 일을 입력하고 추가하세요"
                      maxLength={100}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask() } }}
                    />
                    <Button onClick={handleAddTask} disabled={!newTask.trim()}>추가</Button>
                  </div>
                  <div className="space-y-2">
                    {tasks.length === 0 && (
                      <div className="text-sm text-gray-500">아직 등록된 작업이 없습니다.</div>
                    )}
                    {tasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                          checked={t.done}
                          onChange={() => toggleTaskChecked(t.id, !t.done)}
                          />
                          <span className={`text-sm ${t.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('ko-KR')}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeTask(t.id)}>삭제</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "activity" && (
            <Card>
              <CardHeader>
                <CardTitle>Lovable 실습 결과물</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">웹사이트 캡쳐 이미지 (선택)</label>
                    <input
                      ref={artifactFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setArtifactImage(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => artifactFileRef.current?.click()}
                      >
                        이미지 선택
                      </Button>
                      {artifactImage ? (
                        <span className="text-sm text-gray-600 truncate max-w-[240px]">{artifactImage.name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">선택된 파일 없음</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">웹사이트 링크 (선택)</label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={artifactLink}
                      onChange={(e) => setArtifactLink(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">설명 (선택)</label>
                  <Textarea
                    rows={3}
                    placeholder="웹사이트 소개나 구현 포인트를 적어주세요"
                    value={artifactDesc}
                    onChange={(e) => setArtifactDesc(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmitArtifact} disabled={artifactSubmitting}>
                    {artifactSubmitting ? "등록 중..." : "결과물 등록"}
                  </Button>
                </div>

                <div className="pt-4 border-t space-y-3">
                  {artifacts.length === 0 && (
                    <div className="text-sm text-gray-500">등록된 결과물이 없습니다.</div>
                  )}
                  {artifacts.map((a) => (
                    <div key={a.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                      {a.image_url && (
                        <img src={a.image_url} alt="artifact" className="w-full max-h-64 object-contain rounded" />
                      )}
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">{a.description}</div>
                      {a.link_url && (
                        <a href={a.link_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                          {a.link_url}
                        </a>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString('ko-KR')}</div>
                        {(isLeader || (user && a.user_id === user.id)) && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteArtifact(a.id)}>
                            삭제
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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


