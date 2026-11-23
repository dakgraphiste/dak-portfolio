#!/bin/bash
# Construit Dak-Retouch-Mac.zip : plugin .ccx + script d'installation + assets.
# Usage : bash outils/dak-retouch-photoshop/installeur-mac/construire.sh [dossier de sortie]
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT}"
TMP="$(mktemp -d)"
PKG="$TMP/Dak Retouch"
mkdir -p "$PKG"
(cd "$ROOT" && rm -f Dak-Retouch.ccx && zip -qr -D -X Dak-Retouch.ccx manifest.json index.html index.js styles.css icons)
mkdir -p "$PKG/plugin" && (cd "$ROOT" && cp -R manifest.json index.html index.js styles.css icons "$PKG/plugin/")
cp "$ROOT/Dak-Retouch.ccx" "$ROOT/LISEZMOI.md" "$PKG/"
cp "$ROOT/installeur-mac/Installer Dak Retouch.command" "$PKG/"
chmod +x "$PKG/Installer Dak Retouch.command"
cp -R "$ROOT/assets" "$PKG/assets"
(cd "$TMP" && rm -f "$OUT/Dak-Retouch-Mac.zip" && zip -qr -X "$OUT/Dak-Retouch-Mac.zip" "Dak Retouch")
rm -rf "$TMP"
echo "→ $OUT/Dak-Retouch-Mac.zip"
