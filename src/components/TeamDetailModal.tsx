"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, Calendar, Mail, X, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { joinTeam } from "@/lib/api"

interface TeamDetailModalProps {
  team: any
  isOpen: boolean
  onClose: () => void
  onTeamUpdated: () => void
}

export default function TeamDetailModal({ team, isOpen, onClose, onTeamUpdated }: TeamDetailModalProps) {
  const { user } = useAuth()
  const [joining, setJoining] = useState(false)

  if (!isOpen || !team) return null

  const handleJoinTeam = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }

    try {
      setJoining(true)
      await joinTeam(team.id)
      toast.success('팀에 성공적으로 참여했습니다!')
      onTeamUpdated()
      onClose()
    } catch (error: any) {
      console.error('팀 참여 오류:', error)
      if (error.message?.includes('already')) {
        toast.error('이미 참여 중인 팀입니다')
      } else if (error.message?.includes('full')) {
        toast.error('팀 인원이 가득 찼습니다')
      } else {
        toast.error('팀 참여에 실패했습니다')
      }
    } finally {
      setJoining(false)
    }
  }

  const canJoin = team.status === '모집중' && 
                  team.current_members < team.max_members &&
                  user &&
                  !team.members?.some((member: any) => member.user_id === user.id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{team.name}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={team.status === '모집중' ? 'default' : 'secondary'}>
                  {team.status}
                </Badge>
                <Badge variant="outline">
                  {team.ideas?.domain}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-1" />
                {team.current_members}/{team.max_members}명
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 기반 아이디어 */}
            {team.ideas && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">기반 아이디어</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">{team.ideas.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">문제:</span>
                      <p className="mt-1">{team.ideas.problem}</p>
                    </div>
                    <div>
                      <span className="font-medium">AI 솔루션:</span>
                      <p className="mt-1">{team.ideas.ai_solution}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 팀 소개 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">팀 소개</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{team.description}</p>
            </div>

            {/* 필요한 스킬 */}
            {team.required_skills && team.required_skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">필요한 스킬</h3>
                <div className="flex flex-wrap gap-2">
                  {team.required_skills.map((skill: string) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 팀원 정보 */}
            {team.members && team.members.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">팀원</h3>
                <div className="space-y-2">
                  {team.members.map((member: any, index: number) => (
                    <div key={member.user_id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {member.role === '팀장' ? 'L' : 'M'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            팀원 {index + 1}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.role === '팀장' ? '팀장' : '팀원'}
                          </div>
                        </div>
                      </div>
                      {member.role === '팀장' && (
                        <Badge variant="secondary" className="text-xs">
                          리더
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 생성일 */}
            <div className="text-sm text-gray-500">
              <Calendar className="h-4 w-4 inline mr-1" />
              {new Date(team.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} 생성
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                닫기
              </Button>
              {canJoin && (
                <Button 
                  className="flex-1" 
                  onClick={handleJoinTeam}
                  disabled={joining}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {joining ? '참여 중...' : '팀 참여하기'}
                </Button>
              )}
              {!user && (
                <Button className="flex-1" disabled>
                  로그인 필요
                </Button>
              )}
              {user && team.members?.some((member: any) => member.user_id === user.id) && (
                <Button className="flex-1" disabled>
                  이미 참여 중
                </Button>
              )}
              {team.current_members >= team.max_members && team.status === '모집중' && (
                <Button className="flex-1" disabled>
                  인원 마감
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
