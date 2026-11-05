import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface CitizenUsageInfo {
  userId: string
  freeQuestionsUsed: number
  freeQuestionsLimit: number
  remainingFree: number
  paidCredits: number
  canAsk: boolean
  currentMonth: string
  subscriptionPlan: string
}

export const CITIZEN_PRICING = {
  freeMonthlyLimit: 2,
  singleQuestion: 9900,
  pack5Questions: 39900,
  monthlySubscription: 49900,
  monthlySubscriptionLimit: 15,
}

/**
 * Citizen uchun oylik bepul savollar va kreditlarni hisoblash / yangilash.
 * Kalendar oy bo'yicha avtomatik reset qilinadi.
 */
export async function getCitizenUsage(userId: string): Promise<CitizenUsageInfo> {
  const admin = getSupabaseAdmin()
  const currentMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  try {
    let { data: profile } = await admin
      .from('citizen_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!profile) {
      // Profil yo'q bo'lsa, registered_users'dan yaratamiz
      const { data: user } = await admin
        .from('registered_users')
        .select('name, email, phone')
        .eq('id', userId)
        .maybeSingle()

      const newProfile = {
        user_id: userId,
        full_name: user?.name || user?.email?.split('@')[0] || 'Fuqaro',
        email: user?.email || '',
        phone: user?.phone || '',
        free_questions_used: 0,
        free_questions_reset_month: currentMonth,
        question_credits: 0,
        subscription_plan: 'free',
      }

      const { data: created } = await admin
        .from('citizen_profiles')
        .insert(newProfile)
        .select()
        .single()

      profile = created || newProfile
    }

    // Yangi kalendar oy boshlangan bo'lsa, bepul limitni avtomatik reset qilish
    if (profile.free_questions_reset_month !== currentMonth) {
      await admin
        .from('citizen_profiles')
        .update({
          free_questions_used: 0,
          free_questions_reset_month: currentMonth,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      profile.free_questions_used = 0
      profile.free_questions_reset_month = currentMonth
    }

    const freeLimit = CITIZEN_PRICING.freeMonthlyLimit
    const freeUsed = Number(profile.free_questions_used || 0)
    const remainingFree = Math.max(0, freeLimit - freeUsed)
    const paidCredits = Number(profile.question_credits || 0)
    const canAsk = remainingFree > 0 || paidCredits > 0

    return {
      userId,
      freeQuestionsUsed: freeUsed,
      freeQuestionsLimit: freeLimit,
      remainingFree,
      paidCredits,
      canAsk,
      currentMonth,
      subscriptionPlan: profile.subscription_plan || 'free',
    }
  } catch (err) {
    console.warn('[CitizenService] getCitizenUsage fallback:', err)
    return {
      userId,
      freeQuestionsUsed: 0,
      freeQuestionsLimit: 2,
      remainingFree: 2,
      paidCredits: 0,
      canAsk: true,
      currentMonth,
      subscriptionPlan: 'free',
    }
  }
}

/**
 * Savol yuborilganda limit / kreditni yechish.
 * 1) Bepul limit bo'lsa, bepul ishlatiladi.
 * 2) Bepul tugagan bo'lsa, pullik kreditdan 1 ta sarflanadi.
 */
export async function deductCitizenQuestion(
  userId: string
): Promise<{ success: boolean; usedPaidCredit: boolean; remaining: number; error?: string }> {
  const usage = await getCitizenUsage(userId)

  if (!usage.canAsk) {
    return {
      success: false,
      usedPaidCredit: false,
      remaining: 0,
      error:
        "Oylik 2 ta bepul savol limitingiz tugagan. Yangi savol berish uchun savol kreditini xarid qiling.",
    }
  }

  const admin = getSupabaseAdmin()

  try {
    if (usage.remainingFree > 0) {
      // Bepul savoldan foydalanildi
      await admin
        .from('citizen_profiles')
        .update({
          free_questions_used: usage.freeQuestionsUsed + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      return {
        success: true,
        usedPaidCredit: false,
        remaining: usage.remainingFree - 1 + usage.paidCredits,
      }
    } else if (usage.paidCredits > 0) {
      // Pullik kreditdan foydalanildi
      await admin
        .from('citizen_profiles')
        .update({
          question_credits: usage.paidCredits - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      return {
        success: true,
        usedPaidCredit: true,
        remaining: usage.paidCredits - 1,
      }
    }
  } catch (err: any) {
    return {
      success: false,
      usedPaidCredit: false,
      remaining: 0,
      error: err.message || 'Kreditlarni yechishda xatolik',
    }
  }

  return { success: false, usedPaidCredit: false, remaining: 0, error: 'Limit mavjud emas' }
}

/**
 * Pullik savol krediti sotib olinganda qo'shish
 */
export async function addCitizenQuestionCredits(
  userId: string,
  creditsCount: number,
  amount: number,
  paymentProvider = 'click',
  transactionRef = ''
): Promise<{ success: boolean; newBalance: number }> {
  const admin = getSupabaseAdmin()
  const usage = await getCitizenUsage(userId)
  const newBalance = usage.paidCredits + creditsCount

  await admin
    .from('citizen_profiles')
    .update({
      question_credits: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Tranzaksiyani saqlash
  try {
    await admin.from('financial_transactions').insert({
      user_id: userId,
      amount,
      type: 'question_credit_purchase',
      provider: paymentProvider,
      provider_transaction_id: transactionRef || `credit_${Date.now()}`,
      status: 'completed',
    })
  } catch {}

  return { success: true, newBalance }
}
