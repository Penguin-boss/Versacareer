import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from './types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  setUser: (u: User | null) => void
  setSession: (s: Session | null) => void
  setProfile: (p: Profile | null) => void
  setLoading: (b: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}))
