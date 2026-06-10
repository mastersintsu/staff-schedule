'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Pencil, X } from 'lucide-react'

export default function AttendanceEditButton({ record }: { record: any }) {
  const [open, setOpen] = useState(false)
  const toTimeInput = (iso?: string) => iso ? format(new Date(iso), 'HH:mm') : ''
  const toISO = (date: string, time: string) => {
    if (!time) return null
    return new Date(`${date}T${time}:00`).toISOString()
  }

  const [clockIn, setClockIn] = useState(toTimeInput(record.clock_in))
  const [clockOut, setClockOut] = useState(toTimeInput(record.clock_out))
  const [breakMins, setBreakMins] = useState(record.break_minutes ?? 60)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('attendances').update({
      clock_in: toISO(record.date, clockIn),
      clock_out: toISO(record.date, clockOut),
      break_minutes: breakMins,
    }).eq('id', record.id)
    router.refresh()
    setOpen(false)
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-blue-500 transition">
        <Pencil size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">勤怠修正</h2>
              <button onClick={() => setOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{record.date} / {(record.profiles as any)?.name}</p>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出勤</label>
                  <input type="time" value={clockIn} onChange={e => setClockIn(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">退勤</label>
                  <input type="time" value={clockOut} onChange={e => setClockOut(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">休憩（分）</label>
                <input type="number" value={breakMins} onChange={e => setBreakMins(Number(e.target.value))}
                  min={0} max={480}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50">
                {loading ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
