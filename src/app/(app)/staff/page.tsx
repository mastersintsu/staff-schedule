import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AddUserForm from '@/components/AddUserForm'
import DeleteUserButton from '@/components/DeleteUserButton'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: staff } = await supabase.from('profiles').select('*').order('created_at')

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()
  const emailMap = Object.fromEntries((authUsers ?? []).map(u => [u.id, u.email ?? '']))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>従業員管理</h1>
        <AddUserForm />
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="th-row">
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>氏名</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>メールアドレス</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>権限</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(staff ?? []).map(s => (
              <tr key={s.id} className="border-b transition" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{emailMap[s.id] ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {s.role === 'admin' ? '管理者（マスター）' : '従業員'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {s.id !== user!.id && (
                    <DeleteUserButton userId={s.id} name={s.name} />
                  )}
                </td>
              </tr>
            ))}
            {(staff ?? []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>従業員が登録されていません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
