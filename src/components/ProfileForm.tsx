'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'

export default function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [tab, setTab] = useState<'profile' | 'password'>('profile')

  const [name, setName] = useState(profile?.name ?? '')
  const [newEmail, setNewEmail] = useState(email)
  const [nameLoading, setNameLoading] = useState(false)
  const [nameMessage, setNameMessage] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState('')

  const router = useRouter()
  const supabase = createClient()

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameLoading(true)
    setNameMessage('')
    // 氏名更新
    const { error: nameError } = await supabase.from('profiles').update({ name }).eq('id', profile!.id)
    if (nameError) { setNameMessage('保存に失敗しました'); setNameLoading(false); return }
    // メールアドレス変更
    if (newEmail !== email) {
      const res = await fetch('/api/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      })
      if (!res.ok) {
        setNameMessage('メールアドレスの変更に失敗しました')
        setNameLoading(false)
        return
      }
    }
    setNameMessage('保存しました')
    router.refresh()
    setNameLoading(false)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwMessage('')
    if (newPassword !== confirmPassword) { setPwMessage('新しいパスワードが一致しません'); return }
    if (newPassword.length < 6) { setPwMessage('パスワードは6文字以上で入力してください'); return }
    setPwLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (signInError) { setPwMessage('現在のパスワードが正しくありません'); setPwLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwMessage('パスワードの変更に失敗しました')
    } else {
      setPwMessage('パスワードを変更しました')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    }
    setPwLoading(false)
  }

  const isError = (msg: string) => msg && !msg.includes('しました')

  return (
    <div className="space-y-5">
      {/* タブ */}
      <div className="flex rounded-lg p-1" style={{ backgroundColor: 'var(--bg)' }}>
        {([
          { key: 'profile', label: 'プロフィール' },
          { key: 'password', label: 'パスワード変更' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-1.5 rounded-md text-sm font-medium transition"
            style={tab === t.key
              ? { backgroundColor: 'var(--accent)', color: '#fff' }
              : { color: 'var(--text-secondary)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* プロフィールタブ */}
      {tab === 'profile' && (
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>メールアドレス</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>氏名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>権限</label>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {profile?.role === 'admin' ? '管理者（マスター）' : '従業員'}
            </p>
          </div>
          {nameMessage && <p className={`text-xs ${isError(nameMessage) ? 'text-red-500' : 'text-green-500'}`}>{nameMessage}</p>}
          <button type="submit" disabled={nameLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50">
            {nameLoading ? '保存中...' : '保存'}
          </button>
        </form>
      )}

      {/* パスワードタブ */}
      {tab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {[
            { label: '現在のパスワード', value: currentPassword, set: setCurrentPassword },
            { label: '新しいパスワード', value: newPassword, set: setNewPassword },
            { label: '新しいパスワード（確認）', value: confirmPassword, set: setConfirmPassword },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
              <input
                type="password"
                value={value}
                onChange={e => set(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          ))}
          {pwMessage && <p className={`text-xs ${isError(pwMessage) ? 'text-red-500' : 'text-green-500'}`}>{pwMessage}</p>}
          <button type="submit" disabled={pwLoading}
            className="w-full text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}>
            {pwLoading ? '変更中...' : 'パスワードを変更'}
          </button>
        </form>
      )}
    </div>
  )
}
