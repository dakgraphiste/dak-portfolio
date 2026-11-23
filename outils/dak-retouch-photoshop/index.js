/*
 * Dak Retouch : panneau Photoshop (UXP) de retouche « affiche sport · vintage or ».
 * Chaque bouton crée des calques non destructifs, nommés, regroupés quand il y en a
 * plusieurs, et annulables en un seul Ctrl/Cmd+Z.
 */
const { app, core, action, constants } = require("photoshop");
const uxp = require("uxp");
const fs = uxp.storage.localFileSystem;

/* ------------------------------------------------------------------ */
/* Palette « Vintage Or »                                              */
/* ------------------------------------------------------------------ */
// Calibrée sur les affiches de référence : or crème/champagne, rouge profond, noirs chocolat.
const GOLD = {
  noir: "#0e0705",
  chocolat: "#2a1209",
  bronze: "#8a5a2b",
  or: "#c9a064",
  orClair: "#e3c48a",
  champagne: "#efdcb0",
  papier: "#efe2c4",
};

// Couleurs proposées pour les contours lumineux.
const GLOW_COLORS = {
  or: { core: "#fff4dc", halo: "#e3b768", outer: "#c9702a" },
  creme: { core: "#ffffff", halo: "#efdcb0", outer: "#c9a064" },
  feu: { core: "#fff1d6", halo: "#ff7a1a", outer: "#d8191f" },
  electrique: { core: "#ffffff", halo: "#8fd8ff", outer: "#2f6bff" },
};
let glowColor = "or";

// Couleurs des effets (fumigènes, étincelles, traînées…).
const FX_COLORS = { rouge: "#d8191f", orange: "#ff6a1a", or: "#e3b768", bleu: "#3d7bff", blanc: "#ffffff" };
let fxColor = "rouge";
let tilt = "descend"; // sol incliné : "descend" (plus bas à droite) ou "monte"

/* ------------------------------------------------------------------ */
/* Briques batchPlay                                                   */
/* ------------------------------------------------------------------ */
const pct = (v) => ({ _unit: "percentUnit", _value: v });
const px = (v) => ({ _unit: "pixelsUnit", _value: v });
const mode = (m) => ({ _enum: "blendMode", _value: m });
const TARGET = [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }];

function rgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  // Dans les descripteurs Photoshop, le vert s'appelle « grain ».
  return { _obj: "RGBColor", red: (n >> 16) & 255, grain: (n >> 8) & 255, blue: n & 255 };
}

async function bp(descriptors) {
  const list = Array.isArray(descriptors) ? descriptors : [descriptors];
  const results = await action.batchPlay(list, {});
  const err = results.find((r) => r && r._obj === "error");
  if (err) throw new Error(err.message || "commande Photoshop refusée");
  return results;
}

const activeLayer = (doc) => doc.activeLayers[0];

/** Rayon proportionnel à la taille de l'image (référence : 3000 px de grand côté). */
function scaled(doc, radius, min = 0.3, max = 250) {
  const k = Math.max(doc.width, doc.height) / 3000;
  return Math.min(max, Math.max(min, Math.round(radius * k * 10) / 10));
}

async function deselect() {
  await bp({ _obj: "set", _target: [{ _ref: "channel", _property: "selection" }], to: { _enum: "ordinal", _value: "none" } });
}

async function selectTop() {
  await bp({ _obj: "select", _target: [{ _ref: "layer", _enum: "ordinal", _value: "front" }], makeVisible: false });
}

async function selectLayer(layer) {
  await bp({ _obj: "select", _target: [{ _ref: "layer", _id: layer.id }], makeVisible: false });
}

async function setActive({ name, blend, opacity } = {}) {
  const to = { _obj: "layer" };
  if (name) to.name = name;
  if (blend) to.mode = mode(blend);
  if (opacity !== undefined) to.opacity = pct(opacity);
  await bp({ _obj: "set", _target: TARGET, to });
}

/** Tampon des calques visibles (Ctrl+Alt+Maj+E) tout en haut de la pile. */
async function stamp(doc, name) {
  await selectTop();
  if (doc.layers.length === 1) {
    await activeLayer(doc).duplicate();
  } else {
    await bp({ _obj: "mergeVisible", duplicate: true });
  }
  await setActive({ name, blend: "normal", opacity: 100 });
  return activeLayer(doc);
}

/** Nouveau calque rempli de gris 50 %, neutre en Incrustation / Lumière tamisée. */
async function grayLayer(doc, name, blend = "overlay") {
  await selectTop();
  await bp({ _obj: "make", _target: [{ _ref: "layer" }], using: { _obj: "layer", name } });
  await bp({ _obj: "fill", using: { _enum: "fillContents", _value: "gray" }, opacity: pct(100), mode: mode("normal") });
  await setActive({ blend });
  return activeLayer(doc);
}

async function adjustment(doc, name, type, { blend = "normal", opacity = 100 } = {}) {
  await bp({ _obj: "make", _target: [{ _ref: "adjustmentLayer" }], using: { _obj: "adjustmentLayer", type } });
  await setActive({ name, blend, opacity });
  return activeLayer(doc);
}

async function solidColor(doc, name, hex, { blend = "normal", opacity = 100 } = {}) {
  await bp({
    _obj: "make",
    _target: [{ _ref: "contentLayer" }],
    using: { _obj: "contentLayer", type: { _obj: "solidColorLayer", color: rgb(hex) } },
  });
  await setActive({ name, blend, opacity });
  return activeLayer(doc);
}

async function desaturate() { await bp({ _obj: "desaturate" }); }
async function invert() { await bp({ _obj: "invert" }); }

async function maskHideAll() {
  await bp({ _obj: "make", new: { _class: "channel" }, at: { _ref: "channel", _enum: "channel", _value: "mask" }, using: { _enum: "userMaskEnabled", _value: "hideAll" } });
}

async function maskFromSelection() {
  await bp({ _obj: "make", new: { _class: "channel" }, at: { _ref: "channel", _enum: "channel", _value: "mask" }, using: { _enum: "userMaskEnabled", _value: "revealSelection" } });
}

/** Sélection de luminosité (Ctrl+clic sur la vignette RVB). */
async function selectLuminosity({ shadows = false } = {}) {
  await bp({ _obj: "set", _target: [{ _ref: "channel", _property: "selection" }], to: { _ref: "channel", _enum: "channel", _value: "RGB" } });
  if (shadows) await bp({ _obj: "inverse" });
}

async function group(doc, layers, name) {
  try {
    const g = await doc.groupLayers(layers);
    g.name = name;
    return g;
  } catch (e) {
    console.warn("Regroupement impossible, les calques restent séparés :", e);
    return null;
  }
}

