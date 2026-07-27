'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import {
  Plus, Edit3, Trash2, Save, X, FileText, Search,
  FolderOpen, AlertCircle, Download, Eye
} from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '@/data/document-templates';
import type { DocumentTemplate } from '@/data/document-templates';

interface TemplateForm {
  name: string;
  category: string;
  description: string;
  content: string;
  lawRef: string;
  format: 'TXT' | 'DOCX' | 'PDF';
  tags: string;
}

const emptyForm: TemplateForm = {
  name: '',
  category: 'shartnoma',
  description: '',
  content: '',
  lawRef: '',
  format: 'TXT',
  tags: '',
};

export default function AdminTemplateManager() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const loadTemplates = (isInitial = false) => {
    if (isInitial) setLoading(true);
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.templates) {
          setTemplates(data.templates);
        }
      })
      .catch(() => { if (isInitial) setError('Ma\'lumotlarni yuklashda xatolik'); })
      .finally(() => { if (isInitial) setLoading(false); setInitialLoad(false); });
  };

  useEffect(() => {
    loadTemplates(true);
    // Poll every 30s for updates — no loading spinner on refresh
    const pollInterval = setInterval(() => loadTemplates(false), 30_000);
    return () => clearInterval(pollInterval);
  }, []);

  // Update form for editing
  const startEdit = (t: DocumentTemplate) => {
    setForm({
      name: t.name,
      category: t.category,
      description: t.description,
      content: t.content,
      lawRef: t.lawRef || '',
      format: t.format,
      tags: (t.tags || []).join(', '),
    });
    setEditingId(t.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const startAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!form.name.trim() || !form.content.trim() || !form.category) {
      setError('Nomi, kategoriyasi va matni majburiy');
      return;
    }

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const body = {
      id: editingId,
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      content: form.content,
      lawRef: form.lawRef.trim(),
      format: form.format,
      tags,
    };

    try {
      const res = await fetch('/api/templates', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(editingId ? 'Hujjat yangilandi' : 'Hujjat yaratildi');
        cancelForm();
        loadTemplates();
      } else {
        setError(data.error || 'Xatolik yuz berdi');
      }
    } catch {
      setError('Serverga bog\'lanib bo\'lmadi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hujjatni o\'chirishni tasdiqlaysizmi?')) return;

    try {
      const res = await fetch('/api/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Hujjat o\'chirildi');
        loadTemplates();
        if (editingId === id) cancelForm();
      } else {
        setError(data.error || 'O\'chirishda xatolik');
      }
    } catch {
      setError('Serverga bog\'lanib bo\'lmadi');
    }
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let list = templates;
    if (categoryFilter !== 'all') {
      list = list.filter(t => t.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [templates, categoryFilter, searchQuery]);

  const getCategoryName = (cat: string): string => {
    const found = TEMPLATE_CATEGORIES.find(c => c.id === cat);
    return found ? found.name : cat;
  };

  // Format date
  const formatDate = (d: string): string => {
    try {
      return new Date(d).toLocaleDateString('uz-UZ');
    } catch { return d; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hujjat namunalarini boshqarish</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">{templates.length} ta hujjat</p>
        </div>
        <Button onClick={startAdd} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Yangi hujjat
        </Button>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="card-default rounded-2xl border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {editingId ? (
                <><Edit3 className="w-4 h-4 text-blue-500" /> Hujjatni tahrirlash</>
              ) : (
                <><Plus className="w-4 h-4 text-green-500" /> Yangi hujjat qo'shish</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Nomi *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Hujjat nomi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Kategoriya *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Tavsif</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Qisqacha tavsif" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Qonuniy asos</label>
                <Input value={form.lawRef} onChange={e => setForm(f => ({ ...f, lawRef: e.target.value }))} placeholder="Masalan: FPK 103-moddasi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Format</label>
                <select
                  value={form.format}
                  onChange={e => setForm(f => ({ ...f, format: e.target.value as 'TXT' | 'DOCX' | 'PDF' }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="TXT">TXT</option>
                  <option value="DOCX">DOCX</option>
                  <option value="PDF">PDF</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Teg'lar (vergul bilan ajrating)</label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="huquq, shartnoma, da'vo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Matn *</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={12}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono leading-relaxed resize-y"
                placeholder="Hujjat matnini kiriting..."
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={cancelForm} className="flex items-center gap-1">
                <X className="w-4 h-4" /> Bekor qilish
              </Button>
              <Button onClick={handleSave} className="flex items-center gap-1">
                <Save className="w-4 h-4" /> {editingId ? 'Yangilash' : 'Yaratish'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Hujjat nomi yoki ID bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">Barcha kategoriyalar</option>
          {TEMPLATE_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Templates Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">Yuklanmoqda...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-zinc-400 font-medium">Hujjat topilmadi</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Yangi hujjat qo'shish uchun "Yangi hujjat" tugmasini bosing</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700">
                <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-zinc-300">Nomi</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-zinc-300 hidden md:table-cell">ID</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-zinc-300">Kategoriya</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-zinc-300 hidden sm:table-cell">Format</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-zinc-300 hidden lg:table-cell">Yuklama</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700 dark:text-zinc-300 hidden lg:table-cell">Sana</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-700 dark:text-zinc-300">Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map(t => (
                <tr key={t.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-xs line-clamp-1">{t.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 line-clamp-1">{t.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-gray-400 dark:text-zinc-500 font-mono hidden md:table-cell">{t.id}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className="text-[10px]">{getCategoryName(t.category)}</Badge>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <Badge className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{t.format}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-zinc-400 hidden lg:table-cell">{t.downloads}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-zinc-400 hidden lg:table-cell">{formatDate(t.createdAt)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setPreviewContent(t.content); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Ko'rish"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => startEdit(t)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Content Preview Modal */}
      {previewContent && (
        <div
          onClick={() => setPreviewContent(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
        >
          <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Matnni ko'rish</h3>
              <button onClick={() => setPreviewContent(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <pre className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-serif">{previewContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
