'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  Bookmark,
  Trash2,
  X,
  Search,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  FileText,
  Scale,
  Gavel,
  BookOpen,
  Landmark,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  useLegalCodes,
  type LegalCode,
  type LegalArticle as HookLegalArticle,
} from '@/hooks/useLegalDatabase'
import { getDisplayNameFromCodeId } from '@/lib/utils/code-mapper'

interface DisplayArticle {
  id: string
  title: string
  content: string
  category: string
  document_type: string
  article_number: string
  chapter: string
  section: string
  keywords: string[]
  cross_references: string[]
  last_updated: string
  relevance_score: number
  view_count: number
}

interface DisplayCategory {
  id: string
  name: string
  description: string
  document_count: number
  document_type: string
}

export default function LegalDatabase() {
  const { codes, loading, fromSupabase, search: searchCodes, getCode, refresh } = useLegalCodes()
  const [activeTab, setActiveTab] = useState<'search' | 'categories' | 'bookmarks'>('categories')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    { code: LegalCode; article: HookLegalArticle }[]
  >([])
  const [selectedCode, setSelectedCode] = useState<LegalCode | null>(null)
  const [codeSearchQuery, setCodeSearchQuery] = useState('')
  const [activeChapter, setActiveChapter] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<DisplayArticle | null>(null)
  const [showArticleModal, setShowArticleModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bookmarks, setBookmarks] = useState<string[]>([])

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('legal_bookmarks')
      if (stored) setBookmarks(JSON.parse(stored))
    } catch {}
  }, [])

  const saveBookmarks = (items: string[]) => {
    setBookmarks(items)
    try {
      localStorage.setItem('legal_bookmarks', JSON.stringify(items))
    } catch {}
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    const results = searchCodes(searchQuery.trim())
    setSearchResults(results)
  }

  const handleArticleClick = (code: LegalCode, article: HookLegalArticle) => {
    setSelectedArticle({
      id: `${code.id}-${article.number}`,
      title: `${getDisplayNameFromCodeId(code.id)} - ${article.number}-modda. ${article.title}`,
      content: article.content,
      category: article.category || 'Umumiy qoidalar',
      document_type: getDisplayNameFromCodeId(code.id),
      article_number: `${article.number}-modda`,
      chapter: article.category || 'Umumiy qoidalar',
      section: '',
      keywords: [getDisplayNameFromCodeId(code.id), ...article.title.split(' ').slice(0, 3)],
      cross_references: article.references || [],
      last_updated: code.effectiveDate,
      relevance_score: 100,
      view_count: 0,
    })
    setShowArticleModal(true)
  }

  const toggleBookmark = (articleId: string) => {
    if (bookmarks.includes(articleId)) {
      saveBookmarks(bookmarks.filter(id => id !== articleId))
    } else {
      saveBookmarks([...bookmarks, articleId])
    }
  }

  // ── Categories from Supabase ──
  const displayCategories: DisplayCategory[] = codes.map(code => ({
    id: code.id,
    name: getDisplayNameFromCodeId(code.id),
    description: code.description,
    document_count: code.totalArticles,
    document_type: 'Kodeks',
  }))

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 dark:text-zinc-400">Qonunlar bazasi yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  // ── Empty state ──
  if (!loading && codes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ma'lumot topilmadi</h2>
          <p className="text-gray-600 dark:text-zinc-400">
            Qonunlar bazasi hali to'liq yuklanmagan. Iltimos, Supabase SQL migratsiyani ishga
            tushirganingizni tekshiring.
          </p>
          <Button onClick={() => refresh()} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Loader2 className="w-4 h-4 mr-2" />
            Qayta yuklash
          </Button>
        </div>
      </div>
    )
  }

  // ── Bob/bo'lim navigatsiyasi ──────────────────────────────────────
  // Moddalar son tartibida kelgani uchun boblar ham kodeks tartibida chiqadi
  const getCodeChapters = (
    code: LegalCode
  ): { name: string; label: string; count: number }[] => {
    const result: { name: string; label: string; count: number }[] = []
    const seen = new Set<string>()
    for (const a of code.articles) {
      const ch = (a.category || 'Umumiy qoidalar').trim()
      if (!seen.has(ch)) {
        seen.add(ch)
        result.push({ name: ch, label: shortChapterLabel(ch), count: 0 })
      }
      result[result.length - 1].count++
    }
    return result
  }

  const shortChapterLabel = (name: string): string => {
    const trimmed = name.trim()
    const dotIdx = trimmed.indexOf('.')
    if (dotIdx > 0) return trimmed.slice(0, dotIdx + 1)
    return trimmed
  }

  // ── Render Code View ──
  const renderCodeView = () => {
    if (!selectedCode) return null

    const chapters = getCodeChapters(selectedCode)

    // Faol bob + qidiruv filtrini birga qo'llaymiz
    const filteredArticles = selectedCode.articles.filter(a => {
      if (activeChapter && (a.category || 'Umumiy qoidalar').trim() !== activeChapter) {
        return false
      }
      if (!codeSearchQuery) return true
      const q = codeSearchQuery.toLowerCase()
      return (
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.number.includes(q) ||
        (a.category || '').toLowerCase().includes(q)
      )
    })

    const renderArticleListItem = (article: HookLegalArticle) => (
      <div
        key={article.number}
        className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
        onClick={() => handleArticleClick(selectedCode, article)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                {article.number}-modda
              </span>
              {article.category && (
                <Badge className="bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 text-[10px]">
                  {shortChapterLabel(article.category)}
                </Badge>
              )}
            </div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              {article.title}
            </h4>
            <p className="text-xs text-secondary mt-1 line-clamp-2">{article.content}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {article.penalties && (
              <Badge className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-[10px]">
                {article.penalties.substring(0, 30)}...
              </Badge>
            )}
          </div>
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        <Card className="card-default rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedCode(null)
                    setCodeSearchQuery('')
                    setActiveChapter(null)
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
                  title="Orqaga"
                >
                  <ArrowLeft size={20} className="text-gray-600 dark:text-zinc-400" />
                </button>
                <div>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedCode.id === 'constitution' ? (
                      <Landmark size={20} className="text-blue-500" />
                    ) : selectedCode.id === 'criminal_code' ? (
                      <Gavel size={20} className="text-red-500" />
                    ) : selectedCode.id === 'civil_code' ? (
                      <Scale size={20} className="text-green-500" />
                    ) : (
                      <BookOpen size={20} className="text-blue-500" />
                    )}
                    {getDisplayNameFromCodeId(selectedCode.id)}
                  </CardTitle>
                  <p className="text-sm text-secondary mt-1">
                    {selectedCode.totalArticles} ta modda · {chapters.length} ta bob
                  </p>
                </div>
              </div>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={codeSearchQuery}
                  onChange={e => setCodeSearchQuery(e.target.value)}
                  placeholder="Modda raqami yoki matn bo'yicha..."
                  className="pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 w-56"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bob/bo'lim navigatsiyasi */}
            {chapters.length > 1 && (
              <div
                className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1"
                style={{ scrollbarWidth: 'thin' }}
              >
                <button
                  onClick={() => setActiveChapter(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    !activeChapter
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  Barcha bo'limlar
                </button>
                {chapters.map(ch => (
                  <button
                    key={ch.name}
                    onClick={() => setActiveChapter(ch.name)}
                    title={ch.name}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      activeChapter === ch.name
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {ch.label} <span className="opacity-70">({ch.count})</span>
                  </button>
                ))}
              </div>
            )}

            {activeChapter && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                {activeChapter} — {filteredArticles.length} ta modda
              </div>
            )}

            {filteredArticles.length === 0 ? (
              <p className="text-sm text-secondary text-center py-8">Hech qanday modda topilmadi</p>
            ) : activeChapter ? (
              <div className="space-y-3">{filteredArticles.map(renderArticleListItem)}</div>
            ) : (
              // Barcha bo'limlar — moddalar bob bo'yicha guruhlangan
              <div className="space-y-6">
                {chapters.map(ch => {
                  const chArticles = filteredArticles.filter(
                    a => (a.category || 'Umumiy qoidalar').trim() === ch.name
                  )
                  if (chArticles.length === 0) return null
                  return (
                    <div key={ch.name}>
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
                          {ch.name}
                        </h5>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                          ({chArticles.length})
                        </span>
                      </div>
                      <div className="space-y-3">{chArticles.map(renderArticleListItem)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Render Categories Tab (DEFAULT) ──
  const renderCategoriesTab = () => (
    <div className="space-y-6">
      <Card className="card-default rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            O'zbekiston Respublikasi Kodekslari
            {fromSupabase && (
              <Badge className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-[10px] align-middle">
                Supabase
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-secondary">
            {codes.length} ta kodeks, {codes.reduce((s, c) => s + c.articles.length, 0)} ta modda
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayCategories.map(category => (
              <div
                key={category.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer hover-lift"
                onClick={() => {
                  const matchingCode = codes.find(c => c.id === category.id)
                  if (matchingCode) {
                    setSelectedCode(matchingCode)
                    setActiveChapter(null)
                    setCodeSearchQuery('')
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {category.id === 'constitution' ? (
                    <Landmark size={20} className="text-blue-600" />
                  ) : category.id === 'criminal_code' ? (
                    <Gavel size={20} className="text-red-600" />
                  ) : category.id === 'civil_code' ? (
                    <Scale size={20} className="text-green-600" />
                  ) : category.id === 'labor_code' ? (
                    <FileText size={20} className="text-orange-600" />
                  ) : category.id === 'family_code' ? (
                    <BookOpen size={20} className="text-purple-600" />
                  ) : (
                    <FileText size={20} className="text-gray-600" />
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {category.name}
                  </h3>
                </div>
                <p className="text-xs text-secondary mb-3 line-clamp-2">{category.description}</p>
                <div className="flex justify-between items-center">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {category.document_count} ta modda
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ── Render Search Tab ──
  const renderSearchTab = () => (
    <div className="space-y-6">
      <Card className="card-default rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Qonunlarda Qidiruv</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Modda raqami, kalit so'z yoki matn..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Search size={16} className="mr-1.5" />
              Qidirish
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-secondary">{searchResults.length} ta natija topildi</p>
          {searchResults.map(({ code, article }) => (
            <div
              key={`${code.id}-${article.number}`}
              className="p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
              onClick={() => handleArticleClick(code, article)}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {getDisplayNameFromCodeId(code.id)}
                </Badge>
                <Badge className="bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-zinc-300">
                  {article.number}-modda
                </Badge>
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                {article.title}
              </h4>
              <p className="text-xs text-secondary mt-1 line-clamp-2">{article.content}</p>
            </div>
          ))}
        </div>
      )}

      {searchResults.length === 0 && searchQuery && (
        <Card className="card-default rounded-2xl">
          <CardContent className="py-8 text-center">
            <p className="text-secondary">Hech qanday natija topilmadi</p>
            <p className="text-xs text-secondary mt-1">Boshqa kalit so'zlar bilan urinib ko'ring</p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // ── Render Bookmarks Tab ──
  const renderBookmarksTab = () => (
    <div className="space-y-6">
      <Card className="card-default rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            Xatcho'plar ({bookmarks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookmarks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary">Xatcho'plar mavjud emas</p>
              <p className="text-xs text-secondary mt-1">
                Kategoriyalardan kodeks tanlab, moddalarni xatcho'pga qo'shing
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map(id => {
                const [codeId, articleNum] = id.split('-')
                const code = codes.find(c => c.id === codeId)
                const article = code?.articles.find(a => a.number === articleNum)
                if (!article || !code) return null
                return (
                  <div
                    key={id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                    onClick={() => handleArticleClick(code, article)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {getDisplayNameFromCodeId(code.id)}
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-zinc-300">
                            {article.number}-modda
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                          {article.title}
                        </h4>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation()
                          toggleBookmark(id)
                        }}
                        className="ml-2 flex-shrink-0"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // ── Article Modal ──
  const renderArticleModal = () => {
    if (!selectedArticle || !showArticleModal) return null

    // Oldingi/keyingi modda — kodeks ichida o'qish uchun
    const browseArticles = selectedCode?.articles || []
    const currentIdx = selectedCode
      ? browseArticles.findIndex(a => selectedArticle.id === `${selectedCode.id}-${a.number}`)
      : -1
    const prevArticle = currentIdx > 0 ? browseArticles[currentIdx - 1] : null
    const nextArticle =
      currentIdx >= 0 && currentIdx < browseArticles.length - 1
        ? browseArticles[currentIdx + 1]
        : null

    const copyArticle = async () => {
      try {
        await navigator.clipboard.writeText(
          `${selectedArticle.article_number}. ${selectedArticle.title}\n\n${selectedArticle.content}`
        )
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch {
        /* clipboard mavjud emas */
      }
    }

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={() => setShowArticleModal(false)}
      >
        <div
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedArticle.title}
                </h2>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {selectedArticle.article_number}
                  </Badge>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    {selectedArticle.category}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {selectedArticle.document_type}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!prevArticle}
                    onClick={() =>
                      prevArticle && selectedCode && handleArticleClick(selectedCode, prevArticle)
                    }
                    className="flex items-center gap-1"
                    title="Oldingi modda"
                  >
                    <ArrowLeft size={14} />
                    <span className="hidden sm:inline">Oldingi</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!nextArticle}
                    onClick={() =>
                      nextArticle && selectedCode && handleArticleClick(selectedCode, nextArticle)
                    }
                    className="flex items-center gap-1"
                    title="Keyingi modda"
                  >
                    <span className="hidden sm:inline">Keyingi</span>
                    <ArrowRight size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyArticle}
                    className="flex items-center gap-1"
                    title="Matnni nusxalash"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copied ? 'Nusxalandi' : 'Nusxa'}</span>
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleBookmark(selectedArticle.id)}
                >
                  <Bookmark
                    size={14}
                    className={
                      bookmarks.includes(selectedArticle.id) ? 'fill-blue-500 text-blue-500' : ''
                    }
                  />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowArticleModal(false)}>
                  <X size={14} />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                  Bob/Bo'lim:
                </h3>
                <p className="text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {selectedArticle.chapter}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2">Mazmun:</h3>
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {selectedArticle.content}
                  </p>
                </div>
              </div>

              {selectedArticle.keywords.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                    Kalit so'zlar:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.keywords.map((keyword, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedArticle.cross_references.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                    Tegishli moddalar:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.cross_references.map((ref, i) => (
                      <Badge
                        key={i}
                        className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      >
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Oldingi / Keyingi — kodeks bo'ylab o'qish */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={!prevArticle}
                onClick={() =>
                  prevArticle && selectedCode && handleArticleClick(selectedCode, prevArticle)
                }
                className="flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                <span className="max-w-[160px] truncate">
                  {prevArticle ? `${prevArticle.number}-modda` : ''}
                </span>
              </Button>
              <span className="text-xs text-gray-400 dark:text-zinc-500 flex-shrink-0">
                {selectedArticle.article_number} / {browseArticles.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!nextArticle}
                onClick={() =>
                  nextArticle && selectedCode && handleArticleClick(selectedCode, nextArticle)
                }
                className="flex items-center gap-1"
              >
                <span className="max-w-[160px] truncate">
                  {nextArticle ? `${nextArticle.number}-modda` : ''}
                </span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Qonunlar Bazasi</h1>
            <p className="text-gray-500 dark:text-zinc-400 mt-1">
              O'zbekiston Respublikasi qonunchilik ma'lumotlar bazasi
            </p>
          </div>
          {fromSupabase && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
              Supabase
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 glass rounded-xl p-1">
          {[
            { id: 'categories', label: 'Kategoriyalar' },
            { id: 'search', label: 'Qidiruv' },
            { id: 'bookmarks', label: `Xatcho'plar (${bookmarks.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedCode ? (
          renderCodeView()
        ) : (
          <>
            {activeTab === 'categories' && renderCategoriesTab()}
            {activeTab === 'search' && renderSearchTab()}
            {activeTab === 'bookmarks' && renderBookmarksTab()}
          </>
        )}

        {renderArticleModal()}
      </div>
    </div>
  )
}
