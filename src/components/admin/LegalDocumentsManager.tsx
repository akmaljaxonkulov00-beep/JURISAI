'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { supabaseClient } from '@/lib/supabase';
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Filter,
  Eye,
  FileText,
  BookOpen,
  Scale,
  Users,
  Home
} from 'lucide-react';

interface LegalDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  document_type: string;
  article_number: string;
  chapter: string;
  keywords: string[];
  cross_references: string[];
  last_updated: string;
  relevance_score: number;
  view_count: number;
}

interface LegalCategory {
  id: string;
  name: string;
  description: string;
  document_count: number;
  document_type: string;
}

export default function LegalDocumentsManager() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [categories, setCategories] = useState<LegalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    document_type: 'Code',
    article_number: '',
    chapter: '',
    keywords: '',
    cross_references: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadDocuments(), loadCategories()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
      .from('legal_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      return;
    }

    setDocuments(data || []);
  };

  const loadCategories = async () => {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
      .from('legal_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const handleAddDocument = async () => {
    if (!supabaseClient) return;

    try {
      const newDocument = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        document_type: formData.document_type,
        article_number: formData.article_number,
        chapter: formData.chapter,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        cross_references: formData.cross_references.split(',').map(k => k.trim()).filter(k => k),
        last_updated: new Date().toISOString(),
        relevance_score: 0,
        view_count: 0
      };

      const { error } = await supabaseClient
        .from('legal_documents')
        .insert(newDocument);

      if (error) {
        console.error('Error adding document:', error);
        return;
      }

      setShowAddModal(false);
      resetForm();
      await loadDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  const handleUpdateDocument = async () => {
    if (!supabaseClient || !selectedDocument) return;

    try {
      const updatedDocument = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        document_type: formData.document_type,
        article_number: formData.article_number,
        chapter: formData.chapter,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        cross_references: formData.cross_references.split(',').map(k => k.trim()).filter(k => k),
        last_updated: new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from('legal_documents')
        .update(updatedDocument)
        .eq('id', selectedDocument.id);

      if (error) {
        console.error('Error updating document:', error);
        return;
      }

      setShowEditModal(false);
      setSelectedDocument(null);
      resetForm();
      await loadDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!supabaseClient) return;

    if (!confirm('Rostdan ham bu hujjatni o\'chirmoqchimisiz?')) return;

    try {
      const { error } = await supabaseClient
        .from('legal_documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting document:', error);
        return;
      }

      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const openEditModal = (document: LegalDocument) => {
    setSelectedDocument(document);
    setFormData({
      title: document.title,
      content: document.content,
      category: document.category,
      document_type: document.document_type,
      article_number: document.article_number,
      chapter: document.chapter,
      keywords: document.keywords.join(', '),
      cross_references: document.cross_references.join(', ')
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      document_type: 'Code',
      article_number: '',
      chapter: '',
      keywords: '',
      cross_references: ''
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'Civil Code': return <BookOpen className="w-4 h-4" />;
      case 'Criminal Code': return <Scale className="w-4 h-4" />;
      case 'Constitution': return <Home className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Qonunlar Boshqaruvi</h2>
          <p className="text-gray-600">Qonun hujjatlarini qo'shish, tahrirlash va o'chirish</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yangi Hujjat Qo'shish
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Hujjatlar orasida qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Barcha kategoriyalar</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Hujjatlar ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getDocumentIcon(document.document_type)}
                      <h3 className="font-semibold text-gray-800">{document.title}</h3>
                      <Badge className="bg-blue-100 text-blue-800">
                        {document.article_number}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {document.content.substring(0, 200)}...
                    </p>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        {document.category}
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-800">
                        {document.document_type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {document.view_count} marta ko'rilgan
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(document)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteDocument(document.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredDocuments.length === 0 && (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Hujjatlar topilmadi</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Yangi Hujjat Qo'shish</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sarlavha
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Hujjat sarlavhasi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modda raqami
                    </label>
                    <Input
                      value={formData.article_number}
                      onChange={(e) => setFormData({...formData, article_number: e.target.value})}
                      placeholder="Masalan: 1-modda"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategoriya
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Kategoriyani tanlang</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hujjat turi
                    </label>
                    <select
                      value={formData.document_type}
                      onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Code">Kodeks</option>
                      <option value="Law">Qonun</option>
                      <option value="Constitution">Konstitutsiya</option>
                      <option value="Decree">Farmon</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bob
                  </label>
                  <Input
                    value={formData.chapter}
                    onChange={(e) => setFormData({...formData, chapter: e.target.value})}
                    placeholder="Masalan: 1-bob. Umumiy qoidalar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mazmun
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Hujjat to'liq mazmunini kiriting..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kalit so'zlar
                    </label>
                    <Input
                      value={formData.keywords}
                      onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                      placeholder="kalit so'z1, kalit so'z2, kalit so'z3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cross-references
                    </label>
                    <Input
                      value={formData.cross_references}
                      onChange={(e) => setFormData({...formData, cross_references: e.target.value})}
                      placeholder="FK 2-modda, JK 3-modda"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  onClick={handleAddDocument}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Saqlash
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Bekor qilish
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Hujjatni Tahrirlash</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sarlavha
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Hujjat sarlavhasi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modda raqami
                    </label>
                    <Input
                      value={formData.article_number}
                      onChange={(e) => setFormData({...formData, article_number: e.target.value})}
                      placeholder="Masalan: 1-modda"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategoriya
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Kategoriyani tanlang</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hujjat turi
                    </label>
                    <select
                      value={formData.document_type}
                      onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Code">Kodeks</option>
                      <option value="Law">Qonun</option>
                      <option value="Constitution">Konstitutsiya</option>
                      <option value="Decree">Farmon</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bob
                  </label>
                  <Input
                    value={formData.chapter}
                    onChange={(e) => setFormData({...formData, chapter: e.target.value})}
                    placeholder="Masalan: 1-bob. Umumiy qoidalar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mazmun
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Hujjat to'liq mazmunini kiriting..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kalit so'zlar
                    </label>
                    <Input
                      value={formData.keywords}
                      onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                      placeholder="kalit so'z1, kalit so'z2, kalit so'z3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cross-references
                    </label>
                    <Input
                      value={formData.cross_references}
                      onChange={(e) => setFormData({...formData, cross_references: e.target.value})}
                      placeholder="FK 2-modda, JK 3-modda"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  onClick={handleUpdateDocument}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Saqlash
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Bekor qilish
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
