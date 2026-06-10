import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import AttendanceEditButton from '@/components/AttendanceEditButton'

function calcWorkMins(clockIn?: string, clockOut?: string, breakMins = 60) {
  if (!clockIn || !clockOut) return 0
  const total = Math.round((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60000)
  return Math.max(0, total - breakMins)
}
function formatMins(mins: number) {
  if (mins === 0) return '-'
  return `${Math.floor(mins / 60)}h${mins % 60}m`
}

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'

  const now = new Date()
  const { data: records } = await supabase
    .from('attendances')
    .select('*, profiles(name)')
    .gte('date', format(startOfMonth(now), 'yyyy-MM-dd'))
    .lte('date', format(endOfMonth(now), 'yyyy-MM-dd'))
    .order('date', { ascending: false })

  const filtered = isAdmin ? records ?? [] : (records ?? []).filter(r => r.user_id === user!.id)

  const summaryMap: Record<string, { name: string; days: number; mins: number }> = {}
  if (isAdmin) {
    for (const r of filtered) {
      const name = (r.profiles as any)?.name ?? '不明'
      if (!summaryMap[r.user_id]) summaryMap[r.user_id] = { name, days: 0, mins: 0 }
      if (r.clock_in) summaryMap[r.user_id].days++
      summaryMap[r.user_id].mins += calcWorkMins(r.clock_in, r.clock_out, r.break_minutes ?? 60)
    }
  }

  const colSpan = isAdmin ? 7 : 5

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>勤怠記録</h1>
      <p className="text-sm -mt-4" style={{ color: 'var(--text-secondary)' }}>{format(now, 'yyyy年M月', { locale: ja })}</p>

      {isAdmin && Object.keys(summaryMap).length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>今月のサマリー</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.values(summaryMap).map(s => (
              <div key={s.name} className="card p-4">
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                <p className="text-2xl font-bold text-blue-500 mt-1">{s.days}<span className="text-sm font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>日</span></p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>実働 {formatMins(s.mins)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="th-row">
              {isAdmin && <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>名前</th>}
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>日付</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>出勤</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>退勤</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>休憩</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>実働</th>
              {isAdmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b transition hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
                {isAdmin && <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{(r.profiles as any)?.name}</td>}
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{format(new Date(r.date), 'M月d日(E)', { locale: ja })}</td>
                <td className="px-4 py-3 text-green-500">{r.clock_in ? format(new Date(r.clock_in), 'HH:mm') : '-'}</td>
                <td className="px-4 py-3 text-red-500">{r.clock_out ? format(new Date(r.clock_out), 'HH:mm') : <span style={{ color: 'var(--text-muted)' }}>勤務中</span>}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.clock_out ? `${r.break_minutes ?? 60}分` : '-'}</td>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{formatMins(calcWorkMins(r.clock_in, r.clock_out, r.break_minutes ?? 60))}</td>
                {isAdmin && <td className="px-4 py-3"><AttendanceEditButton record={r} /></td>}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={colSpan} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>記録がありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
