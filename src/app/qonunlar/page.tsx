'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useLegalCodes, LegalCode, LegalArticle, CODE_DISPLAY_NAMES } from '@/hooks/useLegalDatabase';
import {
  Search, BookOpen, Scale, Gavel, Shield, FileText, Landmark,
  Users, DollarSign, TreePine, ChevronRight, ArrowLeft, BookMarked,
  ExternalLink, AlertCircle, Briefcase, ScrollText
} from 'lucide-react';

const CODE_ICONS: Record<string, React.ReactNode> = {
  'criminal_code': <Gavel className="w-5 h-5" />,
  'civil_code': <Scale className="w-5 h-5" />,
  'labor_code': <Users className="w-5 h-5" />,
  'family_code': <Users className="w-5 h-5" />,
  'tax_code': <DollarSign className="w-5 h-5" />,
  'land_code': <TreePine className="w-5 h-5" />,
  'admin_code': <Shield className="w-5 h-5" />,
  'constitution': <Landmark className="w-5 h-5" />,
  'civil_procedure_code': <FileText className="w-5 h-5" />,
  'criminal_procedure_code': <FileText className="w-5 h-5" />,
  'economic_procedure_code': <DollarSign className="w-5 h-5" />,
};

const CODE_COLORS: Record<string, string> = {
  'criminal_code': 'from-red-500 to-orange-500',
  'civil_code': 'from-blue-500 to-blue-600',
  'labor_code': 'from-green-500 to-emerald-600',
  'family_code': 'from-pink-500 to-rose-600',
  'tax_code': 'from-purple-500 to-violet-600',
  'land_code': 'from-amber-500 to-yellow-600',
  'admin_code': 'from-slate-500 to-gray-600',
  'constitution': 'from-blue-600 to-indigo-700',
  'civil_procedure_code': 'from-cyan-500 to-sky-600',
  'criminal_procedure_code': 'from-rose-500 to-red-600',
  'economic_procedure_code': 'from-teal-500 to-emerald-600',
};

const CODE_BADGE_COLORS: Record<string, string> = {
  'criminal_code': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'civil_code': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'labor_code': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'family_code': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'tax_code': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'land_code': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'admin_code': 'bg-slate-100 dark:bg-zinc-800/30 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  'constitution': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'civil_procedure_code': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  'criminal_procedure_code': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'economic_procedure_code': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
};

// CODE_SHORT_DISPLAY is intentionally NOT used — only full names are shown
// All badges, headings, and references use CODE_DISPLAY_NAMES only (imported from legal-codes.ts)

