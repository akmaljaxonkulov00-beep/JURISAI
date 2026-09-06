'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { getAuthHeaders } from '@/lib/api-auth-client'
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Search,
  Scale,
  Gavel,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react'
import type {
  CourtScenario,
  CaseCategory,
  ProcedureType,
  DifficultyLevel,
} from '@/lib/court/court-types'

interface ScenarioFormData {
  title: string
  description: string
  category: CaseCategory
  procedure_type: ProcedureType
  difficulty: DifficultyLevel
  facts: string
  expected_outcome: string
  active: boolean
}

const emptyForm: ScenarioFormData = {
  title: '',
  description: '',
  category: 'criminal',
  procedure_type: 'trial',
  difficulty: 'medium',
  facts: '',
  expected_outcome: '',
  active: true,
}

export default function AdminCourtScenarioManager() {
  const [scenarios, setScenarios] = useState<CourtScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [procedureFilter, setProcedureFilter] = useState('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ScenarioFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadScenarios = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/court-scenarios', {
        headers: await getAuthHeaders(),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.scenarios)) {
        setScenarios(data.scenarios)
      } else {
        setError(data.error || 'Ssenariylarni yuklashda xatolik')
      }
    } catch {
      setError('Tarmoq xatoligi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScenarios()
  }, [])

  const startEdit = (s: CourtScenario) => {
    setForm({
      title: s.title,
      description: s.description || '',
      category: s.category || 'criminal',
      procedure_type: s.procedure_type || 'trial',
      difficulty: s.difficulty || 'medium',
      facts: s.facts || '',
      expected_outcome: s.expected_outcome || '',
      active: s.active ?? true,
    })
    setEditingId(s.id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const startAdd = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Ssenariy nomi kiritilishi shart')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) }

      if (editingId) {
        const res = await fetch('/api/admin/court-scenarios', {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            scenarioId: editingId,
            updates: form,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setSuccess('Ssenariy muvaffaqiyatli yangilandi')
          setShowForm(false)
          loadScenarios()
        } else {
          setError(data.error || 'Yangilashda xatolik')
        }
      } else {
        const res = await fetch('/api/admin/court-scenarios', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            scenario: form,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setSuccess('Yangi ssenariy muvaffaqiyatli qo‘shildi')
          setShowForm(false)
          loadScenarios()
        } else {
          setError(data.error || 'Qo‘shishda xatolik')
        }
      }
    } catch {
      setError('Saqlashda xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham bu ssenariyni o‘chirmoqchimisiz?')) return

    try {
      const res = await fetch(`/api/admin/court-scenarios?id=${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Ssenariy o‘chirildi')
        loadScenarios()
      } else {
        setError(data.error || 'O‘chirishda xatolik')
      }
    } catch {
      setError('Tarmoq xatoligi')
    }
  }

  const toggleActive = async (s: CourtScenario) => {
    try {
      const res = await fetch('/api/admin/court-scenarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          scenarioId: s.id,
          updates: { active: !s.active },
        }),
      })
      const data = await res.json()
      if (data.success) {
        loadScenarios()
      }
    } catch {}
  }

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      const matchSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = categoryFilter === 'all' || s.category === categoryFilter
      const matchProcedure = procedureFilter === 'all' || s.procedure_type === procedureFilter
      return matchSearch && matchCategory && matchProcedure
    })
  }, [scenarios, searchQuery, categoryFilter, procedureFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="text-blue-600" /> Virtual Sud Ssenariylari CMS
          </h2>
          <p className="text-sm text-gray-500">
            O‘zbekiston protsessual qonunchiligiga asoslangan amaliyot ishlari va simulyatsiyalar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadScenarios} disabled={loading}>
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Yangilash
          </Button>
          <Button onClick={startAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={16} className="mr-2" /> Yangi Ish Qo‘shish
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {/* FILTER PANEL */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <Input
              placeholder="Ish nomi yoki mazmuni bo‘yicha qidiruv..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
          >
            <option value="all">Barcha sohalar</option>
            <option value="criminal">Jinoyat ishlari</option>
            <option value="civil">Fuqarolik ishlari</option>
            <option value="administrative">Ma’muriy ishlar</option>
            <option value="labor">Mehnat nizolari</option>
            <option value="family">Oila nizolari</option>
            <option value="economic">Iqtisodiy / Biznes</option>
          </select>
          <select
            value={procedureFilter}
            onChange={e => setProcedureFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
          >
            <option value="all">Barcha jarayonlar</option>
            <option value="trial">Sud Jarayoni</option>
            <option value="negotiation">Muzokara</option>
            <option value="investigation">Tergov</option>
          </select>
        </CardContent>
      </Card>

      {/* MODAL FORM */}
      {showForm && (
        <Card className="border-2 border-blue-500 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">
              {editingId ? 'Ssenariyni Tahrirlash' : 'Yangi Ish / Ssenariy Yaratish'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              <X size={18} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Ish Nomi *</label>
                <Input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Masalan: Shartnoma buzilishi bo‘yicha nizo"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Kategoriya
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as CaseCategory })}
                    className="w-full px-2 py-2 border rounded-lg text-sm"
                  >
                    <option value="criminal">Jinoyat</option>
                    <option value="civil">Fuqarolik</option>
                    <option value="administrative">Ma’muriy</option>
                    <option value="labor">Mehnat</option>
                    <option value="family">Oila</option>
                    <option value="economic">Iqtisodiy</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Protsedura
                  </label>
                  <select
                    value={form.procedure_type}
                    onChange={e =>
                      setForm({ ...form, procedure_type: e.target.value as ProcedureType })
                    }
                    className="w-full px-2 py-2 border rounded-lg text-sm"
                  >
                    <option value="trial">Sud Jarayoni</option>
                    <option value="negotiation">Muzokara</option>
                    <option value="investigation">Tergov</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Qiyinlik</label>
                  <select
                    value={form.difficulty}
                    onChange={e =>
                      setForm({ ...form, difficulty: e.target.value as DifficultyLevel })
                    }
                    className="w-full px-2 py-2 border rounded-lg text-sm"
                  >
                    <option value="easy">Boshlang‘ich</option>
                    <option value="medium">O‘rta</option>
                    <option value="hard">Murakkab</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Qisqa Tavsif</label>
              <Input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Foydalanuvchi kartasida chiqadigan qisqacha ma'lumot..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Faktik Holat (To‘liq voqea)
              </label>
              <Textarea
                rows={4}
                value={form.facts}
                onChange={e => setForm({ ...form, facts: e.target.value })}
                placeholder="Ishning faktik tafsilotlari, sanalar, tomonlar harakati va nizo sababi..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Kutilayotgan Sud Qarori / Hukm
              </label>
              <Textarea
                rows={2}
                value={form.expected_outcome}
                onChange={e => setForm({ ...form, expected_outcome: e.target.value })}
                placeholder="Qonun talablari bo‘yicha kutilayotgan adolatli yakuniy qaror..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scenario_active"
                checked={form.active}
                onChange={e => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <label htmlFor="scenario_active" className="text-sm font-medium text-gray-700">
                Foydalanuvchilarga faol ko‘rinsin
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white">
                <Save size={16} className="mr-2" /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SCENARIOS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScenarios.map(s => (
          <Card
            key={s.id}
            className="relative flex flex-col justify-between hover:shadow-md transition"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`text-xs uppercase font-semibold ${
                    s.procedure_type === 'trial'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : s.procedure_type === 'negotiation'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                >
                  {s.procedure_type === 'trial'
                    ? 'Sud Jarayoni'
                    : s.procedure_type === 'negotiation'
                      ? 'Muzokara'
                      : 'Tergov'}
                </Badge>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={
                      s.difficulty === 'easy'
                        ? 'success'
                        : s.difficulty === 'medium'
                          ? 'warning'
                          : 'destructive'
                    }
                  >
                    {s.difficulty === 'easy'
                      ? 'Boshlang‘ich'
                      : s.difficulty === 'medium'
                        ? 'O‘rta'
                        : 'Murakkab'}
                  </Badge>
                  <button
                    onClick={() => toggleActive(s)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.active ? 'Aktiv' : 'Nofaol'}
                  </button>
                </div>
              </div>
              <CardTitle className="text-base font-bold line-clamp-1">{s.title}</CardTitle>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{s.description || s.facts}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                <span>Ishtirokchilar: {s.participants?.length || 0}</span>
                <span>•</span>
                <span>Dalillar: {s.evidence?.length || 0}</span>
                <span>•</span>
                <span>Bosqichlar: {s.stages?.length || 0}</span>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
                <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
                  <Edit3 size={15} className="mr-1 text-blue-600" /> Tahrirlash
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                  <Trash2 size={15} className="mr-1 text-red-600" /> O‘chirish
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredScenarios.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <Scale className="mx-auto mb-2 text-gray-400" size={32} />
          <p>Ssenariylar topilmadi.</p>
        </div>
      )}
    </div>
  )
}
