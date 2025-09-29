"use client"

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { searchTeachersBySchool, requestLinkToTeacher, listMyStudentLinks } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function TeacherSearchPage() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [myLinks, setMyLinks] = useState<any[]>([])

  const loadLinks = async () => {
    try {
      const links = await listMyStudentLinks()
      setMyLinks(links)
    } catch {}
  }

  const search = async () => {
    try {
      setLoading(true)
      const data = await searchTeachersBySchool(q)
      setItems(data)
    } catch (e) {
      console.error(e)
      toast.error('검색 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const handleRequest = async (teacherId: string) => {
    try {
      await requestLinkToTeacher(teacherId)
      toast.success('요청이 전송되었습니다')
      loadLinks()
    } catch (e: any) {
      toast.error(e?.message || '요청 실패')
    }
  }

  const requested = (teacherId: string) => myLinks.some(l => l.teacher_id === teacherId)

  const content = (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>학교별 교사 검색</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="학교명으로 검색" />
            <Button onClick={search} disabled={loading}>{loading ? '검색 중...' : '검색'}</Button>
          </div>
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-gray-600">검색 결과가 없습니다.</div>
            ) : items.map((t) => (
              <div key={t.user_id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{t.full_name}</div>
                  <div className="text-sm text-gray-500">{t.school_name}</div>
                </div>
                <div>
                  <Button onClick={() => handleRequest(t.user_id)} disabled={requested(t.user_id)}>
                    {requested(t.user_id) ? '요청됨' : '교사 등록 요청'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <ProtectedRoute fallback={content}>
      {content}
    </ProtectedRoute>
  )
}


