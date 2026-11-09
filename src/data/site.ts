// Coordonnées et liens de Davy Aymard Kouassi (Dak.graphiste)
export const SITE = {
  brand: 'dak.graphiste',
  name: 'Davy Aymard Kouassi',
  role: 'Graphiste senior',
  city: "Abidjan, Côte d'Ivoire",
  email: 'dakgraphiste@gmail.com',
  phone: '+225 07 78 34 27 09',
  phoneHref: 'tel:+2250778342709',
  whatsapp: 'https://wa.me/2250778342709',
  behance: 'https://www.behance.net/davyaymard',
  linkedin: 'https://ci.linkedin.com/in/davy-aymard-kouassi-7a3861281',
  facebook: 'https://www.facebook.com/davy.aymard.kouassi.2025/',
  // Remplacer par l'identifiant Formspree (https://formspree.io) pour recevoir les messages du formulaire
  formAction: 'https://formspree.io/f/VOTRE_ID'
};

export const NAV = [
  { href: '/projets', label: 'Projets' },
  { href: '/showreel', label: 'Showreel' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/formations', label: 'Formations' },
  { href: '/contact', label: 'Contact' }
];

export type Project = {
  slug: string;
  title: string;
  client: string;
  category: 'Identité' | 'Affiches' | 'Publicité' | 'Réseaux sociaux' | 'Retouche';
  categoryLabel: string;
  deliverables: string;
  cover: string;
  behance: string;
  year: string;
  role: string;
  brief: string;
  concept: string;
  challenge: string;
  gallery: string[]; // 3 visuels du projet (en attendant : la couverture)
};

const ROLE = 'Direction artistique & design graphique [à confirmer]';
const TODO = {
  year: '[année]',
  role: ROLE,
  brief: "[Le besoin du client en 2 à 3 phrases : contexte, cible, objectif.]",
  concept: "[L'idée créative : ce qui a guidé les formes, les couleurs, la typo et le ton.]",
  challenge: "[La difficulté principale et comment tu l'as résolue : délai, contraintes, public, supports.]"
};

const p = (slug: string, title: string, client: string, category: Project['category'], categoryLabel: string, deliverables: string, cover: string, behanceId: string): Project => ({
  slug, title, client, category, categoryLabel, deliverables,
  cover: `/images/projets/${cover}`,
  behance: `https://www.behance.net/gallery/${behanceId}`,
  ...TODO,
  gallery: [`/images/projets/${cover}`, `/images/projets/${cover}`, `/images/projets/${cover}`]
});

export const PROJECTS: Project[] = [
  p('chapn', "Chap'n — Brand guidelines", "Chap'n", 'Identité', 'Identité visuelle', 'Logo, charte graphique, brand guidelines', 'chapn.png', '253832481/CHAPN-BRAND-GUIDELINES'),
  p('lumora', 'Lumora — Identité visuelle', 'Lumora', 'Identité', 'Identité visuelle', 'Logo, identité visuelle, déclinaisons', 'lumora.jpg', '243408119/Lumora-Branding-Visual-Identity'),
  p('pakinou', 'Pakinou', 'Pakinou', 'Identité', 'Identité visuelle', 'Logo, univers graphique', 'pakinou.png', '249453527/PROJET-PAKINOU'),
  p('kpalo-energie', 'KPALO Énergie — Campagne', 'KPALO Énergie', 'Publicité', 'Publicité', 'Campagne visuelle, affichage', 'kpalo.png', '225557179/Projet-Visuel-KPALO-ENERGIE'),
  p('freeandize', 'Freeandize — Packaging', 'Freeandize', 'Publicité', 'Packaging & publicité', 'Packaging, visuel publicitaire', 'freeandize.png', '220603885/PACKAGING-FREEANDIZE'),
  p('deborah-djaouri', 'Poster Deborah Djaouri', 'Deborah Djaouri', 'Affiches', 'Affiche', 'Poster', 'deborah-djaouri.jpg', '223583551/POSTER-DEBORAH-DJAOURI'),
  p('king-fish', 'King Fish — Posters & bannières', 'King Fish', 'Affiches', 'Affiches', 'Posters, bannières', 'king-fish.jpg', '223531183/KING-FISH-POSTERS-BANNERS'),
  p('poulet-a-gogo', 'Poulet à gogo — Social media', 'Poulet à gogo', 'Réseaux sociaux', 'Réseaux sociaux', 'Visuels social media', 'poulet-a-gogo.jpg', '220603711/SOCIAL-MEDIA-DESIGN-POULET-a-GOGO'),
  p('placali-chap', 'Placali Chap — Social media', 'Placali Chap', 'Réseaux sociaux', 'Réseaux sociaux', 'Visuels social media', 'placali-chap.jpg', '220603459/SOCIAL-MEDIA-DESIGN-PLACALI-CHAP'),
  p('finance', 'Finance — Social media', '[client]', 'Réseaux sociaux', 'Réseaux sociaux', 'Visuels social media', 'finance.jpg', '215856159/SOCIAL-MEDIA-DESIGN-FINANCE'),
  p('retouche-photo-1', 'Retouche photo — Série 1', '[client]', 'Retouche', 'Retouche photo', 'Retouche beauté', 'retouche-1.jpg', '238235983/RETOUCHE-PHOTO'),
  p('retouche-photo-2', 'Retouche photo — Série 2', '[client]', 'Retouche', 'Retouche photo', 'Retouche beauté', 'retouche-2.jpg', '236832235/RETOUCHE-PHOTO')
];

export const CLIENTS = ["Chap'n", 'Lumora', 'Pakinou', 'KPALO', 'Freeandize', 'Deborah Djaouri', 'King Fish', 'Poulet à gogo', 'Placali Chap'];

export const COURSES = [
  { title: 'Brand identity : du brief à la charte graphique', level: 'Tous niveaux', format: 'En ligne', img: '/images/projets/chapn.png' },
  { title: 'Retouche photo professionnelle', level: 'Débutant', format: 'Présentiel', img: '/images/projets/retouche-2.jpg' },
  { title: "Création d'affiches qui marquent", level: 'Débutant', format: 'En ligne', img: '/images/projets/king-fish.jpg' },
  { title: 'Design pour les réseaux sociaux', level: 'Débutant', format: 'En ligne', img: '/images/projets/placali-chap.jpg' },
  { title: 'Packaging et visuels publicitaires', level: 'Intermédiaire', format: 'Atelier', img: '/images/projets/freeandize.png' },
  { title: "Et bien d'autres : formation sur mesure", level: 'Tous niveaux', format: 'Atelier', img: '/images/projets/lumora.jpg' }
];
