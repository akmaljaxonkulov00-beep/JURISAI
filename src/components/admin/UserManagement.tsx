'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase-browser'
import UserProfileModal from './UserProfileModal'
import { ArrowUpDown, RefreshCw } from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  role: string
  status: string
  createdAt: string
  updatedAt: string
  subscription: {
    id: string
    planName: string
    planPrice: number
    status: string
    currentPeriodEnd: string
  } | null
  aiUsageCount: number
  paymentCount?: number
  paymentTotal?: number
  totalRequests?: number
}

interface SubscriptionPlan {
  id: string
  name: string
  price: number
}

type SortField = '' | 'paymentCount' | 'paymentTotal' | 'totalRequests'
type SortDir = 'asc' | 'desc'

export default function UserManagement() {
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [sortField, setSortField] = useState<SortField>('')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // ── Sort toggle helper ──────────────────────────────────────────────
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return (
      <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
    )
  }

  // ── Realtime subscription for payments ──────────────────────────────
  useEffect(() => {
    if (!isAdmin) return
    const channel = supabase
      .channel('admin-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, () =>
        fetchUsers()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, search, statusFilter, roleFilter, page, sortField, sortDir])

  // ── Realtime subscription for usage logs ────────────────────────────
  useEffect(() => {
    if (!isAdmin) return
    const channel = supabase
      .channel('admin-usage')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usage_logs' }, () =>
        fetchUsers()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, search, statusFilter, roleFilter, page, sortField, sortDir])

  // ── Initial load ────────────────────────────────────────────────────
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
      fetchPlans()
    }
  }, [user, search, statusFilter, roleFilter, page, sortField, sortDir])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        role: roleFilter,
        page: page.toString(),
        limit: '10',
      })
      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        let sorted = data.users || []
        if (sortField) {
          sorted = [...sorted].sort((a: any, b: any) => {
            const va = a[sortField] ?? 0
            const vb = b[sortField] ?? 0
            return sortDir === 'asc' ? va - vb : vb - va
          })
        }
        setUsers(sorted)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const handleBlockUser = async (userId: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'block' }),
      })
      if (response.ok) {
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik')
      }
    } catch {
      alert('Xatolik')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnblockUser = async (userId: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'unblock' }),
      })
      if (response.ok) {
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik')
      }
    } catch {
      alert('Xatolik')
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeSubscription = async (userId: string, planId: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'changeSubscription', data: { planId } }),
      })
      if (response.ok) {
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Xatolik')
      }
    } catch {
      alert('Xatolik')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 dark:bg-zinc-800/30 text-gray-800 dark:text-zinc-200'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'STUDENT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      default:
        return 'bg-gray-100 dark:bg-zinc-800/30 text-gray-800 dark:text-zinc-200'
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Ruxsat etilmagan</h1>
          <p className="text-gray-600 dark:text-zinc-400 mt-2">
            Bu sahifaga faqat adminlar kirishi mumkin
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          userId={selectedUser.id}
          userName={
            `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() ||
            selectedUser.email
          }
          userEmail={selectedUser.email}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
              Foydalanuvchilar Boshqaruvi
            </h2>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Yangilash
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Ism, email yoki telefon bo'yicha qidirish..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              >
                <option value="all">Barcha Holatlar</option>
                <option value="ACTIVE">Faol</option>
                <option value="INACTIVE">Faol Emas</option>
                <option value="SUSPENDED">Bloklangan</option>
              </select>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              >
                <option value="all">Barcha Rollar</option>
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">O'qituvchi</option>
                <option value="STUDENT">Talaba</option>
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
              <span>Saralash:</span>
              {[
                { field: 'paymentCount' as SortField, label: "To'lovlar soni" },
                { field: 'paymentTotal' as SortField, label: "Yig'ilgan summa" },
                { field: 'totalRequests' as SortField, label: "AI so'rovlar" },
              ].map(opt => (
                <button
                  key={opt.field}
                  onClick={() => toggleSort(opt.field)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    sortField === opt.field
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {opt.label}
                  {sortField === opt.field && (sortDir === 'desc' ? ' ↓' : ' ↑')}
                </button>
              ))}
              {sortField && (
                <button
                  onClick={() => {
                    setSortField('')
                    setSortDir('desc')
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 ml-2"
                >
                  Tozalash
                </button>
              )}
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                Yuklanmoqda...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                        Foydalanuvchi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                        Kontakt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                        Rol / Holat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                        Obuna
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-zinc-300 select-none"
                        onClick={() => toggleSort('totalRequests')}
                      >
                        AI So'rovlar{' '}
                        {sortField === 'totalRequests' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-zinc-300 select-none"
                        onClick={() => toggleSort('paymentCount')}
                      >
                        To'lovlar{' '}
                        {sortField === 'paymentCount' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                    {users.map(u => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser(u)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                              {u.firstName && u.lastName
                                ? `${u.firstName} ${u.lastName}`
                                : "Noma'lum"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-zinc-500">
                              {new Date(u.createdAt).toLocaleDateString('uz-UZ')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-zinc-100">{u.email}</div>
                          <div className="text-sm text-gray-500 dark:text-zinc-500">
                            {u.phone || "Telefon yo'q"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(u.role)}`}
                            >
                              {u.role}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(u.status)}`}
                            >
                              {u.status === 'ACTIVE'
                                ? 'Faol'
                                : u.status === 'SUSPENDED'
                                  ? 'Bloklangan'
                                  : u.status === 'INACTIVE'
                                    ? 'Faol emas'
                                    : u.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.subscription ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                                {u.subscription.planName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-zinc-500">
                                {u.subscription.planPrice.toLocaleString('uz-UZ')} so'm/oy
                              </div>
                              <div className="text-xs text-gray-400 dark:text-zinc-500">
                                {new Date(u.subscription.currentPeriodEnd).toLocaleDateString(
                                  'uz-UZ'
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-zinc-500">
                              Obuna yo'q
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-zinc-100">
                            {u.totalRequests ?? u.aiUsageCount} ta so'rov
                          </div>
                          <div className="text-xs text-gray-400 dark:text-zinc-500">
                            AI Chat, Analitika va Hujjat generator
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                            {(u.paymentCount ?? 0) > 0
                              ? `${u.paymentCount} ta to'lov`
                              : "To'lov yo'q"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-zinc-500">
                            {(u.paymentTotal ?? 0) > 0
                              ? `${(u.paymentTotal ?? 0).toLocaleString('uz-UZ')} so'm yig'ilgan`
                              : "0 so'm"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                            {u.status === 'ACTIVE' ? (
                              <button
                                className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleBlockUser(u.id)}
                                disabled={actionLoading === u.id}
                              >
                                {actionLoading === u.id ? 'Kuting...' : 'Bloklash'}
                              </button>
                            ) : u.status === 'SUSPENDED' ? (
                              <button
                                className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-zinc-300 bg-gray-200 border border-gray-300 dark:border-zinc-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleUnblockUser(u.id)}
                                disabled={actionLoading === u.id}
                              >
                                {actionLoading === u.id ? 'Kuting...' : 'Blokdan ochish'}
                              </button>
                            ) : null}
                            <select
                              onChange={e => {
                                if (e.target.value) {
                                  handleChangeSubscription(u.id, e.target.value)
                                  e.target.value = ''
                                }
                              }}
                              disabled={actionLoading === u.id}
                              className="text-sm px-2 py-1 border border-gray-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-zinc-800"
                            >
                              <option value="">Obunani o'zgartirish</option>
                              {plans.map(plan => (
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:bg-zinc-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Oldingi
                </button>
                <span className="text-sm text-gray-600 dark:text-zinc-400">
                  {page} / {totalPages}
                </span>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:bg-zinc-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  )
}
