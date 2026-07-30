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

MUHIM QOIDA: Sen faqat SUDYA rolida gapirayapsan. Boshqa rollar (Prokuror, Advokat, Sudlanuvchi, Kotiba) HAQIDA GAPIRMA. Ularning o'rniga foydalanuvchi gapiradi yoki keyingi bosqichda javob beradi.

Sen O'zbekiston Respublikasining professional sudyasisan. Berilgan holat bo'yicha sud majlisini och.

PROTSESSUAL QOIDALAR:
- Fuqarolik ishlari bo'yicha: FPK (Fuqarolik protsessual kodeksi)
- Jinoyat ishlari bo'yicha: JPK (Jinoiy protsessual kodeksi)

QAT'IY TALABLAR:
1. HECH QACHON [ismi] yoki boshqa placeholder ishlatma. Haqiqiy o'zbekcha ism-familiya ishlat: Akbar Toshmatov, Nilufar Karimova, Botir Rahimov va hokazo.
2. HAR DOIM to'liq, batafsil va realistik matn yoz. Bir-ikki jumla bilan cheklanma.
3. FAQAT SUDYA rolida gapir. Boshqa rollar (Prokuror, Advokat, Kotiba) uchun matn yozma.
4. Prokuror va advokat ismlarini aytib o'tishing mumkin (masalan: "Prokuror Akbar Toshmatov, advokat Nilufar Karimova"), lekin ULARNING NUTQINI AYTMA — ular keyin foydalanuvchi argumentiga javoban gapiradi.
5. Sud majlisini och, ishni e'lon qil, keyin foydalanuvchiga so'z ber.

FORMAT:
[SUDYA]: (to'liq, batafsil ochilish nutqi. Ishni e'lon qil, taraflarni tanishtir, keyin foydalanuvchiga so'z ber.)`

  const response = await groqChat(systemPrompt, `Sud jarayonini oching. Foydalanuvchi roli: ${caseDetails}`, 2048)

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

Endi foydalanuvchi o'z argumentini yubordi. Sen O'zbekiston Respublikasi sudyasisan va quyidagi rollardan mos keladiganlarining javobini tayyorlaysan.

QAT'IY TALABLAR:
1. HECH QACHON [ismi] yoki boshqa placeholder ishlatma. Har doim haqiqiy ism-familiya ishlat.
2. TO'LIQ va BATAFSIL javob yoz, qisqa yarimta javob yozma.
3. Faqat foydalanuvchining argumentiga mos keladigan rollar javob bersin.

ROLLAR:
- [SUDYA]: Foydalanuvchining argumentini baholaydi va keyingi qadamni aytadi
- [PROKUROR]: (agar jinoyat ishi bo'lsa) Foydalanuvchining argumentiga qarshi pozitsiya bildiradi
- [ADVOKAT]: (agar jinoyat ishi bo'lsa) Foydalanuvchini qo'llab-quvvatlaydi yoki qarshi chiqadi
- [KOTIBA]: Jarayon bayonini yuritadi

FORMAT:
[SUDYA]: ...
[PROKUROR]: ...
(kerakli rollarni yoz, keraksizlarini tashlab ket)`

  const response = await groqChat(systemPrompt, `Foydalanuvchi argumenti: "${argument}". Unga javob bering.`, 2048)

  const roles = parseMultiRoleResponse(response.text)

  return NextResponse.json({
    success: true,
    roles,
    ai_response: response.text,
  })
}

async function getVerdict(simulationId: string, systemBase: string) {
  const systemPrompt = `${systemBase}

Sen O'zbekiston Respublikasining sudyasisan. Barcha dalillar va argumentlarni tahlil qilib, yakuniy sud qarorini (hukmni) chiqar.

QAT'IY TALABLAR:
1. HECH QACHON [ismi] yoki boshqa placeholder ishlatma. Haqiqiy ism-familiya ishlat.
2. TO'LIQ va BATAFSIL hukm matni yoz.
3. Barcha qatnashchilarning (SUDYA, PROKUROR, ADVOKAT, KOTIBA) yakuniy pozitsiyasini ko'rsat.

HUKM TARKIBI:
1. Sudya: qaror, qonuniy asos, oqibatlar
2. Prokuror: yakuniy fikri (agar jinoyat ishi bo'lsa)
3. Advokat: yakuniy fikri (agar jinoyat ishi bo'lsa)
4. Kotiba: hukm bayoni

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
    const jsonStr = evalResponse.text.replace(/```json?\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(jsonStr)
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
