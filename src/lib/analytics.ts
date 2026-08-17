/**
 * Analytics utility for tracking user events
 * Supports multiple analytics providers
 */

interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
}

interface PageView {
  path: string
  title?: string
}

// Analytics provider'larning minimal tiplari (any o'rniga)
type GtagFn = (...args: unknown[]) => void
type Posthog = {
  capture: (...args: unknown[]) => void
  identify: (...args: unknown[]) => void
}

interface AnalyticsWindow {
  gtag?: GtagFn
  posthog?: Posthog
}

class Analytics {
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && typeof window !== 'undefined'
  }

  /**
   * Track page view
   */
  pageView({ path, title }: PageView): void {
    if (!this.isEnabled) return

    const w = window as unknown as AnalyticsWindow

    // Google Analytics
    if (typeof window !== 'undefined' && w.gtag) {
      w.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: path,
        page_title: title,
      })
    }

    // Posthog
    if (typeof window !== 'undefined' && w.posthog) {
      w.posthog.capture('$pageview', {
        $current_url: path,
        title,
      })
    }
  }

  /**
   * Track custom event
   */
  event({ name, properties = {} }: AnalyticsEvent): void {
    if (!this.isEnabled) return

    const w = window as unknown as AnalyticsWindow

    // Google Analytics
    if (typeof window !== 'undefined' && w.gtag) {
      w.gtag('event', name, properties)
    }

    // Posthog
    if (typeof window !== 'undefined' && w.posthog) {
      w.posthog.capture(name, properties)
    }

    // Console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', name, properties)
    }
  }

  /**
   * Track user properties
   */
  identify(userId: string, properties?: Record<string, unknown>): void {
    if (!this.isEnabled) return

    const w = window as unknown as AnalyticsWindow

    // Google Analytics
    if (typeof window !== 'undefined' && w.gtag) {
      w.gtag('set', { user_id: userId, ...properties })
    }

    // Posthog
    if (typeof window !== 'undefined' && w.posthog) {
      w.posthog.identify(userId, properties)
    }
  }

  /**
   * Track IRAC analysis
   */
  trackIRACAnalysis(caseType: string, duration: number): void {
    this.event({
      name: 'irac_analysis_completed',
      properties: {
        case_type: caseType,
        duration_seconds: duration,
      },
    })
  }

  /**
   * Track document generation
   */
  trackDocumentGeneration(documentType: string, success: boolean): void {
    this.event({
      name: 'document_generated',
      properties: {
        document_type: documentType,
        success,
      },
    })
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount: number): void {
    this.event({
      name: 'search',
      properties: {
        query,
        results_count: resultsCount,
      },
    })
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.event({
      name: 'error_occurred',
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        ...context,
      },
    })
  }
}

// Export singleton instance
export const analytics = new Analytics()
