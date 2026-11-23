// Dak Studio School · Brand identity · Leçon 1 « Lire un brief client » (fil rouge Krok'up)
// Vidéo de cours : diapositives animées calées sur la voix off (docs/vo_timing.json). Fonction pure du temps.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, font, text, fill, cover, rrect, wobble } = M;

const C = { o: '#FF5A1F', k: '#0A0A0A', cream: '#F4EFE9', w: '#FFFFFF', g: '#77716B', line: '#E2DAD2', green: '#1F9D55' };
const D = 'Display', UI = 'UI';
// début de chaque phrase de la voix off (s)
const S = [1.6, 15.822, 28.373, 43.144, 55.355, 72.764, 86.83, 98.649, 110.86, 125.631];
const END = 150.6;
const PERIOD = 0.714285;
const b = (t) => t / PERIOD;

const HITS = [
  [b(S[0] + 0.2), 'titre', 'impact', { gain: 0.5 }],
  ...S.slice(1).map((s, i) => [b(s - 0.25), `diapo ${i + 2}`, 'whoosh', { len: 0.45, gain: 0.5 }]),
  ...[2.4, 7.2].map((d, i) => [b(S[2] + d), 'info', 'pop', { pitch: ['C6', 'D6'][i] }]),
  ...[0.2, 5.8].map((d, i) => [b(S[3] + d), 'info', 'pop', { pitch: ['E6', 'F6'][i] }]),
  ...[0.2, 5.4, 12.6].map((d, i) => [b(S[4] + d), 'info', 'pop', { pitch: ['G6', 'A6', 'C7'][i] }]),
  [b(S[6] + 5.6), 'rayon', 'thud'],
  [b(END - 4), 'fin', 'bell', { pitch: 'C6' }],
];

const IM = {};
const sp = (t, t0, cfg = SPRING.bouncy) => (t < t0 ? 0 : spring(t - t0, cfg));
const ap = (t, t0, d = 0.6) => E.outQuint(prog(t, t0, t0 + d));
function T(ctx, str, x, y, size, color, { w = 800, fam = UI, align = 'left', a = 1, dy = 0 } = {}) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); text(ctx, str, x, y + dy, font(size, w, fam), color, align); ctx.restore();
}
function rise(ctx, str, x, y, size, color, t, t0, o = {}) { const a = ap(t, t0); T(ctx, str, x, y, size, color, { ...o, a, dy: (1 - a) * 30 }); }
function box(ctx, x, y, w, h, color, r = 24, shadow = 0) {
  ctx.save(); if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.16)'; ctx.shadowBlur = shadow; ctx.shadowOffsetY = shadow * 0.35; }
  rrect(ctx, x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
function pill(ctx, str, x, y, size, bg, fg, a = 1) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); ctx.font = font(size, 800, UI);
  const w = ctx.measureText(str).width + size * 1.4, h = size * 2;
  box(ctx, x, y - h * 0.68 + (1 - a) * 20, w, h, bg, h / 2); text(ctx, str, x + size * 0.7, y + (1 - a) * 20, font(size, 800, UI), fg); ctx.restore(); return w;
}
function photo(ctx, img, x, y, w, h, t, t0, { fx = 0.5, fy = 0.5, zoom = 1 } = {}) {
  const k = sp(t, t0, SPRING.gentle); if (k <= 0 || !img) return;
  const z = zoom * (1.06 / 1) ** (1 - prog(t, t0, t0 + 14)); // lent travelling avant
  ctx.save(); ctx.translate(0, (1 - k) * 120); ctx.globalAlpha = clamp(k * 1.4);
  box(ctx, x - 12, y - 12, w + 24, h + 24, C.w, 30, 50); cover(ctx, img, x, y, w, h, { fx, fy, zoom: z, radius: 22 }); ctx.restore();
}
function qhead(ctx, t, t0, n, q) {
  const k = sp(t, t0 + 0.1, SPRING.bouncy);
  ctx.save(); ctx.translate(140, 330); ctx.scale(k, k); ctx.beginPath(); ctx.arc(0, 0, 62, 0, Math.PI * 2); ctx.fillStyle = C.o; ctx.fill();
  text(ctx, String(n), 0, 24, font(70, 800, D), C.w, 'center'); ctx.restore();
  rise(ctx, `QUESTION ${n}`, 230, 300, 26, C.o, t, t0 + 0.2, { w: 800 });
  rise(ctx, q, 226, 372, 66, C.k, t, t0 + 0.35, { fam: D });
}