/* ---- Types de réglages ---- */
function curves(channels) {
  return {
    _obj: "curves",
    presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
    adjustment: Object.entries(channels).map(([channel, points]) => ({
      _obj: "curvesAdjustment",
      channel: { _ref: "channel", _enum: "channel", _value: channel },
      curve: points.map(([h, v]) => ({ _obj: "paint", horizontal: h, vertical: v })),
    })),
  };
}

function colorBalance({ shadows = [0, 0, 0], midtones = [0, 0, 0], highlights = [0, 0, 0] }) {
  // Chaque triplet : [cyan ↔ rouge, magenta ↔ vert, jaune ↔ bleu]
  return { _obj: "colorBalance", shadowLevels: shadows, midtoneLevels: midtones, highlightLevels: highlights, preserveLuminosity: true };
}

function vibrance(v, s) {
  return { _obj: "vibrance", vibrance: v, saturation: s };
}

function gradientMap(stops) {
  return {
    _obj: "gradientMapClass",
    gradient: {
      _obj: "gradientClassEvent",
      name: "Dak Gold",
      gradientForm: { _enum: "gradientForm", _value: "customStops" },
      interfaceIconFrameDimmed: 4096,
      colors: stops.map(([loc, hex]) => ({
        _obj: "colorStop",
        color: rgb(hex),
        type: { _enum: "colorStopType", _value: "userStop" },
        location: Math.round(loc * 4096),
        midpoint: 50,
      })),
      transparency: [
        { _obj: "transferSpec", opacity: pct(100), location: 0, midpoint: 50 },
        { _obj: "transferSpec", opacity: pct(100), location: 4096, midpoint: 50 },
      ],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Recettes                                                            */
/* Chaque recette renvoie la liste des calques créés.                  */
/* ------------------------------------------------------------------ */
const R = {};

/* ---------- Looks Vintage Or ---------- */
R.goldLegend = async (doc) => {
  await selectTop();
  const layers = [];
  layers.push(await adjustment(doc, "Courbe or", curves({
    composite: [[0, 16], [64, 58], [128, 132], [192, 204], [255, 246]],
    red: [[0, 0], [128, 136], [255, 255]],
    green: [[0, 0], [128, 129], [255, 252]],
    blue: [[0, 14], [128, 112], [255, 222]],
  })));
  layers.push(await adjustment(doc, "Balance or & chocolat", colorBalance({
    shadows: [10, 0, -14], midtones: [6, 2, -12], highlights: [8, 3, -22],
  })));
  layers.push(await adjustment(doc, "Vibrance douce", vibrance(-6, -14)));
  layers.push(await solidColor(doc, "Voile doré", GOLD.or, { blend: "softLight", opacity: 18 }));
  await group(doc, layers, "Look · Gold Legend");
  return layers;
};

R.champion70s = async (doc) => {
  await selectTop();
  const layers = [];
  layers.push(await adjustment(doc, "Noirs délavés", curves({
    composite: [[0, 42], [60, 72], [128, 134], [200, 210], [255, 236]],
    blue: [[0, 30], [128, 116], [255, 210]],
  })));
  layers.push(await adjustment(doc, "Balance 70s", colorBalance({
    shadows: [14, -4, -18], midtones: [8, 0, -16], highlights: [4, 4, -20],
  })));
  layers.push(await adjustment(doc, "Couleurs passées", vibrance(-12, -22)));
  layers.push(await solidColor(doc, "Papier vieilli", GOLD.papier, { blend: "multiply", opacity: 12 }));
  const g = await grayLayer(doc, "Grain 70s", "overlay");
  await g.applyAddNoise(scaled(doc, 9, 3, 25), constants.NoiseDistribution.GAUSSIAN, true);
  await g.applyGaussianBlur(scaled(doc, 0.7, 0.3, 3));
  layers.push(g);
  await group(doc, layers, "Look · Champion 70s");
  return layers;
};

R.blackGold = async (doc) => {
  await selectTop();
  const layers = [];
  layers.push(await adjustment(doc, "Dégradé noir → or", gradientMap([
    [0, GOLD.noir], [0.3, GOLD.chocolat], [0.62, GOLD.bronze], [0.85, GOLD.or], [1, GOLD.champagne],
  ])));
  layers.push(await adjustment(doc, "Contraste dramatique", curves({
    composite: [[0, 0], [60, 40], [128, 128], [196, 214], [255, 255]],
  }), { blend: "luminosity" }));
  await group(doc, layers, "Look · Black & Gold");
  return layers;
};

R.trophyGlow = async (doc) => {
  const layers = [];
  layers.push(...(await R.glow(doc)));
  layers.push(await adjustment(doc, "Chaleur trophée", colorBalance({
    shadows: [6, 0, -8], midtones: [4, 2, -10], highlights: [10, 5, -28],
  })));
  layers.push(await solidColor(doc, "Lumière dorée", GOLD.orClair, { blend: "softLight", opacity: 22 }));
  await group(doc, layers, "Look · Trophy Glow");
  return layers;
};

/* ---------- Netteté & texture ---------- */
R.nettete = async (doc) => {
  const l = await stamp(doc, "Netteté pro (passe-haut)");
  await desaturate(); // évite les halos colorés
  await l.applyHighPass(scaled(doc, 1.6, 0.5, 6));
  await setActive({ blend: "overlay", opacity: 100 });
  return [l];
};

R.clarte = async (doc) => {
  const l = await stamp(doc, "Clarté");
  await l.applyUnSharpMask(22, scaled(doc, 60, 10, 250), 0);
  await setActive({ blend: "luminosity", opacity: 80 });
  return [l];
};

R.hdrSport = async (doc) => {
  const l = await stamp(doc, "HDR Sport");
  await desaturate();
  await l.applyHighPass(scaled(doc, 10, 2, 40));
  await setActive({ blend: "linearLight", opacity: 45 });
  return [l];
};

R.grain = async (doc) => {
  const l = await grayLayer(doc, "Grain argentique", "overlay");
  await l.applyAddNoise(scaled(doc, 7, 3, 20), constants.NoiseDistribution.GAUSSIAN, true);
  await l.applyGaussianBlur(scaled(doc, 0.6, 0.3, 3));
  await setActive({ opacity: 70 });
  return [l];
};

/* ---------- Peau ---------- */
R.separationFrequences = async (doc) => {
  const radius = scaled(doc, 8, 2, 40);
  const low = await stamp(doc, "Basse fréquence (teint)");
  const high = await low.duplicate();
  high.name = "Haute fréquence (texture)";
  await low.applyGaussianBlur(radius);
  await selectLayer(high);
  const is16 = doc.bitsPerChannel === constants.BitsPerChannelType.SIXTEEN;
  await bp({
    _obj: "applyImageEvent",
    with: {
      _obj: "calculation",
      to: { _ref: [{ _ref: "channel", _enum: "channel", _value: "RGB" }, { _ref: "layer", _name: low.name }] },
      invert: is16,
      calculation: { _enum: "calculationType", _value: is16 ? "add" : "subtract" },
      scale: 2,
      offset: is16 ? 0 : 128,
    },
  });
  await setActive({ blend: "linearLight" });
  await group(doc, [low, high], "Séparation de fréquences");
  await selectLayer(low);
  return [low, high];
};

R.peauDouce = async (doc) => {
  const l = await stamp(doc, "Peau douce : peins en blanc sur la peau");
  await invert();
  await setActive({ blend: "vividLight", opacity: 70 });
  await l.applyHighPass(scaled(doc, 9, 3, 40));
  await l.applyGaussianBlur(scaled(doc, 2.5, 0.8, 10));
  await maskHideAll();
  return [l];
};

R.texturePeau = async (doc) => {
  const l = await stamp(doc, "Texture de peau");
  await desaturate();
  await l.applyHighPass(scaled(doc, 1.2, 0.4, 5));
  await setActive({ blend: "linearLight", opacity: 45 });
  return [l];
};

/* ---------- Lumière & volume ---------- */
R.boostLumieres = async (doc) => {
  await selectTop();
  await selectLuminosity();
  const l = await adjustment(doc, "Booster lumières", curves({
    composite: [[0, 0], [128, 150], [255, 255]],
  }), { blend: "luminosity" });
  return [l];
};

R.ombresProfondes = async (doc) => {
  await selectTop();
  await selectLuminosity({ shadows: true });
  const l = await adjustment(doc, "Ombres profondes", curves({
    composite: [[0, 0], [128, 100], [255, 255]],
  }), { blend: "luminosity" });
  return [l];
};

R.ouvrirOmbres = async (doc) => {
  await selectTop();
  await selectLuminosity({ shadows: true });
  const l = await adjustment(doc, "Ouvrir les ombres", curves({
    composite: [[0, 8], [100, 136], [255, 255]],
  }), { blend: "luminosity", opacity: 70 });
  return [l];
};

R.dodgeBurnAuto = async (doc) => {
  const layers = [];
  layers.push(...(await R.boostLumieres(doc)));
  await deselect();
  layers.push(...(await R.ombresProfondes(doc)));
  await deselect();
  await group(doc, layers, "Volume · Dodge & Burn auto");
  return layers;
};

R.dodgeBurnManuel = async (doc) => {
  const l = await grayLayer(doc, "Dodge & Burn : pinceau blanc / noir à 5 %", "overlay");
  return [l];
};

R.contrasteS = async (doc) => {
  await selectTop();
  const l = await adjustment(doc, "Contraste S", curves({
    composite: [[0, 0], [64, 50], [192, 208], [255, 255]],
  }), { blend: "luminosity" });
  return [l];
};

/* ---------- Finitions ---------- */
R.vignette = async (doc) => {
  await selectTop();
  const w = doc.width, h = doc.height;
  const m = 0.06;
  await bp({
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: { _obj: "ellipse", top: px(h * m), left: px(w * m), bottom: px(h * (1 - m)), right: px(w * (1 - m)) },
    antiAlias: true,
  });
  await bp({ _obj: "feather", radius: px(Math.min(1000, Math.round(Math.min(w, h) * 0.18))) });
  await bp({ _obj: "inverse" });
  const l = await adjustment(doc, "Vignette", curves({
    composite: [[0, 0], [128, 88], [255, 196]],
  }));
  return [l];
};

R.glow = async (doc) => {
  const l = await stamp(doc, "Halo lumineux");
  await l.applyGaussianBlur(scaled(doc, 30, 8, 250));
  await selectLuminosity();
  await maskFromSelection();
  await deselect();
  await setActive({ blend: "screen", opacity: 35 });
  return [l];
};

/* ---------- Looks inspirés des références ---------- */
R.matchdayRouge = async (doc) => {
  await selectTop();
  const layers = [];
  layers.push(await adjustment(doc, "Courbe Matchday", curves({
    composite: [[0, 6], [50, 38], [128, 130], [200, 214], [255, 250]],
    red: [[0, 16], [128, 140], [255, 255]],
    green: [[0, 4], [128, 122], [255, 246]],
    blue: [[0, 4], [128, 110], [255, 224]],
  })));
  layers.push(await adjustment(doc, "Ombres rouge sang", colorBalance({
    shadows: [24, -4, -6], midtones: [10, 0, -8], highlights: [4, 2, -16],
  })));
  layers.push(await adjustment(doc, "Punch couleur", vibrance(10, -4)));
  layers.push(await solidColor(doc, "Voile crème", GOLD.champagne, { blend: "softLight", opacity: 12 }));
  await group(doc, layers, "Look · Matchday Rouge");
  return layers;
};

R.bleuOrange = async (doc) => {
  await selectTop();
  const layers = [];
  layers.push(await adjustment(doc, "Courbe bleu glacé", curves({
    composite: [[0, 10], [56, 46], [128, 130], [200, 214], [255, 248]],
    red: [[0, 0], [70, 58], [190, 200], [255, 255]],
    green: [[0, 6], [128, 128], [255, 250]],
    blue: [[0, 30], [80, 92], [190, 182], [255, 230]],
  })));
  layers.push(await adjustment(doc, "Split bleu / orange", colorBalance({
    shadows: [-20, 0, 24], midtones: [-4, 0, 6], highlights: [14, 0, -12],
  })));
  layers.push(await adjustment(doc, "Désaturation ciné", vibrance(6, -20)));
  const grit = await stamp(doc, "Grit (détails rugueux)");
  await desaturate();
  await grit.applyHighPass(scaled(doc, 6, 1.5, 30));
  await setActive({ blend: "overlay", opacity: 60 });
  layers.push(grit);
  const g = await grayLayer(doc, "Grain sale", "overlay");
  await g.applyAddNoise(scaled(doc, 11, 4, 30), constants.NoiseDistribution.GAUSSIAN, true);
  await g.applyGaussianBlur(scaled(doc, 0.8, 0.3, 3));
  layers.push(g);
  await group(doc, layers, "Look · Bleu Glacé × Orange");
  return layers;
};

/* ---------- Peau sculptée (reflets de sueur, comme sur les références) ---------- */
R.refletsPeau = async (doc) => {
  await selectTop();
  const layers = [];
  // La courbe ne touche que le haut de l'histogramme : seuls les reflets montent.
  layers.push(await adjustment(doc, "Reflets brillants", curves({
    composite: [[0, 0], [160, 158], [215, 240], [255, 255]],
  }), { blend: "luminosity" }));
  layers.push(...(await R.texturePeau(doc)));
  await group(doc, layers, "Peau · Reflets sculptés");
  return layers;
};

/* ---------- Contours lumineux sur le personnage ---------- */
async function selectionBounds() {
  const [r] = await bp({ _obj: "get", _target: [{ _property: "selection" }, { _ref: "document", _enum: "ordinal", _value: "targetEnum" }] });
  const s = r && r.selection;
  if (!s || s.top === undefined) return null;
  const v = (x) => (typeof x === "object" ? x._value : x);
  return { top: v(s.top), left: v(s.left), bottom: v(s.bottom), right: v(s.right) };
}

/**
 * Sélectionne le personnage :
 * 1. si le calque actif est un détourage (pixels transparents) → sa transparence ;
 * 2. sinon → « Sélectionner le sujet » de Photoshop.
 */
async function selectCharacter(doc) {
  const layer = activeLayer(doc);
  if (!layer) throw new Error("sélectionne le calque du joueur");
  if (!layer.isBackgroundLayer && layer.kind === constants.LayerKind.PIXEL) {
    await bp({ _obj: "set", _target: [{ _ref: "channel", _property: "selection" }], to: { _ref: "channel", _enum: "channel", _value: "transparencyEnum" } });
    const b = await selectionBounds();
    const full = b && b.top <= 0 && b.left <= 0 && b.right >= doc.width && b.bottom >= doc.height;
    if (b && !full) return;
    await deselect();
  }
  await bp({ _obj: "autoCutout", sampleAllLayers: false });
  if (!(await selectionBounds())) throw new Error("aucun personnage détecté : sélectionne le calque détouré du joueur");
}

async function strokeSelection(width, hex, location = "outside") {
  await bp({
    _obj: "stroke",
    width: Math.max(1, Math.min(250, Math.round(width))),
    location: { _enum: "strokeLocation", _value: location },
    opacity: pct(100),
    mode: mode("normal"),
    color: rgb(hex),
  });
}

async function emptyLayer(doc, name) {
  await bp({ _obj: "make", _target: [{ _ref: "layer" }], using: { _obj: "layer", name } });
  return activeLayer(doc);
}

/** Calque de contour + halo flouté, à partir de la sélection active (conservée). */
async function glowPass(doc, name, { width, color, blur, blend, opacity, location = "outside" }) {
  const l = await emptyLayer(doc, name);
  await strokeSelection(width, color, location);
  return { layer: l, blur, blend, opacity };
}

async function finishPass(p) {
  await selectLayer(p.layer);
  if (p.blur) await p.layer.applyGaussianBlur(p.blur);
  await setActive({ blend: p.blend, opacity: p.opacity });
}

R.contourLumineux = async (doc) => {
  const c = GLOW_COLORS[glowColor];
  await selectCharacter(doc);
  await selectTop();
  const passes = [
    await glowPass(doc, "Halo large", { width: scaled(doc, 6, 2, 60), color: c.outer, blur: scaled(doc, 45, 10, 250), blend: "screen", opacity: 80 }),
    await glowPass(doc, "Halo", { width: scaled(doc, 4, 2, 40), color: c.halo, blur: scaled(doc, 14, 4, 120), blend: "linearDodge", opacity: 85 }),
    await glowPass(doc, "Fil lumineux", { width: scaled(doc, 2.5, 1, 20), color: c.core, blur: scaled(doc, 1.5, 0.5, 8), blend: "linearDodge", opacity: 100 }),
  ];
  await deselect(); // les flous doivent déborder de la sélection
  for (const p of passes) await finishPass(p);
  const layers = passes.map((p) => p.layer);
  await group(doc, layers, "Contour lumineux");
  return layers;
};

R.contourEclair = async (doc) => {
  const c = GLOW_COLORS[glowColor];
  await selectCharacter(doc);
  await selectTop();
  const core = await glowPass(doc, "Éclair (cœur)", { width: scaled(doc, 3, 1, 20), color: c.core, location: "center" });
  await deselect();
  // Tracé déchiqueté façon arc électrique : deux distorsions d'ondulation.
  await core.layer.applyRipple(scaled(doc, 320, 120, 999), constants.RippleSize.LARGE);
  await core.layer.applyRipple(scaled(doc, 180, 80, 999), constants.RippleSize.MEDIUM);
  await setActive({ blend: "linearDodge" });
  const halo = await core.layer.duplicate();
  halo.name = "Éclair (lueur)";
  await selectLayer(halo);
  await halo.applyGaussianBlur(scaled(doc, 12, 3, 100));
  await bp({ _obj: "set", _target: TARGET, to: { _obj: "layer", mode: mode("linearDodge"), opacity: pct(90) } });
  // Teinte de la lueur : calque de couleur écrêté sur le halo.
  const tint = await solidColor(doc, "Couleur éclair", c.halo, { blend: "multiply" });
  await bp({ _obj: "groupEvent", _target: TARGET });
  const outer = await halo.duplicate();
  outer.name = "Éclair (aura)";
  await selectLayer(outer);
  await outer.applyGaussianBlur(scaled(doc, 40, 10, 250));
  await setActive({ blend: "screen", opacity: 70 });
  const layers = [core.layer, halo, tint, outer];
  await group(doc, layers, "Contour éclair : efface les parties en trop");
  return layers;
};

R.rimLight = async (doc) => {
  const c = GLOW_COLORS[glowColor];
  await selectCharacter(doc);
  await selectTop();
  const l = await emptyLayer(doc, "Rim light");
  await strokeSelection(scaled(doc, 18, 4, 150), c.halo, "inside");
  // Le masque garde la lumière à l'intérieur de la silhouette.
  await maskFromSelection();
  await deselect();
  await selectLayer(l);
  await bp({ _obj: "select", _target: [{ _ref: "channel", _enum: "channel", _value: "RGB" }], makeVisible: false });
  await l.applyGaussianBlur(scaled(doc, 14, 4, 120));
  await setActive({ blend: "screen", opacity: 75 });
  return [l];
};

/* ------------------------------------------------------------------ */
/* Effets                                                              */
/* ------------------------------------------------------------------ */
async function setColors(fg, bg) {
  await bp({ _obj: "set", _target: [{ _ref: "color", _property: "foregroundColor" }], to: rgb(fg) });
  await bp({ _obj: "set", _target: [{ _ref: "color", _property: "backgroundColor" }], to: rgb(bg) });
}

async function withColors(fg, bg, fn) {
  let saved = null;
  try { saved = [app.foregroundColor, app.backgroundColor]; } catch (e) { /* lecture impossible */ }
  await setColors(fg, bg);
  try { return await fn(); } finally {
    if (saved) {
      try { app.foregroundColor = saved[0]; app.backgroundColor = saved[1]; } catch (e) { /* on garde les couleurs */ }
    }
  }
}

async function fillColor(hex) {
  await bp({ _obj: "fill", using: { _enum: "fillContents", _value: "color" }, color: rgb(hex), opacity: pct(100), mode: mode("normal") });
}

async function fillBlack() {
  await bp({ _obj: "fill", using: { _enum: "fillContents", _value: "black" }, opacity: pct(100), mode: mode("normal") });
}

/** Sélection elliptique en fractions du document (peut déborder du cadre). */
async function ellipse(doc, top, left, bottom, right, feather = 0) {
  const w = doc.width, h = doc.height;
  await bp({
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: { _obj: "ellipse", top: px(h * top), left: px(w * left), bottom: px(h * bottom), right: px(w * right) },
    antiAlias: true,
  });
  if (feather) await bp({ _obj: "feather", radius: px(Math.min(1000, Math.round(feather * Math.min(w, h)))) });
}

/** Applique une courbe directement sur les pixels du calque actif. */
async function curvePixels(points) {
  await bp(curves({ composite: points }));
}

async function smokeLayer(doc, name, hex, { top = 0.42, opacity = 90 } = {}) {
  await selectTop();
  const l = await emptyLayer(doc, name);
  await withColors(hex, "#000000", () => bp({ _obj: "clouds" }));
  await curvePixels([[0, 0], [70, 0], [200, 210], [255, 255]]); // volutes plus contrastées
  await l.applyGaussianBlur(scaled(doc, 6, 1, 40));
  await ellipse(doc, top, -0.25, 1.45, 1.25, 0.22);
  await maskFromSelection();
  await deselect();
  await setActive({ blend: "screen", opacity });
  return l;
}

R.fumigene = async (doc) => [await smokeLayer(doc, "Fumigène", FX_COLORS[fxColor])];

R.brume = async (doc) => [await smokeLayer(doc, "Brume au sol", "#e8eef2", { top: 0.6, opacity: 70 })];

R.etincelles = async (doc) => {
  await selectTop();
  const l = await emptyLayer(doc, "Étincelles");
  await bp({ _obj: "fill", using: { _enum: "fillContents", _value: "gray" }, opacity: pct(100), mode: mode("normal") });
  await l.applyAddNoise(28, constants.NoiseDistribution.GAUSSIAN, true);
  await curvePixels([[0, 0], [212, 0], [255, 255]]); // ne garde que de rares points
  await l.applyMaximum(scaled(doc, 1.5, 1, 6));
  await l.applyMotionBlur(35, scaled(doc, 45, 10, 400));
  await curvePixels([[0, 0], [70, 255], [255, 255]]); // ravive les traînées
  await setActive({ blend: "linearDodge" });
  const tint = await solidColor(doc, "Couleur étincelles", FX_COLORS[fxColor], { blend: "multiply" });
  await bp({ _obj: "groupEvent", _target: TARGET });
  const layers = [l, tint];
  await group(doc, layers, "Étincelles : masque les zones en trop");
  return layers;
};

R.lightLeak = async (doc) => {
  await selectTop();
  const l = await emptyLayer(doc, "Light leak");
  const c = FX_COLORS[fxColor];
  await ellipse(doc, -0.25, -0.35, 0.45, 0.35);
  await fillColor(c);
  await ellipse(doc, 0.6, 0.7, 1.3, 1.35);
  await fillColor("#ffb070");
  await deselect();
  await l.applyGaussianBlur(scaled(doc, 220, 40, 1000));
  await setActive({ blend: "screen", opacity: 75 });
  return [l];
};

R.trainee = async (doc) => {
  await selectTop();
  const l = await emptyLayer(doc, "Traînée lumineuse (Ctrl+T pour orienter)");
  await ellipse(doc, 0.47, -0.1, 0.53, 1.1);
  await fillColor(FX_COLORS[fxColor]);
  await ellipse(doc, 0.493, 0.1, 0.507, 0.9);
  await fillColor("#ffffff");
  await deselect();
  await l.applyMotionBlur(0, scaled(doc, 600, 100, 2000));
  await l.applyGaussianBlur(scaled(doc, 6, 1, 40));
  await setActive({ blend: "linearDodge" });
  return [l];
};

R.filmRaye = async (doc) => {
  const l = await grayLayer(doc, "Texture film rayé", "overlay");
  await l.applyAddNoise(24, constants.NoiseDistribution.GAUSSIAN, true);
  await l.applyMotionBlur(90, scaled(doc, 300, 60, 2000));
  await curvePixels([[0, 0], [110, 60], [146, 196], [255, 255]]);
  await setActive({ opacity: 45 });
  return [l];
};

R.papierUse = async (doc) => {
  const l = await grayLayer(doc, "Papier usé", "overlay");
  await withColors("#9a9a9a", "#626262", () => bp({ _obj: "clouds" }));
  await l.applyAddNoise(6, constants.NoiseDistribution.GAUSSIAN, true);
  await setActive({ opacity: 40 });
  return [l];
};

/* ------------------------------------------------------------------ */
/* Textes : noms, équipes, titre                                       */
/* ------------------------------------------------------------------ */
const field = (id, fallback = "") => {
  const el = document.getElementById(id);
  const v = el && String(el.value || "").trim();
  return v || fallback;
};

function solid(hex) {
  const c = new app.SolidColor();
  c.rgb.hexValue = hex.replace("#", "").toUpperCase();
  return c;
}

/** Crée un calque texte de hauteur ~sizePx, centré sur (cx, cy), largeur max maxW. */
async function text(doc, { name, contents, sizePx, cx, cy, maxW, font, hex = GOLD.champagne, tracking = 0, opacity = 100 }) {
  await selectTop();
  const layer = await doc.createTextLayer({
    name,
    contents,
    fontName: font,
    fontSize: Math.max(1, (sizePx * 72) / doc.resolution),
    textColor: solid(hex),
    position: { x: cx, y: cy },
  });
  try { if (tracking) layer.textItem.characterStyle.tracking = tracking; } catch (e) { /* version ancienne */ }
  let b = layer.bounds;
  const width = b.right - b.left;
  if (maxW && width > maxW) {
    const k = (maxW / width) * 100;
    await layer.scale(k, k);
    b = layer.bounds;
  }
  await layer.translate(cx - (b.left + b.right) / 2, cy - (b.top + b.bottom) / 2);
  if (opacity !== 100) layer.opacity = opacity;
  return layer;
}

const fontTitle = () => field("fontTitle", "Impact");
const fontText = () => field("fontText", "Arial-BoldMT");

/** Calque du joueur choisi par l'utilisateur (pour glisser le texte derrière lui). */
function playerLayer(doc) {
  const l = activeLayer(doc);
  return l && !l.isBackgroundLayer && l.kind === constants.LayerKind.PIXEL ? l : null;
}

async function behind(layer, player) {
  if (player && document.getElementById("behindPlayer").checked) {
    await layer.move(player, constants.ElementPlacement.PLACEAFTER);
  }
}

R.titreGeant = async (doc) => {
  const player = playerLayer(doc);
  const w = doc.width, h = doc.height;
  const t = await text(doc, {
    name: "Titre géant",
    contents: field("txtTitle", field("txtTeamA", "MATCHDAY")).toUpperCase(),
    sizePx: h * 0.24, cx: w / 2, cy: h * 0.3, maxW: w * 0.94, font: fontTitle(), tracking: -10,
  });
  await behind(t, player);
  return [t];
};

R.numero = async (doc) => {
  const player = playerLayer(doc);
  const w = doc.width, h = doc.height;
  const t = await text(doc, {
    name: "Numéro géant",
    contents: field("txtNumber", "10"),
    sizePx: h * 0.45, cx: w * 0.5, cy: h * 0.42, maxW: w * 0.8, font: fontTitle(), opacity: 30,
  });
  await behind(t, player);
  return [t];
};

R.nomJoueur = async (doc) => {
  const w = doc.width, h = doc.height;
  const layers = [];
  const first = field("txtFirstName");
  if (first) {
    layers.push(await text(doc, { name: "Prénom", contents: first.toUpperCase(), sizePx: h * 0.024, cx: w / 2, cy: h * 0.755, maxW: w * 0.8, font: fontText(), tracking: 300, hex: GOLD.or }));
  }
  layers.push(await text(doc, { name: "Nom", contents: field("txtLastName", "NOM DU JOUEUR").toUpperCase(), sizePx: h * 0.07, cx: w / 2, cy: h * 0.8, maxW: w * 0.86, font: fontTitle() }));
  await group(doc, layers, "Texte · Joueur");
  return layers;
};

R.blocMatch = async (doc) => {
  const w = doc.width, h = doc.height;
  const layers = [];
  layers.push(await text(doc, { name: "Surtitre", contents: field("txtKicker", "MATCHDAY").toUpperCase(), sizePx: h * 0.016, cx: w / 2, cy: h * 0.855, maxW: w * 0.6, font: fontText(), tracking: 600, hex: GOLD.or }));
  const a = field("txtTeamA", "ÉQUIPE A").toUpperCase();
  const b = field("txtTeamB", "ÉQUIPE B").toUpperCase();
  layers.push(await text(doc, { name: "Affiche du match", contents: `${a}  V  ${b}`, sizePx: h * 0.05, cx: w / 2, cy: h * 0.895, maxW: w * 0.9, font: fontTitle() }));
  const info = [field("txtDate"), field("txtTime"), field("txtVenue")].filter(Boolean).join("   •   ");
  if (info) {
    layers.push(await text(doc, { name: "Infos match", contents: info.toUpperCase(), sizePx: h * 0.017, cx: w / 2, cy: h * 0.935, maxW: w * 0.9, font: fontText(), tracking: 100 }));
  }
  await group(doc, layers, "Texte · Match");
  return layers;
};

/* ------------------------------------------------------------------ */
/* Bibliothèque d'assets (logos, fumigènes PNG, textures…)              */
/* ------------------------------------------------------------------ */
const ASSET_EXT = /\.(png|jpe?g|psd|psb|tiff?|webp|svg|ai|pdf)$/i;
const LIGHT_ASSET = /(fumi|smoke|spark|etincel|flare|light|lueur|feu|fire|flame|leak|glow|bokeh|eclair|lightning|braise|ember|poussiere|dust|overlay)/i;
const PAPER_ASSET = /(papier|paper)/i;

async function placeAsset(doc, entry) {
  await selectTop();
  const token = await fs.createSessionToken(entry);
  await bp({ _obj: "placeEvent", null: { _path: token, _kind: "local" }, linked: false });
  const l = activeLayer(doc);
  l.name = entry.name.replace(ASSET_EXT, "");
  // Les éléments lumineux sur fond noir se fondent automatiquement.
  if (LIGHT_ASSET.test(entry.name)) await setActive({ blend: "screen" });
  else if (PAPER_ASSET.test(entry.name)) await setActive({ blend: "multiply" });
  return [l];
}

/* ------------------------------------------------------------------ */
/* Signature graphique : sol en perspective inclinée                   */
/* ------------------------------------------------------------------ */
const pt = (x, y) => ({ _obj: "paint", horizontal: px(x), vertical: px(y) });

async function polygon(points, add = false) {
  await bp({
    _obj: add ? "addTo" : "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: { _obj: "polygon", points: points.map(([x, y]) => pt(x, y)) },
    antiAlias: true,
  });
}

R.solIncline = async (doc) => {
  const w = doc.width, h = doc.height;
  const player = playerLayer(doc);
  // Bord supérieur du sol : une ligne en biais d'un bord à l'autre.
  const yA = h * 0.7, yB = h * 0.8;
  const [yL, yR] = tilt === "descend" ? [yA, yB] : [yB, yA];
  const edgeY = (x) => yL + ((yR - yL) * x) / w;
  const ground = [[-w * 0.05, edgeY(-w * 0.05)], [w * 1.05, edgeY(w * 1.05)], [w * 1.05, h * 1.05], [-w * 0.05, h * 1.05]];
  const layers = [];

  await selectTop();

  // 1. Le sol : chocolat très sombre, texture bitume.
  const sol = await emptyLayer(doc, "Sol");
  await polygon(ground);
  await fillColor("#140c09");
  await deselect();
  sol.transparentPixelsLocked = true;
  await sol.applyAddNoise(scaled(doc, 9, 3, 25), constants.NoiseDistribution.GAUSSIAN, true);
  await sol.applyGaussianBlur(scaled(doc, 0.8, 0.3, 4));
  sol.transparentPixelsLocked = false;
  layers.push(sol);

  // 2. Grille en perspective : lignes de fuite vers un point posé sur l'horizon,
  //    et lignes transversales parallèles au bord, de plus en plus serrées vers l'horizon.
  const lines = await emptyLayer(doc, "Lignes de perspective");
  const vp = [w * 0.5, edgeY(w * 0.5) - h * 0.06];
  const thick = Math.max(1, w * 0.002);
  let first = true;
  for (let i = 0; i <= 16; i++) {
    const bx = -w * 1.6 + (w * 4.2 * i) / 16;
    await polygon([vp, [bx - thick, h * 1.05], [bx + thick, h * 1.05]], !first);
    first = false;
  }
  for (const d of [0.012, 0.03, 0.058, 0.1, 0.16, 0.25]) {
    const off = h * d, t2 = Math.max(1, thick * (0.4 + d * 4));
    await polygon([[-w * 0.05, edgeY(-w * 0.05) + off - t2], [w * 1.05, edgeY(w * 1.05) + off - t2], [w * 1.05, edgeY(w * 1.05) + off + t2], [-w * 0.05, edgeY(-w * 0.05) + off + t2]], true);
  }
  await fillColor(GOLD.champagne);
  await polygon(ground);
  await maskFromSelection();
  await deselect();
  await selectLayer(lines);
  await setActive({ blend: "softLight", opacity: 40 });
  layers.push(lines);

  // 3. Reflet doré qui court le long du bord.
  const band = (t0, t1) => [[-w * 0.05, edgeY(-w * 0.05) + t0], [w * 1.05, edgeY(w * 1.05) + t0], [w * 1.05, edgeY(w * 1.05) + t1], [-w * 0.05, edgeY(-w * 0.05) + t1]];
  const reflet = await emptyLayer(doc, "Reflet du sol");
  await polygon(band(0, h * 0.05));
  await fillColor(GOLD.or);
  await deselect();
  await reflet.applyGaussianBlur(scaled(doc, 40, 8, 250));
  await setActive({ blend: "softLight", opacity: 50 });
  layers.push(reflet);

  // 4. Ligne d'horizon lumineuse (fil + halo).
  const fil = await emptyLayer(doc, "Ligne d'horizon");
  await polygon(band(-h * 0.0012, h * 0.0012));
  await fillColor(GOLD.champagne);
  await deselect();
  await fil.applyGaussianBlur(scaled(doc, 1, 0.3, 5));
  await setActive({ blend: "linearDodge" });
  const halo = await fil.duplicate();
  halo.name = "Halo d'horizon";
  await selectLayer(halo);
  await halo.applyGaussianBlur(scaled(doc, 22, 5, 200));
  await setActive({ blend: "screen", opacity: 80 });
  layers.push(fil, halo);

  // 5. Ombre portée sous le joueur (ou au centre du bord).
  let cx = w / 2, cy = edgeY(w / 2) + h * 0.04;
  if (player) {
    const b = player.bounds;
    cx = (b.left + b.right) / 2;
    cy = Math.max(edgeY(cx) + h * 0.02, Math.min(b.bottom, h * 0.98));
  }
  await selectTop();
  const ombre = await emptyLayer(doc, "Ombre portée");
  await bp({
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: { _obj: "ellipse", top: px(cy - h * 0.025), left: px(cx - w * 0.28), bottom: px(cy + h * 0.025), right: px(cx + w * 0.28) },
    antiAlias: true,
  });
  await fillBlack();
  await deselect();
  await ombre.applyGaussianBlur(scaled(doc, 30, 6, 200));
  await setActive({ blend: "multiply", opacity: 75 });
  layers.push(ombre);

  // 6. Signature écrite le long de la pente.
  const sig = field("txtSignature", "DAK.GRAPHISTE");
  if (sig) {
    const x = tilt === "descend" ? w * 0.8 : w * 0.2;
    const t = await text(doc, {
      name: "Signature",
      contents: sig.toUpperCase(),
      sizePx: h * 0.012, cx: x, cy: edgeY(x) + h * 0.022, maxW: w * 0.35,
      font: fontText(), tracking: 500, hex: GOLD.champagne, opacity: 70,
    });
    const angle = (Math.atan2(yR - yL, w) * 180) / Math.PI;
    await t.rotate(angle);
    layers.push(t);
  }

  const g = await group(doc, layers, "Signature · Sol incliné");
  if (g && player) {
    try { await g.move(player, constants.ElementPlacement.PLACEAFTER); } catch (e) { /* reste au-dessus */ }
  }
  return layers;
};

/* ---------- Recette complète ---------- */
R.afficheSport = async (doc) => {
  const layers = [];
  for (const step of ["clarte", "nettete", "dodgeBurnAuto", "goldLegend", "grain", "vignette"]) {
    layers.push(...(await R[step](doc)));
    await deselect();
  }
  // Les sous-groupes sont déjà créés : on regroupe les éléments de premier niveau.
  const topLevel = doc.layers.filter((l) => layers.some((x) => x.id === l.id) || /^(Look|Volume) · /.test(l.name));
  await group(doc, topLevel, "DAK · Affiche Sport");
  return layers;
};

const LABELS = {
  afficheSport: "Affiche Sport",
  goldLegend: "Gold Legend",
  champion70s: "Champion 70s",
  blackGold: "Black & Gold",
  trophyGlow: "Trophy Glow",
  nettete: "Netteté pro",
  clarte: "Clarté",
  hdrSport: "HDR Sport",
  grain: "Grain argentique",
  separationFrequences: "Séparation de fréquences",
  peauDouce: "Peau douce",
  texturePeau: "Texture de peau",
  boostLumieres: "Booster lumières",
  ombresProfondes: "Ombres profondes",
  ouvrirOmbres: "Ouvrir les ombres",
  dodgeBurnAuto: "Dodge & Burn auto",
  dodgeBurnManuel: "Calque D&B manuel",
  contrasteS: "Contraste S",
  vignette: "Vignette",
  glow: "Halo lumineux",
  matchdayRouge: "Matchday Rouge",
  bleuOrange: "Bleu Glacé × Orange",
  refletsPeau: "Reflets de peau",
  contourLumineux: "Contour lumineux",
  contourEclair: "Contour éclair",
  rimLight: "Rim light",
  fumigene: "Fumigène",
  brume: "Brume au sol",
  etincelles: "Étincelles",
  lightLeak: "Light leak",
  trainee: "Traînée lumineuse",
  filmRaye: "Film rayé",
  papierUse: "Papier usé",
  titreGeant: "Titre géant",
  numero: "Numéro géant",
  nomJoueur: "Nom du joueur",
  blocMatch: "Bloc match",
  solIncline: "Signature · Sol incliné",
};

const TIPS = {
  peauDouce: "Peins en blanc sur le masque, sur la peau uniquement.",
  separationFrequences: "Teint : pinceau mélangeur sur la basse fréquence. Texture : tampon sur la haute.",
  dodgeBurnManuel: "Pinceau blanc pour éclaircir, noir pour assombrir, opacité 3 à 8 %.",
  contourEclair: "Ajoute un masque au groupe et efface où l'éclair ne doit pas passer.",
  contourLumineux: "Baisse l'intensité ou masque le bas du corps pour un rendu plus naturel.",
  fumigene: "Ctrl+T pour placer, masque pour dégager le visage.",
  trainee: "Ctrl+T pour l'orienter en diagonale.",
  solIncline: "Sélectionne le joueur avant : le sol passe derrière lui et l'ombre se cale sous ses pieds.",
  titreGeant: "Astuce : sélectionne le calque du joueur avant, le titre passe derrière lui.",
  numero: "Astuce : sélectionne le calque du joueur avant, le numéro passe derrière lui.",
};

/* ------------------------------------------------------------------ */
/* Interface                                                           */
/* ------------------------------------------------------------------ */
const statusEl = document.getElementById("status");
const slider = document.getElementById("intensity");
const sliderValue = document.getElementById("intensityValue");
let busy = false;

function status(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? "error" : "";
}

async function run(key, fn = null, labelOverride = null) {
  if (busy) return;
  if (!app.documents.length) {
    status("Ouvre une image d'abord.", true);
    return;
  }
  const label = labelOverride || LABELS[key] || key;
  const recipe = fn || R[key];
  busy = true;
  document.body.classList.add("busy");
  status(`${label}…`);
  try {
    await core.executeAsModal(async (ctx) => {
      const doc = app.activeDocument;
      const hist = await ctx.hostControl.suspendHistory({ documentID: doc.id, name: `Dak · ${label}` });
      let ok = false;
      try {
        await deselect();
        await recipe(doc);
        await deselect();
        ok = true;
      } finally {
        // En cas d'erreur, on annule tout : le document revient à son état initial.
        await ctx.hostControl.resumeHistory(hist, ok);
      }
    }, { commandName: `Dak · ${label}` });
    status(`✔ ${label}. ${TIPS[key] || "Règle l'intensité avec le curseur."}`);
    syncSlider();
  } catch (e) {
    console.error(e);
    status(`Erreur (${label}) : ${e.message || e}`, true);
  } finally {
    busy = false;
    document.body.classList.remove("busy");
  }
}

/* ---- Préférences (thème, onglet, champs texte) ---- */
const store = {
  get(k, d = null) { try { const v = localStorage.getItem("dak." + k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("dak." + k, v); } catch (e) { /* stockage indisponible */ } },
};

/* ---- Thème clair / nuit ---- */
function hostTheme() {
  try {
    const t = document.theme.getCurrent();
    return t === "light" || t === "lightest" ? "light" : "night";
  } catch (e) { return "night"; }
}

function applyTheme() {
  const pref = store.get("theme", "auto");
  const theme = pref === "auto" ? hostTheme() : pref;
  document.body.classList.toggle("light", theme === "light");
  document.body.classList.toggle("night", theme !== "light");
  const btn = document.getElementById("themeToggle");
  btn.textContent = theme === "light" ? "☾" : "☀";
  btn.title = pref === "auto" ? "Thème : auto (Photoshop)" : `Thème : ${theme === "light" ? "clair" : "nuit"}`;
}

document.getElementById("themeToggle").addEventListener("click", () => {
  const current = document.body.classList.contains("light") ? "light" : "night";
  store.set("theme", current === "light" ? "night" : "light");
  applyTheme();
});
document.getElementById("themeToggle").addEventListener("dblclick", () => {
  store.set("theme", "auto");
  applyTheme();
  status("Thème : suit Photoshop.");
});
try { document.theme.onUpdated.addListener(applyTheme); } catch (e) { /* hôte sans thème */ }
applyTheme();

/* ---- Onglets ---- */
function showTab(name) {
  document.querySelectorAll("[data-tab]").forEach((t) => t.classList.toggle("on", t.dataset.tab === name));
  document.querySelectorAll("[data-pane]").forEach((p) => p.classList.toggle("on", p.dataset.pane === name));
  store.set("tab", name);
}
document.querySelectorAll("[data-tab]").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
showTab(store.get("tab", "retouche"));

/* ---- Champs texte mémorisés ---- */
document.querySelectorAll("input[data-keep]").forEach((el) => {
  const saved = store.get("f." + el.id);
  if (saved !== null) {
    if (el.type === "checkbox") el.checked = saved === "1"; else el.value = saved;
  }
  el.addEventListener("change", () => store.set("f." + el.id, el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value));
});

/* ---- Bibliothèque d'assets ---- */
const assetList = document.getElementById("assetList");

async function renderAssets(folder) {
  assetList.innerHTML = "";
  if (!folder) {
    assetList.innerHTML = '<p class="hint">Aucun dossier. Range tes logos, fumigènes PNG, textures… dans un dossier puis choisis-le.</p>';
    return;
  }
  document.getElementById("assetFolder").textContent = folder.name;
  const entries = (await folder.getEntries()).filter((e) => e.isFile && ASSET_EXT.test(e.name));
  entries.sort((a, b) => a.name.localeCompare(b.name));
  if (!entries.length) {
    assetList.innerHTML = '<p class="hint">Dossier vide (formats : PNG, JPG, PSD, SVG, AI, PDF).</p>';
    return;
  }
  for (const entry of entries) {
    const el = document.createElement("div");
    el.className = "btn asset";
    el.textContent = entry.name.replace(ASSET_EXT, "");
    el.title = entry.name;
    el.addEventListener("click", () => run("asset", (doc) => placeAsset(doc, entry), `Asset ${entry.name}`));
    assetList.appendChild(el);
  }
}

async function loadAssetFolder() {
  const token = store.get("assetFolder");
  if (!token) return renderAssets(null);
  try { await renderAssets(await fs.getEntryForPersistentToken(token)); } catch (e) { renderAssets(null); }
}

document.getElementById("pickFolder").addEventListener("click", async () => {
  try {
    const folder = await fs.getFolder();
    if (!folder) return;
    store.set("assetFolder", await fs.createPersistentToken(folder));
    await renderAssets(folder);
  } catch (e) { status(`Erreur (dossier) : ${e.message || e}`, true); }
});
document.getElementById("refreshFolder").addEventListener("click", loadAssetFolder);
document.getElementById("placeFile").addEventListener("click", async () => {
  try {
    const file = await fs.getFileForOpening({ types: ["png", "jpg", "jpeg", "psd", "svg", "ai", "pdf", "tif", "tiff", "webp"] });
    if (file) run("asset", (doc) => placeAsset(doc, file), `Asset ${file.name}`);
  } catch (e) { status(`Erreur (fichier) : ${e.message || e}`, true); }
});
loadAssetFolder();

/* ---- Pastilles de couleur ---- */
function swatches(attr, onPick) {
  document.querySelectorAll(`[${attr}]`).forEach((el) => {
    el.addEventListener("click", () => {
      onPick(el.getAttribute(attr));
      document.querySelectorAll(`[${attr}]`).forEach((x) => x.classList.toggle("on", x === el));
    });
  });
}
swatches("data-fx", (v) => { fxColor = v; });
swatches("data-tilt", (v) => { tilt = v; });

swatches("data-glow", (v) => { glowColor = v; });

document.querySelectorAll("[data-action]").forEach((el) => {
  el.addEventListener("click", () => run(el.dataset.action));
});

/* Curseur d'intensité : opacité du calque ou du groupe sélectionné. */
function syncSlider() {
  try {
    const layer = app.documents.length && app.activeDocument.activeLayers[0];
    if (layer) {
      slider.value = Math.round(layer.opacity);
      sliderValue.textContent = `${Math.round(layer.opacity)} %`;
    }
  } catch (e) { /* aucun calque actif */ }
}

let pending = null;
slider.addEventListener("input", (e) => {
  const v = Math.round(Number(e.target.value));
  sliderValue.textContent = `${v} %`;
  pending = v;
});
slider.addEventListener("change", async () => {
  if (pending === null || !app.documents.length || busy) return;
  const v = pending;
  pending = null;
  try {
    await core.executeAsModal(async () => {
      const layer = app.activeDocument.activeLayers[0];
      if (layer) layer.opacity = v;
    }, { commandName: "Dak · Intensité" });
  } catch (e) {
    status(`Erreur (intensité) : ${e.message || e}`, true);
  }
});

action.addNotificationListener(["select"], () => syncSlider());
syncSlider();
