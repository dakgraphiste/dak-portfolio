// Krok'up, étude de cas : fonction pure du temps. window.seek(t) peint l'image t (lib/motion.js).
// Minutage en temps (u) sur la grille mesurée (112 bpm) ; docs/shotlist.md est le plan suivi ici.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, springKeys, SPRING, wobble, font, layout, glyph, text, fill, cover, rrect, shake, hash01, kf } = M;

// Couleurs de la marque (fichier Illustrator de Dak). Accent unique : Tangelo.
const C = { t: '#FA4D00', c: '#48261D', l: '#FFEDE3', b: '#CAE7F7', y: '#FFF370', h: '#FFB024', w: '#FFFFFF' };
const D = 'Display', UI = 'UI';

const HITS = [
  [0, 'CRAC claque', 'impact'], [2, 'logo jaillit', 'boing', { pitch: 'C5', to: 'C6' }], [4, 'titre', 'pop', { pitch: 'G5' }],
  [7.5, 'volet Linen', 'whoosh', { len: 0.5 }],
  [8, '01 brief', 'thud'], [10, 'ligne 1', 'tick'], [12, 'ligne 2', 'tick'], [14, 'ligne 3', 'tick'],
  [19.5, 'vers 02', 'whoosh', { len: 0.4 }],
  [20, '02 plateforme', 'thud'], [22, 'valeur 1', 'pop', { pitch: 'C6' }], [23, 'valeur 2', 'pop', { pitch: 'D6' }], [24, 'valeur 3', 'pop', { pitch: 'E6' }], [25, 'valeur 4', 'pop', { pitch: 'G6' }], [28, 'mission', 'tick'],
  [31.5, 'vers 03', 'whoosh', { len: 0.4 }],
  [32, '03 concurrence', 'thud'], [36, 'points du rayon', 'click'], [40, 'Krokup se pose', 'bell', { pitch: 'E6' }],
  [43.5, 'point remplit', 'whoosh', { len: 0.5, from: 400, to: 2400 }],
  [44, '04 moodboard', 'thud'], [48, 'zone 2', 'whoosh', { len: 0.4 }], [52, 'zone 3', 'whoosh', { len: 0.4 }],
  [59.5, 'vers 05', 'whoosh', { len: 0.4 }],
  [60, '05 mots cles', 'thud'], [64.3, 'KRO KUP', 'impact'], [68, 'le p sourit', 'bell', { pitch: 'G6' }],
  [72, '06 pistes', 'thud'], [75, 'critere 1', 'tick'], [77, 'critere 2', 'tick'], [79, 'critere 3', 'tick'], [80, 'piste B retenue', 'impact'],
  [84.3, '07 declinaisons', 'click'], [85.8, 'panneau 2', 'click'], [87.3, 'panneau 3', 'click'], [88.8, 'panneau 4', 'click'],
  [91.2, 'paquet 1', 'pop', { pitch: 'C6' }], [92, 'paquet 2', 'pop', { pitch: 'E6' }], [92.8, 'paquet 3', 'pop', { pitch: 'G6' }],
  [96, '08 palette', 'thud'], [97, 'colonne', 'blip', { pitch: 'C6' }], [98, 'colonne', 'blip', { pitch: 'D6' }], [99, 'colonne', 'blip', { pitch: 'E6' }], [100, 'colonne', 'blip', { pitch: 'G6' }], [103, '60-30-10', 'tick'],
  [108, '09 langage', 'thud'], [110, 'MIAMMM', 'impact'], [112, 'CRAC', 'impact'], [114, 'HUMMMM', 'impact'],
  [120, '10 situation', 'whoosh', { len: 0.4 }], [121, 'cut', 'click'], [122, 'cut', 'click'], [123, 'cut', 'click'], [124, 'cut', 'click'], [125, 'cut', 'click'], [126, 'cut', 'click'],
  [128, 'fin', 'impact'], [129, 'logo', 'bell', { pitch: 'C6' }],
];

