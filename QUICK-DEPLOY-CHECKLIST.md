# 🚀 JurisAI Quick Deploy Checklist

## ⚡ Tezkor Deploy Uchun Nimalar Kerak?

### 🔑 1. API Keys (Eng Muhimi!)
```
✅ OpenAI API Key: sk-your-openai-api-key
✅ Supabase URL: https://your-project.supabase.co  
✅ Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ NextAuth Secret: your-32-character-secret-key
```

### 🗄️ 2. Supabase Setup
- [ ] Supabase project yaratilgan
- [ ] Tables yaratilgan (users, achievements, payments, usage_tracking)
- [ ] Environment variables qo'shilgan

### 🏗️ 3. Build Test
```bash
npm run build
# ✅ Build muvaffaqiyatli yakunlandi
```

### 🌐 4. Hosting Tanlang
- [ ] **Cloudflare Pages** (Tavsiya etilgan)
- [ ] **Vercel** (Alternativa)  
- [ ] **Self-hosting** (Advanced)

---

## 📋 Deploy Qadamlari

### Step 1: GitHub ga Push
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### Step 2: Hosting Platform
1. **Cloudflare Pages:**
   - Connect GitHub
   - Build command: `npm run build`
   - Output directory: `.next`
   - Environment variables qo'shing

2. **Vercel:**
   - Connect GitHub  
   - Auto-deploy enabled
   - Environment variables qo'shing

### Step 3: Environment Variables
Hosting platformda quyidagilarni qo'shing:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXTAUTH_URL=your-domain.com
NEXTAUTH_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
```

---

## ✅ Production Test

### 🔍 Test List
- [ ] Login/Signup ishlashi
- [ ] AI chat (OpenAI bilan)
- [ ] Document generation
- [ ] Legal database qidiruvi
- [ ] Profile management
- [ ] Payment requests

### 🧪 Quick Test
```bash
# Productionda test qilish
curl https://your-domain.com/api/auth/me
# Response: {"user": null} (chunki login qilinmagan)
```

---

## 🎯 Go-Live!

### 🚀 Final Check
- [ ] Barcha API keys ishlayapti
- [ ] Database ulanish bor
- [ ] AI funksiyalari ishlayapti
- [ ] SSL certificate bor
- [ ] Monitoring sozlangan

### 🎉 Tayyor!
**JurisAI endi production da!** 🚀⚖️

---

## 📞 Agar Xatolik Bo'lsa

### 🔧 Common Issues
1. **OpenAI API xatosi:** API key tekshiring
2. **Database xatosi:** Supabase URL va key tekshiring  
3. **Build xatosi:** Dependencies tekshiring
4. **Environment xatosi:** Barcha variables sozlanganligini tekshiring

### 🆘 Support
- **Email:** support@jurisai.uz
- **Docs:** PRODUCTION-SETUP-GUIDE.md
- **GitHub:** Issues qiling

---

## ⏰ Vaqt Qancha Ketadi?

- **Setup:** 30-45 daqiqa
- **Deploy:** 10-15 daqiqa  
- **Test:** 15-20 daqiqa
- **Jami:** 1-2 soat

**Endi JurisAI production ga tayyor!** 🎉
