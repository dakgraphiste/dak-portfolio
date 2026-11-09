// Convertit les images de images-src/ en WebP optimisés dans public/images/projets/
// - <nom>.webp     : grande taille (largeur d'origine, max 1600 px)
// - <nom>-480.webp : petite taille pour les vignettes
// Lancer : npm run images (aussi exécuté automatiquement avant chaque build)
import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'images-src';
const OUT = 'public/images/projets';
await mkdir(OUT, { recursive: true });

for (const file of await readdir(SRC)) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
  const name = path.parse(file).name;
  const input = path.join(SRC, file);
  const srcTime = (await stat(input)).mtimeMs;
  const targets = [[`${name}.webp`, 1600, 80], [`${name}-480.webp`, 480, 74]];
  for (const [out, width, quality] of targets) {
    const dest = path.join(OUT, out);
    try { if ((await stat(dest)).mtimeMs >= srcTime) continue; } catch {}
    await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality, effort: 5 }).toFile(dest);
  }
}
console.log('Images optimisées.');