// ------------------------------------------------------------ outils
const IMGS = {};
const sp = (u, u0, cfg = SPRING.bouncy) => (u < u0 ? 0 : springU(u, u0, cfg));
const out = (u, a, b) => E.outQuint(prog(u, a, b));
// image centrée en (cx, cy), largeur w, rotation et échelle
function place(ctx, img, cx, cy, w, { rot = 0, s = 1, a = 1, shadow = 0 } = {}) {
  if (!img || s <= 0 || a <= 0) return;
  const h = (w * img.height) / img.width;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s);
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = shadow; ctx.shadowOffsetY = shadow * 0.4; }
  ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
}
function label(ctx, str, x, y, size, color, weight = 800, align = 'left', a = 1) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); text(ctx, str, x, y, font(size, weight, UI), color, align); ctx.restore();
}
// mot en Display, lettres qui montent une par une
function word(ctx, str, x, y, size, color, u, u0, { stroke = null, sw = 0, align = 'left', rot = 0, stagger = 0.04 } = {}) {
  const f = font(size, 400, D); const L = layout(ctx, str, f, 0.01 * size);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  ctx.save(); ctx.translate(x0, y); ctx.rotate(rot);
  L.glyphs.forEach((g, j) => {
    const k = sp(u, u0 + j * stagger); if (k <= 0) return;
    if (stroke) { ctx.save(); ctx.font = f; ctx.lineJoin = 'round'; ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.translate(g.cx, (1 - k) * 120); ctx.scale(k, k); ctx.textAlign = 'center'; ctx.strokeText(g.ch, 0, 0); ctx.restore(); }
    glyph(ctx, g.ch, g.cx, (1 - k) * 120, f, color, k, k);
  });
  ctx.restore();
  return L.width;
}
// en-tête de section : numéro géant fantôme + titre
function header(ctx, u, u0, num, title, ink, ghost) {
  u0 -= 0.6;
  const k = sp(u, u0, SPRING.gentle);
  ctx.save(); ctx.globalAlpha = 0.09 * k; text(ctx, num, W - 60, 760 + (1 - k) * 200, font(720, 400, D), ghost || ink, 'right'); ctx.restore();
  label(ctx, `${num} · ÉTUDE DE CAS KROK'UP`, 110, 140, 30, ink, 900, 'left', out(u, u0, u0 + 1));
  word(ctx, title, 106, 250, 110, ink, u, u0 + 0.2);
}
function card(ctx, x, y, w, h, color, r = 28, shadow = 0) {
  ctx.save(); if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = shadow; ctx.shadowOffsetY = shadow * 0.35; }
  rrect(ctx, x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
// volet : la scène B monte depuis le bas entre a et b
function wipeUp(ctx, u, a, b, drawB) {
  const p = E.inOutCubic(prog(u, a, b)); if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, H * (1 - p), W, H * p + 1); ctx.clip(); drawB(); ctx.restore();
}

// ------------------------------------------------------------ 1 accroche (0-8)
function s1(ctx, u) {
  fill(ctx, C.t);
  // rayons qui tournent lentement
  ctx.save(); ctx.translate(W * 0.66, H * 0.5); ctx.rotate(u * 0.03); ctx.fillStyle = 'rgba(255,255,255,.07)';
  for (let i = 0; i < 18; i++) { ctx.rotate(Math.PI / 9); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1600, -120); ctx.lineTo(1600, 120); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.save(); shake(ctx, u, 0, 18);
  const k = sp(u, -0.1, SPRING.wobbly);
  ctx.save(); ctx.translate(500, 520); ctx.rotate(-0.12); const s = lerp(2.4, 1, k); ctx.scale(s, s);
  ctx.font = font(250, 400, D); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.lineWidth = 34; ctx.strokeStyle = C.c; ctx.strokeText('CRAC !', 0, 0); ctx.fillStyle = C.y; ctx.fillText('CRAC !', 0, 0);
  ctx.restore();
  const kl = sp(u, 2, SPRING.bouncy);
  place(ctx, IMGS.logoB, 1380, 470, 620, { rot: lerp(0.5, -0.06, kl) + 0.02 * wobble((u - 2) * 0.5), s: kl });
  ctx.restore();
  label(ctx, 'ÉTUDE DE CAS · BRAND IDENTITY', 110, 820, 30, C.y, 900, 'left', out(u, 4, 5));
  label(ctx, 'Créer une marque de snacks, du brief au logo.', 110, 880, 46, C.w, 800, 'left', out(u, 4.4, 5.4));
}

