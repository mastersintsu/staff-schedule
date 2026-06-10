'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { addDays, format } from 'date-fns'
import { Copy } from 'lucide-react'

export default function ShiftCopyWeek({ weekStart, shifts }: { weekStart: string; shifts: any[] }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCopy() {
    if (!confirm('今週のシフトを来週にコピーしますか？')) return
    setLoading(true)

    const thisWeekShifts = shifts.filter(s => {
      const d = new Date(s.date)
      const ws = new Date(weekStart)
      const we = addDays(ws, 6)
      return d >= ws && d <= we
    })

    if (thisWeekShifts.length === 0) {
      alert('今週のシフトがありません')
      setLoading(false)
      return
    }

    const nextWeekShifts = thisWeekShifts.map(s => ({
      user_id: s.user_id,
      date: format(addDays(new Date(s.date), 7), 'yyyy-MM-dd'),
      start_time: s.start_time,
      end_time: s.end_time,
      note: s.note,
    }))

    await supabase.from('shifts').upsert(nextWeekShifts, { onConflict: 'user_id,date' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleCopy}
      disabled={loading}
      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
    >
      <Copy size={15} />
      {loading ? 'コピー中...' : '来週にコピー'}
    </button>
  )
}
