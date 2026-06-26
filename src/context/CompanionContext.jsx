import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const CompanionContext = createContext(null)

const DEFAULTS = { eye: 'gba', gender: 'male', element: 'fire' }

export function CompanionProvider({ children }) {
  const [companion, setCompanion] = useState(null) // null = not found / not loaded
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    async function loadForUser(userId) {
      if (!userId) { setLoading(false); return }
      try {
        const { data } = await supabase
          .from('companions')
          .select('eye, gender, element')
          .eq('user_id', userId)
          .maybeSingle()
        setCompanion(data ?? null)
      } catch {
        setCompanion(null)
      }
      setLoading(false)
    }

    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { setLoading(false); return }
      loadForUser(session.user.id)
    })

    // React to future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setLoading(true)
        loadForUser(session?.user?.id)
      } else if (event === 'SIGNED_OUT') {
        setCompanion(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Calls the idempotent create_companion RPC; on conflict returns existing row.
  const createCompanion = useCallback(async (eye, gender, element) => {
    try {
      const { data, error } = await supabase.rpc('create_companion', {
        p_eye: eye, p_gender: gender, p_element: element,
      })
      if (error) return { error }
      setCompanion(data)
      return { data }
    } catch (err) {
      return { error: err }
    }
  }, [])

  // Merged companion: if loaded, use it; otherwise use defaults so EggCanvas never renders empty.
  const resolved = companion
    ? { ...DEFAULTS, ...companion }
    : DEFAULTS

  return (
    <CompanionContext.Provider value={{ companion, resolved, loading, createCompanion }}>
      {children}
    </CompanionContext.Provider>
  )
}

export function useCompanion() {
  const ctx = useContext(CompanionContext)
  if (!ctx) throw new Error('useCompanion must be inside CompanionProvider')
  return ctx
}
