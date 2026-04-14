'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle, Loader2, Send, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  recipient_type: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [recipientType, setRecipientType] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Cargar notificaciones
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setErrorMessage('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  // Validar formulario
  const validateForm = () => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('El título es requerido');
    } else if (title.length > 255) {
      errors.push('El título no puede exceder 255 caracteres');
    }

    if (!message.trim()) {
      errors.push('El mensaje es requerido');
    } else if (message.length > 5000) {
      errors.push('El mensaje no puede exceder 5000 caracteres');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar antes de enviar
    if (!validateForm()) {
      setErrorMessage('Por favor corrige los errores');
      return;
    }

    try {
      setFormLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          recipient_type: recipientType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('¡Notificación enviada correctamente!');
        setTitle('');
        setMessage('');
        setType('info');
        setRecipientType('all');
        setValidationErrors([]);

        setTimeout(() => {
          fetchNotifications();
        }, 500);
      } else {
        setErrorMessage(result.error || 'Error al enviar notificación');
        if (result.errors) {
          setValidationErrors(result.errors);
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      setErrorMessage(error.message || 'Error al enviar notificación');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta notificación?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
        setSuccessMessage('Notificación eliminada');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setErrorMessage('Error al eliminar notificación');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulario */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Enviar Notificación</h2>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <div className="space-y-1">
                {validationErrors.map((err, idx) => (
                  <AlertDescription key={idx}>• {err}</AlertDescription>
                ))}
              </div>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Título *
                <span className="text-gray-500 ml-2">
                  ({title.length}/255)
                </span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la notificación"
                disabled={formLoading}
                maxLength={255}
                className={validationErrors.some(e => e.includes('título')) ? 'border-red-500' : ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Mensaje *
                <span className="text-gray-500 ml-2">
                  ({message.length}/5000)
                </span>
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contenido del mensaje"
                className="h-32"
                disabled={formLoading}
                maxLength={5000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <Select value={type} onValueChange={setType} disabled={formLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Información</SelectItem>
                    <SelectItem value="warning">⚠️ Advertencia</SelectItem>
                    <SelectItem value="success">✅ Éxito</SelectItem>
                    <SelectItem value="error">❌ Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Destinatarios</label>
                <Select value={recipientType} onValueChange={setRecipientType} disabled={formLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">👥 Todos</SelectItem>
                    <SelectItem value="admins">🔐 Administradores</SelectItem>
                    <SelectItem value="users">👤 Usuarios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={formLoading || !title.trim() || !message.trim() || validationErrors.length > 0}
              className="w-full"
            >
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Notificación
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Historial */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Historial de Notificaciones</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay notificaciones aún
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-slate-700"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{notif.title}</h3>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notif.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}