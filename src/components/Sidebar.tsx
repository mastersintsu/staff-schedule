'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, Clock, FolderKanban, CheckSquare, Users, UserCircle, LogOut, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/shifts', label: 'シフト管理', icon: Calendar },
  { href: '/attendance', label: '勤怠', icon: Clock },
  { href: '/projects', label: 'プロジェクト', icon: FolderKanban },
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  { href: '/daily-reports', label: '日報', icon: FileText },
  { href: '/staff', label: '従業員管理', icon: Users, adminOnly: true },
  { href: '/profile', label: 'プロフィール', icon: UserCircle },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 flex flex-col shrink-0" style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="font-bold text-blue-500 text-lg">スタッフ管理</p>
          {profile && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              {profile.name}
              {profile.role === 'admin' && (
                <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1 rounded dark:bg-blue-900 dark:text-blue-300">マスター</span>
              )}
            </p>
          )}
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems
          .filter(item => !('adminOnly' in item && item.adminOnly && profile?.role !== 'admin'))
          .map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={active ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition hover:opacity-80 ${active ? 'font-medium' : ''}`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
      </nav>

      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{ color: 'var(--text-secondary)' }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:opacity-70 w-full transition"
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
