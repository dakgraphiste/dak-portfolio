// Notification de paiement envoyée par les serveurs CinetPay.
// On ne lit que l'identifiant de transaction : le statut réel est toujours redemandé à CinetPay (lib/settle).
export const prerender = false;
import type { APIRoute } from 'astro';
import { settle } from '../../../lib/settle';
import { portalReady, paymentsReady } from '../../../lib/env';

// CinetPay vérifie que l'adresse répond avant d'envoyer la notification
export const GET: APIRoute = () => new Response('OK');

export const POST: APIRoute = async ({ request }) => {
  if (!portalReady() || !paymentsReady()) return new Response('OK');
  let tx = '';
  try {
    const type = request.headers.get('content-type') || '';
    if (type.includes('json')) tx = String((await request.json())?.cpm_trans_id || '');
    else tx = String((await request.formData()).get('cpm_trans_id') || '');
  } catch { /* corps illisible : rien à faire */ }
  if (tx) await settle(tx);
  return new Response('OK');
};
