'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLegalCodes, LegalArticle, CODE_DISPLAY_NAMES } from '@/hooks/useLegalDatabase'
import {
  Search,
  BookOpen,
  Scale,
  Gavel,
  Shield,
  FileText,
  Landmark,
  Users,
  DollarSign,
  TreePine,
  ChevronRight,
  ArrowLeft,
  BookMarked,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Loader2,
  X,
  ChevronDown,
} from 'lucide-react'

const CODE_ICONS: Record<string, React.ReactNode> = {
  criminal_code: <Gavel className="w-5 h-5" />,
  civil_code: <Scale className="w-5 h-5" />,
  labor_code: <Users className="w-5 h-5" />,
  family_code: <Users className="w-5 h-5" />,
  tax_code: <DollarSign className="w-5 h-5" />,
  land_code: <TreePine className="w-5 h-5" />,
  admin_code: <Shield className="w-5 h-5" />,
  constitution: <Landmark className="w-5 h-5" />,
  civil_procedure_code: <FileText className="w-5 h-5" />,
  criminal_procedure_code: <FileText className="w-5 h-5" />,
  economic_procedure_code: <DollarSign className="w-5 h-5" />,
}

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
}

const CODE_BADGE_COLORS: Record<string, string> = {
  criminal_code: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  civil_code: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  labor_code: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  family_code: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  tax_code: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  land_code: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  admin_code:
    'bg-slate-100 dark:bg-zinc-800/30 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  constitution: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  civil_procedure_code: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  criminal_procedure_code: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  economic_procedure_code: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
}

const ARTICLES_PER_PAGE = 20

