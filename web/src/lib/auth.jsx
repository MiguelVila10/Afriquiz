import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ready, setReady] = useState(false)

  const loadProfile = useCallback(async (s) => {
    if (!s?.user) {
      setProfile(null)
      setIsAdmin(false)
      return
    }
    const [{ data: p }, { data: admin }] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, bio, created_at').eq('id', s.user.id).maybeSingle(),
      supabase.rpc('is_admin'),
    ])
    setProfile(p ?? null)
    setIsAdmin(admin === true)
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session)
      if (active) setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      // adiar para fora do callback (recomendação do supabase-js)
      setTimeout(() => loadProfile(s), 0)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isAdmin,
    ready,
    refreshProfile: () => loadProfile(session),
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
