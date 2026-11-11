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
Siz O'zbekiston Respublikasi qonunchiligi bo'yicha yuridik fakultet talabalarining amaliy javoblarini baholovchi Oliy Yuridik Ekspertsiz.

SAVOL:
Sarlavha: "${questionTitle}"
Tafsilot: "${questionDesc}"

TALABANING JAVOBI:
Matn: "${answerContent}"
Ko'rsatilgan qonuniy asos: "${legalBasis || 'Keltirilmagan'}"

VAZIFA:
Talabaning javobini O'zbekiston Respublikasi amaldagi qonunlari (FK, JK, MK, JPK, FPK, Soliq, Oila va b.) mezonlariga muvofiq 7 ta mezon bo'yicha (har biri 0 dan 100 gacha butun son) ob'ektiv baholang:
1. legal_accuracy (Huquqiy aniqlik va qonun normasining to'g'ri tanlangani)
2. logical_consistency (Mantiqiy izchillik va fikr bayoni)
3. relevance (Savolga to'g'ri va to'liq mos kelishi)
4. evidence_quality (Dalillash va yuridik asoslash sifati)
5. clarity (Fuqaro tushunishi uchun ravshan va tushunarli bayon)
6. source_citation (O'zbekiston qonun moddalari, kodeks bandlari va lex.uz manbalariga to'g'ri havola)
7. professional_tone (Yuridik etika va professional muomala madaniyati)

Javobni FAQAT quyidagi JSON formatida qaytaring:
{
  "criteriaScores": {
    "legal_accuracy": 85,
    "logical_consistency": 80,
    "relevance": 90,
    "evidence_quality": 75,
    "clarity": 85,
    "source_citation": 80,
    "professional_tone": 90
  },
  "score": 84,
  "feedback": "Javob bo'yicha qisqa, professional tavsiya va tahlil."
}
`.trim()

    const aiRes = await callGeminiJson<{
      criteriaScores: Record<string, number>
      score: number
      feedback: string
    }>(prompt, {
      temperature: 0.1,
      maxTokens: 1000,
    })

    if (aiRes && aiRes.criteriaScores && typeof aiRes.score === 'number') {
      const score = Math.max(0, Math.min(100, Math.round(aiRes.score)))
      return {
        score,
        criteriaScores: aiRes.criteriaScores,
        feedback: aiRes.feedback || "Javob AI ekspert tomonidan muvaffaqiyatli baholandi.",
        isEligibleForReward: score >= 60,
        evaluatedAt: new Date().toISOString(),
      }
    }
  } catch (err) {
    console.warn('[evaluateStudentAnswerAI] Gemini AI error, falling back to heuristic:', err)
  }

  // Deterministik zaxira baholash (agar AI vaqtincha javob bermasa)
  let score = 75
  const feedbackItems: string[] = []
  const criteriaScores: Record<string, number> = {
    legal_accuracy: 75,
    logical_consistency: 75,
    relevance: 80,
    evidence_quality: 70,
    clarity: 75,
    source_citation: legalBasis && legalBasis.length > 5 ? 80 : 45,
    professional_tone: 85,
  }

  if (answerContent.length < 150) {
    criteriaScores.clarity = 60
    criteriaScores.evidence_quality = 55
    feedbackItems.push("Javob matni ancha qisqa, tushuntirishlarni kengaytirish tavsiya etiladi.")
  } else {
    feedbackItems.push("Javob yetarlicha batafsil va amaliy asoslangan.")
  }

  if (!legalBasis || legalBasis.trim().length < 5) {
    feedbackItems.push("O'zbekiston qonun moddalari yoki kodeks bandlariga aniq havola keltiring.")
  } else {
    feedbackItems.push("Qonunchilik normalariga havola keltirilgan.")
  }

  const values = Object.values(criteriaScores)
  score = Math.round(values.reduce((a, b) => a + b, 0) / values.length)

  return {
    score,
    criteriaScores,
    feedback: feedbackItems.join(' '),
    isEligibleForReward: score >= 60,
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
