#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  O'zbekiston Qonunchiligi — Firebase → Supabase Batch User Import
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Eski foydalanuvchilarni Supabase registered_users jadvaliga bir martalik
 * import qilish uchun skript.
 *
 * 3 ta manbadan foydalanuvchilarni yig'adi:
 *   1. JSON fayl  (--file orqali, localStorage backup)
 *   2. Supabase auth.users REST API
 *   3. Firebase Admin SDK (--firebase orqali, service account talab qiladi)
 *
 * Ishga tushirish:
 *   npm install dotenv node-fetch
 *   node scripts/batch-import-users.js --file ./users-backup.json
 *   node scripts/batch-import-users.js --supabase-auth
 *   node scripts/batch-import-users.js --file ./users.json --supabase-auth
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Config ─────────────────────────────────────────────────────────────────

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eqIdx = trimmed.indexOf('=');
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = process.env[key] || val;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const mod = urlObj.protocol === 'https:' ? https : http;
    const req = mod.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8');
          resolve({ status: res.statusCode, body, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(level, msg, data) {
  const ts = new Date().toISOString().slice(11, 19);
  const icon = level === 'OK' ? '✓' : level === 'WARN' ? '⚠' : level === 'ERR' ? '✗' : '→';
  console.log(`  [${ts}] ${icon} ${msg}`);
  if (data) console.log(`         ${JSON.stringify(data).slice(0, 200)}`);
}

// ── Supabase upsert ─────────────────────────────────────────────────────────

async function upsertUser(user) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    log('ERR', 'SUPABASE_URL yoki SERVICE_KEY topilmadi! .env.local ni tekshiring.');
    return false;
  }

  const endpoint = `${SUPABASE_URL}/rest/v1/registered_users`;
  const payload = {
    id: user.id || user.uid,
    email: user.email || '',
    name: user.name || user.displayName || (user.email || '').split('@')[0] || '',
    role: user.role || 'USER',
    subscription_plan: user.subscription_plan || user.plan || 'free',
    subscription_expires_at: user.subscription_expires_at || null,
    blocked: user.blocked || user.banned || false,
    balance: user.balance || 0,
    last_login: user.last_login || user.lastSignInTime || new Date().toISOString(),
    created_at: user.created_at || user.createdAt || user.metadata?.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetchUrl(endpoint, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 200 || res.status === 201) {
      return true;
    }

    // 409 = conflict — already exists with this id, this is fine
    if (res.status === 409) {
      return true;
    }

    log('WARN', `Upsert xatosi (${res.status}): ${payload.email}`, res.body.slice(0, 100));
    return false;
  } catch (err) {
    log('WARN', `Network xatosi: ${payload.email}`, err.message);
    return false;
  }
}

// ── Source 1: JSON file ────────────────────────────────────────────────────

