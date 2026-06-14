'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, DollarSign, Activity, Calendar, Download, Filter } from 'lucide-react';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  documents: {
    generated: number;
    templates: number;
    popular: string[];
  };
  ai: {
    requests: number;
    success_rate: number;
    avg_response_time: number;
  };
  subscriptions: {
    free: number;
    pro: number;
    premium: number;
    churn_rate: number;
  };
}

interface ChartData {
  name: string;
  value: number;
  growth?: number;
}

interface TimeSeriesData {
  date: string;
  users: number;
  revenue: number;
  documents: number;
  ai_requests: number;
}

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'ai' | 'documents'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Mock analytics data
      const mockData: AnalyticsData = {
        users: {
          total: 15420,
          active: 8934,
          new: 1247,
          growth: 12.5
        },
        revenue: {
          total: 2847500,
          monthly: 892000,
          growth: 18.3
        },
        documents: {
          generated: 45678,
          templates: 156,
          popular: ['Shartnoma', 'Ariza', 'Vasiyatnoma', 'Da\'vo arizasi', 'Vakolatnoma']
        },
        ai: {
          requests: 124567,
          success_rate: 94.3,
          avg_response_time: 2.4
        },
        subscriptions: {
          free: 8934,
          pro: 5234,
          premium: 1252,
          churn_rate: 3.2
        }
      };

      // Mock chart data
      const mockChartData: ChartData[] = [
        { name: 'Foydalanuvchilar', value: mockData.users.total, growth: 12.5 },
        { name: 'Daromad', value: mockData.revenue.monthly, growth: 18.3 },
        { name: 'Hujjatlar', value: mockData.documents.generated, growth: 24.1 },
        { name: 'AI So\'rovlar', value: mockData.ai.requests, growth: 45.7 }
      ];

      // Mock time series data
      const mockTimeSeriesData: TimeSeriesData[] = [
        { date: '2024-04-01', users: 12500, revenue: 720000, documents: 38000, ai_requests: 95000 },
        { date: '2024-04-08', users: 12800, revenue: 745000, documents: 39500, ai_requests: 98000 },
        { date: '2024-04-15', users: 13200, revenue: 780000, documents: 41000, ai_requests: 102000 },
        { date: '2024-04-22', users: 13600, revenue: 810000, documents: 42500, ai_requests: 108000 },
        { date: '2024-04-29', users: 14100, revenue: 835000, documents: 44000, ai_requests: 115000 },
        { date: '2024-05-06', users: 14800, revenue: 865000, documents: 45500, ai_requests: 121000 },
        { date: '2024-05-08', users: 15420, revenue: 892000, documents: 45678, ai_requests: 124567 }
      ];

      setAnalyticsData(mockData);
      setChartData(mockChartData);
      setTimeSeriesData(mockTimeSeriesData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Export functionality
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Analitika ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analitika Dashboard</h1>
        <p className="text-gray-600">Platforma statistikasi va foydalanuvchi analitikasi</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex gap-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">7 kun</option>
            <option value="30d">30 kun</option>
            <option value="90d">90 kun</option>
            <option value="1y">1 yil</option>
          </select>
        </div>
        
        <Button onClick={exportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Jami foydalanuvchilar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.users.total.toLocaleString()}
                </p>
                <p className="text-green-600 text-sm">+{analyticsData?.users.growth}%</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Oylik daromad</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.revenue.monthly.toLocaleString()} so'm
                </p>
                <p className="text-green-600 text-sm">+{analyticsData?.revenue.growth}%</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Yaratilgan hujjatlar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.documents.generated.toLocaleString()}
                </p>
                <p className="text-green-600 text-sm">+24.1%</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">AI so'rovlar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.ai.requests.toLocaleString()}
                </p>
                <p className="text-green-600 text-sm">+45.7%</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Foydalanuvchilar va Daromad Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Foydalanuvchilar" />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Daromad (so'm)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Obuna Turlari</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Bepul', value: analyticsData?.subscriptions.free },
                    { name: 'Pro', value: analyticsData?.subscriptions.pro },
                    { name: 'Premium', value: analyticsData?.subscriptions.premium }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {analyticsData && [
                    { name: 'Bepul', value: analyticsData.subscriptions.free },
                    { name: 'Pro', value: analyticsData.subscriptions.pro },
                    { name: 'Premium', value: analyticsData.subscriptions.premium }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Xizmatlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jami so'rovlar</span>
                <span className="font-semibold">{analyticsData?.ai.requests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Muvaffaqiyat foizi</span>
                <span className="font-semibold text-green-600">{analyticsData?.ai.success_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">O'rtacha javob vaqti</span>
                <span className="font-semibold">{analyticsData?.ai.avg_response_time}s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hujjatlar Statistikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Yaratilgan hujjatlar</span>
                <span className="font-semibold">{analyticsData?.documents.generated.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shablonlar soni</span>
                <span className="font-semibold">{analyticsData?.documents.templates}</span>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Eng mashhur:</p>
                <div className="flex flex-wrap gap-1">
                  {analyticsData?.documents.popular.slice(0, 3).map((doc, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Obuna Statistikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Churn rate</span>
                <span className="font-semibold text-red-600">{analyticsData?.subscriptions.churn_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bepul</span>
                <span className="font-semibold">{analyticsData?.subscriptions.free.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pro</span>
                <span className="font-semibold">{analyticsData?.subscriptions.pro.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Premium</span>
                <span className="font-semibold">{analyticsData?.subscriptions.premium.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
