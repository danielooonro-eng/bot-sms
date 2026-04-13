'use client'

import { useEffect, useState } from 'react'
import { Clock, User } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function AdminHeader() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Clock className="h-4 w-4" />
        <span>{time || '00:00:00'}</span>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs text-slate-400">danielooonro@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
