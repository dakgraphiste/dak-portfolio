#!/usr/bin/env python3
"""Relit un fichier .atn de bout en bout et affiche ses actions (vérification de structure)."""
import struct, sys

class R:
    def __init__(self, b): self.b, self.p = b, 0
    def take(self, n):
        if self.p + n > len(self.b): raise ValueError(f"fin de fichier inattendue à {self.p}")
        v = self.b[self.p:self.p + n]; self.p += n; return v
    def u32(self): return struct.unpack(">I", self.take(4))[0]
    def i32(self): return struct.unpack(">i", self.take(4))[0]
    def i16(self): return struct.unpack(">h", self.take(2))[0]
    def u8(self): return self.take(1)[0]
    def f64(self): return struct.unpack(">d", self.take(8))[0]
    def ustr(self):
        n = self.u32(); s = self.take(n * 2).decode("utf-16-be"); return s.rstrip("\x00")
    def ident(self):
        n = self.u32(); return self.take(4 if n == 0 else n).decode("ascii")

def value(r, t, depth):
    if t == "long": return r.i32()
    if t == "bool": return bool(r.u8())
    if t == "doub": return r.f64()
    if t == "UntF": u = r.take(4).decode(); return f"{r.f64()}{u}"
    if t == "TEXT": return r.ustr()
    if t == "enum": return f"{r.ident()}.{r.ident()}"
    if t == "type": r.ustr(); return f"class {r.ident()}"
    if t == "Objc": return desc(r, depth + 1)
    if t == "VlLs":
        n = r.u32(); return [value(r, r.take(4).decode(), depth + 1) for _ in range(n)]
    if t == "obj ":
        n = r.u32(); out = []
        for _ in range(n):
            k = r.take(4).decode()
            if k == "Enmr": r.ustr(); out.append(f"{r.ident()}:{r.ident()}.{r.ident()}")
            elif k == "prop": r.ustr(); out.append(f"{r.ident()}#{r.ident()}")
            elif k == "Clss": r.ustr(); out.append(f"class {r.ident()}")
            elif k == "name": r.ustr(); out.append(f"{r.ident()}'{r.ustr()}'")
            else: raise ValueError("référence inconnue " + k)
        return out
    raise ValueError(f"type inconnu {t!r} à {r.p}")

def desc(r, depth=0):
    r.ustr(); cls = r.ident(); n = r.u32(); d = {"_class": cls}
    for _ in range(n):
        k = r.ident(); t = r.take(4).decode(); d[k] = value(r, t, depth)
    return d

def main(path, verbose=False):
    r = R(open(path, "rb").read())
    assert r.u32() == 16, "version"
    name = r.ustr(); r.u8(); count = r.u32()
    print(f"Jeu « {name} » : {count} actions")
    total = 0
    for _ in range(count):
        r.i16(); r.u8(); r.u8(); r.i16(); an = r.ustr(); r.u8(); ne = r.u32(); total += ne
        print(f"  • {an} ({ne} étapes)")
        for _ in range(ne):
            r.u8(); r.u8(); r.u8(); r.u8()
            kind = r.take(4).decode()
            ev = r.take(r.u32()).decode() if kind == "TEXT" else r.take(4).decode()
            label = r.take(r.u32()).decode("utf-8")
            flag = r.i32()
            d = desc(r) if flag == -1 else None
            if verbose: print(f"      - {ev} [{label}] {d}")
    assert r.p == len(r.b), f"octets restants : {len(r.b) - r.p}"
    print(f"OK : fichier lu en entier ({len(r.b)} octets, {total} étapes).")

if __name__ == "__main__":
    main(sys.argv[1], "-v" in sys.argv)
