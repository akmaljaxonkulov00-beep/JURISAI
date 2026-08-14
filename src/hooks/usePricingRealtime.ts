'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'

/**
 * pricing_plans jadvalida o'zgarish bo'lsa (admin narx/limit tahrirlasa),
 * berilgan callback'ni chaqiradi — landing, premium va to'lov sahifalari
 * realtime yangilanadi.
 */
export function usePricingRealtime(onChange: () => void) {
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    const channel = supabase
      .channel(`pricing-realtime-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'pricing_plans' },
        () => {
          cb.current()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
