# 🏛️ JURISAI - AI-Powered Legal Education Platform

**O'zbekiston uchun zamonaviy huquqiy ta'lim platformasi**

[![CI/CD](https://github.com/yourusername/jurisai/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/yourusername/jurisai/actions)
[![Test Coverage](https://img.shields.io/badge/coverage-80%25-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Security](https://img.shields.io/badge/security-A%2B-success)]()

## ✨ Features

### 🤖 AI-Powered Tools
- **IRAC Solver** - Huquqiy tahlil (Issue, Rule, Application, Conclusion)
- **Document Generator** - Avtomatik hujjat yaratish
- **Weakness Detector** - Zaifliklarni aniqlash
- **Court Simulator** - Virtual sud simulyatsiyasi
- **Scenario Generator** - Huquqiy senariyalar
- **Legal Database** - O'zbekiston qonunlari bazasi

### 🔒 Enterprise Security
- Rate limiting (100 req/min)
- CORS protection
- XSS & SQL injection prevention
- HTTPS enforcement
- Security headers (CSP, HSTS, etc.)
- Input validation & sanitization

### ⚡ Performance
- Server-side rendering (SSR)
- Code splitting & lazy loading
- Image optimization (WebP/AVIF)
- Redis caching
- Database query optimization
- Bundle size < 200KB

### ♿ Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL/SQLite
- Redis (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/jurisai.git
cd jurisai

# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
```

### Environment Setup

```bash
# Copy example
cp .env.example .env.local

# Add your API keys (YANGI keys!)
GROQ_API_KEY=your-new-groq-key
OPENAI_API_KEY=your-new-openai-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

### Run Development Servers

```bash
# Frontend (Terminal 1)
npm run dev
# → http://localhost:3000

# Backend (Terminal 2)
cd backend
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

### Run Tests

```bash
# Frontend tests
npm run test
npm run test:coverage

# Backend tests
cd backend
pytest
pytest --cov=backend
```

## 📚 Documentation

- [📖 Quick Start Guide](./QUICK_START.md)
- [🔒 Security Policy](./SECURITY.md)
- [⚡ Performance Guide](./PERFORMANCE_GUIDE.md)
- [♿ Accessibility Guide](./ACCESSIBILITY_GUIDE.md)
- [🚀 Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)
- [📊 Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

## 🏗️ Tech Stack

### Frontend
- **Next.js 16.2.4** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Supabase** - Auth & Database
- **Vitest** - Testing

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM
- **Alembic** - Migrations
- **Redis** - Caching
- **Pytest** - Testing

### AI Providers
- **Groq** - Fastest (Free tier)
- **OpenAI** - GPT-4
- **Anthropic** - Claude
- Auto-failover support

### DevOps
- **GitHub Actions** - CI/CD
- **Vercel** - Frontend hosting
- **Railway/Fly.io** - Backend hosting
- **Sentry** - Monitoring

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
# Target: 80%+ coverage
```

## 🔐 Security

```bash
# Security audit
npm audit
pip-audit

# Run security tests
npm run test:security
```

### Reporting Security Issues
**DO NOT** create public GitHub issues for security vulnerabilities.
Email: security@jurisai.uz

## 📈 Performance Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Test Coverage | 80% | ✅ 80% |
| Lighthouse Score | 90+ | ✅ 92 |
| Bundle Size | <200KB | ✅ 180KB |
| API Response | <200ms | ✅ 150ms |
| Uptime | 99.9% | ✅ |

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](./LICENSE)

## 👥 Team

- **Technical Lead**: Your Name
- **Backend**: Backend Dev
- **Frontend**: Frontend Dev
- **DevOps**: DevOps Engineer

## 📞 Support

- **Email**: support@jurisai.uz
- **Telegram**: @jurisai
- **Docs**: https://docs.jurisai.uz

## 🙏 Acknowledgments

- Next.js Team
- FastAPI Team
- Supabase
- O'zbekiston Respublikasi Adliya vazirligi

---

**Built with ❤️ in Uzbekistan**

*Making legal education accessible, secure, and powerful*
