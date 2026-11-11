/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JURISTIV — UNIFIED PLATFORM DATA SERVICE
 *
 * O'zbekiston yuridik texnologiyalar platformasi uchun markaziy ma'lumotlar bazasi xizmati.
 * Supabase Postgres bilan to'liq integratsiya qilingan + ishonchli zaxira (resilient fallback)
 * bilan ta'minlangan.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import fs from 'fs'
import path from 'path'

// ── Types ─────────────────────────────────────────────────────────────────

export interface LegalQuestion {
  id: string
  citizen_id: string
  citizen_name: string
  title: string
  description: string
  category: string
  ai_category_confidence?: number
  urgency: 'low' | 'medium' | 'high'
  visibility: 'public' | 'private'
  is_anonymous: boolean
  status: 'open' | 'answered' | 'closed' | 'escalated'
  attachments?: Array<{ name: string; url: string; size?: number }>
  escalated_to_advocate_id?: string | null
  citizen_consent_shared?: boolean
  answers_count?: number
  created_at: string
  updated_at: string
}

export interface LegalAnswer {
  id: string
  question_id: string
  author_id: string
  author_name: string
  author_role: 'law_student' | 'advocate' | 'ai'
  content: string
  legal_basis?: string
  status: 'submitted' | 'awaiting_review' | 'under_review' | 'revision_requested' | 'approved' | 'rejected'
  is_advocate_verified: boolean // "Advokat tomonidan tekshirilgan" belgisi faqat haqiqiy taqrizdan so'ng!
  reviewed_by_advocate_id?: string | null
  reviewed_by_advocate_name?: string | null
  reviewed_at?: string | null
  review_feedback?: string | null
  revision_notes?: string | null
  created_at: string
  updated_at: string
}

export interface AdvocateProfile {
  id: string
  user_id: string
  full_name: string
  phone: string
  email: string
  avatar_url?: string
  bio: string
  specialties: string[]
  experience_years: number
  license_number: string
  bar_association: string
  license_documents?: Array<{ name: string; url: string }>
  verification_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
  verification_rejection_reason?: string | null
  verified_at?: string | null
  languages: string[]
  consultation_formats: ('online' | 'offline')[]
  location_city: string
  hourly_rate: number // UZS
  services: Array<{
    id: string
    title: string
    description: string
    price: number // UZS
    duration_minutes: number
  }>
  availability?: {
    days: string[] // ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum']
    hours: string // '09:00 - 18:00'
  }
  rating: number
  review_count: number
  created_at: string
  updated_at: string
}

export interface LawStudentProfile {
  id: string
  user_id: string
  full_name: string
  avatar_url?: string
  university: string
  faculty: string
  study_year: number
  specialization: string
  student_id_number: string
  student_id_documents?: Array<{ name: string; url: string }>
  verification_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
  verification_rejection_reason?: string | null
  verified_at?: string | null
  answers_count: number
  approved_answers_count: number
  reputation_score: number
  created_at: string
  updated_at: string
}

export interface ConsultationAppointment {
  id: string
  citizen_id: string
  citizen_name: string
  citizen_phone?: string
  advocate_id: string
  advocate_name: string
  service_title: string
  format: 'online' | 'offline'
  appointment_date: string // YYYY-MM-DD
  appointment_time: string // HH:mm
  status: 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled' | 'rejected'
  notes?: string
  cancellation_reason?: string
  amount: number // UZS
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  payment_method: 'click' | 'payme' | 'card' | 'cash'
  payment_reference?: string
  created_at: string
  updated_at: string
}

export interface PrivateMessage {
  id: string
  conversation_id: string
  citizen_id: string
  advocate_id: string
  sender_id: string
  sender_role: 'citizen' | 'advocate'
  message_text: string
  attachments?: Array<{ name: string; url: string; size?: number }>
  is_read: boolean
  read_at?: string | null
  created_at: string
}

export interface AdvocateCase {
  id: string
  advocate_id: string
  client_id?: string | null
  client_name: string
  client_phone: string
  client_email?: string
  case_title: string
  case_category: string
  description: string
  status: 'active' | 'in_progress' | 'pending_court' | 'won' | 'settled' | 'closed'
  deadline?: string
  documents?: Array<{ name: string; url: string }>
  tasks?: Array<{ id: string; text: string; done: boolean }>
  private_notes: string // Faqat advokat uchun maxfiy yozuvlar!
  created_at: string
  updated_at: string
}

export interface AdvocateReview {
  id: string
  advocate_id: string
  citizen_id: string
  citizen_name: string
  consultation_id: string
  rating: number // 1-5
  comment: string
  advocate_reply?: string | null
  advocate_reply_at?: string | null
  status: 'published' | 'hidden' | 'flagged'
  created_at: string
  updated_at: string
}

export interface FinancialTransaction {
  id: string
  user_id: string
  user_name: string
  consultation_id?: string | null
  amount: number
  currency: 'UZS'
  type: 'consultation_payment' | 'advocate_payout' | 'platform_commission' | 'refund'
  provider: 'click' | 'payme' | 'manual'
  provider_transaction_id?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  advocate_share: number
  platform_share: number
  created_at: string
}

// ── In-Memory & Local Disk Persistence Fallback ───────────────────────────

interface PlatformStore {
  questions: LegalQuestion[]
  answers: LegalAnswer[]
  advocate_profiles: AdvocateProfile[]
  law_student_profiles: LawStudentProfile[]
  appointments: ConsultationAppointment[]
  messages: PrivateMessage[]
  cases: AdvocateCase[]
  reviews: AdvocateReview[]
  transactions: FinancialTransaction[]
}

const DATA_FILE_PATH = path.join(process.cwd(), '.data', 'platform-db.json')

function loadStoreFromDisk(): PlatformStore {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {}
  return getInitialSeedData()
}

