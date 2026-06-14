# ⚡ Performance Optimization Guide

## Frontend Optimizations

### 1. Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="JurisAI Logo"
  priority={true} // For above-the-fold images
  placeholder="blur"
/>
```

### 2. Code Splitting
```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false, // Disable SSR if not needed
})
```

### 3. React Optimization
```typescript
import { memo, useMemo, useCallback } from 'react'

// Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* render */}</div>
})

// Memoize expensive calculations
const result = useMemo(() => expensiveCalculation(data), [data])

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

### 4. Bundle Size Optimization
```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer

# Import only what you need
import { specific } from 'library' # ✅ Good
import * from 'library' # ❌ Bad
```

## Backend Optimizations

### 1. Database Query Optimization
```python
# Use select specific columns
session.query(User.id, User.name).filter(...)

# Use joins instead of N+1 queries
session.query(User).options(joinedload(User.posts))

# Add indexes
Index('idx_user_email', User.email)
```

### 2. Caching Strategy
```python
from core.cache import cached

@cached(ttl=3600, key_prefix="user")
async def get_user(user_id: str):
    return db.query(User).filter_by(id=user_id).first()
```

### 3. Async Operations
```python
# Use async/await for I/O operations
async def process_multiple():
    results = await asyncio.gather(
        fetch_data_1(),
        fetch_data_2(),
        fetch_data_3(),
    )
    return results
```

## API Optimizations

### 1. Pagination
```python
@router.get("/items")
async def get_items(
    skip: int = 0,
    limit: int = 20,
):
    items = db.query(Item).offset(skip).limit(limit).all()
    return items
```

### 2. Response Compression
```python
# Already enabled in middleware
# Gzip compression for responses > 1KB
```

### 3. Rate Limiting
```python
# Already implemented in middleware.ts
# 100 requests per minute per IP
```

## Database Optimizations

### 1. Connection Pooling
```python
# In config
DB_POOL_SIZE = 10
DB_MAX_OVERFLOW = 20
```

### 2. Query Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_analyses_user_id ON irac_analyses(user_id);
CREATE INDEX idx_analyses_created ON irac_analyses(created_at DESC);
```

### 3. Use Redis for Caching
```bash
# Install Redis
# Windows: https://github.com/microsoftarchive/redis/releases
# Linux: sudo apt-get install redis

# Configure in .env
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=true
```

## Monitoring Performance

### 1. Frontend Monitoring
```typescript
// Use Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  console.log(metric)
  // Send to analytics service
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

### 2. Backend Monitoring
```python
# Already implemented in monitoring.py
from core.monitoring import monitor_performance

@monitor_performance("user.create")
async def create_user(data):
    # Function code
    pass
```

## Performance Checklist

### Frontend
- [ ] Images optimized (WebP, AVIF)
- [ ] Code splitting implemented
- [ ] Lazy loading for below-the-fold content
- [ ] Bundle size < 200KB (first load)
- [ ] Time to Interactive < 3s
- [ ] Lighthouse score > 90

### Backend
- [ ] Database queries optimized
- [ ] Indexes added for frequent queries
- [ ] Caching implemented
- [ ] Connection pooling configured
- [ ] Response time < 200ms (p95)

### API
- [ ] Pagination implemented
- [ ] Compression enabled
- [ ] Rate limiting active
- [ ] Response caching for static data

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.8s | ? |
| Time to Interactive | < 3.8s | ? |
| Speed Index | < 3.4s | ? |
| Total Bundle Size | < 200KB | ? |
| API Response Time | < 200ms | ? |
| Database Query Time | < 50ms | ? |

## Tools

### Testing
- **Lighthouse**: Browser DevTools
- **WebPageTest**: https://webpagetest.org
- **Bundle Analyzer**: `npx @next/bundle-analyzer`

### Monitoring
- **Sentry**: Error and performance tracking
- **Vercel Analytics**: Built-in analytics
- **Posthog**: Product analytics
