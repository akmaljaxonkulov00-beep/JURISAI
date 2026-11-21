'use client'

import { useState } from 'react'
import Link from 'next/link'
import SiteLogo from '@/components/SiteLogo'
import ContactSection from '@/components/landing/ContactSection'
import {
  Brain,
  FileText,
  Search,
  BookOpen,
  BarChart3,
  Shield,
  Zap,
  Users,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  Scale,
  Briefcase,
  GraduationCap,
  UserCheck,
  Sparkles,
  LogIn,
  GitFork,
  HelpCircle,
  ChevronDown,
  Video,
  Mic,
  Gavel,
  Award,
  Check,
  FileCheck,
  Compass,
} from 'lucide-react'

// Real modullar va asosiy funksiyalar (Barcha havolalar /signin ga yo‘naltiriladi)
const CORE_MODULES = [
  {
    id: 'virtual-court',
    title: 'Virtual Sud & Multiplayer',
    badge: 'Real-time & AI',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Scale,
    description:
      'Yakka tartibda yoki boshqa talabalar bilan real vaqtda jonli sud majlisini o‘tkazing. WebRTC audio/video, 7 ta protsessual bosqich va AI sudya tahlili.',
    highlights: [
      'Sudya, Davlat ayblovchisi (Prokuror), Advokat va Guvoh rollari',
      'JPK va FPK asosidagi 7 ta rasmiy protsessual bosqich',
      'E’tiroz (Objection) va dalillarni ishga qo‘shish mexanizmi',
      'Nutqni avtomatik matnga o‘girish (STT) va real-vaqtda subtitrlar',
    ],
    href: '/signin',
    actionLabel: 'Virtual Sudga kirish',
  },
  {
    id: 'document-generator',
    title: 'Hujjatlar Konstruktori',
    badge: '3 daqiqada tayyor',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: FileText,
    description:
      'Hech qanday qiyinchiliksiz qonuniy rasmiy da’vo arizalari, mehnat va fuqarolik shartnomalari hamda iltimosnomalarni avtomatik shakllantiring.',
    highlights: [
      'Bosqichma-bosqich qulay to‘ldirish (Wizard uslubida)',
      'O‘zbekiston FK, FPK va MK normalariga to‘liq muvofiqlik',
      'AI orqali xatolar va huquqiy xavflarni oldindan tekshirish',
      'Tayyor hujjatni Word (.docx) va PDF formatida yuklab olish',
    ],
    href: '/signin',
    actionLabel: 'Hujjat yaratish',
  },
  {
    id: 'decision-tree',
    title: 'Qarorlar Daraxti',
    badge: 'Algoritmik tahlil',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: GitFork,
    description:
      'Chigal huquqiy muammolarni qadam-baqadam shoxlangan savol-javoblar orqali tahlil qiling va qonuniy eng to‘g‘ri yechimga yetib boring.',
    highlights: [
      'Mehnat, oila, qarz va yo‘l harakati nizolari bo‘yicha tayyor sxemalar',
      'Har bir qadamda tegishli qonun moddalariga to‘g‘ridan-to‘g‘ri havola',
      'Da’vo muddati va da’vo kiritish istiqbolini hisoblovchi mantiq',
      'Yakuniy strategiya va tavsiyalarni bir bosishda olish',
    ],
    href: '/signin',
    actionLabel: 'Sxemani boshlash',
  },
  {
    id: 'irac-cases',
    title: 'Kazus Yechish / IRAC Tizimi',
    badge: 'Xalqaro metodika',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: Brain,
    description:
      'Issue (Muammo), Rule (Qoida), Application (Qo‘llash) va Conclusion (Xulosa) xalqaro yuridik metodologiyasi asosida sud kazuslarini yeching.',
    highlights: [
      '50+ real sud amaliyotidan olingan jinoyat va fuqarolik kazuslari',
      'AI mentor orqali tahlil sifatini daqiqalarda baholash',
      'To‘g‘ri qo‘llanilgan va tushirib qoldirilgan moddalar tahlili',
      'O‘zbekiston yuridik oliygohlari dasturlariga moslashtirilgan',
    ],
    href: '/signin',
    actionLabel: 'Kazuslarni yechish',
  },
  {
    id: 'legal-chat',
    title: 'AI Yuridik Maslahatchi',
    badge: '24/7 Tezkor tahlil',
    badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    icon: Sparkles,
    description:
      'O‘zbekistonning 21 ta amaldagi kodekslari va qonunlari bo‘yicha istalgan huquqiy savolga asoslantirilgan tushuntirish va havola oling.',
    highlights: [
      'Amaldagi qonunchilik moddalariga aniq havolalar bilan javob',
      'Yuridik atamalarni sodda va tushunarli tilda izohlash',
      'Shartnomalar va bitimlardagi yashirin xavflarni aniqlash',
      'Talabalar va amaliyotchi yuristlar uchun ishonchli yordamchi',
    ],
    href: '/signin',
    actionLabel: 'Savol berish',
  },
  {
    id: 'pro-database',
    title: 'Qonunlar & Oliy Sud Amaliyoti',
    badge: 'Rasmiy manbalar',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    icon: BookOpen,
    description:
      'O‘zbekiston Respublikasi qonunlari, Oliy Sud Plenum qarorlari va sud amaliyotining tahliliy elektron bazasi bir joyda.',
    highlights: [
      '4,400+ tizimlashtirilgan kodeks va qonun moddalari',
      'Oliy Sud Plenumining amaliyotni birxillashtiruvchi tushuntirishlari',
      'Yuridik kalit so‘zlar va moddalar bo‘yicha qulay tezkor qidiruv',
      'Reyting va haftalik XP to‘plash orqali bilimni oshirish',
    ],
    href: '/signin',
    actionLabel: 'Bazani ko‘rish',
  },
]

