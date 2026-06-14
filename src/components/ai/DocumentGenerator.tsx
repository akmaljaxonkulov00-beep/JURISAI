import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Input, Select, Textarea, Badge, Progress, LoadingSpinner } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'date' | 'number';
    required: boolean;
    placeholder?: string;
  }>;
}

interface GeneratedDocument {
  id: string;
  templateId: string;
  content: string;
  createdAt: Date;
  fieldValues: Record<string, any>;
}

const DocumentGenerator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [activeTab, setActiveTab] = useState('templates');

  const templates: DocumentTemplate[] = [
    {
      id: 'complaint',
      name: 'Huquqiy da\'vo arizasi',
      category: 'civil_litigation',
      description: 'Sudga beriladigan rasmiy da\'vo arizasi shabloni',
      fields: [
        { name: 'court_name', label: 'Sud nomi', type: 'text', required: true, placeholder: 'Toshkent shahar sud' },
        { name: 'plaintiff_name', label: 'Da\'vogar F.I.O.', type: 'text', required: true },
        { name: 'defendant_name', label: 'Javobgar F.I.O.', type: 'text', required: true },
        { name: 'claim_amount', label: 'Da\'vo summasi (so\'m)', type: 'number', required: true },
        { name: 'claim_description', label: 'Da\'vo mazmuni', type: 'textarea', required: true },
        { name: 'legal_basis', label: 'Qonuniy asoslari', type: 'textarea', required: true },
      ]
    },
    {
      id: 'contract',
      name: 'Xizmat shartnomasi',
      category: 'business_law',
      description: 'Xizmat ko\'rsatish shartnomasi shabloni',
      fields: [
        { name: 'party_a_name', label: '1-tomon nomi', type: 'text', required: true },
        { name: 'party_b_name', label: '2-tomon nomi', type: 'text', required: true },
        { name: 'service_description', label: 'Xizmat tavsifi', type: 'textarea', required: true },
        { name: 'payment_amount', label: 'To\'lov summasi (so\'m)', type: 'number', required: true },
        { name: 'payment_terms', label: 'To\'lov shartlari', type: 'textarea', required: true },
        { name: 'contract_duration', label: 'Shartnoma muddati', type: 'text', required: true },
      ]
    },
    {
      id: 'legal_opinion',
      name: 'Huquqiy xulosa',
      category: 'general',
      description: 'Huquqiy masalaga oid xulosa berish shabloni',
      fields: [
        { name: 'client_name', label: 'Mijoz nomi', type: 'text', required: true },
        { name: 'legal_question', label: 'Huquqiy savol', type: 'textarea', required: true },
        { name: 'factual_background', label: 'Faktik ma\'lumotlar', type: 'textarea', required: true },
        { name: 'applicable_law', label: 'Qo\'llaniladigan qonunlar', type: 'textarea', required: true },
        { name: 'analysis', label: 'Tahlil', type: 'textarea', required: true },
        { name: 'conclusion', label: 'Xulosa', type: 'textarea', required: true },
      ]
    },
    {
      id: 'petition',
      name: 'Ariza',
      category: 'administrative_law',
      description: 'Davlat organiga beriladigan ariza shabloni',
      fields: [
        { name: 'recipient', label: 'Qabul qiluvchi organ', type: 'text', required: true },
        { name: 'applicant_name', label: 'Ariza beruvchi F.I.O.', type: 'text', required: true },
        { name: 'subject', label: 'Ariza mavzusi', type: 'text', required: true },
        { name: 'request_details', label: 'So\'rov tafsilotlari', type: 'textarea', required: true },
        { name: 'attachments', label: 'Ilovalar', type: 'textarea', required: false },
      ]
    }
  ];

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFieldValues({});
    setActiveTab('generator');
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    // Validate required fields
    const missingFields = selectedTemplate.fields
      .filter(field => field.required && !fieldValues[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(`Quyidagi maydonlar to\'ldirilishi shart: ${missingFields.join(', ')}`);
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate document content based on template
      let content = '';
      
      if (selectedTemplate.id === 'complaint') {
        content = generateComplaint(fieldValues);
      } else if (selectedTemplate.id === 'contract') {
        content = generateContract(fieldValues);
      } else if (selectedTemplate.id === 'legal_opinion') {
        content = generateLegalOpinion(fieldValues);
      } else if (selectedTemplate.id === 'petition') {
        content = generatePetition(fieldValues);
      }

      const newDocument: GeneratedDocument = {
        id: Date.now().toString(),
        templateId: selectedTemplate.id,
        content,
        createdAt: new Date(),
        fieldValues: { ...fieldValues }
      };

      setGeneratedDocuments(prev => [newDocument, ...prev]);
      setActiveTab('documents');
      toast.success('Hujjat muvaffaqiyatli yaratildi');

    } catch (error) {
      toast.error('Hujjat yaratishda xatolik yuz berdi');
      console.error('Document generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateComplaint = (values: Record<string, any>) => `
DA'VO ARIZASI

${values.court_name.toUpperCase()}

DA'VOGAR:
${values.plaintiff_name}
Manzil: [Manzil]
Telefon: [Telefon raqami]

JAVOBGAR:
${values.defendant_name}
Manzil: [Manzil]
Telefon: [Telefon raqami]

DA'VO MAVZUSI:
${values.claim_description}

DA'VO SUMMASI:
${values.claim_amount} so'mm

QONUNIY ASOSLARI:
${values.legal_basis}

DA'VO TALABLARI:
1. Javobgardan ${values.claim_amount} so'mm miqdorida tovon puli undirishni talab qilaman.
2. Sud yuritish xarajatlari javobgar zimmasiga yuklatilsin.

SANA: ${new Date().toLocaleDateString('uz-UZ')}

DA'VOGAR: ____________________
${values.plaintiff_name}
  `;

  const generateContract = (values: Record<string, any>) => `
XIZMAT SHARTNOMASI

Shartnoma raqami: ${Date.now()}-${Math.floor(Math.random() * 1000)}
Sana: ${new Date().toLocaleDateString('uz-UZ')}

TOMONLAR:
1-tomon: ${values.party_a_name}
2-tomon: ${values.party_b_name}

1. SHARTNOMA MAVZUSI
${values.service_description}

2. XIZMATNING TARKIBI VA HAJMI
[Xizmat tafsilotlari]

3. TO'LOV SHARTLARI
${values.payment_terms}
To'lov summasi: ${values.payment_amount} so'mm

4. SHARTNOMA MUDDATI
${values.contract_duration}

5. TOMONLARNING MAJBURIYATLARI
Tomonlar shartnoma shartlariga rioya etishga majburdirlar.

6. SHARTNOMANI BEKATISH
Shartnoma ikki tomon tomonidan imzolangan kundan kuchga kiradi.

1-TOMON: _____________________
${values.party_a_name}

2-TOMON: _____________________
${values.party_b_name}
  `;

  const generateLegalOpinion = (values: Record<string, any>) => `
HUQUQIY XULOSA

Sana: ${new Date().toLocaleDateString('uz-UZ')}
Mijoz: ${values.client_name}

1. HUQUQIY SAVOL
${values.legal_question}

2. FAKTIK MA'LUMOTLAR
${values.factual_background}

3. QO'LLANILADIGAN QONUNLAR
${values.applicable_law}

4. TAHILIL
${values.analysis}

5. XULOSA
${values.conclusion}

Ushbu xulosa berilgan sana holatidagi qonun hujjatlariga asoslanadi.

ADVOKAT: _____________________
[Ism/Familiya]
[Litsenziya raqami]
  `;

  const generatePetition = (values: Record<string, any>) => `
ARIZA

Qabul qiluvchi: ${values.recipient}
Manzil: [Manzil]

Ariza beruvchi: ${values.applicant_name}
Manzil: [Manzil]
Telefon: [Telefon raqami]

ARIZA MAVZUSI:
${values.subject}

SO'ROV TAFSIFOTLARI:
${values.request_details}

${values.attachments ? `ILOVALAR:\n${values.attachments}` : ''}

SANA: ${new Date().toLocaleDateString('uz-UZ')}

ARIZA BERUVCHI: ____________________
${values.applicant_name}
  `;

  const handleExport = (document: GeneratedDocument, format: 'pdf' | 'word' | 'txt') => {
    toast.success(`Hujjat ${format.toUpperCase()} formatda eksport qilinmoqda`);
    // Implement actual export logic here
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'civil_litigation': return 'bg-blue-100 text-blue-800';
      case 'business_law': return 'bg-green-100 text-green-800';
      case 'administrative_law': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'civil_litigation': return 'Fuqarolik sudlovchiligi';
      case 'business_law': return 'Biznes huquqi';
      case 'administrative_law': return 'Ma\'muriy huquq';
      default: return 'Umumiy';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Hujjat Generatori</h1>
        <p className="text-gray-600">Turli xil huquqiy hujjatlarni avtomatik yarating</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Shablonlar</TabsTrigger>
          <TabsTrigger value="generator">Yaratish</TabsTrigger>
          <TabsTrigger value="documents">Yaratilgan hujjatlar</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={getCategoryColor(template.category)}>
                      {getCategoryName(template.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {template.fields.length} maydon
                    </span>
                    <Button
                      onClick={() => handleTemplateSelect(template)}
                      size="sm"
                    >
                      Tanlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generator" className="space-y-6">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedTemplate.name}</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('templates')}
                  >
                    Boshqa shablon
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.name}>
                      {field.type === 'textarea' ? (
                        <Textarea
                          label={field.label}
                          value={fieldValues[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          rows={4}
                        />
                      ) : (
                        <Input
                          label={field.label}
                          value={fieldValues[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          type={field.type}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Hujjat yaratilmoqda...
                      </>
                    ) : (
                      'Hujjat yaratish'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Shablon tanlanmagan</p>
                  <p className="text-sm mt-2">Avval shablon tanlang</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {generatedDocuments.length > 0 ? (
            <div className="space-y-4">
              {generatedDocuments.map((document) => {
                const template = templates.find(t => t.id === document.templateId);
                return (
                  <Card key={document.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{template?.name}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {document.createdAt.toLocaleString('uz-UZ')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Ko'rish
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{template?.name}</DialogTitle>
                              </DialogHeader>
                              <div className="whitespace-pre-wrap text-sm">
                                {document.content}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(document, 'pdf')}
                          >
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(document, 'word')}
                          >
                            Word
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(document, 'txt')}
                          >
                            TXT
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        <p>Hujjat turi: {template?.name}</p>
                        <p>Yaratilgan sana: {document.createdAt.toLocaleDateString('uz-UZ')}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Hali hujjatlar yaratilmagan</p>
                  <p className="text-sm mt-2">Birinchi hujjatni yarating</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { DocumentGenerator };