// ------------------------------------------------------------ 2 brief (8-20)
function s2(ctx, u) {
  fill(ctx, C.l); header(ctx, u, 8, '01', 'LE BRIEF', C.c);
  const rows = [['LE PRODUIT', 'Des snacks croustillants : chips et gourmandises'], ['LA CIBLE', 'Les 15-30 ans urbains, qui grignotent entre amis'], ['L’OBJECTIF', 'Se démarquer dans un rayon où tout se ressemble']];
  rows.forEach(([k, v], i) => {
    const u0 = 10 + i * 2, p = sp(u, u0, SPRING.snappy); if (p <= 0) return;
    const y = 360 + i * 175, x = lerp(-900, 110, p);
    card(ctx, x, y, 1300, 140, C.w, 26, 30);
    card(ctx, x, y, 14, 140, C.t, 7);
    label(ctx, k, x + 50, y + 52, 28, C.t, 900);
    label(ctx, v, x + 50, y + 110, 48, C.c, 900);
  });
  const kc = sp(u, 15.5, SPRING.bouncy);
  place(ctx, IMGS.chips, 1610, 560, 520, { s: kc, rot: -0.2 + 0.05 * Math.sin(u * 0.6) });
}

// ------------------------------------------------------------ 3 plateforme (20-32)
function s3(ctx, u) {
  fill(ctx, C.b); header(ctx, u, 20, '02', 'LA PLATEFORME', C.c);
  const vals = [['Gourmandise', C.t, C.w], ['Partage', C.c, C.w], ['Énergie', C.h, C.c], ['Bonne humeur', C.w, C.c]];
  let x = 110;
  vals.forEach(([v, bg, fg], i) => {
    const u0 = 22 + i, k = sp(u, u0, SPRING.bouncy); const f = font(64, 400, D);
    ctx.font = f; const w = ctx.measureText(v).width + 90;
    if (k > 0) {
      const y = lerp(-200, 420, k) + 12 * wobble((u - u0) * 0.5);
      ctx.save(); ctx.translate(x + w / 2, y); ctx.rotate((i % 2 ? 1 : -1) * 0.05 * (1 - k * 0.6));
      card(ctx, -w / 2, -62, w, 124, bg, 62, 24); text(ctx, v, 0, 24, f, fg, 'center'); ctx.restore();
    }
    x += w + 26;
  });
  label(ctx, 'TON DE VOIX', 110, 640, 26, C.t, 900, 'left', out(u, 27, 28));
  label(ctx, 'Fun, sonore, gourmand. Le pote drôle de la bande.', 110, 700, 50, C.c, 900, 'left', out(u, 27.3, 28.3));
  label(ctx, 'MISSION', 110, 810, 26, C.t, 900, 'left', out(u, 28, 29));
  label(ctx, 'Rendre chaque pause plus fun et plus croustillante.', 110, 870, 50, C.c, 900, 'left', out(u, 28.3, 29.3));
}

