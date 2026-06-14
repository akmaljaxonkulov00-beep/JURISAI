'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/services/api';

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
      const response = await fetch('/api/legal-database?action=categories');
      
      if (!response.ok) {
        throw new Error('Kategoriyalarni yuklashda xatolik');
      }

      const data = await response.json();
      
      // Transform data to match expected format
      const transformedCategories: Category[] = data.categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
        document_count: cat.count,
        document_type: cat.name
      }));
      
      setCategories(transformedCategories);
      console.log('Legal categories loaded successfully');
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to empty array
      setCategories([]);
    }
  };

  const loadPopularDocuments = async () => {
    try {
      console.log('Loading popular documents...');
      const response = await fetch('/api/legal-database?action=popular');
      
      if (!response.ok) {
        throw new Error('Mashhur hujjatlarni yuklashda xatolik');
      }

      const data = await response.json();
      
      // Transform data to match expected format
      const transformedDocs: LegalArticle[] = data.documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        document_type: doc.category,
        article_number: doc.article_number,
        chapter: '1-bob',
        section: '',
        keywords: ['qonun', 'huquq', 'kodeks'],
        cross_references: [],
        last_updated: doc.last_updated,
        relevance_score: doc.relevance_score,
        view_count: doc.view_count
      }));
      
      setPopularDocuments(transformedDocs);
      console.log('Popular documents loaded successfully');
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
      
      const url = `/api/legal-database?action=search&query=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Qidiruv xatosi');
      }

      const data = await response.json();
      
      // Transform data to match expected format
      const transformedArticles: LegalArticle[] = data.articles.map((art: any) => ({
        id: art.id,
        title: art.title,
        content: art.content || art.description,
        category: art.category,
        document_type: art.category,
        article_number: art.article_number,
        chapter: '1-bob',
        section: '',
        keywords: ['qonun', 'huquq'],
        cross_references: [],
        last_updated: art.last_updated,
        relevance_score: art.relevance_score,
        view_count: art.view_count
      }));
      
      const searchResult: SearchResult = {
        articles: transformedArticles,
        total: data.total,
        query: searchQuery,
        search_time: data.search_time,
        suggestions: data.suggestions || []
      };
      
      setSearchResults(searchResult);
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
                        📚
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
                      🗑️
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
                ✕
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
                    📚 Bookmark qilish
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-900">Legal Database</h1>
          <p className="text-blue-700">O'zbekiston qonunchilik ma'lumotlar bazasi</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-1">
          {[
            { id: 'search', label: '🔍 Qidiruv', icon: '🔍' },
            { id: 'categories', label: '📚 Kategoriyalar', icon: '📚' },
            { id: 'popular', label: '⭐ Mashhur', icon: '⭐' },
            { id: 'bookmarks', label: '🔖 Bookmarklar', icon: '🔖' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
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
