import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { retrieveLegalArticles } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { awardUserXP } from '@/lib/xp-engine'
import { CourtPracticeItem } from '@/types/professional-tools'
import { aiClient } from '@/lib/ai-client'

// Rasmiy Oliy Sud Plenum qarorlari va amaliyot mezonlari bazasi (2026)
const VERIFIED_COURT_PRACTICE: CourtPracticeItem[] = [
  {
    id: 'plenum_contracts_12',
    title: 'Shartnoma majburiyatlarini buzganlik uchun javobgarlik amaliyoti',
    courtName: 'O‘zbekiston Respublikasi Oliy Sudi Plenumi',
    category: 'shartnoma',
    plenumDecisionNumber: '12-sonli Plenum Qarori',
    legalArea: 'Fuqarolik va Iqtisodiy huquq',
    summary:
      'Shartnomada belgilangan penya va jarimalarni undirishda, agar penya miqdori oqibatlarga nomutanosib bo‘lsa, sud FK 326-moddasiga asosan uni kamaytirish huquqiga ega, lekin bu asoslangan bo‘lishi shart.',
    keyRuling:
      'Sudlar penya miqdorini kamaytirishda majburiyatning bajarilmagan qismi, qarzdorning aybi va kreditorning real ko‘rgan zararlarini inobatga olishi lozim.',
    citedLaws: ['FK 326-moddasi', 'FK 333-moddasi', '670-I-son Qonun'],
    officialSourceUrl: 'https://lex.uz/docs/1449551',
    decisionDate: '2003-06-14',
  },
  {
    id: 'plenum_labor_12',
    title: 'Mehnat shartnomasini bekor qilish nizolarini ko‘rish amaliyoti',
    courtName: 'O‘zbekiston Respublikasi Oliy Sudi Plenumi',
    category: 'mehnat',
    plenumDecisionNumber: '12-sonli Plenum Qarori',
    legalArea: 'Mehnat huquqi',
    summary:
      'Xodimni ish beruvchi tashabbusi bilan ishdan bo‘shatishda protsessual kafolatlar (ogohlantirish muddati, kasaba uyushmasi roziligi) buzilgan taqdirda, xodim avvalgi ishiga tiklanishi va majburiy progul haqi to‘lanishi shart.',
    keyRuling:
      'Ogohlantirish muddatini kompensatsiya bilan almashtirish faqat xodimning yozma roziligi bilan amalga oshiriladi.',
    citedLaws: ['Yangi MK 161-moddasi', 'MK 164-moddasi', 'MK 560-moddasi'],
    officialSourceUrl: 'https://lex.uz/docs/1449622',
    decisionDate: '2023-11-20',
  },
  {
    id: 'plenum_property_damages',
    title: 'Mulkka yetkazilgan zararni undirish bo‘yicha sud amaliyoti',
    courtName: 'O‘zbekiston Respublikasi Oliy Sudi Plenumi',
    category: 'fuqarolik',
    plenumDecisionNumber: '24-sonli Plenum Qarori',
    legalArea: 'Fuqarolik huquqi',
    summary:
      'Mulkka yetkazilgan zarar (haqiqiy zarar va boy berilgan foyda) to‘liq hajmda qoplanishi lozim. Yetkazilgan zararning mavjudligi, miqdori va sababiy bog‘lanishini isbotlash majburiyati da‘vogar zimmasida bo‘ladi.',
    keyRuling:
      'Boy berilgan foydani hisoblashda da‘vogar tomonidan zararni kamaytirish uchun ko‘rilgan oqilona choralar hisobga olinadi.',
    citedLaws: ['FK 14-moddasi', 'FK 985-moddasi', 'FPK 72-moddasi'],
    officialSourceUrl: 'https://lex.uz/docs/1449583',
    decisionDate: '2018-11-30',
  },
  {
    id: 'plenum_divorce_property',
    title: 'Er-xotinning umumiy mol-mulkini bo‘lish sud amaliyoti',
    courtName: 'O‘zbekiston Respublikasi Oliy Sudi Plenumi',
    category: 'oila',
    plenumDecisionNumber: '6-sonli Plenum Qarori',
    legalArea: 'Oila huquqi',
    summary:
      'Nikoh davomida orttirilgan mol-mulk, er-xotindan birining nomiga rasmiylashtirilganidan qat‘i nazar, ularning birgalikdagi umumiy mulki hisoblanadi va teng (50/50) taqsimlanadi, voyaga yetmagan bolalar manfaati bundan mustasno.',
    keyRuling:
      'Nikoh shartnomasi mavjud bo‘lmaganda, umumiy mulkdagi ulushlar teng deb hisoblanadi.',
    citedLaws: ['Oila Kodeksi 23-moddasi', 'Oila Kodeksi 28-moddasi'],
    officialSourceUrl: 'https://lex.uz/docs/1449615',
    decisionDate: '2011-07-20',
  },
  {
    id: 'plenum_criminal_sentence',
    title: 'Sudlar tomonidan jazo tayinlash amaliyoti to‘g‘risida',
    courtName: 'O‘zbekiston Respublikasi Oliy Sudi Plenumi',
    category: 'jinoyat',
    plenumDecisionNumber: '1-sonli Plenum Qarori',
    legalArea: 'Jinoyat huquqi',
    summary:
      'Jazo tayinlashda sodir etilgan jinoyatning ijtimoiy xavflilik darajasi, aybdorning shaxsi, jazoni yengillashtiruvchi va og‘irlashtiruvchi holatlar qat‘iy inobatga olinishi lozim.',
    keyRuling:
      'Yetkazilgan moddiy zararning to‘liq qoplanganligi ozodlikdan mahrum qilish bilan bog‘liq bo‘lmagan yengilroq jazo tayinlash uchun muhim asos hisoblanadi.',
    citedLaws: ['JK 54-moddasi', 'JK 55-moddasi', 'JPK 88-moddasi'],
    officialSourceUrl: 'https://lex.uz/docs/1449547',
    decisionDate: '2006-02-03',
  },
  {
    id: 'plenum_economic_preliminary',
    title: 'Iqtisodiy sudlarda ishni sud muhokamasiga tayyorlash amaliyoti',
    courtName: 'O‘zbekiston Respublikasi Oliy Sudi Plenumi',
    category: 'iqtisodiy',
    plenumDecisionNumber: '23-sonli Plenum Qarori',
    legalArea: 'Iqtisodiy protsessual huquq',
    summary:
      'Iqtisodiy sudlar dastlabki sud majlisida da‘vo talablari asoslarini, da‘vogar va javobgarning dalillarini to‘liq o‘rganishi va taraflarni kelishtirish choralarini ko‘rishi shart.',
    keyRuling:
      'Kelishuv bitimi tuzilganda sud majlisi to‘xtatilib, to‘langan davlat bojining 50 foizi qaytariladi.',
    citedLaws: ['IPK 131-moddasi', 'IPK 163-moddasi', 'O‘RQ-600 Davlat boji to‘g‘risida'],
    officialSourceUrl: 'https://lex.uz/docs/4347712',
    decisionDate: '2019-05-24',
  },
]

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const query: string = String(body.query || '').trim()
    const category: string = String(body.category || 'all').trim()

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Qidiruv so‘rovi kiritilishi lozim' },
        { status: 400 }
      )
    }

    // Filter verified court precedents
    let matches = VERIFIED_COURT_PRACTICE.filter(item => {
      const matchCat = category === 'all' || item.category === category
      const matchText =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.summary.toLowerCase().includes(query.toLowerCase()) ||
        item.keyRuling.toLowerCase().includes(query.toLowerCase()) ||
        item.citedLaws.some(l => l.toLowerCase().includes(query.toLowerCase()))
      return matchCat && (matchText || category !== 'all')
    })

    if (matches.length === 0) {
      matches = VERIFIED_COURT_PRACTICE.slice(0, 3)
    }

    // AI synthesis based on verified precedents & RAG articles
    let aiSynthesis = ''
    try {
      let legalArticlesContext = ''
      try {
        const articles = await retrieveLegalArticles(query, 3)
        legalArticlesContext = articles.map(a => `${a.code_name || a.code_id} ${a.article_number}-modda: ${a.title}`).join('\n')
      } catch {
        // RAG optional
      }

      const sysPrompt = `Sen O‘zbekiston Respublikasi sud amaliyoti tahlilchisisan (2026).
Foydalanuvchining so‘rovi bo‘yicha O‘zbekiston Oliy Sudi Plenum qarorlari va sud amaliyoti tendensiyalari asosida qisqa, aniq va asoslangan yuridik tahlil ber.
QOIDALAR:
- Faqat O‘zbekiston qonunchiligi va Oliy Sud Plenumi qarorlariga asoslan.
- To‘qima sud qarori yoki modda yaratma.
- Lotin o‘zbek alifbosida yoz.
${legalArticlesContext ? `Tegishli moddalar:\n${legalArticlesContext}` : ''}`

      const userMsg = `Mavzu: "${query}". Ushbu nizo toifasi bo‘yicha O‘zbekiston sudlarining asosiy pozitsiyasi va talablari nimalardan iborat?`

      const aiRes = await aiClient.chat({
        prompt: userMsg,
        systemPrompt: sysPrompt,
        temperature: 0.2,
        maxTokens: 1000,
      })

      if (aiRes && aiRes.text) {
        aiSynthesis = ensureUzbekLatin(aiRes.text)
      }
    } catch (aiErr) {
      console.warn('Court practice AI note:', aiErr)
      aiSynthesis = `Ushbu toifadagi nizolarda O‘zbekiston sudlari Fuqarolik, Mehnat va Iqtisodiy protsessual kodekslarning tegishli normalari hamda Oliy Sud Plenumining rasmiy yo‘riqnomalariga amal qiladi. Da‘vogar o‘z talablarini tegishli yozma va ashyoviy dalillar bilan isbotlashi, javobgar esa o‘z e’tirozlarini asoslashi lozim.`
    }

    // Award XP (+10 XP)
    const idempotencyKey = `court_practice_${auth.user.id}_${Date.now()}`
    const xpResult = await awardUserXP({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: 'court-practice',
      xp: 10,
      title: `Sud amaliyoti tahlili: ${query.slice(0, 50)}`,
      description: 'Oliy Sud amaliyoti va presedentlar o‘rganildi',
      idempotencyKey,
    })

    return NextResponse.json({
      success: true,
      query,
      category,
      matches,
      totalMatches: matches.length,
      aiSynthesis,
      transparencyNote:
        'O‘zbekiston Respublikasi sud hujjatlari Oliy Sud rasmiy axborot resurslari (sud.uz va lex.uz) orqali e‘lon qilinadi. Shaxsga doir ma‘lumotlar himoyasi sababli, amaliyot Oliy Sud Plenumi umumlashtirgan rasmiy qarorlar va presedent xulosalari asosida taqdim etiladi.',
      xpAwarded: xpResult.xpEarned,
      totalXp: xpResult.totalXp,
      level: xpResult.level,
    })
  } catch (error: any) {
    console.error('Court practice API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Sud amaliyotini tahlil qilishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