// ------------------------------------------------------------ 4 concurrence (32-44)
const DOTS = [[0.12, 0.2], [0.2, 0.32], [0.28, 0.16], [0.16, 0.6], [0.34, 0.42], [0.6, 0.18], [0.5, 0.3], [0.24, 0.78]];
function s4(ctx, u) {
  fill(ctx, C.l);
  // zoom (espace log) sur la zone libre à la fin
  const z = 1 * (3.2 / 1) ** E.inOutCubic(prog(u, 42.2, 44)); const fx = 1430, fy = 720;
  ctx.save(); M.zoomAbout(ctx, z, fx, fy);
  header(ctx, u, 32, '03', 'LA CONCURRENCE', C.c);
  const ox = 860, oy = 300, w = 900, h = 640, cx = ox + w / 2, cy = oy + h / 2;
  const pa = out(u, 33, 35), pb = out(u, 33.5, 35.5);
  ctx.strokeStyle = C.c; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - (w / 2) * pa, cy); ctx.lineTo(cx + (w / 2) * pa, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - (h / 2) * pb); ctx.lineTo(cx, cy + (h / 2) * pb); ctx.stroke();
  label(ctx, 'CLASSIQUE', ox, cy - 20, 32, C.c, 900, 'left', pa); label(ctx, 'FUN', ox + w, cy - 20, 32, C.c, 900, 'right', pa);
  label(ctx, 'PREMIUM', cx + 16, oy + 24, 32, C.c, 900, 'left', pb); label(ctx, 'ACCESSIBLE', cx + 16, oy + h, 32, C.c, 900, 'left', pb);
  DOTS.forEach(([dx, dy], i) => {
    const k = sp(u, 36 + i * 0.25, SPRING.bouncy); if (k <= 0) return;
    ctx.beginPath(); ctx.arc(ox + dx * w, oy + dy * h, 26 * k, 0, Math.PI * 2); ctx.fillStyle = '#B9A69C'; ctx.fill();
  });
  label(ctx, 'Le rayon chips : des marques qui se ressemblent', 110, 380, 36, C.c, 800, 'left', out(u, 37, 38));
  const kk = sp(u, 40, SPRING.wobbly);
  if (kk > 0) {
    ctx.beginPath(); ctx.arc(fx, fy, 42 * kk, 0, Math.PI * 2); ctx.fillStyle = C.t; ctx.fill();
    ctx.setLineDash([10, 10]); ctx.lineWidth = 4; ctx.strokeStyle = C.t; ctx.beginPath(); ctx.arc(fx, fy, 110 * kk, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  label(ctx, 'Krok’up : fun et accessible,', 110, 470, 44, C.t, 900, 'left', out(u, 40.3, 41.3));
  label(ctx, 'la zone que personne n’occupe.', 110, 528, 44, C.t, 900, 'left', out(u, 40.6, 41.6));
  ctx.restore();
  // le point Tangelo remplit l'écran
  const g = E.inExpo(prog(u, 43.2, 44)); if (g > 0) { ctx.beginPath(); ctx.arc(W / 2, H / 2, g * 1300, 0, Math.PI * 2); ctx.fillStyle = C.t; ctx.fill(); }
}

// ------------------------------------------------------------ 5 moodboard (44-60)
function s5(ctx, u) {
  fill(ctx, C.t);
  label(ctx, '04 · ÉTUDE DE CAS KROK\'UP', 110, 120, 30, C.w, 900, 'left', out(u, 44, 45));
  word(ctx, 'LE MOODBOARD', 106, 220, 96, C.w, u, 44.2);
  const k = sp(u, 44.5, SPRING.gentle);
  const x = 110, y = 280, w = 1700, h = 640;
  ctx.save(); ctx.translate(0, (1 - k) * 700);
  card(ctx, x - 10, y - 10, w + 20, h + 20, C.w, 30, 40);
  const [fx, z] = springKeys(u, [[44, [0.5, 1]], [46, [0.08, 2.2]], [50, [0.5, 2.0]], [54, [0.97, 2.4]], [58.5, [0.5, 1]]], SPRING.gentle);
  if (IMGS.mood) cover(ctx, IMGS.mood, x, y, w, h, { fx, fy: 0.5, zoom: z, radius: 22 });
  ctx.restore();
  const caps = [[46, 'Des moments de plaisir : on vend une sensation'], [50, 'Des lettrages épais, arrondis, avec contour'], [54, 'Une palette qui donne faim']];
  caps.forEach(([u0, str]) => {
    const a = out(u, u0 + 0.3, u0 + 1) * (1 - out(u, u0 + 3.6, u0 + 4)); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.font = font(40, 900, UI); const tw = ctx.measureText(str).width;
    card(ctx, 150, 830 + (1 - a) * 30, tw + 60, 74, C.c, 37); text(ctx, str, 180, 880 + (1 - a) * 30, font(40, 900, UI), C.w); ctx.restore();
  });
}

// ------------------------------------------------------------ 6 mots clés (60-72)
const WORDS = ['croquer', 'crac', 'sourire', 'bouche', 'éclat', 'goutte', 'miettes', 'bande'];
function s6(ctx, u) {
  fill(ctx, C.c); header(ctx, u, 60, '05', 'MOTS CLÉS', C.l, C.l);
  WORDS.forEach((wd, i) => {
    const u0 = 60.3 + i * 0.4, k = sp(u, u0, SPRING.bouncy); if (k <= 0) return;
    const fade = 1 - out(u, 64, 64.6);
    const ang = i * 0.785 + u * 0.12, r = 300 + (i % 2) * 90;
    const cx = 1300 + Math.cos(ang) * r * 1.2, cy = 580 + Math.sin(ang) * r * 0.75;
    ctx.save(); ctx.globalAlpha = fade; text(ctx, wd, cx, cy, font(68 * k, 900, UI), i % 3 === 0 ? C.h : C.l, 'center'); ctx.restore();
  });
  const kk = sp(u, 64.3, SPRING.wobbly);
  if (kk > 0) {
    const sh = 1 - out(u, 67.3, 68);
    ctx.save(); ctx.globalAlpha = sh;
    word(ctx, 'KRO', 1180, 560, 250, C.y, u, 64.3, { stroke: C.t, sw: 26, align: 'center' });
    word(ctx, 'KUP', 1180, 810, 250, C.y, u, 64.6, { stroke: C.t, sw: 26, align: 'center' });
    ctx.restore();
  }
  const kl = sp(u, 68, SPRING.bouncy);
  place(ctx, IMGS.logoA, 1180, 600, 640, { s: kl });
  if (kl > 0.2) {
    const a = out(u, 68.6, 69.4);
    ctx.save(); ctx.globalAlpha = a; ctx.setLineDash([12, 10]); ctx.lineWidth = 6; ctx.strokeStyle = C.y;
    ctx.beginPath(); ctx.ellipse(1330, 800, 170, 120, -0.2, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    label(ctx, 'Le « p » devient', 110, 640, 56, C.l, 900, 'left', a);
    label(ctx, 'un sourire gourmand.', 110, 710, 56, C.y, 900, 'left', out(u, 69, 69.8));
  }
}

// ------------------------------------------------------------ 7 pistes (72-84)
function s7(ctx, u) {
  fill(ctx, C.l); header(ctx, u, 72, '06', 'LES PISTES', C.c);
  const pick = E.inOutCubic(prog(u, 80, 81.2));
  const cards = [['PISTE A', IMGS.logoA, C.w, 560], ['PISTE B', IMGS.logoB, C.t, 1100]];
  cards.forEach(([t, img, bg, cx], i) => {
    const k = sp(u, 72.5 + i * 0.6, SPRING.bouncy); if (k <= 0) return;
    const isB = i === 1;
    const s = isB ? lerp(1, 1.12, pick) : lerp(1, 0.86, pick), a = isB ? 1 : lerp(1, 0.35, pick);
    const x = isB ? lerp(cx, 1180, pick) : lerp(cx, 470, pick);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, lerp(1300, 620, k)); ctx.scale(s, s); ctx.rotate((isB ? 1 : -1) * 0.03);
    card(ctx, -230, -260, 460, 520, bg, 30, 30); place(ctx, img, 0, -10, 360);
    text(ctx, t, 0, 230, font(30, 900, UI), isB ? C.w : C.c, 'center'); ctx.restore();
  });
  const crit = ['Lisible en petit', 'Déclinable en une couleur', 'Mémorable'];
  crit.forEach((c, i) => {
    const u0 = 75 + i * 2, a = out(u, u0, u0 + 0.6); if (a <= 0) return;
    const y = 420 + i * 90, x = 1460;
    ctx.save(); ctx.globalAlpha = a * (1 - pick);
    ctx.beginPath(); ctx.arc(x, y - 12, 22, 0, Math.PI * 2); ctx.fillStyle = C.t; ctx.fill();
    text(ctx, '✓', x, y - 2, font(28, 900, UI), C.w, 'center'); text(ctx, c, x + 40, y, font(40, 900, UI), C.c); ctx.restore();
  });
  const st = sp(u, 80.6, SPRING.wobbly);
  if (st > 0) {
    ctx.save(); ctx.translate(1520, 330); ctx.rotate(-0.18); ctx.scale(st * 1.0 + (1 - st) * 2, st * 1.0 + (1 - st) * 2); ctx.globalAlpha = clamp(st * 1.5);
    ctx.lineWidth = 8; ctx.strokeStyle = C.t; rrect(ctx, -220, -60, 440, 120, 16); ctx.stroke();
    text(ctx, 'RETENUE !', 0, 26, font(70, 400, D), C.t, 'center'); ctx.restore();
  }
}

// ------------------------------------------------------------ 8 déclinaisons (84-96)
function s8(ctx, u) {
  fill(ctx, C.l); header(ctx, u, 84, '07', 'DÉCLINAISONS', C.c);
  const panels = [[IMGS.logoA, C.w], [IMGS.logoB, C.t], [IMGS.monoC, C.l], [IMGS.monoW, C.c]];
  const away = E.inBack(prog(u, 90.8, 91.5), 1.2);
  panels.forEach(([img, bg], i) => {
    const u0 = 84.3 + i * 1.5, k = sp(u, u0, SPRING.snappy); if (k <= 0) return;
    const cx = 330 + i * 420, cy = 600 - away * 900;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.001, k), 1); // carte qui bascule
    card(ctx, -180, -220, 360, 440, bg, 26, 24); if (bg === C.l) { ctx.lineWidth = 3; ctx.strokeStyle = '#E6D1C5'; rrect(ctx, -180, -220, 360, 440, 26); ctx.stroke(); }
    place(ctx, img, 0, 0, 280); ctx.restore();
  });
  const caps = ['Principale', 'Sur Tangelo', 'Une couleur', 'En négatif'];
  caps.forEach((c, i) => label(ctx, c, 330 + i * 420, 870 - away * 900, 30, C.c, 900, 'center', out(u, 84.8 + i * 1.5, 85.6 + i * 1.5)));
  // la gamme : 3 paquets
  const packs = [IMGS.packN, IMGS.packP, IMGS.packB];
  packs.forEach((img, i) => {
    const k = sp(u, 91.2 + i * 0.8, SPRING.bouncy); if (k <= 0) return;
    place(ctx, img, 640 + i * 400, lerp(1400, 640, k) + 8 * Math.sin(u * 0.8 + i), 340, { rot: (i - 1) * 0.07, shadow: 40 });
  });
  label(ctx, 'LA GAMME : 3 SAVEURS, UN SEUL SYSTÈME', W / 2, 1010, 40, C.c, 900, 'center', out(u, 93, 94));
}

