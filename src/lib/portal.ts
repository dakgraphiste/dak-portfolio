// Petits outils communs aux pages de l'espace élève
import type { AstroGlobal } from 'astro';
import { env } from './env';

/** Adresse de retour sûre : uniquement un chemin interne au site. */
export const safeNext = (v: string | null | undefined, fallback = '/espace-eleve') =>
  v && /^\/(?!\/)[\w\-/.?=&%:]*$/.test(v) ? v : fallback;

export const isAdmin = (email?: string | null) => !!email && env.adminEmails.includes(email.toLowerCase());

/** Les pages privées ne sont jamais mises en cache. */
export const privatePage = (Astro: AstroGlobal) => Astro.response.headers.set('Cache-Control', 'private, no-store');

export const loginUrl = (next: string) => `/espace-eleve/connexion?next=${encodeURIComponent(next)}`;
