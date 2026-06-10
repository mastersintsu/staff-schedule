'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Task } from '@/lib/types'
import { Pencil, Trash2, X } from 'lucide-react'

const statusOptions = [
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'done', label: '完了' },
]

export default function TaskCard({
  task,
  currentUserId,
  isAdmin,
  profiles,
}: {
  task: Task & { profiles?: any; projects?: any }
  currentUserId: string
  isAdmin: boolean
  profiles?: { id: string; name: string }[]
}) {
  const [progress, setProgress] = useState(task.progress)
  const [status, setStatus] = useState(task.status)
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description ?? '',
    assigned_to: task.assigned_to ?? '',
    due_date: task.due_date ?? '',
  })
  const [editLoading, setEditLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const canEdit = isAdmin || task.assigned_to === currentUserId

  async function save(newProgress: number, newStatus: string) {
    if (!canEdit) return
    setSaving(true)
    await supabase.from('tasks').update({ progress: newProgress, status: newStatus }).eq('id', task.id)
    router.refresh()
    setSaving(false)
  }

  function handleProgressChange(val: number) {
    setProgress(val)
    const newStatus = val === 100 ? 'done' : val > 0 ? 'in_progress' : 'todo'
    setStatus(newStatus as any)
    save(val, newStatus)
  }

  function handleStatusChange(val: string) {
    setStatus(val as any)
    const newProgress = val === 'done' ? 100 : progress
    setProgress(newProgress)
    save(newProgress, val)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditLoading(true)
    await supabase.from('tasks').update({
      title: editForm.title,
      description: editForm.description || null,
      assigned_to: editForm.assigned_to || null,
      due_date: editForm.due_date || null,
    }).eq('id', task.id)
    router.refresh()
    setEditOpen(false)
    setEditLoading(false)
  }

  async function handleDelete() {
    if (!confirm(`「${task.title}」を削除しますか？`)) return
    await supabase.from('tasks').delete().eq('id', task.id)
    router.refresh()
  }

  return (
    <>
      <div className={`rounded-lg border border-gray-100 p-3 bg-white ${saving ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-medium text-gray-800 text-sm leading-snug">{task.title}</p>
          <div className="flex items-center gap-1 shrink-0">
            {canEdit ? (
              <select
                value={status}
                onChange={e => handleStatusChange(e.target.value)}
                className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
              >
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <span className="text-xs text-gray-400">{statusOptions.find(o => o.value === status)?.label}</span>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition"
                  title="編集"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-500 transition"
                  title="削除"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>
        {task.description && <p className="text-xs text-gray-500 mb-2">{task.description}</p>}
        {task.profiles && <p className="text-xs text-gray-400 mb-1">担当: {task.profiles.name}</p>}
        {task.projects && <p className="text-xs text-gray-400 mb-1">PJ: {task.projects.name}</p>}
        <div className="flex items-center gap-2 mt-2">
          {canEdit ? (
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={e => handleProgressChange(Number(e.target.value))}
              className="flex-1 accent-blue-600"
            />
          ) : (
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
          <span className="text-xs font-semibold text-blue-600 w-9 text-right">{progress}%</span>
        </div>
        {task.due_date && (
          <p className="text-xs text-gray-400 mt-1">期限: {task.due_date}</p>
        )}
      </div>

      {/* 編集モーダル */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">タスク編集</h2>
              <button onClick={() => setEditOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none"
                />
              </div>
              {profiles && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                  <select
                    value={editForm.assigned_to}
                    onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                  >
                    <option value="">未割り当て</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期限</label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <button
                type="submit"
                disabled={editLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                {editLoading ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
