#target photoshop
/*
 * DAK RETOUCH : script Photoshop (ExtendScript) de retouche « affiche sport ».
 * Lancement : Fichier > Scripts > Dak Retouch (ou Fichier > Scripts > Parcourir…).
 * Chaque bouton crée des calques nommés et non destructifs, annulables en un seul Cmd/Ctrl+Z.
 */

/* ================================================================== */
/* Palette                                                            */
/* ================================================================== */
var GOLD = {
    noir: "0e0705", chocolat: "2a1209", bronze: "8a5a2b", or: "c9a064",
    orClair: "e3c48a", champagne: "efdcb0", papier: "efe2c4"
};
var GLOW_COLORS = {
    "Or": { core: "fff4dc", halo: "e3b768", outer: "c9702a" },
    "Crème": { core: "ffffff", halo: "efdcb0", outer: "c9a064" },
    "Feu": { core: "fff1d6", halo: "ff7a1a", outer: "d8191f" },
    "Électrique": { core: "ffffff", halo: "8fd8ff", outer: "2f6bff" }
};
var GLOW_NAMES = ["Or", "Crème", "Feu", "Électrique"];
var FX_COLORS = { "Rouge": "d8191f", "Orange": "ff6a1a", "Or": "e3b768", "Bleu": "3d7bff", "Blanc": "ffffff" };
var FX_NAMES = ["Rouge", "Orange", "Or", "Bleu", "Blanc"];

var OPT = { glow: "Or", fx: "Rouge", tilt: "descend" };
var FIELDS = {}; // champs texte de l'interface

/* ================================================================== */
/* Outils                                                             */
/* ================================================================== */
function s2t(s) { return stringIDToTypeID(s); }
function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
function doc() { return app.activeDocument; }
function W() { return doc().width.as("px"); }
function H() { return doc().height.as("px"); }

function color(hex) {
    var c = new SolidColor();
    c.rgb.hexValue = hex.replace("#", "");
    return c;
}

function rgbDesc(hex) {
    var c = color(hex);
    var d = new ActionDescriptor();
    d.putDouble(s2t("red"), c.rgb.red);
    d.putDouble(s2t("grain"), c.rgb.green); // le vert s'appelle « grain » dans les descripteurs
    d.putDouble(s2t("blue"), c.rgb.blue);
    return d;
}

/** Rayon proportionnel à la taille de l'image (référence : 3000 px de grand côté). */
function scaled(r, min, max) {
    var k = Math.max(W(), H()) / 3000;
    var v = Math.round(r * k * 10) / 10;
    if (v < min) v = min;
    if (v > max) v = max;
    return v;
}

function field(id, fallback) {
    var el = FIELDS[id];
    var v = el ? trim(el.text) : "";
    return v !== "" ? v : (fallback || "");
}

function active() { return doc().activeLayer; }

function deselect() { try { doc().selection.deselect(); } catch (e) { } }

/** Sélectionne le calque le plus haut sans changer sa visibilité. */
function selectTop() {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putEnumerated(s2t("layer"), s2t("ordinal"), s2t("front"));
    d.putReference(s2t("null"), r);
    d.putBoolean(s2t("makeVisible"), false);
    executeAction(s2t("select"), d, DialogModes.NO);
}

/** Garantit qu'un calque créé est au premier niveau, tout en haut. */
function ensureTop(l) {
    try {
        if (l.parent.typename !== "Document") l.move(doc().layers[0], ElementPlacement.PLACEBEFORE);
    } catch (e) { }
    return l;
}

function setLayer(l, name, blend, opacity) {
    if (name) l.name = name;
    if (blend) l.blendMode = blend;
    if (opacity !== undefined && opacity !== null) l.opacity = opacity;
    return l;
}

function newLayer(name, blend, opacity) {
    selectTop();
    var l = doc().artLayers.add();
    ensureTop(l);
    doc().activeLayer = l;
    return setLayer(l, name, blend || BlendMode.NORMAL, opacity === undefined ? 100 : opacity);
}

/** Tampon des calques visibles (Cmd+Alt+Maj+E) tout en haut de la pile. */
function stamp(name) {
    selectTop();
    var l;
    if (doc().layers.length === 1) {
        l = active().duplicate();
    } else {
        var d = new ActionDescriptor();
        d.putBoolean(s2t("duplicate"), true);
        executeAction(s2t("mergeVisible"), d, DialogModes.NO);
        l = active();
    }
    ensureTop(l);
    doc().activeLayer = l;
    return setLayer(l, name, BlendMode.NORMAL, 100);
}

function fillSelection(hex) { doc().selection.fill(color(hex)); }

function fillAll(hex) {
    doc().selection.selectAll();
    fillSelection(hex);
    deselect();
}

/** Calque gris 50 %, neutre en Incrustation / Lumière tamisée. */
function grayLayer(name, blend) {
    var l = newLayer(name, BlendMode.NORMAL, 100);
    fillAll("808080");
    l.blendMode = blend || BlendMode.OVERLAY;
    return l;
}

function adjustment(name, typeClass, typeDesc, blend, opacity) {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putClass(s2t("adjustmentLayer"));
    d.putReference(s2t("null"), r);
    var u = new ActionDescriptor();
    u.putObject(s2t("type"), s2t(typeClass), typeDesc);
    d.putObject(s2t("using"), s2t("adjustmentLayer"), u);
    executeAction(s2t("make"), d, DialogModes.NO);
    var l = ensureTop(active());
    doc().activeLayer = l;
    return setLayer(l, name, blend || BlendMode.NORMAL, opacity === undefined ? 100 : opacity);
}

function solidColor(name, hex, blend, opacity) {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putClass(s2t("contentLayer"));
    d.putReference(s2t("null"), r);
    var u = new ActionDescriptor();
    var t = new ActionDescriptor();
    t.putObject(s2t("color"), s2t("RGBColor"), rgbDesc(hex));
    u.putObject(s2t("type"), s2t("solidColorLayer"), t);
    d.putObject(s2t("using"), s2t("contentLayer"), u);
    executeAction(s2t("make"), d, DialogModes.NO);
    var l = ensureTop(active());
    doc().activeLayer = l;
    return setLayer(l, name, blend || BlendMode.NORMAL, opacity === undefined ? 100 : opacity);
}

/* ---- Descripteurs de réglages ---- */
function curvesDesc(channels) {
    var c = new ActionDescriptor();
    c.putEnumerated(s2t("presetKind"), s2t("presetKindType"), s2t("presetKindCustom"));
    var list = new ActionList();
    for (var name in channels) {
        if (!channels.hasOwnProperty(name)) continue;
        var ch = new ActionDescriptor();
        var cr = new ActionReference();
        cr.putEnumerated(s2t("channel"), s2t("channel"), s2t(name));
        ch.putReference(s2t("channel"), cr);
        var pts = new ActionList();
        var p = channels[name];
        for (var i = 0; i < p.length; i++) {
            var pd = new ActionDescriptor();
            pd.putDouble(s2t("horizontal"), p[i][0]);
            pd.putDouble(s2t("vertical"), p[i][1]);
            pts.putObject(s2t("paint"), pd);
        }
        ch.putList(s2t("curve"), pts);
        list.putObject(s2t("curvesAdjustment"), ch);
    }
    c.putList(s2t("adjustment"), list);
    return c;
}

function levelsList(a) {
    var l = new ActionList();
    for (var i = 0; i < a.length; i++) l.putInteger(a[i]);
    return l;
}

// Chaque triplet : [cyan <-> rouge, magenta <-> vert, jaune <-> bleu]
function colorBalanceDesc(sh, mid, hi) {
    var d = new ActionDescriptor();
    d.putList(s2t("shadowLevels"), levelsList(sh));
    d.putList(s2t("midtoneLevels"), levelsList(mid));
    d.putList(s2t("highlightLevels"), levelsList(hi));
    d.putBoolean(s2t("preserveLuminosity"), true);
    return d;
}

