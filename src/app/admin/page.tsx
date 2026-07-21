'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Settings, Shield, CheckCircle, AlertTriangle, Users, CreditCard, DollarSign, Save, X, Plus, Trash2, Bell, Globe } from 'lucide-react';

// ===== SUPER ADMIN HARDCODED CREDENTIALS =====
const SUPER_ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const SUPER_ADMIN_PASS = 'akmal1221';

interface SiteSettings {
  announcementBanner: string;
  heroTitle: string;
  heroSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  telegramLink: string;
  legalDisclaimer: string;
  systemPrompt: string;
  paymentCardNumber: string;
  paymentDetails: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  caseLimit: number;
}

interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: string;
  amount: number;
  receiptImage: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, isAdmin, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments' | 'pricing' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Pricing
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([
    { id: 'free', name: 'Bepul', price: 0, features: ['5 ta IRAC tahlili', 'Asosiy qonunlar bazasi', '10 ta AI so\'rovi'], caseLimit: 5 },
    { id: 'standart', name: 'Standart', price: 45000, features: ['Cheksiz IRAC tahlili', 'To\'liq qonunlar bazasi', 'AI yordami 24/7', '50 hujjat'], caseLimit: 50 },
    { id: 'pro', name: 'Pro', price: 140000, features: ['Cheksiz AI so\'rovlari', 'Cheksiz hujjat', 'Shaxsiy maslahatchi', 'Ekspert konsultatsiyasi'], caseLimit: -1 },
  ]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editPlanData, setEditPlanData] = useState<PricingPlan | null>(null);

  // Payments
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [showPaymentDetail, setShowPaymentDetail] = useState<string | null>(null);

  // Users
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Site settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    announcementBanner: 'JURISAI - Huquqiy AI yordamchingiz!',
    heroTitle: 'Huquqiy masalalarni AI bilan yeching',
    heroSubtitle: 'O\'zbekiston qonunchiligi bo\'yicha professional AI yordamchi',
    contactEmail: 'support@jurisai.uz',
    contactPhone: '+998 90 123 45 67',
    telegramLink: 'https://t.me/jurisai_bot',
    legalDisclaimer: 'JURISAI tomonidan berilgan ma\'lumotlar faqat ma\'lumot uchun. Rasmiy huquqiy maslahat o\'rnini bosa olmaydi.',
    systemPrompt: 'You are JurisAI — an expert legal consultant...',
    paymentCardNumber: '8600 1234 5678 9012',
    paymentDetails: 'Click: *123# 45000 UZS / Payme: 8600 1234 5678 9012',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem('admin_site_settings');
      if (stored) setSiteSettings(JSON.parse(stored));
      const storedPlans = localStorage.getItem('admin_pricing_plans');
      if (storedPlans) setPricingPlans(JSON.parse(storedPlans));
      const storedPayments = localStorage.getItem('payment_requests');
      if (storedPayments) setPaymentRequests(JSON.parse(storedPayments));
    } catch {}
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const stored = localStorage.getItem('registered_users');
      if (stored) {
        setAllUsers(JSON.parse(stored));
      }
    } catch {}
    setUsersLoading(false);
    setLoading(false);
  };

  // ===== ADMIN AUTH =====
  const handleAdminLogin = async () => {
    setAdminAuthError('');
    if (authEmail === SUPER_ADMIN_EMAIL && authPassword === SUPER_ADMIN_PASS) {
      // Hardcoded super admin - force admin role
      const adminData = {
        id: 'super-admin',
        email: SUPER_ADMIN_EMAIL,
        name: 'Super Admin',
        role: 'ADMIN',
        subscription_plan: 'pro',
      };
      localStorage.setItem('auth_user', JSON.stringify(adminData));
      localStorage.setItem('jurisai_user', JSON.stringify(adminData));
      localStorage.setItem('jurisai_admin_email', SUPER_ADMIN_EMAIL);
      setAdminUser(adminData);
      setAdminAuthError('');
    } else {
      // Try Firebase auth
      const result = await login(authEmail, authPassword);
      if (result.success) {
        if (authEmail === SUPER_ADMIN_EMAIL) {
          localStorage.setItem('jurisai_admin_email', SUPER_ADMIN_EMAIL);
        }
        setAdminAuthError('');
      } else {
        setAdminAuthError(result.error || 'Email yoki parol noto\'g\'ri');
      }
    }
  };

  // ===== USER MANAGEMENT =====
  const updateUserRole = (userId: string, newRole: string) => {
    const updated = allUsers.map((u: any) => {
      if (u.id === userId || u.uid === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    setAllUsers(updated);
    localStorage.setItem('registered_users', JSON.stringify(updated));
  };

  const updateUserSubscription = (userId: string, plan: string) => {
    const updated = allUsers.map((u: any) => {
      if (u.id === userId || u.uid === userId) {
        const expiresAt = plan !== 'free' ? new Date(Date.now() + 365 * 86400000).toISOString() : '';
        return { ...u, subscription_plan: plan, subscription_expires_at: expiresAt };
      }
      return u;
    });
    setAllUsers(updated);
    localStorage.setItem('registered_users', JSON.stringify(updated));
  };

  const toggleUserBlock = (userId: string) => {
    const updated = allUsers.map((u: any) => {
      if (u.id === userId || u.uid === userId) {
        return { ...u, blocked: !u.blocked };
      }
      return u;
    });
    setAllUsers(updated);
    localStorage.setItem('registered_users', JSON.stringify(updated));
  };

  // ===== PAYMENT MANAGEMENT =====
  const approvePayment = (paymentId: string) => {
    const updated = paymentRequests.map(p => {
      if (p.id === paymentId) {
        // Grant premium status to user
        updateUserSubscription(p.userId, p.plan === 'standart' ? 'standart' : 'pro');
        return { ...p, status: 'approved' as const };
      }
      return p;
    });
    setPaymentRequests(updated);
    localStorage.setItem('payment_requests', JSON.stringify(updated));
  };

  const rejectPayment = (paymentId: string) => {
    const updated = paymentRequests.map(p => {
      if (p.id === paymentId) return { ...p, status: 'rejected' as const };
      return p;
    });
    setPaymentRequests(updated);
    localStorage.setItem('payment_requests', JSON.stringify(updated));
  };

  // ===== PRICING MANAGEMENT =====
  const startEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan.id);
    setEditPlanData({ ...plan });
  };

  const savePlan = () => {
    if (!editPlanData) return;
    const updated = pricingPlans.map(p => p.id === editingPlan ? editPlanData : p);
    setPricingPlans(updated);
    localStorage.setItem('admin_pricing_plans', JSON.stringify(updated));
    setEditingPlan(null);
    setEditPlanData(null);
  };

  const addFeatureToPlan = () => {
    if (!editPlanData) return;
    setEditPlanData({ ...editPlanData, features: [...editPlanData.features, ''] });
  };

  const updateFeature = (idx: number, value: string) => {
    if (!editPlanData) return;
    const features = [...editPlanData.features];
    features[idx] = value;
    setEditPlanData({ ...editPlanData, features });
  };

  const removeFeature = (idx: number) => {
    if (!editPlanData) return;
    setEditPlanData({ ...editPlanData, features: editPlanData.features.filter((_, i) => i !== idx) });
  };

  // ===== SITE SETTINGS =====
  const saveSettings = () => {
    localStorage.setItem('admin_site_settings', JSON.stringify(siteSettings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const isSuperAdmin = adminUser?.email === SUPER_ADMIN_EMAIL || user?.email === SUPER_ADMIN_EMAIL;
  const effectiveIsAdmin = isAdmin || isSuperAdmin || !!adminUser;
  const effectiveUser = adminUser || user;

  // Login screen
  if (!effectiveIsAdmin) {
    return (
      <div className="min-h-screen bg-page-custom flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-default rounded-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-800 dark:text-white">Admin Panel</CardTitle>
            <p className="text-sm text-secondary mt-2">Admin huquqlarini tasdiqlang</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Email</label>
              <Input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder={SUPER_ADMIN_EMAIL}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Parol</label>
              <Input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Parolni kiriting"
                className="w-full"
              />
            </div>
            {adminAuthError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                {adminAuthError}
              </div>
            )}
            <Button onClick={handleAdminLogin} className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Admin panelga kirish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-custom">
      {/* Header */}
      <div className="card-default border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-xs text-secondary">{effectiveUser?.email} • {isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[ 
                { id: 'dashboard', label: 'Boshqaruv', icon: Shield },
                { id: 'users', label: 'Foydalanuvchilar', icon: Users },
                { id: 'payments', label: 'To\'lovlar', icon: CreditCard },
                { id: 'pricing', label: 'Narxlar', icon: DollarSign },
                { id: 'settings', label: 'Sozlamalar', icon: Settings },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Jami foydalanuvchilar</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{allUsers.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Kutilayotgan to\'lovlar</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">{paymentRequests.filter(p => p.status === 'pending').length}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-orange-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Tasdiqlangan to\'lovlar</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{paymentRequests.filter(p => p.status === 'approved').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Premium foydalanuvchilar</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">{allUsers.filter((u: any) => u.subscription_plan && u.subscription_plan !== 'free').length}</p>
                    </div>
                    <Shield className="w-8 h-8 text-purple-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ===== USERS ===== */}
        {activeTab === 'users' && (
          <Card className="card-default rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-white">Foydalanuvchilarni boshqarish</CardTitle>
            </CardHeader>
            <CardContent>
              {allUsers.length === 0 ? (
                <div className="text-center py-10 text-secondary">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Hali foydalanuvchilar yo'q</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allUsers.map((u: any) => (
                    <div key={u.id || u.uid} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-800 dark:text-white">{u.name || u.email?.split('@')[0]}</span>
                          <Badge className={u.role === 'ADMIN' || u.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}>
                            {u.role === 'ADMIN' || u.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}
                          </Badge>
                          {u.blocked && <Badge className="bg-red-100 text-red-800">Bloklangan</Badge>}
                        </div>
                        <p className="text-xs text-secondary mt-0.5">{u.email}</p>
                        {u.subscription_plan && u.subscription_plan !== 'free' && (
                          <span className="text-xs text-green-600 mt-1 inline-block">
                            {u.subscription_plan === 'pro' ? 'Pro' : 'Standart'} • {u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString() : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <select
                          value={u.role || 'USER'}
                          onChange={(e) => updateUserRole(u.id || u.uid, e.target.value)}
                          className="text-xs p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                        >
                          <option value="USER">Foydalanuvchi</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <select
                          value={u.subscription_plan || 'free'}
                          onChange={(e) => updateUserSubscription(u.id || u.uid, e.target.value)}
                          className="text-xs p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                        >
                          <option value="free">Bepul</option>
                          <option value="standart">Standart</option>
                          <option value="pro">Pro</option>
                        </select>
                        <button
                          onClick={() => toggleUserBlock(u.id || u.uid)}
                          className={`p-1.5 rounded-lg text-xs ${u.blocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {u.blocked ? 'Faollashtirish' : 'Bloklash'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===== PAYMENTS ===== */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <Card className="card-default rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  To'lov so'rovlarini boshqarish
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentRequests.length === 0 ? (
                  <div className="text-center py-10 text-secondary">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>Hali to'lov so'rovlari yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentRequests.map(p => (
                      <div key={p.id} className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm text-gray-800 dark:text-white">{p.userName || p.userEmail}</p>
                            <p className="text-xs text-secondary">{p.userEmail} • {p.plan}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              p.status === 'approved' ? 'bg-green-100 text-green-800' :
                              p.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }>
                              {p.status === 'approved' ? 'Tasdiqlangan' : p.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                            </Badge>
                            <span className="font-bold text-sm text-gray-800 dark:text-white">{p.amount.toLocaleString()} UZS</span>
                          </div>
                        </div>
                        {p.receiptImage && (
                          <div className="mb-3">
                            <img src={p.receiptImage} alt="Chek" className="w-full max-w-xs rounded-lg border dark:border-zinc-700" />
                          </div>
                        )}
                        {p.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => approvePayment(p.id)}
                              className="px-4 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1">
                              <CheckCircle size={14} /> Tasdiqlash
                            </button>
                            <button onClick={() => rejectPayment(p.id)}
                              className="px-4 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1">
                              <X size={14} /> Rad etish
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-secondary mt-2">{new Date(p.createdAt).toLocaleString('uz-UZ')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== PRICING ===== */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <Card className="card-default rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  Narxlar va rejalarni boshqarish
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {pricingPlans.map(plan => (
                    <div key={plan.id} className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                      {editingPlan === plan.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editPlanData?.name || ''}
                            onChange={(e) => setEditPlanData(prev => prev ? { ...prev, name: e.target.value } : null)}
                            placeholder="Reja nomi"
                            className="w-full text-sm"
                          />
                          <Input
                            type="number"
                            value={editPlanData?.price || 0}
                            onChange={(e) => setEditPlanData(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                            placeholder="Narxi (UZS)"
                            className="w-full text-sm"
                          />
                          <Input
                            type="number"
                            value={editPlanData?.caseLimit || 0}
                            onChange={(e) => setEditPlanData(prev => prev ? { ...prev, caseLimit: Number(e.target.value) } : null)}
                            placeholder="Kunlik limit"
                            className="w-full text-sm"
                          />
                          <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">Xususiyatlar:</p>
                            {editPlanData?.features.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-1 mb-1">
                                <Input value={f} onChange={(e) => updateFeature(idx, e.target.value)} className="text-xs flex-1" />
                                <button onClick={() => removeFeature(idx)} className="p-1 text-red-500"><X size={14} /></button>
                              </div>
                            ))}
                            <button onClick={addFeatureToPlan} className="text-xs text-blue-600 hover:text-blue-800 mt-1">+ Xususiyat qo'shish</button>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={savePlan} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"><Save size={14} className="inline mr-1" />Saqlash</button>
                            <button onClick={() => setEditingPlan(null)} className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs rounded-lg">Bekor qilish</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-800 dark:text-white">{plan.name}</h3>
                            <button onClick={() => startEditPlan(plan)} className="p-1 text-gray-400 hover:text-blue-600">
                              <Settings size={14} />
                            </button>
                          </div>
                          <p className="text-xl font-bold text-blue-600 mb-2">{plan.price.toLocaleString()} UZS</p>
                          <ul className="space-y-1">
                            {plan.features.map((f, idx) => (
                              <li key={idx} className="text-xs text-secondary flex items-start gap-1">
                                <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-secondary mt-2">Kunlik limit: {plan.caseLimit === -1 ? 'Cheksiz' : plan.caseLimit} ta</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== SETTINGS ===== */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <Card className="card-default rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                  <Settings className="w-5 h-5 text-blue-500" />
                  Sayt sozlamalari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'announcementBanner', label: 'Banner matni', icon: Bell },
                  { key: 'heroTitle', label: 'Bosh sahifa sarlavhasi', icon: Globe },
                  { key: 'heroSubtitle', label: 'Bosh sahifa taglavhasi', icon: Globe },
                  { key: 'contactEmail', label: 'Email', icon: Globe },
                  { key: 'contactPhone', label: 'Telefon', icon: Globe },
                  { key: 'telegramLink', label: 'Telegram havola', icon: Globe },
                  { key: 'paymentCardNumber', label: 'Plastik karta raqami', icon: CreditCard },
                  { key: 'paymentDetails', label: 'To\'lov tafsilotlari', icon: CreditCard },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">{field.label}</label>
                    <Input
                      value={(siteSettings as any)[field.key]}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Huquqiy ogohlantirish</label>
                  <textarea
                    value={siteSettings.legalDisclaimer}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, legalDisclaimer: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white resize-none text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">AI System Prompt</label>
                  <textarea
                    value={siteSettings.systemPrompt}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white resize-none text-sm font-mono"
                    rows={4}
                  />
                </div>

                <Button onClick={saveSettings} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Saqlash
                </Button>
                {settingsSaved && (
                  <p className="text-sm text-green-600">Sozlamalar saqlandi! ✅</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
