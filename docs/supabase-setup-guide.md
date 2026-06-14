# Supabase Setup Guide for JurisAI Manual Payment

## 📋 Overview
Bu guide JurisAI Manual Payment tizimini Supabase bilan integratsiyalash uchun to'liq yo'riqnoma.

---

## 🔧 Supabase Project Setup

### 1. Yangi Project Yaratish
1. [Supabase](https://supabase.com) ga kirish
2. "New Project" tugmasini bosish
3. Project details:
   - **Name:** `jurisai-payment`
   - **Database Password:** Murakkab parol yarating
   - **Region:** Eng yaqin regionni tanlang
4. "Create new project" tugmasini bosish

### 2. Environment Variables
`.env.local` fayliga qo'shing:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# File Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=your_supabase_storage_url
```

---

## 🗄️ Database Setup

### 1. SQL Editor orqali Table larni yaratish

Supabase Dashboard → SQL Editor → New query:

```sql
-- Users table (agar mavjud bo'lmasa)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('USER', 'ADMIN') DEFAULT 'USER',
  subscription_plan VARCHAR(255) DEFAULT 'free',
  subscription_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(255) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  plan_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  check_image TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  processed_by VARCHAR(255) NULL,
  notes TEXT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_submitted_at (submitted_at)
);

-- Subscription history table
CREATE TABLE subscription_history (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(255) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  plan_price DECIMAL(10, 2) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  payment_id VARCHAR(255),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### 2. RLS (Row Level Security) Policies

```sql
-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can only insert their own payments
CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- Admins can update all payments
CREATE POLICY "Admins can update all payments" ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );
```

---

## 📁 File Storage Setup

### 1. Storage Bucket Yaratish

Supabase Dashboard → Storage → New bucket:

```sql
-- Create bucket for check images
INSERT INTO storage.buckets (id, name, public)
VALUES ('check-images', 'check-images', false);

-- Allow public access to check images (for approved payments)
CREATE POLICY "Public check images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'check-images' AND
    (
      -- Users can see their own approved checks
      (auth.role() = 'authenticated' AND 
       (storage.foldername(name))[1] = auth.uid()::text) OR
      -- Admins can see all checks
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'ADMIN'
      )
    )
  );

-- Allow users to upload their own check images
CREATE POLICY "Users can upload own checks" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'check-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own check images
CREATE POLICY "Users can update own checks" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'check-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 🔐 Authentication Setup

### 1. Auth Provider Configuration

Supabase Dashboard → Authentication → Settings:

```json
{
  "site_url": "http://localhost:3000",
  "redirect_url": "http://localhost:3000/auth/callback",
  "additional_redirect_urls": ["http://localhost:3000"]
}
```

### 2. JWT Secret

`.env.local` fayliga qo'shing:
```env
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

---

## 💻 Code Implementation

### 1. Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 2. Real API Implementation

```typescript
// src/app/api/payments/route.ts
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    let query = supabase
      .from('payments')
      .select(`
        *,
        user:users(name, email)
      `)
      .order('submitted_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: payments, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { payments, total: payments?.length || 0 }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planId, planName, planPrice, checkImage } = body

    if (!userId || !planId || !checkImage) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        plan_id: planId,
        plan_name: planName,
        plan_price: planPrice,
        status: 'pending',
        check_image: checkImage
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: payment
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
```

### 3. File Upload Implementation

```typescript
// src/app/api/upload/route.ts
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: 'File and userId are required' },
        { status: 400 }
      )
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    const fileName = `${userId}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage
      .from('check-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('check-images')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName,
        fileSize: file.size,
        fileType: file.type
      }
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
```

### 4. Approval/Rejection Implementation

```typescript
// src/app/api/payments/approve/route.ts
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, processedBy } = body

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get payment details
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (fetchError) throw fetchError

    // Update payment status
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        processed_by: processedBy
      })
      .eq('id', paymentId)
      .select()
      .single()

    if (error) throw error

    // Update user subscription
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1) // 1 month from now

    await supabase
      .from('users')
      .update({
        subscription_plan: payment.plan_id,
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq('id', payment.user_id)

    // Add to subscription history
    await supabase
      .from('subscription_history')
      .insert({
        id: crypto.randomUUID(),
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        plan_name: payment.plan_name,
        plan_price: payment.plan_price,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: paymentId
      })

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
      data
    })

  } catch (error) {
    console.error('Error approving payment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to approve payment' },
      { status: 500 }
    )
  }
}
```

---

## 🔒 Security Implementation

### 1. Middleware Setup

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/payment-admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/payment-admin', '/api/payments/:path*']
}
```

---

## 🧪 Testing

### 1. Environment Setup for Testing
```env
# .env.test
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_test_supabase_key
```

### 2. Test Database Setup
```sql
-- Test data
INSERT INTO users (id, name, email, role) VALUES 
('test-user-1', 'Test User', 'test@example.com', 'USER'),
('test-admin-1', 'Test Admin', 'admin@example.com', 'ADMIN');
```

### 3. API Testing
```bash
# Test payment creation
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "planId": "pro",
    "planName": "Pro",
    "planPrice": 99000,
    "checkImage": "/test/check.jpg"
  }'

# Test payment approval
curl -X POST http://localhost:3000/api/payments/approve \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "payment-id",
    "processedBy": "test-admin-1"
  }'
```

---

## 📊 Monitoring

### 1. Supabase Logs
Supabase Dashboard → Logs → Realtime

### 2. Custom Analytics
```typescript
// src/lib/analytics.ts
export const trackPaymentEvent = async (event: string, data: any) => {
  // Send to analytics service
  await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
  })
}
```

---

## 🚀 Deployment Checklist

- [ ] Supabase project created
- [ ] Database tables created
- [ ] RLS policies configured
- [ ] Storage bucket created
- [ ] Environment variables set
- [ ] Authentication configured
- [ ] API routes implemented
- [ ] File upload working
- [ ] Payment approval working
- [ ] User subscription updates working
- [ ] Security middleware configured
- [ ] Testing completed
- [ ] Monitoring setup
- [ ] Backup strategy implemented

---

## 📞 Support

Agar muammolar yuz bersa:
1. Supabase loglarini tekshiring
2. RLS policiesni tekshiring
3. Environment variablesni tekshiring
4. Network connectionni tekshiring
5. Supabase dashboardda real-time monitoring qiling
