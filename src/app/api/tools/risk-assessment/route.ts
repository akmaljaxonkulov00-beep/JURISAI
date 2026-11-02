import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { retrieveLegalArticles, buildLegalContext } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { awardUserXP } from '@/lib/xp-engine'
import { OFFICIAL_LEGAL_SOURCES } from '@/lib/official-sources-registry'
import { aiClient } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const documentText: string = String(body.documentText || body.text || '').trim()
    const documentTitle: string = String(body.documentTitle || 'Yuridik Shartnoma').trim()
    const documentType: string = String(body.documentType || 'contract').trim()

    if (!documentText || documentText.length < 30) {
      return NextResponse.json(
        { success: false, error: 'Hujjat matni kamida 30 ta belgidan iborat bo‘lishi lozim' },
        { status: 400 }
      )
    }

    // Usage limits check
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'document_analysis',
      metadata: { document_type: documentType, text_length: documentText.length },
    })

    if (!usage.allowed) {
      return NextResponse.json(
        { success: false, error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    // RAG: Qonunchilik bazasidan moddalarni qidirish
    let legalContext = ''
    try {
      const articles = await retrieveLegalArticles(documentText.slice(0, 2000), 5)
      legalContext = buildLegalContext(articles, 1000)
    } catch {
      legalContext = ''
    }

    const systemPrompt = `Sen O‘zbekiston Respublikasining amaldagi qonunchiligi (Fuqarolik Kodeksi, 670-I-son Qonun, Mehnat Kodeksi, FPK) bo‘yicha professional shartnomalar va yuridik hujjatlar auditorisan.
Vazifang: Taqdim etilgan hujjat matnini chuqur tahlil qilib, undagi huquqiy xavflar, zaif bandlar, qonunga zid shartlar va yetishmayotgan muhim kafolatlarni aniqlash.

QAT'IY QOIDALAR:
1. Hech qachon soxta, to‘qima qonun yoki mavjud bo‘lmagan modda raqamini yozma.
${legalContext ? legalContext : "Faqat O'zbekiston Respublikasining amaldagi kodekslari (FK, MK, FPK) va rasmiy qonunlariga havola ber."}
2. Risk darajasini 3 toifaga ajrat: 'low' (Past), 'medium' (O'rta), 'high' (Yuqori).
3. Risk darajasi nima asosida berilganini aniq izohla (riskReasoning).
4. Yetishmayotgan zarur bandlarni (missingClauses) ko'rsat (masalan: fors-major, da'vo qilish muddati, nizolarni sudgacha hal qilish/pretenziya, javobgarlik chegarasi).
5. Ogohlantirish (disclaimer): Ushbu tahlil AI tomonidan O'zbekiston qonunchiligi asosida ma'lumot uchun tayyorlangan bo'lib, professional advokatning rasmiy yuridik xulosasini almashtirmaydi.
6. FAQAT LOTIN O'ZBEK ALIFBOSIDA JSON formatida qaytar.

JSON SCHEMA:
{
  "documentTitle": "${documentTitle}",
  "documentType": "${documentType}",
  "overallRisk": "medium",
  "riskScore": 65,
  "riskReasoning": "Risk darajasi shartnomada bir tomonlama majburiyatlar va yetarli javobgarlik choralari belgilanmaganligi sababli o'rta deb baholandi.",
  "summary": "Hujjatning 2-3 jumlalik umumiy huquqiy xulosasi",
  "disclaimer": "DIQQAT: Ushbu tahlil axborot va tavsiya xarakteriga ega bo‘lib, amaldagi qonunchilikka asoslangan, lekin professional advokatning rasmiy yuridik xulosasini almashtirmaydi.",
  "detectedIssues": [
    {
      "clauseTitle": "Band nomi",
      "clauseText": "Shartnomadagi xavfli jumla",
      "issue": "Nima uchun bu shart xavfli",
      "severity": "high",
      "legalViolation": "Qaysi qonuniy kafolat buzilgan",
      "legalGround": "Fuqarolik Kodeksi 333-moddasi / 670-I-son Qonun",
      "recommendation": "Tavsiya etiladigan to'g'ri tahrir"
    }
  ],
  "missingClauses": [
    {
      "clauseType": "Yetishmayotgan band",
      "importance": "essential",
      "whyNeeded": "Nima sababdan ushbu band kiritilishi shart",
      "suggestedText": "Tavsiya etiladigan band matni",
      "legalGround": "FK 386-moddasi"
    }
  ],
  "positiveClauses": [
    "Hujjatdagi to'g'ri tuzilgan band"
  ],
  "actionPlan": [
    "1-tavsiya etiladigan amaliy qadam",
    "2-qadam"
  ]
}`

    const userPrompt = `QUYIDAGI HUJJAT MATNINI TO'LIQ AUDIT QILING:\n\n${documentText.slice(0, 12000)}`

    let report: any = null

    try {
      const aiResponse = await aiClient.chat({
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.1,
        maxTokens: 3500,
      })

      const content = ensureUzbekLatin(aiResponse.text || '{}')
      try {
        report = JSON.parse(content)
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          report = JSON.parse(jsonMatch[0])
        }
      }
    } catch (aiErr) {
      console.warn('AI Client risk assessment exception, generating rule-based audit:', aiErr)
    }

    // Deterministic Rule-Based Legal Engine fallback if AI JSON is unavailable
    if (!report || !report.detectedIssues) {
      const lower = documentText.toLowerCase()
      const issues: any[] = []
      const missing: any[] = []

      // Check penalty terms
      if (!lower.includes('penya') && !lower.includes('jarima')) {
        missing.push({
          clauseType: 'Javobgarlik choralari (Penya va jarima)',
          importance: 'essential',
          whyNeeded: 'Majburiyatlar buzilganda moliyaviy javobgarlik mexanizmi mavjud emas',
          suggestedText: 'Majburiyatlar o‘z vaqtida bajarilmagan taqdirda, aybdor taraf har bir kechiktirilgan kun uchun majburiyat summasining 0.1% miqdorida penya to‘laydi, lekin umumiy penya summasi 10% dan oshmasligi lozim.',
          legalGround: 'Fuqarolik Kodeksi 326-moddasi, 670-I-son Qonun 25-moddasi',
        })
      }

      // Check dispute resolution
      if (!lower.includes('sud') && !lower.includes('pretenziya') && !lower.includes('nizo')) {
        missing.push({
          clauseType: 'Nizolarni hal qilish va sudgacha pretenziya tartibi',
          importance: 'essential',
          whyNeeded: 'Nizolarni sudgacha hal qilish muddati va sudlovlik belgilanmagan',
          suggestedText: 'Taraf kelib chiqqan nizolarni muzokaralar orqali hal qiladi. Nizo hal bo‘lmaganda, javobgar joylashgan fuqarolik yoki iqtisodiy sudiga murojaat qilinadi.',
          legalGround: 'Iqtisodiy protsessual kodeksi 148-moddasi, FPK 26-moddasi',
        })
      }

      // Check force majeure
      if (!lower.includes('fors-major') && !lower.includes('yengib bo‘lmas kuch')) {
        missing.push({
          clauseType: 'Fors-major (Yengib bo‘lmas kuch holatlari)',
          importance: 'essential',
          whyNeeded: 'Favqulodda vaziyatlarda tomonlarni javobgarlikdan ozod qilish shartlari mavjud emas',
          suggestedText: 'Tomonlar o‘zlariga bog‘liq bo‘lmagan yengib bo‘lmas kuch (fors-major) holatlari yuz berganda majburiyatlarni bajarmaganlik uchun javobgar bo‘lmaydilar.',
          legalGround: 'Fuqarolik Kodeksi 333-moddasi 3-qismi',
        })
      }

      const score = Math.min(85, Math.max(25, 30 + missing.length * 20))
      const riskLevel = score > 60 ? 'high' : score > 35 ? 'medium' : 'low'

      report = {
        documentTitle,
        documentType,
        overallRisk: riskLevel,
        riskScore: score,
        riskReasoning: `Hujjatda ${missing.length} ta muhim huquqiy kafolat bandi yetishmayotganligi sababli risk darajasi ${riskLevel === 'high' ? 'Yuqori' : riskLevel === 'medium' ? 'O‘rta' : 'Past'} deb baholandi.`,
        summary: `Hujjat matni O‘zbekiston Respublikasi Fuqarolik Kodeksi va 670-I-son Qonun mezonlari bo‘yicha tekshirildi. ${missing.length} ta asosiy bandni to‘ldirish tavsiya etiladi.`,
        disclaimer: 'DIQQAT: Ushbu tahlil axborot-tahliliy xarakterga ega bo‘lib, amaldagi O‘zbekiston qonunchiligiga asoslangan, biroq professional advokatning rasmiy yuridik xulosasini almashtirmaydi.',
        detectedIssues: issues,
        missingClauses: missing,
        positiveClauses: [
          'Hujjat taraflarning o‘zaro irodasini ifodalash uchun asosiy shartlarni o‘z ichiga olgan.',
        ],
        actionPlan: [
          'Yetishmayotgan fors-major va nizolarni hal qilish bandlarini kiritish',
          'Penya va javobgarlik chegaralarini qonunchilikka (670-I) moslashtirish',
          'Yakuniy imzolashdan oldin professional advokat ko‘rigidan o‘tkazish',
        ],
      }
    }

    const finalReport = {
      ...report,
      disclaimer: report.disclaimer || 'DIQQAT: Ushbu tahlil axborot-tahliliy xarakterga ega bo‘lib, amaldagi O‘zbekiston qonunchiligiga asoslangan, biroq professional advokatning rasmiy yuridik xulosasini almashtirmaydi.',
      officialSources: [OFFICIAL_LEGAL_SOURCES.CIVIL_CODE, OFFICIAL_LEGAL_SOURCES.CONTRACT_LAW_670],
      scannedAt: new Date().toISOString(),
    }

    // Award XP (+10 XP)
    const idempotencyKey = `risk_scan_${auth.user.id}_${Date.now()}`
    const xpResult = await awardUserXP({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: 'risk-assessment',
      xp: 10,
      title: `Shartnoma riski tekshirildi: ${documentTitle}`,
      description: `Hujjat auditi yakunlandi (Xavf: ${finalReport.overallRisk})`,
      idempotencyKey,
    })

    return NextResponse.json({
      success: true,
      report: finalReport,
      xpAwarded: xpResult.xpEarned,
      totalXp: xpResult.totalXp,
      level: xpResult.level,
    })
  } catch (error: any) {
    console.error('Risk assessment fatal error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Xavflarni tahlil qilishda kutilmagan xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
