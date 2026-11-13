// robots.txt généré à partir de l'adresse du site (astro.config.mjs) : rien à modifier ici
import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /espace-eleve\nDisallow: /api/\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
