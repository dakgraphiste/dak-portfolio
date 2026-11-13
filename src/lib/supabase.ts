// Clients Supabase côté serveur. La session de l'élève est gardée dans des cookies httpOnly.
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { env } from './env';

/** Client « au nom de l'élève » : soumis aux règles de sécurité (RLS) de la base. */
export function userClient(request: Request, cookies: AstroCookies) {
  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get('Cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' })),
      setAll: (list) => list.forEach(({ name, value, options }) => cookies.set(name, value, { ...options, path: '/', httpOnly: true, secure: true, sameSite: 'lax' })),
    },
  });
}

/** Client « serveur » : contourne les règles, réservé aux paiements, aux accès et à l'administration. */
export function adminClient() {
  return createClient(env.supabaseUrl!, env.supabaseServiceKey!, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** L'élève connecté (vérifié auprès de Supabase), ou null. */
export async function currentUser(request: Request, cookies: AstroCookies) {
  const sb = userClient(request, cookies);
  const { data } = await sb.auth.getUser();
  return { sb, user: data.user ?? null };
}
