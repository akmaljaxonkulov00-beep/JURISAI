import { NextRequest, NextResponse } from 'next/server'
import { checkAndIncrement, getIdentityFromRequest, usageMessage } from '@/lib/usage-limits'
import { groundPrompt } from '@/lib/legal-rag'

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Server-side conversation history store (by simulationId)
const conversationHistory = new Map<string, { role: 'user' | 'assistant'; content: string }[]>()

function getHistory(simId: string): { role: 'user' | 'assistant'; content: string }[] {
  if (!conversationHistory.has(simId)) {
    conversationHistory.set(simId, [])
  }
  return conversationHistory.get(simId)!
}

function addToHistory(simId: string, entry: { role: 'user' | 'assistant'; content: string }) {
  const hist = getHistory(simId)
  hist.push(entry)
  // Keep last 30 messages to limit memory
  if (hist.length > 30) hist.splice(0, hist.length - 30)
}

// Cleanup old sessions after 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000
  for (const key of conversationHistory.keys()) {
    // Keys include timestamp: 'sim_' + Date.now()
    const ts = parseInt(key.replace('sim_', ''))
    if (!isNaN(ts) && ts < oneHourAgo) {
      conversationHistory.delete(key)
    }
  }
}, 600000)

async function groqChat(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048,
  history?: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ text: string }> {
  if (!GROQ_API_KEY) return { text: 'AI xizmati sozlanmagan' }

  try {
    const messages: any[] = [{ role: 'system', content: systemPrompt }]
    // Add conversation history if provided (limited to last 10 turns to save tokens)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-10)
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content })
      }
    }
    messages.push({ role: 'user', content: userMessage })

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.15,
        max_tokens: maxTokens,
      }),
    })
    const data = await res.json()
    return { text: data.choices?.[0]?.message?.content || 'Javob olinmadi' }
  } catch {
    return { text: 'Xatolik yuz berdi' }
  }
}

/**
 * Multi-role AI: generates responses for ALL courtroom participants
 * Returns an array of { speaker, role, text }
 */