// Real statistika
const STATS = [
  { value: '4,400+', label: 'Qonun va kodeks moddalari' },
  { value: '7 Bosqich', label: 'Rasmiy sud jarayoni simulyatori' },
  { value: 'WebRTC & AI', label: 'Jonli ovozli multiplayer sud' },
  { value: '100%', label: 'O‘zbekiston qonunchiligiga mos' },
]

// 3 ta maqsadli auditoriya (Advokatlar va fuqarolar kelajakdagi funksiyalar sifatida xira holatda)
const AUDIENCES = [
  {
    id: 'law_student',
    title: 'Bo‘lajak yuristlar & Talabalar',
    badge: 'Faol modul',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: GraduationCap,
    description:
      'Nazariy bilimlarni amaliyot bilan mustahkamlang. Virtual sudda sudya yoki advokat bo‘lib bellashing, kazuslarni yeching va milliy reytingda yuqorilang.',
    features: [
      'Virtual Sudda ishtirok etish (Sudya, Prokuror, Advokat)',
      'Multiplayer xonalarda kursdoshlar bilan jonli sud jarayoni',
      'IRAC xalqaro usulida kazuslarni mustaqil yechish',
      'XP ballar to‘plash va shaxsiy reytingni ko‘tarish',
    ],
    primaryAction: {
      label: 'Virtual Sudni boshlash',
      href: '/signin',
      disabled: false,
    },
    secondaryAction: {
      label: 'Kazus yechish',
      href: '/signin',
      disabled: false,
    },
    disabled: false,
    border: 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-md',
  },
  {
    id: 'advocate',
    title: 'Amaliyotchi advokatlar va stajyorlar',
    badge: 'Tez kunda · 2-bosqich',
    badgeColor: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    icon: Briefcase,
    description:
      'Sud nutqlarini mashq qilish, Oliy Sud Plenum qarorlarini tahlil qilish va murakkab da’vo arizalarini 3 daqiqada tayyorlash uchun qulay ish quroli.',
    features: [
      'Da’vo arizalari va shikoyatlar konstruktori',
      'Oliy Sud Plenum qarorlari va sud amaliyoti tahlili',
      'Qarorlar daraxti orqali ish strategiyasini tanlash',
      'AI orqali shartnomalardagi xavflarni baholash',
    ],
    primaryAction: {
      label: 'Tez kunda (2-bosqich)',
      href: '#',
      disabled: true,
    },
    secondaryAction: {
      label: 'Kengayish bosqichida',
      href: '#',
      disabled: true,
    },
    disabled: true,
    border: 'border-slate-200 dark:border-slate-800 opacity-60',
  },
  {
    id: 'citizen',
    title: 'Fuqarolar va tadbirkorlar',
    badge: 'Tez kunda · 3-bosqich',
    badgeColor: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    icon: UserCheck,
    description:
      'Kundalik hayot va biznesdagi huquqiy savollarga tezkor tushunarli javob olish hamda rasmiy shartnoma va arizalarni qonuniy to‘g‘ri tuzish tizimi.',
    features: [
      '24/7 AI orqali birlamchi huquqiy maslahat olish',
      'Oldi-sotdi, ijara va qarz shartnomalarini tuzish',
      'Mehnat va iste’molchi huquqlari bo‘yicha yo‘l-yo‘riq',
      'Sudga murojaat qilishdan oldin imkoniyatlarni baholash',
    ],
    primaryAction: {
      label: 'Tez kunda (3-bosqich)',
      href: '#',
      disabled: true,
    },
    secondaryAction: {
      label: 'Kengayish bosqichida',
      href: '#',
      disabled: true,
    },
    disabled: true,
    border: 'border-slate-200 dark:border-slate-800 opacity-60',
  },
]

