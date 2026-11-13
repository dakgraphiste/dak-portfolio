// Refuse les formulaires envoyés depuis un autre site vers les pages serveur (protection CSRF).
// Exceptions : les deux adresses appelées par CinetPay, qui ne modifient rien d'elles-mêmes
// (elles se contentent de redemander le statut du paiement à CinetPay).
import { defineMiddleware } from 'astro:middleware';

const SAFE = ['GET', 'HEAD', 'OPTIONS'];
const FORM = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
const EXEMPT = ['/espace-eleve/paiement/retour', '/api/cinetpay/notification'];

export const onRequest = defineMiddleware((ctx, next) => {
  const { request, url, isPrerendered } = ctx;
  if (isPrerendered || SAFE.includes(request.method) || EXEMPT.some((p) => url.pathname.replace(/\/$/, '') === p)) return next();
  const type = (request.headers.get('content-type') || '').toLowerCase();
  if (type && !FORM.some((f) => type.includes(f))) return next();
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return new Response('Formulaire refusé', { status: 403 });
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return new Response('Formulaire refusé', { status: 403 });
  return next();
});