function vibranceDesc(v, s) {
    var d = new ActionDescriptor();
    d.putInteger(s2t("vibrance"), v);
    d.putInteger(s2t("saturation"), s);
    return d;
}

function gradientMapDesc(stops) {
    var g = new ActionDescriptor();
    g.putString(s2t("name"), "Dak Gold");
    g.putEnumerated(s2t("gradientForm"), s2t("gradientForm"), s2t("customStops"));
    g.putDouble(s2t("interfaceIconFrameDimmed"), 4096);
    var colors = new ActionList();
    for (var i = 0; i < stops.length; i++) {
        var s = new ActionDescriptor();
        s.putObject(s2t("color"), s2t("RGBColor"), rgbDesc(stops[i][1]));
        s.putEnumerated(s2t("type"), s2t("colorStopType"), s2t("userStop"));
        s.putInteger(s2t("location"), Math.round(stops[i][0] * 4096));
        s.putInteger(s2t("midpoint"), 50);
        colors.putObject(s2t("colorStop"), s);
    }
    g.putList(s2t("colors"), colors);
    var tr = new ActionList();
    var locs = [0, 4096];
    for (var j = 0; j < 2; j++) {
        var t = new ActionDescriptor();
        t.putUnitDouble(s2t("opacity"), s2t("percentUnit"), 100);
        t.putInteger(s2t("location"), locs[j]);
        t.putInteger(s2t("midpoint"), 50);
        tr.putObject(s2t("transferSpec"), t);
    }
    g.putList(s2t("transparency"), tr);
    var d = new ActionDescriptor();
    d.putObject(s2t("gradient"), s2t("gradientClassEvent"), g);
    return d;
}

/** Applique une courbe directement aux pixels du calque actif. */
function curvePixels(points) {
    executeAction(s2t("curves"), curvesDesc({ composite: points }), DialogModes.NO);
}

/* ---- Sélections et masques ---- */
function loadChannel(ch) {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putProperty(s2t("channel"), s2t("selection"));
    d.putReference(s2t("null"), r);
    var r2 = new ActionReference();
    r2.putEnumerated(s2t("channel"), s2t("channel"), s2t(ch));
    d.putReference(s2t("to"), r2);
    executeAction(s2t("set"), d, DialogModes.NO);
}

function selectLuminosity(shadows) {
    loadChannel("RGB");
    if (shadows) doc().selection.invert();
}

function makeMask(mode) {
    var d = new ActionDescriptor();
    d.putClass(s2t("new"), s2t("channel"));
    var r = new ActionReference();
    r.putEnumerated(s2t("channel"), s2t("channel"), s2t("mask"));
    d.putReference(s2t("at"), r);
    d.putEnumerated(s2t("using"), s2t("userMaskEnabled"), s2t(mode));
    executeAction(s2t("make"), d, DialogModes.NO);
}
function maskHideAll() { makeMask("hideAll"); }
function maskFromSelection() { makeMask("revealSelection"); }

/** Recible les pixels du calque (après création d'un masque). */
function targetPixels() {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putEnumerated(s2t("channel"), s2t("channel"), s2t("RGB"));
    d.putReference(s2t("null"), r);
    d.putBoolean(s2t("makeVisible"), false);
    executeAction(s2t("select"), d, DialogModes.NO);
}

function selectionBounds() {
    try {
        var b = doc().selection.bounds;
        return [b[0].as("px"), b[1].as("px"), b[2].as("px"), b[3].as("px")];
    } catch (e) { return null; }
}

function polygon(points, extend) {
    doc().selection.select(points, extend ? SelectionType.EXTEND : SelectionType.REPLACE, 0, true);
}

