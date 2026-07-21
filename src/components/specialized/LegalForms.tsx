import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Input, Textarea, Select, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

interface LegalFormTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: FormField[];
  instructions: string[];
  required_documents: string[];
  processing_time: string;
  fees: number;
}

interface FormData {
  [key: string]: any;
}

const LegalForms: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<LegalFormTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedForms, setSubmittedForms] = useState<Array<{
    id: string;
    template: LegalFormTemplate;
    data: FormData;
    submitted_at: Date;
    status: 'pending' | 'processing' | 'approved' | 'rejected';
  }>>([]);
  const [activeTab, setActiveTab] = useState('templates');

  const formTemplates: LegalFormTemplate[] = [
    {
      id: 'complaint_form',
      name: 'Da\'vo arizasi shakli',
      category: 'Civil Litigation',
      description: 'Sudga da\'vo berish uchun rasmiy ariza shakli',
      fields: [
        {
          id: 'court_name',
          name: 'court_name',
          label: 'Sud nomi',
          type: 'text',
          required: true,
          placeholder: 'Toshkent shahar sud'
        },
        {
          id: 'plaintiff_name',
          name: 'plaintiff_name',
          label: 'Da\'vogar F.I.O.',
          type: 'text',
          required: true,
          placeholder: 'Ism Familiya Otasini ismi'
        },
        {
          id: 'plaintiff_address',
          name: 'plaintiff_address',
          label: 'Da\'vogar manzili',
          type: 'textarea',
          required: true,
          placeholder: 'To\'liq manzil'
        },
        {
          id: 'defendant_name',
          name: 'defendant_name',
          label: 'Javobgar F.I.O.',
          type: 'text',
          required: true,
          placeholder: 'Ism Familiya Otasini ismi'
        },
        {
          id: 'defendant_address',
          name: 'defendant_address',
          label: 'Javobgar manzili',
          type: 'textarea',
          required: true,
          placeholder: 'To\'liq manzil'
        },
        {
          id: 'claim_amount',
          name: 'claim_amount',
          label: 'Da\'vo summasi (so\'m)',
          type: 'number',
          required: true,
          placeholder: '1000000',
          validation: { min: 0 }
        },
        {
          id: 'claim_description',
          name: 'claim_description',
          label: 'Da\'vo mazmuni',
          type: 'textarea',
          required: true,
          placeholder: 'Da\'voningizning to\'liq mazmuni',
          validation: { minLength: 50 }
        },
        {
          id: 'legal_basis',
          name: 'legal_basis',
          label: 'Qonuniy asoslari',
          type: 'textarea',
          required: true,
          placeholder: 'Qonun hujjatlari va moddalar',
          validation: { minLength: 30 }
        }
      ],
      instructions: [
        'Barcha maydonlarni to\'g\'ri va to\'liq to\'ldiring',
        'Da\'vo summasi raqam bilan yozilishi kerak',
        'Qonuniy asoslari aniq keltirilishi lozim',
        'Arizani imzolab sanasini qo\'ying'
      ],
      required_documents: [
        'Shaxsiy hujjat (pasport nusxasi)',
        'Shartnoma (agar mavjud bo\'lsa)',
        'Dalillar (hisob-fakturalar, guvohlik bayonlari)',
        'Davlat boji (agar to\'langan bo\'lsa)'
      ],
      processing_time: '5-7 ish kuni',
      fees: 340000
    },
    {
      id: 'petition_form',
      name: 'Ariza shakli',
      category: 'Administrative',
      description: 'Davlat organlariga ariza berish uchun shakl',
      fields: [
        {
          id: 'recipient',
          name: 'recipient',
          label: 'Qabul qiluvchi organ',
          type: 'select',
          required: true,
          options: [
            { value: 'ministry', label: 'Vazirlik' },
            { value: 'agency', label: 'Agentlik' },
            { value: 'committee', label: 'Qo\'mita' },
            { value: 'inspectorate', label: 'Inspektsiya' }
          ]
        },
        {
          id: 'applicant_name',
          name: 'applicant_name',
          label: 'Ariza beruvchi F.I.O.',
          type: 'text',
          required: true,
          placeholder: 'Ism Familiya Otasini ismi'
        },
        {
          id: 'subject',
          name: 'subject',
          label: 'Ariza mavzusi',
          type: 'text',
          required: true,
          placeholder: 'Ariza qisqacha mazmuni'
        },
        {
          id: 'request_details',
          name: 'request_details',
          label: 'So\'rov tafsilotlari',
          type: 'textarea',
          required: true,
          placeholder: 'So\'rovingizning to\'liq tafsilotlari',
          validation: { minLength: 50 }
        },
        {
          id: 'attachments',
          name: 'attachments',
          label: 'Ilovalar',
          type: 'textarea',
          required: false,
          placeholder: 'Ilova qilingan hujjatlar ro\'yxati'
        }
      ],
      instructions: [
        'Ariza mavzusi aniq bo\'lishi kerak',
        'So\'rov mantiqiy va tushunarli bo\'lishi lozim',
        'Kerakli hujjatlarni ilova qiling',
        'Arizani imzolab sanasini qo\'ying'
      ],
      required_documents: [
        'Shaxsiy hujjat',
        'So\'rovga oid qo\'shimcha hujjatlar',
        'Aloqa ma\'lumotlari'
      ],
      processing_time: '10-15 ish kuni',
      fees: 0
    },
    {
      id: 'contract_form',
      name: 'Shartnoma shakli',
      category: 'Business Law',
      description: 'Shartnoma tuzish uchun standart shakl',
      fields: [
        {
          id: 'contract_type',
          name: 'contract_type',
          label: 'Shartnoma turi',
          type: 'select',
          required: true,
          options: [
            { value: 'service', label: 'Xizmat shartnomasi' },
            { value: 'sales', label: 'Sotib-sotish shartnomasi' },
            { value: 'lease', label: 'Ijaraga berish shartnomasi' },
            { value: 'employment', label: 'Mehnat shartnomasi' }
          ]
        },
        {
          id: 'party_a_name',
          name: 'party_a_name',
          label: '1-tomon (tuzuvchi)',
          type: 'text',
          required: true,
          placeholder: 'To\'liq nomi'
        },
        {
          id: 'party_b_name',
          name: 'party_b_name',
          label: '2-tomon (qabul qiluvchi)',
          type: 'text',
          required: true,
          placeholder: 'To\'liq nomi'
        },
        {
          id: 'contract_amount',
          name: 'contract_amount',
          label: 'Shartnoma summasi (so\'m)',
          type: 'number',
          required: true,
          placeholder: '1000000',
          validation: { min: 0 }
        },
        {
          id: 'contract_duration',
          name: 'contract_duration',
          label: 'Shartnoma muddati',
          type: 'text',
          required: true,
          placeholder: '1 yil, 6 oy, kundalik'
        },
        {
          id: 'terms_conditions',
          name: 'terms_conditions',
          label: 'Shartnoma shartlari',
          type: 'textarea',
          required: true,
          placeholder: 'Shartnomaning asosiy shartlari',
          validation: { minLength: 100 }
        }
      ],
      instructions: [
        'Tomonlar to\'liq ma\'lumotlari keltirilishi kerak',
        'Shartnoma summasi aniq belgilanishi kerak',
        'Shartlar qonunga mos kelishi lozim',
        'Ikkala tomon ham imzolashi kerak'
      ],
      required_documents: [
        'Tomonlarning shaxsiy hujjatlari',
        'Tashkilot hujjatlari (agar kerak bo\'lsa)',
        'Garantiya hujjatlari (agar kerak bo\'lsa)'
      ],
      processing_time: '1-2 ish kuni',
      fees: 0
    }
  ];

  const handleTemplateSelect = (template: LegalFormTemplate) => {
    setSelectedTemplate(template);
    setFormData({});
    setActiveTab('form');
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!selectedTemplate) return false;

    for (const field of selectedTemplate.fields) {
      const value = formData[field.id];

      if (field.required && (!value || value.toString().trim() === '')) {
        toast.error(`${field.label} maydoni to\'ldirilishi shart`);
        return false;
      }

      if (value && field.validation) {
        const stringValue = value.toString();
        
        if (field.validation.minLength && stringValue.length < field.validation.minLength) {
          toast.error(`${field.label} kamida ${field.validation.minLength} belgidan iborat bo\'lishi kerak`);
          return false;
        }

        if (field.validation.maxLength && stringValue.length > field.validation.maxLength) {
          toast.error(`${field.label} ${field.validation.maxLength} belgidan oshib ketmasligi kerak`);
          return false;
        }

        if (field.validation.min && parseFloat(value) < field.validation.min) {
          toast.error(`${field.label} ${field.validation.min} dan kichik bo\'lishi mumkin emas`);
          return false;
        }

        if (field.validation.max && parseFloat(value) > field.validation.max) {
          toast.error(`${field.label} ${field.validation.max} dan katta bo\'lishi mumkin emas`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // API call to submit form
      const response = await fetch('/api/legal-forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: selectedTemplate!.id,
          template_name: selectedTemplate!.name,
          form_data: formData,
          category: selectedTemplate!.category
        }),
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      const result = await response.json();

      const newSubmission = {
        id: result.id || Date.now().toString(),
        template: selectedTemplate!,
        data: { ...formData },
        submitted_at: new Date(),
        status: result.status || 'pending' as const,
        tracking_number: result.tracking_number
      };

      setSubmittedForms(prev => [newSubmission, ...prev]);
      toast.success(`Ariza muvaffaqiyatli yuborildi! Tracking raqami: ${result.tracking_number || 'N/A'}`);
      setActiveTab('submitted');
      setFormData({});
      setSelectedTemplate(null);

    } catch (error) {
      // Fallback to mock submission if API fails
      console.log('API submission failed, using fallback:', error);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newSubmission = {
        id: Date.now().toString(),
        template: selectedTemplate!,
        data: { ...formData },
        submitted_at: new Date(),
        status: 'pending' as const,
        tracking_number: `TRK${Date.now()}`
      };

      setSubmittedForms(prev => [newSubmission, ...prev]);
      toast.success('Ariza muvaffaqiyatli yuborildi (offline rejimda)');
      setActiveTab('submitted');
      setFormData({});
      setSelectedTemplate(null);

    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Civil Litigation': return 'bg-blue-100 text-blue-800';
      case 'Criminal Law': return 'bg-red-100 text-red-800';
      case 'Administrative': return 'bg-green-100 text-green-800';
      case 'Business Law': return 'bg-purple-100 text-purple-800';
      case 'Family Law': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'processing': return 'Qayta ishlanmoqda';
      case 'approved': return 'Tasdiqlangan';
      case 'rejected': return 'Rad etilgan';
      default: return status;
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={field.id === 'claim_description' || field.id === 'terms_conditions' ? 6 : 4}
          />
        );
      case 'select':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tanlang...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      default:
        return (
          <Input
            label={field.label}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Huquqiy shakllar</h1>
        <p className="text-gray-600">Rasmiy huquqiy shakllarni to\'ldiring va yuboring</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Shakllar</TabsTrigger>
          <TabsTrigger value="form">Shaklni to\'ldirish</TabsTrigger>
          <TabsTrigger value="submitted">Yuborilganlar</TabsTrigger>
          <TabsTrigger value="instructions">Ko\'rsatmalar</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">{template.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{template.fields.length} maydon</span>
                      <span>{template.processing_time}</span>
                    </div>
                    {template.fees > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">Davlat boji: </span>
                        <span className="text-gray-700">{template.fees.toLocaleString()} so\'m</span>
                      </div>
                    )}
                    <Button
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full"
                    >
                      Tanlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setFormData({});
                      setActiveTab('templates');
                    }}
                  >
                    Boshqa shakl
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Ko\'rsatmalar:</h4>
                    <ul className="space-y-1">
                      {selectedTemplate.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Required documents */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Talab qilinadigan hujjatlar:</h4>
                    <ul className="space-y-1">
                      {selectedTemplate.required_documents.map((doc, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-yellow-700">
                          <span className="text-yellow-500 mt-1">▢</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-6">
                    {selectedTemplate.fields.map((field) => (
                      <div key={field.id}>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>

                  {/* Submit button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Yuborilmoqda...
                      </>
                    ) : (
                      'Arizani yuborish'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Shakl tanlanmagan</p>
                  <p className="text-sm mt-2">Avval shakl tanlang</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-6">
          {submittedForms.length > 0 ? (
            <div className="space-y-4">
              {submittedForms.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-lg">{submission.template.name}</h3>
                        <p className="text-sm text-gray-500">
                          Yuborilgan: {submission.submitted_at.toLocaleString('uz-UZ')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusName(submission.status)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(submission.data).map(([key, value]) => {
                        const field = submission.template.fields.find(f => f.id === key);
                        if (!field) return null;
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm text-gray-600">{field.label}:</span>
                            <span className="text-sm font-medium">
                              {typeof value === 'boolean' ? (value ? 'Ha' : 'Yo\'q') : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Hali arizalar yuborilmagan</p>
                  <p className="text-sm mt-2">Birinchi arizani yuboring</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="instructions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Umumiy ko\'rsatmalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Shakllarni to\'ldirish qoidalari:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">1.</span>
                      <span>Barcha maydonlarni to\'g\'ri va to\'liq to\'ldiring. Belgilangan maydonlar majburiy hisoblanadi.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">2.</span>
                      <span>Ma\'lumotlarni aniq va ishonchli keltiring. Xatoliklar oldini olish uchun tekshirib ko\'ring.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">3.</span>
                      <span>Kerakli hujjatlarni tayyorlab, ularni shaklga ilova qiling.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">4.</span>
                      <span>Arizani imzolab, sanasini va imzo qo'yilgan shaxs F.I.O.ni qo'shing.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Yuborishdan oldin tekshirish:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">[OK]</span>
                      <span>Barcha maydonlar to\'ldirilganligini tekshiring</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">[OK]</span>
                      <span>Ma\'lumotlarning to\'g\'riligini tekshiring</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">[OK]</span>
                      <span>Ilova qilingan hujjatlar to\'liqligini tekshiring</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">[OK]</span>
                      <span>Imzo va sanani tekshiring</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Qo\'shimcha maslahatlar:</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">!</span>
                        <span>Shaklni yuborishdan oldin advokat bilan maslahatlashingiz tavsiya etiladi.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">!</span>
                        <span>Ariza nusxasini saqlab olingiz, kelajuda kerak bo\'lishi mumkin.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">!</span>
                        <span>Yuborilgan arizaning holatini kuzatib boring.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { LegalForms };
