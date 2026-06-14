# 🚀 Hugging Face Spaces Deployment Guide

## 📋 Qadam-ba-qadam deployment qilish

### 1. 📁 Hugging Face Spaces yaratish
1. [Hugging Face](https://huggingface.co) ga kiring
2.右上角 "+" tugmasini bosing → "Create new Space"
3. Space nomini kiriting: `jurisai-legal-platform`
4. SDK: **Docker**
5. Hardware: **CPU basic** (bepul)
6. Public/Private: **Public**
7. "Create Space" tugmasini bosing

### 2. 🔧 Konfiguratsiya fayllari
Quyidagi fayllar allaqachon tayyor:
- `Dockerfile` - Docker konfiguratsiyasi
- `space.yaml` - Spaces metama'lumotlari
- `requirements.txt` - Python dependencies
- `app.py` - Deployment skripti

### 3. 🔄 Avtomatik deployment

#### GitHub orqali:
```bash
# GitHub repository ga push qiling
git add .
git commit -m "Ready for Hugging Face deployment"
git push origin main
```

#### Qo'lda deployment:
```bash
# Build qiling
npm run build

# Hugging Face Spaces ga push qiling
git remote add hf https://huggingface.co/spaces/USERNAME/jurisai-legal-platform
git push hf main
```

### 4. ⚙️ Environment Variables
Hugging Face Spaces da quyidagi environment variableslarni sozlang:
- `NODE_ENV=production`
- `PORT=7860`

### 5. 🌐 Platformani ochish
Deployment tugagandan so'ng:
- Space URL: `https://huggingface.co/spaces/USERNAME/jurisai-legal-platform`
- Platform 7860 portda ishlaydi

## 🔍 Tekshirish ro'yxati

### ✅ Tekshirishlar:
- [ ] Barcha TypeScript xatolari tuzatilgan
- [ ] Build muvaffaqiyatli (`npm run build`)
- [ ] Dockerfile to'g'ri konfiguratsiyalangan
- [ ] Port 7860 ga o'rnatilgan
- [ ] Static fayllar to'g'ri ishlaydi

### 🚨 Xatoliklar va yechimlari:
- **Build fails**: `npm install` va `npm run build` tekshiring
- **Port error**: 7860 port ishlatilayotganligini tekshiring
- **Memory error**: Hugging Face memory limitini tekshiring

## 📊 Performance optimizatsiya

### 🎯 Recommendations:
- Image optimization: `next/image` componentidan foydalaning
- Code splitting: Dynamic imports qo'llang
- Bundle size: `npm run build` bilan tekshiring

### 📈 Monitoring:
- Hugging Face Spaces dashboard
- Analytics va usage metrics
- Error logging

## 🔄 CI/CD Pipeline

GitHub Actions orqali avtomatik deployment:
```yaml
# .github/workflows/deploy.yml fayli allaqachon tayyor
# Har safar main branch ga push qilinganda avtomatik deploy bo'ladi
```

## 🎉 Muvaffaqiyatli deployment!

Platform endi Hugging Face Spaces da ishlaydi:
- 🌐 Global availability
- 📱 Mobile-friendly
- ⚡ Fast loading
- 🛡️ Secure deployment

## 📞 Yordam

Agar muammo yuzaga kelsa:
1. Hugging Face documentation
2. GitHub Actions logs
3. Docker container logs
4. Build error messages

---

**🏛️ JurisAI Legal Education Platform**
*O'zbekiston uchun zamonaviy huquqiy ta'lim platformasi*
