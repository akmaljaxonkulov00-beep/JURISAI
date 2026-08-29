// Sentry client-side initialization (Next.js App Router)
// DSN .env.local dagi NEXT_PUBLIC_SENTRY_DSN orqali beriladi.
// DSN bo'lmasa Sentry o'chirilgan holatda qoladi (development uchun).
import * as Sentry from '@sentry/nextjs'

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% tranzaksiyalarni kuzatish
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  })
}
