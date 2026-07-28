'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Zap, Clock, CheckCircle, AlertTriangle, Loader2, ExternalLink, Search, Filter, ArrowUpDown } from 'lucide-react';

interface PaymentRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  receipt_url?: string;
  payment_method?: string;
  notes?: string;
}

interface UsageLog {
  id: string;
  action: string;
  tokens: number;
  created_at: string;
  email?: string;
  metadata?: any;
}

interface UserDetails {
  profile: Record<string, any> | null;
  payments: PaymentRequest[];
  usageLogs: UsageLog[];
  loginActivity: {
    lastLogin: string | null;
    loginCount: number;
    registeredAt: string;
  };
  paymentStats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    totalAmount: number;
  };
  usageStats: {
    total: number;
    chatQueries: number;
    documents: number;
    analysis: number;
    totalTokens: number;
  };
}

interface UserProfileModalProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
  onClose: () => void;
  isOpen?: boolean;
  user?: any;
  paymentHistory?: any[];
  tokenHistory?: any[];
  loginHistory?: any[];
}

export default function UserProfileModal({ userId, userName, userEmail, onClose, isOpen, user, paymentHistory, tokenHistory, loginHistory }: UserProfileModalProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'usage' | 'activity'>('overview');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
  const [rejectPaymentId, setRejectPaymentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (userId) fetchDetails();
  }, [userId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/details?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Ma\'lumotlarni yuklashda xatolik');
      const data = await res.json();
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('uz-UZ', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />Tasdiqlangan</span>;
      case 'pending': return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium"><Clock className="w-3 h-3" />Kutilmoqda</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium"><AlertTriangle className="w-3 h-3" />Bekor qilingan</span>;
      default: return <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-full text-xs">{status}</span>;
    }
  };

  const handleApprove = async (paymentId: string) => {
    setProcessingPayments(prev => new Set(prev).add(paymentId));
    try {
      const res = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || 'Tasdiqlashda xatolik');
      await fetchDetails();
    } catch (err: any) {
      alert(err?.message || 'To\'lovni tasdiqlashda xatolik yuz berdi');
    } finally {
      setProcessingPayments(prev => { const next = new Set(prev); next.delete(paymentId); return next; });
    }
  };

  const handleReject = async (paymentId: string) => {
    setProcessingPayments(prev => new Set(prev).add(paymentId));
    try {
      const res = await fetch('/api/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, notes: rejectReason || undefined }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || 'Rad etishda xatolik');
      setRejectPaymentId(null);
      setRejectReason('');
      await fetchDetails();
    } catch (err: any) {
      alert(err?.message || 'To\'lovni rad etishda xatolik yuz berdi');
    } finally {
      setProcessingPayments(prev => { const next = new Set(prev); next.delete(paymentId); return next; });
    }
  };

  // If not open, render nothing
  if (isOpen === false) return null;

  const filteredPayments = (details?.payments || []).filter(p =>
    paymentFilter === 'all' ? true : p.status === paymentFilter
  ) || [];

  // ── Close on Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-4 sm:pt-10 pb-10">
      <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {(userName || userEmail || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">{userName || 'Foydalanuvchi'}</h2>
              <p className="text-sm text-gray-600 dark:text-zinc-400">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 px-6 bg-white dark:bg-zinc-900">
          {[
            { id: 'overview', label: 'Umumiy' },
            { id: 'payments', label: `To'lovlar (${details?.paymentStats.total || 0})` },
            { id: 'usage', label: `AI So'rovlar (${details?.usageStats.total || 0})` },
            { id: 'activity', label: 'Faollik' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-white dark:bg-zinc-900">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button onClick={fetchDetails} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Qayta urinish
              </button>
            </div>
          ) : !details ? (
            <div className="text-center py-16 text-gray-500 dark:text-zinc-400">Ma'lumot topilmadi</div>
          ) : (
            <>
              {/* ── Overview Tab ── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">To'lovlar</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{details.paymentStats.total}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                        {details.paymentStats.approved} tasdiqlangan · {details.paymentStats.totalAmount.toLocaleString('uz-UZ')} so'm
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">AI So'rovlar</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{details.usageStats.total}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                        {details.usageStats.chatQueries} chat · {details.usageStats.documents} hujjat
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">Faollik</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{details.loginActivity.loginCount || 0}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                        Oxirgi kirish: {formatDate(details.loginActivity.lastLogin)}
                      </p>
                    </div>
                  </div>

                  {/* User Profile Info */}
                  {details.profile && (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3">Profil ma'lumotlari</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {Object.entries({
                          'ID': details.profile.id?.slice(0, 12) + '...' || '—',
                          'Rol': details.profile.role || '—',
                          'Holat': details.profile.blocked ? 'Bloklangan' : 'Faol',
                          'Ro\'yxatdan o\'tgan': formatDate(details.profile.created_at),
                          'Telefon': details.profile.phone || '—',
                          'Obuna': details.profile.subscription_plan || 'Bepul',
                        }).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-gray-500 dark:text-zinc-500 text-xs block">{key}</span>
                            <span className="text-gray-900 dark:text-zinc-100 font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profile raw data (if profile is null) */}
                  {!details.profile && (
                    <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                      <p>Profil ma'lumotlari database'da topilmadi</p>
                      <p className="text-xs mt-1">Foydalanuvchi auth.users da mavjud, lekin registered_users jadvalida yo'q</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Payments Tab ── */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-zinc-400">
                        Jami: {details.paymentStats.total} ta · {details.paymentStats.totalAmount.toLocaleString('uz-UZ')} so'm
                      </span>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
                      {(['all', 'approved', 'pending', 'rejected'] as const).map(f => (
                        <button key={f} onClick={() => setPaymentFilter(f)}
                          className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                            paymentFilter === f
                              ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm font-medium'
                              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
                          }`}
                        >
                          {f === 'all' ? 'Barchasi' : f === 'approved' ? 'Tasdiqlangan' : f === 'pending' ? 'Kutilayotgan' : 'Bekor qilingan'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredPayments.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 dark:text-zinc-500">
                      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>To'lovlar topilmadi</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPayments.map(p => {
                        const isProcessing = processingPayments.has(p.id);
                        const isPending = p.status === 'pending';
                        return (
                          <div key={p.id} className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {p.amount.toLocaleString('uz-UZ').slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-zinc-100 text-sm">
                                    {p.amount.toLocaleString('uz-UZ')} so'm
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {getStatusBadge(p.status)}
                                    <span className="text-xs text-gray-400 dark:text-zinc-500">
                                      {formatDate(p.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {p.receipt_url && (
                                  <a href={p.receipt_url} target="_blank" rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Chekni ko'rish">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                {p.notes && (
                                  <span className="text-xs text-gray-400 dark:text-zinc-500 max-w-[100px] truncate" title={p.notes}>
                                    {p.notes}
                                  </span>
                                )}
                                {/* Approve / Reject buttons for pending payments */}
                                {isPending && (
                                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                                    <button
                                      onClick={() => handleApprove(p.id)}
                                      disabled={isProcessing}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                      {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                      Tasdiqlash
                                    </button>
                                    <button
                                      onClick={() => { setRejectPaymentId(p.id); setRejectReason(''); }}
                                      disabled={isProcessing}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                      Rad etish
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Reject reason input (shown when reject is clicked) */}
                            {rejectPaymentId === p.id && (
                              <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                                <input
                                  type="text"
                                  value={rejectReason}
                                  onChange={e => setRejectReason(e.target.value)}
                                  placeholder="Rad etish sababi (ixtiyoriy)"
                                  className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleReject(p.id)}
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Rad etish'}
                                </button>
                                <button
                                  onClick={() => { setRejectPaymentId(null); setRejectReason(''); }}
                                  className="px-3 py-1.5 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-xs transition-colors"
                                >
                                  Bekor qilish
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Usage Tab ── */}
              {activeTab === 'usage' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-zinc-400">
                    <span>Jami so'rov: {details.usageStats.total}</span>
                    <span>Token: {details.usageStats.totalTokens.toLocaleString()}</span>
                  </div>

                  {details.usageLogs.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 dark:text-zinc-500">
                      <Zap className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>AI so'rovlari topilmadi</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {details.usageLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              log.action?.toLowerCase().includes('chat') ? 'bg-blue-500' :
                              log.action?.toLowerCase().includes('document') ? 'bg-purple-500' :
                              log.action?.toLowerCase().includes('analyz') ? 'bg-orange-500' :
                              'bg-gray-400'
                            }`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                                {log.action || 'Noma\'lum'}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-zinc-500">
                                {formatDate(log.created_at)}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-zinc-500 flex-shrink-0 ml-3">
                            {log.tokens ? `${log.tokens} token` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Activity Tab ── */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Ro'yxatdan o'tgan</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {formatDate(details.loginActivity.registeredAt || details.profile?.created_at)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Oxirgi kirish</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {formatDate(details.loginActivity.lastLogin)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Jami kirishlar</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {details.loginActivity.loginCount || 0} marta
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Hisob holati</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {details.profile?.blocked ? 'Bloklangan' : 'Faol'}
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3">Faoliyat xronologiyasi</h3>
                    <div className="space-y-3">
                      {(details.payments ?? []).slice(0, 5).map(p => (
                        <div key={`pay-${p.id}`} className="flex items-start gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-900 dark:text-zinc-100">
                              To'lov: {p.amount.toLocaleString('uz-UZ')} so'm — {p.status === 'approved' ? 'Tasdiqlandi' : p.status === 'pending' ? 'Kutilmoqda' : 'Bekor qilindi'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(p.created_at)}</p>
                          </div>
                        </div>
                      ))}
                      {(details.usageLogs ?? []).slice(0, 5).map(log => (
                        <div key={`log-${log.id}`} className="flex items-start gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-900 dark:text-zinc-100">{log.action || 'AI so\'rov'}</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(log.created_at)}</p>
                          </div>
                        </div>
                      ))}
                      {details.payments.length === 0 && details.usageLogs.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">Faoliyat topilmadi</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            ID: {(userId || user?.id || '').slice(0, 12)}...
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
              Yopish
            </button>
            <button onClick={fetchDetails} className="px-4 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
              Yangilash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
