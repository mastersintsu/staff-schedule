import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import DailyReportForm from '@/components/DailyReportForm'

export default async function DailyReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'
  const today = format(new Date(), 'yyyy-MM-dd')

  // 自分の今日の日報
  const { data: todayReport } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', user!.id)
    .eq('date', today)
    .single()

  // 一覧（管理者は全員・従業員は自分のみ）
  const query = supabase
    .from('daily_reports')
    .select('*, profiles(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (!isAdmin) query.eq('user_id', user!.id)
  const { data: reports } = await query

  const fields = [
    { key: 'counter_service', label: '店頭接客' },
    { key: 'email_response', label: 'メール対応' },
    { key: 'engraving', label: '彫刻対応' },
    { key: 'packing', label: '梱包対応' },
  ] as const

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>日報</h1>

      {/* 今日の日報入力 */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          {format(new Date(), 'M月d日(E)', { locale: ja })}の日報
        </h2>
        <div className="card p-5">
          <DailyReportForm userId={user!.id} date={today} existing={todayReport} />
        </div>
      </section>

      {/* 日報一覧 */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          {isAdmin ? '全員の日報' : '過去の日報'}
        </h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="th-row">
                {isAdmin && <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>名前</th>}
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>日付</th>
                {fields.map(f => (
                  <th key={f.key} className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>{f.label}</th>
                ))}
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>その他</th>
              </tr>
            </thead>
            <tbody>
              {(reports ?? []).map(r => (
                <tr key={r.id} className="border-b transition" style={{ borderColor: 'var(--border)' }}>
                  {isAdmin && <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{(r.profiles as any)?.name}</td>}
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {format(new Date(r.date), 'M月d日(E)', { locale: ja })}
                  </td>
                  {fields.map(f => (
                    <td key={f.key} className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-primary)' }}>
                      {r[f.key] > 0 ? r[f.key] : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)', maxWidth: '200px' }}>
                    <p className="truncate">{r.other || <span style={{ color: 'var(--text-muted)' }}>—</span>}</p>
                  </td>
                </tr>
              ))}
              {(reports ?? []).length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    日報がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
