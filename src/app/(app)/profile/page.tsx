import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>プロフィール</h1>
      <ProfileForm profile={profile} email={user?.email ?? ''} />
    </div>
  )
}
