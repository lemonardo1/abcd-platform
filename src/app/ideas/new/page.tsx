"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addIdea } from "@/lib/api"
import { Lightbulb, Plus, X, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import ProtectedRoute from "@/components/ProtectedRoute"

const DOMAINS = [
  "바이오", "교육", "환경", "헬스케어", "모빌리티", 
  "문화/예술", "로봇", "데이터/플랫폼", "기타"
]

export default function NewIdeaPage() {
  const router = useRouter()
  const [domain, setDomain] = useState<string>(DOMAINS[0])
  const [problem, setProblem] = useState<string>("")
  const [aiSolution, setAiSolution] = useState<string>("")
  const [title, setTitle] = useState<string>("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async () => {
    if (!domain || !problem.trim() || !aiSolution.trim()) {
      toast.error("도메인, 문제, AI 솔루션은 필수 항목입니다.")
      return
    }

    try {
      setLoading(true)
      await addIdea({
        title: title.trim() || `${domain} 분야 아이디어`,
        domain,
        problem: problem.trim(),
        ai_solution: aiSolution.trim(),
        tags
      })
      toast.success("아이디어가 성공적으로 제출되었습니다!")
      router.push("/ideas")
    } catch (error) {
      console.error("아이디어 제출 오류:", error)
      toast.error("아이디어 제출에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로
        </Button>
        <div className="text-center flex-1">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lightbulb className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">새 아이디어 제출</h1>
          <p className="text-muted-foreground">Domain → Problem → AI Solution 순서로 작성해보세요</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ABCD 아이디어 작성법</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Domain Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">도메인 (Domain) *</label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              어떤 분야의 문제를 해결하고 싶나요?
            </p>
          </div>

          {/* Problem Definition */}
          <div>
            <label className="text-sm font-medium mb-2 block">문제 정의 (Problem) *</label>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="예) 반려동물의 건강 이상을 보호자가 조기에 파악하기 어렵다.&#10;&#10;- 누구(페르소나): 반려동물 보호자&#10;- 현재 한계: 증상 악화 뒤에야 인지&#10;- 필요: 이상 징후를 빠르게 알려주는 시스템"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {problem.length}/500 - 구체적인 상황과 대상을 명시해주세요
            </p>
          </div>

          {/* AI Solution */}
          <div>
            <label className="text-sm font-medium mb-2 block">AI 솔루션 (AI Solution) *</label>
            <Textarea
              value={aiSolution}
              onChange={(e) => setAiSolution(e.target.value)}
              placeholder="예) 착용형 센서/행동 영상 데이터 수집 → AI 모델이 이상 징후 감지 → 앱 푸시 알림과 대처 가이드 제공&#10;&#10;- 입력: 생체/행동 데이터&#10;- 모델: 이상 탐지 + 분류&#10;- 출력: 경보/권장 행동"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {aiSolution.length}/500 - 입력 → 모델 → 출력 흐름을 명확히 해주세요
            </p>
          </div>

          {/* Optional Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">아이디어 제목 (선택사항)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) PawSense: 반려동물 건강 이상 감지"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/100 - 미입력 시 도메인에서 자동 생성됩니다
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">태그 (최대 5개)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {tags.length < 5 && (
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="태그 입력 (예: AI, 바이오, 앱)"
                  maxLength={20}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              태그는 다른 사람들이 당신의 아이디어를 찾는데 도움이 됩니다
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
              disabled={loading || !domain || !problem.trim() || !aiSolution.trim()}
            >
              {loading ? "제출 중..." : "아이디어 제출"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ABCD Guidelines */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">💡 ABCD 체크리스트</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>A</strong>lways <strong>B</strong>e <strong>C</strong>reating & <strong>D</strong>oing — 직접 만들 수 있는 최소기능(MVP)을 곧바로 정의했나요?</li>
            <li>• 문제(Problem)가 충분히 구체적인 실제 상황/대상에 닿아있나요?</li>
            <li>• AI 솔루션이 입력(데이터) → 모델 → 출력(행동/가치) 흐름으로 명확한가요?</li>
            <li>• 도메인 전문성과 AI 기술을 어떻게 결합할 것인지 생각해보셨나요?</li>
          </ul>
        </CardContent>
      </Card>
      </div>
    </ProtectedRoute>
  )
}