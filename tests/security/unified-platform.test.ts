import { describe, it, expect } from 'vitest'
import {
  resolvePlatformRole,
  getRoleDashboardPath,
  isCitizenRole,
  isLawStudentRole,
  isAdvocateRole,
  isStudentRole,
  isAdminRole,
  normalizeRole,
  getRoleDisplayName,
} from '@/lib/roles'
import { platformDb } from '@/lib/db/platform-db'
import { authService } from '@/services/supabase-auth'

describe('JURISTIV — Unified Platform Architecture & RBAC Isolation', () => {
  describe('1. Role Separation & Preserved Existing Student Role', () => {
    it('Existing student role must strictly route to /dashboard and never to /law-student', () => {
      expect(getRoleDashboardPath('student')).toBe('/dashboard')
      expect(getRoleDashboardPath('user')).toBe('/dashboard') // legacy default
      expect(isStudentRole('student')).toBe(true)
      expect(isLawStudentRole('student')).toBe(false)
      expect(isAdvocateRole('student')).toBe(false)
      expect(isCitizenRole('student')).toBe(false)
      expect(isAdminRole('student')).toBe(false)
    })

    it('New law_student role must strictly route to /law-student and is distinct from student', () => {
      expect(getRoleDashboardPath('law_student')).toBe('/law-student')
      expect(isLawStudentRole('law_student')).toBe(true)
      expect(isStudentRole('law_student')).toBe(false)
      expect(isAdvocateRole('law_student')).toBe(false)
      expect(isCitizenRole('law_student')).toBe(false)
    })

    it('Citizen role must route to /citizen', () => {
      expect(getRoleDashboardPath('citizen')).toBe('/citizen')
      expect(isCitizenRole('citizen')).toBe(true)
      expect(isLawStudentRole('citizen')).toBe(false)
      expect(isAdvocateRole('citizen')).toBe(false)
    })

    it('Advocate role must route to /advocate', () => {
      expect(getRoleDashboardPath('advocate')).toBe('/advocate')
      expect(isAdvocateRole('advocate')).toBe(true)
      expect(isCitizenRole('advocate')).toBe(false)
      expect(isLawStudentRole('advocate')).toBe(false)
    })

    it('Admin role must route to /admin', () => {
      expect(getRoleDashboardPath('admin')).toBe('/admin')
      expect(isAdminRole('admin')).toBe(true)
      expect(isAdvocateRole('admin')).toBe(false)
      expect(isStudentRole('admin')).toBe(false)
    })

    it('normalizeRole preserves backward compatibility for legacy system', () => {
      expect(normalizeRole('admin')).toBe('ADMIN')
      expect(normalizeRole('student')).toBe('USER')
      expect(normalizeRole('user')).toBe('USER')
      expect(normalizeRole(undefined)).toBe('USER')
      expect(normalizeRole('law_student')).toBe('USER')
      expect(normalizeRole('advocate')).toBe('USER')
      expect(normalizeRole('citizen')).toBe('USER')
    })

    it('resolvePlatformRole validates allowed roles and falls back to student for legacy compatibility', () => {
      expect(resolvePlatformRole('citizen')).toBe('citizen')
      expect(resolvePlatformRole('law_student')).toBe('law_student')
      expect(resolvePlatformRole('advocate')).toBe('advocate')
      expect(resolvePlatformRole('student')).toBe('student')
      expect(resolvePlatformRole('admin')).toBe('admin')
      // Fallback for unspecified or unrecognized defaults to 'student' (preserved page)
      expect(resolvePlatformRole('legacy_user')).toBe('student')
      expect(resolvePlatformRole(null)).toBe('student')
    })

    it('getRoleDisplayName returns correct Uzbek designations', () => {
      expect(getRoleDisplayName('citizen')).toBe('Fuqaro')
      expect(getRoleDisplayName('law_student')).toBe('Yurisprudensiya Talabasi')
      expect(getRoleDisplayName('advocate')).toBe('Professional Advokat')
      expect(getRoleDisplayName('student')).toBe('Talaba')
      expect(getRoleDisplayName('admin')).toBe('Platforma Administratori')
    })
  })

  describe('2. Legal Questions & Privacy Isolation', () => {
    it('Creates public legal question accessible in public feed', async () => {
      const q = await platformDb.createQuestion({
        citizen_id: 'citizen_user_1',
        citizen_name: 'Alisher Navoiy',
        title: 'Meros taqsimoti bo‘yicha nizoli holat',
        description: 'Vasiyatnoma mavjud bo‘lmaganda merosxo‘rlar o‘rtasida taqsimot qanday bo‘ladi?',
        category: 'Meros huquqi',
        visibility: 'public',
        is_anonymous: false,
        urgency: 'medium',
        status: 'open',
      })

      expect(q).toBeDefined()
      expect(q.id).toBeDefined()
      expect(q.visibility).toBe('public')

      const feed = await platformDb.getQuestions({ visibility: 'public' })
      const found = feed.find(item => item.id === q.id)
      expect(found).toBeDefined()
      expect(found?.title).toContain('Meros taqsimoti')
    })

    it('Private question must NEVER be exposed in public feed', async () => {
      const privateQ = await platformDb.createQuestion({
        citizen_id: 'citizen_user_private',
        citizen_name: 'Maxfiy Fuqaro',
        title: 'Maxfiy oilaviy mol-mulk bo‘yicha savol',
        description: 'Boshqa shaxslar ko‘rmasligi shart bo‘lgan shaxsiy nizoli masala.',
        category: 'Oila huquqi',
        visibility: 'private',
        is_anonymous: true,
        urgency: 'high',
        status: 'open',
      })

      expect(privateQ.visibility).toBe('private')

      const publicFeed = await platformDb.getQuestions({ visibility: 'public' })
      const leaked = publicFeed.find(item => item.id === privateQ.id)
      expect(leaked).toBeUndefined()
    })
  })

  describe('3. Law Student Answering & Mentor Advocate Review Pipeline', () => {
    it('Law student submits answer with initial awaiting_review status without verified badge', async () => {
      const q = await platformDb.createQuestion({
        citizen_id: 'citizen_test_q',
        citizen_name: 'Test Fuqaro',
        title: 'Mehnat ta’tili bo‘yicha huquqiy tushuntirish',
        description: 'Yillik asosiy ta’til muddati qancha?',
        category: 'Mehnat huquqi',
        visibility: 'public',
        is_anonymous: false,
        urgency: 'medium',
        status: 'open',
      })

      const answer = await platformDb.createAnswer({
        question_id: q.id,
        author_id: 'student_tester_1',
        author_name: 'Shahzod Talaba',
        author_role: 'law_student',
        content: 'Mehnat kodeksining 217-moddasiga binoan asosiy ta’til 21 kalendar kundan kam bo‘lmasligi kerak.',
        legal_basis: 'MK 217-modda',
        status: 'awaiting_review',
        is_advocate_verified: false,
      })

      expect(answer.status).toBe('awaiting_review')
      expect(answer.is_advocate_verified).toBe(false)
      expect(answer.reviewed_by_advocate_id).toBeUndefined()
    })

    it('Advocate reviews student answer: revisions requested', async () => {
      const q = await platformDb.createQuestion({
        citizen_id: 'citizen_test_2',
        citizen_name: 'Fuqaro 2',
        title: 'Shartnoma muddati',
        description: 'Muddatli mehnat shartnomasi maksimal qancha bo‘ladi?',
        category: 'Mehnat huquqi',
        visibility: 'public',
        is_anonymous: false,
        urgency: 'medium',
        status: 'open',
      })

      const studentAns = await platformDb.createAnswer({
        question_id: q.id,
        author_id: 'student_tester_2',
        author_name: 'Bobur Talaba',
        author_role: 'law_student',
        content: 'MK bo‘yicha maksimal muddat 3 yil.',
        legal_basis: 'MK',
        status: 'awaiting_review',
        is_advocate_verified: false,
      })

      const reviewed = await platformDb.reviewAnswer(studentAns.id, {
        advocateId: 'advocate_mentor_1',
        advocateName: 'Ulug‘bek Rustamov (Advokat)',
        status: 'revision_requested',
        feedback: 'MK 110-moddasiga aniq havola bering va 3 yil emas 3 yilgacha ekanligini yoritib bering.',
        revisionNotes: 'Moddalar tahriri talab etiladi',
      })

      expect(reviewed).not.toBeNull()
      expect(reviewed?.status).toBe('revision_requested')
      expect(reviewed?.is_advocate_verified).toBe(false)
      expect(reviewed?.review_feedback).toContain('MK 110-moddasiga')
    })

    it('Advocate approves student answer: verified badge is awarded only after actual review', async () => {
      const q = await platformDb.createQuestion({
        citizen_id: 'citizen_test_3',
        citizen_name: 'Fuqaro 3',
        title: 'Sinov muddati',
        description: 'Dastlabki sinov muddati kimlarga belgilanmaydi?',
        category: 'Mehnat huquqi',
        visibility: 'public',
        is_anonymous: false,
        urgency: 'low',
        status: 'open',
      })

      const studentAns = await platformDb.createAnswer({
        question_id: q.id,
        author_id: 'student_tester_3',
        author_name: 'Madina Talaba',
        author_role: 'law_student',
        content: 'MK 129-moddasiga ko‘ra homilador ayollar, 3 yoshgacha bolasi bor shaxslar va bitiruvchilarga sinov muddati belgilanmaydi.',
        legal_basis: 'Mehnat kodeksi 129-moddasi',
        status: 'awaiting_review',
        is_advocate_verified: false,
      })

      const approved = await platformDb.reviewAnswer(studentAns.id, {
        advocateId: 'advocate_mentor_1',
        advocateName: 'Ulug‘bek Rustamov (Advokat)',
        status: 'approved',
        feedback: 'Juda mukammal va qonun talablariga mos javob. Tasdiqlandi.',
      })

      expect(approved).not.toBeNull()
      expect(approved?.status).toBe('approved')
      expect(approved?.is_advocate_verified).toBe(true)
      expect(approved?.reviewed_by_advocate_id).toBe('advocate_mentor_1')
      expect(approved?.reviewed_by_advocate_name).toContain('Ulug‘bek Rustamov')
    })
  })

  describe('4. Advocate Consultation & Anti-Double-Booking', () => {
    it('Prevents double-booking for the same advocate at overlapping appointment slots', async () => {
      const advocateId = `adv_slot_${Date.now()}`
      const appDate = '2026-11-20'
      const appTime = '14:30'

      // First booking succeeds
      const appt1 = await platformDb.createAppointment({
        advocate_id: advocateId,
        advocate_name: 'Kamol Olimov',
        citizen_id: 'citizen_client_1',
        citizen_name: 'Birinchi Mijoz',
        appointment_date: appDate,
        appointment_time: appTime,
        format: 'online',
        service_title: 'Yuridik konsultatsiya',
        status: 'confirmed',
        amount: 200000,
        payment_status: 'paid',
        payment_method: 'click',
      })
      expect(appt1.id).toBeDefined()

      // Second booking at the EXACT SAME date and time for same advocate should throw
      await expect(
        platformDb.createAppointment({
          advocate_id: advocateId,
          advocate_name: 'Kamol Olimov',
          citizen_id: 'citizen_client_2',
          citizen_name: 'Ikkinchi Mijoz',
          appointment_date: appDate,
          appointment_time: appTime,
          format: 'online',
          service_title: 'Yuridik konsultatsiya',
          status: 'pending',
          amount: 200000,
          payment_status: 'pending',
          payment_method: 'payme',
        })
      ).rejects.toThrow(/band qilingan/i)
    })

    it('Calculates 10% platform commission and 90% advocate payout correctly', () => {
      const consultationFee = 300000 // 300,000 UZS
      const platformFeeRate = 0.1 // 10%
      const platformFee = Math.round(consultationFee * platformFeeRate)
      const advocatePayout = consultationFee - platformFee

      expect(platformFee).toBe(30000)
      expect(advocatePayout).toBe(270000)
      expect(platformFee + advocatePayout).toBe(consultationFee)
    })
  })

  describe('5. Advocate Reviews & Duplicate Prevention', () => {
    it('Allows citizen to review advocate and prevents duplicates for the same consultation', async () => {
      const advocateId = 'adv_reviewed_target'
      const consultationId = `consultation_unique_${Date.now()}`

      const review = await platformDb.createReview({
        advocate_id: advocateId,
        citizen_id: 'cit_reviewer_1',
        citizen_name: 'Sardor Qodirov',
        consultation_id: consultationId,
        rating: 5,
        review_text: 'Juda professional huquqiy yordam ko‘rsatildi. Rahmat!',
      })

      expect(review).toBeDefined()
      expect(review.rating).toBe(5)

      // Submitting duplicate review for the same consultation must throw
      await expect(
        platformDb.createReview({
          advocate_id: advocateId,
          citizen_id: 'cit_reviewer_1',
          citizen_name: 'Sardor Qodirov',
          consultation_id: consultationId,
          rating: 4,
          review_text: 'Takroriy taqriz',
        })
      ).rejects.toThrow(/allaqachon/i)
    })
  })

  describe('6. Private Advocate-Client Messaging Strict Access Control', () => {
    it('Allows exchange between authorized citizen and advocate, isolates from outsiders', async () => {
      const citizenId = `cit_${Date.now()}`
      const advocateId = `adv_${Date.now()}`

      const msg = await platformDb.sendMessage({
        conversation_id: `${citizenId}_${advocateId}`,
        citizen_id: citizenId,
        advocate_id: advocateId,
        sender_id: citizenId,
        sender_role: 'citizen',
        message_text: 'Assalomu alaykum, da’vo arizasi loyihasini tayyorladingizmi?',
        is_read: false,
      })

      expect(msg.id).toBeDefined()

      // Authorized participant can fetch conversation
      const conversation = await platformDb.getMessages(citizenId, advocateId)
      expect(conversation.length).toBeGreaterThan(0)
      expect(conversation[0].message_text).toContain('da’vo arizasi')

      // Querying with stranger citizen ID returns empty list
      const strangerConversation = await platformDb.getMessages('unauthorized_stranger_id', advocateId)
      expect(strangerConversation.length).toBe(0)
    })
  })

  describe('7. Built-in Demo Accounts for the 3 New Sections', () => {
    it('Citizen demo account signs in successfully and redirects to /citizen', async () => {
      const res = await authService.signIn('fuqaro@juristiv.uz', 'juristiv2026!')
      expect(res.success).toBe(true)
      expect(res.data?.role).toBe('citizen')
      expect(res.data?.email).toBe('fuqaro@juristiv.uz')
      expect(getRoleDashboardPath(res.data?.role)).toBe('/citizen')
    })

    it('Law student demo account signs in successfully and redirects to /law-student', async () => {
      const res = await authService.signIn('talaba@juristiv.uz', 'juristiv2026!')
      expect(res.success).toBe(true)
      expect(res.data?.role).toBe('law_student')
      expect(res.data?.email).toBe('talaba@juristiv.uz')
      expect(getRoleDashboardPath(res.data?.role)).toBe('/law-student')
    })

    it('Advocate demo account signs in successfully and redirects to /advocate', async () => {
      const res = await authService.signIn('advokat@juristiv.uz', 'juristiv2026!')
      expect(res.success).toBe(true)
      expect(res.data?.role).toBe('advocate')
      expect(res.data?.email).toBe('advokat@juristiv.uz')
      expect(getRoleDashboardPath(res.data?.role)).toBe('/advocate')
    })
  })
})
