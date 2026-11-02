import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const LEVEL_XP = 200 // 200 XP per level

export interface AwardXPOptions {
  userId: string
  userEmail?: string
  action: string
  xp: number
  title?: string
  description?: string
  idempotencyKey: string
  metadata?: Record<string, any>
}

export interface AwardXPResult {
  success: boolean
  alreadyAwarded: boolean
  xpEarned: number
  totalXp: number
  level: number
  unlockedAchievements?: string[]
}

/**
 * Standardized XP values per logical completed action
 */
export const XP_ACTION_VALUES: Record<string, number> = {
  'case-solver': 20,
  irac: 15,
  irac_analysis: 15,
  'virtual-court': 25,
  'court-simulation': 25,
  'decision-tree': 15,
  scenario: 10,
  'scenario-evaluation': 15,
  'document-generate': 10,
  'risk-assessment': 10,
  'court-practice': 10,
  calculator: 5,
  'ai-chat': 5,
  'law-search': 3,
  'speech-stt': 5,
}

/**
 * Centrally awards XP with strict idempotency to prevent duplicate grants.
 * PostgreSQL database via Supabase Admin is the persistent store.
 * Uses usage_logs tokens and achievements table.
 */
export async function awardUserXP(options: AwardXPOptions): Promise<AwardXPResult> {
  const {
    userId,
    userEmail = '',
    action,
    xp,
    title = '',
    description = '',
    idempotencyKey,
    metadata = {},
  } = options

  if (!userId || !idempotencyKey) {
    return { success: false, alreadyAwarded: false, xpEarned: 0, totalXp: 0, level: 1 }
  }

  const supabase = getSupabaseAdmin()

  try {
    // 1. Fetch recent usage logs for this user to check idempotency and calculate total XP
    const { data: userLogs, error: logsError } = await supabase
      .from('usage_logs')
      .select('id, name, tokens, action, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(300)

    if (logsError) {
      console.warn('Error fetching usage_logs in awardUserXP:', logsError.message)
    }

    const logs = userLogs || []

    // Check if this idempotency key was already recorded in log name
    const idKeyTag = `[key:${idempotencyKey}]`
    const alreadyAwarded = logs.some(
      log => log.name && (log.name.includes(idKeyTag) || log.name.includes(idempotencyKey))
    )

    // Calculate current total XP directly from real usage_logs tokens
    const currentXp = logs.reduce((sum, log) => sum + (Number(log.tokens) || 0), 0)
    const currentLevel = Math.floor(currentXp / LEVEL_XP) + 1

    if (alreadyAwarded) {
      return {
        success: true,
        alreadyAwarded: true,
        xpEarned: 0,
        totalXp: currentXp,
        level: currentLevel,
      }
    }

    const xpEarned = Math.max(0, xp)
    const newXp = currentXp + xpEarned
    const newLevel = Math.floor(newXp / LEVEL_XP) + 1

    // 2. Insert usage_log record storing idempotency key in name
    const logName = `${idKeyTag} ${title || action}`.slice(0, 255)
    await supabase.from('usage_logs').insert({
      user_id: userId,
      email: userEmail || '',
      name: logName,
      action,
      tokens: xpEarned,
      created_at: new Date().toISOString(),
    })

    // 3. Check and unlock achievements
    const unlockedAchievements: string[] = []
    try {
      const { data: existingAchievements } = await supabase
        .from('achievements')
        .select('achievement_type')
        .eq('user_id', userId)

      const existingTypes = new Set((existingAchievements || []).map(a => a.achievement_type))

      const milestones: Array<{
        type: string
        title: string
        description: string
        rarity: 'common' | 'rare' | 'epic' | 'legendary'
        condition: boolean
      }> = [
        {
          type: 'first_step',
          title: 'Ilk qadam',
          description: 'Birinchi huquqiy vazifani muvaffaqiyatli yakunladingiz',
          rarity: 'common',
          condition: newXp >= 10,
        },
        {
          type: 'case_solver_1',
          title: 'Kazus yechuvchi',
          description: 'Birinchi amaliy kazusni to‘liq yechdingiz',
          rarity: 'common',
          condition: action === 'case-solver' || action === 'irac',
        },
        {
          type: 'virtual_court_pioneer',
          title: 'Sud amaliyotchisi',
          description: 'Virtual sudda birinchi sud majlisini yakunladingiz',
          rarity: 'rare',
          condition: action === 'virtual-court' || action === 'court-simulation',
        },
        {
          type: 'tree_architect',
          title: 'Qarorlar strategi',
          description: 'Yuridik qarorlar daraxtini tuzdingiz',
          rarity: 'rare',
          condition: action === 'decision-tree',
        },
        {
          type: 'scenario_master',
          title: 'Senariy tahlilchisi',
          description: 'Interaktiv huquqiy senariyni muvaffaqiyatli tahlil qildingiz',
          rarity: 'rare',
          condition: action === 'scenario' || action === 'scenario-evaluation',
        },
        {
          type: 'level_5_expert',
          title: 'Huquqiy mutaxassis (Daraja 5)',
          description: '5-darajaga yetdingiz (1000+ XP)',
          rarity: 'epic',
          condition: newLevel >= 5,
        },
        {
          type: 'master_1000xp',
          title: 'Legal Master',
          description: '1000 dan ortiq XP to‘pladingiz',
          rarity: 'legendary',
          condition: newXp >= 1000,
        },
      ]

      for (const m of milestones) {
        if (m.condition && !existingTypes.has(m.type)) {
          await supabase.from('achievements').insert({
            user_id: userId,
            achievement_type: m.type,
            title: m.title,
            description: m.description,
            rarity: m.rarity,
            unlocked_at: new Date().toISOString(),
          })
          unlockedAchievements.push(m.title)

          // Yutuq bildirishnomasi
          await supabase.from('user_notifications').insert({
            user_id: userId,
            type: 'success',
            category: 'achievement',
            title: `Yangi yutuq: ${m.title}!`,
            message: m.description,
            action_url: '/statistics',
            action_text: 'Statistikani ko‘rish',
            read: false,
            created_at: new Date().toISOString(),
          })
        }
      }

      // Daraja oshganida bildirishnoma
      if (newLevel > currentLevel) {
        await supabase.from('user_notifications').insert({
          user_id: userId,
          type: 'success',
          category: 'achievement',
          title: `Daraja oshdi: ${newLevel}-daraja!`,
          message: `Tabriklaymiz! Siz ${newLevel}-darajaga ko‘tarildingiz (${newXp} XP).`,
          action_url: '/dashboard',
          action_text: 'Dashboardga o‘tish',
          read: false,
          created_at: new Date().toISOString(),
        })
      }
    } catch (achErr) {
      console.warn('Achievement check error:', achErr)
    }

    return {
      success: true,
      alreadyAwarded: false,
      xpEarned: xp,
      totalXp: newXp,
      level: newLevel,
      unlockedAchievements,
    }
  } catch (error) {
    console.error('awardUserXP fatal error:', error)
    return {
      success: false,
      alreadyAwarded: false,
      xpEarned: 0,
      totalXp: 0,
      level: 1,
    }
  }
}
