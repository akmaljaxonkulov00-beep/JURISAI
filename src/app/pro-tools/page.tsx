'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Wrench, Calculator, FileText, Search, Download, Upload, Clock, TrendingUp, Shield, Database, Settings, BookOpen, Target, Zap } from 'lucide-react';
import Link from 'next/link';

export default function ProTools() {
  const [activeTab, setActiveTab] = useState('calculator');

  const tools = [
    {
      id: 'calculator',
      name: 'Huquqiy kalkulyator',
      icon: <Calculator className="w-6 h-6" />,
      description: 'Jarimalar, tovon puli va boshqa hisob-kitoblar',
      color: 'bg-blue-100 text-blue-600',
      category: 'Hisob-kitob'
    },
    {
      id: 'document-analyzer',
      name: 'Hujjat tahlili',
      icon: <FileText className="w-6 h-6" />,
      description: 'Hujjatlarni avtomatik tahlil qilish',
      color: 'bg-green-100 text-green-600',
      category: 'Tahlil'
    },
    {
      id: 'legal-search',
      name: 'Qonunlar qidiruvi',
      icon: <Search className="w-6 h-6" />,
      description: 'Qonun hujjatlarida tezkor qidiruv',
      color: 'bg-purple-100 text-purple-600',
      category: 'Qidiruv'
    },
    {
      id: 'template-generator',
      name: 'Namuna generator',
      icon: <Download className="w-6 h-6" />,
      description: 'Huquqiy hujjat namunalarini yaratish',
      color: 'bg-orange-100 text-orange-600',
      category: 'Yaratish'
    },
    {
      id: 'case-tracker',
      name: 'Case kuzatuv',
      icon: <Clock className="w-6 h-6" />,
      description: 'Case holatini kuzatib borish',
      color: 'bg-red-100 text-red-600',
      category: 'Kuzatuv'
    },
    {
      id: 'deadline-tracker',
      name: 'Muddat kuzatgichi',
      icon: <Target className="w-6 h-6" />,
      description: 'Muhim muddatlarni eslatish',
      color: 'bg-yellow-100 text-yellow-600',
      category: 'Eslatma'
    }
  ];

  const calculators = [
    {
      name: 'Jarima kalkulyatori',
      description: 'JK va OATK bo\'yicha jarimalarni hisoblash',
      icon: <Calculator className="w-8 h-8" />,
      fields: [
        { label: 'Jinoyat turi', type: 'select', options: ['O\'g\'irlik', 'Talonchilik', 'Makon buzish'] },
        { label: 'Miqdor (so\'m)', type: 'number' },
        { label: 'Sodir etilgan sana', type: 'date' }
      ]
    },
    {
      name: 'Tovon puli kalkulyatori',
      description: 'Moddiy va axloqiy zarar uchun tovon puli',
      icon: <TrendingUp className="w-8 h-8" />,
      fields: [
        { label: 'Zarar turi', type: 'select', options: ['Moddiy', 'Axloqiy', 'Moral'] },
        { label: 'Zarar miqdori', type: 'number' },
        { label: 'Kunlik daromad', type: 'number' }
      ]
    },
    {
      name: 'Nafaqa kalkulyatori',
      description: 'Nafaqa miqdorini hisoblash',
      icon: <Shield className="w-8 h-8" />,
      fields: [
        { label: 'Ish turi', type: 'select', options: ['Asosiy', 'Qo\'shimcha', 'Ishsizlik'] },
        { label: 'Oylik daromad', type: 'number' },
        { label: 'Ish staji', type: 'number' }
      ]
    }
  ];

  const documentTemplates = [
    {
      name: 'Da\'vo arizasi',
      description: 'Sudga da\'vo berish uchun ariza',
      category: 'Sud hujjatlari',
      downloads: '12.5K'
    },
    {
      name: 'Shartnoma',
      description: 'Turli xil shartnoma namunalari',
      category: 'Fuqarolik-huquqiy',
      downloads: '8.3K'
    },
    {
      name: 'Vakolatnoma',
      description: 'Vakolat berish hujjati namunasi',
      category: 'Vakolat hujjatlari',
      downloads: '6.7K'
    },
    {
      name: 'Ariza',
      description: 'Turli arizalar namunalari',
      category: 'Arizalar',
      downloads: '5.2K'
    }
  ];

  const renderCalculator = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {calculators.map((calc, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  {calc.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{calc.name}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-zinc-300">{calc.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calc.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-1">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Tanlang...</option>
                        {field.options?.map((option, optIndex) => (
                          <option key={optIndex} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : field.type === 'date' ? (
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
                <Button className="w-full">
                  Hisoblash
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDocumentAnalyzer = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hujjat yuklang</CardTitle>
          <p className="text-gray-600 dark:text-zinc-300">Huquqiy hujjatni yuklang va AI tahlil qilsin</p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-zinc-300 mb-4">Hujjatni bu yerga torting oling yoki yuklang</p>
            <Button variant="outline">Fayl tanlash</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tahlil natijalari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-300">Hujjat turi:</span>
                <span className="font-medium">Da\'vo arizasi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-300">To\'g\'rilik:</span>
                <span className="font-medium text-green-600">85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-zinc-300">Topilgan xatolar:</span>
                <span className="font-medium text-red-600">3 ta</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tavsiyalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  5-moddada da\'vachi ma\'lumotlari to\'liq kiritilmagan
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Dalillar ro\'yxatiga qo\'shimcha hujjatlar ilova qiling
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderLegalSearch = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Qonun, modda yoki kalit so'zni kiriting..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button>
              <Search className="w-5 h-5 mr-2" />
              Qidirish
            </Button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm">Konstitutsiya</Button>
            <Button variant="outline" size="sm">FK</Button>
            <Button variant="outline" size="sm">JK</Button>
            <Button variant="outline" size="sm">GPK</Button>
            <Button variant="outline" size="sm">OATK</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    O\'zbekiston Respublikasi Fuqarolik kodeksi, {i * 10}-modda
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-300">
                    Shartnoma tuzish tartibi
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Faol</Badge>
              </div>
              <p className="text-gray-700 dark:text-zinc-200 mb-3">
                Shartnoma - bu tomonlarning o\'zaro huquq va majburiyatlarni belgilovchi yozma kelishuv. 
                Shartnoma qonunga muvofiq tuzilishi va tomonlarning irodasi bilan tasdiqlanishi kerak...
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline">Fuqarolik huquqi</Badge>
                  <Badge variant="outline">Shartnoma</Badge>
                </div>
                <Button variant="outline" size="sm">
                  Batafsil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'calculator':
        return renderCalculator();
      case 'analyzer':
        return renderDocumentAnalyzer();
      case 'search':
        return renderLegalSearch();
      default:
        return renderCalculator();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-800/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-white dark:bg-zinc-900/20 dark:bg-zinc-800/30 rounded-full backdrop-blur-sm mr-4">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Professional Tools</h1>
              <p className="text-white/90">Huquqchilar uchun maxsus asboblar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {tools.map((tool) => (
            <Card
              key={tool.id}
              className={`hover:shadow-lg transition-all cursor-pointer ${
                activeTab === tool.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setActiveTab(tool.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${tool.color}`}>
                    {tool.icon}
                  </div>
                  <Badge variant="outline">{tool.category}</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-gray-600 dark:text-zinc-300 text-sm">{tool.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
          <div className="border-b border-gray-200 dark:border-zinc-700 mb-6">
            <nav className="flex space-x-8">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tool.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200'
                  }`}
                >
                  {tool.name}
                </button>
              ))}
            </nav>
          </div>

          {renderContent()}
        </div>

        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Qo\'shimcha resurslar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Qonunlar bazasi</h3>
                </div>
                <p className="text-gray-600 dark:text-zinc-300 text-sm mb-4">To\'liq qonunlar bazasi</p>
                <Link href="/legal-database">
                  <Button variant="outline" size="sm" className="w-full">
                    Ochish
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Qo\'llanmalar</h3>
                </div>
                <p className="text-gray-600 dark:text-zinc-300 text-sm mb-4">Batafsil yo\'riqnoma</p>
                <Link href="/help">
                  <Button variant="outline" size="sm" className="w-full">
                    Ochish
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Sozlamalar</h3>
                </div>
                <p className="text-gray-600 dark:text-zinc-300 text-sm mb-4">Profil sozlamalari</p>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="w-full">
                    Ochish
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <Zap className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">AI yordamchi</h3>
                </div>
                <p className="text-gray-600 dark:text-zinc-300 text-sm mb-4">Smart yordamchi</p>
                <Link href="/ai-chat">
                  <Button variant="outline" size="sm" className="w-full">
                    Ochish
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
