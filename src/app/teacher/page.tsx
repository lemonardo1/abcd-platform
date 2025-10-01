"use client"

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { approveStudentLink, listMyTeacherRequests, rejectStudentLink } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function TeacherManagePage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [links, setLinks] = useState<any[]>([])

  const load = async () => {
    try {
      setLoading(true)
      const data = await listMyTeacherRequests()
      setLinks(data)
    } catch (e) {
      console.error(e)
      toast.error('요청을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await approveStudentLink(id)
      toast.success('승인되었습니다')
      load()
    } catch (e: any) {
      toast.error(e?.message || '승인 실패')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectStudentLink(id)
      toast.success('거절되었습니다')
      load()
    } catch (e: any) {
      toast.error(e?.message || '거절 실패')
    }
  }

  const content = (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>학생 관리</CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.role !== 'teacher' ? (
            <div className="text-gray-600">교사만 접근할 수 있습니다.</div>
          ) : loading ? (
            <div className="text-gray-600">로딩 중...</div>
          ) : links.length === 0 ? (
            <div className="text-gray-600">대기 중인 요청이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {links.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{l.student_profile?.full_name || l.student_id}</div>
                    <div className="text-sm text-gray-500">{l.student_profile?.school_name || ''}</div>
                    <div className="text-xs text-gray-400">상태: {l.status}</div>
                  </div>
                  {l.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleApprove(l.id)}>승인</Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(l.id)}>거절</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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


