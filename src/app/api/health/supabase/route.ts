import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    databaseConnection: 'unknown',
    tables: {},
    latencyMs: 0,
    status: 'healthy',
  }

  try {
    const admin = getSupabaseAdmin()

    // 1. Probe registered_users
    const t0 = Date.now()
    const { count: usersCount, error: usersErr } = await admin
      .from('registered_users')
      .select('id', { count: 'exact', head: true })

    diagnostics.tables.registered_users = usersErr
      ? { ok: false, error: usersErr.message }
      : { ok: true, count: usersCount }

    // 2. Probe court_sessions
    const { count: courtsCount, error: courtsErr } = await admin
      .from('court_sessions')
      .select('id', { count: 'exact', head: true })

    diagnostics.tables.court_sessions = courtsErr
      ? { ok: false, error: courtsErr.message }
      : { ok: true, count: courtsCount }

    // 3. Probe usage_logs
    const { count: usageCount, error: usageErr } = await admin
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })

    diagnostics.tables.usage_logs = usageErr
      ? { ok: false, error: usageErr.message }
      : { ok: true, count: usageCount }

    // 4. Probe achievements
    const { count: achCount, error: achErr } = await admin
      .from('achievements')
      .select('id', { count: 'exact', head: true })

    diagnostics.tables.achievements = achErr
      ? { ok: false, error: achErr.message }
      : { ok: true, count: achCount }

    diagnostics.latencyMs = Date.now() - t0
    diagnostics.databaseConnection =
      usersErr || courtsErr || usageErr ? 'degraded' : 'connected'

    if (diagnostics.databaseConnection === 'degraded') {
      diagnostics.status = 'warning'
    }

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (err: any) {
    diagnostics.databaseConnection = 'failed'
    diagnostics.status = 'unhealthy'
    diagnostics.error = err.message || 'Supabase connection failure'
    diagnostics.latencyMs = Date.now() - startTime
    return NextResponse.json(diagnostics, { status: 500 })
  }
}
