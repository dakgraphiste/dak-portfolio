// Rend chaque [data-board] d'un fichier HTML en PNG (out/<nom>.png)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 5000, height: 3000 } });
  await p.goto('file://' + path.resolve(__dirname, process.argv[2] || 'boards.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  for (const el of await p.$$('[data-board]')) {
    const n = await el.getAttribute('data-board');
    const tr = (await el.getAttribute('data-transparent')) !== null;
    if (tr) await p.evaluate(() => { document.body.style.background = 'transparent'; });
    await el.screenshot({ path: path.resolve(__dirname, 'out', n + '.png'), omitBackground: tr });
    if (tr) await p.evaluate(() => { document.body.style.background = '#888'; });
    console.log(n);
  }
  await b.close();
})();
