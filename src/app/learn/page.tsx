"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Concept = {
  id: string
  title: string
  summary: string
  bullets: string[]
  qa: { q: string; a: string }[]
}

const concepts: Concept[] = [
  {
    id: 'llm',
    title: '대규모 언어 모델 (LLM)',
    summary: '대량의 텍스트 데이터로 학습한 모델로, 자연어 이해/생성에 특화되어 있어요.',
    bullets: [
      '사전학습(Pretraining) + 미세조정(Finetuning)',
      '토큰 확률 분포를 이용해 다음 단어를 예측',
      '프롬프트 엔지니어링으로 성능 향상',
    ],
    qa: [
      { q: 'LLM이 텍스트를 생성하는 기본 메커니즘은?', a: '다음 토큰의 확률을 예측해 시퀀스를 생성' },
      { q: '미세조정(Finetuning)의 목적은?', a: '특정 태스크에 맞게 성능을 향상' },
    ],
  },
  {
    id: 'embedding',
    title: '임베딩 (Embedding)',
    summary: '텍스트/이미지 등을 벡터 공간에 매핑해 의미적 유사도를 계산할 수 있게 해요.',
    bullets: [
      '의미적 검색, 군집화, 추천에 활용',
      '코사인 유사도 등으로 근접도 계산',
    ],
    qa: [
      { q: '임베딩의 대표적 활용 예시는?', a: '의미적 검색(semantic search)' },
    ],
  },
  {
    id: 'rag',
    title: 'RAG (Retrieval-Augmented Generation)',
    summary: '검색으로 외부 지식을 불러와 LLM 생성에 보강하는 패턴이에요.',
    bullets: [
      '지식 최신성, 사실성 향상',
      '임베딩 기반 검색과 프롬프트 컨텍스트 결합',
    ],
    qa: [
      { q: 'RAG를 쓰는 이유는?', a: '모델 파라미터 밖의 최신/전문 지식을 활용' },
    ],
  },
]

export default function LearnPage() {
  const [activeId, setActiveId] = useState(concepts[0].id)
  const [quizMode, setQuizMode] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const active = useMemo(() => concepts.find(c => c.id === activeId)!, [activeId])

  const qa = active.qa
  const q = qa[currentIdx % qa.length]

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        {concepts.map(c => (
          <Button key={c.id} variant={activeId === c.id ? 'default' : 'outline'} onClick={() => { setActiveId(c.id); setQuizMode(false); setCurrentIdx(0); setShowAnswer(false); }}>
            {c.title}
          </Button>
        ))}
      </div>

      {!quizMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 카드뉴스 */}
          <Card>
            <CardHeader>
              <CardTitle>{active.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700">{active.summary}</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {active.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <div>
                <Button onClick={() => setQuizMode(true)}>퀴즈 풀기</Button>
              </div>
            </CardContent>
          </Card>

          {/* 플래시카드 */}
          <Card>
            <CardHeader>
              <CardTitle>플래시카드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {active.qa.map((item, i) => (
                <div key={i} className="p-3 border rounded">
                  <div className="font-medium">Q. {item.q}</div>
                  <div className="text-sm text-gray-600 mt-1">A. {item.a}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        // 간단 퀴즈 모드 (단답형 노출 -> 정답 확인)
        <Card>
          <CardHeader>
            <CardTitle>퀴즈 - {active.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg">Q. {q.q}</div>
            <div className="p-3 border rounded bg-gray-50">
              {showAnswer ? (
                <div>
                  <div className="text-gray-700">정답</div>
                  <div className="font-semibold">{q.a}</div>
                </div>
              ) : (
                <div className="text-gray-500">생각해보세요…</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAnswer(s => !s)}>
                {showAnswer ? '정답 숨기기' : '정답 보기'}
              </Button>
              <Button onClick={() => { setCurrentIdx(i => i + 1); setShowAnswer(false); }}>다음 문제</Button>
              <Button variant="ghost" onClick={() => setQuizMode(false)}>학습 보기로</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