export default function QonunlarPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<LegalArticle | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'popular'>('all');

  const { codes, loading, fromSupabase, search: searchCodes } = useLegalCodes();

  // Search results using hook's search function
  const searchResults = useMemo(() => {
    return searchQuery.trim() ? searchCodes(searchQuery) : [];
  }, [searchQuery, searchCodes]);

  // Get current code
  const currentCode = selectedCode ? codes.find(c => c.id === selectedCode) : null;

  // Categories for selected code
  const categories = useMemo(() => {
    if (!currentCode) return [];
    const cats = new Map<string, LegalArticle[]>();
    currentCode.articles.forEach(a => {
      const cat = a.category || 'Boshqa';
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat)!.push(a);
    });
    return Array.from(cats.entries());
  }, [currentCode]);

  // Popular articles (first few from each code)
  const popularArticles = useMemo(() => {
    return codes
      .slice(0, 5)
      .flatMap(code => code.articles.slice(0, 2).map(a => ({ code, article: a })))
      .slice(0, 10);
  }, [codes]);

  // Show article detail
  if (selectedArticle && currentCode) {
    return (
      <div className="min-h-screen bg-page-custom p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{CODE_DISPLAY_NAMES[currentCode.id] || currentCode.name} ga qaytish</span>
          </button>

          <Card className="card-default rounded-2xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={CODE_BADGE_COLORS[currentCode.id] || ''}>
                      {CODE_DISPLAY_NAMES[currentCode.id] || currentCode.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedArticle.category || 'Modda'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {selectedArticle.number}-modda. {selectedArticle.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {selectedArticle.content.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <br key={i} />;
                  if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^\d\)/)) {
                    return (
                      <li key={i} className="text-gray-700 dark:text-zinc-300 ml-4 mb-1">
                        {trimmed.replace(/^[•\-]\s*/, '').replace(/^\d\)\s*/, '')}
                      </li>
                    );
                  }
                  if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.includes(' ')) {
                    return null;
                  }
                  if (trimmed.match(/^[A-ZА-ЯЁ][A-ZА-ЯЁ\s]+$/)) {
                    return (
                      <h4 key={i} className="font-semibold text-blue-700 dark:text-blue-400 mt-3 mb-1 text-sm uppercase tracking-wide">
                        {trimmed}
                      </h4>
                    );
                  }
                  return (
                    <p key={i} className="text-gray-700 dark:text-zinc-300 mb-2">
                      {trimmed}
                    </p>
                  );
                })}
              </div>

              {selectedArticle.penalties && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Jazo:</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{selectedArticle.penalties}</p>
                </div>
              )}

              {selectedArticle.references && selectedArticle.references.length > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Tegishli moddalar:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.references.map((ref, i) => (
                      <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40">
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 text-xs text-gray-400 dark:text-zinc-500">
                <span>{CODE_DISPLAY_NAMES[currentCode.id] || currentCode.name}</span>
                <span>•</span>
                <span>Kuchga kirgan: {currentCode.effectiveDate}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show code detail with articles
  if (currentCode) {
    return (
      <div className="min-h-screen bg-page-custom p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setSelectedCode(null)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Barcha kodekslar</span>
          </button>

          {/* Code Header */}
          <div className={`p-6 rounded-2xl bg-gradient-to-r ${CODE_COLORS[currentCode.id] || 'from-blue-500 to-blue-600'} text-white mb-6`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                {CODE_ICONS[currentCode.id] || <BookOpen className="w-8 h-8" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{CODE_DISPLAY_NAMES[currentCode.id] || currentCode.name}</h1>
                <p className="text-white/80 text-sm mt-1">{currentCode.description}</p>
                <div className="flex items-center gap-4 mt-2 text-white/70 text-xs">
                  <span>{currentCode.totalArticles} ta modda</span>
                  <span>•</span>
                  <span>Kuchga kirgan: {currentCode.effectiveDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search inside code */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${(CODE_DISPLAY_NAMES[currentCode.id] || currentCode.name).substring(0, 30)}... dan qidirish`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-2">
                {searchResults.length} ta natija topildi
              </p>
              {searchResults.slice(0, 10).map(({ article }, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedArticle(article)}
                  className="w-full text-left p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {article.number}-modda
                      </span>
                      <span className="text-gray-500 dark:text-zinc-400 text-sm ml-2">
                        {article.title}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
              {searchResults.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">Hech narsa topilmadi</p>
              )}
            </div>
          )}

          {/* Categories tabs */}
          <div className="space-y-4">
            {categories.map(([cat, articles]) => (
              <Card key={cat} className="card-default rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-blue-500" />
                    {cat}
                    <Badge variant="outline" className="ml-auto text-xs">{articles.length} ta modda</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {articles.map((article, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full text-left py-3 px-1 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {article.number}-modda
                            </span>
                            <span className="text-sm text-gray-700 dark:text-zinc-300 ml-2">
                              {article.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors ml-2 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen bg-page-custom p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 text-white shadow-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Qonunlar bazasi</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                O'zbekiston Respublikasi qonun kodekslari va moddalari
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Qonun, modda yoki kodeks bo'yicha qidirish..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'categories', 'popular'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700'
              }`}
            >
              {tab === 'all' ? 'Barcha kodekslar' : tab === 'categories' ? 'Kategoriyalar' : 'Mashhur moddalar'}
            </button>
          ))}
        </div>

        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="mb-8">
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
              {searchResults.length} ta natija topildi
            </p>
            <div className="space-y-2">
              {searchResults.map(({ code, article }, i) => {
                const icon = CODE_ICONS[code.id] || <BookOpen className="w-4 h-4" />;
                const color = CODE_BADGE_COLORS[code.id] || '';
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedCode(code.id); setSelectedArticle(article); }}
                    className="w-full text-left p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={color}>
                          {CODE_DISPLAY_NAMES[code.id] || code.name}
                        </Badge>
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {article.number}-modda
                        </span>
                        <span className="text-sm text-gray-600 dark:text-zinc-400 truncate max-w-md">
                          {article.title}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
              {searchResults.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-zinc-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Hech narsa topilmadi. Boshqa so'z bilan urinib ko'ring.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Codes Grid */}
        {!searchQuery.trim() && activeTab === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {codes.map(code => (
              <button
                key={code.id}
                onClick={() => setSelectedCode(code.id)}
                className="text-left group"
              >
                <Card className="card-default rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <div className={`h-2 bg-gradient-to-r ${CODE_COLORS[code.id] || 'from-blue-500 to-blue-600'}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${CODE_COLORS[code.id] || 'from-blue-500 to-blue-600'} text-white shadow-sm`}>
                        {CODE_ICONS[code.id] || <BookOpen className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {CODE_DISPLAY_NAMES[code.id] || code.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                          {code.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                          <span>{code.totalArticles} ta modda</span>
                          <span>•</span>
                          <span>{code.effectiveDate}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors mt-2 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        {/* Categories Tab */}
        {!searchQuery.trim() && activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {codes.map(code => {
              const cats = new Set(code.articles.map(a => a.category || 'Boshqa'));
              return (
                <button
                  key={code.id}
                  onClick={() => { setSelectedCode(code.id); setActiveTab('categories'); }}
                  className="text-left group"
                >
                  <Card className="card-default rounded-2xl hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${CODE_COLORS[code.id] || 'from-blue-500 to-blue-600'} text-white`}>
                          {CODE_ICONS[code.id] || <BookOpen className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{CODE_DISPLAY_NAMES[code.id] || code.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">{cats.size} ta kategoriya</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(cats).slice(0, 5).map((cat, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {cat}
                          </Badge>
                        ))}
                        {cats.size > 5 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{cats.size - 5}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* Popular Tab */}
        {!searchQuery.trim() && activeTab === 'popular' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">Eng ko'p o'qilgan moddalar</p>
            {popularArticles.map(({ code, article }, i) => {
              const icon = CODE_ICONS[code.id] || <BookOpen className="w-4 h-4" />;
              const color = CODE_BADGE_COLORS[code.id] || '';
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedCode(code.id); setSelectedArticle(article); }}
                  className="w-full text-left p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${CODE_COLORS[code.id] || 'from-blue-500 to-blue-600'} text-white`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={color}>{CODE_DISPLAY_NAMES[code.id] || code.name}</Badge>
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {article.number}-modda
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mt-0.5 truncate">{article.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
