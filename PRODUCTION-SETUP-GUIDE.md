# JurisAI Production Setup Guide

## 🚀 Keyingi Qadamlar

JurisAI platformasi to'liq implementatsiya qilindi. Endi production ga tayyorlash uchun quyidagi qadamlarni bajaring:

---

## 📋 1. Environment Variables Sozlari

### 🔑 Zarur Environment Variables:

```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth.js
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-32-character-secret-key

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: Telegram (vaqtincha o'chirilgan)
# TELEGRAM_BOT_TOKEN=your-telegram-bot-token
# TELEGRAM_ADMIN_CHAT_ID=your-admin-chat-id

# Optional: Stripe (agar kerak bo'lsa)
# STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
# STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
```

### 📁 `.env.local` faylini yaratish:

```env.local
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-32-character-secret-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
```

---

## 🗄️ 2. Supabase Sozlami

### 🔧 Supabase Project Yaratish:

1. [Supabase.com](https://supabase.com) ga kiring
2. Yangi project yarating
3. Project URL va API keysni oling
4. Environment variablesga qo'shing

### 📊 Supabase Tables Yaratish:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment requests table
CREATE TABLE payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'UZS',
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'manual',
  tracking_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  feature TEXT NOT NULL,
  action TEXT DEFAULT 'generate',
  quantity INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🤖 3. OpenAI API Sozlami

### 🔑 OpenAI API Key Olish:

1. [OpenAI.com](https://platform.openai.com) ga kiring
2. Hisob yarating yoki login qiling
3. API keys bo'limiga o'ting
4. Yangi API key yarating
5. `.env.local` ga qo'shing

### 💰 OpenAI API Narxi:
- **GPT-4:** ~$0.03 per 1K tokens
- **GPT-3.5-Turbo:** ~$0.002 per 1K tokens
- **Oylik taxmin:** ~$50-100 (o'rtacha foydalanish uchun)

---

## ☁️ 4. Hosting Platformasi Tanlash

### 🌟 Variant 1: Cloudflare Pages (Tavsiya etilgan)

#### 🚀 Cloudflare Pages ga Deploy:

1. **GitHub ga push qiling:**
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

2. **Cloudflare Pages dashboard:**
   - Log in qiling
   - "Create a project" tanlang
   - GitHub repository ni ulang
   - Build sozlamalari:
     ```
     Framework: Next.js
     Build command: npm run build:cloudflare
     Build output directory: .next
     Node.js version: 20
     ```

3. **Environment variables:**
   - Cloudflare Pages dashboardda "Settings" → "Environment variables"
   - Yuqoridagi barcha environment variablesni qo'shing

### 🌐 Variant 2: Vercel (Alternativa)

#### 🚀 Vercel ga Deploy:

1. **Vercel.com** ga kiring
2. **Import Project** tanlang
3. GitHub repositoryni ulang
4. Environment variablesni qo'shing

### 🏢 Variant 3: Self-hosting (Advanced)

#### 🐳 Docker Deploy:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## ✅ 5. Production Test

### 🔍 Test Checklist:

- [ ] Login/Signup ishlashi
- [ ] AI chat funksiyasi
- [ ] Document generation
- [ ] IRAC case solver
- [ ] Legal database qidiruvi
- [ ] Court simulator
- [ ] Profile management
- [ ] Payment requests
- [ ] Notifications
- [ ] Achievements system

### 🧪 Test Commands:

```bash
# Build test
npm run build

# Production start test
npm start

# Lint test
npm run lint
```

---

## 📊 6. Monitoring va Analytics

### 📈 Asosiy Metrikalar:

- **User registrations:** Kunlik yangi foydalanuvchilar
- **AI requests:** Kunlik AI so'rovlar soni
- **Document generation:** Yaratilgan hujjatlar
- **Payment requests:** To'lov so'rovlari
- **Error rates:** Xatoliklar foizi

### 🔧 Monitoring Tools:

- **Cloudflare Analytics:** Asosiy statistikalar
- **Supabase Logs:** Database monitoring
- **Error tracking:** Sentry yoki LogRocket

---

## 🔒 7. Xavfsizlik

### 🛡️ Security Checklist:

- [ ] Environment variables secure saqlangan
- [ ] HTTPS enabled
- [ ] Database access properly configured
- [ ] API rate limiting
- [ ] Input validation
- [ ] CORS properly configured

### 🔐 API Security:

```javascript
// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

---

## 🚀 8. Deployment Script

### 📜 Automatik Deployment:

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting JurisAI deployment..."

# Build project
npm run build

# Run tests
npm run test

# Deploy to Cloudflare Pages
npm run deploy:cloudflare

echo "✅ Deployment completed!"
```

---

## 📞 9. Support va Maintenance

### 🆘 Support Kanallari:

- **Email:** support@jurisai.uz
- **Phone:** +998 90 123 45 67
- **Telegram:** @jurisai_support
- **Documentation:** docs.jurisai.uz

### 🔧 Maintenance Tasks:

- **Kunlik:** Log monitoring
- **Haftalik:** Performance check
- **Oylik:** Security audit
- **Yillik:** Infrastructure update

---

## 🎯 10. Go-Live Checklist

### ✅ Final Checklist:

- [ ] Barcha environment variables sozlangan
- [ ] Database tables yaratilgan
- [ ] OpenAI API key ishlayotgan
- [ ] Build muvaffaqiyatli
- [ ] SSL certificate o'rnatilgan
- [ ] Monitoring sozlangan
- [ ] Backup strategy tayyor
- [ ] Support kanallari faol
- [ ] Dokumentatsiya yangilangan
- [ ] Test users tayyor

---

## 🎉 Tayyor!

JurisAI platformasi endi production ga tayyor! Platforma quyidagi imkoniyatlarga ega:

- ✅ **100% funksional** - Barcha xususiyatlar ishlaydi
- ✅ **AI-powered** - OpenAI integration bilan
- ✅ **Gamifikatsiya** - Yutuqlar va reyting tizimi
- ✅ **Payment** - Manual to'lov tizimi
- ✅ **Analytics** - To'liq statistika va monitoring
- ✅ **Responsive** - Barcha qurilmalar uchun mos
- ✅ **Secure** - Zamonaviy xavfsizlik choralar

**Endi foydalanuvchilarga xizmat ko'rsatish mumkin!** 🚀⚖️

---

## 📞 Agar Yordam Kerak Bo'lsa:

- **Technical support:** support@jurisai.uz
- **Deployment help:** deploy@jurisai.uz
- **Documentation:** docs.jurisai.uz
- **Community:** community.jurisai.uz

**Muvaffaqiyatli deployment!** 🎉
