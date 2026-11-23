# Dak Retouch : panneau Photoshop

Panneau de retouche « affiche sport » en un clic, organisé en 4 onglets (**Retouche · Effets · Texte · Assets**), thème **clair / nuit** (☀/☾, double-clic : suivre Photoshop) et grille qui s'adapte à la largeur du panneau.

**Photoshop 2023 (v24.2) ou plus récent.**

## Installation

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
| **Effets** : contours lumineux | Lueur contour, Éclair, Rim light, en Or, Crème, Feu ou Électrique |
| **Effets** : ambiance | Fumigène, Brume au sol, Étincelles, Light leak, Traînée lumineuse, en Rouge, Orange, Or, Bleu ou Blanc |
| **Effets** : textures | Grain argentique, Film rayé, Papier usé |
| **Texte** | Nom du joueur (prénom + NOM), Numéro géant, Bloc match (équipes, date, heure, stade), Titre géant derrière le joueur |
| **Assets** | Ta bibliothèque de PNG/PSD/SVG (logos, fumigènes, étincelles…) placés en un clic comme objets dynamiques |

Les champs texte, les polices, l'onglet et le thème sont mémorisés d'une session à l'autre.

**Polices** : indiquer le nom PostScript (ex. `Oswald-Bold`, `BebasNeue-Regular`). Si la police n'est pas installée, Photoshop la remplace.

**Contours lumineux** : sélectionner d'abord le calque **détouré** du joueur ; sa silhouette sert de contour. Sur une photo non détourée, le plugin lance « Sélectionner le sujet ».

## Recréer le paquet .ccx
```bash
cd outils/dak-retouch-photoshop && rm -f Dak-Retouch.ccx && zip -r Dak-Retouch.ccx manifest.json index.html index.js styles.css icons
```
