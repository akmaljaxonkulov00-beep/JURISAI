import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const supabase = getSupabaseAdmin()

    // Collect all data in parallel
    const [
      userRes,
      prefRes,
      notifRes,
      treesRes,
      toolsRes,
      paymentsRes,
      iracRes,
      achieveRes,
      usageRes,
    ] = await Promise.all([
      supabase.from('registered_users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('decision_trees').select('*').eq('user_id', userId),
      supabase.from('tool_history').select('*').eq('user_id', userId),
      supabase.from('payment_requests').select('*').eq('user_id', userId),
      supabase.from('irac_cases').select('*').eq('user_id', userId),
      supabase.from('achievements').select('*').eq('user_id', userId),
      supabase.from('usage_logs').select('*').eq('user_id', userId).limit(500),
    ])

    const exportBundle = {
      exportMetadata: {
        platform: 'JURISTIV LegalTech Platform',
        version: '4.3.1',
        exportedAt: new Date().toISOString(),
        userId,
        accountEmail: auth.user.email,
        jurisdiction: "O'zbekiston Respublikasi",
      },
      profile: userRes.data || {
        id: userId,
        email: auth.user.email,
        name: auth.user.email.split('@')[0],
      },
      preferences: {
        system: prefRes.data || { theme: 'system', language: 'uz', timezone: 'Asia/Tashkent' },
        notifications: notifRes.data || {},
      },
      decisionTrees: treesRes.data || [],
      professionalToolsHistory: toolsRes.data || [],
      payments: paymentsRes.data || [],
      iracCases: iracRes.data || [],
      achievements: achieveRes.data || [],
      activityLogsSummary: {
        totalActionsCount: usageRes.data?.length || 0,
        recentLogs: usageRes.data || [],
      },
    }

    const filename = `juristiv-account-data-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Data export error:', err)
    return NextResponse.json(
      { success: false, error: 'Ma’lumotlarni eksport qilishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
