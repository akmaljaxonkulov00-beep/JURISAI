// ═══════════════════════════════════════════════════════════════════════════
// site-settings-db.ts — site_settings jadvali uchun SCHEMA-TOLERANT helper
//
// Live bazada site_settings 2 xil sxemada bo'lishi mumkin:
//   A) YANGI (key-value):  key TEXT PRIMARY KEY, value TEXT
//   B) ESKI (single-row):  id='global' qatori + kolonnalar (contact_email,
//      telegram_link, payment_card_number, ...)
//
// Migration (20260906_fix_site_settings_schema.sql) ishga tushguncha eski
// sxema ham ishlab turishi uchun barcha o'qish/yozish shu helper orqali
// bajariladi. Schema aniqlash natijasi 30 soniya cache qilinadi.
// ═══════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js'

// Eski (single-row) sxemadagi kolonna → yangi key nomi
const LEGACY_COLUMN_TO_KEY: Record<string, string> = {
  announcement_banner: 'announcement_banner',
  announcement_active: 'announcement_active',
  announcement_type: 'announcement_type',
  hero_title: 'hero_title',
  hero_subtitle: 'hero_subtitle',
  contact_email: 'contact_email',
  contact_phone: 'contact_phone',
  telegram_link: 'social_telegram',
  legal_disclaimer: 'legal_disclaimer',
  system_prompt: 'system_prompt',
  payment_card_number: 'payment_card_number',
  payment_details: 'payment_details',
}

const LEGACY_KEY_TO_COLUMN: Record<string, string> = {}
for (const [col, key] of Object.entries(LEGACY_COLUMN_TO_KEY)) {
  LEGACY_KEY_TO_COLUMN[key] = col
}

let schemaCache: { known: boolean; at: number } | null = null

/**
 * site_settings jadvalida `key` kolonnasi bor-yo'qligini aniqlaydi.
 * Natija 30 soniya cache qilinadi (migration kamdan-kam o'zgaradi).
 */
export async function hasKeyColumn(supabase: SupabaseClient): Promise<boolean> {
  if (schemaCache && Date.now() - schemaCache.at < 30_000) {
    return schemaCache.known
  }

  let known = false
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'site_settings')
      .eq('column_name', 'key')

    if (!error && Array.isArray(data)) {
      known = data.length > 0
    } else {
      // information_schema so'rovi cheklangan bo'lsa — to'g'ridan-to'g'ri proba
      const probe = await supabase.from('site_settings').select('key').limit(1)
      known = !probe.error
    }
  } catch {
    known = false
  }

  schemaCache = { known, at: Date.now() }
  return known
}

/** Bir nechta key'ni o'qiydi (har ikkala sxemada ishlaydi) */
export async function getSiteSettings(
  supabase: SupabaseClient,
  keys: string[]
): Promise<Record<string, string>> {
  const out: Record<string, string> = {}

  if (await hasKeyColumn(supabase)) {
    const { data } = await supabase.from('site_settings').select('key, value').in('key', keys)
    if (data) {
      data.forEach(row => {
        out[row.key] = row.value || ''
      })
    }
    return out
  }

  // Eski sxema: yagona qatorni o'qib, kolonnalarni key'ga aylantiramiz
  const { data } = await supabase.from('site_settings').select('*').eq('id', 'global').maybeSingle()
  if (data) {
    keys.forEach(key => {
      const col = LEGACY_KEY_TO_COLUMN[key]
      if (col && data[col] != null) out[key] = String(data[col])
    })
  }
  return out
}

export interface UpsertResult {
  error?: string
  /** Agar eski sxemada yozish imkonsiz bo'lsa — qaysi key'lar tushirib qoldirildi */
  skipped?: string[]
}

/** Bir nechta key/value yozadi (har ikkala sxemada ishlaydi) */
export async function upsertSiteSettings(
  supabase: SupabaseClient,
  entries: Array<{ key: string; value: string }>
): Promise<UpsertResult> {
  if (entries.length === 0) return {}

  if (await hasKeyColumn(supabase)) {
    const { error } = await supabase.from('site_settings').upsert(entries, {
      onConflict: 'key',
    })
    if (error) return { error: error.message }
    return {}
  }

  // Eski sxema: kolonnaga ega bo'lgan key'lar yagona qatorga yoziladi
  const patch: Record<string, unknown> = {}
  const skipped: string[] = []
  entries.forEach(entry => {
    const col = LEGACY_KEY_TO_COLUMN[entry.key]
    if (col) patch[col] = entry.value
    else skipped.push(entry.key)
  })

  if (Object.keys(patch).length === 0) {
    return {
      error:
        "Ushbu sozlama joriy (eski) site_settings sxemasida mavjud emas. Supabase SQL Editor'da 'supabase/migrations/20260906_fix_site_settings_schema.sql' migration-ni run qiling.",
      skipped,
    }
  }

  const { error } = await supabase.from('site_settings').update(patch).eq('id', 'global')
  if (error) return { error: error.message }
  return { skipped }
}

/** Logo uchun o'qish (logo_url, logo_dark_url, favicon_url) */
export async function getLogoSettings(supabase: SupabaseClient): Promise<{
  logoUrl: string | null
  logoDarkUrl: string | null
  faviconUrl: string | null
}> {
  const values = await getSiteSettings(supabase, ['logo_url', 'logo_dark_url', 'favicon_url'])
  return {
    logoUrl: values.logo_url || null,
    logoDarkUrl: values.logo_dark_url || null,
    faviconUrl: values.favicon_url || null,
  }
}
