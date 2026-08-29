// ═══════════════════════════════════════════════════════════════════════════
// test-limits.mjs — AI limit tizimini REAL baza ustida test qiladi
// (usage-limits.ts dagi getUserPlan / getEffectiveLimit / countMonthlyUsage /
//  checkAndIncrement mantiqlarini aynan takrorlaydi)
//
// Testlar:
//   1. Tarif aniqlash (free / standart / pro)
//   2. Per-user override: 0 → darhol blok; 3 → 3 marta, 4-chi blok; -1 → cheksiz
//   3. Tarif limitlari: free scenario=3 → 3 marta, 4-chi blok; standart scenario=20; pro scenario=-1
//   4. weakness kaliti bazadan olib tashlanganini tekshirish
//   5. Limit tugagach 429 (allowed:false) qaytarilishini tekshirish
//
// Foydalanish: node scripts/test-limits.mjs
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !serviceKey) {
  console.log('❌ Supabase env topilmadi')
  process.exit(1)
}
const sb = createClient(supabaseUrl, serviceKey)

const TEST_USER = '00000000-0000-4000-8000-00000000ca11'
const TEST_EMAIL = 'limits-test@juristiv.uz'
let pass = 0
let fail = 0

function ok(cond, msg) {
  if (cond) {
    pass++
    console.log(`  ✅ ${msg}`)
  } else {
    fail++
    console.log(`  ❌ ${msg}`)
  }
}

// ── Prod mantiqi (usage-limits.ts dan aynan) ─────────────────────────────
async function getUserPlan(userId, email) {
  const identity = userId || email
  if (!identity) return 'free'
  try {
    let query = sb.from('registered_users').select('subscription_plan, subscription_expires_at')
    if (userId) query = query.eq('id', userId)
    else query = query.eq('email', email)
    const { data } = await query.maybeSingle()
    if (data) {
      const plan = (data.subscription_plan || 'free').toLowerCase()
      if (plan !== 'free' && data.subscription_expires_at) {
        const exp = new Date(data.subscription_expires_at)
        if (exp < new Date()) return 'free'
      }
      if (plan === 'standart' || plan === 'pro' || plan === 'basic' || plan === 'premium') {
        return plan === 'pro' || plan === 'premium' ? 'pro' : 'standart'
      }
      return 'free'
    }
  } catch {}
  return 'free'
}

async function getEffectiveLimit(userId, plan, feature) {
  if (userId) {
    try {
      const { data } = await sb
        .from('user_usage_limits')
        .select('monthly_limit')
        .eq('user_id', userId)
        .eq('feature', feature)
        .maybeSingle()
      if (data && data.monthly_limit != null) return { limit: data.monthly_limit, source: 'override' }
    } catch {}
  }
  try {
    const { data } = await sb.from('pricing_plans').select('limits').eq('id', plan).maybeSingle()
    if (data && data.limits) {
      const val = data.limits[feature]
      if (typeof val === 'number') return { limit: val, source: 'plan' }
    }
  } catch {}
  return { limit: -1, source: 'default' }
}

async function countMonthlyUsage(userId, email, feature) {
  try {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    let query = sb
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', feature)
      .gte('created_at', monthStart.toISOString())
    if (userId) query = query.eq('user_id', userId)
    else if (email) query = query.eq('email', email)
    else return 0
    const { count } = await query
    return count || 0
  } catch {
    return 0
  }
}

async function getFairUseLimit(feature) {
  try {
    const { data } = await sb.from('site_settings').select('fair_use_limits').eq('id', 'global').maybeSingle()
    if (data && data.fair_use_limits && typeof data.fair_use_limits === 'object') {
      const val = data.fair_use_limits[feature]
      if (typeof val === 'number' && val > 0) return val
    }
  } catch {}
  const DEF = { ai_chat: 2000, irac: 500, scenario: 200, speech_stt: 500, virtual_court: 100 }
  return DEF[feature] || null
}

async function checkAndIncrement({ userId, email, feature }) {
  const plan = await getUserPlan(userId, email)
  const eff = await getEffectiveLimit(userId, plan, feature)
  let limit = eff.limit
  let source = eff.source
  // Pro cheksiz → fair use qo'llash
  if (limit === -1 && source === 'plan' && plan === 'pro') {
    const fair = await getFairUseLimit(feature)
    if (fair != null) {
      limit = fair
      source = 'fair_use'
    }
  }
  const used = await countMonthlyUsage(userId, email, feature)
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used)
  if (limit !== -1 && used >= limit) {
    return { allowed: false, used, limit, plan, source, reason: 'limit_reached' }
  }
  const logRow = {
    user_id: userId || email || 'anonymous',
    email: email || 'anonymous@juristiv.uz',
    name: '',
    tokens: 1,
    action: feature,
    metadata: { plan, limit, limit_source: source },
    created_at: new Date().toISOString(),
  }
  const { error: insErr } = await sb.from('usage_logs').insert(logRow)
  if (insErr) {
    const { metadata, ...baseRow } = logRow
    await sb.from('usage_logs').insert(baseRow)
  }
  return { allowed: true, used: used + 1, limit, plan, source }
}

