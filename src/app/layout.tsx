import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'スタッフ管理',
  description: '従業員スケジュール・タスク管理',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>{children}</body>
    </html>
  )
}
