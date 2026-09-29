import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string

if (!url || !anonKey) {
  console.warn('Missing Supabase env vars. Supabase client is unconfigured.')
}

const finalUrl = url || ''
const finalAnonKey = anonKey || ''

export const supabase = createClient(finalUrl || 'https://placeholder.supabase.co', finalAnonKey || 'placeholder', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const SUPABASE_URL = finalUrl
export const SUPABASE_ANON_KEY = finalAnonKey

export async function callEdgeFunction<T = unknown>(name: string, body: unknown): Promise<T> {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Invalid edge function name.')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('The application is not configured for server requests.')
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 60_000)
  let res: Response
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeout)
  }
  let json: unknown
  try { json = await res.json() } catch { throw new Error(`Invalid response from ${name} (${res.status})`) }
  if (!res.ok) {
    const errorBody = json && typeof json === 'object' ? json as { error?: string; code?: string } : {}
    const msg = errorBody.error || `Request to ${name} failed (${res.status})`
    const err = new Error(msg) as Error & { status?: number; code?: string }
    err.status = res.status
    err.code = errorBody.code
    throw err
  }
  return json as T
}
