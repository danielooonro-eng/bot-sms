'use client'

import { useEffect, useState } from 'react'
import { Clock, User } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface UserInfo {
  email: string
  name: string
  role: string
  id: string
}

export function AdminHeader() {
  const [time, setTime] = useState('')
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch time
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

  // Fetch user info from /api/auth/me
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.data)
        } else {
          console.error('Failed to fetch user info:', response.status)
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
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
            <p className="text-sm font-medium text-white">{loading ? 'Cargando...' : (user?.name || 'Admin')}</p>
            <p className="text-xs text-slate-400">{loading ? '...' : (user?.email || 'No disponible')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
