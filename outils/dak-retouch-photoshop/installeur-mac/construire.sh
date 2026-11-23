#!/bin/bash
# Construit Dak-Retouch-Mac.zip : actions .atn + script .jsx (textes, assets) + assets.
# Usage : bash outils/dak-retouch-photoshop/installeur-mac/construire.sh [dossier de sortie]
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT}"
python3 "$ROOT/actions/construire_actions.py" "$ROOT/actions/Dak Retouch.atn"
python3 "$ROOT/actions/verifier_atn.py" "$ROOT/actions/Dak Retouch.atn" | tail -1
TMP="$(mktemp -d)"
PKG="$TMP/Dak Retouch"
mkdir -p "$PKG/Script (textes et assets)"
cp "$ROOT/actions/Dak Retouch.atn" "$ROOT/LISEZMOI.md" "$PKG/"
cp "$ROOT/script/Dak Retouch.jsx" "$PKG/Script (textes et assets)/"
cp -R "$ROOT/assets" "$PKG/assets"
(cd "$TMP" && rm -f "$OUT/Dak-Retouch-Mac.zip" && zip -qr -X "$OUT/Dak-Retouch-Mac.zip" "Dak Retouch")
rm -rf "$TMP"
echo "→ $OUT/Dak-Retouch-Mac.zip"
