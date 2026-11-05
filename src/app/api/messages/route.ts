import { NextRequest, NextResponse } from 'next/server'
import { requireUser, getUserRole } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'
import {
  getUserConversations,
  getConversationMessages,
  sendChatMessage,
  markConversationAsRead,
} from '@/lib/chat-service'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const citizenIdParam = searchParams.get('citizenId')
    const advocateIdParam = searchParams.get('advocateId')

    const admin = getSupabaseAdmin()
    const { role } = await getUserRole(auth.user.id, auth.user.email)
    const isAdvocate = (role as string).toLowerCase() === 'advocate'

    // 1. Agar aniq conversationId berilgan bo'lsa
    if (conversationId) {
      const result = await getConversationMessages(conversationId, auth.user.id)
      if (!result.allowed) {
        return NextResponse.json(
          { success: false, error: "Ushbu shaxsiy suhbatga kirish taqiqlangan." },
          { status: 403 }
        )
      }
      // O'qilgan deb belgilash
      await markConversationAsRead(conversationId, auth.user.id)
      return NextResponse.json({ success: true, data: result.messages, partner: result.partner })
    }

    // 2. Agar citizenId va advocateId berilgan bo'lsa
    if (citizenIdParam && advocateIdParam) {
      if (auth.user.id !== citizenIdParam && auth.user.id !== advocateIdParam && role !== 'admin') {
        return NextResponse.json(
          { success: false, error: "Maxfiy suhbat. Kirish taqiqlangan." },
          { status: 403 }
        )
      }

      // Mavjud conversation ni topish yoki yangi ochish
      let { data: conv } = await admin
        .from('conversations')
        .select('*')
        .eq('citizen_id', citizenIdParam)
        .eq('advocate_id', advocateIdParam)
        .maybeSingle()

      if (!conv) {
        const { data: created } = await admin
          .from('conversations')
          .insert({
            citizen_id: citizenIdParam,
            advocate_id: advocateIdParam,
            status: 'active',
          })
          .select()
          .single()
        conv = created
      }

      if (conv) {
        const result = await getConversationMessages(conv.id, auth.user.id)
        await markConversationAsRead(conv.id, auth.user.id)
        return NextResponse.json({
          success: true,
          conversationId: conv.id,
          data: result.messages,
          partner: result.partner,
        })
      }
    }

    // 3. Hech narsa berilmagan bo'lsa: foydalanuvchining barcha conversationlari
    const convs = await getUserConversations(auth.user.id, isAdvocate ? 'advocate' : 'citizen')
    return NextResponse.json({ success: true, conversations: convs })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Xabarlarni yuklashda xatolik yuz berdi: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { conversationId, partnerId, messageText, attachments, messageType = 'text' } = body

    if (!messageText?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Xabar matni yoki biriktirilgan fayl kiritilishi shart' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const { role } = await getUserRole(auth.user.id, auth.user.email)
    const isAdvocate = (role as string).toLowerCase() === 'advocate'
    const senderRole = isAdvocate ? 'advocate' : 'citizen'

    let targetConvId = conversationId

    // Agar conversationId bo'lmasa, lekin partnerId bo'lsa
    if (!targetConvId && partnerId) {
      const citizenId = isAdvocate ? partnerId : auth.user.id
      const advocateId = isAdvocate ? auth.user.id : partnerId

      let { data: conv } = await admin
        .from('conversations')
        .select('id')
        .eq('citizen_id', citizenId)
        .eq('advocate_id', advocateId)
        .maybeSingle()

      if (!conv) {
        const { data: created } = await admin
          .from('conversations')
          .insert({
            citizen_id: citizenId,
            advocate_id: advocateId,
            status: 'active',
          })
          .select('id')
          .single()
        conv = created
      }
      targetConvId = conv?.id
    }

    if (!targetConvId) {
      return NextResponse.json(
        { success: false, error: 'Suhbat aniqlanmadi (conversationId yoki partnerId zarur)' },
        { status: 400 }
      )
    }

    const cleanText = sanitizeInput(messageText || '')
    const result = await sendChatMessage({
      conversationId: targetConvId,
      senderId: auth.user.id,
      senderRole,
      messageText: cleanText,
      attachments: attachments || [],
      messageType,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: result.message }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Xabar yuborishda xatolik yuz berdi: ' + error.message },
      { status: 500 }
    )
  }
}
