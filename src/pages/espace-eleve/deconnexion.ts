export const prerender = false;
import type { APIRoute } from 'astro';
import { userClient } from '../../lib/supabase';
import { portalReady } from '../../lib/env';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (portalReady()) await userClient(request, cookies).auth.signOut();
  return redirect('/espace-eleve/connexion', 303);
};
