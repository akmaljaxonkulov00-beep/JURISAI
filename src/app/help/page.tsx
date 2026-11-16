'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/context/LanguageContext'
import {
  ArrowLeft,
  Search,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  FileText,
  Shield,
  Zap,
  Users,
  Globe,
} from 'lucide-react'
import Link from 'next/link'
import { useSiteSettings } from '@/hooks/useSiteSettings'

interface FAQ {
  question: string
  answer: string
  category: string
}

export default function Help() {
  const router = useRouter()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const settings = useSiteSettings()

  const categories = [
    { id: 'getting-started', label: t('helpGuides'), icon: BookOpen },
    { id: 'account', label: t('helpSupport'), icon: Shield },
    { id: 'features', label: t('helpFAQ'), icon: Zap },
    { id: 'community', label: t('communityTitle'), icon: Users },
    { id: 'billing', label: t('billingTitle'), icon: Globe },
  ]

  const faqs: FAQ[] = [
    {
      question: "JURISTIV nima va platforma kimlar uchun mo‘ljallangan?",
      answer:
        "JURISTIV — O‘zbekiston Respublikasi qonunchiligiga to‘liq asoslangan yetakchi LegalTech platformasi. U fuqarolar uchun tezkor yuridik ko‘mak, huquqshunoslik talabalari uchun amaliy tayyorgarlik (IRAC, Virtual Sud), advokatlar uchun esa raqamli amaliyot va shogirdlar bilan ishlash tizimini taqdim etadi.",
      category: 'getting-started',
    },
    {
      question: 'Platformadan bepul foydalanish imkoniyati bormi?',
      answer:
        "Ha! Ro‘yxatdan o‘tgan har bir foydalanuvchi O‘zbekistonning 21 ta kodeksi va qonunlar bazasidan bepul foydalanishi, boshlang‘ich AI tahlillarini sinab ko‘rishi hamda fuqarolar oylik 2 ta bepul huquqiy savol berishi mumkin. Qo‘shimcha cheksiz imkoniyatlar uchun Premium tariflar mavjud.",
      category: 'getting-started',
    },
    {
      question: 'Virtual Sud (Sud simulyatsiyasi) qanday ishlaydi?',
      answer:
        "Virtual Sudda siz sudya, davlat ayblovchisi (prokuror) yoki himoyachi (advokat) rollarini tanlaysiz. AI boshqa ishtirokchilarni boshqaradi va O‘zbekiston Respublikasining JPK, FPK yoki IPK normalariga asosan jarayon olib boradi. Shuningdek, Multiplayer rejimida boshqa talabalar bilan jonli sud majlisida bellashishingiz mumkin.",
      category: 'features',
    },
    {
      question: 'Kazus Yechish (IRAC) qanday baholanadi?',
      answer:
        "IRAC (Issue, Rule, Application, Conclusion) xalqaro yuridik metodologiyasi asosida ishlaydi. AI sizning har bir bo‘limingizni O‘zbekiston amaldagi kodekslariga mosligini tahlil qilib, xolis 100 ballik tizimda baholaydi va kuchli hamda zaif tomonlaringizni ko‘rsatadi.",
      category: 'features',
    },
    {
      question: 'Qarorlar Daraxti (Decision Tree) qanday vazifani bajaradi?',
      answer:
        "Qarorlar Daraxti har qanday fuqarolik, iqtisodiy yoki mehnat nizosi bo‘yicha mumkin bo‘lgan barcha yuridik strategiyalarni, sud xatarlarini (Risk Assessment), ehtimoliy sarf-xarajatlar va aniq keyingi qadamlarni vizual ko‘rinishda shakllantiradi.",
      category: 'features',
    },
    {
      question: 'Senariy Generator nima va undan qanday foydalaniladi?',
      answer:
        "Interaktiv huquqiy senariylar generatori hayotiy kazuslarni bosqichma-bosqich yechish imkonini beradi. Har bir qaroringiz yuridik oqibatlarga olib keladi va yakunda AI harakatlaringiz sifatini baholaydi.",
      category: 'features',
    },
    {
      question: "Fuqarolar qanday qilib savol berishadi va javob olishadi?",
      answer:
        "Fuqarolar o‘z muammolarini yozib savol qoldirishadi. Talaba huquqshunoslar va advokatlar ushbu savollarga qonuniy asoslangan javob qaytarishadi. Fuqaro javob sifatini 1 dan 5 yulduzgacha baholaydi.",
      category: 'community',
    },
    {
      question: "Advokat bo‘lmoqchi talabalarga mukofot qanday hisoblanadi?",
      answer:
        "Har bir javob uchun alohida pul to‘lanmaydi. Talaba fuqaro savollariga javob beradi va fuqaro 1 dan 5 yulduzgacha baho (ball) qo‘yadi. Ushbu ballar talaba profilida jamlanib boradi. Har 50 ball to‘planganda, talabaning qiziqishi va faolligini rag‘batlantirish uchun hisobiga 20 000 UZS ramziy rag‘batlantirish bonusi ajratiladi. Fuqarolar to‘lovining asosiy qismi platformada qoladi.",
      category: 'community',
    },
    {
      question: "To'lovlar qanday amalga oshiriladi?",
      answer:
        "Platformada to‘lovlar Uzcard, Humo va milliy to‘lov tizimlari orqali onlayn va xavfsiz tarzda amalga oshiriladi. Hisob-kitoblar va kvitansiyalar shaxsiy kabinetda saqlanadi.",
      category: 'billing',
    },
    {
      question: "Parolimni unutib qo'ydim, nima qilishim kerak?",
      answer:
        'Kirish sahifasidagi "Parolni unutdingizmi?" tugmasini bosing, emailingizni kiriting va bir daqiqada parolni tiklash havolasini oling.',
      category: 'account',
    },
    {
      question: "Shaxsiy ma'lumotlarim xavfsizligi qanday ta'minlanadi?",
      answer:
        "Foydalanuvchilarning barcha ma'lumotlari zamonaviy shifrlash standartlari asosida himoyalanadi. Shaxsiy yozishmalar va hujjatlar uchinchi shaxslarga berilmaydi.",
      category: 'account',
    },
  ]

  const filteredFAQs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFAQ = (question: string) => {
    setOpenFAQ(openFAQ === question ? null : question)
  }

  return (
    <div className="min-h-screen bg-page-custom mobile-safe-top">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
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
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Savollaringiz bormi? Javobni topishga yordam beramiz
            </p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Savolingizni yozing..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-12">
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setSearchQuery(cat.label)}
                className="card-default rounded-2xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Ko\'p beriladigan savollar
          </h2>
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 dark:text-zinc-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 dark:text-zinc-500 text-lg">
                Savolingiz topilmadi
              </p>
              <p className="text-gray-400 dark:text-gray-500 dark:text-zinc-500 mt-2">
                Boshqa so\'z bilan qidirib ko\'ring yoki biz bilan bog\'laning
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <Card key={index} className="card-default rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(faq.question)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:bg-zinc-800/50/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-50 dark:bg-blue-900/20 flex-shrink-0" />
                      <span className="font-medium text-gray-800 dark:text-white text-sm">
                        {faq.question}
                      </span>
                    </div>
                    {openFAQ === faq.question ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === faq.question && (
                    <CardContent className="px-5 pb-5 pt-0">
                      <p className="text-gray-600 dark:text-gray-400 dark:text-zinc-500 text-sm pl-5">
                        {faq.answer}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="card-default rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            Biz bilan bog\'laning
          </h2>{' '}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center p-4">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Email</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                {settings.contactEmail || 'support@juristiv.uz'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-zinc-500 mt-1">
                24/7 qo\'llab-quvvatlash
              </p>
            </div>
            <div className="text-center p-4">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Telefon</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                {settings.contactPhone || '+998 71 200 00 00'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-zinc-500 mt-1">
                09:00 - 18:00
              </p>
            </div>
            <div className="text-center p-4">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Telegram</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                {settings.telegramLink?.replace('https://t.me/', '@') ?? '@Juristiv_support'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-zinc-500 mt-1">
                Tezkor javob
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
