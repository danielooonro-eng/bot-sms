'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  TrendingUp,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { DashboardMetrics } from '@/lib/types'

interface Activity {
  id: string
  user: string
  action: string
  timestamp: string
  service?: string
  amount?: number
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('7d')
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard metrics
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/dashboard/metrics?period=${period}`)
        const data = await response.json()
        if (data.success) {
          setMetrics(data.data)
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
      }
    }

    // Fetch recent activities
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/dashboard/activities?limit=10')
        const data = await response.json()
        if (data.success) {
          setActivities(data.data)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    fetchActivities()
  }, [period])

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    change,
    isPositive,
  }: {
    icon: React.ReactNode
    label: string
    value: string | number
    change?: number
    isPositive?: boolean
  }) => (
    <Card className="bg-slate-800 border-slate-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-slate-700 rounded-lg text-blue-400">
            {Icon}
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Bienvenido de vuelta, Admin 👋</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Usuarios Totales"
          value={metrics?.total_users || 0}
          change={metrics?.growth_rate || 0}
          isPositive={true}
        />
        <MetricCard
          icon={<Activity className="h-5 w-5" />}
          label="Usuarios Activos (7d)"
          value={metrics?.active_users_7d || 0}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Números Rentados"
          value={metrics?.total_rented_numbers || 0}
        />
        <MetricCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Ingresos Totales"
          value={`$${(metrics?.total_revenue || 0).toFixed(2)}`}
          change={5}
          isPositive={true}
        />
      </div>

      {/* Activities */}
      <Card className="bg-slate-800 border-slate-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Actividad Reciente</h2>
            <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
              Ver más
            </Button>
          </div>

          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {activity.user.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-400">{activity.user}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {activity.amount && (
                      <p className="text-sm font-semibold text-white">
                        ${activity.amount.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">No hay actividad reciente</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
