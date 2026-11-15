import { getSupabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'
import { callGeminiJson } from '@/lib/gemini'

export interface LawStudentInvitationInput {
  university: string
  faculty: string
  studentName: string
  studentIdCode: string
  studyYear: number
  email?: string
  phone?: string
  createdByAdminId?: string
}

export interface LawStudentInvitationResult {
  id: string
  loginIdentifier: string
  tempPasswordPlain: string
  expiresAt: string
  university: string
  studentName: string
}

/**
 * Admin tomonidan bir martalik law_student taklifnomasi yaratish.
 * Vaqtinchalik parol sha256 bilan hashlanadi, taklifnoma muddati 7 kun bo'ladi.
 */
export async function createLawStudentInvitation(
  input: LawStudentInvitationInput
): Promise<LawStudentInvitationResult> {
  const admin = getSupabaseAdmin()

  // Xavfsiz random login: OTM kodi + student ID yoki random
  const prefix = input.university.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'JUR')
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  const loginIdentifier = `${prefix}_${input.studentIdCode.replace(/\s+/g, '')}_${randomSuffix}`

  // 8 belgili murakkab bir martalik parol
  const tempPasswordPlain = `Jur!${Math.floor(1000 + Math.random() * 9000)}`
  const tempPasswordHash = crypto.createHash('sha256').update(tempPasswordPlain).digest('hex')

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 kun

  const { data, error } = await admin
    .from('law_student_invitations')
    .insert({
      university: input.university,
      faculty: input.faculty,
      student_name: input.studentName,
      student_id_code: input.studentIdCode,
      study_year: input.studyYear || 1,
      email: input.email || null,
      phone: input.phone || null,
      login_identifier: loginIdentifier,
      temp_password_hash: tempPasswordHash,
      expires_at: expiresAt,
      status: 'active',
      is_used: false,
      created_by: input.createdByAdminId || null,
    })
    .select('id, login_identifier, expires_at, university, student_name')
    .single()

  if (error) {
    throw new Error('Taklifnoma yaratishda xatolik: ' + error.message)
  }

  return {
    id: data.id,
    loginIdentifier: data.login_identifier,
    tempPasswordPlain,
    expiresAt: data.expires_at,
    university: data.university,
    studentName: data.student_name,
  }
}

/**
 * Talaba tomonidan savolni qulflash (Concurrency Lock).
 * Bir savolga faqat bitta talaba javob berishi uchun, talaba javob yozishni boshlaganda
 * savol 20 daqiqaga shu talaba uchun lock qilinadi.
 */
export async function lockQuestionForStudent(
  questionId: string,
  studentId: string
): Promise<{ success: boolean; error?: string; lockExpiresAt?: string }> {
  const admin = getSupabaseAdmin()

  const { data: q, error } = await admin
    .from('legal_questions')
    .select('id, status, locked_by_student_id, lock_expires_at, answers_count')
    .eq('id', questionId)
    .single()

  if (error || !q) {
    return { success: false, error: 'Savol topilmadi' }
  }

  if (q.status === 'answered' || (q.answers_count && q.answers_count > 0)) {
    return { success: false, error: 'Bu savolga allaqachon boshqa talaba javob bergan.' }
  }

  const now = new Date()
  const currentLockExpires = q.lock_expires_at ? new Date(q.lock_expires_at) : null

  // Agar savol boshqa talaba tomonidan qulflangan va muddati tugamagan bo'lsa
  if (
    q.locked_by_student_id &&
    q.locked_by_student_id !== studentId &&
    currentLockExpires &&
    currentLockExpires > now
  ) {
    const minutesLeft = Math.ceil((currentLockExpires.getTime() - now.getTime()) / 60000)
    return {
      success: false,
      error: `Ushbu savol hozirda boshqa talaba tomonidan yechilmoqda (qolgan vaqt: ${minutesLeft} daqiqa).`,
    }
  }

  // 20 daqiqalik lock o'rnatish
  const lockExpiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString()

  await admin
    .from('legal_questions')
    .update({
      locked_by_student_id: studentId,
      locked_at: now.toISOString(),
      lock_expires_at: lockExpiresAt,
      updated_at: now.toISOString(),
    })
    .eq('id', questionId)

  return { success: true, lockExpiresAt }
}

/**
 * 7 ta mezon bo'yicha talaba javobini AI tahlil qilish:
 * 1. Huquqiy aniqlik
 * 2. Mantiqiy izchillik
 * 3. Savolga moslik
 * 4. Dalillash sifati
 * 5. Tushuntirish ravshanligi
 * 6. Ishonchli manbalardan foydalanish
 * 7. Professional muloqot
 */
