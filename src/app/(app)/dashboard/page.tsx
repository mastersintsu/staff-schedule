import { createClient } from '@/lib/supabase/server'
import { format, addDays, isPast, isWithinInterval } from 'date-fns'
import { ja } from 'date-fns/locale'
import AttendanceButton from '@/components/AttendanceButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const today = format(new Date(), 'yyyy-MM-dd')
  const isAdmin = profile?.role === 'admin'

  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*, profiles(name)')
    .neq('status', 'done')
    .order('due_date', { ascending: true, nullsFirst: false })

  const { data: attendance } = await supabase
    .from('attendances')
    .select('*')
    .eq('user_id', user!.id)
    .eq('date', today)
    .single()

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*, profiles(name)')
    .eq('date', today)

  const visibleTasks = (allTasks ?? []).filter(t => isAdmin || t.assigned_to === user!.id)
  const now = new Date()
  const overdue = visibleTasks.filter(t => t.due_date && isPast(new Date(t.due_date + 'T23:59:59')))
  const soon = visibleTasks.filter(t =>
    t.due_date &&
    !isPast(new Date(t.due_date + 'T23:59:59')) &&
    isWithinInterval(new Date(t.due_date), { start: now, end: addDays(now, 3) })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>ダッシュボード</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{format(new Date(), 'yyyy年M月d日(E)', { locale: ja })}</p>
        </div>
        <AttendanceButton userId={user!.id} attendance={attendance} />
      </div>

      {(overdue.length > 0 || soon.length > 0) && (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c' }}>
              🚨 <strong>期限切れ {overdue.length}件</strong>：{overdue.map(t => t.title).join('、')}
            </div>
          )}
          {soon.length > 0 && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
              ⚠️ <strong>3日以内に期限 {soon.length}件</strong>：{soon.map(t => t.title).join('、')}
            </div>
          )}
        </div>
      )}

      <section>
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>本日のシフト</h2>
        {shifts && shifts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {shifts.map(s => (
              <div key={s.id} className="card p-4">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{(s.profiles as any)?.name}</p>
                <p className="text-sm text-blue-500">{s.start_time.slice(0,5)} 〜 {s.end_time.slice(0,5)}</p>
                {s.note && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.note}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>本日のシフトはありません</p>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          {isAdmin ? '全員のタスク進捗' : '自分のタスク'}
        </h2>
        <div className="space-y-3">
          {visibleTasks.map(task => {
            const isOverdue = task.due_date && isPast(new Date(task.due_date + 'T23:59:59'))
            const isSoon = task.due_date && !isOverdue && isWithinInterval(new Date(task.due_date), { start: now, end: addDays(now, 3) })
            return (
              <div key={task.id} className="card p-4" style={isOverdue ? { borderColor: '#fca5a5' } : isSoon ? { borderColor: '#fdba74' } : {}}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.profiles && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{(task.profiles as any).name}</p>}
                      {task.due_date && (
                        <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : ''}`} style={!isOverdue ? { color: 'var(--text-muted)' } : {}}>
                          期限: {task.due_date}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={task.status === 'in_progress'
                      ? { backgroundColor: '#fef9c3', color: '#a16207' }
                      : { backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    {task.status === 'todo' ? '未着手' : '進行中'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'var(--border)' }}>
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-blue-500 w-10 text-right">{task.progress}%</span>
                </div>
              </div>
            )
          })}
          {visibleTasks.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>進行中のタスクはありません</p>}
        </div>
      </section>
    </div>
  )
}
