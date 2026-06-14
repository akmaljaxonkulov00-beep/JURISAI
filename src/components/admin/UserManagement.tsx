'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  subscription: {
    id: string;
    planName: string;
    planPrice: number;
    status: string;
    currentPeriodEnd: string;
  } | null;
  aiUsageCount: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
}

export default function UserManagement() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchPlans();
    }
  }, [user, search, statusFilter, roleFilter, page]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        role: roleFilter,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleBlockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'block',
        }),
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Xatolik yuz berdi');
      }
    } catch (error) {
      alert('Xatolik yuz berdi');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'unblock',
        }),
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Xatolik yuz berdi');
      }
    } catch (error) {
      alert('Xatolik yuz berdi');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeSubscription = async (userId: string, planId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'changeSubscription',
          data: { planId },
        }),
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Xatolik yuz berdi');
      }
    } catch (error) {
      alert('Xatolik yuz berdi');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'TEACHER': return 'bg-blue-100 text-blue-800';
      case 'STUDENT': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Ruxsat etilmagan</h1>
          <p className="text-gray-600 mt-2">Bu sahifaga faqat adminlar kirishi mumkin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Foydalanuvchilar Boshqaruvi</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ism, email yoki telefon bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Barcha Holatlar</option>
              <option value="ACTIVE">Faol</option>
              <option value="INACTIVE">Faol Emas</option>
              <option value="SUSPENDED">Bloklangan</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Barcha Rollar</option>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">O'qituvchi</option>
              <option value="STUDENT">Talaba</option>
            </select>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-8">Yuklanmoqda...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Foydalanuvchi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol / Holat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Obuna
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AI Foydalanishi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : 'Noma\'lum'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone || 'Telefon yo\'q'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {user.status === 'ACTIVE' ? 'Faol' : 
                             user.status === 'SUSPENDED' ? 'Bloklangan' : 
                             user.status === 'INACTIVE' ? 'Faol emas' : user.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.subscription ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.subscription.planName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.subscription.planPrice.toLocaleString('uz-UZ')} so'm/oy
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('uz-UZ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Obuna yo'q</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.aiUsageCount} ta so'rov</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          {/* Block/Unblock Button */}
                          {user.status === 'ACTIVE' ? (
                            <button
                              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleBlockUser(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? 'Kuting...' : 'Bloklash'}
                            </button>
                          ) : user.status === 'SUSPENDED' ? (
                            <button
                              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleUnblockUser(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? 'Kuting...' : 'Blokdan ochish'}
                            </button>
                          ) : null}

                          {/* Subscription Change */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleChangeSubscription(user.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            disabled={actionLoading === user.id}
                            className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Obunani o'zgartirish</option>
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} ({plan.price.toLocaleString('uz-UZ')} so'm)
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Oldingi
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Keyingi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