function parseMultiRoleResponse(raw: string): { speaker: string; role: string; text: string }[] {
  const roles: { speaker: string; role: string; text: string }[] = []
  const lines = raw.split('\n')
  const rolePattern =
    /^\[?(SUDYA|PROKUROR|ADVOKAT|SUDLANUVCHI|KOTIBA|DA'VOGAR|JAVOBGAR|DA'VOGAR\s+VAKILI)\]?:?\s*(.*)/i
  let current: { speaker: string; role: string; text: string } | null = null

  for (const line of lines) {
    const match = line.match(rolePattern)
    if (match) {
      if (current && current.text.trim()) roles.push(current)
      current = {
        speaker: match[1].trim(),
        role: match[1].trim(),
        text: match[2] || '',
      }
    } else if (current) {
      current.text += (current.text ? '\n' : '') + line
    }
  }
  if (current && current.text.trim()) roles.push(current)

  // Fallback: if no structured roles found, return as judge message
  if (roles.length === 0) {
    roles.push({ speaker: 'SUDYA', role: 'SUDYA', text: raw })
  }
  return roles
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, caseDetails, argument, simulationId, history, userRole, userName } = body

    // ── AI limit tekshiruvi (virtual sud — faqat sessiya boshlanganda) ──
    if (action === 'start') {
      const identity = getIdentityFromRequest(request, body)
      const usage = await checkAndIncrement({
        ...identity,
        feature: 'virtual_court',
        metadata: { case_title: typeof caseDetails === 'string' ? caseDetails.slice(0, 100) : '' },
      })
      if (!usage.allowed) {
        return NextResponse.json(
          { error: 'limit_reached', message: usageMessage(usage), usage },
          { status: 429 }
        )
      }
    }

    const SYSTEM_BASE = `You are JurisAI — the leading expert AI Legal Assistant strictly specialized in the COMPLETE legislation of the Republic of Uzbekistan (O'zbekiston Respublikasi Qonunchiligi).

DOIMIY ISHTIROKCHILAR (constant participant names — always use these):
- Prokuror: Akbar Toshmatov
- Advokat: Nilufar Karimova
- Sudlanuvchi: Botir Rahimov
- Kotiba: Zulfiya Xasanova
- (Agar fuqarolik ishi bo'lsa: Da'vogar: Karim Jalilov, Javobgar:Shoxrux Mirzayev)

YURIDIK BILIM DOIRASI:
1. KONSTITUTSIYA: O'zbekiston Respublikasi Konstitutsiyasi (1992, 2023 yangi tahrir) — barcha moddalar
2. FUQAROLIK KODEKSI (FK): 1-300+ moddalar — mulk, shartnoma, meros, majburiyatlar
3. JINOYAT KODEKSI (JK): 1-200+ moddalar — jinoyat turlari va jazolar
4. MEHNAT KODEKSI (MK): 1-90+ moddalar — mehnat shartnomasi, ish haqi, ta'til
5. OILA KODEKSI (OK): 1-55+ moddalar — nikoh, aliment, farzandlikka olish
6. PROTSESSUAL KODEKSLAR: FPK (Fuqarolik protsessual), JPK (Jinoiy protsessual), IPK (Iqtisodiy protsessual), BSK (Ma'muriy sud ishlari)
7. MA'MURIY KODEKS: Ma'muriy javobgarlik to'g'risidagi kodeks

STRICT RULES:
1. ACCURACY FIRST: Never invent or hallucinate legal articles (moddalar) or punishments. JK 97-modda is ALWAYS 'Qasddan odam o'ldirish (og'irlashtiruvchi holatlar)'. Never confuse codes.
2. ROLE PLAY: In court simulator, you control ALL roles: SUDYA (Judge), PROKUROR (Prosecutor), ADVOKAT (Defense Attorney), SUDLANUVCHI (Defendant), KOTIBA (Court Secretary). Each role speaks independently with their own voice and legal position.
3. PROCEDURAL CODES: Reference the correct procedural code: FPK for civil cases, JPK for criminal cases, IPK for economic disputes.
4. FORMATTING: Each response MUST be structured with role headers like:
   [SUDYA]: Sudyaning matni...
   [PROKUROR]: Prokurorning matni...
   [ADVOKAT]: Advokatning matni...
   (omit roles not relevant to this phase)
5. LANGUAGE: Answer strictly in formal Uzbek language (O'zbek tili).
6. If unsure about an exact article number, say "aniq modda uchun qonunlar bazasiga qarang" — never make up fake citations.`

    // ── RAG: ishga mos moddalarni qonunchilik bazasidan qidirib, sud jarayoni
    //    uchun haqiqiy qonuniy asos (modda matnlari) bilan ta'minlash ──
    let systemBase = SYSTEM_BASE
    try {
      if (typeof caseDetails === 'string' && caseDetails.trim()) {
        const grounded = await groundPrompt(caseDetails, SYSTEM_BASE, 6)
        systemBase = grounded.prompt
      }
    } catch {
      // Bazadan ma'lumot olinmasa ham asosiy prompt bilan davom etiladi
    }

    switch (action) {
      case 'start':
        return await startSimulation(caseDetails, systemBase, userRole, userName)
      case 'submit_argument':
        return await submitArgument(
          simulationId,
          argument,
          systemBase,
          userRole,
          userName,
          history
        )
      case 'get_verdict':
        return await getVerdict(simulationId, systemBase, userRole)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Court simulator API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function startSimulation(
  caseDetails: string,
  systemBase: string,
  userRole?: string,
  userName?: string
) {
  const userRoleUpper = (userRole || 'SUDYA').toUpperCase()
  const displayName = userName || 'Foydalanuvchi'

  // AI boshqaradigan rollar (foydalanuvchi roli EMAS)
  const aiRoles = ['SUDYA', 'PROKUROR', 'ADVOKAT', 'SUDLANUVCHI', 'KOTIBA'].filter(
    r => r !== userRoleUpper
  )

  // Birinchi bo'lib kim gapirishi kerak
  let firstSpeaker: string
  const roleIntro: Record<string, string> = {
    SUDYA: displayName + ' (sudya)',
    PROKUROR: 'prokuror',
    ADVOKAT: 'advokat',
    SUDLANUVCHI: 'sudlanuvchi',
    KOTIBA: 'kotiba',
  }

  if (userRoleUpper === 'SUDYA') {
    firstSpeaker = 'KOTIBA'
  } else if (userRoleUpper === 'PROKUROR') {
    firstSpeaker = 'SUDYA'
  } else if (userRoleUpper === 'ADVOKAT') {
    firstSpeaker = 'SUDYA'
  } else if (userRoleUpper === 'SUDLANUVCHI') {
    firstSpeaker = 'SUDYA'
  } else {
    firstSpeaker = 'KOTIBA'
  }

  const systemPrompt = `${systemBase}

MUHIM — ROL TAQSIMOTI:
${displayName} "${roleIntro[userRoleUpper] || userRole}" rolini tanlagan.

Sen FAQAT quyidagi rollar nomidan gapirasan: ${aiRoles.join(', ')}.
"${userRoleUpper}" roli uchun HECH QACHON matn yozma — bu ${displayName}ning roli.

Birinchi bo'lib "${firstSpeaker}" gapirsin va majlisni ochsin, taraflarni tanishtirsin, keyin ${displayName}ga so'z bersin.

QAT'IY TALABLAR:
1. HECH QACHON [ismi] yoki placeholder ishlatma. Haqiqiy o'zbekcha ism-familiya ishlat.
2. HAR DOIM to'liq, batafsil va realistik matn yoz. Bir-ikki jumla bilan cheklanma.
3. "${userRoleUpper}" roli UCHUN MATN YOZMA — bu ${displayName}ning vazifasi.
4. Majlisni och, ishni e'lon qil, barcha taraflarni ismlari bilan tanishtir.
5. Foydalanuvchini "${displayName}" deb atab, unga so'z ber.

FORMAT:
[${firstSpeaker}]: (to'liq, batafsil ochilish nutqi. Ishni e'lon qil, taraflarni tanishtir, kerakli rollarni navbat bilan so'zga chaqir, keyin ${displayName}ga so'z ber.)

ESLATMA: Faqat hozir gapirishi KERAK bo'lgan rollarni formatga kirit. Boshqa rollar keyingi bosqichda gapirishi mumkin.`

  const response = await groqChat(
    systemPrompt,
    `Sud jarayonini oching. Foydalanuvchi ${displayName} "${roleIntro[userRoleUpper] || userRole}" rolida. ${caseDetails}`,
    2048
  )

  // Save initial AI response to server history
  const simulationId = 'sim_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
  addToHistory(simulationId, { role: 'assistant', content: response.text })

  const roles = parseMultiRoleResponse(response.text)

  return NextResponse.json({
    simulation_id: simulationId,
    status: 'active',
    current_phase: 'opening',
    roles,
    ai_response: response.text,
    success: true,
    user_role: userRoleUpper,
  })
}

async function submitArgument(
  simulationId: string,
  argument: string,
  systemBase: string,
  userRole?: string,
  userName?: string,
  history?: { role: 'user' | 'assistant'; content: string }[]
) {
  const userRoleUpper = (userRole || 'SUDYA').toUpperCase()

  // Use server-side history if no client history provided
  let convHistory = history
  if (!convHistory || convHistory.length === 0) {
    convHistory = getHistory(simulationId)
  } else {
    // Sync client history to server
    conversationHistory.set(simulationId, history!)
  }

  // Save user message to server history
  addToHistory(simulationId, { role: 'user', content: argument })

  // AI boshqaradigan rollar (foydalanuvchi roli EMAS) — includes ALL sim types
  const allPossibleRoles = [
    'SUDYA',
    'PROKUROR',
    'ADVOKAT',
    'SUDLANUVCHI',
    'KOTIBA',
    "DA'VOGAR",
    'JAVOBGAR',
  ]
  const aiRoles = allPossibleRoles.filter(r => r !== userRoleUpper)

  const displayName = userName || 'Foydalanuvchi'

  const systemPrompt = `${systemBase}

MUHIM — ROL TAQSIMOTI:
${displayName} "${userRoleUpper}" rolida gapirdi.

Sen FAQAT quyidagi rollar nomidan javob berasan: ${aiRoles.join(', ')}.
"${userRoleUpper}" roli UCHUN MATN YOZMA — bu ${displayName}ning roli.

MUHIM — KETMA-KETLIK:
Bir vaqtning o'zida BARCHA rollar nomidan gapirma. Har bir rol O'Z navbatida gapirsin.
Birinch bo'lib eng mos keladigan rol javob bersin, keyin boshqa rollar.
Agar foydalanuvchining argumentiga faqat bitta rol javob berishi kerak bo'lsa, faqat o'sha rol gapirsin.

QAT'IY TALABLAR:
1. HECH QACHON [ismi] yoki placeholder ishlatma. Haqiqiy ism-familiya ishlat.
2. TO'LIQ va BATAFSIL javob yoz, qisqa javob yozma.
3. Faqat foydalanuvchining argumentiga TEGISHLI bo'lgan rollar javob bersin.
4. "${userRoleUpper}" roli UCHUN MATN YOZMA — bu ${displayName}ning roli.
5. KETMA-KET javob ber — barcha rollarni birdaniga yozib tashlama.

ROLLAR VAZIFASI:
- [SUDYA]: Foydalanuvchining argumentini baholaydi, protsessual qaror qabul qiladi, keyingi qadamni aytadi
- [PROKUROR]: Ayblov pozitsiyasidan javob beradi, qarshi dalillar keltiradi (jinoyat ishlarida)
- [ADVOKAT]: Himoya pozitsiyasidan javob beradi (jinoyat ishlarida)
- [SUDLANUVCHI]: Faqat so'ralganda javob beradi, o'z pozitsiyasini bildiradi
- [KOTIBA]: Jarayon bayonini qisqacha qayd etadi
- [DA'VOGAR]: Da'vogar pozitsiyasidan javob beradi (fuqarolik ishlarida)
- [JAVOBGAR]: Javobgar pozitsiyasidan javob beradi (fuqarolik ishlarida)

MUHIM ENG MUHIM QOIDA: Bir vaqtda faqat 1-2 ta rol gapirsin. Hammasi birdan gapirmasin.`

  const response = await groqChat(
    systemPrompt,
    `${displayName} (${userRoleUpper}) argumenti: "${argument}". Unga javob bering. Ketma-ketlikda javob bering — bir vaqtda hamma rollarni yozmang.`,
    2048,
    convHistory
  )

  // Save AI response to server history
  addToHistory(simulationId, { role: 'assistant', content: response.text })

  const roles = parseMultiRoleResponse(response.text)

  return NextResponse.json({
    success: true,
    roles,
    ai_response: response.text,
  })
}

async function getVerdict(simulationId: string, systemBase: string, userRole?: string) {
  const userRoleUpper = (userRole || 'SUDYA').toUpperCase()

  // Hukmda barcha rollar gapirishi mumkin (shu jumladan foydalanuvchi roli)
  const allRoles = ['SUDYA', 'PROKUROR', 'ADVOKAT', 'SUDLANUVCHI', 'KOTIBA']

  const systemPrompt = `${systemBase}

Sen O'zbekiston Respublikasining sudyasisan. Barcha dalillar va argumentlarni tahlil qilib, yakuniy sud qarorini (hukmni) chiqar.

QAT'IY TALABLAR:
1. HECH QACHON [ismi] yoki placeholder ishlatma. Haqiqiy ism-familiya ishlat.
2. TO'LIQ va BATAFSIL hukm matni yoz.
3. Barcha qatnashchilarning yakuniy pozitsiyasini ko'rsat.
4. Hukmda "${userRoleUpper}" rolining foydalanuvchi tomonidan bajarilganligini hisobga ol va uning ishtirokini bahola.

HUKM TARKIBI:
- [SUDYA]: qaror, qonuniy asos, tayinlangan jazo/chorra
- [PROKUROR]: yakuniy pozitsiya
- [ADVOKAT]: yakuniy pozitsiya
- [SUDLANUVCHI]: oxirgi so'z
- [KOTIBA]: hukm bayoni

FORMAT:
[SUDYA]: ...
[PROKUROR]: ...
(kerakli rollarni yoz)`

  const response = await groqChat(
    systemPrompt,
    'Yakuniy hukmni chiqaring va barcha rollarning pozitsiyasini korsating.',
    2048
  )
  const roles = parseMultiRoleResponse(response.text)

  // AI baholash asosida real ball
  const evalPrompt = `${systemBase}

Foydalanuvchining sud simulyatsiyasidagi ishtirokini 0-100 ball bilan baholang.

BAHOLASH MEZONLARI:
1. Yuridik bilim (0-100)
2. Argumentatsiya (0-100)
3. Etika va protsessual qoidalarga rioya qilish (0-100)

Javobni faqat JSON formatida bering:
{"legalAccuracy": 75, "argument": 80, "ethics": 90}`

  const evalResponse = await groqChat(evalPrompt, 'Sud simulyatsiyasini baholang.', 512)
  let evalData = { legalAccuracy: 70, argument: 70, ethics: 80 }
  try {
    const jsonStr = evalResponse.text.replace(/```json?\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(jsonStr)
    evalData = { ...evalData, ...parsed }
  } catch {
    /* use defaults */
  }

  const totalScore = Math.round((evalData.legalAccuracy + evalData.argument + evalData.ethics) / 3)

  return NextResponse.json({
    roles,
    verdict: roles.find(r => r.role === 'SUDYA')?.text || response.text,
    score: totalScore,
    outcome: totalScore >= 80 ? 'Yutildi' : totalScore >= 60 ? 'Qisman yutildi' : 'Yutirilmadi',
    evaluation: evalData,
  })
}
