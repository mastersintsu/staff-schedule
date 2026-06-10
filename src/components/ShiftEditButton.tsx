'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function ShiftEditButton({
  shift,
  profiles,
}: {
  shift: any
  profiles: Profile[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    user_id: shift.user_id,
    date: shift.date,
    start_time: shift.start_time.slice(0, 5),
    end_time: shift.end_time.slice(0, 5),
    note: shift.note ?? '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('shifts').update(form).eq('id', shift.id)
    router.refresh()
    setEditOpen(false)
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('このシフトを削除しますか？')) return
    await supabase.from('shifts').delete().eq('id', shift.id)
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-1 mt-1">
        <button onClick={() => setEditOpen(true)} className="text-blue-400 hover:text-blue-600">
          <Pencil size={11} />
        </button>
        <button onClick={handleDelete} className="text-red-400 hover:text-red-600">
          <Trash2 size={11} />
        </button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">シフト編集</h2>
              <button onClick={() => setEditOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">従業員</label>
                <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900">
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50">
                {loading ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
