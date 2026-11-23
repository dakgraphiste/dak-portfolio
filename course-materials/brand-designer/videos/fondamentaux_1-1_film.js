// Dak Studio School · Fondamentaux · Leçon 1 « Ce qui fait un bon visuel »
// Vidéo de cours : diapositives animées calées sur la voix off (docs/vo_timing.json). Fonction pure du temps.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, font, text, fill, cover, rrect, wobble } = M;

const C = { o: '#FF5A1F', k: '#0A0A0A', cream: '#F4EFE9', w: '#FFFFFF', g: '#77716B', line: '#E2DAD2', green: '#1F9D55' };
const D = 'Display', UI = 'UI';
// début de chaque phrase de la voix off (s)
const S = [1.6, 15.587, 30.698, 43.249, 60.109, 75.69, 92.238, 103.743, 123.556, 139.842];
const END = 159.22;
const PERIOD = 0.714285;
const b = (t) => t / PERIOD;

const HITS = [
  [b(S[0] + 0.2), 'titre', 'impact', { gain: 0.5 }],
  ...S.slice(1).map((s, i) => [b(s - 0.25), `diapo ${i + 2}`, 'whoosh', { len: 0.45, gain: 0.5 }]),
  [b(S[1] + 3.6), 'chrono', 'tick'], [b(S[2] + 2.6), 'barré', 'click'],
  [b(S[6] + 2), 'bloc', 'pop', { pitch: 'C6' }], [b(S[6] + 4.2), 'bloc', 'pop', { pitch: 'E6' }], [b(S[6] + 6.4), 'bloc', 'pop', { pitch: 'G6' }], [b(S[6] + 8.6), 'résultat', 'bell', { pitch: 'C7' }],
  [b(S[7] + 15.2), 'efficace', 'bell', { pitch: 'E6' }],
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
const SLIDES = [
  // 0 · titre
  (ctx, t) => {
    fill(ctx, C.k);
    const g = ctx.createRadialGradient(W * 0.85, H * 0.95, 50, W * 0.85, H * 0.95, 900); g.addColorStop(0, 'rgba(255,90,31,.55)'); g.addColorStop(1, 'rgba(255,90,31,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    rise(ctx, 'DAK STUDIO SCHOOL · PARCOURS BRAND DESIGNER', 140, 250, 28, C.o, t, S[0] + 0.1);
    rise(ctx, 'Leçon 1', 132, 420, 150, C.w, t, S[0] + 0.3, { fam: D });
    rise(ctx, 'Ce qui fait', 132, 560, 110, C.w, t, S[0] + 0.6, { fam: D });
    rise(ctx, 'un bon visuel.', 132, 680, 110, C.o, t, S[0] + 0.8, { fam: D });
    const a = ap(t, S[0] + 7.5);
    if (a > 0) { box(ctx, 140, 790 + (1 - a) * 30, 1000, 110, 'rgba(255,255,255,.08)', 22); ['Quoi ?', 'Pour qui ?', 'Et maintenant ?'].forEach((q, i) => pill(ctx, q, 170 + i * 300, 862, 30, C.o, C.w, ap(t, S[0] + 8.2 + i * 0.5))); }
    rise(ctx, 'Les fondamentaux du design graphique · Débutant', 140, 980, 28, '#B9B2AA', t, S[0] + 1.4, { w: 600 });
  },
  // 1 · 3 secondes
  (ctx, t) => {
    fill(ctx, C.cream); const t0 = S[1];
    rise(ctx, 'LA RÈGLE DE BASE', 140, 220, 28, C.o, t, t0 + 0.2);
    rise(ctx, 'Un bon visuel se lit en', 136, 320, 72, C.k, t, t0 + 1, { fam: D });
    // chrono 3 → 0
    const cx = 1480, cy = 640, R = 210, k = sp(t, t0 + 2.4, SPRING.bouncy);
    if (k > 0) {
      const run = prog(t, t0 + 3.6, t0 + 6.6), left = Math.max(0, 3 - Math.floor(run * 3 + 1e-6));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = C.k; ctx.fill();
      ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.strokeStyle = C.o; ctx.beginPath(); ctx.arc(0, 0, R - 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (run < 1 ? 1 - run : 1)); ctx.stroke();
      text(ctx, `${run < 1 ? Math.max(1, left) : 3} s`, 0, 60, font(170, 800, D), C.w, 'center'); ctx.restore();
    }
    ['Dans la rue', 'Sur Instagram', 'En rayon'].forEach((p, i) => pill(ctx, p, 140 + i * 300, 470, 32, C.w, C.k, ap(t, t0 + 4.6 + i * 1.2)));
    rise(ctx, 'Personne ne s’arrête longtemps.', 140, 640, 52, C.k, t, t0 + 8.6, { w: 800 });
    rise(ctx, 'Ton travail : faire passer l’idée', 140, 760, 52, C.o, t, t0 + 10.2, { w: 800 });
    rise(ctx, 'avant que le regard parte.', 140, 830, 52, C.o, t, t0 + 10.6, { w: 800 });
  },
  // 2 · message, pas décoration
  (ctx, t) => {
    fill(ctx, C.k); const t0 = S[2];
    rise(ctx, 'Un visuel, c’est un', 136, 330, 90, C.w, t, t0 + 0.2, { fam: D });
    rise(ctx, 'MESSAGE.', 136, 460, 150, C.o, t, t0 + 1.2, { fam: D });
    const a = ap(t, t0 + 2.4);
    if (a > 0) {
      T(ctx, 'pas une décoration', 140, 580, 64, '#8C857F', { w: 600, a });
      const s = E.inOutCubic(prog(t, t0 + 2.8, t0 + 3.4)); ctx.fillStyle = C.o; ctx.fillRect(132, 556, 560 * s, 8);
    }
    rise(ctx, 'Le beau compte… mais il vient après.', 140, 730, 50, C.w, t, t0 + 4.6, { w: 600 });
    const k = sp(t, t0 + 7.2, SPRING.bouncy);
    if (k > 0) { ctx.save(); ctx.translate(140, 820); ctx.scale(k, k); box(ctx, 0, 0, 1360, 130, C.o, 26); text(ctx, 'Beau + rien à dire = visuel raté', 44, 86, font(54, 800, D), C.w); ctx.restore(); }
  },
  // 3 · Quoi ?
  (ctx, t) => {
    fill(ctx, C.cream); const t0 = S[3]; qhead(ctx, t, t0, 1, 'QUOI ?');
    rise(ctx, 'Quel est le message principal ?', 140, 500, 46, C.k, t, t0 + 1.2, { w: 800 });
    photo(ctx, IM.total, 1040, 170, 760, 570, t, t0 + 3.2, { fy: 0.3 });
    pill(ctx, 'Exemple : TotalEnergies', 1040, 820, 26, C.k, C.w, ap(t, t0 + 4));
    const k = sp(t, t0 + 5.4, SPRING.bouncy);
    if (k > 0) { ctx.save(); ctx.translate(140, 590); ctx.scale(k, k); box(ctx, 0, 0, 840, 170, C.w, 24, 30); T(ctx, 'UN SEUL MESSAGE', 40, 62, 24, C.o); T(ctx, 'Gagner 1 an de carburant', 40, 128, 40, C.k, { fam: D }); ctx.restore(); }
    rise(ctx, 'Trois messages = aucun message.', 140, 900, 44, C.o, t, t0 + 12.4, { fam: D });
  },
  // 4 · Pour qui ?
  (ctx, t) => {
    fill(ctx, C.cream); const t0 = S[4]; qhead(ctx, t, t0, 2, 'POUR QUI ?');
    rise(ctx, 'À qui parle ce visuel ?', 140, 500, 46, C.k, t, t0 + 1.2, { w: 800 });
    const a = ap(t, t0 + 3.6);
    if (a > 0) { [['Étudiants', C.o], ['Banque', C.k]].forEach(([s, c], i) => { box(ctx, 140 + i * 400, 560 + (1 - a) * 30, 370, 150, c, 24); T(ctx, s, 140 + i * 400 + 185, 650 + (1 - a) * 30, 44, C.w, { fam: D, align: 'center', a }); }); T(ctx, '≠', 520, 655, 60, C.k, { fam: D, align: 'center', a }); }
    photo(ctx, IM.bud, 1040, 170, 760, 570, t, t0 + 7.6, { fy: 0.4 });
    pill(ctx, 'Exemple : Budweiser, BudFC Fan Festival', 1040, 820, 26, C.k, C.w, ap(t, t0 + 8.2));
    ['Fans de foot', 'Énergie', 'Fête', 'Match'].forEach((s, i) => pill(ctx, s, 140 + [0, 250, 450, 600][i], 830, 32, i ? C.w : C.o, i ? C.k : C.w, ap(t, t0 + 9 + i * 1.1)));
  },
  // 5 · Et maintenant ?
  (ctx, t) => {
    fill(ctx, C.cream); const t0 = S[5]; qhead(ctx, t, t0, 3, 'ET MAINTENANT ?');
    rise(ctx, 'Qu’est-ce que la personne doit faire ?', 140, 500, 46, C.k, t, t0 + 1.4, { w: 800 });
    ['Acheter', 'Venir', 'Appeler', 'Se souvenir'].forEach((s, i) => pill(ctx, s, 140 + [0, 230, 410, 620][i], 600, 34, C.w, C.k, ap(t, t0 + 5 + i * 0.8)));
    photo(ctx, IM.match, 1260, 130, 520, 650, t, t0 + 8.4, { fy: 0.85, zoom: 1.0 });
    const h = ap(t, t0 + 10.4, 0.5);
    if (h > 0) { ctx.save(); ctx.globalAlpha = h; ctx.lineWidth = 7; ctx.strokeStyle = C.o; rrect(ctx, 1266, 590, 508, 180, 16); ctx.stroke(); ctx.restore(); }
    const k = sp(t, t0 + 11, SPRING.bouncy);
    if (k > 0) { ctx.save(); ctx.translate(140, 700); ctx.scale(k, k); box(ctx, 0, 0, 1020, 170, C.k, 24); T(ctx, 'DATE · HEURE · LIEU', 40, 64, 26, C.o); T(ctx, 'On sait exactement quoi faire.', 40, 130, 36, C.w, { fam: D }); ctx.restore(); }
  },
  // 6 · la formule
  (ctx, t) => {
    fill(ctx, C.k); const t0 = S[6];
    rise(ctx, 'LA FORMULE À RETENIR', 140, 240, 28, C.o, t, t0 + 0.2);
    const items = [['Une idée', 'claire'], ['Une hiérarchie', 'évidente'], ['Une exécution', 'propre']];
    items.forEach(([a1, a2], i) => {
      const k = sp(t, t0 + 2 + i * 2.2, SPRING.bouncy); if (k <= 0) return;
      const x = 140 + i * 520; ctx.save(); ctx.translate(x + 220, 520); ctx.scale(k, k);
      box(ctx, -220, -150, 440, 300, '#1C1C1C', 28); text(ctx, a1, 0, -10, font(46, 700, D), C.w, 'center'); text(ctx, a2, 0, 60, font(56, 800, D), C.o, 'center'); ctx.restore();
      if (i < 2) T(ctx, '+', x + 480, 545, 70, C.w, { fam: D, align: 'center', a: ap(t, t0 + 2.6 + i * 2.2) });
    });
    const k = sp(t, t0 + 8.6, SPRING.wobbly);
    if (k > 0) { ctx.save(); ctx.translate(W / 2, 830); ctx.scale(k, k); box(ctx, -360, -70, 720, 140, C.o, 70); text(ctx, '= un bon visuel', 0, 22, font(64, 800, D), C.w, 'center'); ctx.restore(); }
  },
  // 7 · démo KPALO
  (ctx, t) => {
    fill(ctx, C.cream); const t0 = S[7];
    rise(ctx, 'EXERCICE GUIDÉ', 140, 170, 28, C.o, t, t0 + 0.2);
    rise(ctx, 'Campagne KPALO Énergie', 136, 250, 64, C.k, t, t0 + 0.5, { fam: D });
    photo(ctx, IM.kpalo, 140, 320, 900, 600, t, t0 + 1.2, { fx: 0.7 });
    const rows = [['QUOI ?', 'Une boisson qui donne de l’énergie', 3.4], ['POUR QUI ?', 'Les jeunes actifs, à fond', 7.2], ['ET MAINTENANT ?', 'Retenir le nom, l’acheter', 11.4]];
    rows.forEach(([q, r, d], i) => {
      const k = sp(t, t0 + d, SPRING.snappy); if (k <= 0) return;
      const y = 330 + i * 190, x = lerp(W, 1120, k);
      box(ctx, x, y, 680, 160, C.w, 22, 26); T(ctx, q, x + 36, y + 56, 24, C.o); T(ctx, r, x + 36, y + 116, 36, C.k, { w: 800 });
    });
    const st = sp(t, t0 + 15.2, SPRING.wobbly);
    if (st > 0) { ctx.save(); ctx.translate(1460, 945); ctx.rotate(-0.04); ctx.scale(st * 0.9, st * 0.9); box(ctx, -270, -56, 540, 112, C.green, 56); text(ctx, 'EFFICACE', 0, 20, font(50, 800, D), C.w, 'center'); ctx.restore(); }
  },
  // 8 · exercice
  (ctx, t) => {
    fill(ctx, C.o); const t0 = S[8];
    rise(ctx, 'EXERCICE', 140, 220, 30, C.k, t, t0 + 0.1);
    rise(ctx, 'À toi maintenant !', 132, 340, 110, C.w, t, t0 + 0.3, { fam: D });
    const steps = [['1', 'Photographie 5 affiches ou publicités autour de toi.'], ['2', 'Réponds aux 3 questions, en une phrase chacune.'], ['3', 'Classe-les et explique ton choix en 2 lignes.']];
    steps.forEach(([n, s], i) => {
      const k = sp(t, t0 + [1.6, 4.2, 8.2][i], SPRING.snappy); if (k <= 0) return;
      const y = 440 + i * 170, x = lerp(-1400, 140, k);
      box(ctx, x, y, 1500, 140, C.w, 24, 30);
      ctx.beginPath(); ctx.arc(x + 80, y + 70, 42, 0, Math.PI * 2); ctx.fillStyle = C.k; ctx.fill(); text(ctx, n, x + 80, y + 88, font(48, 800, D), C.w, 'center');
      T(ctx, s, x + 160, y + 86, 42, C.k, { w: 800 });
    });
  },
  // 9 · récap + fin
  (ctx, t) => {
    fill(ctx, C.k); const t0 = S[9];
    const outro = prog(t, END - 4.4, END - 3.6);
    ctx.save(); ctx.globalAlpha = 1 - outro;
    rise(ctx, 'À RETENIR', 140, 230, 30, C.o, t, t0 + 0.2);
    const pts = ['Un visuel = un message principal.', 'Il se lit en 3 secondes, sinon il est perdu.', 'Le beau sert le message, jamais l’inverse.'];
    pts.forEach((p, i) => { const a = ap(t, t0 + [1.6, 4.2, 6.8][i]); if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.arc(160, 345 + i * 120, 14, 0, Math.PI * 2); ctx.fillStyle = C.o; ctx.fill(); ctx.restore(); T(ctx, p, 200, 362 + i * 120, 54, C.w, { w: 800, a, dy: (1 - a) * 20 }); });
    const k = sp(t, t0 + 10.8, SPRING.snappy);
    if (k > 0) { box(ctx, 140, 760 + (1 - k) * 80, 1200, 150, '#1C1C1C', 26); T(ctx, 'PROCHAINE LEÇON', 190, 822 + (1 - k) * 80, 24, C.o); T(ctx, 'Les grandes règles de composition →', 190, 880 + (1 - k) * 80, 48, C.w, { fam: D }); }
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

// habillage commun : barre de progression + bandeau de leçon
function chrome(ctx, t, i) {
  const dark = [0, 2, 6, 9].includes(i);
  ctx.fillStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)'; ctx.fillRect(0, 0, W, 8);
  ctx.fillStyle = C.o; ctx.fillRect(0, 0, W * clamp(t / END), 8);
  if (i > 0 && t < END - 4.4) {
    ctx.save(); ctx.globalAlpha = 0.85;
    text(ctx, 'DAK STUDIO SCHOOL · LEÇON 1 · CE QUI FAIT UN BON VISUEL', 140, H - 46, font(20, 800, UI), i === 8 ? C.k : dark ? '#9A938C' : C.g);
    text(ctx, `${i + 1} / ${S.length}`, W - 140, H - 46, font(20, 800, UI), i === 8 ? C.k : dark ? '#9A938C' : C.g, 'right');
    ctx.restore();
  }
}

M.film({
  fonts: [font(80, 800, D), font(80, 700, D), font(40, 400, UI), font(40, 600, UI), font(40, 800, UI)],
  images: { total: 'assets/img/total.jpg', bud: 'assets/img/budweiser.webp', match: 'assets/img/match.jpg', kpalo: 'assets/img/kpalo1.png' },
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
