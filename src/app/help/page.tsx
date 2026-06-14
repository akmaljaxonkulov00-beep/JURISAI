'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, MessageCircle, BookOpen, FileText, Phone, Mail, Send, ChevronRight, HelpCircle, Video, Download } from 'lucide-react';

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = [
    { id: 'all', name: 'Barchasi', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'account', name: 'Hisob', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'billing', name: 'To\'lovlar', icon: <FileText className="w-4 h-4" /> },
    { id: 'features', name: 'Imkoniyatlar', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'technical', name: 'Texnikaviy', icon: <MessageCircle className="w-4 h-4" /> }
  ];

  const faqs = [
    {
      id: 1,
      category: 'account',
      question: 'Hisobimni qanday ro\'yxatdan o\'tkazish mumkin?',
      answer: 'Asosiy sahifada "Ro\'yxatdan o\'tish" tugmasini bosing, elektron pochtangizni kiriting va parol yarating. Keyin elektron pochtangizga kelgan tasdiqlash kodini kiriting.',
      popular: true
    },
    {
      id: 2,
      category: 'billing',
      question: 'To\'lov qanday usullari mavjud?',
      answer: 'Payme, Click, Uzum kabi to\'lov tizimlari orqali to\'lov qilishingiz mumkin. Shuningdek, bank kartasi orqali ham to\'lov qilish imkoniyati bor.',
      popular: true
    },
    {
      id: 3,
      category: 'features',
      question: 'IRAC tahlili qanday ishlaydi?',
      answer: 'IRAC tahlili uchun case matnini kiriting, AI tizimi avtomatik ravishda Issue, Rule, Application, Conclusion bo\'limlarini ajratib beradi va tahlil qiladi.',
      popular: false
    },
    {
      id: 4,
      category: 'account',
      question: 'Parolni unutsam qanday tiklash mumkin?',
      answer: 'Kirish sahifasida "Parolni unutdingizmi?" linkiga bosing, elektron pochtangizni kiriting. Pochtangizga parolni tiklash linki yuboriladi.',
      popular: true
    },
    {
      id: 5,
      category: 'billing',
      question: 'Premium rejasining afzalliklari nimalar?',
      answer: 'Premium reja cheksiz AI so\'rovlari, shaxsiy maslahatchi, tezkor support, vebinarlar va boshqa qo\'shimcha imkoniyatlarni o\'z ichiga oladi.',
      popular: false
    },
    {
      id: 6,
      category: 'technical',
      question: 'Platforma qaysi brauzerlarda ishlaydi?',
      answer: 'JurisAI Chrome, Firefox, Safari, Edge kabi zamonaviy brauzerlarda to\'liq ishlaydi. Mobil versiyasi ham mavjud.',
      popular: false
    },
    {
      id: 7,
      category: 'features',
      question: 'Sud simulyatori qanday ishlaydi?',
      answer: 'Sud simulyatorida virtual sud jarayonida qatnashib, huquqiy argumentlaringizni mashq qilishingiz, sud protsedurasini o\'rganishingiz mumkin.',
      popular: false
    },
    {
      id: 8,
      category: 'billing',
      question: 'To\'lovni qaytarish mumkinmi?',
      answer: 'Ha, 14 kun ichida to\'lovni qaytarish talabini berishingiz mumkin. Batafsil ma\'lumot uchun to\'lov siyosatimizni o\'qing.',
      popular: false
    }
  ];

  const guides = [
    {
      title: 'Boshlanuvchilar uchun qo\'llanma',
      description: 'Platformadan foydalanishning asosiy qoidalari',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'bg-blue-100 text-blue-600',
      duration: '5 daqiqa o\'qish'
    },
    {
      title: 'IRAC tahlili qo\'llanmasi',
      description: 'IRAC usulida case tahlil qilish bo\'yicha to\'liq yo\'riqnoma',
      icon: <FileText className="w-8 h-8" />,
      color: 'bg-green-100 text-green-600',
      duration: '8 daqiqa o\'qish'
    },
    {
      title: 'AI yordamchisidan foydalanish',
      description: 'AI bilan samarali ishlash usullari va maslahatlar',
      icon: <MessageCircle className="w-8 h-8" />,
      color: 'bg-purple-100 text-purple-600',
      duration: '6 daqiqa o\'qish'
    },
    {
      title: 'Hujjat generatsiyasi',
      description: 'Huquqiy hujjatlarni avtomatik yaratish bo\'yicha qo\'llanma',
      icon: <Download className="w-8 h-8" />,
      color: 'bg-orange-100 text-orange-600',
      duration: '7 daqiqa o\'qish'
    }
  ];

  const videos = [
    {
      title: 'Platforma tanishuv videosi',
      description: 'JurisAI imkoniyatlari bilan tanishing',
      thumbnail: '/api/placeholder/video1',
      duration: '3:45',
      views: '12.5K'
    },
    {
      title: 'IRAC tahlili to\'liq kurs',
      description: 'IRAC usulini chuqur o\'rganing',
      thumbnail: '/api/placeholder/video2',
      duration: '15:20',
      views: '8.3K'
    },
    {
      title: 'Sud simulyatori demo',
      description: 'Virtual sud jarayonini ko\'ring',
      thumbnail: '/api/placeholder/video3',
      duration: '8:15',
      views: '6.7K'
    }
  ];

  const contactOptions = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Live Chat',
      description: 'Onlayn yordam oling',
      action: 'Chatni boshlash',
      available: '24/7'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email',
      description: 'support@jurisai.uz',
      action: 'Email yuborish',
      available: '24 soat ichida'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Telefon',
      description: '+998 71 200 00 00',
      action: 'Qo\'ng\'iroq qilish',
      available: '9:00 - 18:00'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Yordam markazi</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              JurisAI platformasidan to\'liq foydalanish uchun kerakli bo\'lgan barcha ma\'lumotlar
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Savol yoki mavzuni qidiring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Qo\'llanmalar</h3>
                <p className="text-sm text-gray-600">Batafsil yo\'riqnoma</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <Video className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Video darslar</h3>
                <p className="text-sm text-gray-600">Ko\'rsatma videolar</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Live Chat</h3>
                <p className="text-sm text-gray-600">Onlayn yordam</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Card>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ko\'p so\'raladigan savollar</h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                        {faq.popular && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            Mashhur
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedFaq === faq.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Guides Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Qo\'llanmalar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guides.map((guide, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className={`p-3 rounded-lg inline-block mb-4 ${guide.color}`}>
                  {guide.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{guide.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{guide.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{guide.duration}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Videos Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Video darslar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {video.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{video.views} ko\'rilgan</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Qo\'shimcha yordam kerakmi?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactOptions.map((option, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    {option.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{option.title}</h3>
                <p className="text-gray-600 mb-4">{option.description}</p>
                <div className="text-sm text-gray-500 mb-4">{option.available}</div>
                <Button className="w-full">
                  {option.action}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
