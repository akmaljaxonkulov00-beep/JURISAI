// Sentry client-side initialization (Next.js App Router)
// DSN .env.local dagi NEXT_PUBLIC_SENTRY_DSN orqali beriladi.
// DSN bo'lmasa Sentry o'chirilgan holatda qoladi (development uchun).
import * as Sentry from '@sentry/nextjs'

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    //.startTime TypeError oldini olish — web-vitals integration ba'zi
    // brauzerlarda undefined performance entry qaytaradi.
    integrations: [],
    // Global error handler — startTime kabi xatolarni yo'qotish
    beforeSend(event) {
      const err = event.exception?.values?.[0]
      if (err?.type === 'TypeError' && err.value?.includes('startTime')) {
        return null // Bu xatoni Sentry'ga yubormaymiz
      }
      return event
    },
  })
}

// Global unhandled error — startTime TypeError ni console'da ko'rsatmaslik
if (typeof window !== 'undefined') {
  window.addEventListener('error', event => {
    if (
      event.message?.includes('startTime') ||
      event.filename?.includes('web-vitals') ||
      event.filename?.includes('sentry')
    ) {
      event.preventDefault()
    }
  })
}
