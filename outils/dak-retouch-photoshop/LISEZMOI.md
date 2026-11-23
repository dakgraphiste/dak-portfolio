# Dak Retouch : panneau Photoshop

Panneau de retouche « affiche sport » en un clic, organisé en 4 onglets (**Retouche · Effets · Texte · Assets**), thème **clair / nuit** (☀/☾, double-clic : suivre Photoshop) et grille qui s'adapte à la largeur du panneau.

**Photoshop 2023 (v24.2) ou plus récent.**

## Installation

### Mac : paquet complet (recommandé)
1. Décompresser `Dak-Retouch-Mac.zip` (double-clic).
2. Dans le dossier **Dak Retouch**, faire **clic droit → Ouvrir** sur `Installer Dak Retouch.command`, puis confirmer **Ouvrir**. Le clic droit est nécessaire la première fois, car le script ne vient pas de l'App Store.
3. Le script installe le plugin via Creative Cloud et copie les assets dans `Documents/Dak Retouch/assets`.
4. Redémarrer Photoshop → **Plugins → Dak Retouch**.

Si macOS bloque toujours : **Réglages Système → Confidentialité et sécurité → Ouvrir quand même**.
Désinstaller : appli Creative Cloud → **Stock et Marketplace → Plug-ins** (ou **Gérer les plug-ins**) → Dak Retouch → Désinstaller.

Reconstruire le paquet Mac : `bash outils/dak-retouch-photoshop/installeur-mac/construire.sh`

### Méthode 1 : double-clic
1. Télécharger `Dak-Retouch.ccx`.
2. Double-cliquer dessus : Creative Cloud propose de l'installer (accepter l'avertissement « plugin tiers »).
3. Dans Photoshop : **Plugins → Dak Retouch**.

### Méthode 2 : UXP Developer Tool (si la méthode 1 est refusée)
1. Installer **UXP Developer Tool** depuis l'appli Creative Cloud (gratuit).
2. **Add Plugin** → choisir `manifest.json` dans ce dossier.
3. Photoshop ouvert, cliquer **Load** (le panneau apparaît).

## Utilisation
- Chaque bouton ajoute des **calques nommés et non destructifs** (souvent dans un groupe) en haut de la pile.
- **Ctrl/Cmd + Z** annule tout le bouton en une fois.
- **Curseur d'intensité** : règle l'opacité du calque ou du groupe sélectionné.
- Les rayons (netteté, flou, grain) s'adaptent automatiquement à la taille de l'image.

| Section | Boutons |
|---|---|
| Affiche Sport | Clarté + netteté + Dodge & Burn + Gold Legend + grain + vignette |
| Looks signature | Matchday Rouge, Bleu Glacé × Orange, Gold Legend, Champion 70s, Black & Gold, Trophy Glow |
| Netteté & texture | Netteté pro, Clarté, HDR Sport, Grain argentique |
| Peau | Séparation de fréquences, Peau douce (masque noir : peindre en blanc), Texture de peau, Reflets sueur |
| Lumière & volume | Booster lumières, Ombres profondes, Ouvrir les ombres, Dodge & Burn auto, Calque D&B manuel, Contraste S |
| Finitions | Vignette, Halo lumineux |
| **Effets** : signature | Sol en perspective inclinée (↘ ou ↗) : sol texturé, grille de fuite, horizon doré, ombre du joueur, signature le long de la pente, placé derrière le joueur |
| **Effets** : contours lumineux | Lueur contour, Éclair, Rim light, en Or, Crème, Feu ou Électrique |
| **Effets** : ambiance | Fumigène, Brume au sol, Étincelles, Light leak, Traînée lumineuse, en Rouge, Orange, Or, Bleu ou Blanc |
| **Effets** : textures | Grain argentique, Film rayé, Papier usé |
| **Texte** | Nom du joueur (prénom + NOM), Numéro géant, Bloc match (équipes, date, heure, stade), Titre géant derrière le joueur |
| **Assets** | Ta bibliothèque de PNG/PSD/SVG (logos, fumigènes, étincelles…) placés en un clic comme objets dynamiques |

## Pack d'assets fourni (dossier `assets/`)

13 éléments 2K générés pour le plugin. Dans l'onglet **Assets** → « Choisir le dossier » → sélectionner `assets`.

| Fichier | Mode de fusion appliqué |
|---|---|
| fumigene-rouge, fumigene-rouge-sol, fumigene-or, fumigene-bleu, smoke-blanc | Écran |
| sparks-or, braises-feu, eclair-or, eclair-bleu, flare-orange, light-leak-rouge | Écran |
| overlay-poussiere-rayures | Écran |
| texture-papier-creme | Produit |

Les champs texte, les polices, l'onglet et le thème sont mémorisés d'une session à l'autre.

**Polices** : indiquer le nom PostScript (ex. `Oswald-Bold`, `BebasNeue-Regular`). Si la police n'est pas installée, Photoshop la remplace.

**Contours lumineux** : sélectionner d'abord le calque **détouré** du joueur ; sa silhouette sert de contour. Sur une photo non détourée, le plugin lance « Sélectionner le sujet ».

## Recréer le paquet .ccx
```bash
cd outils/dak-retouch-photoshop && rm -f Dak-Retouch.ccx && zip -r Dak-Retouch.ccx manifest.json index.html index.js styles.css icons
```
