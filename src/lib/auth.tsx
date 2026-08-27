import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuthStore } from './authStore'
import type { Profile } from './types'

interface AuthContextValue {
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({ signOut: async () => {}, refreshProfile: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      if (data.session) {
        setSession(data.session)
        loadProfile(data.session.user.id)
      } else {
        if (mounted) setLoading(false)
      }
    }).catch(err => {
      console.warn("Supabase auth error:", err)
      if (mounted) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile(userId: string) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (existing) {
      setProfile(existing as Profile)
      setLoading(false)
      return
    }

    // First login — create profile row.
    // For OAuth sign-ins, Supabase populates user_metadata with the
    // provider's name and avatar. Different providers use slightly
    // different field names, so check the common variants.
    const { data: userData } = await supabase.auth.getUser()
    const u = userData.user
    if (!u) { setLoading(false); return }
    const meta = u.user_metadata ?? {}
    const fullName =
      (meta.full_name as string) ??
      (meta.name as string) ??
      (meta.user_name as string) ??
      null
    const avatarUrl =
      (meta.avatar_url as string) ??
      (meta.picture as string) ??
      null
    const { data: created, error } = await supabase
      .from('profiles')
      .insert({ id: u.id, email: u.email ?? '', name: fullName, avatar_url: avatarUrl })
      .select('*')
      .single()
    if (!error && created) setProfile(created as Profile)
    setLoading(false)
  }

  const refreshProfile = async () => {
    const { user } = useAuthStore.getState()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) setProfile(data as Profile)
  }

  const signOut = async () => {
    try { await supabase.auth.signOut() } catch (err) { console.warn(err) }
    setProfile(null)
  }

  return <AuthContext.Provider value={{ signOut, refreshProfile }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
