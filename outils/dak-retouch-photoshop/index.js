/*
 * Dak Retouch : panneau Photoshop (UXP) de retouche « affiche sport · vintage or ».
 * Chaque bouton crée des calques non destructifs, nommés, regroupés quand il y en a
 * plusieurs, et annulables en un seul Ctrl/Cmd+Z.
 */
const { app, core, action, constants } = require("photoshop");

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
};

const TIPS = {
  peauDouce: "Peins en blanc sur le masque, sur la peau uniquement.",
  separationFrequences: "Teint : pinceau mélangeur sur la basse fréquence. Texture : tampon sur la haute.",
  dodgeBurnManuel: "Pinceau blanc pour éclaircir, noir pour assombrir, opacité 3 à 8 %.",
  contourEclair: "Ajoute un masque au groupe et efface où l'éclair ne doit pas passer.",
  contourLumineux: "Baisse l'intensité ou masque le bas du corps pour un rendu plus naturel.",
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

async function run(key) {
  if (busy) return;
  if (!app.documents.length) {
    status("Ouvre une image d'abord.", true);
    return;
  }
  const label = LABELS[key] || key;
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
        await R[key](doc);
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

document.querySelectorAll("[data-glow]").forEach((el) => {
  el.addEventListener("click", () => {
    glowColor = el.dataset.glow;
    document.querySelectorAll("[data-glow]").forEach((x) => x.classList.toggle("on", x === el));
  });
});

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