async function importFromJson(filePath) {
  if (!fs.existsSync(filePath)) {
    log('ERR', `Fayl topilmadi: ${filePath}`);
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  let users;
  try {
    users = JSON.parse(raw);
  } catch {
    log('ERR', 'JSON format noto\'g\'ri');
    return [];
  }

  if (!Array.isArray(users)) {
    users = [users];
  }

  log('OK', `JSON fayldan ${users.length} ta foydalanuvchi topildi: ${filePath}`);
  return users;
}

// ── Source 2: Supabase auth.users via REST API ──────────────────────────────

async function importFromSupabaseAuth() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    log('WARN', 'Supabase sozlanmagan — auth.users dan o\'qib bo\'lmaydi');
    return [];
  }

  const users = [];
  let page = 0;
  const PAGE_SIZE = 200;

  log('→', 'Supabase auth.users dan o\'qilmoqda...');

  while (true) {
    const offset = page * PAGE_SIZE;
    const url = `${SUPABASE_URL}/rest/v1/users?select=id,email,raw_user_meta_data,created_at,last_sign_in_at,banned_until&limit=${PAGE_SIZE}&offset=${offset}`;

    try {
      const res = await fetchUrl(url, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Accept-Profile': 'auth',
          'Content-Type': 'application/json',
        },
      });

      if (res.status !== 200) {
        if (page === 0) log('WARN', `auth.users ${res.status}: ${res.body.slice(0, 200)}`);
        break;
      }

      const batch = JSON.parse(res.body);
      if (!Array.isArray(batch) || batch.length === 0) break;

      for (const u of batch) {
        users.push({
          id: u.id,
          email: u.email || '',
          name: u.raw_user_meta_data?.name || (u.email || '').split('@')[0] || '',
          role: u.raw_user_meta_data?.role || 'USER',
          subscription_plan: u.raw_user_meta_data?.subscription_plan || 'free',
          blocked: !!u.banned_until,
          last_login: u.last_sign_in_at || u.created_at,
          created_at: u.created_at,
        });
      }

      page++;
      if (batch.length < PAGE_SIZE) break;
    } catch (err) {
      log('WARN', 'auth.users o\'qish xatosi:', err.message);
      break;
    }
  }

  log('OK', `auth.users dan ${users.length} ta foydalanuvchi topildi`);
  return users;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const jsonFile = args.find((a) => a.startsWith('--file='))?.split('=')[1];
  const useSupabaseAuth = args.includes('--supabase-auth');
  const useFirebaseAdmin = args.includes('--firebase');
  const help = args.includes('--help') || args.includes('-h');

  console.log();
  console.log('  ═══════════════════════════════════════════════════════════════');
  console.log('    Firebase → Supabase — Batch User Import');
  console.log('  ═══════════════════════════════════════════════════════════════');
  console.log();

  if (help || args.length === 0) {
    console.log('  Foydalanish:');
    console.log();
    console.log('    Fayldan import:');
    console.log('      node scripts/batch-import-users.js --file=./users.json');
    console.log();
    console.log('    localStorage backup formatidagi fayl:');
    console.log('      node scripts/batch-import-users.js --file=./registered_users_backup.json');
    console.log();
    console.log('    Supabase auth.users dan import:');
    console.log('      node scripts/batch-import-users.js --supabase-auth');
    console.log();
    console.log('    Firebase Admin SDK orqali (service account kerak):');
    console.log('      node scripts/batch-import-users.js --firebase=./service-account.json');
    console.log();
    console.log('    Barcha manbalarni birlashtirish:');
    console.log('      node scripts/batch-import-users.js --file=./users.json --supabase-auth');
    console.log();
    console.log('  JSON format:');
    console.log('    [{');
    console.log('      "id": "firebase-uid-123",');
    console.log('      "email": "user@example.com",');
    console.log('      "name": "Foydalanuvchi Ismi",');
    console.log('      "role": "USER",');
    console.log('      "subscription_plan": "free"');
    console.log('    }]');
    console.log();
    return;
  }

  // Validate Supabase credentials
  if (!SUPABASE_URL || !SERVICE_KEY) {
    log('ERR', 'Supabase sozlamalari topilmadi!');
    log('→', '.env.local faylida quyidagilar borligini tekshiring:');
    log('→', '  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    log('→', '  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.log();
    return;
  }

  // Collect users from all sources
  const allUsers = [];
  const seenIds = new Set();

  async function addUsers(users, source) {
    let count = 0;
    for (const u of users) {
      const uid = u.id || u.uid;
      if (!uid || !u.email) continue;
      if (seenIds.has(uid)) continue;
      seenIds.add(uid);
      allUsers.push(u);
      count++;
    }
    if (count > 0) log('OK', `${source}: ${count} ta yangi foydalanuvchi qo'shildi`);
  }

  // Source 1: JSON file
  if (jsonFile) {
    const users = await importFromJson(jsonFile);
    if (users.length > 0) {
      // Try localStorage format first
      const formatted = users.map((u) => ({
        id: u.id || u.uid,
        email: u.email || u.user_email || '',
        name: u.name || u.displayName || u.user_name || '',
        role: u.role || u.user_role || 'USER',
        subscription_plan: u.subscription_plan || u.plan || 'free',
        subscription_expires_at: u.subscription_expires_at || '',
        blocked: u.blocked || false,
        balance: u.balance || 0,
        last_login: u.last_login || u.lastSignInTime || '',
        created_at: u.created_at || u.createdAt || u.metadata?.createdAt || '',
      }));
      await addUsers(formatted, 'JSON fayl');
    }
  }

  // Source 2: Supabase auth.users
  if (useSupabaseAuth) {
    const users = await importFromSupabaseAuth();
    if (users.length > 0) {
      await addUsers(users, 'Supabase auth.users');
    }
  }

  // Source 3: Firebase Admin SDK (optional, needs firebase-admin package + service account)
  if (useFirebaseAdmin) {
    const saFile = typeof useFirebaseAdmin === 'string' ? useFirebaseAdmin : null;
    if (saFile && fs.existsSync(saFile)) {
      log('→', `Firebase Admin SDK orqali o'qilmoqda: ${saFile}`);
      try {
        // Try to require firebase-admin (may not be installed)
        let admin;
        try {
          admin = require('firebase-admin');
        } catch {
          log('ERR', 'firebase-admin paketi o\'rnatilmagan. npm install firebase-admin');
          process.exit(1);
        }

        const serviceAccount = JSON.parse(fs.readFileSync(saFile, 'utf-8'));
        if (!admin.apps.length) {
          admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }

        const firebaseUsers = [];
        let nextPageToken;

        do {
          const result = await admin.auth().listUsers(1000, nextPageToken);
          for (const u of result.users) {
            firebaseUsers.push({
              id: u.uid,
              email: u.email || '',
              name: u.displayName || u.email?.split('@')[0] || '',
              role: u.customClaims?.role || 'USER',
              subscription_plan: u.customClaims?.subscription_plan || 'free',
              blocked: u.disabled || false,
              last_login: u.metadata?.lastSignInTime || u.metadata?.creationTime,
              created_at: u.metadata?.creationTime,
            });
          }
          nextPageToken = result.pageToken;
        } while (nextPageToken);

        await addUsers(firebaseUsers, 'Firebase Admin SDK');
      } catch (err) {
        log('ERR', `Firebase Admin SDK xatosi: ${err.message}`);
      }
    } else {
      log('ERR', `Service account fayli topilmadi: ${saFile || 'kerakli fayl ko\'rsatilmagan'}`);
    }
  }

  // Final summary
  console.log();
  console.log('  ═══════════════════════════════════════════════════════════════');

  if (allUsers.length === 0) {
    log('WARN', 'Hech qanday foydalanuvchi topilmadi!');
    console.log();
    console.log('  Tavsiya:');
    console.log('    1. localStorage backup yarating:');
    console.log('       Brauzer konsolida: copy(JSON.stringify(JSON.parse(localStorage.getItem(\'registered_users\') || \'[]\')))');
    console.log('       So\'ng faylga saqlang va --file bilan ishga tushiring');
    console.log('    2. Supabase auth.users dan import qilish uchun --supabase-auth ishlating');
    console.log('    3. Firebase Admin SDK uchun --firebase=./service-account.json');
    console.log();
    return;
  }

  log('→', `Jami ${allUsers.length} ta foydalanuvchi import qilinmoqda...`);
  console.log();

  // Import to Supabase
  let success = 0;
  let failed = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
    const batch = allUsers.slice(i, i + BATCH_SIZE);
    const promises = batch.map((u) => upsertUser(u));
    const results = await Promise.all(promises);

    for (const ok of results) {
      if (ok) success++;
      else failed++;
    }

    const pct = Math.round(((i + batch.length) / allUsers.length) * 100);
    process.stdout.write(`\r  ${pct}% | ${success} ta muvaffaqiyatli, ${failed} ta xato`);
    await sleep(100); // Rate limiting
  }

  console.log();
  console.log();
  log('OK', `Import tugadi!`);
  log('→', `${success} ta foydalanuvchi import qilindi`);
  if (failed > 0) log('WARN', `${failed} ta foydalanuvchida xato yuz berdi`);
  console.log();
  console.log('  ═══════════════════════════════════════════════════════════════');
  console.log();

  // Print registered users count after import
  try {
    const res = await fetchUrl(`${SUPABASE_URL}/rest/v1/registered_users?select=id`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    if (res.status === 200) {
      const existing = JSON.parse(res.body);
      log('OK', `Supabase registered_users da jami: ${existing.length} ta foydalanuvchi`);
    }
  } catch {}
}

main().catch((err) => {
  console.error('  ✗ Umumiy xatolik:', err.message);
  process.exit(1);
});
