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
  Filter,
  MoreVertical,
  Eye,
  Lock,
  Unlock,
  History,
} from 'lucide-react'
import { BotUser } from '@/lib/types'
import toast from 'react-hot-toast'

interface UserWithStats extends BotUser {
  total_spent?: number
  last_rent_date?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [status])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?status=${status}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error cargando usuarios')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.telegram_id.toString().includes(search) ||
      user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: block }),
      })

      if (response.ok) {
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, blocked: block } : u))
        )
        toast.success(block ? 'Usuario bloqueado' : 'Usuario desbloqueado')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Error actualizando usuario')
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
        <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
        <p className="text-slate-400">Administra y monitorea todos los usuarios</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por ID, nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40 bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="blocked">Bloqueados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-slate-800 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  ID Telegram
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Créditos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Última actividad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Números rentados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-blue-400">
                      {user.telegram_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {user.first_name} {user.last_name || ''}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {user.credits}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {user.last_activity
                        ? new Date(user.last_activity).toLocaleDateString('es-MX')
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {user.rented_numbers?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.blocked
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {user.blocked ? '🔒 Bloqueado' : '✓ Activo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:bg-blue-500/10"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={
                            user.blocked
                              ? 'text-green-400 hover:bg-green-500/10'
                              : 'text-red-400 hover:bg-red-500/10'
                          }
                          onClick={() => handleBlockUser(user.id, !user.blocked)}
                          title={user.blocked ? 'Desbloquear' : 'Bloquear'}
                        >
                          {user.blocked ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:bg-slate-700"
                          title="Ver historial"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No hay usuarios que mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination info */}
      <div className="text-sm text-slate-400 text-center">
        Mostrando {filteredUsers.length} de {users.length} usuarios
      </div>
    </div>
  )
}