// Qanday ishlaydi (3 qadam)
const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Kerakli modulni tanlang',
    description:
      'Virtual Sud majlisiga qo‘shiling, tayyor shartnoma generatsiya qiling yoki yuridik kazus yechishni boshlang.',
    icon: Compass,
  },
  {
    step: '02',
    title: 'Amaliy jarayonda qatnashing',
    description:
      'O‘zbekiston protsessual qonunchiligi bo‘yicha nutq so‘zlang, dalillarni keltiring yoki ma’lumotlarni kiritib borgan sari AI takliflaridan foydalaning.',
    icon: Scale,
  },
  {
    step: '03',
    title: 'Xolis baho va tayyor natijani oling',
    description:
      'AI sudya protsessual xatolaringizni ko‘rsatib tahlil beradi, hujjat esa to‘liq tayyor Word/PDF holatida kompyuteringizga yuklanadi.',
    icon: Award,
  },
]

// Tez-tez beriladigan savollar (FAQ)
const FAQS = [
  {
    q: 'Virtual Sud Multiplayer qanday ishlaydi?',
    a: 'Virtual Sud — bu haqiqiy sud zalining interaktiv simulyatsiyasi. Siz xona ochib, do‘stlaringizni taklif qilasiz yoki ochiq xonaga qo‘shilasiz. Har bir ishtirokchiga rol beriladi (Sudya, Prokuror, Advokat, Guvoh). Jarayon 7 ta rasmiy bosqichda (JPK/FPK bo‘yicha) jonli mikrofon, video va matn orqali o‘tadi. Majlis oxirida AI sudya har bir ishtirokchining nutqi va xatolariga xolis baho beradi.',
  },
  {
    q: 'Hujjatlar konstruktori qanday ishlaydi va qanday hujjatlar bor?',
    a: 'Konstruktor — bu bosqichma-bosqich qulay so‘rovnoma. Siz bir necha kerakli ma’lumotlarni kiritasiz (masalan, tomonlar, qarz summasi yoki mehnat shartlari), tizim esa O‘zbekiston Respublikasining Fuqarolik yoki Mehnat kodeksiga mos rasmiy tayyor hujjatni shakllantirib, Word (.docx) formatida yuklab olishga beradi.',
  },
  {
    q: 'Qarorlar daraxti nima va undan qanday foydalaniladi?',
    a: 'Qarorlar daraxti — bu murakkab huquqiy vaziyatlarni hal qilish algoritmi. Misol uchun, ishdan noqonuniy bo‘shatilganingizda yoki avtohalokat sodir bo‘lganda, tizim ketma-ket savollar beradi ("Hodisa qachon bo‘ldi?", "Dalillar bormi?"). Siz ha/yo‘q deb javob berish orqali qonuniy maqbul yechim va da’vo kiritish tartibini bilib olasiz.',
  },
  {
    q: 'Platforma qaysi qonunchilikka asoslangan?',
    a: 'Platformadagi barcha modullar O‘zbekiston Respublikasining amaldagi qonunchiligi, jumladan Jinoyat-protsessual kodeksi (JPK), Fuqarolik protsessual kodeksi (FPK), Mehnat kodeksi, Fuqarolik kodeksi hamda Oliy Sud Plenum qarorlariga to‘liq moslashtirilgan.',
  },
  {
    q: 'Platformadan talabalar bepul foydalanishi mumkinmi?',
    a: 'Ha, platformadagi asosiy o‘quv modullari, jumladan bazaviy Virtual Sud xonalari, IRAC kazuslari va AI yuridik maslahatchi talabalar uchun ochiq taqdim etiladi.',
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* ── HEADER / NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 focus:outline-none">
              <SiteLogo size="md" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              <a
                href="#modules"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Imkoniyatlar
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Qanday ishlaydi?
              </a>
              <a
                href="#audiences"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Kimlar uchun?
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Savol-Javob
              </a>
              <a
                href="#contact"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Bog‘lanish
              </a>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <LogIn className="w-4 h-4" />
                Kirish
              </Link>
              <Link
                href="/signin?mode=register"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                Boshlash
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Menyu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-1">
              <a
                href="#modules"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Imkoniyatlar
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Qanday ishlaydi?
              </a>
              <a
                href="#audiences"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Kimlar uchun?
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Savol-Javob
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Bog‘lanish
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 rounded-xl"
              >
                Tizimga kirish
              </Link>
              <Link
                href="/signin?mode=register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl shadow-md shadow-blue-500/20"
              >
                Ro‘yxatdan o‘tish
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-20 sm:pb-28">
        {/* Glow Fights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* National Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 mb-6">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-300">
                O‘zbekiston Respublikasi protsessual qonunchiligiga asoslangan yagona AI platforma
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.2] mb-6">
              Bo‘lajak va amaliyotchi yuristlar uchun{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
                Interaktiv Virtual Sud & AI Ekotizimi
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
              Nazariyani amaliyotga aylantiring. Kursdoshlaringiz bilan real vaqtda jonli multiplayer sudda
              bellashing, kazuslarni IRAC usulida tahlil qiling va rasmiy da’vo hujjatlarini daqiqalarda yarating.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md sm:max-w-none mx-auto">
              <Link
                href="/signin?mode=register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Platformani bepul boshlash
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all hover:-translate-y-0.5"
              >
                <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Tizimga kirish
              </Link>
            </div>
          </div>

          {/* ── LIVE INTERACTIVE PREVIEW MOCKUP ── */}
          <div className="mt-12 sm:mt-16 relative max-w-5xl mx-auto rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 p-2 sm:p-4 shadow-2xl shadow-blue-500/10 overflow-hidden">
            {/* Top Bar of Mockup */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/60 rounded-xl mb-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-400 hidden sm:inline">
                  jurisai.uz/virtual-court/live-trial
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-[11px] animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> JONLI MAJLIS
                </span>
                <span className="text-slate-500 hidden sm:inline">JPK 443-modda (Dalillar ko‘rigi)</span>
              </div>
            </div>

            {/* Inner Court Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 sm:p-4 bg-slate-950/80 rounded-xl">
              {/* Judge Bench (Center on mobile, top on desktop) */}
              <div className="md:col-span-3 p-4 rounded-xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/60 text-center relative overflow-hidden">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
                  <Gavel className="w-3.5 h-3.5" /> Sud Raisi (Sudya) minbari
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Sud tergovi davom etmoqda: Guvoh ko‘rsatmalari va dalillar tahlili
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto">
                  «Taraflar o‘zaro hurmatni saqlagan holda JPK talablariga rioya qilsin. Himoya tarafi savol berishga taklif etiladi.»
                </p>
              </div>

              {/* Prosecutor Podium */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
                    Davlat Ayblovchisi (Prokuror)
                  </span>
                  <Mic className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="text-xs text-slate-300 space-y-1.5">
                  <p className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                    «Hurmatli sud, taqdim etilgan ekspertiza xulosasi ayblanuvchining aybini to‘liq tasdiqlaydi.»
                  </p>
                </div>
              </div>

              {/* Center Live Evidence & Objection */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                      Ashyoviy Dalillar & E’tiroz
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      № 04-2026
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 mb-2">
                    📄 Ekspertiza xulosasi (JPK 95-modda bo‘yicha tekshirilmoqda)
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 w-full text-center">
                    ⚠️ E’tiroz: Asossiz vaj
                  </span>
                </div>
              </div>

              {/* Defense Podium */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    Himoyachi (Advokat)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-xs text-slate-300 space-y-1.5">
                  <p className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                    «Hurmatli sudya, ushbu dalil protsessual qonun buzilishi bilan olingan, uni nojoiz deb topishni so‘raymiz.»
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(stat => (
              <div key={stat.label} className="p-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE MODULES (ASOSIY IMKONIYaTLAR) ── */}
      <section id="modules" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white mb-4">
              Yagona raqamli platformadagi{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
                6 ta asosiy yo‘nalish
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Talabalar, amaliyotchi yuristlar va advokatlar uchun maxsus loyihalashtirilgan amaliy vositalar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {CORE_MODULES.map(module => {
              const Icon = module.icon
              return (
                <div
                  key={module.id}
                  className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    {/* Header: Icon & Badge */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${module.badgeColor}`}
                      >
                        {module.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-3">
                      {module.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      {module.description}
                    </p>

                    {/* Highlights bullets */}
                    <div className="space-y-2.5 mb-7">
                      {module.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            {h}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Link CTA */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={module.href}
                      className="inline-flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
                    >
                      <span>{module.actionLabel}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (3 QADAM) ── */}
      <section
        id="how-it-works"
        className="py-20 sm:py-28 bg-slate-50/80 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white mb-4">
              Platforma qanday ishlaydi?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Uchta oddiy qadamda nazariy bilimlarni mustahkamlash va tayyor yuridik natijaga erishish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS_STEPS.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={idx}
                  className="relative p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-3xl font-black text-blue-600/30 dark:text-blue-400/20 font-mono">
                        {step.step}
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TARGET AUDIENCES ── */}
      <section id="audiences" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white mb-4">
              Har bir foydalanuvchi uchun{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                alohida imkoniyatlar
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Talabalar, amaliyotchi mutaxassislar va oddiy fuqarolar o‘z maqsadiga muvofiq vositalardan foydalanadilar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {AUDIENCES.map(aud => {
              const Icon = aud.icon
              return (
                <div
                  key={aud.id}
                  className={`flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border p-7 shadow-sm hover:shadow-xl transition-all duration-300 ${aud.border}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${aud.badgeColor}`}
                      >
                        {aud.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-3">
                      {aud.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      {aud.description}
                    </p>

                    <div className="space-y-3 mb-8">
                      {aud.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {aud.primaryAction.disabled ? (
                      <div className="w-full text-center py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-850 rounded-xl select-none border border-slate-200 dark:border-slate-800">
                        {aud.primaryAction.label}
                      </div>
                    ) : (
                      <Link
                        href={aud.primaryAction.href}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                      >
                        {aud.primaryAction.label}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}

                    {aud.secondaryAction.disabled ? (
                      <div className="w-full text-center py-1.5 text-xs text-slate-400 dark:text-slate-500 select-none">
                        {aud.secondaryAction.label}
                      </div>
                    ) : (
                      <Link
                        href={aud.secondaryAction.href}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-colors"
                      >
                        {aud.secondaryAction.label}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION SECTION ── */}
      <section
        id="faq"
        className="py-20 sm:py-28 bg-slate-50/70 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white mb-4">
              Ko‘p beriladigan savollar
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Platformadan foydalanish, sud simulyatsiyasi va konstruktor haqida eng muhim javoblar.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-500 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ── */}
      <section className="py-20 sm:py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Yuridik mahoratingizni bugundan oshiring
          </h2>
          <p className="text-base sm:text-xl text-blue-100 mb-9 max-w-2xl mx-auto leading-relaxed">
            Respublika yuridik talabalari va amaliyotchilari bilan birgalikda Virtual Sudda ishtirok eting va real keyslarni yeching.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signin?mode=register"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-blue-700 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xl hover:-translate-y-0.5"
            >
              Bepul ro‘yxatdan o‘tish
            </Link>
            <Link
              href="/signin"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white border border-white/30 hover:bg-white/10 rounded-xl transition-colors"
            >
              Virtual Sudni sinab ko‘rish
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <div id="contact">
        <ContactSection />
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 text-white py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="mb-4">
                <SiteLogo size="sm" className="[&_span]:text-white" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                O‘zbekistonning yetakchi LegalTech platformasi. Huquqiy ta’lim, amaliyot va advokatura uchun yagona raqamli makon.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-200">Asosiy modullar</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <Link href="/signin" className="hover:text-white transition-colors">
                    Virtual Sud & Multiplayer
                  </Link>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-white transition-colors">
                    Hujjatlar Konstruktori
                  </Link>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-white transition-colors">
                    Qarorlar Daraxti
                  </Link>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-white transition-colors">
                    Kazus Yechish / IRAC
                  </Link>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-white transition-colors">
                    AI Yuridik Maslahatchi
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-200">Qonunchilik & Amaliyot</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <Link href="/signin" className="hover:text-white transition-colors">
                    Kodekslar va Qonunlar
                  </Link>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-white transition-colors">
                    Oliy Sud Plenum Amaliyoti
                  </Link>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-white transition-colors">
                    Reyting va Haftalik XP
                  </Link>
                </li>
                <li>
                  <Link href="/signin" className="hover:text-white transition-colors">
                    Yuridik Amaliyot
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-200">Huquqiy ma’lumotlar</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Foydalanish shartlari
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Maxfiylik siyosati
                  </Link>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Biz bilan bog‘lanish
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} JURISAI. Barcha huquqlar himoyalangan. O‘zbekiston Respublikasi.
          </div>
        </div>
      </footer>
    </div>
  )
}
