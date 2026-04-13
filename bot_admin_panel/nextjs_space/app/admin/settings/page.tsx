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
  Eye,
  EyeOff,
  Save,
  Lock,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { BotSettings } from '@/lib/types'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState<BotSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  // Form state
  const [maxUsers, setMaxUsers] = useState('1000')
  const [maxNumbersPerUser, setMaxNumbersPerUser] = useState('5')
  const [creditPrice, setCreditPrice] = useState('1')
  const [minCredits, setMinCredits] = useState('1')
  const [smsTimeout, setSmsTimeout] = useState('20')
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()

      if (data.success && data.data) {
        const s = data.data
        setSettings(s)
        setMaxUsers(s.max_users?.toString() || '1000')
        setMaxNumbersPerUser(s.max_numbers_per_user?.toString() || '5')
        setCreditPrice(s.credit_price?.toString() || '1')
        setMinCredits(s.min_credits_to_buy?.toString() || '1')
        setSmsTimeout(s.sms_timeout_minutes?.toString() || '20')
        setMaintenanceMode(s.maintenance_mode || false)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Error cargando configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_users: parseInt(maxUsers),
          max_numbers_per_user: parseInt(maxNumbersPerUser),
          credit_price: parseFloat(creditPrice),
          min_credits_to_buy: parseInt(minCredits),
          sms_timeout_minutes: parseInt(smsTimeout),
          maintenance_mode: maintenanceMode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Configuración guardada')
        setSettings(data.data)
      } else {
        toast.error(data.error || 'Error guardando configuración')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error guardando configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword) {
      toast.error('Por favor ingresa una contraseña')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Contraseña actualizada')
        setNewPassword('')
      } else {
        toast.error(data.error || 'Error actualizando contraseña')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Error actualizando contraseña')
    } finally {
      setSaving(false)
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Configuración</h1>
        <p className="text-slate-400">Administra los parámetros del bot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bot Settings */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Configuración del Bot</h2>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">Máximo de usuarios</Label>
                  <Input
                    type="number"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    disabled={saving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Límite de usuarios registrados
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Máx. números por usuario
                  </Label>
                  <Input
                    type="number"
                    value={maxNumbersPerUser}
                    onChange={(e) => setMaxNumbersPerUser(e.target.value)}
                    disabled={saving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Números que puede rentar simultáneamente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Precio por crédito ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={creditPrice}
                    onChange={(e) => setCreditPrice(e.target.value)}
                    disabled={saving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Valor de cada crédito en dólares
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Mín. créditos para comprar
                  </Label>
                  <Input
                    type="number"
                    value={minCredits}
                    onChange={(e) => setMinCredits(e.target.value)}
                    disabled={saving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Créditos mínimos requeridos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Timeout SMS (minutos)</Label>
                  <Input
                    type="number"
                    value={smsTimeout}
                    onChange={(e) => setSmsTimeout(e.target.value)}
                    disabled={saving}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Tiempo máximo para recibir SMS
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Modo mantenimiento</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        disabled={saving}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-300">
                        {maintenanceMode ? 'Activado' : 'Desactivado'}
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-400">
                    Desactiva el bot temporalmente
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={fetchSettings}
                  disabled={saving}
                  className="border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Cambiar contraseña</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nueva contraseña</Label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={saving}
                    className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Mínimo 8 caracteres
                </p>
              </div>

              <Button
                type="submit"
                disabled={saving || !newPassword}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
              >
                <Lock className="h-4 w-4 mr-2" />
                {saving ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-red-900/20 border-red-700 lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-semibold text-red-400">Zona de peligro</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Estas acciones no se pueden deshacer. Por favor, procede con cuidado.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-500/10"
              >
                Limpiar caché
              </Button>
              <Button
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-500/10"
              >
                Exportar datos
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
