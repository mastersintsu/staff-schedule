import { createClient } from '@/lib/supabase/server'
import TaskCard from '@/components/TaskCard'
import TaskForm from '@/components/TaskForm'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: profiles } = await supabase.from('profiles').select('*').order('name')

  const query = supabase
    .from('tasks')
    .select('*, profiles(name), projects(name)')
    .order('status')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (profile?.role !== 'admin') {
    query.eq('assigned_to', user!.id)
  }

  const { data: tasks } = await query

  const todo = (tasks ?? []).filter(t => t.status === 'todo')
  const inProgress = (tasks ?? []).filter(t => t.status === 'in_progress')
  const done = (tasks ?? []).filter(t => t.status === 'done')
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">タスク</h1>
        {isAdmin && <TaskForm profiles={profiles ?? []} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Column title="未着手" color="gray" tasks={todo} currentUserId={user!.id} isAdmin={isAdmin} profiles={profiles ?? []} />
        <Column title="進行中" color="yellow" tasks={inProgress} currentUserId={user!.id} isAdmin={isAdmin} profiles={profiles ?? []} />
        <Column title="完了" color="green" tasks={done} currentUserId={user!.id} isAdmin={isAdmin} profiles={profiles ?? []} />
      </div>
    </div>
  )
}

function Column({ title, color, tasks, currentUserId, isAdmin, profiles }: {
  title: string
  color: string
  tasks: any[]
  currentUserId: string
  isAdmin: boolean
  profiles: { id: string; name: string }[]
}) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${colors[color]}`}>{title}</span>
        <span className="text-gray-400 text-sm">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} currentUserId={currentUserId} isAdmin={isAdmin} profiles={profiles} />
        ))}
      </div>
    </div>
  )
}
