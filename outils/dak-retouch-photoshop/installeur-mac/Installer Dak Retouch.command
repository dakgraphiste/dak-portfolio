#!/bin/bash
# Installe le script Dak Retouch dans Photoshop (Fichier > Scripts) et copie les assets.
cd "$(dirname "$0")" || exit 1

echo ""
echo "  DAK RETOUCH · installation"
echo "  --------------------------"
echo ""

DEST="$HOME/Documents/Dak Retouch"
mkdir -p "$DEST"
echo "→ Copie des assets et du script dans « Documents/Dak Retouch »…"
rm -rf "$DEST/assets"
cp -R assets "$DEST/"
cp "Dak Retouch.jsx" "$DEST/"
cp LISEZMOI.md "$DEST/" 2>/dev/null
echo "✔ Copiés."
echo ""

FOUND=0
for PS in /Applications/Adobe\ Photoshop*/; do
  [ -d "$PS" ] || continue
  FOUND=1
  SCRIPTS="${PS}Presets/Scripts"
  echo "→ $(basename "$PS")"
  if mkdir -p "$SCRIPTS" 2>/dev/null && cp "Dak Retouch.jsx" "$SCRIPTS/" 2>/dev/null; then
    echo "  ✔ Script installé."
  else
    echo "  Mot de passe administrateur du Mac requis (rien ne s'affiche quand tu tapes) :"
    if sudo mkdir -p "$SCRIPTS" && sudo cp "Dak Retouch.jsx" "$SCRIPTS/"; then
      echo "  ✔ Script installé."
    else
      echo "  ✖ Copie impossible dans ce dossier."
    fi
  fi
done

echo ""
if [ "$FOUND" = "1" ]; then
  echo "Terminé ! Redémarre Photoshop, puis : Fichier → Scripts → Dak Retouch."
else
  echo "Photoshop introuvable dans /Applications."
fi
echo "Sans redémarrer : Fichier → Scripts → Parcourir… → Documents/Dak Retouch/Dak Retouch.jsx"
echo ""
open "$DEST"
read -n 1 -s -r -p "Appuie sur une touche pour fermer…"
