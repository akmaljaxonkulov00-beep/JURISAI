'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  Users,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Database,
  Settings
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  todayUsers: number;
  todayRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  lastSync: string;
}

interface UserActivity {
  date: string;
  newUsers: number;
  activeUsers: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  transactions: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EnhancedAdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    todayUsers: 0,
    todayRevenue: 0,
    systemHealth: 'healthy',
    lastSync: new Date().toISOString()
  });
  
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'system'>('overview');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch real data from API
      const response = await fetch('/api/admin/analytics?period=month');
      
      if (response.ok) {
        const data = await response.json();
        
        // Process real data
        setStats({
          totalUsers: data.userAnalytics?.summary?.totalUsers || 0,
          activeUsers: data.userAnalytics?.summary?.activeUsers || 0,
          totalRevenue: data.revenueAnalytics?.summary?.totalRevenue || 0,
          totalTransactions: data.revenueAnalytics?.summary?.totalTransactions || 0,
          todayUsers: data.userAnalytics?.summary?.todayUsers || 0,
          todayRevenue: data.revenueAnalytics?.summary?.todayRevenue || 0,
          systemHealth: 'healthy',
          lastSync: new Date().toISOString()
        });

        // Process activity data
        if (data.userAnalytics?.userGrowth) {
          setUserActivity(data.userAnalytics.userGrowth.map((item: any) => ({
            date: new Date(item.date).toLocaleDateString(),
            newUsers: item.newUsers,
            activeUsers: item.activeUsers || 0
          })));
        }

        if (data.revenueAnalytics?.revenueData) {
          setRevenueData(data.revenueAnalytics.revenueData.map((item: any) => ({
            date: new Date(item.date).toLocaleDateString(),
            revenue: item.revenue || 0,
            transactions: item.transactionCount || 0
          })));
        }

      } else {
        throw new Error('Failed to fetch admin data');
      }

    } catch (err) {
      console.error('Admin data fetch error:', err);
      setError('Database connection failed. Showing demo data.');
      
      // Set fallback demo data
      setStats({
        totalUsers: 1247,
        activeUsers: 892,
        totalRevenue: 45890000,
        totalTransactions: 342,
        todayUsers: 23,
        todayRevenue: 1250000,
        systemHealth: 'warning',
        lastSync: new Date().toISOString()
      });

      // Demo activity data
      const demoActivity: UserActivity[] = [];
      const demoRevenue: RevenueData[] = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        demoActivity.push({
          date: date.toLocaleDateString(),
          newUsers: Math.floor(Math.random() * 15) + 5,
          activeUsers: Math.floor(Math.random() * 50) + 20
        });

        demoRevenue.push({
          date: date.toLocaleDateString(),
          revenue: Math.floor(Math.random() * 2000000) + 500000,
          transactions: Math.floor(Math.random() * 20) + 5
        });
      }

      setUserActivity(demoActivity);
      setRevenueData(demoRevenue);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Admin panel yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Tizim statistikasi va boshqaruv</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getHealthColor(stats.systemHealth)}`}>
              {getHealthIcon(stats.systemHealth)}
              <span className="font-medium">
                {stats.systemHealth === 'healthy' ? 'Healthy' : 
                 stats.systemHealth === 'warning' ? 'Warning' : 'Error'}
              </span>
            </div>
            <Button onClick={fetchAdminData} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Yangilash
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {['overview', 'users', 'revenue', 'system'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'overview' ? 'Umumiy ko\'rinish' :
             tab === 'users' ? 'Foydalanuvchilar' :
             tab === 'revenue' ? 'Daromad' : 'Tizim'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jami foydalanuvchilar</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-2 flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{stats.todayUsers} bugun
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Faol foydalanuvchilar</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary">
                  {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% faollik
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jami daromad</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalRevenue.toLocaleString('uz-UZ')} so'm
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="mt-2 flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{stats.todayRevenue.toLocaleString('uz-UZ')} bugun
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tranzaksiyalar</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
                <Database className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Oxirgi sinxronizatsiya: {new Date(stats.lastSync).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && userActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Foydalanuvchi faoliyati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <LineChart data={userActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newUsers" stroke="#8884d8" name="Yangi foydalanuvchilar" />
                <Line type="monotone" dataKey="activeUsers" stroke="#82ca9d" name="Faol foydalanuvchilar" />
              </LineChart>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && revenueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daromad statistikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Daromad (so'm)" />
                <Bar dataKey="transactions" fill="#82ca9d" name="Tranzaksiyalar" />
              </BarChart>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tizim sog'ligi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Database</span>
                  <Badge className={stats.systemHealth === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {stats.systemHealth === 'healthy' ? 'Connected' : 'Limited'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Status</span>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Sync</span>
                  <span className="text-sm text-gray-600">
                    {new Date(stats.lastSync).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tizim konfiguratsiyasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Environment Variables</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>NEXT_PUBLIC_SUPABASE_URL</span>
                      <Badge className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>GROQ_API_KEY</span>
                      <Badge className={process.env.GROQ_API_KEY ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {process.env.GROQ_API_KEY ? 'Set' : 'Missing'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
