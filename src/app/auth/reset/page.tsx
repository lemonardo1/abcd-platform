"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session))
    })
  }, [])

  const handleUpdate = async () => {
    if (!password.trim() || !confirm.trim()) {
      toast.error("새 비밀번호와 확인을 입력해주세요")
      return
    }
    if (password !== confirm) {
      toast.error("비밀번호가 일치하지 않습니다")
      return
    }
    if (password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다")
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success("비밀번호가 변경되었습니다. 다시 로그인해주세요.")
      router.push("/")
    } catch (error: any) {
      toast.error(error?.message || "비밀번호 변경에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-600">
        링크가 유효하지 않거나 세션이 없습니다.
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>비밀번호 재설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="다시 입력"
            />
          </div>
          <Button className="w-full" onClick={handleUpdate} disabled={loading}>
            {loading ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