// ------------------------------------------------------------ 9 palette (96-108)
const PAL = [['Tangelo', '#FA4D00', C.w, 'Signature'], ['Chocolate', '#48261D', C.w, 'Textes, contours'], ['Linen', '#FFEDE3', C.c, 'Fonds clairs'], ['Botticelli', '#CAE7F7', C.c, 'Touche fraîche']];
function s9(ctx, u) {
  fill(ctx, C.w); header(ctx, u, 96, '08', 'LA PALETTE', C.c);
  const x0 = 110, cw = 400, gap = 25;
  PAL.forEach(([n, hex, fg, role], i) => {
    const k = sp(u, 97 + i, SPRING.bouncy); if (k <= 0) return;
    const x = x0 + i * (cw + gap), top = lerp(1080, 320, k), bottom = 860;
    if (top > bottom - 40) return;
    card(ctx, x, top, cw, bottom - top + 30, hex, 26, 20);
    if (hex === '#FFEDE3') { ctx.lineWidth = 2; ctx.strokeStyle = '#EAD7CC'; rrect(ctx, x, top, cw, bottom - top + 30, 26); ctx.stroke(); }
    // code qui défile jusqu'à sa valeur
    const sc = out(u, 97.4 + i, 99 + i); const code = sc < 1 ? '#' + Math.floor(hash01(Math.floor(u * 8) + i, 7) * 0xffffff).toString(16).toUpperCase().padStart(6, '0') : hex;
    text(ctx, n, x + 30, bottom - 70, font(52, 400, D), fg); text(ctx, code, x + 30, bottom - 20, font(30, 900, UI), fg);
    text(ctx, role, x + 30, top + 60, font(26, 800, UI), fg);
  });
  const b = out(u, 103, 104.5); if (b > 0) {
    const y = 940, w = 1650 * b;
    ctx.save(); rrect(ctx, x0, y, w, 64, 18); ctx.clip();
    ctx.fillStyle = C.t; ctx.fillRect(x0, y, 1650 * 0.6, 64); ctx.fillStyle = C.c; ctx.fillRect(x0 + 1650 * 0.6, y, 1650 * 0.3, 64); ctx.fillStyle = C.y; ctx.fillRect(x0 + 1650 * 0.9, y, 1650 * 0.1, 64);
    text(ctx, '60 %', x0 + 24, y + 44, font(30, 900, UI), C.w); text(ctx, '30 %', x0 + 1650 * 0.6 + 24, y + 44, font(30, 900, UI), C.w); text(ctx, '10 %', x0 + 1650 * 0.9 + 20, y + 44, font(30, 900, UI), C.c);
    ctx.restore();
  }
}

