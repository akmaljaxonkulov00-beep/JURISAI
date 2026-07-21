'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Search, HelpCircle, BookOpen, MessageCircle, Mail, Phone, ChevronDown, ChevronRight, FileText, Shield, Zap, Users, Globe } from 'lucide-react';
import Link from 'next/link';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const categories = [
    { id: 'getting-started', label: 'Boshlash', icon: BookOpen },
    { id: 'account', label: 'Hisob', icon: Shield },
    { id: 'features', label: 'Imkoniyatlar', icon: Zap },
    { id: 'community', label: 'Jamiyat', icon: Users },
    { id: 'billing', label: 'To\'lov', icon: Globe },
  ];

  const faqs: FAQ[] = [
    { question: 'JURISAI ga qanday ro\'yxatdan o\'taman?', answer: 'Bosh sahifadagi "Ro\'yxatdan o\'tish" tugmasini bosing, email va parolingizni kiriting. Google orqali ham tezda ro\'yxatdan o\'tishingiz mumkin.', category: 'getting-started' },
    { question: 'Platformadan bepul foydalana olamanmi?', answer: 'Ha! Bepul reja bilan 5 ta IRAC tahlili, 10 ta AI so\'rovi va qonunlar bazasidan foydalanishingiz mumkin. Pro rejaga o\'tish orqali cheksiz imkoniyatlarga ega bo\'lasiz.', category: 'getting-started' },
    { question: 'Parolimni unutib qo\'ydim, nima qilishim kerak?', answer: 'Sign in sahifasidagi "Parolni unutdingizmi?" tugmasini bosing, emailingizni kiriting va parolni tiklash havolasini oling.', category: 'account' },
    { question: 'Hisob ma\'lumotlarimni qanday yangilayman?', answer: 'Sozlamalar sahifasida ism, familiya, email, telefon raqami va boshqa ma\'lumotlaringizni yangilashingiz mumkin.', category: 'account' },
    { question: 'IRAC tahlili nima va qanday ishlaydi?', answer: 'IRAC (Issue, Rule, Application, Conclusion) - bu huquqiy keyslarni tahlil qilishning professional usuli. AI yordamida keyslaringizni tahlil qiling va natijalarni oling.', category: 'features' },
    { question: 'AI yordamchi qanday tillarda ishlaydi?', answer: 'AI yordamchi o\'zbek, rus va ingliz tillarida ishlaydi. Til sozlamalarini profil sahifasida o\'zgartirishingiz mumkin.', category: 'features' },
    { question: 'Premium rejaga qanday o\'taman?', answer: 'Premium sahifasida o\'zingizga mos rejani tanlang va to\'lovni amalga oshiring. To\'lovdan so\'ng barcha Premium imkoniyatlari ochiladi.', category: 'billing' },
    { question: 'To\'lov qanday amalga oshiriladi?', answer: 'Hozirda to\'lovlar bank o\'tkazmasi orqali amalga oshiriladi. Tez orada karta orqali to\'lov imkoniyati qo\'shiladi.', category: 'billing' },
    { question: 'Jamoat forumida qanday qatnashaman?', answer: 'Jamiyat sahifasida forum, munozaralar va tajriba almashish imkoniyatlari mavjud. Savol berishingiz va boshqalarga yordam berishingiz mumkin.', category: 'community' },
    { question: 'Qonunlar bazasini qanday ishlataman?', answer: 'Qonunlar bazasi sahifasida o\'zbekiston qonunlari, kodekslari va me\'yoriy hujjatlarni qidirishingiz, filtrlab ko\'rishingiz va saqlashingiz mumkin.', category: 'features' },
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (question: string) => {
    setOpenFAQ(openFAQ === question ? null : question);
  };

  return (
    <div className="min-h-screen bg-page-custom">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Orqaga</span>
            </Link>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <HelpCircle className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Yordam markazi</h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">Savollaringiz bormi? Javobni topishga yordam beramiz</p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Savolingizni yozing..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button key={cat.id} onClick={() => setSearchQuery(cat.label)}
                className="card-default rounded-2xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-white">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Ko\'p beriladigan savollar</h2>
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Savolingiz topilmadi</p>
              <p className="text-gray-400 dark:text-gray-500 mt-2">Boshqa so\'z bilan qidirib ko\'ring yoki biz bilan bog\'laning</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <Card key={index} className="card-default rounded-2xl overflow-hidden">
                  <button onClick={() => toggleFAQ(faq.question)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <span className="font-medium text-gray-800 dark:text-white text-sm">{faq.question}</span>
                    </div>
                    {openFAQ === faq.question ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === faq.question && (
                    <CardContent className="px-5 pb-5 pt-0">
                      <p className="text-gray-600 dark:text-gray-400 text-sm pl-5">{faq.answer}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="card-default rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Biz bilan bog\'laning</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Email</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">support@jurisai.uz</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">24/7 qo\'llab-quvvatlash</p>
            </div>
            <div className="text-center p-4">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Telefon</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">+998 90 123 45 67</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">09:00 - 18:00</p>
            </div>
            <div className="text-center p-4">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Telegram</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">@JurisAI_support</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tezkor javob</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
