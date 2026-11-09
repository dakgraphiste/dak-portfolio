# dak.graphiste — portfolio de Davy Aymard Kouassi

Site portfolio animé (Astro + GSAP + Lenis), en ligne sur https://dak-portfolio-gray.vercel.app (Vercel).

## Lancer le site en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:4321.

## Modifier le contenu

Tout le contenu se trouve dans `src/data/site.ts` :

- **Coordonnées et réseaux** : objet `SITE`.
- **Projets** : liste `PROJECTS`. Pour chaque projet, remplir `year`, `role`, `brief`, `concept`, `challenge`, et mettre 3 visuels dans `gallery`.
- **Ajouter un projet** : déposer l'image d'origine (jpg/png) dans `images-src/`, puis ajouter une ligne `p(...)` dans `PROJECTS`. Les versions WebP optimisées sont générées automatiquement au build (`npm run images` pour les créer à la main). La page de l'étude de cas est créée automatiquement.
- **Formations** : liste `COURSES`.
- **Clients** : liste `CLIENTS`.

## À compléter

- Formulaire de contact : créer un formulaire gratuit sur https://formspree.io et remplacer `VOTRE_ID` dans `SITE.formAction`. En attendant, le formulaire ouvre un email vers dakgraphiste@gmail.com.
- Showreel : mettre le lien d'intégration YouTube/Vimeo dans `src/pages/showreel.astro` (`SHOWREEL.video`) : le bouton lecture apparaît alors.
- Statistiques : activer **Analytics** dans le projet Vercel (onglet Analytics → Enable).
- CV : déposer le PDF dans `public/` et renseigner son chemin dans `SITE.cv` : le bouton apparaît alors sur la page À propos.
- Portrait : remplacer le bloc « [Ton portrait] » dans `src/pages/a-propos.astro`.
- Textes entre crochets `[...]` dans les pages.

## Mise en ligne

Le dépôt GitHub est relié à Vercel : chaque `git push` sur `main` met le site à jour automatiquement.
