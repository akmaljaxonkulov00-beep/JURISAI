'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Bookmark, Trash2, X, Search } from 'lucide-react';
import { api } from '@/services/api';

// Fallback data - O'zbekiston qonunlari
const fallbackDocs: LegalArticle[] = [
  {
    id: 'const-1',
    title: 'O\'zbekiston Respublikasi Konstitutsiyasi',
    content: 'O\'zbekiston Respublikasi Konstitutsiyasi 1992-yil 8-dekabrda qabul qilingan. Konstitutsiya O\'zbekistonning asosiy qonuni bo\'lib, davlat tuzilishi, inson huquqlari va erkinliklarini belgilaydi. 2023-yil 30-aprelda yangi tahrirda qabul qilingan.',
    category: 'Konstitutsiya',
    document_type: 'Konstitutsiya',
    article_number: 'Asosiy qonun',
    chapter: '1-bob. Davlat suvereniteti',
    section: '1-modda. O\'zbekiston - suveren demokratik respublika',
    keywords: ['konstitutsiya', 'asosiy qonun', 'davlat', 'huquq'],
    cross_references: [],
    last_updated: '2023-04-30',
    relevance_score: 100,
    view_count: 15420
  },
  {
    id: 'criminal-1',
    title: 'Jinoyat kodeksi - 97-modda. Qasddan odam o\'ldirish',
    content: 'Qasddan odam o\'ldirish, ya\'ni boshqa shaxsga qasddan o\'lim yetkazish, o\'n yildan o\'n besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi. Agar og\'irlashtiruvchi holatlar bo\'lsa, jazo muddati oshirilishi mumkin.',
    category: 'Jinoyat huquqi',
    document_type: 'Kodeks',
    article_number: '97-modda',
    chapter: '3-bob. Jinoyat turlari',
    section: 'Jinoyat kodeksi umumiy qism',
    keywords: ['jinoyat', 'odam oldirish', 'qasd', 'jazo'],
    cross_references: ['JK 98-modda', 'JK 25-modda'],
    last_updated: '2023-09-01',
    relevance_score: 98,
    view_count: 12350
  },
  {
    id: 'civil-1',
    title: 'Fuqarolik kodeksi - 375-modda. Shartnoma tuzish',
    content: 'Fuqarolik kodeksining 375-moddasiga ko\'ra, shartnoma ikki yoki undan ortiq shaxslarning fuqarolik huquq va majburiyatlarini belgilash, o\'zgartirish yoki bekor qilish to\'g\'risidagi kelishuvi hisoblanadi. Shartnoma erkinligi printsipi asosida tuziladi.',
    category: 'Fuqarolik huquqi',
    document_type: 'Kodeks',
    article_number: '375-modda',
    chapter: '5-bob. Shartnoma huquqi',
    section: 'Shartnoma tushunchasi va turlari',
    keywords: ['fuqarolik', 'shartnoma', 'kelishuv', 'majburiyat'],
    cross_references: ['FK 354-modda', 'FK 380-modda'],
    last_updated: '2024-01-15',
    relevance_score: 95,
    view_count: 8920
  },
  {
    id: 'family-1',
    title: 'Oila kodeksi - 1-modda. Oila to\'g\'risidagi qonun hujjatlari',
    content: 'Oila kodeksi O\'zbekiston Respublikasida oila munosabatlarini tartibga soladi. Nikoh ixtiyoriy va teng huquqli asosda tuziladi. Nikoh yoshi 18 yosh etib belgilanadi.',
    category: 'Oila huquqi',
    document_type: 'Kodeks',
    article_number: '1-modda',
    chapter: '1-bob. Umumiy qoidalar',
    section: 'Oila qonunchiligi asoslari',
    keywords: ['oila', 'nikoh', 'ajralish', 'bola huquqlari'],
    cross_references: ['OK 15-modda', 'OK 22-modda'],
    last_updated: '2023-06-01',
    relevance_score: 92,
    view_count: 7650
  },
  {
    id: 'labor-1',
    title: 'Mehnat kodeksi - 100-modda. Mehnat shartnomasi',
    content: 'Mehnat shartnomasi xodim va ish beruvchi o\'rtasida tuziladigan kelishuv bo\'lib, unda taraflarning huquq va majburiyatlari belgilanadi. Mehnat shartnomasi muddatsiz yoki muddatli tuzilishi mumkin.',
    category: 'Mehnat huquqi',
    document_type: 'Kodeks',
    article_number: '100-modda',
    chapter: '6-bob. Mehnat shartnomasi',
    section: '',
    keywords: ['mehnat', 'shartnoma', 'xodim', 'ish beruvchi'],
    cross_references: ['MK 105-modda', 'MK 120-modda'],
    last_updated: '2024-03-01',
    relevance_score: 90,
    view_count: 6540
  }
];

