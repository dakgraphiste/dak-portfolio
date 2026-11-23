// charte.html -> PDF (pages 1600x900) + aperçu PNG de chaque page
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto('file://' + path.resolve(__dirname, 'charte.html'), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  await p.pdf({ path: path.resolve(__dirname, 'out', 'krokup-charte-graphique.pdf'), width: '1600px', height: '900px', printBackground: true, preferCSSPageSize: true });
  const pages = await p.$$('.pg');
  for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: path.resolve(__dirname, 'out', `page-${String(i + 1).padStart(2, '0')}.png`) });
  console.log('pages', pages.length);
  await b.close();
})();
