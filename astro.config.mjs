import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Adresse du site : à remplacer par le nom de domaine définitif (ex. https://dakgraphiste.com)
const SITE_URL = 'https://dak-portfolio-gray.vercel.app';
const today = new Date().toISOString();

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  // pages statiques par défaut ; l'espace élève et les paiements tournent côté serveur (Vercel Functions)
  adapter: vercel(),
  // protection contre les formulaires envoyés depuis un autre site : gérée dans src/middleware.ts
  // (même règle qu'Astro, avec une exception pour le retour de paiement CinetPay)
  security: { checkOrigin: false },
  integrations: [
    sitemap({
      // pages hors référencement : 404 et showreel (pas encore de vidéo)
      filter: (page) => !/\/(404|showreel)\/?$/.test(page) && !/\/(espace-eleve|api)(\/|$)/.test(page),
      serialize: (item) => {
        // adresses sans « / » final, comme les liens canoniques des pages
        const u = new URL(item.url);
        const path = u.pathname.replace(/(.)\/$/, '$1');
        item.url = u.origin + path;
        item.lastmod = today;
        item.changefreq = path === '/' || path === '/projets' ? 'weekly' : 'monthly';
        item.priority = path === '/' ? 1 : /^\/(projets|formations|a-propos|boutique)$/.test(path) ? 0.8 : 0.6;
        return item;
      }
    })
  ]
});