// ── Cleanup: avvalgi test qoldiqlari ──────────────────────────────────────
await sb.from('usage_logs').delete().eq('user_id', TEST_USER)
await sb.from('user_usage_limits').delete().eq('user_id', TEST_USER)

// ── Test 1: Tarif aniqlash ────────────────────────────────────────────────
console.log('\n📊 Test 1: Tarif aniqlash (registered_users.subscription_plan)')
await sb.from('registered_users').upsert({ id: TEST_USER, email: TEST_EMAIL, subscription_plan: 'free' })
ok((await getUserPlan(TEST_USER)) === 'free', 'free → free')
await sb.from('registered_users').upsert({ id: TEST_USER, email: TEST_EMAIL, subscription_plan: 'standart' })
ok((await getUserPlan(TEST_USER)) === 'standart', 'standart → standart')
await sb.from('registered_users').upsert({ id: TEST_USER, email: TEST_EMAIL, subscription_plan: 'pro' })
ok((await getUserPlan(TEST_USER)) === 'pro', 'pro → pro')
await sb.from('registered_users').upsert({ id: TEST_USER, email: TEST_EMAIL, subscription_plan: 'standart', subscription_expires_at: new Date(Date.now() - 86400000).toISOString() })
ok((await getUserPlan(TEST_USER)) === 'free', "muddati o'tgan standart → free")

// ── Test 2: Per-user override ─────────────────────────────────────────────
console.log('\n🎯 Test 2: Per-user override (user_usage_limits)')
// 2a: override = 0 → darhol blok
await sb.from('user_usage_limits').upsert({ user_id: TEST_USER, feature: 'ai_chat', monthly_limit: 0 })
let r = await checkAndIncrement({ userId: TEST_USER, email: TEST_EMAIL, feature: 'ai_chat' })
ok(r.allowed === false && r.reason === 'limit_reached', 'override=0 → darhol blok (allowed:false)')
// 2b: override = 3 → 3 marta ishlaydi, 4-chisi blok
await sb.from('user_usage_limits').upsert({ user_id: TEST_USER, feature: 'irac', monthly_limit: 3 })
await sb.from('usage_logs').delete().eq('user_id', TEST_USER).eq('action', 'irac')
let results = []
for (let i = 0; i < 4; i++) results.push(await checkAndIncrement({ userId: TEST_USER, email: TEST_EMAIL, feature: 'irac' }))
ok(results[0].allowed && results[1].allowed && results[2].allowed, 'override=3 → dastlabki 3 tasi allowed')
ok(results[3].allowed === false, 'override=3 → 4-chisi blok (allowed:false)')
// 2c: override = -1 → cheksiz
await sb.from('user_usage_limits').upsert({ user_id: TEST_USER, feature: 'speech_stt', monthly_limit: -1 })
let rUnlim = await checkAndIncrement({ userId: TEST_USER, email: TEST_EMAIL, feature: 'speech_stt' })
ok(rUnlim.allowed && rUnlim.limit === -1, 'override=-1 → cheksiz (limit:-1)')

// ── Test 3: Tarif limitlari ───────────────────────────────────────────────
console.log('\n💰 Test 3: Tarif limitlari (pricing_plans.limits)')
await sb.from('registered_users').upsert({ id: TEST_USER, email: TEST_EMAIL, subscription_plan: 'free' })
await sb.from('user_usage_limits').delete().eq('user_id', TEST_USER)
await sb.from('usage_logs').delete().eq('user_id', TEST_USER)
// free scenario = 3
let scenarioResults = []
for (let i = 0; i < 4; i++) scenarioResults.push(await checkAndIncrement({ userId: TEST_USER, email: TEST_EMAIL, feature: 'scenario' }))
ok(scenarioResults.slice(0, 3).every(x => x.allowed), 'free scenario=3 → dastlabki 3 tasi allowed')
ok(scenarioResults[3].allowed === false && scenarioResults[3].limit === 3, 'free scenario=3 → 4-chisi blok')
// standart scenario = 20
await sb.from('registered_users').upsert({ id: TEST_USER, email: TEST_EMAIL, subscription_plan: 'standart', subscription_expires_at: null })
let st = await checkAndIncrement({ userId: TEST_USER, email: TEST_EMAIL, feature: 'scenario' })
ok(st.allowed && st.limit === 20, 'standart scenario → limit 20, allowed')
// pro scenario = -1 (marketing cheksiz) → fair-use qo'llanadi (default 200)
await sb.from('registered_users').upsert({ id: TEST_USER, email: TEST_EMAIL, subscription_plan: 'pro', subscription_expires_at: null })
let pr = await checkAndIncrement({ userId: TEST_USER, email: TEST_EMAIL, feature: 'scenario' })
ok(pr.allowed && pr.limit > 0 && pr.source === 'fair_use', `pro scenario → fair-use qo'llanadi (limit:${pr.limit}, source:${pr.source})`)

