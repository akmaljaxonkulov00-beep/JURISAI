'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'

export type RealtimeStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'

interface RealtimeSyncOptions {
  userId?: string
  onXpChange?: () => void
  onCourtChange?: () => void
  onNotification?: (notification: any) => void
  onAchievement?: (achievement: any) => void
}

/**
 * Platform-wide Realtime synchronization hook.
 * Manages channel lifecycle, auto-reconnects, and triggers live updates across clients.
 */
export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const [status, setStatus] = useState<RealtimeStatus>('CONNECTING')
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    if (!supabase || typeof window === 'undefined') return

    const channelName = options.userId
      ? `user_live_channel_${options.userId}`
      : `platform_live_channel_${Math.random().toString(36).substring(2, 9)}`

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true },
      },
    })

    // Listen to broadcast events
    channel
      .on('broadcast', { event: 'xp_updated' }, () => {
        optionsRef.current.onXpChange?.()
      })
      .on('broadcast', { event: 'court_session_completed' }, () => {
        optionsRef.current.onCourtChange?.()
      })
      .on('broadcast', { event: 'new_achievement' }, payload => {
        optionsRef.current.onAchievement?.(payload.payload)
      })
      .on('broadcast', { event: 'notification' }, payload => {
        optionsRef.current.onNotification?.(payload.payload)
      })

    // Postgres Changes subscriptions if table publication is enabled
    if (options.userId) {
      try {
        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'user_notifications',
              filter: `user_id=eq.${options.userId}`,
            },
            payload => {
              optionsRef.current.onNotification?.(payload.new)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'achievements',
              filter: `user_id=eq.${options.userId}`,
            },
            payload => {
              optionsRef.current.onAchievement?.(payload.new)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'court_sessions',
              filter: `user_id=eq.${options.userId}`,
            },
            () => {
              optionsRef.current.onCourtChange?.()
            }
          )
      } catch (err) {
        console.warn('Realtime postgres_changes registration note:', err)
      }
    }

    channel.subscribe(subscriptionStatus => {
      if (subscriptionStatus === 'SUBSCRIBED') {
        setStatus('CONNECTED')
      } else if (subscriptionStatus === 'CLOSED' || subscriptionStatus === 'TIMED_OUT') {
        setStatus('DISCONNECTED')
      } else if (subscriptionStatus === 'CHANNEL_ERROR') {
        setStatus('ERROR')
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [options.userId])

  return { status }
}
