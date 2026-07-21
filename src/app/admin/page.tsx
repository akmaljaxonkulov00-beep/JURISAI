'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
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

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  subscription?: {
    plan: {
      name: string;
      price: number;
    };
  };
}

interface RevenueAnalytics {
  revenueData: Array<{
    date: string;
    revenue: number;
    transactionCount: number;
  }>;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    todayRevenue: number;
    todayTransactions: number;
    weekRevenue: number;
    weekTransactions: number;
    monthRevenue: number;
    monthTransactions: number;
  };
  revenueByPlan: Array<{
    planName: string;
    planPrice: number;
    subscriptionCount: number;
    totalRevenue: number;
  }>;
}

interface UserAnalytics {
  userGrowth: Array<{
    date: string;
    newUsers: number;
  }>;
  activeSubscriptions: Array<{
    planName: string;
    planPrice: number;
    activeSubscriptions: number;
    uniqueUsers: number;
  }>;
  summary: {
    totalUsers: number;
    activeUsers: number;
    todayUsers: number;
    weekUsers: number;
    monthUsers: number;
  };
  lastUsers: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    status: string;
    createdAt: string;
    subscription: {
      planName: string;
      status: string;
      currentPeriodEnd: string;
    } | null;
  }>;
  userRoles: Array<{
    role: string;
    count: number;
  }>;
}

