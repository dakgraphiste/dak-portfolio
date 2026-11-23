// Planche d'aperçu : node sheet.cjs <sortie.png> <hauteur> <img1> <img2> ...
const sharp = require('/home/user/dak-portfolio/node_modules/sharp');
(async () => {
  const [out, h, ...files] = process.argv.slice(2);
  const H = Number(h); const parts = []; let x = 0;
  for (const f of files) {
    const buf = await sharp(f).resize({ height: H }).flatten({ background: '#777777' }).toBuffer();
    const m = await sharp(buf).metadata();
    parts.push({ input: buf, left: x, top: 0 }); x += m.width + 12;
  }
  await sharp({ create: { width: x, height: H, channels: 3, background: '#777777' } }).composite(parts).png().toFile(out);
})();
