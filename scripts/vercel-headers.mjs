// Après « astro build » : recopie les en-têtes de sécurité de vercel.json (CSP, HSTS…) dans
// .vercel/output/config.json, pour qu'ils s'appliquent à toutes les réponses, pages serveur comprises.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const OUT = '.vercel/output/config.json';
if (!existsSync(OUT)) process.exit(0);
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const config = JSON.parse(readFileSync(OUT, 'utf8'));
const toRegex = (src) => '^' + src.replace(/\(\.\*\)/g, '(?:.*)') + '$';
const extra = (vercel.headers || []).map((h) => ({
  src: toRegex(h.source),
  headers: Object.fromEntries(h.headers.map((x) => [x.key.toLowerCase(), x.value])),
  continue: true,
}));
config.routes = [...extra, ...config.routes.filter((r) => !r.__dakHeaders)].map((r) => r);
writeFileSync(OUT, JSON.stringify(config, null, 2));
console.log(`En-têtes de sécurité ajoutés (${extra.length} règles).`);
