'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RoleChangeButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleChange() {
    const newRole = currentRole === 'admin' ? 'employee' : 'admin'
    const label = newRole === 'admin' ? '管理者（マスター）' : '従業員'
    if (!confirm(`権限を「${label}」に変更しますか？`)) return
    setLoading(true)
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleChange}
      disabled={loading}
      className="text-xs px-2 py-1 rounded border transition hover:opacity-70 disabled:opacity-40"
      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
    >
      {loading ? '変更中...' : '権限変更'}
    </button>
  )
}
