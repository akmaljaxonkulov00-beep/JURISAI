import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser, getUserRole } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const citizenId = searchParams.get('citizenId')
    const advocateId = searchParams.get('advocateId')

    if (!citizenId || !advocateId) {
      return NextResponse.json(
        { success: false, error: 'citizenId va advocateId parametrlari talab qilinadi' },
        { status: 400 }
      )
    }

    const { role } = await getUserRole(auth.user.id, auth.user.email)

    // XAVFSIZLIK QOIDASI: Faqat ushbu fuqaro yoki ushbu advokat (yoki favqulodda admin) ko'ra oladi
    const isCitizenParticipant = auth.user.id === citizenId
    const isAdvocateParticipant = auth.user.id === advocateId
    const isAdmin = role === 'admin'

    if (!isCitizenParticipant && !isAdvocateParticipant && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Maxfiy advokat-mijoz suhbati. Siz ushbu suhbat ishtirokchisi emassiz (Kirish taqiqlangan).',
        },
        { status: 403 }
      )
    }

    const messages = await platformDb.getMessages(citizenId, advocateId)

    // Mark as read for the receiver
    const readerRole = isCitizenParticipant ? 'citizen' : 'advocate'
    await platformDb.markMessagesRead(citizenId, advocateId, readerRole)

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Xabarlarni yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { citizenId, advocateId, messageText, attachments } = body

    if (!citizenId || !advocateId || !messageText?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Ishtirokchilar va xabar matni kiritilishi shart' },
        { status: 400 }
      )
    }

    const isCitizen = auth.user.id === citizenId
    const isAdvocate = auth.user.id === advocateId

    if (!isCitizen && !isAdvocate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Siz bu shaxsiy suhbatga xabar yuborish huquqiga ega emassiz',
        },
        { status: 403 }
      )
    }

    const senderRole = isCitizen ? 'citizen' : 'advocate'
    const conversationId = `conv-${[citizenId, advocateId].sort().join('-')}`

    const msg = await platformDb.sendMessage({
      conversation_id: conversationId,
      citizen_id: citizenId,
      advocate_id: advocateId,
      sender_id: auth.user.id,
      sender_role: senderRole,
      message_text: sanitizeInput(messageText),
      attachments: attachments || [],
      is_read: false,
    })

    return NextResponse.json({ success: true, data: msg }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Xabar yuborishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
