import { NextRequest, NextResponse } from 'next/server'
import { aiClient } from '@/lib/ai-client'
import { groundPrompt, validateCitations, appendCitationNote } from '@/lib/legal-rag'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const scenario_title: string = String(body?.scenario_title || '').trim()
    const scenario_description: string = String(body?.scenario_description || '').trim()
    const case_type: string = String(body?.case_type || 'huquqiy').trim()

    // Input validation — bo'sh so'rov bilan AI chaqirilmaydi (500 o'rniga 400)
    if (!scenario_title && !scenario_description) {
      return NextResponse.json(
        { error: 'Vaziyat (sarlavha yoki tavsif) talab qilinadi' },
        { status: 400 }
      )
    }

    const scenario = `${scenario_title || 'Qaror daraxti'}. ${scenario_description}`.trim()

    const baseSystem =
      "Sen O'zbekiston Respublikasi qonunchiligi bo'yicha professional huquqiy tahlilchisan. " +
      'Foydalanuvchining qaror daraxtidagi vaziyatni qonun nuqtai nazaridan tahlil qil, ' +
      "har bir yo'l uchun Ehtimollik (%), kutilayotgan muddat (oy) va taxminiy xarajatni ber. " +
      'Har bir tavsiyani tegishli qonun moddasiga asosla.'

    const { prompt: systemPrompt } = await groundPrompt(scenario, baseSystem, 6)

    const userPrompt = `
Qaror daraxtidagi vaziyatni tahlil qiling:

Sarlavha: ${scenario_title}
Tavsif: ${scenario_description}
Ish turi: ${case_type}

Quyidagi formatda javob bering:
1. HUQUQIY BAHO — vaziyatga tegishli moddalar va ularning mazmuni
2. YO'LLAR TAHLILI — har bir mumkin bo'lgan yo'l uchun: Ehtimollik (%), Vaqt, Xarajat
3. XAVFLAR — huquqiy, moliyaviy va muddat xavflari
4. TAVSIYALAR — aniq qadamlar

Modda raqamlarini faqat bazadan topilgan moddalardan keltiring.
`

    const response = await aiClient.chatMessage(userPrompt, systemPrompt)
    let text = response.text || ''

    // Validate citations: to'qima modda raqamlari aniqlansa, javobga eslatma qo'shiladi
    const validation = await validateCitations(text)
    if (validation.invalid.length > 0) {
      text = appendCitationNote(text, validation)
    }

    return NextResponse.json({ data: text })
  } catch (error) {
    console.error('Decision tree analyze error:', error)
    const message = error instanceof Error ? error.message : 'Tahlil amalga oshmadi'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
