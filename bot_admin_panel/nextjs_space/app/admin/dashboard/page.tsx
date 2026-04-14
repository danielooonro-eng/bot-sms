'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, MessageSquare, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Metric {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

interface Activity {
  id: number;
  user_id: number;
  action: string;
  service: string;
  status: string;
  created_at: string;
}

interface ChartData {
  name: string;
  users?: number;
  messages?: number;
  revenue?: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const LIMIT = 10;

  useEffect(() => {
    fetchDashboardData();
    fetchActivities(0);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Obtener métricas
      const [usersRes, logsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/logs'),
      ]);

      const usersData = await usersRes.json();
      const logsData = await logsRes.json();

      const users = usersData.data || [];
      const logs = logsData.data || [];

      const totalUsers = users.length;
      const totalCredits = users.reduce((sum: number, u: any) => sum + (u.credits || 0), 0);
      const totalMessages = logs.length;
      const activeUsers = users.filter((u: any) => u.credits > 0).length;

      setMetrics([
        {
          label: 'Usuarios Totales',
          value: totalUsers,
          icon: <Users className="h-6 w-6" />,
          trend: '+5% este mes',
          color: 'text-blue-600',
        },
        {
          label: 'Créditos Totales',
          value: `$${totalCredits}`,
          icon: <TrendingUp className="h-6 w-6" />,
          trend: '+12% este mes',
          color: 'text-green-600',
        },
        {
          label: 'Transacciones',
          value: totalMessages,
          icon: <MessageSquare className="h-6 w-6" />,
          trend: '+8% este mes',
          color: 'text-purple-600',
        },
        {
          label: 'Usuarios Activos',
          value: activeUsers,
          icon: <Activity className="h-6 w-6" />,
          trend: `${activeUsers > 0 ? '+' : ''}${((activeUsers / totalUsers) * 100).toFixed(1)}%`,
          color: 'text-orange-600',
        },
      ]);

      // Datos para gráficos (simulados)
      setChartData([
        { name: 'Enero', users: 120, messages: 240, revenue: 2400 },
        { name: 'Febrero', users: 150, messages: 290, revenue: 2210 },
        { name: 'Marzo', users: 180, messages: 340, revenue: 2290 },
        { name: 'Abril', users: 220, messages: 380, revenue: 2000 },
        { name: 'Mayo', users: 250, messages: 420, revenue: 2181 },
        { name: 'Junio', users: 280, messages: 450, revenue: 2500 },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (newOffset: number) => {
    try {
      if (newOffset === 0) {
        setLoadingMore(false);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(
        `/api/dashboard/activities?limit=${LIMIT}&offset=${newOffset}`
      );
      const result = await response.json();

      if (result.success) {
        if (newOffset === 0) {
          setActivities(result.data || []);
        } else {
          setActivities([...activities, ...(result.data || [])]);
        }

        setOffset(newOffset + LIMIT);
        setHasMore((result.data || []).length === LIMIT);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchActivities(offset);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold mt-2">{metric.value}</p>
                {metric.trend && (
                  <p className="text-xs text-gray-500 mt-2">{metric.trend}</p>
                )}
              </div>
              <div className={`${metric.color} opacity-20 p-3 rounded-lg`}>
                {metric.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Usuarios por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transacciones por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="messages" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Actividades Recientes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Actividades Recientes</h3>

        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay actividades</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-700"
              >
                <div className="flex-1">
                  <p className="font-medium">Usuario #{activity.user_id}</p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">{activity.service}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="outline"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : (
                'Ver más actividades'
              )}
            </Button>
          </div>
        )}

        {!hasMore && activities.length > 0 && (
          <p className="text-center text-gray-500 text-sm mt-6">
            No hay más actividades
          </p>
        )}
      </Card>
    </div>
  );
}