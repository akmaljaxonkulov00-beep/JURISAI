'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
}

export default function DocumentGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);

  const templates: DocumentTemplate[] = [
    {
      id: 'contract',
      name: 'Oldi-sotdi shartnomasi',
      description: 'Tovar oldi-sotdi shartnomasi',
      fields: [
        { name: 'sellerName', label: 'Sotuvchi F.I.O', type: 'text', required: true },
        { name: 'buyerName', label: 'Haridor F.I.O', type: 'text', required: true },
        { name: 'sellerPassport', label: 'Sotuvchi pasport seriyasi va raqami', type: 'text', required: true },
        { name: 'buyerPassport', label: 'Haridor pasport seriyasi va raqami', type: 'text', required: true },
        { name: 'product', label: 'Tovar nomi', type: 'text', required: true },
        { name: 'amount', label: 'Summa (so\'m)', type: 'number', required: true },
        { name: 'date', label: 'Sana', type: 'date', required: true },
      ]
    },
    {
      id: 'claim',
      name: 'Da\'vo arizasi',
      description: 'Sudga da\'vo arizasi',
      fields: [
        { name: 'plaintiff', label: 'Da\'vogar F.I.O', type: 'text', required: true },
        { name: 'defendant', label: 'Javobgar F.I.O', type: 'text', required: true },
        { name: 'plaintiffPassport', label: 'Da\'vogar pasport seriyasi va raqami', type: 'text', required: true },
        { name: 'court', label: 'Sud nomi', type: 'select', required: true, options: [
          'Toshkent shahar sud',
          'Toshkent viloyat sud',
          'Samarqand viloyat sud',
          'Buxoro viloyat sud',
          'Farg\'ona viloyat sud'
        ]},
        { name: 'claimAmount', label: 'Da\'vo summasi (so\'m)', type: 'number', required: true },
        { name: 'claimReason', label: 'Da\'vo sababi', type: 'text', required: true },
        { name: 'date', label: 'Sana', type: 'date', required: true },
      ]
    },
    {
      id: 'powerOfAttorney',
      name: 'Vakolatnoma',
      description: 'Vakil qilish uchun vakolatnoma',
      fields: [
        { name: 'principal', label: 'Vakolat beruvchi F.I.O', type: 'text', required: true },
        { name: 'agent', label: 'Vakolat oluvchi F.I.O', type: 'text', required: true },
        { name: 'principalPassport', label: 'Vakolat beruvchi pasport seriyasi va raqami', type: 'text', required: true },
        { name: 'agentPassport', label: 'Vakolat oluvchi pasport seriyasi va raqami', type: 'text', required: true },
        { name: 'powers', label: 'Vakolatlar', type: 'select', required: true, options: [
          'To\'liq vakolat',
          'Huquqiy maslahat',
          'Sud ishlari',
          'Mulk operatsiyalari'
        ]},
        { name: 'duration', label: 'Muddat (oy)', type: 'number', required: true },
        { name: 'date', label: 'Sana', type: 'date', required: true },
      ]
    },
    {
      id: 'receipt',
      name: 'Kvitansiya',
      description: 'Pul to\'lgani haqida kvitansiya',
      fields: [
        { name: 'payer', label: 'To\'lov qiluvchi F.I.O', type: 'text', required: true },
        { name: 'receiver', label: 'Qabul qiluvchi F.I.O', type: 'text', required: true },
        { name: 'receiverPassport', label: 'Qabul qiluvchi pasport seriyasi va raqami', type: 'text', required: true },
        { name: 'amount', label: 'Summa (so\'m)', type: 'number', required: true },
        { name: 'purpose', label: 'To\'lov maqsadi', type: 'text', required: true },
        { name: 'date', label: 'Sana', type: 'date', required: true },
      ]
    }
  ];

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const generateDocument = async () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    // Validate required fields
    const missingFields = template.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Quyidagi maydonlarni to\'ldiring: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          data: formData
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setGeneratedDocument(`${template.name} muvaffaqiyatli yaratildi`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Hujjat yaratishda xatolik yuz berdi');
      }
    } catch (error) {
      setError('Hujjat yaratishda xatolik yuz berdi. Iltimos, qayta urining.');
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Hujjat Generator</CardTitle>
          <p className="text-center text-gray-600">
            Avtomatik ravishda yuridik hujjatlar yarating
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hujjat turini tanlang
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                setFormData({});
                setError('');
                setGeneratedDocument(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Hujjat turini tanlang</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {currentTemplate && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">{currentTemplate.name}</h3>
                <p className="text-blue-700 text-sm">{currentTemplate.description}</p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTemplate.fields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required={field.required}
                      >
                        <option value="">Tanlang</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              {generatedDocument && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">{generatedDocument}</p>
                </div>
              )}

              <Button
                onClick={generateDocument}
                loading={loading}
                className="w-full"
                disabled={!selectedTemplate}
              >
                Hujjatni yaratish
              </Button>
            </div>
          )}

          {!selectedTemplate && (
            <div className="text-center text-gray-500 py-8">
              <p>Hujjat turini tanlang</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
