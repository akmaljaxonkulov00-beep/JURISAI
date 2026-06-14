'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/services/auth';
import { api } from '@/services/api';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Image, 
  Download, 
  Search,
  Filter,
  Eye,
  CreditCard,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  planPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  checkImage?: string;
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export default function PaymentAdmin() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRequest[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      window.location.href = '/dashboard';
      return;
    }
    loadPayments();
  }, [user]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, statusFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data
      const mockPayments: PaymentRequest[] = [
        {
          id: '1',
          userId: 'user_1',
          userName: 'Sarvar Karimov',
          userEmail: 'sarvar@example.com',
          planId: 'pro',
          planName: 'Pro',
          planPrice: 99000,
          status: 'pending',
          checkImage: '/api/placeholder/400/300',
          submittedAt: '2024-01-20T10:30:00Z'
        },
        {
          id: '2',
          userId: 'user_2',
          userName: 'Dilora Azimova',
          userEmail: 'dilora@example.com',
          planId: 'basic',
          planName: 'Basic',
          planPrice: 49000,
          status: 'pending',
          checkImage: '/api/placeholder/400/300',
          submittedAt: '2024-01-20T09:15:00Z'
        },
        {
          id: '3',
          userId: 'user_3',
          userName: 'Bekzod Toshmatov',
          userEmail: 'bekzod@example.com',
          planId: 'lifetime',
          planName: 'Lifetime',
          planPrice: 499000,
          status: 'approved',
          checkImage: '/api/placeholder/400/300',
          submittedAt: '2024-01-19T16:45:00Z',
          processedAt: '2024-01-19T17:30:00Z',
          processedBy: 'Admin'
        },
        {
          id: '4',
          userId: 'user_4',
          userName: 'Gulnora Soliyeva',
          userEmail: 'gulnora@example.com',
          planId: 'pro',
          planName: 'Pro',
          planPrice: 99000,
          status: 'rejected',
          checkImage: '/api/placeholder/400/300',
          submittedAt: '2024-01-19T14:20:00Z',
          processedAt: '2024-01-19T15:00:00Z',
          processedBy: 'Admin',
          notes: 'Chek aniq emas, summa mos kelmadi'
        }
      ];
      
      setPayments(mockPayments);
      setLoading(false);
    } catch (error) {
      console.error('Error loading payments:', error);
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(payment => 
        payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.planName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      setActionLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update payment status
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? {
              ...payment,
              status: 'approved' as const,
              processedAt: new Date().toISOString(),
              processedBy: user?.name || 'Admin'
            }
          : payment
      ));

      // Close modal if open
      setSelectedPayment(null);
      
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('To\'lovni tasdiqlashda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async (paymentId: string, notes?: string) => {
    try {
      setActionLoading(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update payment status
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? {
              ...payment,
              status: 'rejected' as const,
              processedAt: new Date().toISOString(),
              processedBy: user?.name || 'Admin',
              notes
            }
          : payment
      ));

      // Close modal if open
      setSelectedPayment(null);
      
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('To\'lovni rad etishda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Kutilmoqda</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Tasdiqlangan</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rad etilgan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/admin'}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">To'lovlar Admin Paneli</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              {filteredPayments.filter(p => p.status === 'pending').length} kutilmoqda
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Foydalanuvchi, email yoki tarif nomi bo'yicha qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  Barchasi ({payments.length})
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  size="sm"
                >
                  Kutilmoqda ({payments.filter(p => p.status === 'pending').length})
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                  size="sm"
                >
                  Tasdiqlangan ({payments.filter(p => p.status === 'approved').length})
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('rejected')}
                  size="sm"
                >
                  Rad etilgan ({payments.filter(p => p.status === 'rejected').length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment List */}
        <div className="grid gap-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{payment.userName}</h3>
                        <p className="text-sm text-gray-600">{payment.userEmail}</p>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Tarif:</span>
                        <span className="font-medium">{payment.planName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Summa:</span>
                        <span className="font-medium">{payment.planPrice.toLocaleString()} UZS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(payment.submittedAt).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                    </div>

                    {payment.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                        <span className="text-yellow-800">{payment.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPayment(payment)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ko'rish
                    </Button>
                    
                    {payment.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleApprovePayment(payment.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Tasdiqlash
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectPayment(payment.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Rad etish
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">To'lovlar topilmadi</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Berilgan filtrlar bo\'yicha to\'lovlar topilmadi' 
                  : 'Hozircha hech qanday to\'lov yo\'q'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Payment Detail Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>To'lov Tafsilotlari</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedPayment(null)}
                  >
                    Yopish
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Foydalanuvchi ma'lumotlari</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ism:</span>
                          <span className="font-medium">{selectedPayment.userName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{selectedPayment.userEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">User ID:</span>
                          <span className="font-medium">{selectedPayment.userId}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">To'lov ma'lumotlari</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tarif:</span>
                          <span className="font-medium">{selectedPayment.planName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Summa:</span>
                          <span className="font-medium">{selectedPayment.planPrice.toLocaleString()} UZS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <div>{getStatusBadge(selectedPayment.status)}</div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Yuborilgan vaqt:</span>
                          <span className="font-medium">
                            {new Date(selectedPayment.submittedAt).toLocaleString('uz-UZ')}
                          </span>
                        </div>
                        {selectedPayment.processedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Qayta ishlangan vaqt:</span>
                            <span className="font-medium">
                              {new Date(selectedPayment.processedAt).toLocaleString('uz-UZ')}
                            </span>
                          </div>
                        )}
                        {selectedPayment.processedBy && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Qayta ishlagan:</span>
                            <span className="font-medium">{selectedPayment.processedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Chek rasmi</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {selectedPayment.checkImage ? (
                          <img 
                            src={selectedPayment.checkImage} 
                            alt="Chek rasmi" 
                            className="w-full rounded-lg shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Image className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedPayment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprovePayment(selectedPayment.id)}
                          disabled={actionLoading}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Tasdiqlash
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            const notes = prompt('Rad etish sababini kiriting:');
                            if (notes) {
                              handleRejectPayment(selectedPayment.id, notes);
                            }
                          }}
                          disabled={actionLoading}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rad etish
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
