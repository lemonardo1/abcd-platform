"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Brain, Code2 } from "lucide-react"

interface FirstVisitEducationProps {
  isOpen: boolean
  onClose: () => void
}

export default function FirstVisitEducation({ isOpen, onClose }: FirstVisitEducationProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <Card className="border-0 shadow-none">
          <CardHeader className="relative pb-2">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">AI는 함수입니다</CardTitle>
              <p className="text-sm text-gray-600 mt-2">입력과 출력의 관점에서 AI를 이해해요</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">핵심 아이디어</h3>
              <p className="text-gray-700 leading-relaxed">
                AI 시스템은 결국 <span className="font-semibold">입력(Input)</span>을 받아
                <span className="font-semibold">출력(Output)</span>을 내는 <span className="font-semibold">함수(Function)</span>로 볼 수 있어요.
                좋은 AI 설계는 입력과 출력을 명확히 정의하고, 실패 케이스를 관리하며, 피드백 루프를 설계하는 데서 시작합니다.
              </p>
            </div>

            <div className="p-4 bg-white border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Code2 className="h-4 w-4 text-gray-500" /> 함수로 생각해보기
              </h3>
              <pre className="text-sm bg-gray-900 text-gray-100 rounded-md p-4 overflow-auto">
{`// 입력: 문제 기술, 컨텍스트, 제약조건
// 출력: 실행 가능한 답안 또는 다음 액션
function ai(input) {
  // 프롬프트 설계, 예시 제공, 제약 설정
  const prompt = designPrompt(input)
  const raw = callModel(prompt)
  return postProcess(raw)
}`}
              </pre>
              <ul className="mt-3 text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li><span className="font-medium">입력 설계</span>: 문제를 구조화하고 필요한 컨텍스트만 넣기</li>
                <li><span className="font-medium">출력 스펙</span>: 형식, 길이, 기준을 명확히 정의</li>
                <li><span className="font-medium">사후 처리</span>: 검증, 포맷팅, 도구 호출 연계</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button className="flex-1" onClick={onClose}>시작하기</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


