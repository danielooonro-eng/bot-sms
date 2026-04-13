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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Eye, Trash2, Plus, AlertCircle, CheckCircle, Loader2, Shield, Edit2 } from 'lucide-react';

interface Admin {
  id: number;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'helper';
  created_at: string;
  updated_at: string;
}

const roleDescriptions: Record<string, string> = {
  owner: 'Acceso total al sistema',
  admin: 'Gestionar usuarios y enviar notificaciones',
  helper: 'Solo lectura de datos',
};

const roleColors: Record<string, string> = {
  owner: 'bg-purple-900/40 text-purple-300 border border-purple-700',
  admin: 'bg-blue-900/40 text-blue-300 border border-blue-700',
  helper: 'bg-gray-900/40 text-gray-300 border border-gray-700',
};

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [deleteAdminId, setDeleteAdminId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'helper'>('admin');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admins');
      const result = await response.json();

      if (result.success) {
        setAdmins(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      setErrorMessage('Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Filter locally for now
  };

  const handleDeleteAdmin = async (adminId: number) => {
    try {
      const response = await fetch(`/api/admins/${adminId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setAdmins(admins.filter(a => a.id !== adminId));
        setSuccessMessage('Administrador eliminado correctamente');
        setDeleteAdminId(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error al eliminar administrador');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al eliminar administrador');
    }
  };

  const handleCreateAdmin = async () => {
    const errors: string[] = [];

    // Validate
    if (!newEmail.trim()) {
      errors.push('El email es requerido');
    } else if (!newEmail.includes('@')) {
      errors.push('El email no es válido');
    }

    if (!newName.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!newPassword.trim()) {
      errors.push('La contraseña es requerida');
    } else if (newPassword.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setErrorMessage('Por favor corrige los errores');
      return;
    }

    try {
      setValidationErrors([]);
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.toLowerCase(),
          name: newName,
          password: newPassword,
          role: newRole,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAdmins([result.data, ...admins]);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewRole('admin');
        setShowCreateDialog(false);
        setValidationErrors([]);
        setSuccessMessage('Administrador creado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error al crear administrador');
        if (result.errors) {
          setValidationErrors(result.errors);
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al crear administrador');
      setValidationErrors(['Error al procesar la solicitud']);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          placeholder="Buscar por email o nombre..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1"
        />

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Administrador
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-200">Crear Nuevo Administrador</DialogTitle>
              <DialogDescription className="text-slate-400">
                Agrega un nuevo administrador al sistema
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
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Email *
                </label>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@example.com"
                  type="email"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Nombre *
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Contraseña *
                </label>
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  type="password"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-200">
                  Rol *
                </label>
                <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="admin" className="text-slate-200">
                      Admin - {roleDescriptions.admin}
                    </SelectItem>
                    <SelectItem value="helper" className="text-slate-200">
                      Helper - {roleDescriptions.helper}
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                <Button onClick={handleCreateAdmin} disabled={!newEmail.trim() || !newPassword.trim()}>
                  Crear Administrador
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Rol</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Creado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-400" />
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No hay administradores
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-700/50 border-b border-slate-700">
                    <td className="px-6 py-4 text-sm font-medium text-slate-200">{admin.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{admin.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[admin.role]}`}>
                        {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAdmin(admin)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-slate-200">Detalles del Administrador</DialogTitle>
                          </DialogHeader>
                          {selectedAdmin && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-slate-400">Email</p>
                                <p className="font-medium text-slate-200">{selectedAdmin.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-400">Nombre</p>
                                <p className="font-medium text-slate-200">{selectedAdmin.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-400">Rol</p>
                                <p className="font-medium text-slate-200">
                                  {selectedAdmin.role.charAt(0).toUpperCase() + selectedAdmin.role.slice(1)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-400">Descripción del Rol</p>
                                <p className="font-medium text-slate-200">{roleDescriptions[selectedAdmin.role]}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-slate-400">Fecha de Creación</p>
                                <p className="font-medium text-slate-200">
                                  {new Date(selectedAdmin.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-slate-400">Última Actualización</p>
                                <p className="font-medium text-slate-200">
                                  {new Date(selectedAdmin.updated_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {admin.role !== 'owner' && (
                        <AlertDialog open={deleteAdminId === admin.id} onOpenChange={(open) => !open && setDeleteAdminId(null)}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => setDeleteAdminId(admin.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <AlertDialogContent className="bg-slate-800 border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-slate-200">¿Eliminar administrador?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                Estás a punto de eliminar a {admin.name} ({admin.email}). Esta acción
                                no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteAdmin(admin.id)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
