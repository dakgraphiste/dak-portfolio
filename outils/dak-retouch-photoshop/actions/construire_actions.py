#!/usr/bin/env python3
"""
Génère « Dak Retouch.atn » : le jeu d'actions Photoshop de Dak Retouch.

Format : « Actions file format » de la spécification Adobe Photoshop File Formats
(version 16), avec les descripteurs d'actions sérialisés comme dans les fichiers PSD.

Usage : python3 outils/dak-retouch-photoshop/actions/construire_actions.py [sortie.atn]

Les rayons sont calibrés pour une image d'environ 3000 px de grand côté ; les
sélections (sol, vignette, fumées) sont en pourcentages, donc valables à toute taille.
"""
import os
import struct
import sys

# ---------------------------------------------------------------------------
# Sérialisation binaire
# ---------------------------------------------------------------------------

def u32(v): return struct.pack(">I", v & 0xFFFFFFFF)
def i32(v): return struct.pack(">i", v)
def i16(v): return struct.pack(">h", v)
def u8(v): return struct.pack(">B", v)
def f64(v): return struct.pack(">d", float(v))


def ustr(s):
    """Chaîne Unicode : nombre de caractères (zéro final compris) + UTF-16BE + zéro."""
    data = s.encode("utf-16-be") + b"\x00\x00"
    return u32(len(data) // 2) + data


def ident(s):
    """Identifiant : « c:XXXX » = code 4 caractères, sinon identifiant texte (stringID)."""
    if s.startswith("c:"):
        code = s[2:].ljust(4)[:4]
        return u32(0) + code.encode("ascii")
    b = s.encode("ascii")
    return u32(len(b)) + b


# Valeurs typées -------------------------------------------------------------
class V:
    def __init__(self, ostype, payload):
        self.ostype, self.payload = ostype, payload

    def encode(self):
        return self.ostype.encode("ascii") + self.payload


def Long(v): return V("long", i32(int(v)))
def Bool(v): return V("bool", u8(1 if v else 0))
def Text(v): return V("TEXT", ustr(v))
def Enum(t, v): return V("enum", ident(t) + ident(v))
def Px(v): return V("UntF", b"#Pxl" + f64(v))
def Pct(v): return V("UntF", b"#Prc" + f64(v))
def Dbl(v): return V("doub", f64(v))
def Obj(cls, items): return V("Objc", descriptor(cls, items))
def List(vals): return V("VlLs", u32(len(vals)) + b"".join(x.encode() for x in vals))
def ClassT(cls): return V("type", ustr("") + ident(cls))
def Ref(*items): return V("obj ", u32(len(items)) + b"".join(items))


def RefEnum(cls, t, v): return b"Enmr" + ustr("") + ident(cls) + ident(t) + ident(v)
def RefProp(cls, key): return b"prop" + ustr("") + ident(cls) + ident(key)
def RefClass(cls): return b"Clss" + ustr("") + ident(cls)
def RefName(cls, name): return b"name" + ustr("") + ident(cls) + ustr(name)


def descriptor(cls, items):
    out = ustr("") + ident(cls) + u32(len(items))
    for key, val in items:
        out += ident(key) + val.encode()
    return out


# Événements et actions ------------------------------------------------------
class Event:
    def __init__(self, event_id, label, items=None, dialog=False):
        self.event_id, self.label, self.items, self.dialog = event_id, label, items, dialog

    def encode(self):
        out = u8(0) + u8(1) + u8(1 if self.dialog else 0) + u8(0)  # replié, actif, dialogue, options
        out += b"TEXT" + u32(len(self.event_id)) + self.event_id.encode("ascii")
        lab = self.label.encode("utf-8")
        out += u32(len(lab)) + lab
        if self.items is None:
            out += u32(0)
        else:
            out += i32(-1) + descriptor("c:null", self.items)
        return out


def action(name, events, color=0):
    out = i16(0) + u8(0) + u8(0) + i16(color) + ustr(name) + u8(0) + u32(len(events))
    return out + b"".join(e.encode() for e in events)


def action_set(name, actions):
    out = u32(16) + ustr(name) + u8(1) + u32(len(actions))
    return out + b"".join(actions)


# ---------------------------------------------------------------------------
# Étapes Photoshop
# ---------------------------------------------------------------------------
NULL = "c:null"
TARGET = Ref(RefEnum("layer", "ordinal", "targetEnum"))
SEL = Ref(RefProp("channel", "selection"))


def rgb(hexa):
    hexa = hexa.lstrip("#")
    r, g, b = int(hexa[0:2], 16), int(hexa[2:4], 16), int(hexa[4:6], 16)
    return Obj("RGBColor", [("red", Dbl(r)), ("grain", Dbl(g)), ("blue", Dbl(b))])


def select_top():
    return [Event("select", "Sélectionner le calque du haut", [
        (NULL, Ref(RefEnum("layer", "ordinal", "front"))), ("makeVisible", Bool(False))])]


def select_named(name, add=False):
    items = [(NULL, Ref(RefName("layer", name)))]
    if add:
        items.append(("selectionModifier", Enum("selectionModifierType", "addToSelection")))
    items.append(("makeVisible", Bool(False)))
    return [Event("select", "Sélectionner " + name, items)]


def deselect():
    return [Event("set", "Désélectionner", [(NULL, SEL), ("to", Enum("ordinal", "none"))])]


def select_all():
    return [Event("set", "Tout sélectionner", [(NULL, SEL), ("to", Enum("ordinal", "allEnum"))])]


def set_layer(name=None, mode=None, opacity=None):
    props = []
    if name is not None: props.append(("name", Text(name)))
    if mode is not None: props.append(("mode", Enum("blendMode", mode)))
    if opacity is not None: props.append(("opacity", Pct(opacity)))
    return [Event("set", "Réglages du calque", [(NULL, TARGET), ("to", Obj("layer", props))])]


def stamp(name):
    """Fusion des calques visibles sur un nouveau calque (fonctionne aussi avec un seul calque)."""
    return select_top() + select_all() + [
        Event("copyMerged", "Copier avec fusion", []),
        Event("paste", "Coller", []),
    ] + deselect() + set_layer(name, "normal", 100)


def new_layer(name):
    return [Event("make", "Nouveau calque", [(NULL, Ref(RefClass("layer"))), ("using", Obj("layer", [("name", Text(name))]))])]


def fill(contents, color=None):
    items = [("using", Enum("fillContents", contents))]
    if color: items.append(("color", rgb(color)))
    items += [("opacity", Pct(100)), ("mode", Enum("blendMode", "normal"))]
    return [Event("fill", "Remplir", items)]


def gray_layer(name, mode="overlay", opacity=100):
    return select_top() + new_layer(name) + select_all() + fill("gray") + deselect() + set_layer(None, mode, opacity)


def adjustment(name, type_cls, type_items, mode="normal", opacity=100):
    return [Event("make", "Calque de réglage", [
        (NULL, Ref(RefClass("adjustmentLayer"))),
        ("using", Obj("adjustmentLayer", [("type", Obj(type_cls, type_items))]))])] + set_layer(name, mode, opacity)


def solid_color(name, color, mode="normal", opacity=100, dialog=False):
    ev = Event("make", "Calque de remplissage", [
        (NULL, Ref(RefClass("contentLayer"))),
        ("using", Obj("contentLayer", [("type", Obj("solidColorLayer", [("color", rgb(color))]))]))], dialog=dialog)
    return [ev] + set_layer(name, mode, opacity)


def curves_items(channels):
    adj = []
    for ch, pts in channels:
        adj.append(Obj("curvesAdjustment", [
            ("channel", Ref(RefEnum("channel", "channel", ch))),
            ("curve", List([Obj("paint", [("horizontal", Dbl(x)), ("vertical", Dbl(y))]) for x, y in pts]))]))
    return [("presetKind", Enum("presetKindType", "presetKindCustom")), ("adjustment", List(adj))]


def color_balance_items(sh, mid, hi):
    return [("shadowLevels", List([Long(v) for v in sh])), ("midtoneLevels", List([Long(v) for v in mid])),
            ("highlightLevels", List([Long(v) for v in hi])), ("preserveLuminosity", Bool(True))]


def vibrance_items(v, s): return [("vibrance", Long(v)), ("saturation", Long(s))]


def gradient_map_items(stops):
    colors = [Obj("colorStop", [("color", rgb(c)), ("type", Enum("colorStopType", "userStop")),
                                ("location", Long(round(l * 4096))), ("midpoint", Long(50))]) for l, c in stops]
    transp = [Obj("transferSpec", [("opacity", Pct(100)), ("location", Long(l)), ("midpoint", Long(50))]) for l in (0, 4096)]
    grad = Obj("gradientClassEvent", [("name", Text("Dak Gold")), ("gradientForm", Enum("gradientForm", "customStops")),
                                      ("interfaceIconFrameDimmed", Dbl(4096)), ("colors", List(colors)), ("transparency", List(transp))])
    return [("gradient", grad)]


def curve_pixels(pts):
    return [Event("curves", "Courbes", curves_items([("composite", pts)]))]


# Filtres --------------------------------------------------------------------
def high_pass(r): return [Event("highPass", "Passe-haut", [("radius", Px(r))])]
def gaussian(r): return [Event("gaussianBlur", "Flou gaussien", [("radius", Px(r))])]
def unsharp(a, r, t): return [Event("unsharpMask", "Accentuation", [("amount", Pct(a)), ("radius", Px(r)), ("threshold", Long(t))])]
def noise(a): return [Event("addNoise", "Ajout de bruit", [("distribution", Enum("distribution", "gaussianDistribution")), ("noise", Pct(a)), ("monochromatic", Bool(True))])]
def motion(angle, d): return [Event("motionBlur", "Flou directionnel", [("angle", Long(angle)), ("distance", Px(d))])]
def maximum(r): return [Event("maximum", "Maximum", [("radius", Px(r))])]
def ripple(a, size): return [Event("ripple", "Ondulation", [("amount", Long(a)), ("rippleSize", Enum("rippleSize", size))])]
def desaturate(): return [Event("desaturate", "Désaturation", [])]
def invert(): return [Event("invert", "Négatif", [])]
def clouds(): return [Event("clouds", "Nuages", [])]


def set_colors(fg, bg):
    return [Event("set", "Couleur de premier plan", [(NULL, Ref(RefProp("color", "foregroundColor"))), ("to", rgb(fg))]),
            Event("set", "Couleur d'arrière-plan", [(NULL, Ref(RefProp("color", "backgroundColor"))), ("to", rgb(bg))])]


# Sélections et masques -----------------------------------------------------------
def load_luminosity(shadows=False):
    ev = [Event("set", "Sélection de luminosité", [(NULL, SEL), ("to", Ref(RefEnum("channel", "channel", "RGB")))])]
    if shadows:
        ev.append(Event("inverse", "Intervertir", []))
    return ev


def inverse(): return [Event("inverse", "Intervertir", [])]


def make_mask(mode):
    return [Event("make", "Masque de fusion", [("new", ClassT("channel")),
                                              ("at", Ref(RefEnum("channel", "channel", "mask"))),
                                              ("using", Enum("userMaskEnabled", mode))])]


def target_pixels():
    return [Event("select", "Cibler les pixels", [(NULL, Ref(RefEnum("channel", "channel", "RGB"))), ("makeVisible", Bool(False))])]


def feather(r): return [Event("feather", "Contour progressif", [("radius", Px(r))])]


def ellipse_pct(top, left, bottom, right):
    return [Event("set", "Sélection elliptique", [(NULL, SEL), ("to", Obj("ellipse", [
        ("top", Pct(top)), ("left", Pct(left)), ("bottom", Pct(bottom)), ("right", Pct(right))])), ("antiAlias", Bool(True))])]


def polygon_pct(points, add=False):
    pts = List([Obj("paint", [("horizontal", Pct(x)), ("vertical", Pct(y))]) for x, y in points])
    return [Event("addTo" if add else "set", "Sélection polygonale", [(NULL, SEL), ("to", Obj("polygon", [("points", pts)])), ("antiAlias", Bool(True))])]


def select_subject():
    return [Event("autoCutout", "Sélectionner le sujet", [("sampleAllLayers", Bool(False))])]


def stroke(width, color, location="outside"):
    return [Event("stroke", "Contour", [("width", Long(width)), ("location", Enum("strokeLocation", location)),
                                       ("opacity", Pct(100)), ("mode", Enum("blendMode", "normal")), ("color", rgb(color))])]


def duplicate(name):
    return [Event("duplicate", "Dupliquer le calque", [(NULL, TARGET), ("name", Text(name))])]


def clip():
    return [Event("groupEvent", "Masque d'écrêtage", [(NULL, TARGET)])]


def group(names, group_name):
    """Regroupe les calques nommés (du bas vers le haut) dans un groupe."""
    ev = select_named(names[0])
    for n in names[1:]:
        ev += select_named(n, add=True)
    ev.append(Event("make", "Grouper les calques", [(NULL, Ref(RefClass("layerSection"))), ("from", TARGET)]))
    return ev + set_layer(group_name)


# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
GOLD = dict(noir="0e0705", chocolat="2a1209", bronze="8a5a2b", or_="c9a064", orClair="e3c48a", champagne="efdcb0", papier="efe2c4")
GLOW = {
    "Or": dict(core="fff4dc", halo="e3b768", outer="c9702a"),
    "Crème": dict(core="ffffff", halo="efdcb0", outer="c9a064"),
    "Feu": dict(core="fff1d6", halo="ff7a1a", outer="d8191f"),
    "Électrique": dict(core="ffffff", halo="8fd8ff", outer="2f6bff"),
}
FX = {"Rouge": "d8191f", "Orange": "ff6a1a", "Or": "e3b768", "Bleu": "3d7bff", "Blanc": "ffffff"}

# Couleurs des actions dans le panneau : 0 aucune, 1 rouge, 2 orange, 3 jaune, 4 vert, 5 bleu, 6 violet, 7 gris
C_NONE, C_RED, C_ORANGE, C_YELLOW, C_GREEN, C_BLUE, C_VIOLET, C_GRAY = range(8)

# ---------------------------------------------------------------------------
# Recettes (chaque recette = liste d'événements)
# ---------------------------------------------------------------------------

def look(name, layers):
    """layers : liste (nom du calque, événements)."""
    ev = select_top()
    for _, steps in layers:
        ev += steps
    return ev + group([n for n, _ in layers], "Look · " + name)


def matchday_rouge():
    return look("Matchday Rouge", [
        ("Courbe Matchday", adjustment("Courbe Matchday", "curves", curves_items([
            ("composite", [(0, 6), (50, 38), (128, 130), (200, 214), (255, 250)]),
            ("red", [(0, 16), (128, 140), (255, 255)]),
            ("green", [(0, 4), (128, 122), (255, 246)]),
            ("blue", [(0, 4), (128, 110), (255, 224)])]))),
        ("Ombres rouge sang", adjustment("Ombres rouge sang", "colorBalance", color_balance_items([24, -4, -6], [10, 0, -8], [4, 2, -16]))),
        ("Punch couleur", adjustment("Punch couleur", "vibrance", vibrance_items(10, -4))),
        ("Voile crème", solid_color("Voile crème", GOLD["champagne"], "softLight", 12)),
    ])


def bleu_orange():
    return look("Bleu Glacé × Orange", [
        ("Courbe bleu glacé", adjustment("Courbe bleu glacé", "curves", curves_items([
            ("composite", [(0, 10), (56, 46), (128, 130), (200, 214), (255, 248)]),
            ("red", [(0, 0), (70, 58), (190, 200), (255, 255)]),
            ("green", [(0, 6), (128, 128), (255, 250)]),
            ("blue", [(0, 30), (80, 92), (190, 182), (255, 230)])]))),
        ("Split bleu / orange", adjustment("Split bleu / orange", "colorBalance", color_balance_items([-20, 0, 24], [-4, 0, 6], [14, 0, -12]))),
        ("Désaturation ciné", adjustment("Désaturation ciné", "vibrance", vibrance_items(6, -20))),
        ("Grit (détails rugueux)", stamp("Grit (détails rugueux)") + desaturate() + high_pass(6) + set_layer(None, "overlay", 60)),
        ("Grain sale", gray_layer("Grain sale") + noise(11) + gaussian(0.8)),
    ])


def gold_legend():
    return look("Gold Legend", [
        ("Courbe or", adjustment("Courbe or", "curves", curves_items([
            ("composite", [(0, 16), (64, 58), (128, 132), (192, 204), (255, 246)]),
            ("red", [(0, 0), (128, 136), (255, 255)]),
            ("green", [(0, 0), (128, 129), (255, 252)]),
            ("blue", [(0, 14), (128, 112), (255, 222)])]))),
        ("Balance or & chocolat", adjustment("Balance or & chocolat", "colorBalance", color_balance_items([10, 0, -14], [6, 2, -12], [8, 3, -22]))),
        ("Vibrance douce", adjustment("Vibrance douce", "vibrance", vibrance_items(-6, -14))),
        ("Voile doré", solid_color("Voile doré", GOLD["or_"], "softLight", 18)),
    ])


def champion_70s():
    return look("Champion 70s", [
        ("Noirs délavés", adjustment("Noirs délavés", "curves", curves_items([
            ("composite", [(0, 42), (60, 72), (128, 134), (200, 210), (255, 236)]),
            ("blue", [(0, 30), (128, 116), (255, 210)])]))),
        ("Balance 70s", adjustment("Balance 70s", "colorBalance", color_balance_items([14, -4, -18], [8, 0, -16], [4, 4, -20]))),
        ("Couleurs passées", adjustment("Couleurs passées", "vibrance", vibrance_items(-12, -22))),
        ("Papier vieilli", solid_color("Papier vieilli", GOLD["papier"], "multiply", 12)),
        ("Grain 70s", gray_layer("Grain 70s") + noise(9) + gaussian(0.7)),
    ])


def black_gold():
    return look("Black & Gold", [
        ("Dégradé noir → or", adjustment("Dégradé noir → or", "gradientMapClass", gradient_map_items([
            (0, GOLD["noir"]), (0.3, GOLD["chocolat"]), (0.62, GOLD["bronze"]), (0.85, GOLD["or_"]), (1, GOLD["champagne"])]))),
        ("Contraste dramatique", adjustment("Contraste dramatique", "curves", curves_items([
            ("composite", [(0, 0), (60, 40), (128, 128), (196, 214), (255, 255)])]), "luminosity")),
    ])


def glow_layer():
    return stamp("Halo lumineux") + gaussian(30) + load_luminosity() + make_mask("revealSelection") + deselect() + target_pixels() + set_layer(None, "screen", 35)


def trophy_glow():
    return look("Trophy Glow", [
        ("Halo lumineux", glow_layer()),
        ("Chaleur trophée", adjustment("Chaleur trophée", "colorBalance", color_balance_items([6, 0, -8], [4, 2, -10], [10, 5, -28]))),
        ("Lumière dorée", solid_color("Lumière dorée", GOLD["orClair"], "softLight", 22)),
    ])


def nettete(): return stamp("Netteté pro (passe-haut)") + desaturate() + high_pass(1.6) + set_layer(None, "overlay", 100)
def clarte(): return stamp("Clarté") + unsharp(22, 60, 0) + set_layer(None, "luminosity", 80)
def hdr_sport(): return stamp("HDR Sport") + desaturate() + high_pass(10) + set_layer(None, "linearLight", 45)
def grain(): return gray_layer("Grain argentique", "overlay", 70) + noise(7) + gaussian(0.6)


def separation_frequences():
    low, high = "Basse fréquence (teint)", "Haute fréquence (texture)"
    apply_image = Event("applyImageEvent", "Appliquer l'image", [("with", Obj("calculation", [
        ("to", Ref(RefEnum("channel", "channel", "RGB"), RefName("layer", low))),
        ("calculation", Enum("calculationType", "subtract")), ("scale", Dbl(2)), ("offset", Long(128))]))])
    return (stamp(low) + duplicate(high) + select_named(low) + gaussian(8) + select_named(high) + [apply_image]
            + set_layer(None, "linearLight") + group([low, high], "Séparation de fréquences (8 bits)") + select_named(low))


def peau_douce():
    return (stamp("Peau douce : peins en blanc sur la peau") + invert() + set_layer(None, "vividLight", 70)
            + high_pass(9) + gaussian(2.5) + make_mask("hideAll"))


def texture_peau(): return stamp("Texture de peau") + desaturate() + high_pass(1.2) + set_layer(None, "linearLight", 45)


def reflets_peau():
    return look("Reflets de peau", [
        ("Reflets brillants", adjustment("Reflets brillants", "curves", curves_items([
            ("composite", [(0, 0), (160, 158), (215, 240), (255, 255)])]), "luminosity")),
        ("Texture de peau", texture_peau()),
    ])


def boost_lumieres():
    return select_top() + load_luminosity() + adjustment("Booster lumières", "curves", curves_items([("composite", [(0, 0), (128, 150), (255, 255)])]), "luminosity") + deselect()


def ombres_profondes():
    return select_top() + load_luminosity(True) + adjustment("Ombres profondes", "curves", curves_items([("composite", [(0, 0), (128, 100), (255, 255)])]), "luminosity") + deselect()


def ouvrir_ombres():
    return select_top() + load_luminosity(True) + adjustment("Ouvrir les ombres", "curves", curves_items([("composite", [(0, 8), (100, 136), (255, 255)])]), "luminosity", 70) + deselect()


def dodge_burn_auto():
    return boost_lumieres() + ombres_profondes() + group(["Booster lumières", "Ombres profondes"], "Volume · Dodge & Burn auto")


def dodge_burn_manuel(): return gray_layer("Dodge & Burn : pinceau blanc / noir à 5 %")


def contraste_s():
    return select_top() + adjustment("Contraste S", "curves", curves_items([("composite", [(0, 0), (64, 50), (192, 208), (255, 255)])]), "luminosity")


def vignette():
    return (select_top() + ellipse_pct(6, 6, 94, 94) + feather(420) + inverse()
            + adjustment("Vignette", "curves", curves_items([("composite", [(0, 0), (128, 88), (255, 196)])])) + deselect())


# Contours lumineux --------------------------------------------------------------
def contour_lumineux(cname):
    c = GLOW[cname]
    passes = [("Halo large", 6, c["outer"], 45, "screen", 80),
              ("Halo", 4, c["halo"], 14, "linearDodge", 85),
              ("Fil lumineux", 3, c["core"], 1.5, "linearDodge", 100)]
    ev = select_subject() + select_top()
    for name, w, col, _, _, _ in passes:
        ev += new_layer(name) + stroke(w, col, "outside")
    ev += deselect()
    for name, _, _, blur, mode, op in passes:
        ev += select_named(name) + gaussian(blur) + set_layer(None, mode, op)
    return ev + group([p[0] for p in passes], "Contour lumineux · " + cname)


def contour_eclair(cname):
    c = GLOW[cname]
    return (select_subject() + select_top() + new_layer("Éclair (cœur)") + stroke(3, c["core"], "center") + deselect()
            + ripple(320, "large") + ripple(180, "medium") + set_layer(None, "linearDodge")
            + duplicate("Éclair (lueur)") + gaussian(12) + set_layer(None, "linearDodge", 90)
            + solid_color("Couleur éclair", c["halo"], "multiply") + clip()
            + select_named("Éclair (lueur)") + duplicate("Éclair (aura)") + gaussian(40) + set_layer(None, "screen", 70)
            # l'aura est dupliquée sous la couleur écrêtée : on la remonte tout en haut
            + [Event("move", "Placer au premier plan", [(NULL, TARGET), ("to", Ref(RefEnum("layer", "ordinal", "front")))])]
            + group(["Éclair (cœur)", "Éclair (lueur)", "Couleur éclair", "Éclair (aura)"], "Contour éclair · " + cname + " : efface le surplus"))


def rim_light(cname):
    c = GLOW[cname]
    return (select_subject() + select_top() + new_layer("Rim light · " + cname) + stroke(18, c["halo"], "inside")
            + make_mask("revealSelection") + deselect() + target_pixels() + gaussian(14) + set_layer(None, "screen", 75))


# Ambiance -----------------------------------------------------------------------
def smoke(name, color, top, opacity):
    return (select_top() + new_layer(name) + set_colors(color, "000000") + clouds()
            + curve_pixels([(0, 0), (70, 0), (200, 210), (255, 255)]) + gaussian(6)
            + ellipse_pct(top, -25, 145, 125) + feather(500) + make_mask("revealSelection") + deselect() + target_pixels()
            + set_layer(None, "screen", opacity))


def etincelles(cname):
    return (select_top() + new_layer("Étincelles") + select_all() + fill("gray") + deselect() + noise(28)
            + curve_pixels([(0, 0), (212, 0), (255, 255)]) + maximum(1.5) + motion(35, 45)
            + curve_pixels([(0, 0), (70, 255), (255, 255)]) + set_layer(None, "linearDodge")
            + solid_color("Couleur étincelles", FX[cname], "multiply") + clip()
            + group(["Étincelles", "Couleur étincelles"], "Étincelles · " + cname + " : masque le surplus"))


def light_leak(cname):
    return (select_top() + new_layer("Light leak · " + cname) + ellipse_pct(-25, -35, 45, 35) + fill("color", FX[cname])
            + ellipse_pct(60, 70, 130, 135) + fill("color", "ffb070") + deselect() + gaussian(220) + set_layer(None, "screen", 75))


def trainee(cname):
    return (select_top() + new_layer("Traînée lumineuse · " + cname + " (Cmd+T)")
            + polygon_pct([(-10, 47), (110, 47), (110, 53), (-10, 53)]) + fill("color", FX[cname])
            + polygon_pct([(10, 49.3), (90, 49.3), (90, 50.7), (10, 50.7)]) + fill("color", "ffffff") + deselect()
            + motion(0, 600) + gaussian(6) + set_layer(None, "linearDodge"))


def film_raye():
    return gray_layer("Texture film rayé", "overlay", 45) + noise(24) + motion(90, 300) + curve_pixels([(0, 0), (110, 60), (146, 196), (255, 255)])


def papier_use():
    return gray_layer("Papier usé", "overlay", 40) + set_colors("9a9a9a", "626262") + clouds() + noise(6)


# Signature : sol en perspective inclinée -------------------------------------------
def sol_incline(descend=True):
    yl, yr = (70.0, 80.0) if descend else (80.0, 70.0)

    def ey(x): return yl + (yr - yl) * x / 100.0

    def band(t0, t1): return [(-5, ey(-5) + t0), (105, ey(105) + t0), (105, ey(105) + t1), (-5, ey(-5) + t1)]
    ground = [(-5, ey(-5)), (105, ey(105)), (105, 105), (-5, 105)]

    ev = select_top()
    # 1. Sol
    ev += new_layer("Sol") + polygon_pct(ground) + fill("color", "140c09") + deselect() + noise(9) + gaussian(0.8)
    # 2. Grille en perspective
    ev += new_layer("Lignes de perspective")
    vp = (50.0, ey(50) - 6)
    t = 0.2
    for i in range(17):
        bx = -160 + 420 * i / 16
        ev += polygon_pct([vp, (bx - t, 105), (bx + t, 105)], add=i > 0)
    for d in (1.2, 3, 5.8, 10, 16, 25):
        t2 = max(0.08, 0.06 + d * 0.012)
        ev += polygon_pct(band(d - t2, d + t2), add=True)
    ev += fill("color", GOLD["champagne"]) + polygon_pct(ground) + make_mask("revealSelection") + deselect() + target_pixels()
    ev += set_layer(None, "softLight", 40)
    # 3. Reflet doré
    ev += new_layer("Reflet du sol") + polygon_pct(band(0, 5)) + fill("color", GOLD["or_"]) + deselect() + gaussian(40) + set_layer(None, "softLight", 50)
    # 4. Ligne d'horizon + halo
    ev += new_layer("Ligne d'horizon") + polygon_pct(band(-0.12, 0.12)) + fill("color", GOLD["champagne"]) + deselect() + gaussian(1) + set_layer(None, "linearDodge")
    ev += duplicate("Halo d'horizon") + gaussian(22) + set_layer(None, "screen", 80)
    # 5. Ombre portée au centre du bord (à déplacer sous le joueur)
    ev += new_layer("Ombre portée (à placer sous le joueur)") + ellipse_pct(ey(50) + 1.5, 22, ey(50) + 6.5, 78) + fill("black") + deselect() + gaussian(30) + set_layer(None, "multiply", 75)
    names = ["Sol", "Lignes de perspective", "Reflet du sol", "Ligne d'horizon", "Halo d'horizon", "Ombre portée (à placer sous le joueur)"]
    return ev + group(names, "Signature · Sol incliné " + ("↘" if descend else "↗"))


def affiche_sport():
    ev = clarte() + nettete() + dodge_burn_auto() + gold_legend() + grain() + vignette()
    names = ["Clarté", "Netteté pro (passe-haut)", "Volume · Dodge & Burn auto", "Look · Gold Legend", "Grain argentique", "Vignette"]
    return ev + group(names, "DAK · Affiche Sport")


# ---------------------------------------------------------------------------
# Jeu d'actions
# ---------------------------------------------------------------------------
ACTIONS = [
    ("★ AFFICHE SPORT · tout en 1 clic", affiche_sport(), C_ORANGE),
    ("— LOOKS —", [], C_GRAY),
    ("Look · Matchday Rouge", matchday_rouge(), C_RED),
    ("Look · Bleu Glacé × Orange", bleu_orange(), C_BLUE),
    ("Look · Gold Legend", gold_legend(), C_YELLOW),
    ("Look · Champion 70s", champion_70s(), C_YELLOW),
    ("Look · Black & Gold", black_gold(), C_YELLOW),
    ("Look · Trophy Glow", trophy_glow(), C_YELLOW),
    ("— NETTETÉ & TEXTURE —", [], C_GRAY),
    ("Netteté pro", nettete(), C_NONE),
    ("Clarté", clarte(), C_NONE),
    ("HDR Sport", hdr_sport(), C_NONE),
    ("Grain argentique", grain(), C_NONE),
    ("Film rayé", film_raye(), C_NONE),
    ("Papier usé", papier_use(), C_NONE),
    ("— PEAU —", [], C_GRAY),
    ("Séparation de fréquences (8 bits)", separation_frequences(), C_VIOLET),
    ("Peau douce (peindre en blanc)", peau_douce(), C_VIOLET),
    ("Texture de peau", texture_peau(), C_VIOLET),
    ("Reflets sueur", reflets_peau(), C_VIOLET),
    ("— LUMIÈRE & VOLUME —", [], C_GRAY),
    ("Booster lumières", boost_lumieres(), C_NONE),
    ("Ombres profondes", ombres_profondes(), C_NONE),
    ("Ouvrir les ombres", ouvrir_ombres(), C_NONE),
    ("Dodge & Burn auto", dodge_burn_auto(), C_NONE),
    ("Dodge & Burn manuel (calque gris)", dodge_burn_manuel(), C_NONE),
    ("Contraste S", contraste_s(), C_NONE),
    ("Vignette", vignette(), C_NONE),
    ("Halo lumineux", glow_layer(), C_NONE),
    ("— SIGNATURE (sélectionner le joueur) —", [], C_GRAY),
    ("Signature · Sol incliné ↘", sol_incline(True), C_ORANGE),
    ("Signature · Sol incliné ↗", sol_incline(False), C_ORANGE),
    ("— CONTOURS (sélectionner le joueur) —", [], C_GRAY),
    ("Lueur contour · Or", contour_lumineux("Or"), C_YELLOW),
    ("Lueur contour · Crème", contour_lumineux("Crème"), C_YELLOW),
    ("Lueur contour · Feu", contour_lumineux("Feu"), C_RED),
    ("Lueur contour · Électrique", contour_lumineux("Électrique"), C_BLUE),
    ("Éclair · Or", contour_eclair("Or"), C_YELLOW),
    ("Éclair · Électrique", contour_eclair("Électrique"), C_BLUE),
    ("Rim light · Or", rim_light("Or"), C_YELLOW),
    ("Rim light · Crème", rim_light("Crème"), C_YELLOW),
    ("— AMBIANCE —", [], C_GRAY),
    ("Fumigène · Rouge", smoke("Fumigène · Rouge", FX["Rouge"], 42, 90), C_RED),
    ("Fumigène · Or", smoke("Fumigène · Or", FX["Or"], 42, 90), C_YELLOW),
    ("Fumigène · Bleu", smoke("Fumigène · Bleu", FX["Bleu"], 42, 90), C_BLUE),
    ("Brume au sol", smoke("Brume au sol", "e8eef2", 60, 70), C_GRAY),
    ("Étincelles · Or", etincelles("Or"), C_YELLOW),
    ("Étincelles · Orange", etincelles("Orange"), C_ORANGE),
    ("Light leak · Rouge", light_leak("Rouge"), C_RED),
    ("Light leak · Orange", light_leak("Orange"), C_ORANGE),
    ("Traînée lumineuse · Or", trainee("Or"), C_YELLOW),
    ("Traînée lumineuse · Rouge", trainee("Rouge"), C_RED),
]


def build(path):
    acts = [action(name, events, color) for name, events, color in ACTIONS]
    data = action_set("Dak Retouch", acts)
    with open(path, "wb") as f:
        f.write(data)
    return len(data)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "Dak Retouch.atn")
    size = build(out)
    print(f"→ {out} ({len(ACTIONS)} actions, {size} octets)")