// ------------------------------------------------------------ 10 langage (108-120)
function s10(ctx, u) {
  fill(ctx, C.c); header(ctx, u, 108, '09', 'LE LANGAGE', C.l, C.l);
  const st = [['MIAMMM', 110, 520, 560, -0.08, C.t], ['CRAC !', 112, 1240, 600, 0.1, C.y], ['HUMMMM', 114, 760, 850, -0.04, C.h]];
  ctx.save(); shake(ctx, u, 110, 10); shake(ctx, u, 112, 10, 5); shake(ctx, u, 114, 10, 8);
  st.forEach(([w, u0, x, y, r, col]) => {
    const k = sp(u, u0, SPRING.wobbly); if (k <= 0) return;
    const s = lerp(2.2, 1, k);
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s); ctx.globalAlpha = clamp(k * 2);
    ctx.font = font(170, 400, D); ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 26; ctx.strokeStyle = C.l; ctx.strokeText(w, 0, 0);
    ctx.fillStyle = col; ctx.fillText(w, 0, 0); ctx.restore();
  });
  ctx.restore();
  label(ctx, 'Le croquant devient la voix de la marque.', 110, 1000, 44, C.l, 900, 'left', out(u, 116, 117));
}

// ------------------------------------------------------------ 11 en situation (120-128)
const SHOTS = [['studio', 'Packaging'], ['rayon', 'En rayon'], ['main', 'Dans la rue'], ['tshirt', 'Merch'], ['merch', 'Goodies'], ['phone', 'Réseaux sociaux'], ['billboard', 'Affichage 4×3']];
function s11(ctx, u) {
  fill(ctx, C.c);
  const idx = clamp(Math.floor(u - 120) , 0, SHOTS.length - 1);
  for (let i = Math.max(0, idx - 1); i <= idx; i++) {
    const [k] = SHOTS[i]; const img = IMGS[k]; if (!img) continue;
    const p = i === 0 ? 1 : E.outExpo(prog(u, 120 + i - 0.25, 120 + i)); // nouvelle image glisse depuis la droite
    const x = (1 - p) * W;
    const z = 1.12 * (1.0 / 1.12) ** prog(u, 120 + i - 0.25, 121.5 + i);
    cover(ctx, img, x, 0, W, H, { zoom: z, fy: k === 'main' || k === 'tshirt' ? 0.25 : 0.5 });
  }
  const [, cap] = SHOTS[idx];
  card(ctx, 90, 900, 520, 96, 'rgba(72,38,29,.88)', 22);
  text(ctx, '10 · EN SITUATION', 120, 940, font(22, 900, UI), C.y); text(ctx, cap, 120, 982, font(40, 400, D), C.w);
}

