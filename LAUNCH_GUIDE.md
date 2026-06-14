# 🚀 JURISAI LAUNCH GUIDE

## 🎯 PRE-LAUNCH CHECKLIST (Hozir qiling!)

### ⚠️ STEP 1: API KEYS (CRITICAL!)

**BIRINCHI NAVBATDA - API kalitlaringizni bekor qiling!**

```bash
# Siz eski kalitlarni ommaviy chat'ga joyladingiz!
# Darhol bekor qiling:

# 1. Groq
https://console.groq.com/keys
# "Revoke" tugmasini bosing eski kalitda
# Yangi kalit yarating

# 2. OpenAI  
https://platform.openai.com/api-keys
# Eski kalitni o'chiring
# Yangi kalit yarating

# 3. Supabase
https://supabase.com/dashboard/project/_/settings/api
# Service role key'ni regenerate qiling
```

### 📦 STEP 2: Installation

```bash
# Clone (agar qilmagan bo'lsangiz)
git clone https://github.com/yourusername/jurisai.git
cd jurisai

# Automatic setup
npm run setup

# Manual setup (agar automatic ishlamasa)
npm install
cd backend && pip install -r requirements.txt
```

### 🔐 STEP 3: Environment Setup

```bash
# .env.local yaratish (automatic)
npm run setup

# Yoki manual:
cp .env.example .env.local

# Edit .env.local va YANGI API keys kiriting
# ❌ ESKI kalitlar ISHLAMAYDI!
```

#### Required Environment Variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-new-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-key

# AI Providers
GROQ_API_KEY=your-new-groq-key
OPENAI_API_KEY=your-new-openai-key

# Security
NEXTAUTH_SECRET=generate-strong-random-secret
NEXTAUTH_URL=http://localhost:3000

# Backend
SECRET_KEY=another-strong-random-secret
```

### ✅ STEP 4: Verification

```bash
# Verify everything is ready
npm run verify

# Should show:
# ✅ All checks PASSED - Ready for deployment!
```

### 🧪 STEP 5: Testing

```bash
# Run all tests
npm run test:all

# Or separately:
npm run test           # Unit tests
npm run test:coverage  # Coverage (target: 80%+)
npm run test:e2e       # E2E tests
npm run lint           # Linting
npm run type-check     # TypeScript
```

### 🏗️ STEP 6: Build

```bash
# Development build
npm run dev

# Production build
npm run build

# Test production build
npm run start
```

---

## 🚀 DEPLOYMENT OPTIONS

### Option 1: Vercel (Recommended for Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables in dashboard
https://vercel.com/your-project/settings/environment-variables
```

### Option 2: Docker (Full Stack)

```bash
# Build and run
npm run docker:build
npm run docker:up

# Check logs
npm run docker:logs

# Stop
npm run docker:down
```

### Option 3: Railway (Backend)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up

# Set environment variables
railway variables set KEY=value
```

### Option 4: Manual VPS

```bash
# On your server
git clone your-repo
cd jurisai
npm run setup
npm run build
npm run start

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "jurisai" -- start
pm2 save
```

---

## 📊 POST-DEPLOYMENT

### Verify Deployment

```bash
# Check frontend
curl https://your-domain.com

# Check backend
curl https://your-api.com/health

# Check API
curl https://your-api.com/api/v1/health
```

### Monitor

```bash
# Sentry (if configured)
# Check: https://sentry.io/your-project

# Vercel Analytics
# Check: https://vercel.com/your-project/analytics

# Application logs
# Check your hosting provider's dashboard
```

---

## 🔍 TROUBLESHOOTING

### Build Fails
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Tests Fail
```bash
# Update snapshots
npm run test -- -u

# Check coverage
npm run test:coverage
```

### Environment Issues
```bash
# Verify .env.local
cat .env.local

# Make sure no placeholders like "your-"
grep "your-" .env.local
```

### Docker Issues
```bash
# Rebuild containers
npm run docker:down
npm run docker:build
npm run docker:up

# Check logs
npm run docker:logs
```

---

## 📈 PERFORMANCE CHECKLIST

### Before Launch:
- [ ] Lighthouse score > 90
- [ ] Bundle size < 200KB
- [ ] Test coverage > 80%
- [ ] No console errors
- [ ] All tests passing

### After Launch:
- [ ] Monitor error rate (< 0.1%)
- [ ] Check response time (< 200ms)
- [ ] Verify uptime (> 99.9%)
- [ ] Review user feedback
- [ ] Track conversions

---

## 🎉 LAUNCH DAY!

### T-24 Hours:
- [ ] Final security audit
- [ ] Database backup
- [ ] Team briefing
- [ ] Support ready

### T-1 Hour:
- [ ] Final build
- [ ] Smoke tests
- [ ] Monitoring active
- [ ] Team on standby

### T-0 - LAUNCH! 🚀
```bash
# Deploy to production
npm run deploy:prod

# Or
vercel --prod

# Monitor closely for first hour
```

### T+1 Hour:
- [ ] Check error logs
- [ ] Verify all features
- [ ] Monitor performance
- [ ] Celebrate! 🎊

---

## 📞 EMERGENCY CONTACTS

### If Something Goes Wrong:

1. **Rollback immediately**
   ```bash
   vercel rollback
   # or
   git revert HEAD
   git push
   ```

2. **Check logs**
   ```bash
   # Vercel
   vercel logs

   # Docker
   npm run docker:logs
   ```

3. **Contact team**
   - Technical Lead: [Contact]
   - DevOps: [Contact]
   - On-Call: [Contact]

---

## ✅ SUCCESS CRITERIA

### Technical:
- ✅ Zero critical errors
- ✅ Uptime > 99%
- ✅ Response time < 500ms
- ✅ All features working

### Business:
- ✅ Users can sign up
- ✅ AI features working
- ✅ Payments processing (if enabled)
- ✅ Positive feedback

---

## 🎊 CONGRATULATIONS!

**Agar barcha qadamlar muvaffaqiyatli bo'lsa:**

**🎉 JURISAI LAUNCHED! 🚀**

### What's Next?

1. **Week 1**: Monitor closely, fix bugs
2. **Week 2**: Collect user feedback
3. **Month 1**: Feature improvements
4. **Month 2**: Marketing push
5. **Month 3**: Scale infrastructure

---

## 📚 ADDITIONAL RESOURCES

- [README.md](./README.md) - Project overview
- [SECURITY.md](./SECURITY.md) - Security policy
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute
- [DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md) - Full checklist
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Common issues

---

**⚖️ JURISAI - Ready to change legal education in O'zbekiston!**

*Built with passion, launched with confidence* 🚀

**GOOD LUCK! 🎊**
