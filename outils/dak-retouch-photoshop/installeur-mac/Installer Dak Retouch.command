#!/bin/bash
# Installe le plugin Dak Retouch dans Photoshop et copie le pack d'assets.
cd "$(dirname "$0")" || exit 1

echo ""
echo "  DAK RETOUCH · installation"
echo "  --------------------------"
echo ""

UPIA="/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent"

if [ -x "$UPIA" ]; then
  echo "→ Installation du plugin via Creative Cloud…"
  if "$UPIA" --install "$PWD/Dak-Retouch.ccx"; then
    echo "✔ Plugin installé."
  else
    echo "⚠ L'installation automatique a échoué : ouverture du fichier .ccx dans Creative Cloud."
    open "Dak-Retouch.ccx"
  fi
else
  echo "→ Installeur Adobe introuvable : ouverture du fichier .ccx dans Creative Cloud."
  open "Dak-Retouch.ccx"
fi

DEST="$HOME/Documents/Dak Retouch"
echo "→ Copie des assets dans « Documents/Dak Retouch/assets »…"
mkdir -p "$DEST"
cp -R assets "$DEST/"
cp LISEZMOI.md "$DEST/" 2>/dev/null
echo "✔ Assets copiés."

echo ""
echo "Terminé ! Redémarre Photoshop, puis menu Plugins → Dak Retouch."
echo "Dans l'onglet Assets, choisis le dossier : Documents/Dak Retouch/assets"
echo ""
open "$DEST"
read -n 1 -s -r -p "Appuie sur une touche pour fermer…"
