'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { aiClient } from '@/lib/ai-client';
import { FileText, ArrowLeft, Download, Edit3, Plus, Clock } from 'lucide-react';

import documentTemplatesData from '@/data/document-templates.json';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: DocumentField[];
}

interface DocumentField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'number';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  template_id: string;
  created_at: string;
  status: 'draft' | 'completed';
}

export default function DocumentGenerator() {
  const [activeTab, setActiveTab] = useState<'templates' | 'generator' | 'history'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<GeneratedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
    loadGeneratedDocuments();
  }, []);

  const loadTemplates = () => {
    try {
      setTemplates(documentTemplatesData.templates as any);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadGeneratedDocuments = () => {
    try {
      const stored = localStorage.getItem('generated_documents');
      if (stored) {
        setGeneratedDocuments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const saveDocument = (document: GeneratedDocument) => {
    const updated = [document, ...generatedDocuments];
    setGeneratedDocuments(updated);
    localStorage.setItem('generated_documents', JSON.stringify(updated));
  };

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormData({});
    setActiveTab('generator');
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) return;

    const missingFields = selectedTemplate.fields
      .filter(field => field.required && !formData[field.id])
      .map(field => field.name);

    if (missingFields.length > 0) {
      setError(`Quyidagi maydonlarni to'ldiring: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const details = selectedTemplate.fields
        .map(field => `${field.name}: ${formData[field.id] || 'belgilanmagan'}`)
        .join('\n');

      const response = await aiClient.generateDocument(selectedTemplate.name, details);

      const newDocument: GeneratedDocument = {
        id: Date.now().toString(),
        title: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        content: response.text,
        template_id: selectedTemplate.id,
        created_at: new Date().toISOString(),
        status: 'completed'
      };

      saveDocument(newDocument);
      setCurrentDocument(newDocument);
      setFormData({});
      setActiveTab('history');
    } catch (err) {
      console.error('Error generating document:', err);
      setError(err instanceof Error ? err.message : 'Hujjat yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = (document: GeneratedDocument) => {
    try {
      const blob = new Blob([document.content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.title.replace(/\s+/g, '_')}.txt`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleEditDocument = (document: GeneratedDocument) => {
    try {
      const template = templates.find(t => t.id === document.template_id);
      if (template) {
        setSelectedTemplate(template);
        setActiveTab('generator');
        const lines = document.content.split('\n');
        const parsedData: Record<string, string> = {};
        template.fields.forEach(field => {
          const fieldLine = lines.find(line => line.startsWith(`${field.name}:`));
          if (fieldLine) {
            parsedData[field.id] = fieldLine.replace(`${field.name}:`, '').trim();
          }
        });
        setFormData(parsedData);
      }
    } catch (error) {
      console.error('Error editing document:', error);
    }
  };

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <Card className="card-default rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Hujjat shablonlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer hover:shadow-md"
                onClick={() => handleTemplateSelect(template)}
              >
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{template.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{template.description}</p>
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">{template.category}</Badge>
                <div className="mt-3 text-sm text-gray-400 dark:text-gray-500">{template.fields.length} maydon</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGeneratorTab = () => {
    if (!selectedTemplate) {
      return (
        <Card className="card-default rounded-2xl">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Shablon tanlanmagan</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Avval shablonni tanlang</p>
            <Button onClick={() => setActiveTab('templates')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Shablonlarni ko'rish
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="card-default rounded-2xl">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">{selectedTemplate.name} - Hujjat yaratish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTemplate.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {field.name} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'text' && (
                  <Input
                    placeholder={field.placeholder}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    required={field.required}
                  />
                )}
                
                {field.type === 'textarea' && (
                  <textarea
                    placeholder={field.placeholder}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    required={field.required}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                
                {field.type === 'date' && (
                  <Input type="date" value={formData[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)} required={field.required} />
                )}
                
                {field.type === 'number' && (
                  <Input type="number" placeholder={field.placeholder} value={formData[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)} required={field.required} />
                )}
                
                {field.type === 'select' && field.options && (
                  <Select
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    options={field.options.map(option => ({ value: option, label: option }))}
                  />
                )}
              </div>
            ))}
            
            <div className="flex gap-4">
              <Button onClick={handleGenerateDocument} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Yaratilmoqda...' : <><Plus className="w-4 h-4 mr-2" /> Hujjatni yaratish</>}
              </Button>
              <Button onClick={() => setActiveTab('templates')} variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                Orqaga
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <Card className="card-default rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" /> Yaratilgan hujjatlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generatedDocuments.map((document) => (
              <div
                key={document.id}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700"
                onClick={() => setCurrentDocument(document)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{document.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(document.created_at).toLocaleDateString('uz-UZ')}</p>
                  </div>
                  <Badge className={document.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'}>
                    {document.status === 'completed' ? 'Tugallangan' : 'Draft'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{document.content.substring(0, 100)}...</p>
              </div>
            ))}
            {generatedDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Hali hech qanday hujjat yaratilmagan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {currentDocument && (
        <Card className="card-default rounded-2xl">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> Hujjat ko'rish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 dark:text-white">{currentDocument.title}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => handleDownloadDocument(currentDocument)}>
                    <Download className="w-4 h-4 mr-2" /> Yuklab olish
                  </Button>
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => handleEditDocument(currentDocument)}>
                    <Edit3 className="w-4 h-4 mr-2" /> Tahrirlash
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{currentDocument.content}</pre>
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Yaratilgan: {new Date(currentDocument.created_at).toLocaleDateString('uz-UZ')}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-page-custom p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Orqaga</span>
          </a>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Document Generator</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Huquqiy hujjatlar avtomatik generatsiyasi</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 card-default rounded-xl p-1">
          {[
            { id: 'templates', label: 'Shablonlar', icon: FileText },
            { id: 'generator', label: 'Generator', icon: Plus },
            { id: 'history', label: 'Tarix', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  activeTab === tab.id
                    ? 'nav-item-active'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'generator' && renderGeneratorTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>
    </div>
  );
}
