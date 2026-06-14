# JurisAI - Huquqiy AI Platformasi

JurisAI - bu O'zbekiston qonunchiligiga asoslangan to'liq funksional huquqiy yordamchi platforma. AI orqali huquqiy masalalarni tahlil qilish, hujjatlar yaratish, sud simulyatsiyalari va boshqa ko'plab imkoniyatlarni taqdim etadi.

## 🌟 Asosiy xususiyatlar

### 🏛️ Huquqiy Modullar
- **IRAC Solver** - Huquqiy tahlil tizimi (Issue, Rule, Application, Conclusion)
- **Decision Tree** - Qaror daraxtlari orqali masalalarni yechish
- **Scenario Generator** - Huquqiy senariylar yaratish
- **Weakness Detector** - Huquqiy hujjatlardagi zaifliklarni aniqlash
- **Document Generator** - Huquqiy hujjatlar avtomatik yaratish
- **Legal Database** - O'zbekiston qonunlari bazasi
- **Court Simulator** - Sud jarayonlarining simulyatsiyasi

### 🎨 Dizayn xususiyatlari
- **Glassmorphism effektlari** - Zamonaviy shishadek dizayn
- **Blue/white gradient** - Professional rang sxemasi
- **Rounded-2xl** - Yumshoq burchaklar
- **Responsive interfeys** - Barcha qurilmalarda ishlaydi
- **O'zbek tilida** - To'liq mahalliylashtirilgan

### 🛠️ Texnologiyalar

#### Frontend
- **Next.js 16.2.4** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **Lucide React** - Iconlar
- **React Hook Form** - Form management
- **Zod** - Validation

#### Backend
- **FastAPI** - Python web framework
- **Python 3.9+** - Backend language
- **SQLite/PostgreSQL** - Database
- **Pydantic** - Data validation

#### Authentication
- **Supabase** - Authentication & Database
- **JWT tokens** - Secure authentication

## 🚀 Boshlash

### Talablar
- Node.js 18+
- Python 3.9+
- npm/yarn

### Installation

1. **Repositoryni klonlash**
```bash
git clone https://github.com/username/jurisai.git
cd jurisai
```

2. **Frontend installation**
```bash
npm install
# yoki
yarn install
```

3. **Backend installation**
```bash
cd backend
pip install -r requirements.txt
```

4. **Environment variables**
```bash
# .env.local faylini yarating
cp .env.example .env.local
# Supabase ma'lumotlarini kiriting
```

### Ishga tushirish

1. **Backend server**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

2. **Frontend server**
```bash
npm run dev
# yoki
yarn dev
```

3. **Platformaga kirish**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📊 Platforma tuzilishi

### 🏠 Asosiy sahifalar
- `/` - Dashboard (asosiy panel)
- `/irac` - IRAC huquqiy tahlil
- `/decision-tree` - Qaror daraxtlari
- `/scenario-generator` - Senariyalar generatori
- `/weakness-detector` - Zaifliklarni aniqlash
- `/document-generator` - Hujjatlar generatori
- `/legal-database` - Qonunlar bazasi
- `/court-simulator` - Sud simulyatsiyasi
- `/community` - Ijtimoiy platforma

### 🔐 Authentication (hozircha o'chirilgan)
Platforma hozircha autentifikatsiyasiz ishlaydi. Agar kerak bo'lsa:
- `/signin` - Kirish sahifasi
- `/signup` - Ro'yxatdan o'tish
- `/setup-supabase` - Supabase sozlamalari

## 🎯 Foydalanish

### Dashboard
- XP tizimi va achievements
- So'nggi ishlar tarixi
- Tezkor harakatlar
- Statistikalar

### IRAC Solver
1. Huquqiy masalani kiriting
2. AI tahlil qiladi
3. Issue, Rule, Application, Conclusion formatida javob

### Document Generator
1. Hujjat turini tanlang
2. Ma'lumotlarni kiriting
3. AI to'liq hujjat yaratadi

### Legal Database
1. Qonunlar bazasidan qidiring
2. Kategoriyalar bo'yicha filtrlash
3. To'liq matnlar

## 🔧 Konfiguratsiya

### Supabase sozlamalari
1. Supabase.com da project yarating
2. Settings → API dan ma'lumotlarni oling
3. `.env.local` fayliga qo'shing:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Backend sozlamalari
```python
# backend/config.py
DATABASE_URL="sqlite:///./jurisai.db"
SECRET_KEY="your-secret-key"
DEBUG=True
```

## 🚀 Deploy

### Vercel (Frontend)
```bash
npm install -g vercel
vercel
```

### Railway/Heroku (Backend)
```bash
# Railway
railway login
railway deploy

# Heroku
heroku create jurisai-backend
git push heroku main
```

## 🤝 Qo'shilish

1. Fork qiling
2. Feature branch yarating: `git checkout -b feature/amazing-feature`
3. O'zgarishlarni qo'shing: `git commit -m 'Add amazing feature'`
4. Push qiling: `git push origin feature/amazing-feature`
5. Pull Request yarating

## 📄 Litsenziya

Bu loyiha MIT litsenziyasi ostida tarqatiladi.

## 🙏 Minnatdorchilik

- Next.js jamoasi
- Supabase
- FastAPI
- O'zbekiston Respublikasi Adliya vazirligi

## 📞 Aloqa

- **Email**: info@jurisai.uz
- **Telegram**: @jurisai
- **Web**: https://jurisai.uz

---

**JurisAI** - Huquqiy kelajakni bugundan boshlang! 🚀⚖️
