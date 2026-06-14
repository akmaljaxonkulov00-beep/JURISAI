/**
 * Analytics utility for tracking user events
 * Supports multiple analytics providers
 */

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

interface PageView {
  path: string
  title?: string
}

class Analytics {
  private isEnabled: boolean

  constructor() {
    this.isEnabled =
      process.env.NODE_ENV === 'production' &&
      typeof window !== 'undefined'
  }

  /**
   * Track page view
   */
  pageView({ path, title }: PageView): void {
    if (!this.isEnabled) return

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: path,
        page_title: title,
      })
    }

    // Posthog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      ;(window as any).posthog.capture('$pageview', {
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

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', name, properties)
    }

    // Posthog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      ;(window as any).posthog.capture(name, properties)
    }

    // Console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', name, properties)
    }
  }

  /**
   * Track user properties
   */
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('set', { user_id: userId, ...properties })
    }

    // Posthog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      ;(window as any).posthog.identify(userId, properties)
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
  trackError(error: Error, context?: Record<string, any>): void {
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
