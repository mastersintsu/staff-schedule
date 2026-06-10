import { createClient } from '@/lib/supabase/server'
import TaskCard from '@/components/TaskCard'
import TaskForm from '@/components/TaskForm'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, profiles(name)')
    .eq('project_id', id)
    .order('created_at')
  const { data: profiles } = await supabase.from('profiles').select('*').order('name')

  if (!project) return <p className="text-gray-400">プロジェクトが見つかりません</p>

  const avgProgress = tasks && tasks.length > 0
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
        {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm text-gray-500">全体進捗</span>
          <div className="flex-1 max-w-xs bg-gray-100 rounded-full h-3">
            <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${avgProgress}%` }} />
          </div>
          <span className="text-blue-600 font-semibold">{avgProgress}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">タスク一覧</h2>
        {profile?.role === 'admin' && <TaskForm projectId={id} profiles={profiles ?? []} />}
      </div>

      <div className="space-y-3">
        {(tasks ?? []).map(task => (
          <TaskCard key={task.id} task={task} currentUserId={user!.id} isAdmin={profile?.role === 'admin'} profiles={profiles ?? []} />
        ))}
        {(tasks ?? []).length === 0 && <p className="text-gray-400 text-sm">タスクがありません</p>}
      </div>
    </div>
  )
}
