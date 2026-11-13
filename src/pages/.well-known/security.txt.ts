// security.txt généré à partir de l'adresse du site
import type { APIRoute } from 'astro';
import { SITE } from '../../data/site';
export const GET: APIRoute = ({ site }) => {
  const expires = new Date(Date.now() + 365 * 864e5).toISOString();
  return new Response(`Contact: mailto:${SITE.email}\nExpires: ${expires}\nPreferred-Languages: fr, en\nCanonical: ${new URL('.well-known/security.txt', site)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
