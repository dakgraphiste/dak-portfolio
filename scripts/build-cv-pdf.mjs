// Génère public/cv-davy-aymard-kouassi.pdf à partir de la page /cv (même contenu, une page A4).
// Usage : npm run cv   (construit le site, ouvre /cv dans Chromium et l'imprime en PDF)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // Playwright installé sur la machine (npm i -D playwright sinon)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = '.vercel/output/static';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!extname(p)) p = join(p, 'index.html');
  let body;
  try { body = await readFile(join(ROOT, p.split('?')[0])); } catch { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[extname(p)] || 'application/octet-stream' }); res.end(body);
}).listen(4811);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
await page.goto('http://localhost:4811/cv', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: 'public/cv-davy-aymard-kouassi.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close(); server.close();
console.log('CV PDF généré : public/cv-davy-aymard-kouassi.pdf');
