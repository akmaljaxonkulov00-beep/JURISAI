import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function groqChat(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048
): Promise<{ text: string }> {
  if (!GROQ_API_KEY) return { text: 'AI xizmati sozlanmagan' }

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
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
    const { action, caseDetails, argument, simulationId } = body

    const SYSTEM_BASE = `You are JurisAI — the leading expert AI Legal Assistant strictly specialized in the COMPLETE legislation of the Republic of Uzbekistan (O'zbekiston Respublikasi Qonunchiligi).

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

    switch (action) {
      case 'start':
        return await startSimulation(caseDetails, SYSTEM_BASE)
      case 'submit_argument':
        return await submitArgument(simulationId, argument, SYSTEM_BASE)
      case 'get_verdict':
        return await getVerdict(simulationId, SYSTEM_BASE)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Court simulator API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function startSimulation(caseDetails: string, systemBase: string) {
  const systemPrompt = `${systemBase}

Sen O'zbekiston Respublikasining professional sudyasisan. Berilgan holat bo'yicha sud majlisini oching.

PROTSESSUAL QOIDALAR:
- Fuqarolik ishlari bo'yicha: FPK (Fuqarolik protsessual kodeksi) qoidalariga amal qiling
- Jinoyat ishlari bo'yicha: JPK (Jinoiy protsessual kodeksi) qoidalariga amal qiling
- Iqtisodiy nizolar bo'yicha: IPK (Iqtisodiy protsessual kodeksi) qoidalariga amal qiling
- Sud majlisida: taraflarni tanishtirish, ishni e'lon qilish, taraflarning huquq va majburiyatlarini tushuntirish

MUHIM — BARCHA ROLLAR UCHUN JAVOB:
Sud majlisini ochganingizdan so'ng, quyidagi rollardan mos keladiganlarining pozitsiyasini ko'rsating:
- [SUDYA]: Sudya majlisni ochadi, qoidalarni tushuntiradi
- [PROKUROR]: (agar jinoyat ishi bo'lsa) Ayblov xulosasini o'qiydi
- [ADVOKAT]: (agar jinoyat ishi bo'lsa) Himoya pozitsiyasini bildiradi
- [SUDLANUVCHI]: (agar jinoyat ishi bo'lsa) O'z pozitsiyasini bildiradi
- [KOTIBA]: Majlis bayonini yuritadi

FORMAT:
Har bir rolning javobini quyidagi formatda yoz:
[SUDYA]: ...
[PROKUROR]: ...
(kerakli rollarni yoz, keraksizlarini tashlab ket)`

  const response = await groqChat(systemPrompt, `Sud jarayonini boshlang: ${caseDetails}`, 2048)

  const simulationId = 'sim_' + Date.now()
  const roles = parseMultiRoleResponse(response.text)

  return NextResponse.json({
    simulation_id: simulationId,
    status: 'active',
    current_phase: 'opening',
    roles,
    ai_response: response.text,
    success: true,
  })
}

async function submitArgument(simulationId: string, argument: string, systemBase: string) {
  const systemPrompt = `${systemBase}

Sen O'zbekiston Respublikasining sudyasisan. Tomonlarning argumentlarini qonuniy nuqtai nazardan baholang.

BAHOLASH MEZONLARI:
1. Argumentning qonuniyligi — tegishli qonun moddasiga asoslanganmi?
2. Dalillarning ishonchliligi — dalillar qonuniy tartibda olinganmi?
3. Taraflarning huquqiy pozitsiyasi — protsessual talablarga rioya qilinganmi?

MUHIM — BARCHA ROLLAR UCHUN JAVOB:
Har bir rol o'z pozitsiyasidan javob bersin:
- [SUDYA]: Baho va keyingi qadam
- [PROKUROR]: (agar jinoyat ishi bo'lsa) O'z pozitsiyasi
- [ADVOKAT]: (agar jinoyat ishi bo'lsa) Himoya pozitsiyasi
- [KOTIBA]: Jarayon bayoni

FORMAT:
[SUDYA]: ...
[PROKUROR]: ...
(kerakli rollarni yoz)`

  const response = await groqChat(systemPrompt, `Argument: "${argument}". Javobingizni bering.`, 2048)

  const roles = parseMultiRoleResponse(response.text)

  return NextResponse.json({
    success: true,
    roles,
    ai_response: response.text,
  })
}

async function getVerdict(simulationId: string, systemBase: string) {
  const systemPrompt = `${systemBase}

Sen O'zbekiston Respublikasining sudyasisan. Barcha dalillar va argumentlarni tahlil qilib, yakuniy sud qarorini (hukmni) chiqaring.

HUKM TARKIBI:
1. Qarorning qaror qismi — kim, nima haqda, qanday qaror qabul qilindi
2. Qonuniy asos — aniq kodeks, modda, band ko'rsatilgan
3. Qarorning oqibatlari — ijro etish tartibi, shikoyat qilish muddati va tartibi

MUHIM — BARCHA ROLLAR UCHUN JAVOB:
- [SUDYA]: Yakuniy hukmni e'lon qiladi
- [KOTIBA]: Hukm bayoni
- [PROKUROR]: (agar jinoyat ishi) O'z fikri
- [ADVOKAT]: (agar jinoyat ishi) O'z fikri

FORMAT:
[SUDYA]: ...
[KOTIBA]: ...
(kerakli rollarni yoz)`

  const response = await groqChat(systemPrompt, 'Yakuniy hukmni chiqaring va barcha rollarning pozitsiyasini korsating.', 2048)
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
    const parsed = JSON.parse(evalResponse.text)
    evalData = { ...evalData, ...parsed }
  } catch { /* use defaults */ }

  const totalScore = Math.round((evalData.legalAccuracy + evalData.argument + evalData.ethics) / 3)

  return NextResponse.json({
    roles,
    verdict: roles.find(r => r.role === 'SUDYA')?.text || response.text,
    score: totalScore,
    outcome: totalScore >= 80 ? 'Yutildi' : totalScore >= 60 ? 'Qisman yutildi' : 'Yutirilmadi',
    evaluation: evalData,
  })
}
