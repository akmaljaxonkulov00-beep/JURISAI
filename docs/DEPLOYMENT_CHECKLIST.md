# 🚀 Production Deployment Checklist

## Pre-Deployment

### Security
- [ ] All API keys rotated and secured
- [ ] `.env.local` not committed to git
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled and tested
- [ ] HTTPS enforced on production
- [ ] Security headers configured
- [ ] SQL injection protection verified
- [ ] XSS protection implemented
- [ ] CSRF tokens in place
- [ ] Input validation on all endpoints

### Testing
- [ ] All unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] E2E tests completed
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Accessibility testing done
- [ ] Browser compatibility tested
- [ ] Mobile responsiveness verified

### Performance
- [ ] Bundle size optimized (<200KB)
- [ ] Images optimized (WebP/AVIF)
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Caching strategy implemented
- [ ] Database queries optimized
- [ ] Indexes added to database
- [ ] CDN configured for static assets

### Database
- [ ] Production database created
- [ ] Migrations tested and ready
- [ ] Backup strategy configured
- [ ] Connection pooling configured
- [ ] Database indexes created
- [ ] RLS policies verified (Supabase)

### Monitoring
- [ ] Sentry configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Log aggregation setup
- [ ] Alert rules configured

## Deployment Steps

### 1. Environment Setup
```bash
# Set production environment variables
ENVIRONMENT=production
NODE_ENV=production
DEBUG=false

# Database
DATABASE_URL=your-production-db-url

# API Keys (NEW KEYS!)
GROQ_API_KEY=new-production-key
OPENAI_API_KEY=new-production-key
NEXT_PUBLIC_SUPABASE_URL=production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=production-key

# Security
SECRET_KEY=strong-random-secret
NEXTAUTH_SECRET=strong-random-secret
NEXTAUTH_URL=https://your-domain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### 2. Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# https://vercel.com/your-project/settings/environment-variables
```

### 3. Backend Deployment (Railway/Fly.io)

#### Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up

# Set environment variables
railway variables set KEY=value
```

#### Fly.io:
```bash
# Install flyctl
# Windows: iwr https://fly.io/install.ps1 -useb | iex

# Login
flyctl auth login

# Launch app
flyctl launch

# Deploy
flyctl deploy

# Set secrets
flyctl secrets set KEY=value
```

### 4. Database Migration
```bash
# Run migrations
cd backend
alembic upgrade head

# Verify
alembic current
```

### 5. DNS Configuration
```bash
# Add DNS records:
# A record: @ -> Your server IP
# CNAME: www -> your-domain.com
# CNAME: api -> your-backend-url
```

## Post-Deployment

### Verification
- [ ] Website loads correctly
- [ ] All pages accessible
- [ ] API endpoints working
- [ ] Authentication working
- [ ] Database operations working
- [ ] AI features functional
- [ ] Email notifications working (if any)
- [ ] File uploads working (if any)
- [ ] Payment processing working (if any)

### Performance Check
- [ ] Lighthouse score > 90
- [ ] Page load time < 3s
- [ ] API response time < 200ms
- [ ] Time to Interactive < 3.8s
- [ ] First Contentful Paint < 1.8s

### Monitoring
- [ ] Sentry receiving errors
- [ ] Performance metrics visible
- [ ] Uptime monitoring active
- [ ] Alert notifications working

### Documentation
- [ ] API documentation updated
- [ ] User guide published
- [ ] Deployment notes documented
- [ ] Runbook created

## Rollback Plan

### If Deployment Fails
```bash
# Frontend (Vercel)
vercel rollback

# Backend (Railway)
railway rollback

# Backend (Fly.io)
flyctl releases list
flyctl releases rollback <version>

# Database
alembic downgrade -1
```

### Emergency Contacts
- Technical Lead: [Name/Contact]
- DevOps: [Name/Contact]
- On-call: [Contact]

## Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Review security alerts

### Weekly
- [ ] Review API usage
- [ ] Check database size
- [ ] Review uptime reports
- [ ] Update dependencies

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Backup verification
- [ ] Cost optimization review

## Support

### Status Page
- Setup: https://statuspage.io
- Show: https://status.jurisai.uz

### Documentation
- User Guide: https://docs.jurisai.uz
- API Docs: https://api.jurisai.uz/docs
- Help Center: https://help.jurisai.uz

## Success Criteria

- [ ] 99.9% uptime achieved
- [ ] Zero critical errors
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] User feedback positive
- [ ] Team trained on operations

---

**🎉 Deployment Complete!**

*Agar biror muammo bo'lsa, darhol rollback qiling va muammoni tekshiring.*
