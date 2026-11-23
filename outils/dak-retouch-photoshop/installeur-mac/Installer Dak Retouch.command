#!/bin/bash
# Installe le plugin Dak Retouch dans Photoshop et copie le pack d'assets.
cd "$(dirname "$0")" || exit 1

echo ""
echo "  DAK RETOUCH · installation"
echo "  --------------------------"
echo ""

DEST="$HOME/Documents/Dak Retouch"
mkdir -p "$DEST"

# 1. Assets + dossier du plugin (utile pour UXP Developer Tool)
echo "→ Copie des assets et du plugin dans « Documents/Dak Retouch »…"
rm -rf "$DEST/assets" "$DEST/plugin"
cp -R assets "$DEST/"
cp -R plugin "$DEST/"
cp LISEZMOI.md "$DEST/" 2>/dev/null
echo "✔ Copiés."
echo ""

# 2. Installation via l'installeur officiel d'Adobe
UPIA="/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent"
OK=0
if [ -x "$UPIA" ]; then
  echo "→ Installation du plugin via Creative Cloud…"
  OUT="$("$UPIA" --install "$PWD/Dak-Retouch.ccx" 2>&1)"
  echo "$OUT"
  if echo "$OUT" | grep -qiE "fail|error|status = -"; then OK=0; else OK=1; fi
else
  echo "⚠ Installeur Adobe introuvable (Creative Cloud est-il installé et à jour ?)."
fi
echo ""

if [ "$OK" = "1" ]; then
  echo "✔ Plugin installé !"
  echo "Redémarre Photoshop, puis menu Plugins → Dak Retouch."
else
  echo "✖ Creative Cloud a refusé l'installation automatique."
  echo ""
  echo "  Solution qui marche à tous les coups (2 min) :"
  echo "  1. Appli Creative Cloud → cherche « UXP Developer Tool » → Installer."
  echo "  2. Ouvre Photoshop, puis lance UXP Developer Tool."
  echo "  3. Clique « Add Plugin » et choisis :"
  echo "       Documents/Dak Retouch/plugin/manifest.json"
  echo "  4. Clique « Load » : le panneau Dak Retouch s'ouvre dans Photoshop."
  echo ""
  echo "  (Si le code d'erreur est -2 : Réglages Système → Confidentialité et"
  echo "   sécurité → Accès complet au disque → active Creative Cloud et Photoshop,"
  echo "   puis relance ce script.)"
fi
echo ""
echo "Onglet Assets du panneau → choisis le dossier : Documents/Dak Retouch/assets"
echo ""
open "$DEST"
read -n 1 -s -r -p "Appuie sur une touche pour fermer…"
