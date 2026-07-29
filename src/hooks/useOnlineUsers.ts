'use client'

// ═══════════════════════════════════════════════════════════════════════════
// useOnlineUsers.ts — Supabase Realtime presence channel
// Hozir saytda qancha foydalanuvchi borligini real-time ko'rsatish
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'

export interface OnlineUser {
  userId: string
  email: string
  name: string
  joinedAt: number
}

interface OnlineUsersState {
  count: number
  users: OnlineUser[]
  connected: boolean
  join: () => void
  leave: () => void
}

const PRESENCE_CHANNEL = 'jurisai-online-users'

export function useOnlineUsers(): OnlineUsersState {
  const [count, setCount] = useState(0)
  const [users, setUsers] = useState<OnlineUser[]>([])
  const [connected, setConnected] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const joinedRef = useRef(false)

  const join = useCallback(() => {
    if (joinedRef.current) return
    joinedRef.current = true

    // Get current user info from session
    let userId = 'anonymous'
    let email = ''
    let name = 'Mehmon'
    try {
      const stored = sessionStorage.getItem('jurisai_user') || sessionStorage.getItem('auth_user')
      if (stored) {
        const userData = JSON.parse(stored)
        userId = userData.id || userData.uid || userId
        email = userData.email || ''
        name = userData.name || userData.email?.split('@')[0] || name
      }
    } catch {}

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        // Full sync — rebuild user list
        const presenceState = channel.presenceState()
        const onlineUsers: OnlineUser[] = []

        for (const [key, presences] of Object.entries(presenceState)) {
          const presencesArray = Array.isArray(presences) ? presences : [presences]
          for (const p of presencesArray) {
            const pData = p as any
            onlineUsers.push({
              userId: key,
              email: pData.email || '',
              name: pData.name || 'Mehmon',
              joinedAt: pData.joined_at || Date.now(),
            })
          }
        }

        setUsers(onlineUsers)
        setCount(onlineUsers.length)
      })
      .on('presence', { event: 'join' }, payload => {
        // New user joined — update connected status
        setConnected(true)
      })
      .on('presence', { event: 'leave' }, payload => {
        // User left — count will be updated in sync event
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          // Track this user as present
          await channel.track({
            user_id: userId,
            email,
            name,
            joined_at: Date.now(),
            online_at: new Date().toISOString(),
          })
        } else if (status === 'CHANNEL_ERROR') {
          setConnected(false)
        }
      })

    channelRef.current = channel
  }, [])

  const leave = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.untrack()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    joinedRef.current = false
    setCount(0)
    setUsers([])
    setConnected(false)
  }, [])

  // Join presence channel on mount, leave on unmount
  useEffect(() => {
    join()
    return () => {
      leave()
    }
  }, [join, leave])

  return { count, users, connected, join, leave }
}
