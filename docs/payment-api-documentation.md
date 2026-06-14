# JurisAI Manual Payment API Documentation

## 📋 Overview
Manual Payment tizimi uchun API endpoint lari. Bu API foydalanuvchilarning to'lovlarini qabul qilish, adminlar tomonidan tasdiqlash va ma'lumotlar bazasida saqlash uchun ishlatiladi.

---

## 🔗 API Endpoint lari

### 1. **To'lovlarni olish / yaratish**
```
GET/POST /api/payments
```

#### GET - To'lovlarni olish
**Query Parameters:**
- `userId` (optional) - Foydalanuvchi ID si bo'yicha filter
- `status` (optional) - Status bo'yicha filter (`pending`, `approved`, `rejected`)

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "1",
        "userId": "user_123",
        "planId": "pro",
        "planName": "Pro",
        "planPrice": 99000,
        "status": "pending",
        "checkImage": "/uploads/checks/123.jpg",
        "submittedAt": "2024-01-20T10:30:00Z",
        "processedAt": null,
        "processedBy": null,
        "notes": null
      }
    ],
    "total": 1
  }
}
```

#### POST - Yangi to'lov yaratish
**Request Body:**
```json
{
  "userId": "user_123",
  "planId": "pro",
  "planName": "Pro",
  "planPrice": 99000,
  "checkImage": "/uploads/checks/123.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "userId": "user_123",
    "planId": "pro",
    "planName": "Pro",
    "planPrice": 99000,
    "status": "pending",
    "checkImage": "/uploads/checks/123.jpg",
    "submittedAt": "2024-01-20T10:30:00Z",
    "processedAt": null,
    "processedBy": null,
    "notes": null
  }
}
```

---

### 2. **To'lovni tasdiqlash**
```
POST /api/payments/approve
```

**Request Body:**
```json
{
  "paymentId": "1",
  "processedBy": "Admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment approved successfully",
  "data": {
    "paymentId": "1",
    "status": "approved",
    "processedAt": "2024-01-20T11:00:00Z",
    "processedBy": "Admin"
  }
}
```

---

### 3. **To'lovni rad etish**
```
POST /api/payments/reject
```

**Request Body:**
```json
{
  "paymentId": "1",
  "notes": "Chek aniq emas, summa mos kelmadi",
  "processedBy": "Admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment rejected successfully",
  "data": {
    "paymentId": "1",
    "status": "rejected",
    "processedAt": "2024-01-20T11:00:00Z",
    "processedBy": "Admin",
    "notes": "Chek aniq emas, summa mos kelmadi"
  }
}
```

---

### 4. **Chek rasmini yuklash**
```
POST /api/upload
```

**Request:** `multipart/form-data`
- `file` - Rasm fayli (PNG, JPG, GIF, WebP, max 5MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/checks/1642678800000_check.jpg",
    "fileName": "check.jpg",
    "fileSize": 2048576,
    "fileType": "image/jpeg"
  }
}
```

---

## 🗄️ Database Schema

### Payments Table
```sql
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
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_submitted_at (submitted_at)
);
```

### Users Table (agar mavjud bo'lmasa)
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('USER', 'ADMIN') DEFAULT 'USER',
  subscription_plan VARCHAR(255) DEFAULT 'free',
  subscription_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔧 Real Implementation (Supabase)

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# File Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=your_supabase_storage_url
```

### Supabase Client Setup
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Real API Implementation Example
```typescript
// src/app/api/payments/route.ts
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    let query = supabase
      .from('payments')
      .select('*')
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
```

---

## 🔒 Xavfsizlik

### Authentication Middleware
```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
})

export const config = {
  matcher: ['/api/payments/:path*', '/payment-admin']
}
```

### Role-based Access
```typescript
// Admin-only endpoint protection
export async function POST(request: NextRequest) {
  const session = await getServerSession(req)
  
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // ... rest of the code
}
```

---

## 📱 Frontend Integration

### API Service
```typescript
// src/services/payment-api.ts
export const paymentAPI = {
  async createPayment(data: PaymentData) {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  },

  async getPayments(filters?: PaymentFilters) {
    const params = new URLSearchParams(filters as any)
    const response = await fetch(`/api/payments?${params}`)
    return response.json()
  },

  async approvePayment(paymentId: string) {
    const response = await fetch('/api/payments/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId })
    })
    return response.json()
  },

  async rejectPayment(paymentId: string, notes?: string) {
    const response = await fetch('/api/payments/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, notes })
    })
    return response.json()
  }
}
```

---

## 🧪 Testing

### Test Cases
1. **Payment Creation** - To'lov yaratish testi
2. **Image Upload** - Chek rasmini yuklash testi
3. **Admin Approval** - Admin tomonidan tasdiqlash testi
4. **Status Updates** - Status o'zgarishlari testi
5. **Role Access** - Role-based access testi

### Example Test
```typescript
// __tests__/payments.test.ts
describe('Payment API', () => {
  test('should create payment', async () => {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_user',
        planId: 'pro',
        planName: 'Pro',
        planPrice: 99000,
        checkImage: '/test/check.jpg'
      })
    })
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('pending')
  })
})
```

---

## 📊 Monitoring & Analytics

### Key Metrics
- Payment success rate
- Average processing time
- Rejection rate by reason
- User conversion rates

### Webhook Integration (optional)
```typescript
// Webhook for payment notifications
export async function POST(request: NextRequest) {
  const { type, data } = await request.json()
  
  switch (type) {
    case 'payment.approved':
      // Send confirmation email
      await sendConfirmationEmail(data.userId, data.planId)
      break
    case 'payment.rejected':
      // Send rejection notification
      await sendRejectionEmail(data.userId, data.notes)
      break
  }
  
  return NextResponse.json({ success: true })
}
```

---

## 🚀 Deployment Checklist

- [ ] Supabase database setup
- [ ] Environment variables configuration
- [ ] File storage bucket creation
- [ ] API route testing
- [ ] Authentication middleware setup
- [ ] Role-based access control
- [ ] Error handling implementation
- [ ] Rate limiting setup
- [ ] Monitoring and logging
- [ ] Backup strategy

---

## 📞 Support

Agar savollaringiz bo'lsa yoki muammolar yuz bersa:
1. API loglarini tekshiring
2. Database connectionni tekshiring
3. Environment variablesni tekshiring
4. Authentication ni tekshiring
