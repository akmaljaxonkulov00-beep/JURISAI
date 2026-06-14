import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Input, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface LegalDocument {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  content: string;
  publication_date: string;
  effective_date: string;
  status: 'active' | 'repealed' | 'amended';
  keywords: string[];
  related_documents: string[];
  citations: number;
  last_updated: string;
}

interface SearchResult {
  documents: LegalDocument[];
  total_count: number;
  search_time: number;
  query: string;
}

const LegalDatabase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  const categories = [
    { value: 'all', label: 'Barchasi' },
    { value: 'civil_code', label: 'Fuqarolik kodeksi' },
    { value: 'criminal_code', label: 'Jinoyat kodeksi' },
    { value: 'family_code', label: 'Oila kodeksi' },
    { value: 'labor_code', label: 'Mehnat kodeksi' },
    { value: 'tax_code', label: 'Soliq kodeksi' },
    { value: 'constitutional', label: 'Konstitutsiyaviy' },
    { value: 'administrative', label: 'Ma\'muriy' }
  ];

  const documentTypes = [
    { value: 'all', label: 'Barchasi' },
    { value: 'law', label: 'Qonun' },
    { value: 'code', label: 'Kodeks' },
    { value: 'decree', label: 'Farmon' },
    { value: 'resolution', label: 'Qaror' },
    { value: 'instruction', label: 'Ko\'rsatma' },
    { value: 'regulation', label: 'Nizom' }
  ];

  const mockDocuments: LegalDocument[] = [
    {
      id: '1',
      title: 'O\'zbekiston Respublikasi Fuqarolik kodeksi',
      type: 'code',
      category: 'civil_code',
      description: 'Fuqarolik huquqiy munosabatlarini tartibga soluvchi asosiy qonun hujjati',
      content: 'O\'zbekiston Respublikasi Fuqarolik kodeksi fuqarolik huquqiy munosabatlarini tartibga soladi...',
      publication_date: '2022-12-25',
      effective_date: '2023-03-01',
      status: 'active',
      keywords: ['fuqarolik huquqi', 'shartnoma', 'mulkiy mas\'uliyat', 'meros'],
      related_documents: ['2', '3'],
      citations: 15420,
      last_updated: '2023-02-28'
    },
    {
      id: '2',
      title: 'O\'zbekiston Respublikasi Jinoyat kodeksi',
      type: 'code',
      category: 'criminal_code',
      description: 'Jinoyat va jazo huquqini belgilovchi asosiy qonun hujjati',
      content: 'O\'zbekiston Respublikasi Jinoyat kodeksi jamiyat uchun xavfli bo\'lgan harakatlarni...',
      publication_date: '1994-09-22',
      effective_date: '1994-10-01',
      status: 'active',
      keywords: ['jinoyat huquqi', 'jazo', 'jinoyat tarkibi', 'ayb'],
      related_documents: ['4', '5'],
      citations: 12350,
      last_updated: '2023-01-15'
    },
    {
      id: '3',
      title: 'O\'zbekiston Respublikasi Konstitutsiyasi',
      type: 'law',
      category: 'constitutional',
      description: 'O\'zbekiston Respublikasining asosiy qonuni',
      content: 'O\'zbekiston Respublikasi Konstitutsiyasi davlat suverenitetini, xalq hokimiyatini...',
      publication_date: '1992-12-08',
      effective_date: '1992-12-08',
      status: 'active',
      keywords: ['konstitutsiya', 'suverenitet', 'huquqiy davlat', 'inson huquqlari'],
      related_documents: ['1', '2'],
      citations: 45680,
      last_updated: '2023-04-01'
    },
    {
      id: '4',
      title: 'O\'zbekiston Respublikasi Mehnat kodeksi',
      type: 'code',
      category: 'labor_code',
      description: 'Mehnat huquqiy munosabatlarini tartibga soluvchi qonun hujjati',
      content: 'O\'zbekiston Respublikasi Mehnat kodeksi mehnat huquqiy munosabatlarini...',
      publication_date: '2022-09-23',
      effective_date: '2023-01-01',
      status: 'active',
      keywords: ['mehnat huquqi', 'ish haqi', 'mehnat shartnomasi', 'dam olish'],
      related_documents: ['5', '6'],
      citations: 8765,
      last_updated: '2022-12-15'
    },
    {
      id: '5',
      title: 'O\'zbekiston Respublikasi Soliq kodeksi',
      type: 'code',
      category: 'tax_code',
      description: 'Soliqqa oid munosabatlarni tartibga soluvchi qonun hujjati',
      content: 'O\'zbekiston Respublikasi Soliq kodeksi soliqqa oid munosabatlarni...',
      publication_date: '2022-12-30',
      effective_date: '2023-01-01',
      status: 'active',
      keywords: ['soliq', 'byudjet', 'soliq to\'lovlari', 'soliq imtiyozlari'],
      related_documents: ['7', '8'],
      citations: 6543,
      last_updated: '2023-02-20'
    }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Iltimos, qidiruv so\'zini kiriting');
      return;
    }

    setIsSearching(true);
    setActiveTab('results');

    try {
      // Real API call
      const response = await fetch('/api/legal/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          category: selectedCategory,
          type: selectedType,
          limit: 20
        })
      });

      if (!response.ok) {
        throw new Error('Qidiruv amalga oshmadi');
      }

      const data = await response.json();
      
      const result: SearchResult = {
        documents: data.documents || [],
        total_count: data.total_count || 0,
        search_time: data.search_time / 1000 || 0.8, // Convert ms to seconds
        query: data.query || searchQuery
      };

      setSearchResults(result);
      toast.success(`${result.total_count} ta hujjat topildi`);

    } catch (error) {
      toast.error('Qidiruv jarayonida xatolik yuz berdi');
      console.error('Search error:', error);
      
      // Fallback to empty results
      setSearchResults({
        documents: [],
        total_count: 0,
        search_time: 0,
        query: searchQuery
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDocumentSelect = (document: LegalDocument) => {
    setSelectedDocument(document);
    setActiveTab('document');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'repealed': return 'bg-red-100 text-red-800';
      case 'amended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'active': return 'Kuchda';
      case 'repealed': return 'Bekor qilingan';
      case 'amended': return 'O\'zgartirilgan';
      default: return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'law': return 'bg-blue-100 text-blue-800';
      case 'code': return 'bg-purple-100 text-purple-800';
      case 'decree': return 'bg-orange-100 text-orange-800';
      case 'resolution': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'law': return 'Qonun';
      case 'code': return 'Kodeks';
      case 'decree': return 'Farmon';
      case 'resolution': return 'Qaror';
      case 'instruction': return 'Ko\'rsatma';
      case 'regulation': return 'Nizom';
      default: return type;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Huquqiy ma\'lumotlar bazasi</h1>
        <p className="text-gray-600">O\'zbekiston qonun hujjatlarini qidiring va o\'qing</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Qidiruv</TabsTrigger>
          <TabsTrigger value="results">Natijalar</TabsTrigger>
          <TabsTrigger value="document">Hujjat</TabsTrigger>
          <TabsTrigger value="favorites">Tanlanganlar</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Qidiruv</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qidiruv so\'zi
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Qonun nomi, kalit so\'zlar yoki tavsif..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Qidirlanmoqda...
                      </>
                    ) : (
                      'Qidirish'
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoriya
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hujjat turi
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Fuqarolik huquqi</Badge>
                <Badge variant="outline">Jinoyat huquqi</Badge>
                <Badge variant="outline">Mehnat huquqi</Badge>
                <Badge variant="outline">Soliq huquqi</Badge>
                <Badge variant="outline">Oila huquqi</Badge>
                <Badge variant="outline">Ma\'muriy huquq</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Popular Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Mashhur hujjatlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockDocuments.slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleDocumentSelect(doc)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{doc.title}</h4>
                      <Badge className={getStatusColor(doc.status)} variant="outline">
                        {getStatusName(doc.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{doc.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{getTypeName(doc.type)}</span>
                      <span>{doc.citations.toLocaleString()} murojaat</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {searchResults ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Qidiruv natijalari ({searchResults.total_count})
                </h3>
                <span className="text-sm text-gray-500">
                  {searchResults.search_time} soniyada
                </span>
              </div>

              {searchResults.documents.length > 0 ? (
                searchResults.documents.map((doc) => (
                  <Card key={doc.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getTypeColor(doc.type)}>
                              {getTypeName(doc.type)}
                            </Badge>
                            <Badge className={getStatusColor(doc.status)}>
                              {getStatusName(doc.status)}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-medium mb-2">{doc.title}</h3>
                          <p className="text-gray-600 mb-3">{doc.description}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {doc.keywords.slice(0, 5).map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div>
                          <span>Effektiv sanasi: {doc.effective_date}</span>
                          <span className="mx-2">•</span>
                          <span>Oxirgi yangilanish: {doc.last_updated}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>{doc.citations.toLocaleString()} murojaat</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDocumentSelect(doc)}
                          >
                            O'qish
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-500">
                      <p>Hech qanday hujjat topilmadi</p>
                      <p className="text-sm mt-2">Boshqa kalit so\'zlar bilan urinib ko'ring</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Hali qidiruv amalga oshirilmagan</p>
                  <p className="text-sm mt-2">Qidiruv so\'zini kiriting</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="document" className="space-y-6">
          {selectedDocument ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{selectedDocument.title}</CardTitle>
                    <div className="flex space-x-2">
                      <Badge className={getTypeColor(selectedDocument.type)}>
                        {getTypeName(selectedDocument.type)}
                      </Badge>
                      <Badge className={getStatusColor(selectedDocument.status)}>
                        {getStatusName(selectedDocument.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">{selectedDocument.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Nashr sanasi:</span>
                        <p>{selectedDocument.publication_date}</p>
                      </div>
                      <div>
                        <span className="font-medium">Effektiv sanasi:</span>
                        <p>{selectedDocument.effective_date}</p>
                      </div>
                      <div>
                        <span className="font-medium">Oxirgi yangilanish:</span>
                        <p>{selectedDocument.last_updated}</p>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium">Kalit so\'zlar:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedDocument.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Yuklab olish
                      </Button>
                      <Button variant="outline">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Saqlash
                      </Button>
                      <Button variant="outline">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 10-5.367-2.684 3 3 0 005.367 2.684z" />
                        </svg>
                        Ulashish
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hujjat mazmuni</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedDocument.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Hujjat tanlanmagan</p>
                  <p className="text-sm mt-2">Qidiruv natijalaridan hujjat tanlang</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center text-gray-500">
                <p>Hali tanlangan hujjatlar yo'q</p>
                <p className="text-sm mt-2">Hujjatlarni qidiruv natijalarida saqlang</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { LegalDatabase };