export async function evaluateStudentAnswerAI(params: {
  questionTitle: string
  questionDesc: string
  answerContent: string
  legalBasis?: string
}) {
  const { questionTitle, questionDesc, answerContent, legalBasis } = params

  try {
    const prompt = `
Siz O'zbekiston Respublikasi qonunchiligi bo'yicha yuridik fakultet talabalari va yosh advokat nomzodlarining javoblarini baholovchi eng QATTIQQOL va prinsipial Oliy Yuridik Ekspertsiz.

SAVOL:
Sarlavha: "${questionTitle}"
Tafsilot: "${questionDesc}"

TALABANING JAVOBI:
Matn: "${answerContent}"
Ko'rsatilgan qonuniy asos: "${legalBasis || 'Keltirilmagan'}"

VAZIFA:
Talabaning javobini O'zbekiston Respublikasi amaldagi qonunlari (FK, JK, MK, JPK, FPK, Soliq, Oila kodeksi va lex.uz qonun hujjatlari) talablariga muvofiq QATTIQQOL 1 dan 5 gacha bo'lgan baholash shkalasida baholang:
1 - Yaroqsiz (noto'g'ri, yuridik asossiz, qonunga zid)
2 - Zaif (savol mohiyati ochilmagan, moddalar yo'q yoki noto'g'ri)
3 - Qoniqarli (umumiy javob, lekin aniq huquqiy yechim yetishmaydi)
4 - Yaxshi (qonun normalari to'g'ri ko'rsatilgan, mantiqiy asosli)
5 - A'lo / Professional (mukammal asoslangan, aniq O'zR moddalari, tushunarli amaliy yechim)

TALAB:
- Agar aniq qonun moddasi yoki kodeks nomi keltirilmagan bo'lsa, baho hech qachon 3 dan yuqori bo'lmasin!
- Faqat juda professional, to'liq va fuqaroga amaliy foydali javoblargagina 5 ball bering.

Javobni FAQAT quyidagi JSON formatida qaytaring:
{
  "rating": 4,
  "criteriaRatings": {
    "legal_accuracy": 4,
    "legal_citation": 4,
    "practical_solution": 4,
    "clarity": 5
  },
  "feedback": "Javob bo'yicha qat'iy va professional tahlil."
}
`.trim()

    const aiRes = await callGeminiJson<{
      rating: number
      criteriaRatings: Record<string, number>
      feedback: string
    }>(prompt, {
      temperature: 0.1,
      maxTokens: 800,
    })

    if (aiRes && typeof aiRes.rating === 'number') {
      const rating = Math.max(1, Math.min(5, Math.round(aiRes.rating)))
      return {
        score: rating, // 1 dan 5 gacha aniq ball
        rating,
        criteriaScores: aiRes.criteriaRatings || {},
        feedback: aiRes.feedback || "Javob AI ekspert tomonidan qat'iy mezonlar bilan baholandi.",
        isEligibleForReward: rating >= 4,
        evaluatedAt: new Date().toISOString(),
      }
    }
  } catch (err) {
    console.warn('[evaluateStudentAnswerAI] Gemini AI error, falling back to heuristic:', err)
  }

  // Deterministik qattiqqol zaxira baholash (1 dan 5 gacha)
  let rating = 3
  const feedbackItems: string[] = []

  if (!legalBasis || legalBasis.trim().length < 5) {
    rating = 2
    feedbackItems.push("O'zbekiston qonun moddalari yoki kodeks bandlariga aniq havola keltirilmagan (baho pasaytirildi).")
  } else if (answerContent.length < 150) {
    rating = 3
    feedbackItems.push("Qonun keltirilgan, lekin javob juda qisqa va amaliy yo'riqnoma to'liq emas.")
  } else if (answerContent.length >= 350 && legalBasis.length >= 10) {
    rating = 5
    feedbackItems.push("Javob batafsil, qonun moddalari to'liq ko'rsatilgan va professional bayon qilingan.")
  } else {
    rating = 4
    feedbackItems.push("Javob yaxshi tayyorlangan va huquqiy jihatdan asosli.")
  }

  return {
    score: rating,
    rating,
    criteriaScores: {
      legal_accuracy: rating,
      legal_citation: legalBasis && legalBasis.length > 5 ? rating : 2,
      practical_solution: rating,
      clarity: answerContent.length > 150 ? rating : 2,
    },
    feedback: feedbackItems.join(' '),
    isEligibleForReward: rating >= 4,
    evaluatedAt: new Date().toISOString(),
  }
}

/**
 * Talaba hamyoniga mukofot qo'shish
 */
export async function creditStudentReward(params: {
  studentId: string
  questionId: string
  answerId: string
  amount: number
  aiScore: number
}) {
  const admin = getSupabaseAdmin()
  const { studentId, questionId, answerId, amount, aiScore } = params

  // 1. Mukofot yozuvi
  await admin.from('student_rewards').insert({
    student_id: studentId,
    question_id: questionId,
    answer_id: answerId,
    amount,
    ai_score: aiScore,
    status: 'approved',
    approved_at: new Date().toISOString(),
  })

  // 2. Talaba hamyoni
  const { data: wallet } = await admin
    .from('student_wallets')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()

  if (!wallet) {
    await admin.from('student_wallets').insert({
      student_id: studentId,
      balance: amount,
      pending_balance: 0,
      total_earned: amount,
      total_withdrawn: 0,
    })
  } else {
    await admin
      .from('student_wallets')
      .update({
        balance: Number(wallet.balance || 0) + amount,
        total_earned: Number(wallet.total_earned || 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
  }

  return { success: true, rewardAmount: amount }
}
