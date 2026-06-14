# 🔧 JURISAI - MUAMMOLARNI HAL QILISH

> Keng tarqalgan muammolar va ularning yechimlari

## 📋 MUNDARIJA

1. [O'rnatish Muammolari](#ornatish-muammolari)
2. [Development Muammolari](#development-muammolari)
3. [Build Muammolari](#build-muammolari)
4. [API Muammolari](#api-muammolari)
5. [Performance Muammolari](#performance-muammolari)
6. [Browser Muammolari](#browser-muammolari)

---

## 🚀 O'RNATISH MUAMMOLARI

### Muammo 1: npm install xatosi

**Xatolik:**
```
npm ERR! code ENOENT
npm ERR! syscall open
```

**Yechim:**

```bash
# 1. npm cache tozalash
npm cache clean --force

# 2. node_modules o'chirish
rd /s /q node_modules
del package-lock.json

# 3. Qayta o'rnatish
npm install
```

### Muammo 2: Node versiya xatosi

**Xatolik:**
```
error: The engine "node" is incompatible
```

**Yechim:**

```bash
# Node versiyani tekshirish
node --version

# Node 18+ kerak
# Yangilash: https://nodejs.org/en/download/
```

### Muammo 3: Python dependency xatosi

**Xatolik:**
```
gyp ERR! find Python
```

**Yechim:**

Windows:
```bash
npm config set python python3
```

Yoki Python 3.9+ o'rnating: https://www.python.org/downloads/

---

## 💻 DEVELOPMENT MUAMMOLARI

### Muammo 1: Port band

**Xatolik:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Yechim 1 - Boshqa port:**
```bash
PORT=3001 npm run dev
```

**Yechim 2 - Portni bo'shatish:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### Muammo 2: Hot reload ishlamaydi

**Yechim:**

```bash
# 1. Server to'xtatish (Ctrl+C)
# 2. .next o'chirish
npm run clean:cache

# 3. Qayta ishga tushirish
npm run dev
```

### Muammo 3: TypeScript xatolar

**Xatolik:**
```
Type error: Cannot find module
```

**Yechim:**

```bash
# 1. Tekshirish
npm run type-check

# 2. node_modules ni qayta o'rnatish
npm run reinstall
```

---

## 🏗️ BUILD MUAMMOLARI

### Muammo 1: Build memory xatosi

**Xatolik:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Yechim:**

```bash
# Memory limitni oshirish
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

### Muammo 2: Build vaqti juda uzoq

**Yechim:**

```bash
# 1. Cache tozalash
npm run clean:cache

# 2. Parallel build
npm run build
```

### Muammo 3: Static export xatosi

**Xatolik:**
```
Error: Dynamic API usage
```

**Yechim:**

API routelar dynamic, static export mumkin emas. Serverless deployment ishlatish kerak (Vercel, Netlify).

---

## 🤖 API MUAMMOLARI

### Muammo 1: Groq API 401 xatosi

**Xatolik:**
```
Error: 401 Unauthorized
```

**Yechim:**

```bash
# 1. .env.local faylini tekshirish
cat .env.local  # Mac/Linux
type .env.local  # Windows

# 2. API key to'g'rimi tekshirish
npm run test:groq

# 3. Yangi API key olish
# https://console.groq.com/keys
```

### Muammo 2: Groq API 400 xatosi

**Xatolik:**
```
Error: 400 Bad Request - Invalid model
```

**Yechim:**

Model nomini tekshiring. To'g'ri model: `llama-3.1-8b-instant`

```typescript
// src/lib/ai-client.ts
model: 'llama-3.1-8b-instant' // To'g'ri
```

### Muammo 3: Groq API 429 xatosi

**Xatolik:**
```
Error: 429 Too Many Requests
```

**Yechim:**

Rate limit, biroz kutish kerak. Yoki:

```typescript
// Retry logic qo'shish
async function callWithRetry(fn, retries = 3) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.status === 429) {
      await new Promise(r => setTimeout(r, 2000));
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
}
```

### Muammo 4: CORS xatosi

**Xatolik:**
```
Access to fetch blocked by CORS policy
```

**Yechim:**

API route'lar Next.js API orqali, CORS muammo bo'lmasligi kerak. Agar bo'lsa:

```typescript
// src/app/api/*/route.ts
export async function GET(request: NextRequest) {
  const response = NextResponse.json({...});
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
```

---

## ⚡ PERFORMANCE MUAMMOLARI

### Muammo 1: Sekin yuklash

**Yechim:**

```bash
# 1. Production build
npm run build
npm run start

# 2. Image optimization
# next.config.js
images: {
  domains: ['your-domain.com'],
  formats: ['image/webp']
}

# 3. Bundle analyzer
npm install --save-dev @next/bundle-analyzer
```

### Muammo 2: localStorage to'lib ketish

**Yechim:**

```javascript
// localStorage limiti: ~5-10MB

// Tozalash funksiyasi
function cleanOldData() {
  const keys = ['irac_history', 'court_sim_history', 'scenario_history'];
  
  keys.forEach(key => {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    // Faqat oxirgi 50 tani saqlash
    if (data.length > 50) {
      localStorage.setItem(key, JSON.stringify(data.slice(-50)));
    }
  });
}

// Har safar chaqirish
cleanOldData();
```

### Muammo 3: AI response sekin

**Yechim:**

```typescript
// 1. Kamroq token ishlatish
max_tokens: 500  // 2000 o'rniga

// 2. Tezroq model
model: 'llama-3.1-8b-instant'  // 70b o'rniga

// 3. Caching
const cache = new Map();
const cacheKey = `${prompt}_${systemPrompt}`;
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

---

## 🌐 BROWSER MUAMMOLARI

### Muammo 1: localStorage ishlamaydi

**Yechim:**

```javascript
// Incognito mode'da ishlamasligi mumkin
// Tekshirish:
function isLocalStorageAvailable() {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch {
    return false;
  }
}

if (!isLocalStorageAvailable()) {
  alert('localStorage ishlamayapti. Normal mode ishlatish kerak.');
}
```

### Muammo 2: Cookie xatosi

**Yechim:**

```bash
# Browser cookies yoqilganligini tekshirish
# Settings → Privacy → Cookies
```

### Muammo 3: Layout buzilgan

**Yechim:**

```bash
# 1. Cache tozalash
Ctrl+Shift+R  # Hard reload

# 2. Browser cache tozalash
# Settings → Privacy → Clear browsing data

# 3. Boshqa brauzerni sinab ko'rish
```

---

## 🔍 DEBUG QILISH

### Browser DevTools

```javascript
// Console'da tekshirish

// 1. localStorage
console.log('IRAC History:', localStorage.getItem('irac_history'));
console.log('Profile:', localStorage.getItem('user_profile'));

// 2. API calls
// Network tab → Fetch/XHR

// 3. Errors
// Console tab → Errors
```

### Next.js Debug

```bash
# Debug mode
NODE_OPTIONS='--inspect' npm run dev

# Chrome'da: chrome://inspect
```

### API Debug

```javascript
// src/lib/ai-client.ts
console.log('Sending request:', { prompt, model });

try {
  const response = await fetch(...);
  console.log('Response status:', response.status);
  const data = await response.json();
  console.log('Response data:', data);
} catch (error) {
  console.error('Error:', error);
}
```

---

## 📊 LOG FAYLLAR

### Next.js logs

```bash
# Development
# Console'da ko'rsatiladi

# Production
npm run start > logs.txt 2>&1
```

### Browser logs

```javascript
// Barcha loglarni saqlash
console.save = function(data, filename) {
  const blob = new Blob([JSON.stringify(data)], {type: 'text/plain'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// Ishlatish
console.save(localStorage, 'localstorage.json');
```

---

## 🆘 YORDAM OLISH

### 1. Dokumentatsiya

- [README_UZBEK.md](./README_UZBEK.md)
- [QUICK_START.md](./QUICK_START.md)
- [COMPLETE_FINAL_SUMMARY.md](./COMPLETE_FINAL_SUMMARY.md)

### 2. Community

- **GitHub Issues:** Muammolarni raport qilish
- **Telegram:** @jurisai_support
- **Email:** support@jurisai.uz

### 3. Muammoni raport qilish

Issue yaratishda quyidagilarni kiriting:

```markdown
## Muammo tavsifi
[Muammoni batafsil yozing]

## Qadam qadam qayta yaratish
1. ...
2. ...

## Kutilgan natija
[Nima bo'lishi kerak edi]

## Haqiqiy natija
[Nima bo'ldi]

## Environment
- OS: [Windows 11 / Mac / Linux]
- Node: [18.17.0]
- Browser: [Chrome 120]
- Package version: [4.0.0]

## Screenshots
[Agar bo'lsa]

## Logs
[Console logs / Error messages]
```

---

## ✅ TEKSHIRISH RO'YXATI

Muammo yuzaga kelganda quyidagilarni tekshiring:

- [ ] Node.js 18+ o'rnatilganmi?
- [ ] npm install bajarilganmi?
- [ ] .env.local fayli mavjudmi?
- [ ] GROQ_API_KEY to'g'rimi?
- [ ] Internet connection bormi?
- [ ] Port band emasmi?
- [ ] Browser cookies yoqilganmi?
- [ ] localStorage ishlaydimi?
- [ ] Cache tozami?
- [ ] Oxirgi versiya ishlatilmoqdami?

---

**Agar muammo hal bo'lmasa, bizga murojaat qiling!**

**Support:** support@jurisai.uz  
**Version:** 4.0.0  
**Last Updated:** 2024-06-14
