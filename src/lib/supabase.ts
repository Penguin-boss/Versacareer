import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string

if (!url || !anonKey) {
  console.warn('Missing Supabase env vars. Supabase client is unconfigured.')
}

const finalUrl = url || 'https://placeholder.supabase.co'
const finalAnonKey = anonKey || 'placeholder'

export const supabase = createClient(finalUrl, finalAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const SUPABASE_URL = finalUrl
export const SUPABASE_ANON_KEY = finalAnonKey

export async function callEdgeFunction<T = any>(name: string, body: any): Promise<T> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  })
  let json: any
  try { json = await res.json() } catch { throw new Error(`Invalid response from ${name} (${res.status})`) }
  if (!res.ok) {
    const msg = json?.error || `Request to ${name} failed (${res.status})`
    const err = new Error(msg) as any
    err.status = res.status
    err.code = json?.code
    throw err
  }
  return json as T
}