interface LegalArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  document_type: string;
  article_number: string;
  chapter: string;
  section?: string;
  keywords: string[];
  cross_references: string[];
  last_updated: string;
  relevance_score: number;
  view_count: number;
}

interface SearchResult {
  articles: LegalArticle[];
  total: number;
  query: string;
  search_time: number;
  suggestions: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  document_count: number;
  document_type: string;
}

export default function LegalDatabase() {
  const [activeTab, setActiveTab] = useState<'search' | 'categories' | 'popular' | 'bookmarks'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularDocuments, setPopularDocuments] = useState<LegalArticle[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<LegalArticle | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadPopularDocuments();
    loadBookmarks();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadPopularDocuments();
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      console.log('Loading legal categories...');
      
      // Use fallback data if API fails - O'zbekiston qonunlari
      const fallbackCategories: Category[] = [
        { id: 'constitution', name: 'Konstitutsiya', description: 'O\'zbekiston Respublikasi Konstitutsiyasi', document_count: 1, document_type: 'Konstitutsiya' },
        { id: 'criminal', name: 'Jinoyat huquqi', description: 'Jinoyat kodeksi va jinoyat-protsessual kodeksi', document_count: 2, document_type: 'Kodeks' },
        { id: 'civil', name: 'Fuqarolik huquqi', description: 'Fuqarolik kodeksi va fuqarolik-protsessual kodeksi', document_count: 2, document_type: 'Kodeks' },
        { id: 'family', name: 'Oila huquqi', description: 'Oila kodeksi', document_count: 1, document_type: 'Kodeks' },
        { id: 'labor', name: 'Mehnat huquqi', description: 'Mehnat kodeksi', document_count: 1, document_type: 'Kodeks' },
        { id: 'administrative', name: 'Ma\'muriy huquq', description: 'Ma\'muriy javobgarlik to\'g\'risidagi kodeks', document_count: 1, document_type: 'Kodeks' },
        { id: 'tax', name: 'Soliq huquqi', description: 'Soliq kodeksi', document_count: 1, document_type: 'Kodeks' },
        { id: 'land', name: 'Yer huquqi', description: 'Yer kodeksi', document_count: 1, document_type: 'Kodeks' },
      ];
      
      try {
        const response = await fetch('/api/legal-database?action=categories');
        if (response.ok) {
          const data = await response.json();
          const cats = data?.categories || [];
          if (cats.length > 0) {
            const transformedCategories: Category[] = cats.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              description: cat.description || '',
              document_count: cat.count || 0,
              document_type: cat.name
            }));
            setCategories(transformedCategories);
            console.log('Legal categories loaded from API');
            return;
          }
        }
      } catch {}
      
      setCategories(fallbackCategories);
      console.log('Using fallback legal categories');
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to empty array
      setCategories([]);
    }
  };

  const loadPopularDocuments = async () => {
    try {
      console.log('Loading popular documents...');
      
      try {
        const response = await fetch('/api/legal-database?action=popular');
        if (response.ok) {
          const data = await response.json();
          const docs = data?.documents || [];
          if (docs.length > 0) {
            const transformedDocs: LegalArticle[] = docs.map((doc: any) => ({
              id: doc?.id || 'doc_' + Math.random().toString(36).slice(2),
              title: doc?.title || 'Noma\'lum hujjat',
              content: doc?.content || doc?.description || '',
              category: doc?.category || 'Umumiy',
              document_type: doc?.category || 'Umumiy',
              article_number: doc?.article_number || '',
              chapter: '1-bob',
              section: '',
              keywords: doc?.keywords || ['qonun', 'huquq'],
              cross_references: doc?.cross_references || [],
              last_updated: doc?.last_updated || new Date().toISOString().split('T')[0],
              relevance_score: doc?.relevance_score || 0,
              view_count: doc?.view_count || 0
            }));
            setPopularDocuments(transformedDocs);
            console.log('Popular documents loaded from API');
            return;
          }
        }
      } catch {}
      
      setPopularDocuments(fallbackDocs);
      console.log('Using fallback legal documents');
    } catch (error) {
      console.error('Error loading popular documents:', error);
      setPopularDocuments([]);
    }
  };

  const loadBookmarks = async () => {
    try {
      console.log('Loading bookmarks...');
      const stored = localStorage.getItem('legal_bookmarks');
      if (stored) {
        setBookmarks(JSON.parse(stored));
      } else {
        setBookmarks([]);
      }
      console.log('Bookmarks loaded successfully');
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarks([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      console.log('Searching legal database for:', searchQuery);
      
      // Search in fallback data
      const query = searchQuery.toLowerCase();
      const fallbackResults = fallbackDocs.filter(d => 
        d.title.toLowerCase().includes(query) || 
        d.content.toLowerCase().includes(query) ||
        d.keywords.some(k => k.toLowerCase().includes(query)) ||
        d.category.toLowerCase().includes(query)
      );
      
      try {
        const url = `/api/legal-database?action=search&query=${encodeURIComponent(searchQuery)}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const articles = data?.articles || [];
          if (articles.length > 0) {
            const transformedArticles: LegalArticle[] = articles.map((art: any) => ({
              id: art?.id || 'art_' + Math.random().toString(36).slice(2),
              title: art?.title || 'Noma\'lum hujjat',
              content: art?.content || art?.description || '',
              category: art?.category || 'Umumiy',
              document_type: art?.category || 'Umumiy',
              article_number: art?.article_number || '',
              chapter: '1-bob',
              section: '',
              keywords: art?.keywords || ['qonun', 'huquq'],
              cross_references: art?.cross_references || [],
              last_updated: art?.last_updated || new Date().toISOString().split('T')[0],
              relevance_score: art?.relevance_score || 0,
              view_count: art?.view_count || 0
            }));
            setSearchResults({
              articles: transformedArticles,
              total: data.total || transformedArticles.length,
              query: searchQuery,
              search_time: data.search_time || 0.5,
              suggestions: data.suggestions || []
            });
            setLoading(false);
            return;
          }
        }
      } catch {}
      
      // Use fallback search results
      setSearchResults({
        articles: fallbackResults,
        total: fallbackResults.length,
        query: searchQuery,
        search_time: 0.3,
        suggestions: ['Konstitutsiya', 'Jinoyat kodeksi', 'Fuqarolik kodeksi', 'Oila kodeksi', 'Mehnat kodeksi']
      });
      console.log('Search results loaded successfully');
    } catch (error) {
      console.error('Search error:', error);
      alert('Qidiruv xatosi. Qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = async (article: LegalArticle) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const handleBookmark = async (articleId: string) => {
    try {
      console.log('Bookmarking article:', articleId);
      
      const newBookmark = {
        id: 'bm_' + Date.now(),
        article_id: articleId,
        document_id: articleId,
        title: 'Bookmark',
        created_at: new Date().toISOString()
      };
      
      const updatedBookmarks = [...bookmarks, newBookmark];
      setBookmarks(updatedBookmarks);
      localStorage.setItem('legal_bookmarks', JSON.stringify(updatedBookmarks));
      
      alert('Xatcho\'pga qo\'shildi!');
      console.log('Bookmark added successfully');
    } catch (error) {
      console.error('Bookmark error:', error);
      alert('Xatcho\'pga qo\'shishda xatolik.');
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      console.log('Removing bookmark:', bookmarkId);
      
      const updatedBookmarks = bookmarks.filter(bm => bm.id !== bookmarkId);
      setBookmarks(updatedBookmarks);
      localStorage.setItem('legal_bookmarks', JSON.stringify(updatedBookmarks));
      
      alert('Xatcho\'pdan o\'chirildi!');
      console.log('Bookmark removed successfully');
    } catch (error) {
      console.error('Remove bookmark error:', error);
      alert('Xatcho\'pdan o\'chirishda xatolik.');
    }
  };

  const renderSearchTab = () => (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-900">Qonunlarda Qidiruv</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Qidiruv so'zini kiriting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Qidirilmoqda...' : 'Qidirish'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategoriyani tanlang
              </label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: '', label: 'Barcha kategoriyalar' },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hujjat turini tanlang
              </label>
              <Select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                options={[
                  { value: '', label: 'Barcha turlar' },
                  { value: 'code', label: 'Kodeks' },
                  { value: 'law', label: 'Qonun' },
                  { value: 'decree', label: 'Farmon' },
                  { value: 'constitution', label: 'Konstitutsiya' }
                ]}
              />
            </div>
          </div>

          {/* Search Suggestions */}
          {searchResults?.suggestions && searchResults.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Takliflar:</span>
              {searchResults.suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  className="bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    handleSearch();
                  }}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-blue-900">
              Qidiruv Natijalari ({searchResults.total} ta)
            </CardTitle>
            <p className="text-sm text-gray-600">
              Qidiruv vaqti: {searchResults.search_time.toFixed(2)} soniya
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.articles.map((article) => (
                <div
                  key={article.id}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:border-blue-400 transition-all cursor-pointer"
                  onClick={() => handleArticleClick(article)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-blue-900">{article.title}</h3>
                    <Badge className="bg-blue-100 text-blue-800">
                      {article.article_number}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {article.content}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        {article.category}
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-800">
                        {article.document_type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-500">
                        {article.view_count} marta ko'rilgan
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmark(article.id);
                        }}
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-900">Qonun Kategoriyalari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:border-blue-400 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedCategory(category.id);
                  setActiveTab('popular');
                }}
              >
                <h3 className="font-semibold text-blue-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                <div className="flex justify-between items-center">
                  <Badge className="bg-green-100 text-green-800">
                    {category.document_count} hujjat
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800">
                    {category.document_type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPopularTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-900">
            Mashhur Qonun Hujjatlari
            {selectedCategory && ` - ${categories.find(c => c.id === selectedCategory)?.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popularDocuments.map((article, index) => (
              <div
                key={article.id}
                className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 hover:border-orange-400 transition-all cursor-pointer"
                onClick={() => handleArticleClick(article)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800">
                      #{index + 1}
                    </Badge>
                    <h3 className="font-semibold text-blue-900">{article.title}</h3>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {article.article_number}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {article.content}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      {article.category}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800">
                      {article.document_type}
                    </Badge>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">
                    {article.view_count} marta ko'rilgan
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBookmarksTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-900">Bookmarklar ({bookmarks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bookmarks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Bookmarklar mavjud emas</p>
              <Button
                onClick={() => setActiveTab('search')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Qidiruvga o'tish
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-400 transition-all cursor-pointer"
                  onClick={() => {
                    // Load and show the bookmarked document
                    handleSearch();
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        Hujjat ID: {bookmark.document_id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(bookmark.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark(bookmark.document_id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderArticleModal = () => {
    if (!selectedArticle || !showArticleModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-blue-900 mb-2">
                  {selectedArticle.title}
                </h2>
                <div className="flex gap-2 mb-4">
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedArticle.article_number}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    {selectedArticle.category}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800">
                    {selectedArticle.document_type}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowArticleModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bob:</h3>
                <p className="text-gray-700">{selectedArticle.chapter}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mazmun:</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedArticle.content}
                  </p>
                </div>
              </div>

              {selectedArticle.keywords.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Kalit so'zlar:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.keywords.map((keyword, index) => (
                      <Badge key={index} className="bg-gray-100 text-gray-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Oxirgi yangilanish: {new Date(selectedArticle.last_updated).toLocaleDateString('uz-UZ')}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBookmark(selectedArticle.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Bookmark className="w-4 h-4 mr-1.5" /> Bookmark qilish
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Qonunlar Bazasi</h1>
          <p className="text-gray-500 dark:text-gray-400">O'zbekiston qonunchilik ma'lumotlar bazasi</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 glass rounded-xl p-1">
          {[
            { id: 'search', label: 'Qidiruv' },
            { id: 'categories', label: 'Kategoriyalar' },
            { id: 'popular', label: 'Mashhur' },
            { id: 'bookmarks', label: "Xatcho'plar" }
          ].map((tab) => (
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
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'categories' && renderCategoriesTab()}
        {activeTab === 'popular' && renderPopularTab()}
        {activeTab === 'bookmarks' && renderBookmarksTab()}

        {/* Article Modal */}
        {renderArticleModal()}
      </div>
    </div>
  );
}