function ellipse(cx, cy, rx, ry, extend) {
    var pts = [];
    for (var i = 0; i < 96; i++) {
        var a = (i / 96) * Math.PI * 2;
        pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    polygon(pts, extend);
}

/** Ellipse en fractions du document (peut déborder du cadre). */
function ellipseFrac(top, left, bottom, right, feather) {
    var w = W(), h = H();
    ellipse(w * (left + right) / 2, h * (top + bottom) / 2, w * (right - left) / 2, h * (bottom - top) / 2);
    if (feather) doc().selection.feather(Math.min(1000, Math.round(feather * Math.min(w, h))));
}

/** Regroupe des calques (créés du bas vers le haut) dans un groupe. */
function grp(layers, name) {
    try {
        var g = doc().layerSets.add();
        g.name = name;
        g.move(layers[layers.length - 1], ElementPlacement.PLACEBEFORE);
        for (var i = layers.length - 1; i >= 0; i--) layers[i].move(g, ElementPlacement.PLACEATEND);
        doc().activeLayer = g;
        return [g];
    } catch (e) {
        return layers;
    }
}

function concat(a, b) { for (var i = 0; i < b.length; i++) a.push(b[i]); return a; }

/* ================================================================== */
/* Recettes                                                           */
/* Chaque recette renvoie les éléments de premier niveau créés.       */
/* ================================================================== */
var R = {};

/* ---------- Looks signature ---------- */
R.matchdayRouge = function () {
    selectTop();
    var L = [];
    L.push(adjustment("Courbe Matchday", "curves", curvesDesc({
        composite: [[0, 6], [50, 38], [128, 130], [200, 214], [255, 250]],
        red: [[0, 16], [128, 140], [255, 255]],
        green: [[0, 4], [128, 122], [255, 246]],
        blue: [[0, 4], [128, 110], [255, 224]]
    })));
    L.push(adjustment("Ombres rouge sang", "colorBalance", colorBalanceDesc([24, -4, -6], [10, 0, -8], [4, 2, -16])));
    L.push(adjustment("Punch couleur", "vibrance", vibranceDesc(10, -4)));
    L.push(solidColor("Voile crème", GOLD.champagne, BlendMode.SOFTLIGHT, 12));
    return grp(L, "Look · Matchday Rouge");
};

R.bleuOrange = function () {
    selectTop();
    var L = [];
    L.push(adjustment("Courbe bleu glacé", "curves", curvesDesc({
        composite: [[0, 10], [56, 46], [128, 130], [200, 214], [255, 248]],
        red: [[0, 0], [70, 58], [190, 200], [255, 255]],
        green: [[0, 6], [128, 128], [255, 250]],
        blue: [[0, 30], [80, 92], [190, 182], [255, 230]]
    })));
    L.push(adjustment("Split bleu / orange", "colorBalance", colorBalanceDesc([-20, 0, 24], [-4, 0, 6], [14, 0, -12])));
    L.push(adjustment("Désaturation ciné", "vibrance", vibranceDesc(6, -20)));
    var grit = stamp("Grit (détails rugueux)");
    grit.desaturate();
    grit.applyHighPass(scaled(6, 1.5, 30));
    setLayer(grit, null, BlendMode.OVERLAY, 60);
    L.push(grit);
    var g = grayLayer("Grain sale", BlendMode.OVERLAY);
    g.applyAddNoise(scaled(11, 4, 30), NoiseDistribution.GAUSSIAN, true);
    g.applyGaussianBlur(scaled(0.8, 0.3, 3));
    L.push(g);
    return grp(L, "Look · Bleu Glacé × Orange");
};

R.goldLegend = function () {
    selectTop();
    var L = [];
    L.push(adjustment("Courbe or", "curves", curvesDesc({
        composite: [[0, 16], [64, 58], [128, 132], [192, 204], [255, 246]],
        red: [[0, 0], [128, 136], [255, 255]],
        green: [[0, 0], [128, 129], [255, 252]],
        blue: [[0, 14], [128, 112], [255, 222]]
    })));
    L.push(adjustment("Balance or & chocolat", "colorBalance", colorBalanceDesc([10, 0, -14], [6, 2, -12], [8, 3, -22])));
    L.push(adjustment("Vibrance douce", "vibrance", vibranceDesc(-6, -14)));
    L.push(solidColor("Voile doré", GOLD.or, BlendMode.SOFTLIGHT, 18));
    return grp(L, "Look · Gold Legend");
};

R.champion70s = function () {
    selectTop();
    var L = [];
    L.push(adjustment("Noirs délavés", "curves", curvesDesc({
        composite: [[0, 42], [60, 72], [128, 134], [200, 210], [255, 236]],
        blue: [[0, 30], [128, 116], [255, 210]]
    })));
    L.push(adjustment("Balance 70s", "colorBalance", colorBalanceDesc([14, -4, -18], [8, 0, -16], [4, 4, -20])));
    L.push(adjustment("Couleurs passées", "vibrance", vibranceDesc(-12, -22)));
    L.push(solidColor("Papier vieilli", GOLD.papier, BlendMode.MULTIPLY, 12));
    var g = grayLayer("Grain 70s", BlendMode.OVERLAY);
    g.applyAddNoise(scaled(9, 3, 25), NoiseDistribution.GAUSSIAN, true);
    g.applyGaussianBlur(scaled(0.7, 0.3, 3));
    L.push(g);
    return grp(L, "Look · Champion 70s");
};

R.blackGold = function () {
    selectTop();
    var L = [];
    L.push(adjustment("Dégradé noir → or", "gradientMapClass", gradientMapDesc([
        [0, GOLD.noir], [0.3, GOLD.chocolat], [0.62, GOLD.bronze], [0.85, GOLD.or], [1, GOLD.champagne]
    ])));
    L.push(adjustment("Contraste dramatique", "curves", curvesDesc({
        composite: [[0, 0], [60, 40], [128, 128], [196, 214], [255, 255]]
    }), BlendMode.LUMINOSITY));
    return grp(L, "Look · Black & Gold");
};

R.trophyGlow = function () {
    var L = R.glow();
    L.push(adjustment("Chaleur trophée", "colorBalance", colorBalanceDesc([6, 0, -8], [4, 2, -10], [10, 5, -28])));
    L.push(solidColor("Lumière dorée", GOLD.orClair, BlendMode.SOFTLIGHT, 22));
    return grp(L, "Look · Trophy Glow");
};

/* ---------- Netteté & texture ---------- */
R.nettete = function () {
    var l = stamp("Netteté pro (passe-haut)");
    l.desaturate(); // évite les halos colorés
    l.applyHighPass(scaled(1.6, 0.5, 6));
    setLayer(l, null, BlendMode.OVERLAY, 100);
    return [l];
};

R.clarte = function () {
    var l = stamp("Clarté");
    l.applyUnSharpMask(22, scaled(60, 10, 250), 0);
    setLayer(l, null, BlendMode.LUMINOSITY, 80);
    return [l];
};

R.hdrSport = function () {
    var l = stamp("HDR Sport");
    l.desaturate();
    l.applyHighPass(scaled(10, 2, 40));
    setLayer(l, null, BlendMode.LINEARLIGHT, 45);
    return [l];
};

R.grain = function () {
    var l = grayLayer("Grain argentique", BlendMode.OVERLAY);
    l.applyAddNoise(scaled(7, 3, 20), NoiseDistribution.GAUSSIAN, true);
    l.applyGaussianBlur(scaled(0.6, 0.3, 3));
    l.opacity = 70;
    return [l];
};

/* ---------- Peau ---------- */
R.separationFrequences = function () {
    var radius = scaled(8, 2, 40);
    var low = stamp("Basse fréquence (teint)");
    var high = low.duplicate();
    high.name = "Haute fréquence (texture)";
    doc().activeLayer = low;
    low.applyGaussianBlur(radius);
    doc().activeLayer = high;
    var is16 = doc().bitsPerChannel === BitsPerChannelType.SIXTEEN;
    var d = new ActionDescriptor();
    var calc = new ActionDescriptor();
    var r = new ActionReference();
    r.putEnumerated(s2t("channel"), s2t("channel"), s2t("RGB"));
    r.putName(s2t("layer"), low.name);
    calc.putReference(s2t("to"), r);
    calc.putBoolean(s2t("invert"), is16);
    calc.putEnumerated(s2t("calculation"), s2t("calculationType"), s2t(is16 ? "add" : "subtract"));
    calc.putDouble(s2t("scale"), 2);
    calc.putInteger(s2t("offset"), is16 ? 0 : 128);
    d.putObject(s2t("with"), s2t("calculation"), calc);
    executeAction(s2t("applyImageEvent"), d, DialogModes.NO);
    high.blendMode = BlendMode.LINEARLIGHT;
    var out = grp([low, high], "Séparation de fréquences");
    doc().activeLayer = low;
    return out;
};

R.peauDouce = function () {
    var l = stamp("Peau douce : peins en blanc sur la peau");
    l.invert();
    setLayer(l, null, BlendMode.VIVIDLIGHT, 70);
    l.applyHighPass(scaled(9, 3, 40));
    l.applyGaussianBlur(scaled(2.5, 0.8, 10));
    maskHideAll();
    return [l];
};

R.texturePeau = function () {
    var l = stamp("Texture de peau");
    l.desaturate();
    l.applyHighPass(scaled(1.2, 0.4, 5));
    setLayer(l, null, BlendMode.LINEARLIGHT, 45);
    return [l];
};

R.refletsPeau = function () {
    selectTop();
    var L = [];
    // La courbe ne touche que le haut de l'histogramme : seuls les reflets montent.
    L.push(adjustment("Reflets brillants", "curves", curvesDesc({
        composite: [[0, 0], [160, 158], [215, 240], [255, 255]]
    }), BlendMode.LUMINOSITY));
    concat(L, R.texturePeau());
    return grp(L, "Peau · Reflets sculptés");
};

/* ---------- Lumière & volume ---------- */
R.boostLumieres = function () {
    selectTop();
    selectLuminosity(false);
    var l = adjustment("Booster lumières", "curves", curvesDesc({ composite: [[0, 0], [128, 150], [255, 255]] }), BlendMode.LUMINOSITY);
    deselect();
    return [l];
};

R.ombresProfondes = function () {
    selectTop();
    selectLuminosity(true);
    var l = adjustment("Ombres profondes", "curves", curvesDesc({ composite: [[0, 0], [128, 100], [255, 255]] }), BlendMode.LUMINOSITY);
    deselect();
    return [l];
};

R.ouvrirOmbres = function () {
    selectTop();
    selectLuminosity(true);
    var l = adjustment("Ouvrir les ombres", "curves", curvesDesc({ composite: [[0, 8], [100, 136], [255, 255]] }), BlendMode.LUMINOSITY, 70);
    deselect();
    return [l];
};

R.dodgeBurnAuto = function () {
    var L = R.boostLumieres();
    concat(L, R.ombresProfondes());
    return grp(L, "Volume · Dodge & Burn auto");
};

R.dodgeBurnManuel = function () {
    return [grayLayer("Dodge & Burn : pinceau blanc / noir à 5 %", BlendMode.OVERLAY)];
};

R.contrasteS = function () {
    selectTop();
    return [adjustment("Contraste S", "curves", curvesDesc({ composite: [[0, 0], [64, 50], [192, 208], [255, 255]] }), BlendMode.LUMINOSITY)];
};

/* ---------- Finitions ---------- */
R.vignette = function () {
    selectTop();
    ellipseFrac(0.06, 0.06, 0.94, 0.94, 0.18);
    doc().selection.invert();
    var l = adjustment("Vignette", "curves", curvesDesc({ composite: [[0, 0], [128, 88], [255, 196]] }));
    deselect();
    return [l];
};

R.glow = function () {
    var l = stamp("Halo lumineux");
    l.applyGaussianBlur(scaled(30, 8, 250));
    selectLuminosity(false);
    maskFromSelection();
    deselect();
    targetPixels();
    setLayer(l, null, BlendMode.SCREEN, 35);
    return [l];
};

/* ---------- Contours lumineux sur le personnage ---------- */
/** Le calque du joueur choisi par l'utilisateur (calque de pixels détouré). */
function playerLayer() {
    var l = active();
    if (l && l.typename === "ArtLayer" && !l.isBackgroundLayer && l.kind === LayerKind.NORMAL) return l;
    return null;
}

/**
 * Sélectionne le personnage :
 * 1. calque actif détouré → sa transparence ;
 * 2. sinon → « Sélectionner le sujet » de Photoshop.
 */
function selectCharacter() {
    if (playerLayer()) {
        loadChannel("transparencyEnum");
        var b = selectionBounds();
        var full = b && b[0] <= 0 && b[1] <= 0 && b[2] >= W() && b[3] >= H();
        if (b && !full) return;
        deselect();
    }
    var d = new ActionDescriptor();
    d.putBoolean(s2t("sampleAllLayers"), false);
    executeAction(s2t("autoCutout"), d, DialogModes.NO);
    if (!selectionBounds()) throw new Error("aucun personnage détecté : sélectionne le calque détouré du joueur");
}

function strokeSel(width, hex, loc) {
    var w = Math.max(1, Math.min(250, Math.round(width)));
    doc().selection.stroke(color(hex), w, loc || StrokeLocation.OUTSIDE, ColorBlendMode.NORMAL, 100, false);
}

R.contourLumineux = function () {
    var c = GLOW_COLORS[OPT.glow];
    selectCharacter();
    var passes = [
        { name: "Halo large", width: scaled(6, 2, 60), color: c.outer, blur: scaled(45, 10, 250), blend: BlendMode.SCREEN, opacity: 80 },
        { name: "Halo", width: scaled(4, 2, 40), color: c.halo, blur: scaled(14, 4, 120), blend: BlendMode.LINEARDODGE, opacity: 85 },
        { name: "Fil lumineux", width: scaled(2.5, 1, 20), color: c.core, blur: scaled(1.5, 0.5, 8), blend: BlendMode.LINEARDODGE, opacity: 100 }
    ];
    var L = [];
    for (var i = 0; i < passes.length; i++) {
        var l = newLayer(passes[i].name);
        strokeSel(passes[i].width, passes[i].color, StrokeLocation.OUTSIDE);
        L.push(l);
    }
    deselect(); // les flous doivent déborder de la sélection
    for (var j = 0; j < passes.length; j++) {
        doc().activeLayer = L[j];
        L[j].applyGaussianBlur(passes[j].blur);
        setLayer(L[j], null, passes[j].blend, passes[j].opacity);
    }
    return grp(L, "Contour lumineux");
};

R.contourEclair = function () {
    var c = GLOW_COLORS[OPT.glow];
    selectCharacter();
    var core = newLayer("Éclair (cœur)");
    strokeSel(scaled(3, 1, 20), c.core, StrokeLocation.CENTER);
    deselect();
    // Tracé déchiqueté façon arc électrique : deux ondulations.
    core.applyRipple(Math.round(scaled(320, 120, 999)), RippleSize.LARGE);
    core.applyRipple(Math.round(scaled(180, 80, 999)), RippleSize.MEDIUM);
    core.blendMode = BlendMode.LINEARDODGE;
    var halo = core.duplicate();
    halo.name = "Éclair (lueur)";
    doc().activeLayer = halo;
    halo.applyGaussianBlur(scaled(12, 3, 100));
    setLayer(halo, null, BlendMode.LINEARDODGE, 90);
    var tint = solidColor("Couleur éclair", c.halo, BlendMode.MULTIPLY);
    tint.grouped = true; // écrêté sur le halo
    var outer = halo.duplicate();
    outer.name = "Éclair (aura)";
    outer.move(tint, ElementPlacement.PLACEBEFORE);
    doc().activeLayer = outer;
    outer.applyGaussianBlur(scaled(40, 10, 250));
    setLayer(outer, null, BlendMode.SCREEN, 70);
    return grp([core, halo, tint, outer], "Contour éclair : efface les parties en trop");
};

R.rimLight = function () {
    var c = GLOW_COLORS[OPT.glow];
    selectCharacter();
    var l = newLayer("Rim light");
    strokeSel(scaled(18, 4, 150), c.halo, StrokeLocation.INSIDE);
    maskFromSelection(); // la lumière reste dans la silhouette
    deselect();
    targetPixels();
    l.applyGaussianBlur(scaled(14, 4, 120));
    setLayer(l, null, BlendMode.SCREEN, 75);
    return [l];
};

/* ---------- Ambiance ---------- */
function withColors(fg, bg, fn) {
    app.foregroundColor = color(fg);
    app.backgroundColor = color(bg);
    fn();
}

function clouds() { executeAction(s2t("clouds"), new ActionDescriptor(), DialogModes.NO); }

function smokeLayer(name, hex, top, opacity) {
    var l = newLayer(name);
    withColors(hex, "000000", clouds);
    curvePixels([[0, 0], [70, 0], [200, 210], [255, 255]]); // volutes plus contrastées
    l.applyGaussianBlur(scaled(6, 1, 40));
    ellipseFrac(top, -0.25, 1.45, 1.25, 0.22);
    maskFromSelection();
    deselect();
    targetPixels();
    setLayer(l, null, BlendMode.SCREEN, opacity);
    return l;
}

R.fumigene = function () { return [smokeLayer("Fumigène", FX_COLORS[OPT.fx], 0.42, 90)]; };
R.brume = function () { return [smokeLayer("Brume au sol", "e8eef2", 0.6, 70)]; };

R.etincelles = function () {
    var l = newLayer("Étincelles");
    fillAll("808080");
    l.applyAddNoise(28, NoiseDistribution.GAUSSIAN, true);
    curvePixels([[0, 0], [212, 0], [255, 255]]); // ne garde que de rares points
    l.applyMaximum(scaled(1.5, 1, 6));
    l.applyMotionBlur(35, scaled(45, 10, 400));
    curvePixels([[0, 0], [70, 255], [255, 255]]); // ravive les traînées
    l.blendMode = BlendMode.LINEARDODGE;
    var tint = solidColor("Couleur étincelles", FX_COLORS[OPT.fx], BlendMode.MULTIPLY);
    tint.grouped = true;
    return grp([l, tint], "Étincelles : masque les zones en trop");
};

R.lightLeak = function () {
    var l = newLayer("Light leak");
    ellipseFrac(-0.25, -0.35, 0.45, 0.35);
    fillSelection(FX_COLORS[OPT.fx]);
    ellipseFrac(0.6, 0.7, 1.3, 1.35);
    fillSelection("ffb070");
    deselect();
    l.applyGaussianBlur(scaled(220, 40, 1000));
    setLayer(l, null, BlendMode.SCREEN, 75);
    return [l];
};

R.trainee = function () {
    var w = W(), h = H();
    var l = newLayer("Traînée lumineuse (Cmd+T pour orienter)");
    polygon([[-w * 0.1, h * 0.47], [w * 1.1, h * 0.47], [w * 1.1, h * 0.53], [-w * 0.1, h * 0.53]]);
    fillSelection(FX_COLORS[OPT.fx]);
    polygon([[w * 0.1, h * 0.493], [w * 0.9, h * 0.493], [w * 0.9, h * 0.507], [w * 0.1, h * 0.507]]);
    fillSelection("ffffff");
    deselect();
    l.applyMotionBlur(0, scaled(600, 100, 2000));
    l.applyGaussianBlur(scaled(6, 1, 40));
    l.blendMode = BlendMode.LINEARDODGE;
    return [l];
};

R.filmRaye = function () {
    var l = grayLayer("Texture film rayé", BlendMode.OVERLAY);
    l.applyAddNoise(24, NoiseDistribution.GAUSSIAN, true);
    l.applyMotionBlur(90, scaled(300, 60, 2000));
    curvePixels([[0, 0], [110, 60], [146, 196], [255, 255]]);
    l.opacity = 45;
    return [l];
};

R.papierUse = function () {
    var l = grayLayer("Papier usé", BlendMode.OVERLAY);
    withColors("9a9a9a", "626262", clouds);
    l.applyAddNoise(6, NoiseDistribution.GAUSSIAN, true);
    l.opacity = 40;
    return [l];
};

/* ---------- Signature : sol en perspective inclinée ---------- */
R.solIncline = function () {
    var w = W(), h = H();
    var player = playerLayer();
    var yA = h * 0.7, yB = h * 0.8;
    var yL = OPT.tilt === "descend" ? yA : yB;
    var yR = OPT.tilt === "descend" ? yB : yA;
    function edgeY(x) { return yL + ((yR - yL) * x) / w; }
    var ground = [[-w * 0.05, edgeY(-w * 0.05)], [w * 1.05, edgeY(w * 1.05)], [w * 1.05, h * 1.05], [-w * 0.05, h * 1.05]];
    function band(t0, t1) {
        return [[-w * 0.05, edgeY(-w * 0.05) + t0], [w * 1.05, edgeY(w * 1.05) + t0], [w * 1.05, edgeY(w * 1.05) + t1], [-w * 0.05, edgeY(-w * 0.05) + t1]];
    }
    var L = [];

    // 1. Le sol : chocolat très sombre, texture bitume.
    var sol = newLayer("Sol");
    polygon(ground);
    fillSelection("140c09");
    deselect();
    sol.transparentPixelsLocked = true;
    sol.applyAddNoise(scaled(9, 3, 25), NoiseDistribution.GAUSSIAN, true);
    sol.applyGaussianBlur(scaled(0.8, 0.3, 4));
    sol.transparentPixelsLocked = false;
    L.push(sol);

    // 2. Grille en perspective : fuyantes vers un point posé sur l'horizon + transversales.
    var lines = newLayer("Lignes de perspective");
    var vp = [w * 0.5, edgeY(w * 0.5) - h * 0.06];
    var thick = Math.max(1, w * 0.002);
    for (var i = 0; i <= 16; i++) {
        var bx = -w * 1.6 + (w * 4.2 * i) / 16;
        polygon([vp, [bx - thick, h * 1.05], [bx + thick, h * 1.05]], i > 0);
    }
    var steps = [0.012, 0.03, 0.058, 0.1, 0.16, 0.25];
    for (var k = 0; k < steps.length; k++) {
        var off = h * steps[k], t2 = Math.max(1, thick * (0.4 + steps[k] * 4));
        polygon(band(off - t2, off + t2), true);
    }
    fillSelection(GOLD.champagne);
    polygon(ground);
    maskFromSelection();
    deselect();
    targetPixels();
    setLayer(lines, null, BlendMode.SOFTLIGHT, 40);
    L.push(lines);

    // 3. Reflet doré le long du bord.
    var reflet = newLayer("Reflet du sol");
    polygon(band(0, h * 0.05));
    fillSelection(GOLD.or);
    deselect();
    reflet.applyGaussianBlur(scaled(40, 8, 250));
    setLayer(reflet, null, BlendMode.SOFTLIGHT, 50);
    L.push(reflet);

    // 4. Ligne d'horizon lumineuse (fil + halo).
    var fil = newLayer("Ligne d'horizon");
    polygon(band(-h * 0.0012, h * 0.0012));
    fillSelection(GOLD.champagne);
    deselect();
    fil.applyGaussianBlur(scaled(1, 0.3, 5));
    fil.blendMode = BlendMode.LINEARDODGE;
    var halo = fil.duplicate();
    halo.name = "Halo d'horizon";
    doc().activeLayer = halo;
    halo.applyGaussianBlur(scaled(22, 5, 200));
    setLayer(halo, null, BlendMode.SCREEN, 80);
    L.push(fil);
    L.push(halo);

    // 5. Ombre portée sous le joueur (ou au centre du bord).
    var cx = w / 2, cy = edgeY(w / 2) + h * 0.04;
    if (player) {
        var b = player.bounds;
        cx = (b[0].as("px") + b[2].as("px")) / 2;
        cy = Math.max(edgeY(cx) + h * 0.02, Math.min(b[3].as("px"), h * 0.98));
    }
    var ombre = newLayer("Ombre portée");
    ellipse(cx, cy, w * 0.28, h * 0.025);
    fillSelection("000000");
    deselect();
    ombre.applyGaussianBlur(scaled(30, 6, 200));
    setLayer(ombre, null, BlendMode.MULTIPLY, 75);
    L.push(ombre);

    // 6. Signature le long de la pente.
    var sig = field("txtSignature", "DAK.GRAPHISTE");
    if (sig) {
        var x = OPT.tilt === "descend" ? w * 0.8 : w * 0.2;
        var t = text({
            name: "Signature", contents: sig.toUpperCase(), sizePx: h * 0.012,
            cx: x, cy: edgeY(x) + h * 0.022, maxW: w * 0.35,
            font: fontText(), tracking: 500, hex: GOLD.champagne, opacity: 70
        });
        t.rotate((Math.atan2(yR - yL, w) * 180) / Math.PI, AnchorPosition.MIDDLECENTER);
        L.push(t);
    }

    var out = grp(L, "Signature · Sol incliné");
    if (player && out.length === 1) {
        try { out[0].move(player, ElementPlacement.PLACEAFTER); } catch (e) { }
    }
    return out;
};

/* ---------- Textes ---------- */
function fontTitle() { return field("fontTitle", "Impact"); }
function fontText() { return field("fontText", "Arial-BoldMT"); }

/** Crée un calque texte de hauteur ~sizePx, centré sur (cx, cy), largeur max maxW. */
function text(o) {
    var l = newLayer(o.name);
    l.kind = LayerKind.TEXT;
    var t = l.textItem;
    t.contents = o.contents;
    try { t.font = o.font; } catch (e) { }
    t.size = Math.max(1, (o.sizePx * 72) / doc().resolution);
    t.color = color(o.hex || GOLD.champagne);
    t.justification = Justification.CENTER;
    if (o.tracking) t.tracking = o.tracking;
    t.position = [o.cx, o.cy];
    var b = l.bounds;
    var bw = b[2].as("px") - b[0].as("px");
    if (o.maxW && bw > o.maxW) {
        var k = (o.maxW / bw) * 100;
        l.resize(k, k, AnchorPosition.MIDDLECENTER);
        b = l.bounds;
    }
    l.translate(o.cx - (b[0].as("px") + b[2].as("px")) / 2, o.cy - (b[1].as("px") + b[3].as("px")) / 2);
    if (o.opacity !== undefined) l.opacity = o.opacity;
    return l;
}

function behind(l, player) {
    if (player && FIELDS.behindPlayer && FIELDS.behindPlayer.value) l.move(player, ElementPlacement.PLACEAFTER);
}

R.titreGeant = function () {
    var player = playerLayer();
    var t = text({
        name: "Titre géant", contents: field("txtTitle", field("txtTeamA", "MATCHDAY")).toUpperCase(),
        sizePx: H() * 0.24, cx: W() / 2, cy: H() * 0.3, maxW: W() * 0.94, font: fontTitle(), tracking: -10
    });
    behind(t, player);
    return [t];
};

R.numero = function () {
    var player = playerLayer();
    var t = text({
        name: "Numéro géant", contents: field("txtNumber", "10"),
        sizePx: H() * 0.45, cx: W() / 2, cy: H() * 0.42, maxW: W() * 0.8, font: fontTitle(), opacity: 30
    });
    behind(t, player);
    return [t];
};

R.nomJoueur = function () {
    var w = W(), h = H(), L = [];
    var first = field("txtFirstName", "");
    if (first) L.push(text({ name: "Prénom", contents: first.toUpperCase(), sizePx: h * 0.024, cx: w / 2, cy: h * 0.755, maxW: w * 0.8, font: fontText(), tracking: 300, hex: GOLD.or }));
    L.push(text({ name: "Nom", contents: field("txtLastName", "NOM DU JOUEUR").toUpperCase(), sizePx: h * 0.07, cx: w / 2, cy: h * 0.8, maxW: w * 0.86, font: fontTitle() }));
    return grp(L, "Texte · Joueur");
};

R.blocMatch = function () {
    var w = W(), h = H(), L = [];
    L.push(text({ name: "Surtitre", contents: field("txtKicker", "MATCHDAY").toUpperCase(), sizePx: h * 0.016, cx: w / 2, cy: h * 0.855, maxW: w * 0.6, font: fontText(), tracking: 600, hex: GOLD.or }));
    var a = field("txtTeamA", "ÉQUIPE A").toUpperCase(), b = field("txtTeamB", "ÉQUIPE B").toUpperCase();
    L.push(text({ name: "Affiche du match", contents: a + "  V  " + b, sizePx: h * 0.05, cx: w / 2, cy: h * 0.895, maxW: w * 0.9, font: fontTitle() }));
    var parts = [], ids = ["txtDate", "txtTime", "txtVenue"];
    for (var i = 0; i < ids.length; i++) { var v = field(ids[i], ""); if (v) parts.push(v); }
    if (parts.length) L.push(text({ name: "Infos match", contents: parts.join("   •   ").toUpperCase(), sizePx: h * 0.017, cx: w / 2, cy: h * 0.935, maxW: w * 0.9, font: fontText(), tracking: 100 }));
    return grp(L, "Texte · Match");
};

/* ---------- Recette complète ---------- */
R.afficheSport = function () {
    var steps = ["clarte", "nettete", "dodgeBurnAuto", "goldLegend", "grain", "vignette"];
    var L = [];
    for (var i = 0; i < steps.length; i++) {
        concat(L, R[steps[i]]());
        deselect();
    }
    return grp(L, "DAK · Affiche Sport");
};

/* ---------- Assets ---------- */
var ASSET_EXT = /\.(png|jpe?g|psd|psb|tiff?|webp|svg|ai|pdf)$/i;
var LIGHT_ASSET = /(fumi|smoke|spark|etincel|flare|light|lueur|feu|fire|flame|leak|glow|bokeh|eclair|lightning|braise|ember|poussiere|dust|overlay)/i;
var PAPER_ASSET = /(papier|paper)/i;
var PENDING_ASSET = null;

R.placeAsset = function () {
    var f = PENDING_ASSET;
    selectTop();
    var d = new ActionDescriptor();
    d.putPath(s2t("null"), f);
    d.putBoolean(s2t("linked"), false);
    executeAction(s2t("placeEvent"), d, DialogModes.NO);
    var l = active();
    var nm = decodeURI(f.name);
    l.name = nm.replace(ASSET_EXT, "");
    if (LIGHT_ASSET.test(nm)) l.blendMode = BlendMode.SCREEN;
    else if (PAPER_ASSET.test(nm)) l.blendMode = BlendMode.MULTIPLY;
    return [l];
};

/* ================================================================== */
/* Libellés                                                           */
/* ================================================================== */
var LABELS = {
    afficheSport: "Affiche Sport", matchdayRouge: "Matchday Rouge", bleuOrange: "Bleu Glacé × Orange",
    goldLegend: "Gold Legend", champion70s: "Champion 70s", blackGold: "Black & Gold", trophyGlow: "Trophy Glow",
    nettete: "Netteté pro", clarte: "Clarté", hdrSport: "HDR Sport", grain: "Grain argentique",
    separationFrequences: "Séparation fréquences", peauDouce: "Peau douce", texturePeau: "Texture de peau",
    refletsPeau: "Reflets sueur", boostLumieres: "Booster lumières", ombresProfondes: "Ombres profondes",
    ouvrirOmbres: "Ouvrir les ombres", dodgeBurnAuto: "Dodge & Burn auto", dodgeBurnManuel: "Calque D&B manuel",
    contrasteS: "Contraste S", vignette: "Vignette", glow: "Halo lumineux",
    contourLumineux: "Lueur contour", contourEclair: "Éclair", rimLight: "Rim light",
    fumigene: "Fumigène", brume: "Brume au sol", etincelles: "Étincelles", lightLeak: "Light leak",
    trainee: "Traînée lumineuse", filmRaye: "Film rayé", papierUse: "Papier usé",
    solIncline: "Sol signature", titreGeant: "Titre géant", numero: "Numéro géant",
    nomJoueur: "Nom du joueur", blocMatch: "Bloc match", placeAsset: "Asset"
};

var TIPS = {
    peauDouce: "Ferme la fenêtre et peins en blanc sur le masque, sur la peau.",
    separationFrequences: "Teint : pinceau mélangeur sur la basse fréquence. Texture : tampon sur la haute.",
    dodgeBurnManuel: "Pinceau blanc pour éclaircir, noir pour assombrir, opacité 3 à 8 %.",
    contourEclair: "Ajoute un masque au groupe et efface où l'éclair ne doit pas passer.",
    fumigene: "Cmd+T pour placer, masque pour dégager le visage.",
    trainee: "Cmd+T pour l'orienter en diagonale.",
    solIncline: "Astuce : sélectionne le joueur avant, le sol passe derrière lui.",
    titreGeant: "Astuce : sélectionne le joueur avant, le titre passe derrière lui."
};

/* ================================================================== */
/* Exécution : un seul pas d'historique, retour en arrière si erreur  */
/* ================================================================== */
var STATUS = null;
function status(msg) { if (STATUS) { STATUS.text = msg; } }

function __dakExec() {
    try {
        deselect();
        R[$.global.__dakKey]();
        deselect();
    } catch (e) {
        $.global.__dakErr = e;
    }
}

function run(key) {
    if (!app.documents.length) { status("Ouvre une image d'abord."); return; }
    var d = doc();
    var label = LABELS[key] || key;
    var saved = {
        ru: app.preferences.rulerUnits, tu: app.preferences.typeUnits,
        fg: app.foregroundColor, bg: app.backgroundColor
    };
    app.preferences.rulerUnits = Units.PIXELS;
    app.preferences.typeUnits = TypeUnits.POINTS;
    var state = d.activeHistoryState;
    $.global.__dakKey = key;
    $.global.__dakErr = null;
    try {
        d.suspendHistory("Dak · " + label, "__dakExec()");
    } catch (e) {
        if (!$.global.__dakErr) $.global.__dakErr = e;
    }
    app.preferences.rulerUnits = saved.ru;
    app.preferences.typeUnits = saved.tu;
    try { app.foregroundColor = saved.fg; app.backgroundColor = saved.bg; } catch (e2) { }
    var err = $.global.__dakErr;
    if (err) {
        try { d.activeHistoryState = state; } catch (e3) { }
        status("Erreur (" + label + ") : " + err.message + (err.line ? " [ligne " + err.line + "]" : ""));
    } else {
        status("✔ " + label + ". " + (TIPS[key] || "Règle l'intensité avec le curseur."));
    }
    app.refresh();
    syncSlider();
}

/* ================================================================== */
/* Préférences (thème, champs, dossier d'assets)                      */
/* ================================================================== */
var PREFS_FILE = new File(Folder.userData + "/DakRetouch/prefs.txt");
var PREFS = {};

function loadPrefs() {
    PREFS = {};
    if (!PREFS_FILE.exists) return;
    PREFS_FILE.encoding = "UTF-8";
    if (!PREFS_FILE.open("r")) return;
    while (!PREFS_FILE.eof) {
        var line = PREFS_FILE.readln();
        var i = line.indexOf("=");
        if (i > 0) PREFS[line.substring(0, i)] = line.substring(i + 1);
    }
    PREFS_FILE.close();
}

function savePrefs() {
    var f = new Folder(Folder.userData + "/DakRetouch");
    if (!f.exists) f.create();
    PREFS_FILE.encoding = "UTF-8";
    if (!PREFS_FILE.open("w")) return;
    for (var k in PREFS) if (PREFS.hasOwnProperty(k)) PREFS_FILE.writeln(k + "=" + String(PREFS[k]).replace(/[\r\n]/g, " "));
    PREFS_FILE.close();
}

/* ================================================================== */
/* Interface                                                          */
/* ================================================================== */
var THEMES = {
    night: { bg: [0.07, 0.063, 0.063, 1], text: [0.93, 0.89, 0.82, 1], accent: [0.79, 0.63, 0.39, 1], muted: [0.56, 0.5, 0.36, 1] },
    light: { bg: [0.965, 0.945, 0.9, 1], text: [0.16, 0.12, 0.07, 1], accent: [0.6, 0.43, 0.17, 1], muted: [0.54, 0.46, 0.32, 1] }
};
var THEME = "night";
var SLIDER = null, SLIDER_VAL = null;

function paint(ctrl, t) {
    try {
        var g = ctrl.graphics;
        if (ctrl.type === "dialog" || ctrl.type === "palette" || ctrl.type === "tab" || ctrl.type === "panel" || ctrl.type === "tabbedpanel") {
            g.backgroundColor = g.newBrush(g.BrushType.SOLID_COLOR, t.bg);
        }
        if (ctrl.type === "statictext" || ctrl.type === "checkbox") {
            var c = ctrl.role === "heading" || ctrl.role === "brand" ? t.accent : (ctrl.role === "muted" ? t.muted : t.text);
            g.foregroundColor = g.newPen(g.PenType.SOLID_COLOR, c, 1);
        }
    } catch (e) { }
    if (ctrl.children) for (var i = 0; i < ctrl.children.length; i++) paint(ctrl.children[i], t);
}

function syncSlider() {
    if (!SLIDER) return;
    try {
        var o = Math.round(doc().activeLayer.opacity);
        SLIDER.value = o;
        SLIDER_VAL.text = o + " %";
    } catch (e) { }
}

function buildUI() {
    loadPrefs();
    THEME = PREFS.theme === "light" ? "light" : "night";

    var w = new Window("dialog", "Dak Retouch", undefined, { resizeable: true });
    w.orientation = "column";
    w.alignChildren = ["fill", "top"];
    w.spacing = 8;
    w.margins = 12;

    /* ---- En-tête ---- */
    var head = w.add("group");
    head.alignChildren = ["fill", "center"];
    var brand = head.add("group");
    brand.orientation = "column";
    brand.alignChildren = ["left", "top"];
    brand.spacing = 0;
    var title = brand.add("statictext", undefined, "DAK RETOUCH");
    title.role = "brand";
    try { title.graphics.font = ScriptUI.newFont("dialog", "BOLD", 18); } catch (e) { }
    var tag = brand.add("statictext", undefined, "SPORT · VINTAGE OR");
    tag.role = "muted";
    var themeBtn = head.add("button", undefined, THEME === "light" ? "☾ Nuit" : "☀ Clair");
    themeBtn.alignment = ["right", "center"];
    themeBtn.preferredSize = [80, 24];
    themeBtn.onClick = function () {
        THEME = THEME === "light" ? "night" : "light";
        PREFS.theme = THEME;
        themeBtn.text = THEME === "light" ? "☾ Nuit" : "☀ Clair";
        paint(w, THEMES[THEME]);
        w.layout.layout(true);
    };

    /* ---- Onglets ---- */
    var tabs = w.add("tabbedpanel");
    tabs.alignChildren = ["fill", "top"];

    function tab(name) {
        var t = tabs.add("tab", undefined, name);
        t.orientation = "column";
        t.alignChildren = ["fill", "top"];
        t.margins = 10;
        t.spacing = 4;
        return t;
    }
    function heading(parent, txt) {
        var h = parent.add("statictext", undefined, txt.toUpperCase());
        h.role = "heading";
        return h;
    }
    function hint(parent, txt) {
        var h = parent.add("statictext", undefined, txt, { multiline: true });
        h.role = "muted";
        h.alignment = ["fill", "top"];
        h.preferredSize = [290, 30];
        return h;
    }
    function buttons(parent, items) {
        for (var i = 0; i < items.length; i += 2) {
            var row = parent.add("group");
            row.orientation = "row";
            row.alignChildren = ["fill", "center"];
            row.spacing = 6;
            for (var j = i; j < Math.min(i + 2, items.length); j++) {
                var b = row.add("button", undefined, items[j][1]);
                b.preferredSize = [145, 26];
                b.alignment = ["fill", "center"];
                b.onClick = (function (k) { return function () { run(k); }; })(items[j][0]);
            }
        }
    }
    function input(parent, id, label, placeholder) {
        var g = parent.add("group");
        g.alignChildren = ["fill", "center"];
        var l = g.add("statictext", undefined, label);
        l.preferredSize = [70, 20];
        var e = g.add("edittext", undefined, PREFS["f." + id] || "");
        e.alignment = ["fill", "center"];
        e.preferredSize = [200, 22];
        e.helpTip = placeholder;
        FIELDS[id] = e;
        return e;
    }
    function dropdown(parent, label, names, current, onPick) {
        var g = parent.add("group");
        g.alignChildren = ["fill", "center"];
        var l = g.add("statictext", undefined, label);
        l.preferredSize = [70, 20];
        var dd = g.add("dropdownlist", undefined, names);
        dd.alignment = ["fill", "center"];
        var idx = 0;
        for (var i = 0; i < names.length; i++) if (names[i] === current) idx = i;
        dd.selection = idx;
        dd.onChange = function () { if (dd.selection) onPick(dd.selection.index); };
        return dd;
    }

    /* Retouche */
    var t1 = tab("Retouche");
    var hero = t1.add("button", undefined, "⚡ AFFICHE SPORT : TOUT EN 1 CLIC");
    hero.preferredSize = [296, 34];
    hero.onClick = function () { run("afficheSport"); };
    hint(t1, "Clarté, netteté, volume, Gold Legend, grain et vignette, rangés dans un groupe.");
    heading(t1, "Looks signature");
    buttons(t1, [["matchdayRouge", "Matchday Rouge"], ["bleuOrange", "Bleu Glacé × Orange"], ["goldLegend", "Gold Legend"],
        ["champion70s", "Champion 70s"], ["blackGold", "Black & Gold"], ["trophyGlow", "Trophy Glow"]]);
    heading(t1, "Netteté & texture");
    buttons(t1, [["nettete", "Netteté pro"], ["clarte", "Clarté"], ["hdrSport", "HDR Sport"], ["grain", "Grain argentique"]]);
    heading(t1, "Peau");
    buttons(t1, [["separationFrequences", "Séparation fréquences"], ["peauDouce", "Peau douce"], ["texturePeau", "Texture de peau"], ["refletsPeau", "Reflets sueur"]]);
    heading(t1, "Lumière & volume");
    buttons(t1, [["boostLumieres", "Booster lumières"], ["ombresProfondes", "Ombres profondes"], ["ouvrirOmbres", "Ouvrir les ombres"],
        ["dodgeBurnAuto", "Dodge & Burn auto"], ["dodgeBurnManuel", "Calque D&B manuel"], ["contrasteS", "Contraste S"]]);
    heading(t1, "Finitions");
    buttons(t1, [["vignette", "Vignette"], ["glow", "Halo lumineux"]]);

    /* Effets */
    var t2 = tab("Effets");
    heading(t2, "Signature · sol incliné");
    hint(t2, "Sol en biais, grille de fuite, horizon doré, ombre du joueur, signature le long de la pente.");
    dropdown(t2, "Pente", ["↘ Descend à droite", "↗ Monte à droite"], OPT.tilt === "descend" ? "↘ Descend à droite" : "↗ Monte à droite",
        function (i) { OPT.tilt = i === 0 ? "descend" : "monte"; });
    input(t2, "txtSignature", "Signature", "DAK.GRAPHISTE");
    buttons(t2, [["solIncline", "Créer le sol signature"]]);
    heading(t2, "Contours lumineux (joueur)");
    hint(t2, "Sélectionne le calque détouré du joueur avant de cliquer (sinon : sujet auto).");
    dropdown(t2, "Couleur", GLOW_NAMES, OPT.glow, function (i) { OPT.glow = GLOW_NAMES[i]; });
    buttons(t2, [["contourLumineux", "Lueur contour"], ["contourEclair", "Éclair ⚡"], ["rimLight", "Rim light"]]);
    heading(t2, "Ambiance");
    dropdown(t2, "Couleur", FX_NAMES, OPT.fx, function (i) { OPT.fx = FX_NAMES[i]; });
    buttons(t2, [["fumigene", "Fumigène"], ["brume", "Brume au sol"], ["etincelles", "Étincelles"], ["lightLeak", "Light leak"], ["trainee", "Traînée lumineuse"]]);
    heading(t2, "Textures");
    buttons(t2, [["grain", "Grain argentique"], ["filmRaye", "Film rayé"], ["papierUse", "Papier usé"]]);

    /* Texte */
    var t3 = tab("Texte");
    heading(t3, "Joueur");
    input(t3, "txtFirstName", "Prénom", "Davy");
    input(t3, "txtLastName", "Nom", "KOUASSI");
    input(t3, "txtNumber", "Numéro", "10");
    buttons(t3, [["nomJoueur", "Nom du joueur"], ["numero", "Numéro géant"]]);
    heading(t3, "Match");
    input(t3, "txtTeamA", "Équipe A", "ASEC");
    input(t3, "txtTeamB", "Équipe B", "AFRICA");
    input(t3, "txtKicker", "Surtitre", "MATCHDAY");
    input(t3, "txtDate", "Date", "DIM. 14 DÉC.");
    input(t3, "txtTime", "Heure", "17:00");
    input(t3, "txtVenue", "Stade", "Stade FHB");
    buttons(t3, [["blocMatch", "Bloc match"]]);
    heading(t3, "Titre géant");
    input(t3, "txtTitle", "Texte", "MATCHDAY");
    var cb = t3.add("checkbox", undefined, "Placer derrière le calque du joueur sélectionné");
    cb.value = PREFS["f.behindPlayer"] !== "0";
    FIELDS.behindPlayer = cb;
    buttons(t3, [["titreGeant", "Titre géant"]]);
    heading(t3, "Polices (nom PostScript)");
    input(t3, "fontTitle", "Titres", "Impact");
    input(t3, "fontText", "Textes", "Arial-BoldMT");
    hint(t3, "Ex. : Oswald-Bold, BebasNeue-Regular, Anton-Regular.");

    /* Assets */
    var t4 = tab("Assets");
    heading(t4, "Ma bibliothèque");
    var folderTxt = t4.add("statictext", undefined, "Aucun dossier", { truncate: "middle" });
    folderTxt.alignment = ["fill", "top"];
    var list = t4.add("listbox", undefined, [], { multiselect: false });
    list.alignment = ["fill", "fill"];
    list.preferredSize = [296, 300];
    var currentFolder = null;
    var files = [];
    function loadFolder(f) {
        list.removeAll();
        files = [];
        if (!f || !f.exists) { folderTxt.text = "Aucun dossier"; return; }
        currentFolder = f;
        PREFS.assetFolder = f.fsName;
        folderTxt.text = decodeURI(f.name);
        var all = f.getFiles(function (x) { return x instanceof File && ASSET_EXT.test(x.name); });
        all.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
        for (var i = 0; i < all.length; i++) {
            files.push(all[i]);
            list.add("item", decodeURI(all[i].name).replace(ASSET_EXT, ""));
        }
    }
    function placeSelected() {
        if (!list.selection) { status("Choisis un élément dans la liste."); return; }
        PENDING_ASSET = files[list.selection.index];
        LABELS.placeAsset = "Asset " + list.selection.text;
        run("placeAsset");
    }
    list.onDoubleClick = placeSelected;
    var row = t4.add("group");
    row.alignChildren = ["fill", "center"];
    var bPlace = row.add("button", undefined, "Placer");
    var bFolder = row.add("button", undefined, "Dossier…");
    var bFile = row.add("button", undefined, "Fichier…");
    bPlace.onClick = placeSelected;
    bFolder.onClick = function () {
        var f = Folder.selectDialog("Choisis ton dossier d'assets");
        if (f) loadFolder(f);
    };
    bFile.onClick = function () {
        var f = File.openDialog("Choisis un fichier à placer");
        if (f) { PENDING_ASSET = f; LABELS.placeAsset = "Asset " + decodeURI(f.name); run("placeAsset"); }
    };
    hint(t4, "Double-clic pour placer. Les fichiers fumi, smoke, spark, flare, light, feu, glow… passent en mode Écran.");
    var defaultFolder = PREFS.assetFolder ? new Folder(PREFS.assetFolder) : new Folder(Folder.myDocuments + "/Dak Retouch/assets");
    loadFolder(defaultFolder);

    tabs.selection = Number(PREFS.tab || 0) < tabs.children.length ? tabs.children[Number(PREFS.tab || 0)] : tabs.children[0];

    /* ---- Pied : intensité + statut ---- */
    var foot = w.add("group");
    foot.orientation = "column";
    foot.alignChildren = ["fill", "top"];
    var sRow = foot.add("group");
    sRow.alignChildren = ["fill", "center"];
    var sl = sRow.add("statictext", undefined, "INTENSITÉ");
    sl.role = "heading";
    SLIDER = sRow.add("slider", undefined, 100, 0, 100);
    SLIDER.alignment = ["fill", "center"];
    SLIDER.preferredSize = [170, 20];
    SLIDER_VAL = sRow.add("statictext", undefined, "100 %");
    SLIDER_VAL.preferredSize = [44, 20];
    SLIDER.onChanging = function () { SLIDER_VAL.text = Math.round(SLIDER.value) + " %"; };
    SLIDER.onChange = function () {
        try { doc().activeLayer.opacity = Math.round(SLIDER.value); app.refresh(); } catch (e) { }
    };
    STATUS = foot.add("statictext", undefined, "Prêt. Le curseur règle l'opacité du calque sélectionné.", { multiline: true });
    STATUS.role = "muted";
    STATUS.preferredSize = [296, 34];
    var close = foot.add("button", undefined, "Fermer", { name: "cancel" });
    close.alignment = ["right", "center"];

    w.onResizing = w.onResize = function () { this.layout.resize(); };
    w.onClose = function () {
        for (var id in FIELDS) {
            if (!FIELDS.hasOwnProperty(id)) continue;
            var c = FIELDS[id];
            PREFS["f." + id] = c.type === "checkbox" ? (c.value ? "1" : "0") : c.text;
        }
        for (var i = 0; i < tabs.children.length; i++) if (tabs.selection === tabs.children[i]) PREFS.tab = i;
        savePrefs();
    };

    paint(w, THEMES[THEME]);
    syncSlider();
    w.center();
    w.show();
}

buildUI();
