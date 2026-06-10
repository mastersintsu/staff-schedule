import { createClient } from '@/lib/supabase/server'
import { format, startOfWeek, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import ShiftForm from '@/components/ShiftForm'
import ShiftEditButton from '@/components/ShiftEditButton'
import ShiftCopyWeek from '@/components/ShiftCopyWeek'

export default async function ShiftsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: profiles } = await supabase.from('profiles').select('*').order('name')

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const twoWeeksEnd = addDays(weekStart, 13)

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*, profiles(name)')
    .gte('date', format(weekStart, 'yyyy-MM-dd'))
    .lte('date', format(twoWeeksEnd, 'yyyy-MM-dd'))
    .order('date')
    .order('start_time')

  const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i))
  const isAdmin = profile?.role === 'admin'


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">シフト管理</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <ShiftCopyWeek weekStart={format(weekStart, 'yyyy-MM-dd')} shifts={shifts ?? []} />
            <ShiftForm profiles={profiles ?? []} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-3 text-left font-medium text-gray-600 w-28">日付</th>
              {(profiles ?? []).map(p => (
                <th key={p.id} className="px-3 py-3 text-center font-medium text-gray-600 min-w-28">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayShifts = (shifts ?? []).filter(s => s.date === dateStr)
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
              return (
                <tr key={dateStr} className={`border-b border-gray-50 ${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-3 py-2 font-medium text-gray-600">
                    {format(day, 'M/d(E)', { locale: ja })}
                  </td>
                  {(profiles ?? []).map(p => {
                    const shift = dayShifts.find(s => s.user_id === p.id)
                    return (
                      <td key={p.id} className="px-3 py-2 text-center">
                        {shift ? (
                          <div className="inline-block">
                            <span className="inline-block bg-blue-100 text-blue-700 text-xs rounded px-2 py-0.5">
                              {shift.start_time.slice(0,5)}〜{shift.end_time.slice(0,5)}
                            </span>
                            {isAdmin && <ShiftEditButton shift={shift} profiles={profiles ?? []} />}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
