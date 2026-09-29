import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const configuredOrigin = Deno.env.get('APP_ORIGIN') ?? 'https://versacareer.com';
const allowedOrigins = new Set([configuredOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173']);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : configuredOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

// Rate-limit state is stored in Postgres so limits apply across Edge
// instances and survive warm-instance rotation. Only a keyed digest of the
// client address is stored; raw IP addresses never enter the database.
export async function isRateLimited(req: Request, route: string, limit = 30, windowMs = 60_000): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return true;

  const forwarded = req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-real-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown';
  const material = new TextEncoder().encode(`${serviceKey}:${route}:${forwarded}`);
  const digest = await crypto.subtle.digest('SHA-256', material);
  const key = `${route}:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;

  try {
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.rpc('consume_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.ceil(windowMs / 1000),
    });
    return Boolean(error || data !== true);
  } catch {
    // Fail closed if the limiter cannot be reached.
    return true;
  }
}

export function jsonError(req: Request, message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
