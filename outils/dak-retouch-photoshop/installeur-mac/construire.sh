#!/bin/bash
# Construit Dak-Retouch-Mac.zip : script .jsx + script d'installation + assets.
# Usage : bash outils/dak-retouch-photoshop/installeur-mac/construire.sh [dossier de sortie]
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT}"
TMP="$(mktemp -d)"
PKG="$TMP/Dak Retouch"
mkdir -p "$PKG"
cp "$ROOT/script/Dak Retouch.jsx" "$ROOT/LISEZMOI.md" "$PKG/"
cp "$ROOT/installeur-mac/Installer Dak Retouch.command" "$PKG/"
chmod +x "$PKG/Installer Dak Retouch.command"
cp -R "$ROOT/assets" "$PKG/assets"
(cd "$TMP" && rm -f "$OUT/Dak-Retouch-Mac.zip" && zip -qr -X "$OUT/Dak-Retouch-Mac.zip" "Dak Retouch")
rm -rf "$TMP"
echo "→ $OUT/Dak-Retouch-Mac.zip"
