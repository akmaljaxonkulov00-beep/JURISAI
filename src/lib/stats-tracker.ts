/**
 * Client-Side Activity & Realtime Event Dispatcher
 * Dispatches live updates across pages and widgets when tasks complete.
 */

export interface ActivityRecord {
  id: string
  type:
    | 'case_completed'
    | 'case_attempted'
    | 'ai_chat'
    | 'document_generated'
    | 'court_session'
    | 'decision_tree'
    | 'scenario'
    | 'calculator'
    | 'manual_entry'
  title: string
  description: string
  xp: number
  timestamp: string
}

export function notifyStatsUpdated(detail?: Partial<ActivityRecord>) {
  if (typeof window === 'undefined') return
  try {
    const event = new CustomEvent('stats-updated', {
      detail: {
        timestamp: new Date().toISOString(),
        ...detail,
      },
    })
    window.dispatchEvent(event)
  } catch (err) {
    console.warn('notifyStatsUpdated error:', err)
  }
}

/**
 * Legacy compatibility wrapper that forwards to the realtime event
 */
export function trackUserActivity(
  type: ActivityRecord['type'],
  title: string,
  description: string,
  xpEarned: number = 10
) {
  notifyStatsUpdated({
    id: Date.now().toString(),
    type,
    title,
    description,
    xp: xpEarned,
    timestamp: new Date().toISOString(),
  })
}
