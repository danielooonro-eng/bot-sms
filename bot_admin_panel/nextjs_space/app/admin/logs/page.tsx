'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Download,
  Calendar,
  Filter,
} from 'lucide-react'
import { AuditLog } from '@/lib/types'
import toast from 'react-hot-toast'

interface LogWithUser extends AuditLog {
  user_email?: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogWithUser[]>([])
  const [search, setSearch] = useState('')
  const [actionType, setActionType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchLogs()
  }, [actionType, page])

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `/api/logs?action=${actionType}&page=${page}&limit=50`
      )
      const data = await response.json()

      if (data.success) {
        setLogs(data.data)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Error cargando logs')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) =>
    log.description.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase())
  )

  const handleDownload = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/logs/export?format=${format}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs.${format}`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success('Logs descargados')
    } catch (error) {
      console.error('Error downloading logs:', error)
      toast.error('Error descargando logs')
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'user_created':
      case 'number_rented':
        return 'bg-green-500/20 text-green-400'
      case 'payment':
        return 'bg-blue-500/20 text-blue-400'
      case 'user_blocked':
        return 'bg-red-500/20 text-red-400'
      case 'config_updated':
        return 'bg-yellow-500/20 text-yellow-400'
      default:
        return 'bg-slate-500/20 text-slate-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Logs de Auditoría</h1>
        <p className="text-slate-400">Historial completo de todas las acciones del sistema</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar en logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Select value={actionType} onValueChange={setActionType}>
          <SelectTrigger className="w-full sm:w-40 bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="user_created">Usuario creado</SelectItem>
            <SelectItem value="number_rented">Número rentado</SelectItem>
            <SelectItem value="payment">Pago</SelectItem>
            <SelectItem value="user_blocked">Usuario bloqueado</SelectItem>
            <SelectItem value="config_updated">Config actualizada</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('csv')}
            className="border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload('json')}
            className="border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="bg-slate-800 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {log.user_id || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {log.metadata ? (
                        <pre className="text-xs overflow-x-auto max-w-xs">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No hay logs que mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Mostrando {filteredLogs.length} logs de {logs.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            Página {page}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            className="border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
