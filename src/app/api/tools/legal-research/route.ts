import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { retrieveLegalArticles, buildLegalContext } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { awardUserXP } from '@/lib/xp-engine'
import { OFFICIAL_LEGAL_SOURCES } from '@/lib/official-sources-registry'
import { aiClient } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const query: string = String(body.query || body.question || '').trim()
    const scope: string = String(body.scope || 'all').trim()

    if (!query || query.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Huquqiy tadqiqot savolini kamida 5 ta belgidan iborat qilib kiriting' },
        { status: 400 }
      )
    }

    // 1. RAG retrieval of authentic articles from Supabase / legal database
    let retrievedArticles: any[] = []
    let legalContext = ''
    try {
      retrievedArticles = await retrieveLegalArticles(query, 6)
      legalContext = buildLegalContext(retrievedArticles, 1500)
    } catch (ragErr) {
      console.warn('Legal research RAG retrieval error:', ragErr)
    }

    // 2. Identify relevant official sources from registry
    const registryMatches = Object.values(OFFICIAL_LEGAL_SOURCES).filter(source => {
      const q = query.toLowerCase()
      return (
        source.source_name.toLowerCase().includes(q) ||
        source.description.toLowerCase().includes(q) ||
        source.document_number.toLowerCase().includes(q)
      )
    }).slice(0, 4)

    const systemPrompt = `Sen O‘zbekiston Respublikasining 2026-yilgi amaldagi qonunchiligi bo‘yicha Oliy Huquqiy Tadqiqotchi (Senior Legal Researcher)san.
Vazifang: Foydalanuvchi bergan murakkab huquqiy masala bo‘yicha chuqur huquqiy tadqiqot o‘tkazish, bir nechta normativ-huquqiy hujjatlarni qiyosiy taqqoslash va amaldagi moddalarga tayangan xulosa tayyorlash.

QAT'IY TALABLAR:
1. Qat'iy qoida: Yolg'on, to'qima qonun yoki modda o'ylab topma. Agar aniq modda topilmasa, "Ushbu holat bo'yicha to'g'ridan-to'g'ri maxsus norma topilmadi, umumiy qoidalar qo'llaniladi" deb ochiq ayt.
${legalContext ? `Mavjud qonunchilik bazasi moddalari:\n${legalContext}` : "Faqat O'zbekistonning haqiqiy kodekslari (FK, MK, FPK, IPK, JK, JPK, Soliq) va rasmiy qonunlariga tayangan holda tahlil ber."}
2. Hujjat holatini (status) aniq ko'rsat: "Amalda (2026)" yoki "O'z kuchini yo'qotgan".
3. Bir nechta manbani taqqosla (comparativeAnalysis): umumiy norma (masalan Fuqarolik kodeksi) va maxsus qonun yoki Mehnat kodeksining o'zaro nisbatini ko'rsat.
4. Har bir asos uchun: Manba nomi, Modda raqami, Normaning mazmuni, Amaldagi holati, Lex.uz rasmiy havolasi.
5. FAQAT LOTIN O'ZBEK ALIFBOSIDA JSON formatida javob ber.

JSON SCHEMA:
{
  "researchTitle": "Tadqiqot sarlavhasi",
  "issueSummary": "Huquqiy masalaning qisqacha ta'rifi",
  "applicableSources": [
    {
      "sourceName": "O‘zbekiston Respublikasi Mehnat Kodeksi (Yangi tahrir)",
      "documentNumber": "O‘RQ-798",
      "articleNumber": "161-modda",
      "articleTitle": "Mehnat shartnomasini bekor qilish tartibi",
      "normSummary": "Moddaning ushbu holatga aloqador qoidasi",
      "currentStatus": "Amalda (2026)",
      "officialSource": "Lex.uz milliy qonunchilik bazasi",
      "officialUrl": "https://lex.uz/docs/6257288"
    }
  ],
  "comparativeAnalysis": "Umumiy va maxsus normalar o'rtasidagi qiyosiy tahlil. Qaysi norma ustuvor kuchga ega ekanligi.",
  "conclusion": "Masala bo'yicha yakuniy asoslangan huquqiy xulosa va amaliy tavsiya.",
  "riskWarnings": [
    "Diqqat qilinishi lozim bo'lgan huquqiy xavf yoki protsessual muddat"
  ]
}`

    const userMsg = `QUYIDAGI HUQUQIY MASALA BO'YICHA TO'LIQ ILMIY-AMALIY TADQIQOT O'TKAZING:\n"${query}"`

    let memo: any = null

    try {
      const aiRes = await aiClient.chat({
        prompt: userMsg,
        systemPrompt,
        temperature: 0.1,
        maxTokens: 3000,
      })

      const content = ensureUzbekLatin(aiRes.text || '{}')
      try {
        memo = JSON.parse(content)
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) memo = JSON.parse(jsonMatch[0])
      }
    } catch (aiErr) {
      console.warn('Legal research AI exception, fallback to registry synthesis:', aiErr)
    }

    if (!memo || !memo.applicableSources) {
      // Rule-based fallback
      memo = {
        researchTitle: `Huquqiy tadqiqot: ${query}`,
        issueSummary: `Taqdim etilgan huquqiy masala O‘zbekiston Respublikasi qonunchiligi normalari asosida o‘rganildi.`,
        applicableSources: registryMatches.length > 0 ? registryMatches.map(m => ({
          sourceName: m.source_name,
          documentNumber: m.document_number,
          articleNumber: m.article || 'Tegishli normalar',
          articleTitle: m.document_title,
          normSummary: m.description,
          currentStatus: 'Amalda (2026)',
          officialSource: m.official_domain || 'lex.uz',
          officialUrl: m.official_url,
        })) : [
          {
            sourceName: 'O‘zbekiston Respublikasi Fuqarolik Kodeksi',
            documentNumber: '166-I-son',
            articleNumber: '353, 386-moddalar',
            articleTitle: 'Shartnomaviy majburiyatlar',
            normSummary: 'Taraflar shartnoma shartlarini qonun hujjatlariga muvofiq belgilaydilar va lozim darajada bajaradilar.',
            currentStatus: 'Amalda (2026)',
            officialSource: 'Lex.uz milliy bazasi',
            officialUrl: 'https://lex.uz/docs/111189',
          },
        ],
        comparativeAnalysis: 'Mazkur huquqiy munosabatlarda kodekslarning umumiy qoidalari va sohaga oid maxsus qonunchilik hujjatlari o‘zaro uyg‘unlikda qo‘llaniladi.',
        conclusion: 'Nizoni hal qilishda da‘vo qilish muddatlari, shartnomada belgilangan majburiyatlar va LexUZ da tasdiqlangan amaldagi qonun normalariga tayanish lozim.',
        riskWarnings: [
          'Protsessual muddatlar va sudgacha nizoni hal qilish (pretenziya) talablariga rioya qilinishi shart.',
        ],
      }
    }

    // Award XP (+15 XP)
    const idempotencyKey = `legal_research_${auth.user.id}_${Date.now()}`
    const xpResult = await awardUserXP({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: 'law-search',
      xp: 15,
      title: `Huquqiy tadqiqot: ${query.slice(0, 50)}`,
      description: 'Normativ-huquqiy hujjatlar va moddalar qiyosiy tahlil qilindi',
      idempotencyKey,
    })

    return NextResponse.json({
      success: true,
      query,
      memo,
      retrievedCount: retrievedArticles.length,
      xpAwarded: xpResult.xpEarned,
      totalXp: xpResult.totalXp,
      level: xpResult.level,
    })
  } catch (error: any) {
    console.error('Legal research fatal error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Huquqiy tadqiqot jarayonida xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
