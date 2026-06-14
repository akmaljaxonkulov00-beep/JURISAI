'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/app/providers';
import { supabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Search, 
  Filter,
  Plus,
  Eye,
  Download,
  Upload,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Award,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  DollarSign,
  Activity,
  ArrowLeft,
  Settings,
  LogOut
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  caseType: string;
  status: 'active' | 'pending' | 'completed';
  createdAt: string;
  lastContact: string;
  totalCases: number;
  revenue: number;
}

interface ClientRequest {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  category: string;
}

interface DocumentAnalysis {
  id: string;
  documentName: string;
  documentType: string;
  analysisResult: {
    summary: string;
    keyPoints: string[];
    risks: string[];
    recommendations: string[];
    legalReferences: string[];
  };
  confidence: number;
  createdAt: string;
  status: 'analyzing' | 'completed' | 'error';
}

interface LawyerStats {
  totalClients: number;
  activeCases: number;
  pendingRequests: number;
  completedCases: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageResponseTime: number;
  clientSatisfaction: number;
}

export default function LawyerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'requests' | 'documents'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([]);
  const [stats, setStats] = useState<LawyerStats>({
    totalClients: 0,
    activeCases: 0,
    pendingRequests: 0,
    completedCases: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageResponseTime: 0,
    clientSatisfaction: 0
  });

  useEffect(() => {
    if (user) {
      loadLawyerData();
    }
  }, [user]);

  const loadLawyerData = async () => {
    try {
      setLoading(true);
      
      // Get lawyer profile
      const { data: lawyerProfile } = await supabaseClient
        .from('lawyers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!lawyerProfile) {
        router.push('/lawyer-login');
        return;
      }

      // Load mock data for now (in production, fetch from API)
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'Ali Karimov',
          email: 'ali@example.com',
          phone: '+998 90 123 45 67',
          caseType: 'Jinoyat huquqi',
          status: 'active',
          createdAt: '2024-03-15',
          lastContact: '2024-03-20',
          totalCases: 3,
          revenue: 1500000
        },
        {
          id: '2',
          name: 'Dilora Toshmatova',
          email: 'dilora@example.com',
          phone: '+998 91 234 56 78',
          caseType: 'Oilaviy huquq',
          status: 'pending',
          createdAt: '2024-03-18',
          lastContact: '2024-03-19',
          totalCases: 1,
          revenue: 500000
        }
      ];

      const mockRequests: ClientRequest[] = [
        {
          id: '1',
          clientId: '1',
          clientName: 'Ali Karimov',
          subject: 'Shartnoma tahlili',
          description: 'Sotib olish shartnomasini huquqiy jihatdan tekshirish kerak',
          urgency: 'high',
          status: 'pending',
          createdAt: '2024-03-20',
          category: 'Shartnoma huquqi'
        },
        {
          id: '2',
          clientId: '2',
          clientName: 'Dilora Toshmatova',
          subject: 'Ajrim masalasi',
          description: 'Nikohdan ajralish bo\'yicha maslahat kerak',
          urgency: 'medium',
          status: 'in_progress',
          createdAt: '2024-03-19',
          category: 'Oilaviy huquq'
        }
      ];

      const mockDocuments: DocumentAnalysis[] = [
        {
          id: '1',
          documentName: 'Sotib olish shartnomasi.pdf',
          documentType: 'Shartnoma',
          analysisResult: {
            summary: 'Bu xususiy mulk sotib olish shartnomasi...',
            keyPoints: ['Tomonlar: sotuvchi va xaridor', 'Miqdor: 150 million so\'m', 'To\'lov shartlari'],
            risks: ['Shartnoma ro\'yxatdan o\'tilmagan', 'Garov mavjud emas'],
            recommendations: ['Notarial tasdiqlash kerak', 'Garov qo\'shish maslahat beriladi'],
            legalReferences: ['Fuqarolik kodeksi 375-moddasi', 'Mulk kodeksi 15-moddasi']
          },
          confidence: 95,
          createdAt: '2024-03-20',
          status: 'completed'
        }
      ];

      setClients(mockClients);
      setRequests(mockRequests);
      setDocuments(mockDocuments);
      
      setStats({
        totalClients: mockClients.length,
        activeCases: mockClients.filter(c => c.status === 'active').length,
        pendingRequests: mockRequests.filter(r => r.status === 'pending').length,
        completedCases: mockClients.filter(c => c.status === 'completed').length,
        totalRevenue: mockClients.reduce((sum, c) => sum + c.revenue, 0),
        monthlyRevenue: 800000,
        averageResponseTime: 2.5,
        clientSatisfaction: 4.8
      });

    } catch (error) {
      console.error('Lawyer data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jami mijozlar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faol ishlar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCases}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kutilayotgan so\'rovlar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oylik daromad</p>
                <p className="text-2xl font-bold text-gray-900">{stats.monthlyRevenue.toLocaleString()} so\'m</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>So\'nggi so\'rovlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{request.clientName}</p>
                    <p className="text-sm text-gray-600">{request.subject}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getUrgencyColor(request.urgency)}>
                      {request.urgency === 'high' ? 'Yuqori' : request.urgency === 'medium' ? 'O\'rta' : 'Past'}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>So\'nggi hujjatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.documentName}</p>
                    <p className="text-sm text-gray-600">{doc.documentType}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={doc.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {doc.status === 'completed' ? 'Tahlil qilindi' : 'Tahlil qilinmoqda'}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mijozlar bazasi</h2>
        <div className="flex space-x-2">
          <Input
            placeholder="Mijozlarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yangi mijoz
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-600">{client.caseType}</p>
                </div>
                <Badge className={getStatusColor(client.status)}>
                  {client.status === 'active' ? 'Faol' : client.status === 'pending' ? 'Kutilmoqda' : 'Tugallangan'}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {client.email}
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {client.phone}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {client.createdAt}
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {client.revenue.toLocaleString()} so\'m
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  Profil
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Xabar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mijoz so\'rovlari</h2>
        <div className="flex space-x-2">
          <Input
            placeholder="So\'rovlarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtrlash
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{request.subject}</h3>
                    <Badge className={getUrgencyColor(request.urgency)}>
                      {request.urgency === 'high' ? 'Yuqori' : request.urgency === 'medium' ? 'O\'rta' : 'Past'}
                    </Badge>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status === 'pending' ? 'Kutilmoqda' : request.status === 'in_progress' ? 'Jarayonda' : 'Tugallangan'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Mijoz: {request.clientName}</p>
                  <p className="text-sm text-gray-600 mb-1">Kategoriya: {request.category}</p>
                  <p className="text-gray-700">{request.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{request.createdAt}</p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Batafsil
                  </Button>
                  {request.status === 'pending' && (
                    <Button size="sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Qabul qilish
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Hujjatlar tahlili</h2>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Yangi hujjat yuklash
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{doc.documentName}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={doc.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                    {doc.status === 'completed' ? 'Tahlil qilindi' : 'Tahlil qilinmoqda'}
                  </Badge>
                  <span className="text-sm text-gray-600">{doc.confidence}% ishonch</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Xulosa</h4>
                  <p className="text-sm text-gray-600">{doc.analysisResult.summary}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Asosiy nuqtalar</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {doc.analysisResult.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Xavflar</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {doc.analysisResult.risks.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tavsiyalar</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {doc.analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Hisobot yuklash
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="w-4 h-4 mr-1" />
                    To\'liq tahlil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Advokat Dashboard</h1>
                <p className="text-sm text-gray-600">Boshqaruv markazi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Sozlamalar
              </Button>
              <Button variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Umumiy ko\'rinish', icon: BarChart3 },
              { id: 'clients', label: 'Mijozlar', icon: Users },
              { id: 'requests', label: 'So\'rovlar', icon: MessageSquare },
              { id: 'documents', label: 'Hujjatlar', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'clients' && renderClients()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'documents' && renderDocuments()}
      </div>
    </div>
  );
}