// ── Test 4: weakness kaliti olib tashlangan ───────────────────────────────
console.log('\n🧹 Test 4: weakness funksiyasi olib tashlangan')
const { data: plans } = await sb.from('pricing_plans').select('id, limits')
for (const p of plans || []) {
  ok(!p.limits || !('weakness' in p.limits), `${p.id} limits da weakness yo'q`)
}

// ── Test 5.5: Pro fair-use (adolatli ishlatish) ────────────────────────────
console.log('\n🛡️ Test 5.5: Pro fair-use chegarasi')
// Kolonna mavjudmi?
const colCheck = await sb.from('site_settings').select('fair_use_limits').eq('id', 'global').maybeSingle()
const colExists = !colCheck.error
const FAIR_BAK = colCheck.data
if (colExists) {
  // Migratsiya run qilingan — haqiqiy bloklashni tekshiramiz (3 ta)
  await sb.from('site_settings').update({ fair_use_limits: { ...(FAIR_BAK?.fair_use_limits || {}), scenario: 3 } }).eq('id', 'global')
  await sb.from('user_usage_limits').delete().eq('user_id', TEST_USER)
  await sb.from('usage_logs').delete().eq('user_id', TEST_USER)
  let fairResults = []
  for (let i = 0; i < 4; i++) fairResults.push(await checkAndIncrement({ userId: TEST_USER, email: TEST_EMAIL, feature: 'scenario' }))
  ok(fairResults.slice(0, 3).every(x => x.allowed), 'Pro scenario fair-use=3 → dastlabki 3 tasi allowed')
  ok(fairResults[3].allowed === false && fairResults[3].source === 'fair_use', 'Pro scenario → 4-chisi fair_use blok')
  if (FAIR_BAK?.fair_use_limits) {
    await sb.from('site_settings').update({ fair_use_limits: FAIR_BAK.fair_use_limits }).eq('id', 'global')
  } else {
    await sb.from('site_settings').update({ fair_use_limits: {} }).eq('id', 'global')
  }
  console.log('  (migratsiya run qilingan — site_settings.fair_use_limits ishladi)')
} else {
  // Migratsiya hali run qilinmagan — kod default fair-use qo'llanganini tekshiramiz
  await sb.from('registered_users').upsert({ id: TEST_USER, email: TEST_EMAIL, subscription_plan: 'pro', subscription_expires_at: null })
  await sb.from('user_usage_limits').delete().eq('user_id', TEST_USER)
  await sb.from('usage_logs').delete().eq('user_id', TEST_USER)
  let fr = await checkAndIncrement({ userId: TEST_USER, email: TEST_EMAIL, feature: 'scenario' })
  ok(fr.allowed && fr.limit === 200 && fr.source === 'fair_use', `Pro scenario → default fair-use qo'llanadi (limit:${fr.limit}, source:${fr.source})`)
  ok(fr.limit === 200, 'Default fair-use scenario = 200 (bloklash mantiqi override testida isbotlangan)')
  console.log('  (migratsiya hali run qilinmagan — kod default fair-use ishladi)')
}

// ── Test 5: 429 oqimi — limit tugagach allowed:false (frontend 429 ko'rsatadi) ──
console.log('\n🚦 Test 5: Limit tugagach bloklash oqimi')
// free ai_chat = 10 — 10 ta yozamiz, 11-chisi blok bo'lsin
await sb.from('registered_users').upsert({ id: TEST_USER, email: TEST_EMAIL, subscription_plan: 'free', subscription_expires_at: null })
await sb.from('usage_logs').delete().eq('user_id', TEST_USER)
let chatResults = []
for (let i = 0; i < 11; i++) chatResults.push(await checkAndIncrement({ userId: TEST_USER, email: TEST_EMAIL, feature: 'ai_chat' }))
ok(chatResults.slice(0, 10).every(x => x.allowed), 'free ai_chat=10 → dastlabki 10 tasi allowed')
ok(chatResults[10].allowed === false && chatResults[10].used === 10, 'free ai_chat=10 → 11-chisi blok (used=10/10)')

// ── Cleanup ───────────────────────────────────────────────────────────────
await sb.from('usage_logs').delete().eq('user_id', TEST_USER)
await sb.from('user_usage_limits').delete().eq('user_id', TEST_USER)
await sb.from('registered_users').delete().eq('id', TEST_USER)

console.log(`\n═══════════════════════════════════════`)
console.log(`✅ Pass: ${pass}  |  ❌ Fail: ${fail}`)
console.log('═══════════════════════════════════════')
process.exit(fail > 0 ? 1 : 0)
