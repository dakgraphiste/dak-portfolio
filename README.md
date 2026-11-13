# dak.graphiste — portfolio de Davy Aymard Kouassi

Site portfolio animé (Astro + GSAP + Lenis), en ligne sur https://dak-portfolio-gray.vercel.app (Vercel).

## Lancer le site en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:4321.

## Mettre à jour le site (sans rien installer)

Tout se fait depuis le navigateur, sur GitHub. Chaque modification enregistrée est mise en ligne par Vercel en 1 à 2 minutes.

### Modifier un texte (coordonnées, projet, formation)

1. Ouvrir https://github.com/dakgraphiste/dak-portfolio/blob/main/src/data/site.ts
2. Cliquer sur l'icône crayon ✏️ (« Edit this file »).
3. Modifier le texte entre les guillemets, sans toucher aux virgules ni aux accolades.
4. Cliquer sur **Commit changes…** puis **Commit changes**. C'est en ligne 1 à 2 minutes après.

### Ajouter un nouveau projet

1. **Les images** : ouvrir https://github.com/dakgraphiste/dak-portfolio/tree/main/images-src → **Add file → Upload files**. Déposer :
   - `mon-projet.jpg` : la couverture (un visuel large) ;
   - `mon-projet-c1.jpg`, `mon-projet-c2.jpg`, `mon-projet-c3.jpg` : 3 visuels pour la cascade et la galerie.
   Puis **Commit changes**. (Les versions légères WebP sont créées automatiquement.)
2. **Les textes** : dans `src/data/site.ts`, copier un bloc `make({ ... }),` de la liste `PORTFOLIO` et l'adapter :
   - `slug` : l'adresse de la page (ex. `mon-projet` → /projets/mon-projet), en minuscules sans espace ni accent ;
   - `image` : le nom des fichiers sans extension (`mon-projet`) ;
   - `category` : `Identité`, `Réseaux sociaux`, `Campagnes`, `Packaging`, `Affiches` ou `Retouche` ;
   - `year`, `role`, `brief` (contexte), `concept`, `challenge` : facultatifs, ce qui est vide n'est pas affiché.
   Les projets placés en haut de la liste apparaissent en premier.
3. Ajouter la marque dans `CLIENTS` si elle doit défiler sur l'accueil.

### Boutique (mockups, extensions, templates…)

Les produits sont dans `src/data/shop.ts`. Pour chaque produit : nom, type (`Mockups`, `Extensions`, `Templates`, `Packs`), prix, description, contenu, images d'aperçu (à déposer dans `public/images/boutique/`).

- `buyUrl` : lien de paiement (Chariow, Selar, Gumroad…). Sans lien, le bouton ouvre une commande WhatsApp pré-remplie.
- `published: true` pour mettre le produit en ligne (`false` pour le masquer).
- Le menu « Boutique » et l'encart de l'accueil apparaissent automatiquement dès qu'un produit est publié.
- Aperçu en local avec les produits non publiés : `PREVIEW_DRAFTS=1 npm run build`.

### Autres réglages fréquents

- **CV** : déposer le PDF dans `public/`, puis mettre son chemin dans `SITE.cv` (ex. `'/cv-davy-aymard-kouassi.pdf'`).
- **Showreel** : coller le lien d'intégration YouTube (`https://www.youtube.com/embed/ID`) dans `SHOWREEL.video` de `src/pages/showreel.astro`.
- **Formulaire de contact** : remplacer `VOTRE_ID` dans `SITE.formAction` par l'identifiant Formspree.
- **Mascotte Let'z Go** : composant `src/components/Mascot.astro`, utilisé dans les bandeaux d'appel à l'action (pose et bulle réglables).

En cas d'erreur, Vercel garde l'ancienne version en ligne. On peut revenir en arrière dans Vercel → Deployments → ⋯ → **Promote to Production** sur une version précédente.

## Statistiques de visites

- **Vercel Analytics** (déjà intégré au code, sans cookies) : sur vercel.com → projet `dak-portfolio` → onglet **Analytics** → **Enable**. On y voit les visiteurs, pages vues, pages les plus vues, pays, appareils et sites d'origine.
- **Vitesse réelle** (facultatif) : onglet **Speed Insights** → **Enable**.
- **Google** : https://search.google.com/search-console → ajouter `https://dak-portfolio-gray.vercel.app` → envoyer le plan du site `sitemap-index.xml`. On y voit les recherches Google qui mènent au site.

## À compléter

- Formulaire de contact : créer un formulaire gratuit sur https://formspree.io et remplacer `VOTRE_ID` dans `SITE.formAction`. En attendant, le formulaire ouvre un email vers dakgraphiste@gmail.com.
- Showreel : mettre le lien d'intégration YouTube/Vimeo dans `src/pages/showreel.astro` (`SHOWREEL.video`) : le bouton lecture apparaît alors.
- Statistiques : activer **Analytics** dans le projet Vercel (onglet Analytics → Enable).
- CV : déposer le PDF dans `public/` et renseigner son chemin dans `SITE.cv` : le bouton apparaît alors sur la page À propos.
- Portrait : remplacer le bloc « [Ton portrait] » dans `src/pages/a-propos.astro`.
- Textes entre crochets `[...]` dans les pages.

## Mise en ligne

Le dépôt GitHub est relié à Vercel : chaque `git push` sur `main` met le site à jour automatiquement.

## Formations (Dak Studio School)

Tout se trouve dans `src/data/academy.ts` :
- **Cours** (`COURSES`) : titre, thème, niveau (Débutant / Intermédiaire / Avancé), durée, modules et leçons. Adresse : `/formations/<slug>`.
- **Parcours** (`TRACKS`) : liste de cours qui s'enchaînent. Adresse : `/formations/parcours/<slug>`.
- Vidéo tournée : passer la leçon en `ready: true` (`free: true` pour un aperçu gratuit).
- Ouverture des inscriptions : `status: 'ouvert'` et `price: '25 000 FCFA'`. Plus tard, `buyUrl` pourra pointer vers le paiement / le portail élève.