interface AIUsageAnalytics {
  aiUsageOverTime: Array<{
    date: string;
    legalChatRequests: number;
    iracAnalysisRequests: number;
    documentGenerationRequests: number;
    lawSearchRequests: number;
    totalRequests: number;
  }>;
  mostUsedFeatures: Array<{
    feature: string;
    totalUsage: number;
    uniqueUsers: number;
  }>;
  topUsers: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    totalAIUsage: number;
    featuresUsed: number;
  }>;
  summary: {
    totalAIUsage: number;
    totalRequests: number;
    todayAIUsage: number;
    todayRequests: number;
    weekAIUsage: number;
    weekRequests: number;
    monthAIUsage: number;
    monthRequests: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [aiUsageAnalytics, setAIUsageAnalytics] = useState<AIUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'revenue' | 'users' | 'ai-usage'>('revenue');

  useEffect(() => {
    console.log('Admin page - user:', user);
    
    // For now, allow access without admin role check
    if (!user) {
      console.log('No user, but allowing access for testing');
      setLoading(false);
      return;
    }

    // Temporarily disable admin role check
    // if (!isAdmin()) {
    //   window.location.href = '/dashboard';
    //   return;
    // }

    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
     console.log('Fetching analytics data...');
      
      console.log('No analytics endpoints configured yet. Admin stats will show zeros until Supabase is connected.');
      
      // Empty data (no demo data)
      setRevenueAnalytics({
        revenueData: [],
        summary: {
          totalRevenue: 0,
          totalTransactions: 0,
          todayRevenue: 0,
          todayTransactions: 0,
          weekRevenue: 0,
          weekTransactions: 0,
          monthRevenue: 0,
          monthTransactions: 0,
        },
        revenueByPlan: [],
      });
      
      setUserAnalytics({
        userGrowth: [],
        activeSubscriptions: [],
        summary: {
          totalUsers: 0,
          activeUsers: 0,
          todayUsers: 0,
          weekUsers: 0,
          monthUsers: 0,
        },
        lastUsers: [],
        userRoles: [],
      });
      
      setAIUsageAnalytics({
        aiUsageOverTime: [],
        mostUsedFeatures: [],
        topUsers: [],
        summary: {
          totalAIUsage: 0,
          totalRequests: 0,
          todayAIUsage: 0,
          todayRequests: 0,
          weekAIUsage: 0,
          weekRequests: 0,
          monthAIUsage: 0,
          monthRequests: 0,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex space-x-4">
              <Button
                variant={activeTab === 'revenue' ? 'default' : 'outline'}
                onClick={() => setActiveTab('revenue')}
              >
                Moliya
              </Button>
              <Button
                variant={activeTab === 'users' ? 'default' : 'outline'}
                onClick={() => setActiveTab('users')}
              >
                Foydalanuvchilar
              </Button>
              <Button
                variant={activeTab === 'ai-usage' ? 'default' : 'outline'}
                onClick={() => setActiveTab('ai-usage')}
              >
                AI Faolligi
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin/users'}
              >
                Boshqaruv
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'revenue' && revenueAnalytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {revenueAnalytics.summary.totalRevenue.toLocaleString('uz-UZ')} so'm
                  </div>
                  <div className="text-sm text-gray-600">Jami daromad</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">
                    {revenueAnalytics.summary.todayRevenue.toLocaleString('uz-UZ')} so'm
                  </div>
                  <div className="text-sm text-gray-600">Bugungi daromad</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {revenueAnalytics.summary.totalTransactions}
                  </div>
                  <div className="text-sm text-gray-600">Jami tranzaksiyalar</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {revenueAnalytics.summary.monthRevenue.toLocaleString('uz-UZ')} so'm
                  </div>
                  <div className="text-sm text-gray-600">Oylik daromad</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daromad dinamikasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart width={500} height={300} data={revenueAnalytics.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                  </LineChart>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daromad bo'yicha rejalarni taqsimlash</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart width={400} height={300}>
                    <Pie
                      data={revenueAnalytics.revenueByPlan}
                      cx={200}
                      cy={150}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                    >
                      {revenueAnalytics.revenueByPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && userAnalytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">{userAnalytics.summary.totalUsers}</div>
                  <div className="text-sm text-gray-600">Jami foydalanuvchilar</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">{userAnalytics.summary.activeUsers}</div>
                  <div className="text-sm text-gray-600">Faol foydalanuvchilar</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">{userAnalytics.summary.todayUsers}</div>
                  <div className="text-sm text-gray-600">Bugungi foydalanuvchilar</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">{userAnalytics.summary.monthUsers}</div>
                  <div className="text-sm text-gray-600">Oylik foydalanuvchilar</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Foydalanuvchi o'sishi</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart width={500} height={300} data={userAnalytics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="newUsers" stroke="#82ca9d" />
                  </LineChart>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Faol obunalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart width={400} height={300}>
                    <Pie
                      data={userAnalytics.activeSubscriptions}
                      cx={200}
                      cy={150}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="activeSubscriptions"
                    >
                      {userAnalytics.activeSubscriptions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Oxirgi 10 ta foydalanuvchi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userAnalytics.lastUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName || 'Noma\'lum'}
                        </div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'ACTIVE' ? 'Faol' : 'Faol emas'}
                        </span>
                        {user.subscription && (
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {user.subscription.planName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ai-usage' && aiUsageAnalytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">{aiUsageAnalytics.summary.totalAIUsage}</div>
                  <div className="text-sm text-gray-600">Jami AI so'rovlar</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">{aiUsageAnalytics.summary.todayAIUsage}</div>
                  <div className="text-sm text-gray-600">Bugungi AI so'rovlar</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">{aiUsageAnalytics.summary.weekAIUsage}</div>
                  <div className="text-sm text-gray-600">Haftalik AI so'rovlar</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">{aiUsageAnalytics.summary.monthAIUsage}</div>
                  <div className="text-sm text-gray-600">Oylik AI so'rovlar</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI foydalanishi dinamikasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart width={500} height={300} data={aiUsageAnalytics.aiUsageOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalRequests" stroke="#8884d8" />
                  </LineChart>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Eng ko'p ishlatilgan xususiyatlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChart width={400} height={300}>
                    <Pie
                      data={aiUsageAnalytics.mostUsedFeatures}
                      cx={200}
                      cy={150}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalUsage"
                    >
                      {aiUsageAnalytics.mostUsedFeatures.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Eng faol AI foydalanuvchilari</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiUsageAnalytics.topUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName || 'Noma\'lum'}
                        </div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {user.totalAIUsage} so'rov
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          {user.featuresUsed} xususiyat
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
