'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase-browser';
import {
  BookOpen, Plus, Trash2, Save, X, Edit3, Search, CheckCircle,
  AlertTriangle, Loader2, ChevronDown, ChevronRight, Gavel, Scale,
  FileText, ArrowLeft, RefreshCw
} from 'lucide-react';

interface Category {
  id: string;
  code_id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at?: string;
}

interface Article {
  id: string;
  code_id: string;
  article_number: string;
  title: string;
  content: string;
  chapter?: string;
  penalties?: string;
  cross_references?: string[];
}

const CODE_ICONS: Record<string, React.ReactNode> = {
  criminal_code: <Gavel className="w-4 h-4" />,
  civil_code: <Scale className="w-4 h-4" />,
  labor_code: <FileText className="w-4 h-4" />,
  family_code: <FileText className="w-4 h-4" />,
  tax_code: <FileText className="w-4 h-4" />,
  land_code: <FileText className="w-4 h-4" />,
  admin_code: <FileText className="w-4 h-4" />,
  constitution: <BookOpen className="w-4 h-4" />,
  civil_procedure_code: <FileText className="w-4 h-4" />,
  criminal_procedure_code: <FileText className="w-4 h-4" />,
  economic_procedure_code: <FileText className="w-4 h-4" />,
};

const CODE_COLORS: Record<string, string> = {
  criminal_code: 'from-red-500 to-orange-500',
  civil_code: 'from-blue-500 to-blue-600',
  labor_code: 'from-green-500 to-emerald-600',
  family_code: 'from-pink-500 to-rose-600',
  tax_code: 'from-purple-500 to-violet-600',
  land_code: 'from-amber-500 to-yellow-600',
  admin_code: 'from-slate-500 to-gray-600',
  constitution: 'from-blue-600 to-indigo-700',
  civil_procedure_code: 'from-cyan-500 to-sky-600',
  criminal_procedure_code: 'from-rose-500 to-red-600',
  economic_procedure_code: 'from-teal-500 to-emerald-600',
};

const CODE_DISPLAY_NAMES: Record<string, string> = {
  criminal_code: "O'zbekiston Respublikasi Jinoyat Kodeksi",
  civil_code: "O'zbekiston Respublikasi Fuqarolik Kodeksi",
  labor_code: "O'zbekiston Respublikasi Mehnat Kodeksi",
  family_code: "O'zbekiston Respublikasi Oila Kodeksi",
  tax_code: "O'zbekiston Respublikasi Soliq Kodeksi",
  land_code: "O'zbekiston Respublikasi Yer Kodeksi",
  admin_code: "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi Kodeksi",
  civil_procedure_code: "O'zbekiston Respublikasi Fuqarolik protsessual Kodeksi",
  criminal_procedure_code: "O'zbekiston Respublikasi Jinoyat-protsessual Kodeksi",
  economic_procedure_code: "O'zbekiston Respublikasi Iqtisodiy protsessual Kodeksi",
  constitution: "O'zbekiston Respublikasi Konstitutsiyasi",
};