// ---------------------------------------------------------------- diapositives
const KT = '#FA4D00', KC = '#48261D';
const SEVEN = [['1', 'L’entreprise', 'Quoi, depuis quand, où ?'], ['2', 'Le problème', 'Pourquoi maintenant ?'], ['3', 'La cible', 'Âge, mode de vie, achats'], ['4', 'La concurrence', 'Qui est à côté en rayon ?'], ['5', 'Le positionnement', 'En quoi différente ?'], ['6', 'Les livrables', 'Logo seul ou tout le système ?'], ['7', 'Budget et délai', 'Combien, pour quand ?']];
// grille des 7 infos ; when[i] = instant d'apparition (s) ou null
function grid7(ctx, t, when, hi = -1) {
  SEVEN.forEach(([n, a, q], i) => {
    const t0 = when[i]; if (t0 == null) return; const k = sp(t, t0, SPRING.snappy); if (k <= 0) return;
    const col = i % 4, row = Math.floor(i / 4), x = 140 + col * 410, y = 470 + row * 250;
    ctx.save(); ctx.translate(x + 190, y + 105); ctx.scale(k, k); ctx.translate(-190, -105);
    box(ctx, 0, 0, 380, 210, i === hi ? C.o : C.w, 24, 26);
    ctx.beginPath(); ctx.arc(52, 56, 30, 0, Math.PI * 2); ctx.fillStyle = i === hi ? C.w : C.k; ctx.fill();
    text(ctx, n, 52, 70, font(36, 800, D), i === hi ? C.o : C.w, 'center');
    text(ctx, a, 30, 140, font(a.length > 15 ? 23 : 27, 800, D), i === hi ? C.w : C.k); text(ctx, q, 30, 184, font(24, 600, UI), i === hi ? C.w : C.g);
    ctx.restore();
  });
}
const SLIDES = [
  // 0 · titre
  (ctx, t) => {
    fill(ctx, C.k);
    const g = ctx.createRadialGradient(W * 0.85, H * 0.95, 50, W * 0.85, H * 0.95, 900); g.addColorStop(0, 'rgba(255,90,31,.55)'); g.addColorStop(1, 'rgba(255,90,31,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    rise(ctx, 'DAK STUDIO SCHOOL · BRAND IDENTITY · INTERMÉDIAIRE', 140, 250, 28, C.o, t, S[0] + 0.1);
    rise(ctx, 'Leçon 1', 132, 420, 150, C.w, t, S[0] + 0.3, { fam: D });
    rise(ctx, 'Lire un brief', 132, 560, 110, C.w, t, S[0] + 0.6, { fam: D });
    rise(ctx, 'client.', 132, 680, 110, C.o, t, S[0] + 0.8, { fam: D });
    const k = sp(t, S[0] + 8.6, SPRING.bouncy);
    place(ctx, IM.logoB, 1500, 560, 430, k, -0.06 + 0.02 * wobble(t - S[0] - 8.6));
    rise(ctx, 'Fil rouge du cours : Krok’up', 1290, 860, 32, C.w, t, S[0] + 9.4, { w: 800 });
  },
  // 1 · le contrat créatif
  (ctx, t) => {
    fill(ctx, C.cream); const t0 = S[1];
    rise(ctx, 'LE BRIEF', 140, 240, 28, C.o, t, t0 + 0.2);
    rise(ctx, 'C’est le contrat', 136, 360, 100, C.k, t, t0 + 0.4, { fam: D });
    rise(ctx, 'créatif.', 136, 480, 100, C.o, t, t0 + 0.8, { fam: D });
    rise(ctx, 'Tout ce que tu dessines doit y répondre.', 140, 590, 46, C.k, t, t0 + 2.6, { w: 800 });
    const k = sp(t, t0 + 5.6, SPRING.bouncy);
    if (k > 0) { ctx.save(); ctx.translate(140, 680); ctx.scale(k, k); box(ctx, 0, 0, 1180, 190, C.k, 26); T(ctx, 'LE CLIENT TE DONNE RAREMENT UN BRIEF COMPLET', 44, 66, 24, C.o); T(ctx, 'À toi de le compléter, en posant les bonnes questions.', 44, 136, 38, C.w, { w: 800 }); ctx.restore(); }
    // fiche de brief stylisée
    const f = sp(t, t0 + 1.2, SPRING.gentle);
    if (f > 0) { ctx.save(); ctx.translate(1560, 360 + (1 - f) * 300); ctx.rotate(0.05); ctx.globalAlpha = clamp(f * 1.5);
      box(ctx, -170, -220, 340, 440, C.w, 20, 40); T(ctx, 'BRIEF', -120, -150, 30, C.o, { fam: D });
      for (let i = 0; i < 7; i++) { box(ctx, -120, -110 + i * 44, 240 - (i % 3) * 50, 14, '#E8E1DA', 7); }
      ctx.restore(); }
  },
  // 2 · infos 1-2
  (ctx, t) => { fill(ctx, C.cream); const t0 = S[2]; rise(ctx, 'AVANT DE DESSINER', 140, 240, 28, C.o, t, t0 + 0.2); rise(ctx, '7 informations à obtenir', 136, 350, 84, C.k, t, t0 + 0.4, { fam: D }); grid7(ctx, t, [t0 + 2.4, t0 + 7.2, null, null, null, null, null], t < t0 + 7.2 ? 0 : 1); },
  // 3 · infos 3-4
  (ctx, t) => { fill(ctx, C.cream); const t0 = S[3]; rise(ctx, 'AVANT DE DESSINER', 140, 240, 28, C.o, t, t0 - 5); rise(ctx, '7 informations à obtenir', 136, 350, 84, C.k, t, t0 - 5, { fam: D }); grid7(ctx, t, [t0 - 5, t0 - 5, t0 + 0.2, t0 + 5.8, null, null, null], t < t0 + 5.8 ? 2 : 3); },
  // 4 · infos 5-7
  (ctx, t) => { fill(ctx, C.cream); const t0 = S[4]; rise(ctx, 'AVANT DE DESSINER', 140, 240, 28, C.o, t, t0 - 5); rise(ctx, '7 informations à obtenir', 136, 350, 84, C.k, t, t0 - 5, { fam: D }); grid7(ctx, t, [t0 - 5, t0 - 5, t0 - 5, t0 - 5, t0 + 0.2, t0 + 5.4, t0 + 12.6], t < t0 + 5.4 ? 4 : t < t0 + 12.6 ? 5 : 6); },
  // 5 · Krok'up : la fiche
  (ctx, t) => {
    fill(ctx, KT); const t0 = S[5];
    rise(ctx, 'NOTRE FIL ROUGE', 140, 220, 28, '#FFF370', t, t0 + 0.2);
    rise(ctx, 'Krok’up', 136, 330, 100, C.w, t, t0 + 0.4, { fam: D });
    const rows = [['LE PRODUIT', 'Des snacks croustillants', 2.6], ['LA SITUATION', 'Une marque qui se lance', 4.4], ['LA CIBLE', 'Les 15-30 ans urbains', 6.6], ['LES MOMENTS', 'Entre amis, devant un match, après les cours', 8.6]];
    rows.forEach(([k2, v, d], i) => { const k = sp(t, t0 + d, SPRING.snappy); if (k <= 0) return; const y = 400 + i * 140, x = lerp(-1200, 140, k); box(ctx, x, y, 1020, 118, C.w, 22, 26); T(ctx, k2, x + 36, y + 46, 22, KT); T(ctx, v, x + 36, y + 96, 36, KC, { w: 800 }); });
    photo(ctx, IM.main, 1260, 200, 520, 700, t, t0 + 1.4, { fy: 0.3 });
  },
  // 6 · le problème : le rayon
  (ctx, t) => {
    fill(ctx, KC); const t0 = S[6];
    rise(ctx, 'CE QUE VEUT LE CLIENT', 140, 220, 28, '#FFB024', t, t0 + 0.2);
    ['Fun', 'Gourmande', 'BRUYANTE !'].forEach((w, i) => pill(ctx, w, 140 + [0, 180, 470][i], 320, 40, i === 2 ? KT : '#FFEDE3', i === 2 ? C.w : KC, ap(t, t0 + 1 + i * 1.2)));
    photo(ctx, IM.rayon, 140, 420, 1000, 520, t, t0 + 4.6, { fx: 0.4 });
    rise(ctx, 'LE PROBLÈME', 1240, 520, 26, '#FFB024', t, t0 + 5.4);
    rise(ctx, 'En rayon, tout', 1236, 600, 56, C.w, t, t0 + 5.6, { fam: D });
    rise(ctx, 'se ressemble.', 1236, 670, 56, C.w, t, t0 + 5.9, { fam: D });
    const k = sp(t, t0 + 8.4, SPRING.wobbly);
    if (k > 0) { ctx.save(); ctx.translate(1480, 820); ctx.rotate(-0.05); ctx.scale(k, k); box(ctx, -300, -60, 600, 120, KT, 60); text(ctx, 'Mission : se démarquer', 0, 14, font(30, 800, D), C.w, 'center'); ctx.restore(); }
  },
  // 7 · les questions à poser
  (ctx, t) => {
    fill(ctx, C.cream); const t0 = S[7];
    rise(ctx, 'IL MANQUE DES INFOS ?', 140, 230, 28, C.o, t, t0 + 0.2);
    rise(ctx, 'Prépare tes questions.', 136, 340, 84, C.k, t, t0 + 1.6, { fam: D });
    const qs = [['Quel prix de vente ?', 4.2], ['Quels points de vente ?', 5.6], ['Combien de saveurs au lancement ?', 7], ['Quel budget, et pour quand ?', 8.6]];
    qs.forEach(([q, d], i) => { const k = sp(t, t0 + d, SPRING.bouncy); if (k <= 0) return; const x = 140 + (i % 2) * 820, y = 440 + Math.floor(i / 2) * 210; ctx.save(); ctx.translate(x + 380, y + 85); ctx.scale(k, k); ctx.translate(-380, -85); box(ctx, 0, 0, 760, 170, C.w, 26, 26); T(ctx, '?', 50, 112, 90, C.o, { fam: D }); T(ctx, q, 130, 102, 38, C.k, { w: 800 }); ctx.restore(); });
  },
  // 8 · exercice
  (ctx, t) => {
    fill(ctx, C.o); const t0 = S[8];
    rise(ctx, 'EXERCICE', 140, 220, 30, C.k, t, t0 + 0.1);
    rise(ctx, 'À toi maintenant !', 132, 340, 110, C.w, t, t0 + 0.3, { fam: D });
    const steps = [['1', 'Télécharge la fiche « Questionnaire de brief » sous la vidéo.'], ['2', 'Remplis-la pour Krok’up, en complétant ce qui manque.'], ['3', 'Écris les 5 questions à poser au premier rendez-vous.']];
    steps.forEach(([n, s2], i) => {
      const k = sp(t, t0 + [1.6, 5.4, 9.4][i], SPRING.snappy); if (k <= 0) return;
      const y = 440 + i * 170, x = lerp(-1500, 140, k);
      box(ctx, x, y, 1580, 140, C.w, 24, 30);
      ctx.beginPath(); ctx.arc(x + 80, y + 70, 42, 0, Math.PI * 2); ctx.fillStyle = C.k; ctx.fill(); text(ctx, n, x + 80, y + 88, font(48, 800, D), C.w, 'center');
      T(ctx, s2, x + 160, y + 86, 38, C.k, { w: 800 });
    });
  },
  // 9 · récap + fin
  (ctx, t) => {
    fill(ctx, C.k); const t0 = S[9];
    const outro = prog(t, END - 4.4, END - 3.6);
    ctx.save(); ctx.globalAlpha = 1 - outro;
    rise(ctx, 'À RETENIR', 140, 210, 30, C.o, t, t0 + 0.2);
    const pts = ['Pas de dessin avant un brief complet.', '7 infos : entreprise, problème, cible, concurrence,', 'positionnement, livrables, budget et délai.', 'Des questions avant des réponses.'];
    pts.forEach((p, i) => { const a = ap(t, t0 + [1.4, 4, 4, 12][i]); if (a <= 0) return; if (i !== 2) { ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.arc(160, 315 + i * 100, 14, 0, Math.PI * 2); ctx.fillStyle = C.o; ctx.fill(); ctx.restore(); } T(ctx, p, 200, 332 + i * 100, 48, C.w, { w: 800, a, dy: (1 - a) * 20 }); });
    const k = sp(t, t0 + 16.4, SPRING.snappy);
    if (k > 0) { box(ctx, 140, 760 + (1 - k) * 80, 1200, 150, '#1C1C1C', 26); T(ctx, 'PROCHAINE LEÇON', 190, 822 + (1 - k) * 80, 24, C.o); T(ctx, 'La plateforme de marque →', 190, 880 + (1 - k) * 80, 48, C.w, { fam: D }); }
    ctx.restore();
    if (outro > 0) {
      const e = sp(t, END - 3.9, SPRING.bouncy);
      ctx.save(); ctx.translate(W / 2, H / 2 - 30); ctx.scale(e, e);
      ctx.font = font(110, 800, D); const wd = ctx.measureText('dak').width, wg = ctx.measureText('graphiste').width, x0 = -(wd + 34 + wg) / 2; text(ctx, 'dak', x0, 40, font(110, 800, D), C.w, 'left'); ctx.beginPath(); ctx.arc(x0 + wd + 17, 30, 13, 0, Math.PI * 2); ctx.fillStyle = C.o; ctx.fill(); text(ctx, 'graphiste', x0 + wd + 34, 40, font(110, 800, D), C.w, 'left');
      ctx.restore();
      T(ctx, 'DAK STUDIO SCHOOL', W / 2, H / 2 + 110, 30, C.o, { align: 'center', a: ap(t, END - 3.2) });
    }
  },
];
function place(ctx, img, cx, cy, w, s = 1, rot = 0) { if (!img || s <= 0) return; const h = (w * img.height) / img.width; ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore(); }

// habillage commun : barre de progression + bandeau de leçon
function chrome(ctx, t, i) {
  const dark = [0, 5, 6, 9].includes(i);
  ctx.fillStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)'; ctx.fillRect(0, 0, W, 8);
  ctx.fillStyle = C.o; ctx.fillRect(0, 0, W * clamp(t / END), 8);
  if (i > 0 && t < END - 4.4) {
    ctx.save(); ctx.globalAlpha = 0.85;
    text(ctx, 'DAK STUDIO SCHOOL · BRAND IDENTITY · LEÇON 1 · LIRE UN BRIEF CLIENT', 140, H - 46, font(20, 800, UI), i === 8 ? C.k : dark ? '#9A938C' : C.g);
    text(ctx, `${i + 1} / ${S.length}`, W - 140, H - 46, font(20, 800, UI), i === 8 ? C.k : dark ? '#9A938C' : C.g, 'right');
    ctx.restore();
  }
}

M.film({
  fonts: [font(80, 800, D), font(80, 700, D), font(40, 400, UI), font(40, 600, UI), font(40, 800, UI)],
  images: { logoB: 'assets/img/logo_b.svg', main: 'assets/img/m2_main.jpg', rayon: 'assets/img/m3_rayon.jpg' },
  hits: HITS,
  samples: 8,
  draw(ctx, u, t, IMG) {
    Object.assign(IM, IMG);
    let i = S.length - 1; while (i > 0 && t < S[i] - 0.45) i--;
    const tIn = S[i] - 0.45, p = i > 0 ? E.inOutCubic(prog(t, tIn, tIn + 0.5)) : 1;
    if (p < 1 && i > 0) {
      ctx.save(); ctx.translate(-W * p, 0); SLIDES[i - 1](ctx, t); ctx.restore();
      ctx.save(); ctx.translate(W * (1 - p), 0); SLIDES[i](ctx, t); ctx.restore();
    } else SLIDES[i](ctx, t);
    chrome(ctx, t, i);
  },
});
