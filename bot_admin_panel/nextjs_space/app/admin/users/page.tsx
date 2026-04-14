'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Trash2, Plus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface User {
  id: number;
  user_id: number;
  credits: number;
  order_id: string | null;
  service: string | null;
  has_photo: boolean;
  created_at: string;
  updated_at: string;
  history?: string[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUserCredits, setNewUserCredits] = useState('0');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
    
    // Auto-refresh cada 10 segundos para sincronizar cambios del bot
    const interval = setInterval(() => {
      fetchUsers(searchTerm);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async (search = '') => {
    try {
      setLoading(true);
      const query = search ? `?search=${search}` : '';
      const response = await fetch(`/api/users${query}`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchUsers(value);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setUsers(users.filter(u => u.id !== userId));
        setSuccessMessage('Usuario eliminado correctamente');
        setDeleteUserId(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error al eliminar usuario');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al eliminar usuario');
    }
  };

  const handleCreateUser = async () => {
    const errors: string[] = [];

    // Validar
    if (!newUserId.trim()) {
      errors.push('El User ID es requerido');
    } else if (!Number.isInteger(Number(newUserId))) {
      errors.push('El User ID debe ser un número');
    } else if (Number(newUserId) < 1) {
      errors.push('El User ID debe ser un número positivo');
    }

    if (newUserCredits && !Number.isInteger(Number(newUserCredits))) {
      errors.push('Los créditos deben ser un número entero');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setErrorMessage('Por favor corrige los errores');
      return;
    }

    try {
      setValidationErrors([]);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(newUserId),
          credits: Number(newUserCredits) || 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUsers([result.data, ...users]);
        setNewUserId('');
        setNewUserCredits('0');
        setShowCreateDialog(false);
        setValidationErrors([]);
        setSuccessMessage('Usuario creado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error al crear usuario');
        if (result.errors) {
          setValidationErrors(result.errors);
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al crear usuario');
      setValidationErrors(['Error al procesar la solicitud']);
    }
  };

  const getLastService = (user: User) => {
    if (user.service) return user.service;
    if (user.history && user.history.length > 0) {
      return user.history[user.history.length - 1];
    }
    return 'N/A';
  };

  const getEstadoBadge = (user: User) => {
    if (user.credits < 0) return { text: 'Suspendido', color: 'bg-red-100 text-red-800' };
    if (user.credits === 0) return { text: 'Sin créditos', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Activo', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Buscar por User ID o servicio..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1"
        />

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Agrega un nuevo usuario al sistema
              </DialogDescription>
            </DialogHeader>
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <div className="space-y-1">
                  {validationErrors.map((err, idx) => (
                    <AlertDescription key={idx}>• {err}</AlertDescription>
                  ))}
                </div>
              </Alert>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  User ID (Telegram) *
                </label>
                <Input
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="Ej: 123456789"
                  type="number"
                  className={validationErrors.some(e => e.includes('User ID')) ? 'border-red-500' : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Créditos iniciales</label>
                <Input
                  value={newUserCredits}
                  onChange={(e) => setNewUserCredits(e.target.value)}
                  placeholder="0"
                  type="number"
                  defaultValue="0"
                  min="0"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setValidationErrors([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={!newUserId.trim()}>
                  Crear Usuario
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden bg-slate-800 border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">User ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Créditos</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Servicio</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Foto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Creado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-400" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No hay usuarios
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const estado = getEstadoBadge(user);
                  return (
                    <tr key={user.id} className="hover:bg-slate-700/50 border-b border-slate-700">
                      <td className="px-6 py-4 text-sm font-medium text-slate-200">{user.user_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">${user.credits}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{getLastService(user)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          estado.text === 'Activo' 
                            ? 'bg-green-900/40 text-green-300 border border-green-700'
                            : estado.text === 'Suspendido'
                            ? 'bg-red-900/40 text-red-300 border border-red-700'
                            : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
                        }`}>
                          {estado.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {user.has_photo ? '✅ Sí' : '❌ No'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
                            <DialogHeader>
                              <DialogTitle className="text-slate-200">Detalles del Usuario</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-slate-400">ID de Base de Datos</p>
                                  <p className="font-medium text-slate-200">{selectedUser.id}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-400">User ID (Telegram)</p>
                                  <p className="font-medium text-slate-200">{selectedUser.user_id}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-400">Créditos</p>
                                  <p className="font-medium text-lg text-green-400">
                                    ${selectedUser.credits}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-400">Estado</p>
                                  <p className="font-medium text-slate-200">{getEstadoBadge(selectedUser).text}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-400">Servicio Actual</p>
                                  <p className="font-medium text-slate-200">{selectedUser.service || 'Ninguno'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-400">Último Servicio</p>
                                  <p className="font-medium text-slate-200">{getLastService(selectedUser)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-400">Orden Activa</p>
                                  <p className="font-medium text-slate-200">{selectedUser.order_id || 'Ninguna'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-400">Foto</p>
                                  <p className="font-medium text-slate-200">{selectedUser.has_photo ? '✅ Sí' : '❌ No'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-slate-400">Fecha de Creación</p>
                                  <p className="font-medium text-slate-200">
                                    {new Date(selectedUser.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-slate-400">Última Actualización</p>
                                  <p className="font-medium text-slate-200">
                                    {new Date(selectedUser.updated_at).toLocaleString()}
                                  </p>
                                </div>
                                {selectedUser.history && selectedUser.history.length > 0 && (
                                  <div className="col-span-2">
                                    <p className="text-sm text-slate-400">Historial de Servicios</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {selectedUser.history.map((service, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 bg-blue-900/40 text-blue-300 border border-blue-700 rounded text-xs"
                                        >
                                          {service}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog open={deleteUserId === user.id} onOpenChange={(open) => !open && setDeleteUserId(null)}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => setDeleteUserId(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Estás a punto de eliminar al usuario {user.user_id}. Esta acción
                                no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}