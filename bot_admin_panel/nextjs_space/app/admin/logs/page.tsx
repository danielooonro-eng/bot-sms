'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, Download, FileJson, FileText } from 'lucide-react';

interface Log {
  id: number;
  user_id: number;
  action: string;
  service: string;
  status: string;
  created_at: string;
  details?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (
    search = '',
    status = 'all',
    start = '',
    end = ''
  ) => {
    try {
      setLoading(true);
      let url = '/api/logs?';

      if (search) url += `search=${search}&`;
      if (status !== 'all') url += `status=${status}&`;
      if (start) url += `startDate=${start}&`;
      if (end) url += `endDate=${end}&`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setErrorMessage('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchLogs(value, statusFilter, startDate, endDate);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    fetchLogs(searchTerm, value, startDate, endDate);
  };

  const handleDateFilter = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchLogs(searchTerm, statusFilter, start, end);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(format);
      setErrorMessage('');
      setSuccessMessage('');

      let url = `/api/logs/export?format=${format}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage(`Logs exportados a ${format.toUpperCase()} correctamente`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error exporting:', error);
      setErrorMessage(error.message || `Error al exportar a ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string } } = {
      success: { bg: 'bg-green-100', text: 'text-green-800' },
      error: { bg: 'bg-red-100', text: 'text-red-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
    };

    const badge = badges[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return badge;
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

      {/* Filtros */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Filtros y Búsqueda</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            placeholder="Buscar por usuario o acción..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />

          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="success">✅ Exitoso</SelectItem>
              <SelectItem value="error">❌ Error</SelectItem>
              <SelectItem value="pending">⏳ Pendiente</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => handleDateFilter(e.target.value, endDate)}
            placeholder="Desde"
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => handleDateFilter(startDate, e.target.value)}
            placeholder="Hasta"
          />
        </div>
      </Card>

      {/* Botones de Exportación */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleExport('csv')}
          disabled={exporting !== null}
          variant="outline"
          className="gap-2"
        >
          {exporting === 'csv' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exportando CSV...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Descargar CSV
            </>
          )}
        </Button>

        <Button
          onClick={() => handleExport('json')}
          disabled={exporting !== null}
          variant="outline"
          className="gap-2"
        >
          {exporting === 'json' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exportando JSON...
            </>
          ) : (
            <>
              <FileJson className="h-4 w-4" />
              Descargar JSON
            </>
          )}
        </Button>
      </div>

      {/* Tabla de Logs */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">User ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Acción</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Servicio</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay logs
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const statusBadge = getStatusBadge(log.status);
                  return (
                    <tr key={log.id} className="hover:bg-slate-700">
                      <td className="px-6 py-4 text-sm font-medium">{log.user_id}</td>
                      <td className="px-6 py-4 text-sm">{log.action}</td>
                      <td className="px-6 py-4 text-sm">{log.service}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(log.created_at).toLocaleString()}
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