export default function CodeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const codeId = params?.id as string

  const { getCode, search: searchCodes, loading } = useLegalCodes()
  const code = getCode(codeId)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<LegalArticle | null>(null)
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})
  const [explainingArticle, setExplainingArticle] = useState<LegalArticle | null>(null)
  const [explainResult, setExplainResult] = useState<string | null>(null)
  const [explainLoading, setExplainLoading] = useState(false)

  // Categories for this code
  const categories = useMemo(() => {
    if (!code) return []
    const cats = new Map<string, LegalArticle[]>()
    code.articles.forEach(a => {
      const cat = a.category || 'Boshqa'
      if (!cats.has(cat)) cats.set(cat, [])
      cats.get(cat)!.push(a)
    })
    return Array.from(cats.entries())
  }, [code])

  // Search within this code using hook
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !code) return []
    const allResults = searchQuery.trim() ? searchCodes(searchQuery) : []
    return (allResults ?? [])
      .filter(r => r.code.id === codeId)
      .map(r => r.article)
      .slice(0, 30)
  }, [searchQuery, code, codeId, searchCodes])

  // Pagination
  const getVisibleCount = (catKey: string) => {
    return visibleCounts[catKey] || ARTICLES_PER_PAGE
  }

  const loadMore = (catKey: string) => {
    setVisibleCounts(prev => ({
      ...prev,
      [catKey]: (prev[catKey] || ARTICLES_PER_PAGE) + ARTICLES_PER_PAGE,
    }))
  }

  // AI Explain
  const handleAiExplain = async (article: LegalArticle, cId: string) => {
    setExplainingArticle(article)
    setExplainResult(null)
    setExplainLoading(true)

    try {
      const res = await fetch('/api/ai/legal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Quyidagi moddani sodda va tushunarli tilda izohlab bering: ${article.number}-modda. ${article.title}. Modda matni: ${article.content.substring(0, 1200)}`,
        }),
      })

      if (!res.ok) throw new Error('AI xizmati xatosi')
      const data = await res.json()
      setExplainResult(data.response || 'Javob olinmadi')
    } catch {
      setExplainResult(
        "Kechirasiz, AI izohni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
      )
    } finally {
      setExplainLoading(false)
    }
  }

  // Code not found
  if (!code) {
    return (
      <div className="min-h-screen bg-page-custom p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Kodeks topilmadi
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mb-6">
            So'ralgan kodeks mavjud emas yoki o'chirilgan.
          </p>
          <button
            onClick={() => router.push('/qonunlar')}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
          >
            Barcha kodekslar
          </button>
        </div>
      </div>
    )
  }

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-page-custom mobile-safe-top p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{CODE_DISPLAY_NAMES(code.id) || code.name} ga qaytish</span>
          </button>

          <Card className="card-default rounded-2xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={CODE_BADGE_COLORS(code.id) || ''}>
                      {CODE_DISPLAY_NAMES(code.id) || code.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedArticle.category || 'Modda'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {selectedArticle.number}-modda. {selectedArticle.title}
                  </CardTitle>
                </div>
                {/* AI Explain Button */}
                <button
                  onClick={() => handleAiExplain(selectedArticle, code.id)}
                  disabled={explainLoading && explainingArticle?.number === selectedArticle.number}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md disabled:opacity-60 flex-shrink-0"
                >
                  {explainLoading && explainingArticle?.number === selectedArticle.number ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  AI izohi
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {selectedArticle.content.split('\n').map((line, i) => {
                  const trimmed = line.trim()
                  if (!trimmed) return <br key={i} />
                  if (
                    trimmed.startsWith('•') ||
                    trimmed.startsWith('-') ||
                    trimmed.match(/^\d\)/)
                  ) {
                    return (
                      <li key={i} className="text-gray-700 dark:text-zinc-300 ml-4 mb-1">
                        {trimmed.replace(/^[•\-]\s*/, '').replace(/^\d\)\s*/, '')}
                      </li>
                    )
                  }
                  if (trimmed.match(/^[A-ZА-ЯЁ][A-ZА-ЯЁ\s]+$/)) {
                    return (
                      <h4
                        key={i}
                        className="font-semibold text-blue-700 dark:text-blue-400 mt-3 mb-1 text-sm uppercase tracking-wide"
                      >
                        {trimmed}
                      </h4>
                    )
                  }
                  return (
                    <p key={i} className="text-gray-700 dark:text-zinc-300 mb-2">
                      {trimmed}
                    </p>
                  )
                })}
              </div>

              {selectedArticle.penalties && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Jazo:</p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {selectedArticle.penalties}
                  </p>
                </div>
              )}

              {selectedArticle.references && selectedArticle.references.length > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                    Tegishli moddalar:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.references.map((ref, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40"
                      >
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Explain Result */}
              {explainingArticle?.number === selectedArticle.number && explainResult && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      AI izohi
                    </span>
                    <button
                      onClick={() => setExplainResult(null)}
                      className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                    {explainResult}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 text-xs text-gray-400 dark:text-zinc-500">
                <span>{CODE_DISPLAY_NAMES(code.id) || code.name}</span>
                <span>•</span>
                <span>Kuchga kirgan: {code.effectiveDate}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page-custom mobile-safe-top p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/qonunlar')}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Barcha kodekslar</span>
        </button>

        {/* Code Header */}
        <div
          className={`p-6 rounded-2xl bg-gradient-to-r ${CODE_COLORS(code.id) || 'from-blue-500 to-blue-600'} text-white mb-6`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              {CODE_ICONS(code.id) || <BookOpen className="w-8 h-8" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{CODE_DISPLAY_NAMES(code.id) || code.name}</h1>
              <p className="text-white/80 text-sm mt-1">{code.description}</p>
              <div className="flex items-center gap-4 mt-2 text-white/70 text-xs">
                <span>{code.totalArticles} ta modda</span>
                <span>•</span>
                <span>Kuchga kirgan: {code.effectiveDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search within code */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`${(CODE_DISPLAY_NAMES(code.id) || code.name).substring(0, 30)}... dan qidirish`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="space-y-2 mb-6">
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-2">
              {searchResults.length} ta natija topildi
            </p>
            {(searchResults ?? []).slice(0, 10).map((article, i) => (
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
              <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">
                Hech narsa topilmadi
              </p>
            )}
          </div>
        )}

        {/* Categories with pagination */}
        <div className="space-y-4">
          {categories.map(([cat, articles]) => {
            const catKey = `${code.id}:${cat}`
            const visibleCount = getVisibleCount(catKey)
            const visibleArticles = (articles ?? []).slice(0, visibleCount)
            const hasMore = articles.length > visibleCount

            return (
              <Card key={cat} className="card-default rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-blue-500" />
                    {cat}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {articles.length} ta modda
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {visibleArticles.map((article, i) => (
                      <div
                        key={i}
                        className="py-3 px-1 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setSelectedArticle(article)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {article.number}-modda
                            </span>
                            <span className="text-sm text-gray-700 dark:text-zinc-300 ml-2">
                              {article.title}
                            </span>
                          </button>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            {/* AI Explain button */}
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleAiExplain(article, code.id)
                              }}
                              className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                              title="AI izohi"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <ExternalLink className="w-3 h-3 text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </div>
                        {/* Inline AI explain result */}
                        {explainingArticle?.number === article.number && (
                          <div className="mt-2 pl-3 border-l-2 border-purple-300 dark:border-purple-700">
                            {explainLoading ? (
                              <div className="flex items-center gap-2 py-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                                <span className="text-xs text-purple-600 dark:text-purple-400">
                                  AI izohi yuklanmoqda...
                                </span>
                              </div>
                            ) : explainResult ? (
                              <div className="relative">
                                <div className="text-xs text-gray-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed line-clamp-6">
                                  {explainResult}
                                </div>
                                <button
                                  onClick={() => setSelectedArticle(article)}
                                  className="mt-1 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                                >
                                  To'liq o'qish →
                                </button>
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    setExplainResult(null)
                                    setExplainingArticle(null)
                                  }}
                                  className="absolute top-0 right-0 p-0.5 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <button
                      onClick={() => loadMore(catKey)}
                      className="w-full mt-2 py-2.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Yana {Math.min(articles.length - visibleCount, ARTICLES_PER_PAGE)} ta
                      ko'rsatish ({articles.length - visibleCount} ta qoldi)
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
