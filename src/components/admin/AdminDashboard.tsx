'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { supabaseClient } from '@/lib/supabase';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Database, 
  CreditCard, 
  Settings, 
  BarChart, 
  Shield, 
  LogOut,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Save,
  X,
  DollarSign,
  FilePlus,
  UserCheck,
  UserX
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAIRequests: number;
  totalDocuments: number;
  totalPayments: number;
  pendingPayments: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastSync: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  subscription: 'free' | 'pro' | 'premium';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string;
  aiRequests: number;
  documentsGenerated: number;
}

interface AIRequest {
  id: string;
  userId: string;
  userEmail: string;
  type: 'chat' | 'document' | 'irac';
  content: string;
  response: string;
  tokens: number;
  cost: number;
  status: 'completed' | 'failed' | 'pending';
  createdAt: string;
}

interface Document {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  title: string;
  content: string;
  status: 'generated' | 'failed' | 'pending';
  createdAt: string;
}

interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  plan: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: string;
  trackingNumber: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ai' | 'documents' | 'payments' | 'database'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [aiRequests, setAiRequests] = useState<AIRequest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Mock admin data
      const mockStats: AdminStats = {
        totalUsers: 15420,
        activeUsers: 8934,
        totalAIRequests: 124567,
        totalDocuments: 45678,
        totalPayments: 892,
        pendingPayments: 23,
        systemHealth: 'healthy',
        lastSync: new Date().toISOString()
      };

      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
          subscription: 'pro',
          status: 'active',
          createdAt: '2024-01-15',
          lastLogin: '2024-05-08',
          aiRequests: 156,
          documentsGenerated: 89
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'USER',
          subscription: 'premium',
          status: 'active',
          createdAt: '2024-02-20',
          lastLogin: '2024-05-07',
          aiRequests: 234,
          documentsGenerated: 156
        },
        {
          id: '3',
          name: 'Admin User',
          email: 'admin@jurisai.uz',
          role: 'ADMIN',
          subscription: 'premium',
          status: 'active',
          createdAt: '2023-12-01',
          lastLogin: '2024-05-08',
          aiRequests: 89,
          documentsGenerated: 45
        }
      ];

      const mockAIRequests: AIRequest[] = [
        {
          id: '1',
          userId: '1',
          userEmail: 'john@example.com',
          type: 'chat',
          content: 'Shartnoma haqida savol',
          response: 'Shartnoma tomonlarning o\'zaro kelishuvi...',
          tokens: 150,
          cost: 0.002,
          status: 'completed',
          createdAt: '2024-05-08T10:30:00Z'
        },
        {
          id: '2',
          userId: '2',
          userEmail: 'jane@example.com',
          type: 'document',
          content: 'Ariza yaratish',
          response: 'Ariza tayyorlandi',
          tokens: 300,
          cost: 0.004,
          status: 'completed',
          createdAt: '2024-05-08T09:15:00Z'
        }
      ];

      const mockDocuments: Document[] = [
        {
          id: '1',
          userId: '1',
          userEmail: 'john@example.com',
          type: 'ariza',
          title: 'Ishga qabul qilish arizasi',
          content: 'Ariza matni...',
          status: 'generated',
          createdAt: '2024-05-08T10:30:00Z'
        },
        {
          id: '2',
          userId: '2',
          userEmail: 'jane@example.com',
          type: 'shartnoma',
          title: 'Tijorat shartnomasi',
          content: 'Shartnoma matni...',
          status: 'generated',
          createdAt: '2024-05-08T09:15:00Z'
        }
      ];

      const mockPayments: Payment[] = [
        {
          id: '1',
          userId: '1',
          userEmail: 'john@example.com',
          plan: 'pro',
          amount: 100000,
          currency: 'UZS',
          status: 'completed',
          paymentMethod: 'bank-transfer',
          trackingNumber: 'TRK20240508001',
          createdAt: '2024-05-01T10:00:00Z'
        },
        {
          id: '2',
          userId: '2',
          userEmail: 'jane@example.com',
          plan: 'premium',
          amount: 250000,
          currency: 'UZS',
          status: 'pending',
          paymentMethod: 'manual',
          trackingNumber: 'TRK20240508002',
          createdAt: '2024-05-08T09:15:00Z'
        }
      ];

      setStats(mockStats);
      setUsers(mockUsers);
      setAiRequests(mockAIRequests);
      setDocuments(mockDocuments);
      setPayments(mockPayments);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      console.log(`User ${action}: ${userId}`);
      
      // Update user status
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          switch (action) {
            case 'suspend':
              return { ...user, status: 'suspended' as const };
            case 'activate':
              return { ...user, status: 'active' as const };
            case 'delete':
              return null; // Will be filtered out
            default:
              return user;
          }
        }
        return user;
      }).filter(Boolean) as User[];
      
      setUsers(updatedUsers);
      
      // Update stats
      if (stats) {
        const activeCount = updatedUsers.filter(u => u.status === 'active').length;
        setStats({
          ...stats,
          activeUsers: activeCount,
          totalUsers: updatedUsers.length
        });
      }
      
      console.log(`User ${action} completed for user ${userId}`);
    } catch (error) {
      console.error('Error handling user action:', error);
    }
  };

  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      console.log(`Payment ${action}: ${paymentId}`);
      
      // Update payment status
      const updatedPayments = payments.map(payment => {
        if (payment.id === paymentId) {
          return {
            ...payment,
            status: action === 'approve' ? 'completed' as const : 'cancelled' as const
          };
        }
        return payment;
      });
      
      setPayments(updatedPayments);
      
      // Update stats
      if (stats) {
        const pendingCount = updatedPayments.filter(p => p.status === 'pending').length;
        setStats({
          ...stats,
          pendingPayments: pendingCount
        });
      }
      
      console.log(`Payment ${action} completed for payment ${paymentId}`);
    } catch (error) {
      console.error('Error handling payment action:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await loadAdminData();
      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const exportData = {
        stats,
        users,
        aiRequests,
        documents,
        payments,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/signin';
  };

  const handleDatabaseSync = async () => {
    try {
      setLoading(true);
      // Simulate database sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Database synchronized successfully');
      
      if (stats) {
        setStats({
          ...stats,
          lastSync: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error syncing database:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseBackup = async () => {
    try {
      const backupData = {
        users,
        aiRequests,
        documents,
        payments,
        backupDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Database backup created successfully');
    } catch (error) {
      console.error('Error creating database backup:', error);
    }
  };

  const handleViewSchema = () => {
    const schema = {
      User: {
        id: "string",
        name: "string",
        email: "string",
        role: "USER|ADMIN",
        subscription: "free|pro|premium",
        status: "active|inactive|suspended",
        createdAt: "string",
        lastLogin: "string",
        aiRequests: "number",
        documentsGenerated: "number"
      },
      AIRequest: {
        id: "string",
        userId: "string",
        userEmail: "string",
        type: "chat|document|irac",
        content: "string",
        response: "string",
        tokens: "number",
        cost: "number",
        status: "completed|failed|pending",
        createdAt: "string"
      },
      Document: {
        id: "string",
        userId: "string",
        userEmail: "string",
        type: "string",
        title: "string",
        content: "string",
        status: "generated|failed|pending",
        createdAt: "string"
      },
      Payment: {
        id: "string",
        userId: "string",
        userEmail: "string",
        plan: "string",
        amount: "number",
        currency: "string",
        status: "pending|completed|cancelled",
        paymentMethod: "string",
        trackingNumber: "string",
        createdAt: "string"
      }
    };
    
    console.log('Database Schema:', schema);
    alert('Database schema logged to console. Check developer tools for details.');
  };

  const handleUserView = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      console.log('User details:', user);
      alert(`User Details:\n\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nSubscription: ${user.subscription}\nStatus: ${user.status}\nAI Requests: ${user.aiRequests}\nDocuments: ${user.documentsGenerated}\n\nCheck console for full details.`);
    }
  };

  const handleUserEdit = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      console.log('Edit user:', user);
      alert(`Edit functionality for user: ${user.name}\n\nThis would open an edit form in a real application.`);
    }
  };

  const handleUserDelete = (userId: string) => {
    try {
      console.log(`Delete user: ${userId}`);
      
      // Remove user from list
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      
      // Update stats
      if (stats) {
        const activeCount = updatedUsers.filter(u => u.status === 'active').length;
        setStats({
          ...stats,
          activeUsers: activeCount,
          totalUsers: updatedUsers.length
        });
      }
      
      console.log(`User deleted: ${userId}`);
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleUserCreate = () => {
    console.log('Create new user');
    alert('Create user functionality - This would open a user creation form in a real application.');
  };

  const handleAIRequestAction = async (requestId: string, action: 'retry' | 'cancel' | 'delete') => {
    try {
      console.log(`AI Request ${action}: ${requestId}`);
      
      // Update AI request
      const updatedRequests = aiRequests.map(request => {
        if (request.id === requestId) {
          switch (action) {
            case 'retry':
              return { ...request, status: 'pending' as const };
            case 'cancel':
              return { ...request, status: 'failed' as const };
            case 'delete':
              return null;
            default:
              return request;
          }
        }
        return request;
      }).filter(Boolean) as AIRequest[];
      
      setAiRequests(updatedRequests);
      console.log(`AI Request ${action} completed for request ${requestId}`);
    } catch (error) {
      console.error('Error handling AI request action:', error);
    }
  };

  const handleDocumentAction = async (documentId: string, action: 'regenerate' | 'download' | 'delete') => {
    try {
      console.log(`Document ${action}: ${documentId}`);
      
      if (action === 'download') {
        const doc = documents.find(d => d.id === documentId);
        if (doc) {
          const blob = new Blob([doc.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = `${doc.title}.txt`;
          window.document.body.appendChild(a);
          a.click();
          window.document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log(`Document downloaded: ${doc.title}`);
        }
      } else {
        // Update document status
        const updatedDocuments = documents.map(doc => {
          if (doc.id === documentId) {
            switch (action) {
              case 'regenerate':
                return { ...doc, status: 'pending' as const };
              case 'delete':
                return null;
              default:
                return doc;
            }
          }
          return doc;
        }).filter(Boolean) as Document[];
        
        setDocuments(updatedDocuments);
        console.log(`Document ${action} completed for document ${documentId}`);
      }
    } catch (error) {
      console.error('Error handling document action:', error);
    }
  };

  const handlePaymentRefund = async (paymentId: string) => {
    try {
      console.log(`Refund payment: ${paymentId}`);
      
      // Update payment status to refunded
      const updatedPayments = payments.map(payment => {
        if (payment.id === paymentId) {
          return { ...payment, status: 'cancelled' as const };
        }
        return payment;
      });
      
      setPayments(updatedPayments);
      
      // Update stats
      if (stats) {
        const pendingCount = updatedPayments.filter(p => p.status === 'pending').length;
        setStats({
          ...stats,
          pendingPayments: pendingCount
        });
      }
      
      console.log(`Payment refunded: ${paymentId}`);
      alert('Payment refunded successfully!');
    } catch (error) {
      console.error('Error refunding payment:', error);
    }
  };

  const handleDatabaseCleanup = async () => {
    try {
      setLoading(true);
      // Simulate database cleanup
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Database cleanup completed');
      alert('Database cleanup completed successfully!');
    } catch (error) {
      console.error('Error during database cleanup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseRestore = async () => {
    try {
      console.log('Database restore functionality');
      alert('Database restore functionality - This would allow restoring from backup files in a real application.');
    } catch (error) {
      console.error('Error during database restore:', error);
    }
  };

  const handleSystemMaintenance = async () => {
    try {
      setLoading(true);
      // Simulate system maintenance
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (stats) {
        setStats({
          ...stats,
          systemHealth: 'healthy' as const,
          lastSync: new Date().toISOString()
        });
      }
      
      console.log('System maintenance completed');
      alert('System maintenance completed successfully!');
    } catch (error) {
      console.error('Error during system maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': case 'generated': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': case 'failed': case 'cancelled': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter(payment => 
    filterStatus === 'all' || payment.status === filterStatus
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-green-600 text-sm">Active: {stats.activeUsers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">AI Requests</p>
                  <p className="text-2xl font-bold">{stats.totalAIRequests.toLocaleString()}</p>
                  <p className="text-blue-600 text-sm">Total tokens used</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Documents</p>
                  <p className="text-2xl font-bold">{stats.totalDocuments.toLocaleString()}</p>
                  <p className="text-green-600 text-sm">Generated</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Payments</p>
                  <p className="text-2xl font-bold">{stats.totalPayments}</p>
                  <p className="text-yellow-600 text-sm">Pending: {stats.pendingPayments}</p>
                </div>
                <CreditCard className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health */}
      {stats && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="font-semibold">System Health</span>
                <Badge className={getHealthColor(stats.systemHealth)}>
                  {stats.systemHealth.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Last sync: {new Date(stats.lastSync).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'overview' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'users' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'ai' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Requests</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'documents' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'payments' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'database' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database</span>
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleUserCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Subscription</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">AI Requests</th>
                    <th className="text-left p-2">Documents</th>
                    <th className="text-left p-2">Last Login</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-2">
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{user.subscription}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-2">{user.aiRequests}</td>
                      <td className="p-2">{user.documentsGenerated}</td>
                      <td className="p-2">{user.lastLogin}</td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleUserView(user.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleUserEdit(user.id)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.status === 'active' ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'suspend')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'activate')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUserDelete(user.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Requests Tab */}
      {activeTab === 'ai' && (
        <Card>
          <CardHeader>
            <CardTitle>AI Requests Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{request.type}</Badge>
                      <span className="font-semibold">{request.userEmail}</span>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm text-gray-600 mb-1">Content:</div>
                    <div className="text-sm">{request.content}</div>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm text-gray-600 mb-1">Response:</div>
                    <div className="text-sm">{request.response}</div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Tokens: {request.tokens}</span>
                    <span>Cost: ${request.cost.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    {request.status === 'failed' && (
                      <Button 
                        size="sm"
                        onClick={() => handleAIRequestAction(request.id, 'retry')}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    {request.status === 'pending' && (
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleAIRequestAction(request.id, 'cancel')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIRequestAction(request.id, 'delete')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle>Document Generation Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{doc.type}</Badge>
                      <span className="font-semibold">{doc.title}</span>
                      <span className="text-sm text-gray-600">{doc.userEmail}</span>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(doc.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm mb-2">{doc.content}</div>
                  <div className="flex items-center space-x-2">
                    {doc.status === 'failed' && (
                      <Button 
                        size="sm"
                        onClick={() => handleDocumentAction(doc.id, 'regenerate')}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Regenerate
                      </Button>
                    )}
                    {doc.status === 'generated' && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentAction(doc.id, 'download')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleDocumentAction(doc.id, 'delete')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment Requests Management</CardTitle>
              <div className="flex items-center space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4">
                      <span className="font-semibold">{payment.userEmail}</span>
                      <Badge variant="outline">{payment.plan}</Badge>
                      <span className="font-semibold">{payment.amount.toLocaleString()} {payment.currency}</span>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <div>Method: {payment.paymentMethod}</div>
                      <div>Tracking: {payment.trackingNumber}</div>
                    </div>
                    {payment.status === 'completed' && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handlePaymentRefund(payment.id)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Refund
                      </Button>
                    )}
                    {payment.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handlePaymentAction(payment.id, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => handlePaymentAction(payment.id, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <Card>
          <CardHeader>
            <CardTitle>Database Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Database Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Users Table</span>
                    <span className="font-semibold">{users.length} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Requests Table</span>
                    <span className="font-semibold">{aiRequests.length} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Documents Table</span>
                    <span className="font-semibold">{documents.length} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payments Table</span>
                    <span className="font-semibold">{payments.length} records</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Database Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={handleDatabaseSync} disabled={loading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {loading ? 'Syncing...' : 'Sync Database'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleDatabaseBackup}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Backup
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleDatabaseRestore}>
                    <Database className="w-4 h-4 mr-2" />
                    Restore Backup
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleDatabaseCleanup}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cleanup Database
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleViewSchema}>
                    <Database className="w-4 h-4 mr-2" />
                    View Schema
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleSystemMaintenance} disabled={loading}>
                    <Settings className="w-4 h-4 mr-2" />
                    {loading ? 'Maintenance...' : 'System Maintenance'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
