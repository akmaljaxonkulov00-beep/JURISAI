import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface ConversationSummary {
  id: string
  partnerId: string
  partnerName: string
  partnerAvatar?: string
  partnerRole: 'advocate' | 'citizen'
  isVerifiedAdvocate?: boolean
  lastMessageText: string
  lastMessageAt: string
  unreadCount: number
  status: 'active' | 'archived' | 'blocked'
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderRole: 'advocate' | 'citizen'
  messageText: string
  attachments: Array<{ name: string; url: string; size?: number; type?: string }>
  messageType: 'text' | 'image' | 'file' | 'audio'
  isRead: boolean
  readAt?: string
  createdAt: string
}

/**
 * Foydalanuvchining barcha conversationlari ro'yxatini olish.
 * Faqat ushbu foydalanuvchi ishtirokchi bo'lgan suhbatlargina qaytariladi.
 */
export async function getUserConversations(
  userId: string,
  userRole: 'citizen' | 'advocate'
): Promise<ConversationSummary[]> {
  const admin = getSupabaseAdmin()

  try {
    const isCitizen = userRole === 'citizen'
    const query = admin
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })

    const { data: convs, error } = isCitizen
      ? await query.eq('citizen_id', userId)
      : await query.eq('advocate_id', userId)

    if (error || !convs) return []

    // Partner profillarini olish
    const partnerIds = convs.map(c => (isCitizen ? c.advocate_id : c.citizen_id))
    const { data: partners } = await admin
      .from('registered_users')
      .select('id, name, avatar, role')
      .in('id', partnerIds)

    const partnerMap = new Map((partners || []).map(p => [p.id, p]))

    return convs.map(c => {
      const pId = isCitizen ? c.advocate_id : c.citizen_id
      const pData = partnerMap.get(pId)
      return {
        id: c.id,
        partnerId: pId,
        partnerName: pData?.name || (isCitizen ? 'Advokat' : 'Mijoz'),
        partnerAvatar: pData?.avatar,
        partnerRole: isCitizen ? 'advocate' : 'citizen',
        isVerifiedAdvocate: isCitizen,
        lastMessageText: c.last_message_text || '',
        lastMessageAt: c.last_message_at || c.created_at,
        unreadCount: isCitizen ? c.citizen_unread_count || 0 : c.advocate_unread_count || 0,
        status: c.status || 'active',
      }
    })
  } catch (err) {
    console.warn('[ChatService] getUserConversations error:', err)
    return []
  }
}

/**
 * Suhbat xabarlarini olish.
 * QAT'IY XAVFSIZLIK: Agar userId conversation_id dagi citizen_id yoki advocate_id ga
 * teng bo'lmasa, so'rov rad etiladi (403 Forbidden). Boshqa hech kim kira olmaydi!
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string
): Promise<{ allowed: boolean; messages: ChatMessage[]; partner?: any }> {
  const admin = getSupabaseAdmin()

  const { data: conv, error } = await admin
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (error || !conv) {
    return { allowed: false, messages: [] }
  }

  // Ishtirokchilik tekshiruvi (IDOR himoyasi)
  const isParticipant = conv.citizen_id === userId || conv.advocate_id === userId
  if (!isParticipant) {
    return { allowed: false, messages: [] }
  }

  const { data: rawMessages } = await admin
    .from('private_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const messages: ChatMessage[] = (rawMessages || []).map(m => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    senderRole: m.sender_role,
    messageText: m.message_text,
    attachments: m.attachments || [],
    messageType: m.message_type || 'text',
    isRead: Boolean(m.is_read),
    readAt: m.read_at,
    createdAt: m.created_at,
  }))

  const partnerId = conv.citizen_id === userId ? conv.advocate_id : conv.citizen_id
  const { data: partner } = await admin
    .from('registered_users')
    .select('id, name, avatar, role')
    .eq('id', partnerId)
    .maybeSingle()

  return { allowed: true, messages, partner }
}

/**
 * Xabar yuborish.
 * Qat'iy avtorizatsiya: yuboruvchi suhbat a'zosi bo'lishi shart.
 */
export async function sendChatMessage(params: {
  conversationId: string
  senderId: string
  senderRole: 'citizen' | 'advocate'
  messageText: string
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>
  messageType?: 'text' | 'image' | 'file' | 'audio'
}): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  const admin = getSupabaseAdmin()
  const { conversationId, senderId, senderRole, messageText, attachments = [], messageType = 'text' } = params

  const { data: conv } = await admin
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (!conv || (conv.citizen_id !== senderId && conv.advocate_id !== senderId)) {
    return { success: false, error: "Ushbu suhbatga xabar yozish huquqiga ega emassiz." }
  }

  const now = new Date().toISOString()
  const { data: msg, error: msgErr } = await admin
    .from('private_messages')
    .insert({
      conversation_id: conversationId,
      citizen_id: conv.citizen_id,
      advocate_id: conv.advocate_id,
      sender_id: senderId,
      sender_role: senderRole,
      message_text: messageText,
      attachments,
      message_type: messageType,
      is_read: false,
      created_at: now,
    })
    .select()
    .single()

  if (msgErr || !msg) {
    return { success: false, error: msgErr?.message || 'Xabarni yuborib bo‘lmadi' }
  }

  // Conversation jadvalini yangilash va qabul qiluvchining unread count'ini oshirish
  const isSenderCitizen = senderRole === 'citizen'
  await admin
    .from('conversations')
    .update({
      last_message_text: messageText.slice(0, 100),
      last_message_at: now,
      citizen_unread_count: isSenderCitizen ? conv.citizen_unread_count : (conv.citizen_unread_count || 0) + 1,
      advocate_unread_count: isSenderCitizen ? (conv.advocate_unread_count || 0) + 1 : conv.advocate_unread_count,
      updated_at: now,
    })
    .eq('id', conversationId)

  return {
    success: true,
    message: {
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      senderRole: msg.sender_role,
      messageText: msg.message_text,
      attachments: msg.attachments || [],
      messageType: msg.message_type || 'text',
      isRead: false,
      createdAt: msg.created_at,
    },
  }
}

/**
 * Xabarlarni o'qildi (Read) deb belgilash
 */
export async function markConversationAsRead(conversationId: string, readerId: string) {
  const admin = getSupabaseAdmin()
  const now = new Date().toISOString()

  // 1. private_messages da o'qilgan qilish
  await admin
    .from('private_messages')
    .update({ is_read: true, read_at: now })
    .eq('conversation_id', conversationId)
    .neq('sender_id', readerId)

  // 2. conversations da unread sonini 0 ga tushirish
  const { data: conv } = await admin
    .from('conversations')
    .select('citizen_id, advocate_id')
    .eq('id', conversationId)
    .single()

  if (conv) {
    const isCitizen = conv.citizen_id === readerId
    await admin
      .from('conversations')
      .update(isCitizen ? { citizen_unread_count: 0 } : { advocate_unread_count: 0 })
      .eq('id', conversationId)
  }
}
