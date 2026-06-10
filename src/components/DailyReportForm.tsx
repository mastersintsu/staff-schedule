'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  date: string
  existing: {
    id: string
    counter_service: number
    email_response: number
    engraving: number
    packing: number
    other: string | null
  } | null
}

const FIELDS = [
  { key: 'counter_service', label: '店頭接客', unit: '件' },
  { key: 'email_response', label: 'メール対応', unit: '件' },
  { key: 'engraving', label: '彫刻対応', unit: '件' },
  { key: 'packing', label: '梱包対応', unit: '件' },
] as const

export default function DailyReportForm({ userId, date, existing }: Props) {
  const [values, setValues] = useState({
    counter_service: existing?.counter_service ?? 0,
    email_response: existing?.email_response ?? 0,
    engraving: existing?.engraving ?? 0,
    packing: existing?.packing ?? 0,
    other: existing?.other ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const payload = { ...values, user_id: userId, date, updated_at: new Date().toISOString() }

    let error
    if (existing) {
      ;({ error } = await supabase.from('daily_reports').update(payload).eq('id', existing.id))
    } else {
      ;({ error } = await supabase.from('daily_reports').insert(payload))
    }

    if (error) {
      setMessage('保存に失敗しました')
    } else {
      setMessage('保存しました')
      router.refresh()
    }
    setLoading(false)
  }

  const isError = message && !message.includes('しました')

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {f.label}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                value={values[f.key]}
                onChange={e => setValues(v => ({ ...v, [f.key]: Number(e.target.value) }))}
                className="w-full rounded-lg px-3 py-2 text-sm text-center"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>その他</label>
        <textarea
          value={values.other}
          onChange={e => setValues(v => ({ ...v, other: e.target.value }))}
          rows={3}
          placeholder="自由記入"
          className="w-full rounded-lg px-3 py-2 text-sm resize-none"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {loading ? '保存中...' : existing ? '更新' : '登録'}
        </button>
        {message && (
          <p className={`text-sm ${isError ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
        )}
      </div>
    </form>
  )
}
