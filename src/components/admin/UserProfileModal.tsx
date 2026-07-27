'use client';

import React from 'react';
import { X, User, Mail, Shield, Crown, CreditCard, DollarSign, Activity, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

function useEscape(callback: () => void) {
  const savedCallback = React.useRef(callback);
  savedCallback.current = callback;
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') savedCallback.current();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []); // Stable — ref callback never changes
}

interface PaymentRecord {
  id: string;
  amount: number;
  plan: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface TokenRecord {
  tokens: number;
  date: string;
  action: string;
}

interface LoginRecord {
  date: string;
  method: 'email' | 'google';
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  paymentHistory: PaymentRecord[];
  tokenHistory: TokenRecord[];
  loginHistory: LoginRecord[];
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  paymentHistory,
  tokenHistory,
  loginHistory,
}: UserProfileModalProps) {
  if (!isOpen || !user) return null;

  useEscape(onClose);

  // Calculate metrics
  const totalBalance = paymentHistory
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalTokens = tokenHistory.reduce((sum, t) => sum + (t.tokens || 0), 0);

  const subscriptionPlan = user.subscription_plan || 'free';
  const subscriptionExpires = user.subscription_expires_at
    ? new Date(user.subscription_expires_at).toLocaleDateString('uz-UZ')
    : '—';

  const userPayments = paymentHistory.filter(
    p => p.userId === user.id || p.userId === user.uid || p.userEmail === user.email
  );
  const approvedPayments = userPayments.filter(p => p.status === 'approved');
  const pendingPayments = userPayments.filter(p => p.status === 'pending');

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro': return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 text-xs">Pro</Badge>;
      case 'standart': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs">Standart</Badge>;
      default: return <Badge className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs">Bepul</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={14} className="text-green-500" />;
      case 'rejected': return <AlertCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-amber-500 animate-pulse" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Tasdiqlangan';
      case 'rejected': return 'Rad etilgan';
      default: return 'Kutilmoqda';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <User size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {user.name || user.email?.split('@')[0] || 'Foydalanuvchi'}
              </h2>
              <p className="text-xs text-secondary flex items-center gap-1">
                <Mail size={10} className="opacity-60" />
                {user.email || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-gray-500 dark:text-zinc-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* === STATUS CARDS === */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800/50">
              <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Balans</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-1">{totalBalance.toLocaleString()} UZS</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800/50">
              <p className="text-[10px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">Obuna</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-1 capitalize">{subscriptionPlan}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800/50">
              <p className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">Tokenlar</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300 mt-1">{totalTokens.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800/50">
              <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Rol</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-1 capitalize">{user.role || 'USER'}</p>
            </div>
          </div>

          {/* === USER DETAILS === */}
          <div className="bg-gray-50 dark:bg-zinc-800/30 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Shield size={14} className="text-blue-500" />
              Foydalanuvchi ma'lumotlari
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-secondary">F.I.O</p>
                <p className="font-medium text-gray-800 dark:text-zinc-200">{user.name || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-secondary">Email</p>
                <p className="font-medium text-gray-800 dark:text-zinc-200">{user.email || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-secondary">Ro'yxatdan o'tgan</p>
                <p className="font-medium text-gray-800 dark:text-zinc-200">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('uz-UZ') : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-secondary">Oxirgi kirish</p>
                <p className="font-medium text-gray-800 dark:text-zinc-200">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString('uz-UZ') : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-secondary">Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {subscriptionPlan !== 'free' && <Crown size={12} className="text-amber-500" />}
                  <span className="font-medium text-gray-800 dark:text-zinc-200">
                    {user.blocked ? '🚫 Bloklangan' : '✅ Faol'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-secondary">Obuna tugaydi</p>
                <p className="font-medium text-gray-800 dark:text-zinc-200">{subscriptionExpires}</p>
              </div>
            </div>
          </div>

          {/* === PAYMENT HISTORY === */}
          <div className="bg-gray-50 dark:bg-zinc-800/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <CreditCard size={14} className="text-blue-500" />
                To'lovlar tarixi
              </h3>
              {approvedPayments.length > 0 && (
                <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                  +{approvedPayments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} UZS
                </span>
              )}
            </div>
            {userPayments.length === 0 ? (
              <p className="text-xs text-secondary text-center py-3">Hali to'lovlar mavjud emas</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {userPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((pay, i) => (
                  <div key={pay.id || i} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(pay.status)}
                      <div>
                        <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">
                          {pay.plan === 'pro' ? 'Pro' : 'Standart'} reja
                        </p>
                        <p className="text-[10px] text-secondary">{new Date(pay.createdAt).toLocaleDateString('uz-UZ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">{pay.amount.toLocaleString()} UZS</p>
                      <p className="text-[10px] text-secondary">{getStatusText(pay.status)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingPayments.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
                <Clock size={14} className="text-amber-500 animate-pulse" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {pendingPayments.length} ta kutilayotgan to'lov
                </p>
              </div>
            )}
          </div>

          {/* === TOKEN ACTIVITY === */}
          {tokenHistory.length > 0 && (
            <div className="bg-gray-50 dark:bg-zinc-800/30 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Activity size={14} className="text-green-500" />
                Token faolligi
              </h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {tokenHistory.slice(-8).reverse().map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={10} className="text-blue-500" />
                      <span className="text-xs text-gray-600 dark:text-zinc-400 truncate max-w-[180px]">{t.action}</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t.tokens.toLocaleString()}</span>
                      <span className="text-[10px] text-secondary">{new Date(t.date).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === RECENT LOGINS === */}
          {loginHistory.length > 0 && (
            <div className="bg-gray-50 dark:bg-zinc-800/30 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Clock size={14} className="text-purple-500" />
                Oxirgi kirishlar
              </h3>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {loginHistory.slice(-5).reverse().map((l, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      {l.method === 'google' ? (
                        <svg className="w-3 h-3" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/></svg>
                      ) : (
                        <Mail size={10} className="text-blue-500" />
                      )}
                      <span className="text-xs text-gray-600 dark:text-zinc-400">{l.method === 'google' ? 'Google' : 'Email'}</span>
                    </div>
                    <span className="text-[10px] text-secondary">{new Date(l.date).toLocaleString('uz-UZ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Balance summary footer */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <DollarSign size={24} className="opacity-80" />
              <div>
                <p className="text-xs font-medium opacity-80">Umumiy balans</p>
                <p className="text-xl font-bold">{totalBalance.toLocaleString()} UZS</p>
              </div>
            </div>
            <div className="text-right">
              {getPlanBadge(subscriptionPlan)}
              <p className="text-[10px] opacity-75 mt-1">{approvedPayments.length} ta to'lov</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
