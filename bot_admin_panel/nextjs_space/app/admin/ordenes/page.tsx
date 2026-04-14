'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, RefreshCw, Trash2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  user_id: string
  credits: number
  service: string
  order_id: string
  elapsed_time: string
  elapsed_seconds: number
  created_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/orders')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch orders')
      }

      setOrders(data.data || [])
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Error loading orders')
      toast.error('Error cargando órdenes')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchOrders()

    const interval = setInterval(() => {
      fetchOrders()
    }, 10000)

    setRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  // Handle order cancellation
  const handleCancelOrder = async (userId: string, orderId: string) => {
    if (!window.confirm(`¿Cancelar orden ${orderId} del usuario ${userId}?`)) {
      return
    }

    setCancelling(userId)
    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel order')
      }

      toast.success(`Orden ${orderId} cancelada. Crédito devuelto.`)
      await fetchOrders()
    } catch (err: any) {
      console.error('Error cancelling order:', err)
      toast.error(err.message || 'Error cancelando orden')
    } finally {
      setCancelling(null)
    }
  }

  // Filter orders by search
  const filteredOrders = orders.filter(
    (order) =>
      order.user_id.includes(search) ||
      order.order_id.includes(search) ||
      order.service.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Órdenes Activas</h1>
        <p className="text-slate-400">Administra órdenes de SMS en espera</p>
      </div>

      {/* Main Card */}
      <Card className="bg-slate-800 border-slate-700">
        <div className="p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por User ID, Service o Order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              onClick={fetchOrders}
              disabled={loading}
              className="ml-4 bg-slate-700 hover:bg-slate-600 text-white"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-2">Actualizar</span>
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredOrders.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                      User ID
                    </th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                      Servicio
                    </th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                      Tiempo Transcurrido
                    </th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                      Créditos
                    </th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.user_id}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-mono text-xs">
                        {order.user_id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                          {order.service}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-xs">
                        {order.order_id}
                      </td>
                      <td className="py-3 px-4 text-yellow-400 font-semibold">
                        {order.elapsed_time}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {order.credits}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          onClick={() =>
                            handleCancelOrder(order.user_id, order.order_id)
                          }
                          disabled={cancelling === order.user_id}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-3 flex items-center gap-2"
                          size="sm"
                        >
                          <Trash2 className="h-3 w-3" />
                          {cancelling === order.user_id ? 'Cancelando...' : 'Cancelar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : loading ? (
              <div className="py-12 text-center">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-slate-400 mt-4">Cargando órdenes...</p>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-slate-400">No hay órdenes activas en este momento</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          {filteredOrders.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                Total de órdenes activas: <span className="font-semibold text-white">{filteredOrders.length}</span>
                {filteredOrders.length !== orders.length && (
                  <span> (mostrando {filteredOrders.length} de {orders.length})</span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                La página se actualiza automáticamente cada 10 segundos
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