export default function AdminLegalManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ code_id: '', name: '', description: '' });

  // Add/Edit article state
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState({
    code_id: '', article_number: '', title: '', content: '', chapter: '', penalties: '',
  });

  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: cats, error: catErr } = await supabase
        .from('categories').select('*').order('code_id');
      if (catErr) throw catErr;
      setCategories(cats || []);

      if (selectedCode) {
        const { data: arts, error: artErr } = await supabase
          .from('articles')
          .select('*')
          .eq('code_id', selectedCode)
          .order('article_number', { ascending: true })
          .limit(500);
        if (artErr) throw artErr;
        setArticles(arts || []);
      } else {
        setArticles([]);
      }
    } catch (err: any) {
      setError(err.message || 'Yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [selectedCode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Category CRUD ─────────────────────────────────────────────
  const addCategory = async () => {
    if (!newCategory.code_id || !newCategory.name) return;
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from('categories')
        .insert([{ code_id: newCategory.code_id, name: newCategory.name, description: newCategory.description }]);
      if (err) throw err;
      setShowAddCategory(false);
      setNewCategory({ code_id: '', name: '', description: '' });
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Bu kategoriyani o'chirishni tasdiqlaysizmi?")) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  // ── Article CRUD ──────────────────────────────────────────────
  const saveArticle = async () => {
    if (!articleForm.code_id || !articleForm.article_number) return;
    setSaving(true);
    try {
      const data = {
        code_id: articleForm.code_id,
        article_number: articleForm.article_number,
        title: articleForm.title || '',
        content: articleForm.content || '',
        chapter: articleForm.chapter || null,
        penalties: articleForm.penalties || null,
      };

      if (editingArticle) {
        const { error: err } = await supabase
          .from('articles').update(data).eq('id', editingArticle.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('articles').insert([data]);
        if (err) throw err;
      }
      setShowAddArticle(false);
      setEditingArticle(null);
      setArticleForm({ code_id: selectedCode || '', article_number: '', title: '', content: '', chapter: '', penalties: '' });
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const startEditArticle = (article: Article) => {
    setEditingArticle(article);
    setArticleForm({
      code_id: article.code_id,
      article_number: article.article_number,
      title: article.title || '',
      content: article.content || '',
      chapter: article.chapter || '',
      penalties: article.penalties || '',
    });
    setShowAddArticle(true);
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Bu moddani o'chirishni tasdiqlaysizmi?")) return;
    try {
      await supabase.from('articles').delete().eq('id', id);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const filteredArticles = articles.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.article_number.includes(q) || a.title.toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q);
  });

  const uniqueCodeIds = [...new Set(categories.map(c => c.code_id))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100">Qonunlar bazasini boshqarish</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {categories.length} ta kategoriya · {articles.length} ta modda
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 text-gray-500 hover:text-blue-600 transition-colors" title="Yangilash">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => { setShowAddCategory(true); setSelectedCode(null); }}>
            <Plus className="w-4 h-4 mr-1" /> Kategoriya
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4" />
          {error}
          <button onClick={fetchData} className="ml-auto px-3 py-1 bg-red-600 text-white rounded-lg text-xs">Qayta</button>
        </div>
      )}

      {/* Category grid */}
      {!selectedCode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {uniqueCodeIds.map(codeId => {
            const catCount = categories.filter(c => c.code_id === codeId).length;
            return (
              <button
                key={codeId}
                onClick={() => setSelectedCode(codeId)}
                className="text-left p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${CODE_COLORS[codeId] || 'from-blue-500 to-blue-600'} text-white`}>
                    {CODE_ICONS[codeId] || <BookOpen className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                      {CODE_DISPLAY_NAMES[codeId] || codeId}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{catCount} ta kategoriya</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Articles for selected code */}
      {selectedCode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedCode(null)} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${CODE_COLORS[selectedCode] || 'from-blue-500 to-blue-600'} text-white`}>
                {CODE_ICONS[selectedCode] || <BookOpen className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-800 dark:text-zinc-100">{CODE_DISPLAY_NAMES[selectedCode] || selectedCode}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{articles.length} ta modda</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Qidirish..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 w-40"
                />
              </div>
              <Button size="sm" onClick={() => {
                setEditingArticle(null);
                setArticleForm({ code_id: selectedCode, article_number: '', title: '', content: '', chapter: '', penalties: '' });
                setShowAddArticle(true);
              }}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Modda
              </Button>
            </div>
          </div>

          {/* Articles list with virtual scroll simulation (paginated) */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-zinc-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Moddalar topilmadi</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
                {filteredArticles.map(article => (
                  <div key={article.id} className="p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                            {article.article_number}-modda
                          </span>
                          <span className="text-sm font-medium text-gray-800 dark:text-zinc-100 truncate">
                            {article.title || 'Sarlavhasiz'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
                          {article.content?.substring(0, 200) || 'Matn mavjud emas'}
                        </p>
                        {article.chapter && (
                          <Badge variant="outline" className="mt-1 text-[10px]">{article.chapter}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEditArticle(article)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Tahrirlash">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteArticle(article.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="O'chirish">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add Category Modal ── */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowAddCategory(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl max-w-md w-full border border-gray-200 dark:border-zinc-700"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 dark:text-zinc-100">Yangi kategoriya</h3>
              <button onClick={() => setShowAddCategory(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Kodeks ID</label>
                <select value={newCategory.code_id} onChange={e => setNewCategory(p => ({ ...p, code_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-800 dark:text-zinc-200">
                  <option value="">Tanlang...</option>
                  {Object.entries(CODE_DISPLAY_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Nomi</label>
                <Input value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))}
                  placeholder="Kategoriya nomi" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Tavsif</label>
                <textarea value={newCategory.description} onChange={e => setNewCategory(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm resize-none h-20 text-gray-800 dark:text-zinc-200"
                  placeholder="Qisqacha tavsif" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Bekor</button>
                <button onClick={addCategory} disabled={saving || !newCategory.code_id || !newCategory.name}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Save className="w-3.5 h-3.5" /> Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Article Modal ── */}
      {showAddArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => { setShowAddArticle(false); setEditingArticle(null); }}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl max-w-2xl w-full border border-gray-200 dark:border-zinc-700 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 dark:text-zinc-100">
                {editingArticle ? 'Moddani tahrirlash' : 'Yangi modda'}
              </h3>
              <button onClick={() => { setShowAddArticle(false); setEditingArticle(null); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Kodeks</label>
                  <select value={articleForm.code_id} onChange={e => setArticleForm(p => ({ ...p, code_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-800 dark:text-zinc-200"
                    disabled={!!editingArticle}>
                    {Object.entries(CODE_DISPLAY_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Modda raqami</label>
                  <Input value={articleForm.article_number}
                    onChange={e => setArticleForm(p => ({ ...p, article_number: e.target.value }))}
                    placeholder="Masalan: 97" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Sarlavha</label>
                <Input value={articleForm.title} onChange={e => setArticleForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Modda sarlavhasi" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Bob/Bo'lim</label>
                <Input value={articleForm.chapter} onChange={e => setArticleForm(p => ({ ...p, chapter: e.target.value }))}
                  placeholder="Masalan: 1-BOB" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Modda matni</label>
                <textarea value={articleForm.content} onChange={e => setArticleForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm resize-y min-h-[120px] text-gray-800 dark:text-zinc-200 font-mono text-xs leading-relaxed"
                  placeholder="Modda matnini kiriting..." />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Jazo (ixtiyoriy)</label>
                <Input value={articleForm.penalties} onChange={e => setArticleForm(p => ({ ...p, penalties: e.target.value }))}
                  placeholder="Jazo turi va miqdori" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => { setShowAddArticle(false); setEditingArticle(null); }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Bekor</button>
                <button onClick={saveArticle} disabled={saving || !articleForm.code_id || !articleForm.article_number}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Save className="w-3.5 h-3.5" /> {editingArticle ? 'Yangilash' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