// ------------------------------------------------------------ 12 fin (128-135)
function s12(ctx, u) {
  fill(ctx, C.t);
  const k = sp(u, 128.3, SPRING.bouncy);
  place(ctx, IMGS.logoB, W / 2, 430, 560, { s: k, rot: -0.05 + 0.03 * wobble((u - 128.3) * 0.5) });
  label(ctx, 'DAK STUDIO SCHOOL · PARCOURS BRAND DESIGNER', W / 2, 840, 34, C.y, 900, 'center', out(u, 129.5, 130.5));
  label(ctx, 'Identité visuelle : Davy Aymard Kouassi · dak.graphiste', W / 2, 905, 40, C.w, 800, 'center', out(u, 130, 131));
}

// ------------------------------------------------------------ montage
const SCENES = [[0, s1], [8, s2], [20, s3], [32, s4], [44, s5], [60, s6], [72, s7], [84, s8], [96, s9], [108, s10], [120, s11], [128, s12]];
M.film({
  fonts: [font(100, 400, D), font(40, 400, UI), font(40, 800, UI), font(40, 900, UI)],
  images: {
    logoA: 'assets/img/logo_a.svg', logoB: 'assets/img/logo_b.svg', monoC: 'assets/img/logo_mono_choco.svg', monoW: 'assets/img/logo_mono_white.svg',
    chips: 'assets/img/chips.png', mood: 'assets/img/moodboard.jpg', packN: 'assets/img/pack_nature.png', packP: 'assets/img/pack_piment.png', packB: 'assets/img/pack_bbq.png',
    studio: 'assets/img/m1_studio.jpg', rayon: 'assets/img/m3_rayon.jpg', main: 'assets/img/m2_main.jpg', tshirt: 'assets/img/m4_tshirt.jpg', merch: 'assets/img/m5_merch.jpg', phone: 'assets/img/m6_phone.jpg', billboard: 'assets/img/m7_billboard.jpg',
  },
  hits: HITS,
  init(IMG) { Object.assign(IMGS, IMG); },
  draw(ctx, u, t, IMG) {
    Object.assign(IMGS, IMG);
    let i = SCENES.length - 1; while (i > 0 && u < SCENES[i][0]) i--;
    const [u0, fn] = SCENES[i];
    // transition : la scène suivante monte en volet sur la dernière demi-mesure (sauf 4→5 et 10→11, déjà motivées)
    const next = SCENES[i + 1];
    fn(ctx, u);
    if (next && ![44, 120].includes(next[0])) wipeUp(ctx, u, next[0] - 0.5, next[0], () => next[1](ctx, u));
  },
});
