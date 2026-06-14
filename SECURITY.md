# 🔒 SECURITY POLICY

## Xavfsizlik muammolarini xabar qilish

Agar siz xavfsizlik zaifligini topsangiz, iltimos **ommaviy bo'lmagan usulda** xabar bering:

- **Email:** security@jurisai.uz
- **Telegram:** @jurisai_security

**❌ GitHub Issues'da xavfsizlik muammolarini joylashmang!**

## API Kalitlari xavfsizligi

### ❌ QILMANG:
- API kalitlarini GitHub'ga commit qilmang
- .env fayllarini public repository'ga joylamang
- API kalitlarini chat yoki email orqali yubormang
- Frontend kodida API kalitlarni hardcode qilmang

### ✅ QILING:
- `.env.local` fayldan foydalaning (git ignore qilingan)
- Environment variables server-side ishlatilsin
- API kalitlarni muntazam yangilang
- Access control va rate limiting qo'shing

## Xavfsizlik tekshiruvi

Deployment oldidan quyidagilarni tekshiring:

- [ ] `.env*` fayllar .gitignore da
- [ ] Barcha API kalitlar environment variables'da
- [ ] CORS to'g'ri sozlangan
- [ ] Rate limiting ishlamoqda
- [ ] Input validation bor
- [ ] SQL injection himoyasi bor
- [ ] XSS himoyasi bor
- [ ] Authentication ishlaydi
- [ ] HTTPS ishlatilmoqda (production)

## Xavfsizlik standartlari

Biz quyidagi xavfsizlik standartlariga rioya qilamiz:

- OWASP Top 10
- GDPR (data privacy)
- SOC 2 (coming soon)

## Yangilanish tarixi

- **2024-06-13:** Initial security policy
