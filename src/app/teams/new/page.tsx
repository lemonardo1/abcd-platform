"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { createTeam, listIdeas } from "@/lib/api"
import { Users, Plus, X, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

const COMMON_SKILLS = [
  "프론트엔드", "백엔드", "풀스택", "모바일", "AI/ML", "데이터분석",
  "UI/UX", "기획", "마케팅", "비즈니스", "디자인", "DevOps"
]

export default function NewTeamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ideaId = searchParams.get('ideaId')
  
  const [selectedIdea, setSelectedIdea] = useState<any>(null)
  const [ideas, setIdeas] = useState<any[]>([])
  const [teamName, setTeamName] = useState("")
  const [description, setDescription] = useState("")
  const [maxMembers, setMaxMembers] = useState(4)
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadIdeas() {
      try {
        const data = await listIdeas()
        setIdeas(data)
        
        if (ideaId) {
          const idea = data.find(i => i.id === ideaId)
          if (idea) {
            setSelectedIdea(idea)
            setTeamName(`${idea.title} 팀`)
            setDescription(`${idea.title} 아이디어를 실현하기 위한 팀입니다.\n\n문제: ${idea.problem}\n\nAI 솔루션: ${idea.ai_solution}`)
          }
        }
      } catch (error) {
        console.error("아이디어 로딩 오류:", error)
        toast.error("아이디어 목록을 불러오는데 실패했습니다.")
      }
    }
    loadIdeas()
  }, [ideaId])

  const handleAddSkill = (skill: string) => {
    if (skill.trim() && !requiredSkills.includes(skill.trim()) && requiredSkills.length < 10) {
      setRequiredSkills([...requiredSkills, skill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setRequiredSkills(requiredSkills.filter(skill => skill !== skillToRemove))
  }

  const handleSubmit = async () => {
    if (!selectedIdea || !teamName.trim() || !description.trim()) {
      toast.error("아이디어, 팀명, 팀 소개는 필수 항목입니다.")
      return
    }

    if (maxMembers < 2 || maxMembers > 20) {
      toast.error("팀 인원은 2명 이상 20명 이하로 설정해주세요.")
      return
    }

    try {
      setLoading(true)
      const team = await createTeam({
        idea_id: selectedIdea.id,
        name: teamName.trim(),
        description: description.trim(),
        max_members: maxMembers,
        required_skills: requiredSkills
      })
      toast.success("팀이 성공적으로 생성되었습니다!")
      router.push(`/teams/${team.id}`)
    } catch (error) {
      console.error("팀 생성 오류:", error)
      toast.error("팀 생성에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로
        </Button>
        <div className="text-center flex-1">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">새 팀 만들기</h1>
          <p className="text-muted-foreground">아이디어를 실현할 팀을 구성해보세요</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>팀 정보 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Idea Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">기반 아이디어 *</label>
            {selectedIdea ? (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{selectedIdea.title}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {selectedIdea.domain}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {selectedIdea.problem}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIdea(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">팀의 기반이 될 아이디어를 선택하세요</p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {ideas.map((idea) => (
                    <div
                      key={idea.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedIdea(idea)
                        setTeamName(`${idea.title} 팀`)
                        setDescription(`${idea.title} 아이디어를 실현하기 위한 팀입니다.\n\n문제: ${idea.problem}\n\nAI 솔루션: ${idea.ai_solution}`)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{idea.title}</h4>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {idea.domain}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          좋아요 {(idea.like_user_ids || []).length}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Team Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">팀명 *</label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="예) AI 헬스케어 혁신팀"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {teamName.length}/50
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">팀 소개 *</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="팀의 목표, 진행 방식, 기대하는 결과물 등을 자유롭게 작성해주세요."
              rows={6}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/1000
            </p>
          </div>

          {/* Max Members */}
          <div>
            <label className="text-sm font-medium mb-2 block">최대 팀원 수</label>
            <Input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value) || 4)}
              min={2}
              max={20}
            />
            <p className="text-xs text-muted-foreground mt-1">
              팀장 포함 2명 이상 20명 이하
            </p>
          </div>

          {/* Required Skills */}
          <div>
            <label className="text-sm font-medium mb-2 block">필요한 스킬 (최대 10개)</label>
            
            {/* Common Skills */}
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">자주 사용되는 스킬:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_SKILLS.map((skill) => (
                  <Button
                    key={skill}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleAddSkill(skill)}
                    disabled={requiredSkills.includes(skill) || requiredSkills.length >= 10}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {skill}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected Skills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {requiredSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Custom Skill Input */}
            {requiredSkills.length < 10 && (
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="직접 입력 (예: Python, React, Figma)"
                  maxLength={20}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill(newSkill)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddSkill(newSkill)}
                  disabled={!newSkill.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              팀원 모집 시 참고할 스킬들을 추가해주세요
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !selectedIdea || !teamName.trim() || !description.trim()}
            >
              {loading ? "생성 중..." : "팀 만들기"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}