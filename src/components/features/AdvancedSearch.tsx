'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Search, Filter, Calendar, FileText, BookOpen, Scale, Database, Clock, TrendingUp, Download, Bookmark, ExternalLink, Star, Eye, X } from 'lucide-react';

interface SearchFilters {
  query: string;
  category: string;
  documentType: string;
  dateRange: string;
  sortBy: string;
  language: string;
  relevance: number;
  hasFullText: boolean;
  isBookmarked: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  documentType: string;
  articleNumber?: string;
  url: string;
  relevanceScore: number;
  viewCount: number;
  lastUpdated: string;
  language: string;
  hasFullText: boolean;
  isBookmarked: boolean;
  tags: string[];
  highlights: string[];
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  resultsCount: number;
  filters: Partial<SearchFilters>;
}

export default function AdvancedSearch() {
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'bookmarks' | 'trending'>('search');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    documentType: 'all',
    dateRange: 'all',
    sortBy: 'relevance',
    language: 'uz',
    relevance: 0,
    hasFullText: false,
    isBookmarked: false
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadSearchHistory();
    loadTrendingSearches();
  }, []);

  const loadSearchHistory = async () => {
    try {
      // Mock search history
      const mockHistory: SearchHistory[] = [
        {
          id: '1',
          query: 'fuqarolik kodeksi shartnoma',
          timestamp: '2024-05-08T10:30:00Z',
          resultsCount: 127,
          filters: { category: 'civil', documentType: 'code' }
        },
        {
          id: '2',
          query: 'mehnat kodeksi ish haqi',
          timestamp: '2024-05-07T14:20:00Z',
          resultsCount: 89,
          filters: { category: 'labor', documentType: 'code' }
        },
        {
          id: '3',
          query: 'da\'vo muddati',
          timestamp: '2024-05-06T09:15:00Z',
          resultsCount: 45,
          filters: { category: 'civil', documentType: 'code' }
        }
      ];
      setSearchHistory(mockHistory);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const loadTrendingSearches = async () => {
    try {
      // Mock trending searches
      const mockSuggestions = [
        'fuqarolik kodeksi',
        'mehnat kodeksi',
        'jinoyat kodeksi',
        'oilaviy kodeksi',
        'shartnoma',
        'da\'vo muddati',
        'ish haqi',
        'ajralish',
        'meros',
        'ijara'
      ];
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSearch = async () => {
    if (!filters.query.trim()) return;

    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'O\'zbekiston Respublikasi Fuqarolik kodeksi',
          content: 'Fuqarolik kodeksi - fuqarolik-huquqiy munosabatlarini tartibga soluvchi asosiy qonun hujjati. U 1-iyul 1996-yildan kuchga kirgan. Kodeks fuqarolarning huquq va majburiyatlarini, shartnomalar, mulk huquqi, meros huquqi kabi masalalarni tartibga soladi.',
          category: 'civil',
          documentType: 'code',
          articleNumber: '1-modda',
          url: 'https://lex.uz/acts/-/text/1492387',
          relevanceScore: 95,
          viewCount: 15420,
          lastUpdated: '2024-01-15',
          language: 'uz',
          hasFullText: true,
          isBookmarked: false,
          tags: ['fuqarolik', 'kodeksi', 'asosiy', 'huquq'],
          highlights: ['<mark>Fuqarolik kodeksi</mark>', '<mark>fuqarolik-huquqiy munosabatlar</mark>', 'tartibga soluvchi']
        },
        {
          id: '2',
          title: 'Shartnoma turlari va ularning xususiyatlari',
          content: 'Shartnoma - tomonlarning o\'zaro kelishuvi asosida vujudga keladigan huquqiy munosabat. Fuqarolik kodeksiga ko\'ra, shartnoma tomonlarning o\'zaro xohish-irodasi bilan tuziladi.',
          category: 'civil',
          documentType: 'article',
          articleNumber: '342-modda',
          url: 'https://lex.uz/acts/-/text/1492387#342',
          relevanceScore: 88,
          viewCount: 8934,
          lastUpdated: '2024-02-20',
          language: 'uz',
          hasFullText: true,
          isBookmarked: true,
          tags: ['shartnoma', 'turlari', 'xususiyatlari', 'kelishuv'],
          highlights: ['<mark>Shartnoma</mark>', 'tomonlarning o\'zaro kelishuvi', '<mark>huquqiy munosabat</mark>']
        },
        {
          id: '3',
          title: 'Da\'vo muddatlari va ularning hisoblanishi',
          content: 'Da\'vo muddati - sudga murojaat qilish uchun belgilangan vaqt. Fuqarolik kodeksiga ko\'ra, da\'vo muddati qonunda belgilangan muddatlarda qo\'llaniladi.',
          category: 'civil',
          documentType: 'article',
          articleNumber: '77-modda',
          url: 'https://lex.uz/acts/-/text/1492387#77',
          relevanceScore: 82,
          viewCount: 12456,
          lastUpdated: '2024-03-10',
          language: 'uz',
          hasFullText: true,
          isBookmarked: false,
          tags: ['da\'vo', 'muddat', 'sud', 'murojaat'],
          highlights: ['<mark>Da\'vo muddati</mark>', 'sudga murojaat qilish', 'belgilangan vaqt']
        }
      ];

      setSearchResults(mockResults);
      
      // Add to search history
      const newHistoryItem: SearchHistory = {
        id: Date.now().toString(),
        query: filters.query,
        timestamp: new Date().toISOString(),
        resultsCount: mockResults.length,
        filters: { ...filters }
      };
      
      setSearchHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (resultId: string) => {
    setSearchResults(prev => 
      prev.map(result => 
        result.id === resultId 
          ? { ...result, isBookmarked: !result.isBookmarked }
          : result
      )
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'civil': return <Database className="w-4 h-4 text-blue-600" />;
      case 'criminal': return <Scale className="w-4 h-4 text-red-600" />;
      case 'labor': return <BookOpen className="w-4 h-4 text-green-600" />;
      case 'family': return <FileText className="w-4 h-4 text-purple-600" />;
      default: return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'code': return 'bg-blue-100 text-blue-800';
      case 'law': return 'bg-green-100 text-green-800';
      case 'article': return 'bg-purple-100 text-purple-800';
      case 'regulation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(searchResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `search-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Qidiruv</h1>
        <p className="text-gray-600">Qonunlar bazasida chuqur qidiruv</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Qonun, modda, yoki kalit so'zni kiriting..."
                  value={filters.query}
                  onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                  className="pl-10 pr-4"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              {/* Suggestions */}
              {suggestions.length > 0 && filters.query && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.slice(0, 5).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, query: suggestion }))}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtrlar
              </Button>
              <Button onClick={handleSearch} disabled={loading || !filters.query.trim()}>
                {loading ? 'Qidirilmoqda...' : 'Qidiruv'}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Barchasi</option>
                    <option value="civil">Fuqarolik</option>
                    <option value="criminal">Jinoyat</option>
                    <option value="labor">Mehnat</option>
                    <option value="family">Oilaviy</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hujjat turi</label>
                  <select
                    value={filters.documentType}
                    onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Barchasi</option>
                    <option value="code">Kodeks</option>
                    <option value="law">Qonun</option>
                    <option value="article">Maqola</option>
                    <option value="regulation">Reglament</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sana oralig'i</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Barchasi</option>
                    <option value="7d">7 kun</option>
                    <option value="30d">30 kun</option>
                    <option value="90d">90 kun</option>
                    <option value="1y">1 yil</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tartiblash</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Ahamiyati bo'yicha</option>
                    <option value="date">Sana bo'yicha</option>
                    <option value="views">Ko'rishlar bo'yicha</option>
                    <option value="alphabetical">Alifbo bo'yicha</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.hasFullText}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasFullText: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">To'liq matn bor</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.isBookmarked}
                    onChange={(e) => setFilters(prev => ({ ...prev, isBookmarked: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Saqlanganlar</span>
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'search' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Qidiruv natijalari</span>
            {searchResults.length > 0 && (
              <Badge variant="secondary">{searchResults.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'history' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Tarix</span>
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'bookmarks' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saqlanganlar</span>
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'trending' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Trendlar</span>
          </button>
        </div>
      </div>

      {/* Search Results */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Qidirilmoqda...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Natija topilmadi</p>
                <p className="text-gray-500 text-sm mt-2">Boshqa kalit so'zlar bilan urinib ko'ring</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  {searchResults.length} ta natija topildi
                </p>
                <Button variant="outline" size="sm" onClick={exportResults}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              
              {searchResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getCategoryIcon(result.category)}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {result.title}
                          </h3>
                          <Badge className={getDocumentTypeColor(result.documentType)}>
                            {result.documentType}
                          </Badge>
                          {result.articleNumber && (
                            <Badge variant="outline">{result.articleNumber}</Badge>
                          )}
                        </div>
                        
                        <div 
                          className="text-gray-700 mb-3"
                          dangerouslySetInnerHTML={{ __html: result.content }}
                        />
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {result.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{result.viewCount.toLocaleString()}</span>
                            </span>
                            <span>Relevance: {result.relevanceScore}%</span>
                            <span>{new Date(result.lastUpdated).toLocaleDateString('uz-UZ')}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBookmark(result.id)}
                            >
                              <Bookmark className={`w-4 h-4 ${result.isBookmarked ? 'fill-current text-blue-600' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedResult(result)}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Search History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {searchHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Qidiruv tarixi yo'q</p>
              </CardContent>
            </Card>
          ) : (
            searchHistory.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.query}</h4>
                      <p className="text-sm text-gray-600">
                        {item.resultsCount} ta natija • {new Date(item.timestamp).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.filters.category && (
                        <Badge variant="outline">{item.filters.category}</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, query: item.query, ...item.filters }));
                          setActiveTab('search');
                          handleSearch();
                        }}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {searchResults.filter(r => r.isBookmarked).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Saqlangan natijalar yo'q</p>
              </CardContent>
            </Card>
          ) : (
            searchResults.filter(r => r.isBookmarked).map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{result.title}</h3>
                      <p className="text-gray-600 text-sm">{result.category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmark(result.id)}
                    >
                      <Bookmark className="w-4 h-4 fill-current text-blue-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Trending */}
      {activeTab === 'trending' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-semibold">{suggestion}</h4>
                      <p className="text-sm text-gray-600">{Math.floor(Math.random() * 1000 + 100)} marta qidirilgan</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilters(prev => ({ ...prev, query: suggestion }));
                      setActiveTab('search');
                      handleSearch();
                    }}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Result Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedResult.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedResult(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(selectedResult.category)}
                  <Badge className={getDocumentTypeColor(selectedResult.documentType)}>
                    {selectedResult.documentType}
                  </Badge>
                  {selectedResult.articleNumber && (
                    <Badge variant="outline">{selectedResult.articleNumber}</Badge>
                  )}
                </div>
                
                <div 
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{ __html: selectedResult.content }}
                />
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>View: {selectedResult.viewCount.toLocaleString()}</span>
                    <span>Relevance: {selectedResult.relevanceScore}%</span>
                    <span>{new Date(selectedResult.lastUpdated).toLocaleDateString('uz-UZ')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBookmark(selectedResult.id)}
                    >
                      <Bookmark className={`w-4 h-4 ${selectedResult.isBookmarked ? 'fill-current text-blue-600' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedResult.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
