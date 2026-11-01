import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJson } from '@/lib/gemini'

const LEGAL_CATEGORIES = [
  'Fuqarolik huquqi',
  'Mehnat huquqi',
  'Oilaviy huquq',
  'Jinoyat huquqi',
  'Meros huquqi',
  'Iste’molchilar huquqlari',
  'Uy-joy huquqi',
  'Soliq va moliya',
  'Yer va ko‘chmas mulk',
  'Biznes va korporativ huquq',
  'Ma’muriy huquq',
  'Yo‘l harakati va transport',
]

interface CategoryClassificationResult {
  category: string
  confidence: number
  summary: string
  suggestedArticles: string[]
  hasSensitiveInfo: boolean
  sensitiveWarning?: string
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title && !description) {
      return NextResponse.json(
        { success: false, error: 'Sarlavha yoki matn kiritilishi shart' },
        { status: 400 }
      )
    }

    const textToAnalyze = `${title || ''}\n${description || ''}`

    // 1. Shaxsiy ma'lumotlar / pasport seriyalari qidirish
    const passportRegex = /\b[A-Z]{2}\s?\d{7}\b/i
    const pinflRegex = /\b\d{14}\b/
    const hasSensitiveInfo = passportRegex.test(textToAnalyze) || pinflRegex.test(textToAnalyze)

    let classification: CategoryClassificationResult

    try {
      const prompt = `
Siz O‘zbekiston Respublikasi qonunchiligi bo‘yicha ixtisoslashgan yuridik AI tasniflagichsiz.
Quyidagi fuqaroning savolini tahlil qiling:
Sarlavha: "${title || ''}"
Matn: "${description || ''}"

Ruxsat etilgan sohalar:
${LEGAL_CATEGORIES.map(c => `- ${c}`).join('\n')}

Javobni FAQAT quyidagi JSON formatida qaytaring:
{
  "category": "Yuqoridagi sohalardan eng mos biri",
  "confidence": 0.95,
  "summary": "Savolning qisqa mohiyati (1 gap)",
  "suggestedArticles": ["Tegishli qonun kodi va moddalari, masalan: MK 161, FK 1135"]
}
`
      const aiRes = await callGeminiJson<CategoryClassificationResult>(prompt, {
        temperature: 0.1,
      })

      classification = {
        category: aiRes.category || 'Fuqarolik huquqi',
        confidence: aiRes.confidence || 0.9,
        summary: aiRes.summary || '',
        suggestedArticles: aiRes.suggestedArticles || [],
        hasSensitiveInfo,
        sensitiveWarning: hasSensitiveInfo
          ? 'Diqqat: Matnda pasport yoki PINFL kabi maxfiy shaxsiy ma’lumotlar aniqlandi. Xavfsizlik uchun ularni o‘chirib tashlash tavsiya etiladi.'
          : undefined,
      }
    } catch {
      // Deterministic fallback rule engine if AI API is temporarily unavailable
      const lower = textToAnalyze.toLowerCase()
      let matchedCat = 'Fuqarolik huquqi'
      if (lower.includes('mehnat') || lower.includes('ishdan') || lower.includes('ta’til') || lower.includes('ish haqi')) {
        matchedCat = 'Mehnat huquqi'
      } else if (lower.includes('meros') || lower.includes('vasiyat') || lower.includes('voris')) {
        matchedCat = 'Meros huquqi'
      } else if (lower.includes('ajrash') || lower.includes('aliment') || lower.includes('nikoh') || lower.includes('oila')) {
        matchedCat = 'Oilaviy huquq'
      } else if (lower.includes('iste’molchi') || lower.includes('do‘kon') || lower.includes('tovar') || lower.includes('kafolat')) {
        matchedCat = 'Iste’molchilar huquqlari'
      } else if (lower.includes('ijara') || lower.includes('uy-joy') || lower.includes('kvartira') || lower.includes('propiska')) {
        matchedCat = 'Uy-joy huquqi'
      } else if (lower.includes('jinoyat') || lower.includes('tergov') || lower.includes('o‘g‘irlik') || lower.includes('firibgar')) {
        matchedCat = 'Jinoyat huquqi'
      }

      classification = {
        category: matchedCat,
        confidence: 0.88,
        summary: 'Savol mazmuni tahlil qilindi',
        suggestedArticles: [],
        hasSensitiveInfo,
        sensitiveWarning: hasSensitiveInfo
          ? 'Diqqat: Matnda shaxsiy ma’lumotlar aniqlandi.'
          : undefined,
      }
    }

    return NextResponse.json({
      success: true,
      data: classification,
      availableCategories: LEGAL_CATEGORIES,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Tasniflashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
