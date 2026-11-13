// Retour des liens envoyés par e-mail (confirmation d'adresse, mot de passe oublié)
export const prerender = false;
import type { APIRoute } from 'astro';
import { userClient } from '../../../lib/supabase';
import { safeNext } from '../../../lib/portal';
import { portalReady } from '../../../lib/env';

export const GET: APIRoute = async ({ request, cookies, url, redirect }) => {
  if (!portalReady()) return redirect('/espace-eleve', 303);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));
  if (code) {
    const { error } = await userClient(request, cookies).auth.exchangeCodeForSession(code);
    if (!error) return redirect(next, 303);
  }
  return redirect('/espace-eleve/connexion?info=lien-expire', 303);
};
