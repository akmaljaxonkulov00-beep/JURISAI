'use client'

import React from 'react'
import { AlertTriangle, WifiOff, Database, ServerCrash, RefreshCw, HelpCircle } from 'lucide-react'

export interface AnalysisErrorProps {
  /** The error message from the failed operation */
  message: string
  /** Optional technical details (e.g., status code, error code) */
  detail?: string
  /** The context where the error occurred (for categorizing the icon) */
  context?: 'network' | 'database' | 'api' | 'auth' | 'validation' | 'general'
  /** Callback to retry the failed operation */
  onRetry?: () => void
  /** Optional class name override */
  className?: string
  /** Whether to show a compact version (no icon, smaller text) */
  compact?: boolean
}

/**
 * Error display component for AI analysis features.
 * Shows context-aware icons and specific error messages instead of generic "Xatolik yuz berdi".
 *
 * Contexts:
 *   - network: WifiOff icon + "Internet ulanishini tekshiring"
 *   - database: Database icon + "Ma'lumotlar bazasiga ulanishda xatolik"
 *   - api: ServerCrash icon + "Server bilan bog'lanishda xatolik"
 *   - auth: HelpCircle icon + "Ruxsat etilmagan"
 *   - validation: AlertTriangle icon + "Noto'g'ri ma'lumot"
 *   - general: AlertTriangle icon (default)
 */
export function AnalysisError({
  message,
  detail,
  context = 'general',
  onRetry,
  className = '',
  compact = false,
}: AnalysisErrorProps) {
  const iconMap = {
    network: WifiOff,
    database: Database,
    api: ServerCrash,
    auth: HelpCircle,
    validation: AlertTriangle,
    general: AlertTriangle,
  }

  const contextLabels: Record<string, string> = {
    network: 'Tarmoq xatoligi',
    database: "Ma'lumotlar bazasi xatoligi",
    api: 'Server xatoligi',
    auth: 'Ruxsat xatoligi',
    validation: "Ma'lumot xatoligi",
    general: 'Xatolik',
  }

  const Icon = iconMap[context] || AlertTriangle
  const label = contextLabels[context] || 'Xatolik'

  if (compact) {
    return (
      <div
        role="alert"
        className={`flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm ${className}`}
      >
        <Icon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-red-700 dark:text-red-300 text-xs font-medium">{message}</p>
          {detail && (
            <p className="text-red-500 dark:text-red-400 text-[10px] mt-0.5 truncate">{detail}</p>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-lg transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Qayta
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      role="alert"
      className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-red-200 dark:border-red-800 ${className}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-red-500" />
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-1">{label}</h3>

        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1 max-w-md">{message}</p>

        {detail && (
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4 font-mono bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
            {detail}
          </p>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Qayta urinish
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Extracts a human-readable error message from various error types.
 * Use this to convert caught errors into specific messages for AnalysisError.
 */
export function getErrorMessage(err: unknown, fallback = "Noma'lum xatolik yuz berdi"): string {
  if (!err) return fallback

  if (err instanceof Error) {
    const msg = err.message.toLowerCase()

    // Network errors
    if (
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('internet') ||
      msg.includes('abort')
    ) {
      return "Internet ulanishini tekshiring yoki qayta urinib ko'ring"
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return "So'rov vaqti tugadi. Internet tezligini tekshiring"
    }
    if (msg.includes('dns') || msg.includes('enotfound') || msg.includes('name not resolved')) {
      return 'Server manzili topilmadi. DNS sozlamalarini tekshiring'
    }

    // Database errors
    if (msg.includes('supabase') || msg.includes('database') || msg.includes('db ')) {
      return "Ma'lumotlar bazasiga ulanishda xatolik"
    }
    if (
      msg.includes('not null') ||
      msg.includes('unique constraint') ||
      msg.includes('foreign key')
    ) {
      return "Ma'lumotlar bazasi cheklov xatosi"
    }
    if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('table')) {
      return "So'ralgan ma'lumot topilmadi"
    }

    // API errors
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('not authenticated')) {
      return 'Tizimga kirish talab qilinadi'
    }
    if (msg.includes('403') || msg.includes('forbidden') || msg.includes('not allowed')) {
      return "Bu amalni bajarish uchun ruxsatingiz yo'q"
    }
    if (msg.includes('404') || msg.includes('not found')) {
      return "So'ralgan ma'lumot mavjud emas"
    }
    if (msg.includes('429') || msg.includes('too many')) {
      return "Juda ko'p so'rov yuborildi. Birozdan so'ng urinib ko'ring"
    }
    if (msg.includes('500') || msg.includes('internal server') || msg.includes('server error')) {
      return 'Serverda texnik xatolik yuz berdi'
    }
    if (msg.includes('503') || msg.includes('unavailable')) {
      return "Xizmat vaqtincha mavjud emas. Keyinroq urinib ko'ring"
    }

    // Auth errors
    if (msg.includes('token') || msg.includes('session') || msg.includes('expired')) {
      return 'Sessiya muddati tugagan. Qayta kiring'
    }

    return err.message.substring(0, 120)
  }

  if (typeof err === 'string') {
    return err.substring(0, 120)
  }

  return fallback
}

/**
 * Determines the error context based on the error message.
 */
export function getErrorContext(err: unknown): AnalysisErrorProps['context'] {
  if (!err) return 'general'

  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()

  if (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('internet') ||
    msg.includes('dns') ||
    msg.includes('timeout') ||
    msg.includes('abort')
  ) {
    return 'network'
  }
  if (
    msg.includes('supabase') ||
    msg.includes('database') ||
    msg.includes('db ') ||
    msg.includes('relation') ||
    msg.includes('table')
  ) {
    return 'database'
  }
  if (
    msg.includes('401') ||
    msg.includes('unauthorized') ||
    msg.includes('token') ||
    msg.includes('session') ||
    msg.includes('403') ||
    msg.includes('forbidden')
  ) {
    return 'auth'
  }
  if (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('500') ||
    msg.includes('internal') ||
    msg.includes('503') ||
    msg.includes('429')
  ) {
    return 'api'
  }
  if (
    msg.includes('validation') ||
    msg.includes('invalid') ||
    msg.includes('required') ||
    msg.includes('format')
  ) {
    return 'validation'
  }

  return 'general'
}
