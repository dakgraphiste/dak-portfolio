// Vidéos hébergées sur Bunny Stream, protégées par un jeton : un lien de lecture n'est valable que 3 h
// et n'est fabriqué par le serveur que pour un élève qui a accès au cours (ou pour une leçon d'aperçu).
import { createHash } from 'node:crypto';
import { env } from './env';

export function signedEmbed(videoId: string, ttlSeconds = 3 * 3600) {
  const lib = env.bunnyLibraryId, key = env.bunnyTokenKey;
  if (!lib || !videoId) return null;
  const base = `https://iframe.mediadelivery.net/embed/${lib}/${videoId}`;
  if (!key) return `${base}?autoplay=false`;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = createHash('sha256').update(key + videoId + expires).digest('hex');
  return `${base}?token=${token}&expires=${expires}&autoplay=false`;
}
