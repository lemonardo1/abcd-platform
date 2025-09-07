"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Users, Target, Zap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import AuthModal from "@/components/auth/AuthModal"

export default function HomePage() {
  const { user } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const handleIdeaSubmit = () => {
    if (user) {
      // 로그인된 사용자는 바로 아이디어 제출 페이지로
      window.location.href = '/ideas/new'
    } else {
      // 비로그인 사용자는 로그인 모달 표시
      setAuthModalOpen(true)
    }
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          아이디어로 팀을 만들어보세요
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          혁신적인 아이디어를 제출하고, 같은 비전을 가진 팀원들과 함께 프로젝트를 실현해보세요.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="px-8" onClick={handleIdeaSubmit}>
            <Lightbulb className="h-5 w-5 mr-2" />
            아이디어 제출하기
          </Button>
          <Link href="/ideas">
            <Button variant="outline" size="lg" className="px-8">
              아이디어 둘러보기
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-4">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">아이디어 제출</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              ABCD 방법론을 활용해 구체적이고 실현 가능한 아이디어를 체계적으로 작성하세요.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">팀 빌딩</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              마음에 드는 아이디어를 선택하고 팀을 구성해 함께 프로젝트를 진행하세요.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-4">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">프로젝트 실현</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              체계적인 팀 관리와 협업 도구를 통해 아이디어를 현실로 만들어보세요.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg border p-8">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">100+</div>
            <div className="text-gray-600">제출된 아이디어</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <div className="text-gray-600">구성된 팀</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">200+</div>
            <div className="text-gray-600">활성 사용자</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">25+</div>
            <div className="text-gray-600">완료된 프로젝트</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-primary/5 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          지금 시작해보세요
        </h2>
        <p className="text-gray-600 mb-6">
          당신의 혁신적인 아이디어를 세상과 공유하고, 함께할 팀원을 찾아보세요.
        </p>
        <Button size="lg" onClick={handleIdeaSubmit}>
          <Zap className="h-5 w-5 mr-2" />
          첫 아이디어 제출하기
        </Button>
      </div>
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="signup"
      />
    </div>
  )
}