'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--border)] transition"
      title={dark ? 'ライトモード' : 'ダークモード'}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
