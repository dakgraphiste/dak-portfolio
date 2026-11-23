# Dak Retouch : script Photoshop

Retouche « affiche sport » en un clic : looks signature (Matchday Rouge, Bleu Glacé × Orange, vintage or), netteté, peau, volume, contours lumineux et éclairs sur le joueur, fumigènes et ambiance, sol signature en perspective inclinée, textes (noms, équipes, titre géant) et bibliothèque d'assets.

Fenêtre à 4 onglets (**Retouche · Effets · Texte · Assets**), thème **clair / nuit**, redimensionnable. Fonctionne avec **Photoshop CC 2019 et plus récent** (Mac et Windows).

> Ce dossier contient deux versions : le **script** (`script/Dak Retouch.jsx`, recommandé, aucune installation Creative Cloud) et un **plugin UXP** (`manifest.json`, `index.*`) pour plus tard.

## Installation sur Mac
1. Décompresser `Dak-Retouch-Mac.zip`.
2. Dans le dossier **Dak Retouch** : **clic droit → Ouvrir** sur `Installer Dak Retouch.command`, puis **Ouvrir**.
3. Le script copie `Dak Retouch.jsx` dans le dossier **Presets/Scripts** de chaque Photoshop installé (mot de passe du Mac demandé si besoin) et les assets dans `Documents/Dak Retouch/assets`.
4. Redémarrer Photoshop → **Fichier → Scripts → Dak Retouch**.

**Sans rien installer** : Photoshop → **Fichier → Scripts → Parcourir…** → choisir `Dak Retouch.jsx`.

**Raccourci clavier** : Édition → Raccourcis clavier → Menus de l'application → Fichier → Scripts → Dak Retouch.

## Utilisation
- Ouvrir une image, lancer le script, cliquer sur les boutons : la fenêtre reste ouverte et l'image se met à jour.
- Chaque bouton crée des **calques nommés et non destructifs**, souvent en groupe, en haut de la pile.
- **Cmd/Ctrl + Z** annule un bouton entier. En cas d'erreur, l'image revient à son état d'avant et le message s'affiche en bas de la fenêtre.
- **Intensité** : règle l'opacité du calque ou du groupe sélectionné.
- Pour peindre un masque (Peau douce, Dodge & Burn…), fermer la fenêtre, peindre, puis relancer le script.
- Les champs texte, l'onglet, le thème et le dossier d'assets sont mémorisés.

| Onglet | Boutons |
|---|---|
| **Retouche** | Affiche Sport (tout en 1 clic) · Matchday Rouge, Bleu Glacé × Orange, Gold Legend, Champion 70s, Black & Gold, Trophy Glow · Netteté pro, Clarté, HDR Sport, Grain · Séparation de fréquences, Peau douce, Texture de peau, Reflets sueur · Booster lumières, Ombres profondes, Ouvrir les ombres, Dodge & Burn auto/manuel, Contraste S · Vignette, Halo |
| **Effets** | Sol signature incliné (↘/↗) · Lueur contour, Éclair, Rim light (Or, Crème, Feu, Électrique) · Fumigène, Brume, Étincelles, Light leak, Traînée (Rouge, Orange, Or, Bleu, Blanc) · Grain, Film rayé, Papier usé |
| **Texte** | Nom du joueur, Numéro géant, Bloc match, Titre géant derrière le joueur · polices au choix (nom PostScript, ex. `Oswald-Bold`) |
| **Assets** | Dossier de PNG/JPG/PSD/SVG : double-clic pour placer. Fumées, étincelles, éclairs, flares… en mode Écran ; papier en mode Produit |

**Contours lumineux, sol signature, titre géant** : sélectionner d'abord le calque **détouré** du joueur.

## Pack d'assets (`assets/`)
13 éléments 2K : fumigene-rouge, fumigene-rouge-sol, fumigene-or, fumigene-bleu, smoke-blanc, sparks-or, braises-feu, eclair-or, eclair-bleu, flare-orange, light-leak-rouge, overlay-poussiere-rayures, texture-papier-creme.

## Reconstruire le paquet Mac
```bash
bash outils/dak-retouch-photoshop/installeur-mac/construire.sh
```
