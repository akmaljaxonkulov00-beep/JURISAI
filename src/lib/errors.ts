/** Xato qiymatidan matn ajratib oladi — `catch (error: unknown)` bloklari uchun. */
export function getErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const e = error as { message?: unknown; code?: unknown }
    const msg = e.message || e.code
    if (msg) return String(msg)
  }
  if (typeof error === 'string' && error) return error
  return fallback
}
