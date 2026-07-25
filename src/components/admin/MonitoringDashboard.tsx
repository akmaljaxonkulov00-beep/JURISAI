'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Activity, Users, CreditCard, DollarSign, RefreshCw } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface MonitoringData {
  users: { date: string; count: number }[];
  tokens: { date: string; count: number }[];
  revenue: { date: string; amount: number }[];
  logins: { date: string; count: number }[];
  totals: {
    totalUsers: number;
    totalTokens: number;
    totalRevenue: number;
    totalLogins: number;
  };
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${period}&type=all`);
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        
        // Build chart data from login activities
        const loginMap: Record<string, number> = {};
        (d.loginActivities || []).forEach((l: any) => {
          const date = new Date(l.created_at).toLocaleDateString('uz-UZ');
          loginMap[date] = (loginMap[date] || 0) + 1;
        });

        // Build token data from usage_logs
        const tokenMap: Record<string, number> = {};
        (d.tokenUsages || []).forEach((t: any) => {
          const date = new Date(t.created_at).toLocaleDateString('uz-UZ');
          tokenMap[date] = (tokenMap[date] || 0) + (t.tokens || 0);
        });

        // Build revenue data from payments
        const revenueMap: Record<string, number> = {};
        (d.paymentRequests || []).forEach((p: any) => {
          if (p.status === 'approved') {
            const date = new Date(p.created_at).toLocaleDateString('uz-UZ');
            revenueMap[date] = (revenueMap[date] || 0) + (p.amount || 0);
          }
        });

        // Build user data from registered_users
        const userMap: Record<string, number> = {};
        (d.users || []).forEach((u: any) => {
          const date = u.created_at ? new Date(u.created_at).toLocaleDateString('uz-UZ') : '';
          if (date) userMap[date] = (userMap[date] || 0) + 1;
        });

        // Convert to arrays
        const allDates = [...new Set([...Object.keys(loginMap), ...Object.keys(tokenMap), ...Object.keys(revenueMap), ...Object.keys(userMap)])].sort();
        
        setData({
          users: allDates.map(date => ({ date, count: userMap[date] || 0 })),
          tokens: allDates.map(date => ({ date, count: tokenMap[date] || 0 })),
          revenue: allDates.map(date => ({ date, amount: revenueMap[date] || 0 })),
          logins: allDates.map(date => ({ date, count: loginMap[date] || 0 })),
          totals: {
            totalUsers: d.totalUsers || 0,
            totalTokens: d.tokensUsed || 0,
            totalRevenue: d.totalRevenue || 0,
            totalLogins: d.recentLogins || 0,
          },
        });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [period]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pieData = data ? [
    { name: 'Foydalanuvchilar', value: data.totals.totalUsers },
    { name: 'Tokenlar (x100)', value: Math.round(data.totals.totalTokens / 100) },
    { name: 'Daromad (x1000 UZS)', value: Math.round(data.totals.totalRevenue / 1000) },
    { name: 'Kirishlar', value: data.totals.totalLogins },
  ].filter(d => d.value > 0) : [];

  const hasChartData = pieData.length > 0;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[7, 30, 90].map(d => (
          <Button key={d} variant={period === d ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(d)}>
            {d} kun
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={loadData} className="ml-auto">
          <RefreshCw size={14} className="mr-1" /> Yangilash
        </Button>
      </div>

      {/* Totals */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-default rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Foydalanuvchilar</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">{data.totals.totalUsers}</p>
                </div>
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-default rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Tokenlar</p>
                  <p className="text-xl font-bold text-green-600 mt-1">{data.totals.totalTokens.toLocaleString()}</p>
                </div>
                <Activity className="w-6 h-6 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-default rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Daromad</p>
                  <p className="text-xl font-bold text-orange-600 mt-1">{data.totals.totalRevenue.toLocaleString()} UZS</p>
                </div>
                <DollarSign className="w-6 h-6 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-default rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Kirishlar</p>
                  <p className="text-xl font-bold text-purple-600 mt-1">{data.totals.totalLogins}</p>
                </div>
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User registrations */}
        <Card className="card-default rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-gray-800 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Foydalanuvchilar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.users || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Token usage */}
        <Card className="card-default rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-gray-800 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" /> Token ishlatilishi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.tokens || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="card-default rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-gray-800 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" /> Daromad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Logins */}
        <Card className="card-default rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-gray-800 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" /> Kirish faolligi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.logins || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie chart overview */}
      {hasChartData && (
        <Card className="card-default rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-gray-800 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Umumiy ko'rinish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
