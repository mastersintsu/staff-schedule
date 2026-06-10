import { createClient } from '@/lib/supabase/server'
import ProjectForm from '@/components/ProjectForm'
import Link from 'next/link'
import { format } from 'date-fns'

const statusLabel: Record<string, string> = { active: '進行中', completed: '完了', archived: 'アーカイブ' }
const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">プロジェクト</h1>
        {profile?.role === 'admin' && <ProjectForm />}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(projects ?? []).map(p => (
          <Link key={p.id} href={`/projects/${p.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 transition">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-800">{p.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor[p.status]}`}>
                {statusLabel[p.status]}
              </span>
            </div>
            {p.description && <p className="text-gray-500 text-sm mt-1 line-clamp-2">{p.description}</p>}
            {p.due_date && (
              <p className="text-gray-400 text-xs mt-2">期限: {format(new Date(p.due_date), 'yyyy/MM/dd')}</p>
            )}
          </Link>
        ))}
        {(projects ?? []).length === 0 && (
          <p className="text-gray-400 text-sm col-span-2">プロジェクトがありません</p>
        )}
      </div>
    </div>
  )
}