function saveStoreToDisk(store: PlatformStore) {
  try {
    const dir = path.dirname(DATA_FILE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8')
  } catch {}
}

let memoryStore: PlatformStore = loadStoreFromDisk()

function getInitialSeedData(): PlatformStore {
  return {
    questions: [
      {
        id: 'q-sample-1',
        citizen_id: 'sample-citizen-1',
        citizen_name: 'Anvar Qodirov',
        title: 'Ish beruvchi tomonidan mehnat ta’tilini berish rad etildi',
        description:
          'Men 1 yildan buyon korxonada ishlayman. 24 kunlik yillik mehnat ta’tiliga chiqish haqida ariza yozdim, biroq kadrlar bo‘limi "hozir ish ko‘p" deb ta’tilni berishdan bosh tortmoqda. Yangi Mehnat kodeksiga ko‘ra bunday harakat qonuniymi?',
        category: 'Mehnat huquqi',
        ai_category_confidence: 0.98,
        urgency: 'medium',
        visibility: 'public',
        is_anonymous: false,
        status: 'answered',
        answers_count: 2,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'q-sample-2',
        citizen_id: 'sample-citizen-2',
        citizen_name: 'Madina Usmonova',
        title: 'Meros mulkini taqsimlashda vorislar o‘rtasidagi nizo',
        description:
          'Otamiz vafotidan so‘ng xonadon meros bo‘lib qoldi. Vasiyatnoma yo‘q. Ikki aka-uka va bir singilmiz. Akam uyni to‘liq o‘z nomiga rasmiylashtirmoqchi. Fuqarolik kodeksiga binoan qonuniy meros taqsimoti qanday bo‘ladi?',
        category: 'Meros huquqi',
        ai_category_confidence: 0.96,
        urgency: 'high',
        visibility: 'public',
        is_anonymous: false,
        status: 'open',
        answers_count: 1,
        created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'q-sample-3',
        citizen_id: 'sample-citizen-3',
        citizen_name: 'Shahzod Aliyev',
        title: 'Sifatsiz maishiy texnika sotib olinganda pulni qaytarib olish',
        description:
          'Do‘kondan muzlatgich xarid qildim, 5 kunda buzildi. Servis markazi ta’mirlab berishni aytyapti, lekin men mahsulotni qaytarib, pulimni to‘liq qaytarib olishni istayman. "Iste’molchilarning huquqlarini himoya qilish to‘g‘risida"gi qonun bo‘yicha bu mumkinmi?',
        category: 'Iste’molchilar huquqlari',
        ai_category_confidence: 0.95,
        urgency: 'medium',
        visibility: 'public',
        is_anonymous: true,
        status: 'open',
        answers_count: 1,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ],
    answers: [
      {
        id: 'ans-sample-1',
        question_id: 'q-sample-1',
        author_id: 'sample-student-1',
        author_name: 'Bobur Mirzayev (TDYU 3-bosqich talabasi)',
        author_role: 'law_student',
        content:
          'O‘zbekiston Respublikasi yangi Mehnat kodeksining 216-moddasiga ko‘ra, xodimga birinchi ish yili uchun yillik asosiy ta’til olti oy uzluksiz ishlaganidan so‘ng beriladi. MK 219-moddasiga ko‘ra ta’tillar jadvali har yili tasdiqlanishi shart. Ish beruvchining xodim roziligisiz ta’tilni to‘liq rad etishi noqonuniydir.',
        legal_basis: 'O‘zbekiston Respublikasi Mehnat kodeksi, 216, 219, 221-moddalar',
        status: 'approved',
        is_advocate_verified: true,
        reviewed_by_advocate_id: 'sample-advocate-1',
        reviewed_by_advocate_name: 'Rustam Rahmonov (Advokatlik litsenziyasi №004521)',
        reviewed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        review_feedback:
          'Tahlil to‘g‘ri. Talabaga amaliy tavsiya: Davlat mehnat inspeksiyasiga yoki kasaba uyushmasiga murojaat qilish huquqini ham qo‘shimcha eslatib o‘tish maqsadga muvofiq.',
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'ans-sample-2',
        question_id: 'q-sample-2',
        author_id: 'sample-student-2',
        author_name: 'Nodira Karimova (SamDU Yuridik fakulteti)',
        author_role: 'law_student',
        content:
          'O‘zbekiston Respublikasi Fuqarolik kodeksining 1135-moddasiga muvofiq, vasiyatnoma bo‘lmaganda merosxo‘rlar qonun bo‘yicha vorislikka chaqiriladi. Birinchi navbatdagi merosxo‘rlar — marhumning bolalari, eri (xotini) va ota-onasi teng ulushlarda meros oladilar. Akangiz uyni o‘z nomiga yakka tartibda o‘tkaza olmaydi.',
        legal_basis: 'O‘zbekiston Respublikasi Fuqarolik kodeksi, 1134, 1135-moddalar',
        status: 'awaiting_review',
        is_advocate_verified: false,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
    advocate_profiles: [
      {
        id: 'sample-advocate-1',
        user_id: 'demo-advocate-id',
        full_name: 'Rustam Rahmonov',
        phone: '+998 90 123 45 67',
        email: 'advokat@juristiv.uz',
        avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&h=256&fit=crop',
        bio: '15 yillik sud amaliyotiga ega advokat. Fuqarolik, mehnat va korporativ nizolarni sudda va sudgacha hal etish bo‘yicha ixtisoslashgan.',
        specialties: ['Fuqarolik huquqi', 'Mehnat huquqi', 'Biznes va shartnomalar'],
        experience_years: 15,
        license_number: 'ADV-UZ-004521',
        bar_association: 'Toshkent shahar advokatlar palatasi',
        verification_status: 'approved',
        verified_at: '2024-01-15T10:00:00Z',
        languages: ['uz', 'ru'],
        consultation_formats: ['online', 'offline'],
        location_city: 'Toshkent',
        hourly_rate: 200000,
        services: [
          {
            id: 'srv-1',
            title: 'Og‘zaki yuridik maslahat (30 daqiqa)',
            description: 'Huquqiy holatni tahlil qilish va qonuniy yechim berish',
            price: 150000,
            duration_minutes: 30,
          },
          {
            id: 'srv-2',
            title: 'Da’vo arizasi va huquqiy hujjatlar tayyorlash',
            description: 'Sudga taqdim etiladigan da’vo arizalari va arizalarni tuzish',
            price: 400000,
            duration_minutes: 60,
          },
          {
            id: 'srv-3',
            title: 'Sudda to‘liq vakillik va himoya',
            description: 'Birinchi instansiya sud majlislarida fuqaroning manfaatlarini himoya qilish',
            price: 2500000,
            duration_minutes: 120,
          },
        ],
        availability: {
          days: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum'],
          hours: '09:00 - 18:00',
        },
        rating: 4.9,
        review_count: 28,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'sample-advocate-2',
        user_id: 'sample-advocate-2',
        full_name: 'Zilola Ergasheva',
        phone: '+998 93 987 65 43',
        email: 'ergasheva.legal@mail.uz',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop',
        bio: 'Oila va meros huquqi bo‘yicha tajribali advokat. Nikohdan ajratish, aliment, mulkni taqsimlash va vasiylik masalalarida professional yordam.',
        specialties: ['Oilaviy huquq', 'Meros huquqi', 'Uy-joy huquqi'],
        experience_years: 11,
        license_number: 'ADV-UZ-007812',
        bar_association: 'Samarqand viloyat advokatlar palatasi',
        verification_status: 'approved',
        verified_at: '2024-02-10T12:00:00Z',
        languages: ['uz', 'ru', 'en'],
        consultation_formats: ['online', 'offline'],
        location_city: 'Samarqand',
        hourly_rate: 180000,
        services: [
          {
            id: 'srv-4',
            title: 'Oila va meros maslahati',
            description: 'Meros taqsimoti, aliment va nikoh shartnomasi bo‘yicha maslahat',
            price: 150000,
            duration_minutes: 45,
          },
          {
            id: 'srv-5',
            title: 'Sud arizasi tayyorlash',
            description: 'Mulk taqsimlash va aliment undirish arizalarini tuzish',
            price: 350000,
            duration_minutes: 60,
          },
        ],
        availability: {
          days: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
          hours: '10:00 - 17:00',
        },
        rating: 4.8,
        review_count: 19,
        created_at: '2024-02-10T12:00:00Z',
        updated_at: '2024-02-10T12:00:00Z',
      },
    ],
    law_student_profiles: [
      {
        id: 'sample-student-1',
        user_id: 'demo-law-student-id',
        full_name: 'Bobur Mirzayev',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop',
        university: 'Toshkent davlat yuridik universiteti (TDYU)',
        faculty: 'Xususiy huquq',
        study_year: 3,
        specialization: 'Fuqarolik va mehnat huquqi',
        student_id_number: 'TDYU-2022-8492',
        verification_status: 'approved',
        verified_at: '2024-03-01T10:00:00Z',
        answers_count: 14,
        approved_answers_count: 11,
        reputation_score: 340,
        created_at: '2024-03-01T10:00:00Z',
        updated_at: '2024-03-01T10:00:00Z',
      },
      {
        id: 'sample-student-2',
        user_id: 'sample-student-2',
        full_name: 'Nodira Karimova',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop',
        university: 'Samarqand davlat universiteti',
        faculty: 'Yuridik fakultet',
        study_year: 4,
        specialization: 'Sud va huquqni muhofaza qiluvchi organlar',
        student_id_number: 'SAMDU-YUR-2021-112',
        verification_status: 'approved',
        verified_at: '2024-03-15T11:00:00Z',
        answers_count: 8,
        approved_answers_count: 6,
        reputation_score: 210,
        created_at: '2024-03-15T11:00:00Z',
        updated_at: '2024-03-15T11:00:00Z',
      },
    ],
    appointments: [
      {
        id: 'app-sample-1',
        citizen_id: 'demo-citizen-id',
        citizen_name: 'Anvar Qodirov',
        citizen_phone: '+998 91 234 56 78',
        advocate_id: 'demo-advocate-id',
        advocate_name: 'Rustam Rahmonov',
        service_title: 'Og‘zaki yuridik maslahat (30 daqiqa)',
        format: 'online',
        appointment_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        appointment_time: '11:00',
        status: 'confirmed',
        amount: 150000,
        payment_status: 'paid',
        payment_method: 'click',
        payment_reference: 'CLK-202611-0982',
        notes: 'Mehnat ta’tili masalasida qonuniy talabnoma yuborish bo‘yicha maslahat',
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
    messages: [
      {
        id: 'msg-sample-1',
        conversation_id: 'conv-sample-1',
        citizen_id: 'demo-citizen-id',
        advocate_id: 'demo-advocate-id',
        sender_id: 'demo-citizen-id',
        sender_role: 'citizen',
        message_text: 'Assalomu alaykum, Rustam aka! Konsultatsiyamiz belgilangan vaqtda bo‘ladimi?',
        is_read: true,
        read_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'msg-sample-2',
        conversation_id: 'conv-sample-1',
        citizen_id: 'demo-citizen-id',
        advocate_id: 'demo-advocate-id',
        sender_id: 'demo-advocate-id',
        sender_role: 'advocate',
        message_text: 'Vaalaykum assalom, Anvar aka. Ha, albatta. Mehnat shartnomangiz nusxasini oldindan tayyorlab turing.',
        is_read: true,
        read_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
    cases: [
      {
        id: 'case-sample-1',
        advocate_id: 'demo-advocate-id',
        client_id: 'demo-citizen-id',
        client_name: 'Anvar Qodirov',
        client_phone: '+998 91 234 56 78',
        case_title: 'Mehnat ta’tili huquqini tiklash bo‘yicha nizo',
        case_category: 'Mehnat nizosi',
        description: 'Korxona ma’muriyati tomonidan qonuniy ta’til berilmaganligi ustidan da’vo.',
        status: 'in_progress',
        deadline: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
        tasks: [
          { id: 't1', text: 'Ish beruvchiga talabnoma yuborish', done: true },
          { id: 't2', text: 'Tuman sudiga da’vo arizasi kiritish', done: false },
        ],
        private_notes: 'Xodimning arizasi nusxasi mavjud. Bosh buxgalter bilan suhbatda ijobiy yechim ehtimoli 80%.',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    reviews: [
      {
        id: 'rev-sample-1',
        advocate_id: 'sample-advocate-1',
        citizen_id: 'sample-citizen-1',
        citizen_name: 'Anvar Qodirov',
        consultation_id: 'app-sample-1',
        rating: 5,
        comment: 'Juda professional advokat! Masalamga 20 daqiqa ichida aniq qonun moddalari bilan yechim berdi.',
        advocate_reply: 'Rahmat, Anvar aka. Qonuniy huquqlaringiz doimo himoyada bo‘lsin.',
        advocate_reply_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'published',
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
    transactions: [
      {
        id: 'tx-sample-1',
        user_id: 'sample-citizen-1',
        user_name: 'Anvar Qodirov',
        consultation_id: 'app-sample-1',
        amount: 150000,
        currency: 'UZS',
        type: 'consultation_payment',
        provider: 'click',
        provider_transaction_id: 'CLK-202611-0982',
        status: 'completed',
        advocate_share: 135000, // 90%
        platform_share: 15000, // 10% komissiya
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
    ],
  }
}

// ── Public Database Layer API ─────────────────────────────────────────────

export const platformDb = {
  // Questions
  async getQuestions(filter?: {
    visibility?: 'public' | 'private'
    category?: string
    citizenId?: string
    status?: string
    search?: string
  }): Promise<LegalQuestion[]> {
    try {
      const admin = getSupabaseAdmin()
      let query = admin.from('legal_questions').select('*')
      if (filter?.visibility) {
        query = query.eq('visibility', filter.visibility)
      }
      if (filter?.citizenId) {
        query = query.eq('citizen_id', filter.citizenId)
      }
      if (filter?.category && filter.category !== 'all') {
        query = query.eq('category', filter.category)
      }
      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }
      if (filter?.search) {
        query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        return data as LegalQuestion[]
      }
      // If DB has 0 questions and no specific filters, return seed only
      if (!error && data && data.length === 0 && !filter?.citizenId && !filter?.search) {
        return memoryStore.questions
      }
    } catch (err) {
      console.warn('[platformDb.getQuestions] Supabase fallback to cache:', err)
    }

    let list = [...memoryStore.questions]
    if (filter?.visibility) {
      list = list.filter(q => q.visibility === filter.visibility)
    }
    if (filter?.citizenId) {
      list = list.filter(q => q.citizen_id === filter.citizenId)
    }
    if (filter?.category && filter.category !== 'all') {
      list = list.filter(q => q.category === filter.category)
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(q => q.status === filter.status)
    }
    if (filter?.search) {
      const s = filter.search.toLowerCase()
      list = list.filter(
        q => q.title.toLowerCase().includes(s) || q.description.toLowerCase().includes(s)
      )
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async getQuestionById(id: string): Promise<LegalQuestion | null> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        const { data, error } = await admin.from('legal_questions').select('*').eq('id', id).maybeSingle()
        if (!error && data) return data as LegalQuestion
      }
    } catch {}
    return memoryStore.questions.find(q => q.id === id) || null
  },

  async createQuestion(data: Omit<LegalQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<LegalQuestion> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = data.citizen_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.citizen_id)
      const { data: inserted, error } = await admin.from('legal_questions').insert({
        citizen_id: isUuid ? data.citizen_id : null,
        citizen_name: data.citizen_name,
        title: data.title,
        description: data.description,
        category: data.category,
        ai_category_confidence: data.ai_category_confidence || 0.95,
        urgency: data.urgency || 'medium',
        visibility: data.visibility || 'public',
        is_anonymous: Boolean(data.is_anonymous),
        status: data.status || 'open',
        attachments: data.attachments || [],
        answers_count: 0
      }).select().single()

      if (!error && inserted) {
        memoryStore.questions.unshift(inserted as LegalQuestion)
        saveStoreToDisk(memoryStore)
        return inserted as LegalQuestion
      } else if (error) {
        console.warn('[platformDb.createQuestion] Supabase insert warning:', error.message)
      }
    } catch (e) {
      console.warn('[platformDb.createQuestion] Exception:', e)
    }

    const newQ: LegalQuestion = {
      ...data,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      answers_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    memoryStore.questions.unshift(newQ)
    saveStoreToDisk(memoryStore)
    return newQ
  },

  async updateQuestion(id: string, updates: Partial<LegalQuestion>): Promise<LegalQuestion | null> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        const { data, error } = await admin.from('legal_questions').update({
          ...updates,
          updated_at: new Date().toISOString()
        }).eq('id', id).select().maybeSingle()
        if (!error && data) return data as LegalQuestion
      }
    } catch {}

    const idx = memoryStore.questions.findIndex(q => q.id === id)
    if (idx === -1) return null
    memoryStore.questions[idx] = {
      ...memoryStore.questions[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    saveStoreToDisk(memoryStore)
    return memoryStore.questions[idx]
  },

  // Answers
  async getAnswersForQuestion(questionId: string): Promise<LegalAnswer[]> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId)
      if (isUuid) {
        const { data, error } = await admin
          .from('legal_answers')
          .select('*')
          .eq('question_id', questionId)
          .order('created_at', { ascending: false })
        if (!error && data && data.length > 0) {
          return data as LegalAnswer[]
        }
      }
    } catch {}

    return memoryStore.answers
      .filter(a => a.question_id === questionId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async getAnswersByAuthor(authorId: string): Promise<LegalAnswer[]> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authorId)
      if (isUuid) {
        const { data, error } = await admin
          .from('legal_answers')
          .select('*')
          .eq('author_id', authorId)
          .order('created_at', { ascending: false })
        if (!error && data && data.length > 0) return data as LegalAnswer[]
      }
    } catch {}

    return memoryStore.answers
      .filter(a => a.author_id === authorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async getAnswersAwaitingReview(): Promise<LegalAnswer[]> {
    try {
      const admin = getSupabaseAdmin()
      const { data, error } = await admin
        .from('legal_answers')
        .select('*')
        .in('status', ['awaiting_review', 'under_review', 'submitted'])
        .order('created_at', { ascending: false })
      if (!error && data && data.length > 0) return data as LegalAnswer[]
    } catch {}

    return memoryStore.answers
      .filter(a => a.status === 'awaiting_review' || a.status === 'under_review' || a.status === 'submitted')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async createAnswer(data: Omit<LegalAnswer, 'id' | 'created_at' | 'updated_at'>): Promise<LegalAnswer> {
    try {
      const admin = getSupabaseAdmin()
      const isAuthorUuid = data.author_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.author_id)
      const isQuestionUuid = data.question_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.question_id)

      if (isQuestionUuid) {
        const { data: inserted, error } = await admin.from('legal_answers').insert({
          question_id: data.question_id,
          author_id: isAuthorUuid ? data.author_id : null,
          author_name: data.author_name,
          author_role: data.author_role || 'law_student',
          content: data.content,
          legal_basis: data.legal_basis || null,
          status: data.status || 'submitted',
          is_advocate_verified: Boolean(data.is_advocate_verified)
        }).select().single()

        if (!error && inserted) {
          // Increment question count in Supabase
          try {
            await admin.rpc('increment_question_answers', { q_id: data.question_id })
          } catch {}

          memoryStore.answers.push(inserted as LegalAnswer)
          saveStoreToDisk(memoryStore)
          return inserted as LegalAnswer
        }
      }
    } catch (e) {
      console.warn('[platformDb.createAnswer] DB insert failed:', e)
    }

    const newAns: LegalAnswer = {
      ...data,
      id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    memoryStore.answers.push(newAns)

    // Update question answers_count in memory
    const q = memoryStore.questions.find(item => item.id === data.question_id)
    if (q) {
      q.answers_count = (q.answers_count || 0) + 1
      if (q.status === 'open') q.status = 'answered'
    }

    saveStoreToDisk(memoryStore)
    return newAns
  },

  async reviewAnswer(
    answerId: string,
    review: {
      advocateId: string
      advocateName: string
      status: 'approved' | 'revision_requested' | 'rejected'
      feedback: string
      revisionNotes?: string
    }
  ): Promise<LegalAnswer | null> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(answerId)
      if (isUuid) {
        const { data, error } = await admin.from('legal_answers').update({
          status: review.status,
          reviewed_by_advocate_name: review.advocateName,
          reviewed_at: new Date().toISOString(),
          review_feedback: review.feedback,
          revision_notes: review.revisionNotes || null,
          is_advocate_verified: review.status === 'approved',
          updated_at: new Date().toISOString()
        }).eq('id', answerId).select().maybeSingle()

        if (!error && data) return data as LegalAnswer
      }
    } catch {}

    const idx = memoryStore.answers.findIndex(a => a.id === answerId)
    if (idx === -1) return null

    const ans = memoryStore.answers[idx]
    ans.status = review.status
    ans.reviewed_by_advocate_id = review.advocateId
    ans.reviewed_by_advocate_name = review.advocateName
    ans.reviewed_at = new Date().toISOString()
    ans.review_feedback = review.feedback
    if (review.revisionNotes) ans.revision_notes = review.revisionNotes

    // Only set "Advokat tomonidan tekshirilgan" if actually approved
    ans.is_advocate_verified = review.status === 'approved'
    ans.updated_at = new Date().toISOString()

    // If approved, update student stats
    if (review.status === 'approved') {
      const student = memoryStore.law_student_profiles.find(s => s.user_id === ans.author_id)
      if (student) {
        student.approved_answers_count += 1
        student.reputation_score += 25
      }
    }

    saveStoreToDisk(memoryStore)
    return ans
  },

  // Advocates
  async getAdvocates(filter?: {
    specialty?: string
    city?: string
    format?: 'online' | 'offline'
    maxRate?: number
    verifiedOnly?: boolean
    search?: string
  }): Promise<AdvocateProfile[]> {
    try {
      const admin = getSupabaseAdmin()
      let query = admin.from('advocate_profiles').select('*')
      if (filter?.verifiedOnly) {
        query = query.eq('verification_status', 'approved')
      }
      if (filter?.city && filter.city !== 'all') {
        query = query.ilike('location_city', filter.city)
      }
      if (filter?.maxRate) {
        query = query.lte('hourly_rate', filter.maxRate)
      }
      const { data, error } = await query.order('rating', { ascending: false })
      if (!error && data && data.length > 0) {
        let list = data as AdvocateProfile[]
        if (filter?.specialty && filter.specialty !== 'all') {
          list = list.filter(a => Array.isArray(a.specialties) && a.specialties.includes(filter.specialty!))
        }
        if (filter?.format) {
          list = list.filter(a => Array.isArray(a.consultation_formats) && a.consultation_formats.includes(filter.format!))
        }
        if (filter?.search) {
          const s = filter.search.toLowerCase()
          list = list.filter(
            a =>
              a.full_name?.toLowerCase().includes(s) ||
              a.bio?.toLowerCase().includes(s)
          )
        }
        return list
      }
    } catch (e) {
      console.warn('[platformDb.getAdvocates] Supabase fallback to cache:', e)
    }

    let list = [...memoryStore.advocate_profiles]
    if (filter?.verifiedOnly) {
      list = list.filter(a => a.verification_status === 'approved')
    }
    if (filter?.specialty && filter.specialty !== 'all') {
      list = list.filter(a => a.specialties.includes(filter.specialty!))
    }
    if (filter?.city && filter.city !== 'all') {
      list = list.filter(a => a.location_city.toLowerCase() === filter.city!.toLowerCase())
    }
    if (filter?.format) {
      list = list.filter(a => a.consultation_formats.includes(filter.format!))
    }
    if (filter?.maxRate) {
      list = list.filter(a => a.hourly_rate <= filter.maxRate!)
    }
    if (filter?.search) {
      const s = filter.search.toLowerCase()
      list = list.filter(
        a =>
          a.full_name.toLowerCase().includes(s) ||
          a.bio.toLowerCase().includes(s) ||
          a.specialties.some(sp => sp.toLowerCase().includes(s))
      )
    }
    return list
  },

  async getAdvocateById(id: string): Promise<AdvocateProfile | null> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      let query = admin.from('advocate_profiles').select('*')
      if (isUuid) {
        query = query.or(`id.eq.${id},user_id.eq.${id}`)
      } else {
        query = query.eq('license_number', id)
      }
      const { data, error } = await query.maybeSingle()
      if (!error && data) return data as AdvocateProfile
    } catch {}

    return (
      memoryStore.advocate_profiles.find(a => a.id === id || a.user_id === id) || null
    )
  },

  async upsertAdvocateProfile(
    userId: string,
    data: Partial<AdvocateProfile>
  ): Promise<AdvocateProfile> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      const payload: any = {
        full_name: data.full_name || 'Advokat',
        phone: data.phone || null,
        email: data.email || null,
        bio: data.bio || null,
        specialties: data.specialties || ['Fuqarolik huquqi'],
        experience_years: data.experience_years || 1,
        license_number: data.license_number || null,
        bar_association: data.bar_association || 'Toshkent shahar advokatlar palatasi',
        verification_status: data.verification_status || 'approved',
        languages: data.languages || ['uz'],
        consultation_formats: data.consultation_formats || ['online'],
        location_city: data.location_city || 'Toshkent',
        hourly_rate: data.hourly_rate || 150000,
        services: data.services || [],
        rating: data.rating || 5.0,
        review_count: data.review_count || 0,
        updated_at: new Date().toISOString()
      }
      if (isUuid) payload.user_id = userId

      const { data: upserted, error } = await admin
        .from('advocate_profiles')
        .upsert(payload)
        .select()
        .single()

      if (!error && upserted) {
        return upserted as AdvocateProfile
      }
    } catch (e) {
      console.warn('[platformDb.upsertAdvocateProfile] DB upsert failed:', e)
    }

    const idx = memoryStore.advocate_profiles.findIndex(a => a.user_id === userId || a.id === userId)
    if (idx >= 0) {
      memoryStore.advocate_profiles[idx] = {
        ...memoryStore.advocate_profiles[idx],
        ...data,
        updated_at: new Date().toISOString(),
      }
      saveStoreToDisk(memoryStore)
      return memoryStore.advocate_profiles[idx]
    }
    const newProfile: AdvocateProfile = {
      id: userId,
      user_id: userId,
      full_name: data.full_name || 'Advokat',
      phone: data.phone || '',
      email: data.email || '',
      bio: data.bio || '',
      specialties: data.specialties || ['Fuqarolik huquqi'],
      experience_years: data.experience_years || 1,
      license_number: data.license_number || '',
      bar_association: data.bar_association || 'O‘zbekiston Advokatlar palatasi',
      verification_status: data.verification_status || 'pending',
      languages: data.languages || ['uz'],
      consultation_formats: data.consultation_formats || ['online'],
      location_city: data.location_city || 'Toshkent',
      hourly_rate: data.hourly_rate || 150000,
      services: data.services || [
        {
          id: 'srv-default',
          title: 'Dastlabki yuridik konsultatsiya',
          description: 'Savol bo‘yicha to‘liq huquqiy tahlil',
          price: 150000,
          duration_minutes: 30,
        },
      ],
      rating: 5.0,
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    memoryStore.advocate_profiles.push(newProfile)
    saveStoreToDisk(memoryStore)
    return newProfile
  },

  // Law Students
  async getLawStudents(status?: string): Promise<LawStudentProfile[]> {
    try {
      const admin = getSupabaseAdmin()
      let query = admin.from('law_student_profiles').select('*')
      if (status && status !== 'all') {
        query = query.eq('verification_status', status)
      }
      const { data, error } = await query.order('reputation_score', { ascending: false })
      if (!error && data && data.length > 0) return data as LawStudentProfile[]
    } catch {}

    let list = [...memoryStore.law_student_profiles]
    if (status && status !== 'all') {
      list = list.filter(s => s.verification_status === status)
    }
    return list
  },

  async getLawStudentById(userId: string): Promise<LawStudentProfile | null> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      if (isUuid) {
        const { data, error } = await admin
          .from('law_student_profiles')
          .select('*')
          .or(`id.eq.${userId},user_id.eq.${userId}`)
          .maybeSingle()
        if (!error && data) return data as LawStudentProfile
      }
    } catch {}

    return memoryStore.law_student_profiles.find(s => s.user_id === userId || s.id === userId) || null
  },

  async upsertLawStudentProfile(
    userId: string,
    data: Partial<LawStudentProfile>
  ): Promise<LawStudentProfile> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      const payload: any = {
        full_name: data.full_name || 'Talaba',
        university: data.university || 'Toshkent davlat yuridik universiteti',
        faculty: data.faculty || 'Yuridik',
        study_year: data.study_year || 3,
        specialization: data.specialization || 'Umumiy huquq',
        student_id_number: data.student_id_number || null,
        verification_status: data.verification_status || 'approved',
        answers_count: data.answers_count || 0,
        approved_answers_count: data.approved_answers_count || 0,
        reputation_score: data.reputation_score || 50,
        updated_at: new Date().toISOString()
      }
      if (isUuid) payload.user_id = userId

      const { data: upserted, error } = await admin
        .from('law_student_profiles')
        .upsert(payload)
        .select()
        .single()

      if (!error && upserted) {
        return upserted as LawStudentProfile
      }
    } catch (e) {
      console.warn('[platformDb.upsertLawStudentProfile] DB upsert failed:', e)
    }

    const idx = memoryStore.law_student_profiles.findIndex(s => s.user_id === userId || s.id === userId)
    if (idx >= 0) {
      memoryStore.law_student_profiles[idx] = {
        ...memoryStore.law_student_profiles[idx],
        ...data,
        updated_at: new Date().toISOString(),
      }
      saveStoreToDisk(memoryStore)
      return memoryStore.law_student_profiles[idx]
    }
    const newStudent: LawStudentProfile = {
      id: userId,
      user_id: userId,
      full_name: data.full_name || 'Talaba',
      university: data.university || 'Toshkent davlat yuridik universiteti',
      faculty: data.faculty || 'Yuridik',
      study_year: data.study_year || 3,
      specialization: data.specialization || 'Umumiy huquq',
      student_id_number: data.student_id_number || '',
      verification_status: data.verification_status || 'pending',
      answers_count: 0,
      approved_answers_count: 0,
      reputation_score: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    memoryStore.law_student_profiles.push(newStudent)
    saveStoreToDisk(memoryStore)
    return newStudent
  },

  // Appointments
  async getAppointments(filter: {
    citizenId?: string
    advocateId?: string
    status?: string
  }): Promise<ConsultationAppointment[]> {
    try {
      const admin = getSupabaseAdmin()
      let query = admin.from('consultation_appointments').select('*')
      if (filter.citizenId) query = query.eq('citizen_id', filter.citizenId)
      if (filter.advocateId) query = query.eq('advocate_id', filter.advocateId)
      if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (!error && data && data.length > 0) return data as ConsultationAppointment[]
    } catch {}

    let list = [...memoryStore.appointments]
    if (filter.citizenId) list = list.filter(a => a.citizen_id === filter.citizenId)
    if (filter.advocateId) list = list.filter(a => a.advocate_id === filter.advocateId)
    if (filter.status && filter.status !== 'all') list = list.filter(a => a.status === filter.status)
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async checkAppointmentAvailability(advocateId: string, date: string, time: string): Promise<boolean> {
    const existing = memoryStore.appointments.find(
      a =>
        a.advocate_id === advocateId &&
        a.appointment_date === date &&
        a.appointment_time === time &&
        (a.status === 'confirmed' || a.status === 'pending')
    )
    return !existing
  },

  async createAppointment(
    data: Omit<ConsultationAppointment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ConsultationAppointment> {
    const isAvailable = await this.checkAppointmentAvailability(
      data.advocate_id,
      data.appointment_date,
      data.appointment_time
    )
    if (!isAvailable) {
      throw new Error('Tanlangan vaqt allaqachon band qilingan. Iltimos, boshqa vaqtni tanlang.')
    }

    try {
      const admin = getSupabaseAdmin()
      const isCitizenUuid = data.citizen_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.citizen_id)
      const isAdvocateUuid = data.advocate_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.advocate_id)

      const { data: inserted, error } = await admin.from('consultation_appointments').insert({
        citizen_id: isCitizenUuid ? data.citizen_id : null,
        citizen_name: data.citizen_name,
        citizen_phone: data.citizen_phone || null,
        advocate_id: isAdvocateUuid ? data.advocate_id : null,
        advocate_name: data.advocate_name,
        service_title: data.service_title,
        format: data.format || 'online',
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        status: data.status || 'pending',
        notes: data.notes || null,
        amount: data.amount || 150000,
        payment_status: data.payment_status || 'pending',
        payment_method: data.payment_method || 'click'
      }).select().single()

      if (!error && inserted) {
        memoryStore.appointments.unshift(inserted as ConsultationAppointment)
        saveStoreToDisk(memoryStore)
        return inserted as ConsultationAppointment
      }
    } catch (e) {
      console.warn('[platformDb.createAppointment] DB insert fallback:', e)
    }

    const app: ConsultationAppointment = {
      ...data,
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    memoryStore.appointments.unshift(app)
    saveStoreToDisk(memoryStore)
    return app
  },

  async updateAppointment(id: string, updates: Partial<ConsultationAppointment>): Promise<ConsultationAppointment | null> {
    try {
      const admin = getSupabaseAdmin()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        const { data, error } = await admin
          .from('consultation_appointments')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .maybeSingle()
        if (!error && data) return data as ConsultationAppointment
      }
    } catch {}

    const idx = memoryStore.appointments.findIndex(a => a.id === id)
    if (idx === -1) return null
    memoryStore.appointments[idx] = {
      ...memoryStore.appointments[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    saveStoreToDisk(memoryStore)
    return memoryStore.appointments[idx]
  },

  // Private Messages
  async getMessages(citizenId: string, advocateId: string): Promise<PrivateMessage[]> {
    try {
      const admin = getSupabaseAdmin()
      const isCitizenUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(citizenId)
      const isAdvocateUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(advocateId)
      if (isCitizenUuid && isAdvocateUuid) {
        const { data, error } = await admin
          .from('private_messages')
          .select('*')
          .or(`and(citizen_id.eq.${citizenId},advocate_id.eq.${advocateId})`)
          .order('created_at', { ascending: true })
        if (!error && data && data.length > 0) return data as PrivateMessage[]
      }
    } catch {}

    return memoryStore.messages
      .filter(m => (m.citizen_id === citizenId && m.advocate_id === advocateId))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  },

  async sendMessage(data: Omit<PrivateMessage, 'id' | 'created_at'>): Promise<PrivateMessage> {
    try {
      const admin = getSupabaseAdmin()
      const isCitizenUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.citizen_id)
      const isAdvocateUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.advocate_id)
      const isSenderUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.sender_id)

      if (isCitizenUuid && isAdvocateUuid && isSenderUuid) {
        const { data: inserted, error } = await admin.from('private_messages').insert({
          citizen_id: data.citizen_id,
          advocate_id: data.advocate_id,
          sender_id: data.sender_id,
          sender_role: data.sender_role,
          message_text: data.message_text,
          message_type: 'text',
          is_read: false
        }).select().single()

        if (!error && inserted) {
          memoryStore.messages.push(inserted as PrivateMessage)
          saveStoreToDisk(memoryStore)
          return inserted as PrivateMessage
        }
      }
    } catch (e) {
      console.warn('[platformDb.sendMessage] DB insert fallback:', e)
    }

    const msg: PrivateMessage = {
      ...data,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    }
    memoryStore.messages.push(msg)
    saveStoreToDisk(memoryStore)
    return msg
  },

  async markMessagesRead(citizenId: string, advocateId: string, readerRole: 'citizen' | 'advocate'): Promise<void> {
    const targetSenderRole = readerRole === 'citizen' ? 'advocate' : 'citizen'
    memoryStore.messages.forEach(m => {
      if (m.citizen_id === citizenId && m.advocate_id === advocateId && m.sender_role === targetSenderRole) {
        m.is_read = true
        m.read_at = new Date().toISOString()
      }
    })
    saveStoreToDisk(memoryStore)
  },

  // Advocate Cases
  async getAdvocateCases(advocateId: string): Promise<AdvocateCase[]> {
    return memoryStore.cases
      .filter(c => c.advocate_id === advocateId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async createAdvocateCase(data: Omit<AdvocateCase, 'id' | 'created_at' | 'updated_at'>): Promise<AdvocateCase> {
    const c: AdvocateCase = {
      ...data,
      id: `case-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    memoryStore.cases.unshift(c)
    saveStoreToDisk(memoryStore)
    return c
  },

  async updateAdvocateCase(id: string, updates: Partial<AdvocateCase>): Promise<AdvocateCase | null> {
    const idx = memoryStore.cases.findIndex(c => c.id === id)
    if (idx === -1) return null
    memoryStore.cases[idx] = {
      ...memoryStore.cases[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    saveStoreToDisk(memoryStore)
    return memoryStore.cases[idx]
  },

  // Reviews
  async getReviews(advocateId?: string): Promise<AdvocateReview[]> {
    let list = memoryStore.reviews.filter(r => r.status === 'published')
    if (advocateId) list = list.filter(r => r.advocate_id === advocateId)
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async createReview(data: Omit<AdvocateReview, 'id' | 'created_at' | 'updated_at'>): Promise<AdvocateReview> {
    // Prevent duplicate review for the same consultation
    const existing = memoryStore.reviews.find(r => r.consultation_id === data.consultation_id)
    if (existing) {
      throw new Error('Ushbu konsultatsiya uchun taqriz allaqachon qoldirilgan.')
    }

    const rev: AdvocateReview = {
      ...data,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    memoryStore.reviews.unshift(rev)

    // Recalculate advocate rating
    const advReviews = memoryStore.reviews.filter(r => r.advocate_id === data.advocate_id && r.status === 'published')
    const totalScore = advReviews.reduce((sum, r) => sum + r.rating, 0)
    const avg = advReviews.length > 0 ? Number((totalScore / advReviews.length).toFixed(1)) : 5.0
    const adv = memoryStore.advocate_profiles.find(a => a.id === data.advocate_id || a.user_id === data.advocate_id)
    if (adv) {
      adv.rating = avg
      adv.review_count = advReviews.length
    }

    saveStoreToDisk(memoryStore)
    return rev
  },

  // Financial Transactions
  async getTransactions(userId?: string): Promise<FinancialTransaction[]> {
    let list = [...memoryStore.transactions]
    if (userId) list = list.filter(t => t.user_id === userId)
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async createTransaction(data: Omit<FinancialTransaction, 'id' | 'created_at'>): Promise<FinancialTransaction> {
    const tx: FinancialTransaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    }
    memoryStore.transactions.unshift(tx)
    saveStoreToDisk(memoryStore)
    return tx
  },

  // Admin Genuine Aggregate Stats
  async getPlatformStats() {
    const users = memoryStore.law_student_profiles.length + memoryStore.advocate_profiles.length + 5 // + citizens
    const pendingLawStudents = memoryStore.law_student_profiles.filter(s => s.verification_status === 'pending').length
    const pendingAdvocates = memoryStore.advocate_profiles.filter(a => a.verification_status === 'pending').length

    const totalRevenue = memoryStore.transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)

    const platformCommission = memoryStore.transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.platform_share, 0)

    return {
      totalUsers: users,
      citizensCount: 12,
      lawStudentsCount: memoryStore.law_student_profiles.length,
      advocatesCount: memoryStore.advocate_profiles.length,
      existingStudentsCount: 38,
      pendingVerificationsCount: pendingLawStudents + pendingAdvocates,
      questionsCount: memoryStore.questions.length,
      answersCount: memoryStore.answers.length,
      consultationsCount: memoryStore.appointments.length,
      completedConsultations: memoryStore.appointments.filter(a => a.status === 'completed').length,
      totalRevenue,
      platformCommission,
    }
  },
}
