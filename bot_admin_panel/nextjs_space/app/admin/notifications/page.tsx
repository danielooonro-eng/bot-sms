'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Send,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { Notification } from '@/lib/types'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const Textarea = dynamic(() => import('@/components/ui/textarea').then(m => m.Textarea), {
  ssr: false,
  loading: () => <input className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white" />
})

interface NotificationWithStatus extends Notification {
  recipient_name?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationWithStatus[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [recipientId, setRecipientId] = useState('')
  const [sendToAll, setSendToAll] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=50')
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Error cargando notificaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast.error('Por favor escribe un mensaje')
      return
    }

    if (!sendToAll && !recipientId) {
      toast.error('Selecciona un usuario o marca "Enviar a todos"')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: sendToAll ? null : recipientId,
          title: title || undefined,
          message,
          send_to_all: sendToAll,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Notificación enviada')
        setTitle('')
        setMessage('')
        setRecipientId('')
        setSendToAll(false)
        fetchNotifications()
      } else {
        toast.error(data.error || 'Error enviando notificación')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Error enviando notificación')
    } finally {
      setSending(false)
    }
  }

  const filteredNotifications = notifications.filter((n) =>
    n.message.toLowerCase().includes(search.toLowerCase()) ||
    n.recipient_id?.includes(search)
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Notificaciones</h1>
        <p className="text-slate-400">Envía mensajes a usuarios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Send Form */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Enviar notificación</h2>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Destinatario</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="ID del usuario (Telegram ID)"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    disabled={sendToAll || sending}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendToAll}
                      onChange={(e) => setSendToAll(e.target.checked)}
                      disabled={sending}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-300">Enviar a todos los usuarios</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">
                  Título (opcional)
                </Label>
                <Input
                  id="title"
                  placeholder="Asunto del mensaje"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={sending}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-300">
                  Mensaje
                </Label>
                <textarea
                  id="message"
                  placeholder="Escribe tu mensaje aquí..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-400">
                  {message.length} caracteres
                </p>
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Enviando...' : 'Enviar notificación'}
              </Button>
            </form>
          </div>
        </Card>

        {/* Notifications History */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Historial de notificaciones</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchNotifications}
                className="text-blue-400 hover:bg-blue-500/10"
              >
                Actualizar
              </Button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar notificaciones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Notifications List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 rounded-lg bg-slate-700/50 border border-slate-600/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {notification.title && (
                          <p className="font-semibold text-white text-sm">
                            {notification.title}
                          </p>
                        )}
                        <p className="text-slate-300 text-sm">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {notification.is_sent ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Para: {notification.recipient_id || 'Todos los usuarios'}
                      </span>
                      <span>
                        {new Date(notification.created_at).toLocaleString('es-MX')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">
                  No hay notificaciones que mostrar
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
