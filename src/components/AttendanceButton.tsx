'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Attendance } from '@/lib/types'
import { X } from 'lucide-react'

export default function AttendanceButton({
  userId,
  attendance,
}: {
  userId: string
  attendance: Attendance | null
}) {
  const [loading, setLoading] = useState(false)
  const [showClockOut, setShowClockOut] = useState(false)
  const [breakMinutes, setBreakMinutes] = useState(60)
  const router = useRouter()
  const supabase = createClient()

  async function handleClockIn() {
    setLoading(true)
    const now = new Date().toISOString()
    const today = format(new Date(), 'yyyy-MM-dd')
    await supabase.from('attendances').insert({ user_id: userId, date: today, clock_in: now })
    router.refresh()
    setLoading(false)
  }

  async function handleClockOut() {
    setLoading(true)
    const now = new Date().toISOString()
    await supabase.from('attendances').update({
      clock_out: now,
      break_minutes: breakMinutes,
    }).eq('id', attendance!.id)
    router.refresh()
    setShowClockOut(false)
    setLoading(false)
  }

  // 勤務完了
  if (attendance?.clock_out) {
    const workMins = Math.round(
      (new Date(attendance.clock_out).getTime() - new Date(attendance.clock_in!).getTime()) / 60000
    ) - (attendance.break_minutes ?? 60)
    const workH = Math.floor(workMins / 60)
    const workM = workMins % 60
    return (
      <div className="text-center">
        <p className="text-green-600 font-medium text-sm">本日の勤務完了</p>
        <p className="text-gray-500 text-xs">
          {format(new Date(attendance.clock_in!), 'HH:mm')} 〜 {format(new Date(attendance.clock_out), 'HH:mm')}
        </p>
        <p className="text-gray-400 text-xs">休憩 {attendance.break_minutes ?? 60}分 / 実働 {workH}h{workM}m</p>
      </div>
    )
  }

  // 出勤前
  if (!attendance) {
    return (
      <button
        onClick={handleClockIn}
        disabled={loading}
        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600 transition disabled:opacity-50"
      >
        {loading ? '処理中...' : '出勤'}
      </button>
    )
  }

  // 出勤済み・退勤前
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm text-gray-600">出勤中</p>
          <p className="text-xs text-gray-400">{format(new Date(attendance.clock_in!), 'HH:mm')} 〜</p>
        </div>
        <button
          onClick={() => setShowClockOut(true)}
          className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition"
        >
          退勤
        </button>
      </div>

      {/* 退勤モーダル */}
      {showClockOut && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">退勤</h2>
              <button onClick={() => setShowClockOut(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">休憩時間</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 30, 45, 60, 75, 90].map(min => (
                    <button
                      key={min}
                      onClick={() => setBreakMinutes(min)}
                      className={`py-2 rounded-lg text-sm font-medium transition ${
                        breakMinutes === min
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {min === 0 ? 'なし' : `${min}分`}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-sm text-gray-600 shrink-0">その他:</label>
                  <input
                    type="number"
                    value={breakMinutes}
                    onChange={e => setBreakMinutes(Number(e.target.value))}
                    min={0}
                    max={480}
                    className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-900"
                  />
                  <span className="text-sm text-gray-600">分</span>
                </div>
              </div>
              <button
                onClick={handleClockOut}
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {loading ? '処理中...' : '退勤する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
