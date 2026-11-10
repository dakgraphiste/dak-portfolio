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
  formAction: 'https://formspree.io/f/VOTRE_ID',
  // Mettre le nom du fichier déposé dans public/ (ex. '/cv-davy-aymard-kouassi.pdf') pour afficher le bouton
  cv: ''
};

/** Vrai si le texte est rempli (pas vide et sans texte provisoire entre crochets). */
export const filled = (s?: string) => !!s && !/\[[^\]]*\]/.test(s);

/** Version 480 px d'une image (vignettes). */
export const sm = (src: string) => src.replace(/\.webp$/, '-480.webp');
/** srcset pour laisser le navigateur choisir la bonne taille. */
export const srcset = (src: string) => `${sm(src)} 480w, ${src} 1600w`;

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

const ROLE = 'Direction artistique & design graphique';
const TODO = {
  year: '[année]',
  role: ROLE,
  brief: "[Le besoin du client en 2 à 3 phrases : contexte, cible, objectif.]",
  concept: "[L'idée créative : ce qui a guidé les formes, les couleurs, la typo et le ton.]",
  challenge: "[La difficulté principale et comment tu l'as résolue : délai, contraintes, public, supports.]"
};

const p = (slug: string, title: string, client: string, category: Project['category'], categoryLabel: string, deliverables: string, cover: string, behanceId: string): Project => ({
  slug, title, client, category, categoryLabel, deliverables,
  cover: `/images/projets/${cover}.webp`,
  behance: `https://www.behance.net/gallery/${behanceId}`,
  ...TODO,
  gallery: [`/images/projets/${cover}.webp`, `/images/projets/${cover}.webp`, `/images/projets/${cover}.webp`]
});

const BASE: Project[] = [
  p('chapn', "Chap'n — Brand guidelines", "Chap'n", 'Identité', 'Identité visuelle', 'Logo, charte graphique, brand guidelines', 'chapn', '253832481/CHAPN-BRAND-GUIDELINES'),
  p('lumora', 'Lumora — Identité visuelle', 'Lumora', 'Identité', 'Identité visuelle', 'Logo, identité visuelle, déclinaisons', 'lumora', '243408119/Lumora-Branding-Visual-Identity'),
  p('pakinou', 'Pakinou', 'Pakinou', 'Identité', 'Identité visuelle', 'Logo, univers graphique', 'pakinou', '249453527/PROJET-PAKINOU'),
  p('kpalo-energie', 'KPALO Énergie — Campagne', 'KPALO Énergie', 'Publicité', 'Publicité', 'Campagne visuelle, affichage', 'kpalo', '225557179/Projet-Visuel-KPALO-ENERGIE'),
  p('freeandize', 'Freeandize — Packaging', 'Freeandize', 'Publicité', 'Packaging & publicité', 'Packaging, visuel publicitaire', 'freeandize', '220603885/PACKAGING-FREEANDIZE'),
  p('deborah-djaouri', 'Poster Deborah Djaouri', 'Deborah Djaouri', 'Affiches', 'Affiche', 'Poster', 'deborah-djaouri', '223583551/POSTER-DEBORAH-DJAOURI'),
  p('king-fish', 'King Fish — Posters & bannières', 'King Fish', 'Affiches', 'Affiches', 'Posters, bannières', 'king-fish', '223531183/KING-FISH-POSTERS-BANNERS'),
  p('poulet-a-gogo', 'Poulet à gogo — Social media', 'Poulet à gogo', 'Réseaux sociaux', 'Réseaux sociaux', 'Visuels social media', 'poulet-a-gogo', '220603711/SOCIAL-MEDIA-DESIGN-POULET-a-GOGO'),
  p('placali-chap', 'Placali Chap — Social media', 'Placali Chap', 'Réseaux sociaux', 'Réseaux sociaux', 'Visuels social media', 'placali-chap', '220603459/SOCIAL-MEDIA-DESIGN-PLACALI-CHAP'),
  p('finance', 'Finance — Social media', 'Marque de services financiers', 'Réseaux sociaux', 'Réseaux sociaux', 'Visuels social media', 'finance', '215856159/SOCIAL-MEDIA-DESIGN-FINANCE'),
  p('retouche-photo-1', 'Retouche photo — Série 1', 'Shooting beauté', 'Retouche', 'Retouche photo', 'Retouche beauté', 'retouche-1', '238235983/RETOUCHE-PHOTO'),
  p('retouche-photo-2', 'Retouche photo — Série 2', 'Shooting beauté', 'Retouche', 'Retouche photo', 'Retouche beauté', 'retouche-2', '236832235/RETOUCHE-PHOTO')
];

// Textes des études de cas, rédigés d'après les visuels publiés sur Behance.
// À relire et ajuster : l'année reste masquée tant qu'elle vaut '[année]'.
type Details = Partial<Pick<Project, 'role' | 'brief' | 'concept' | 'challenge' | 'year'>>;
const DA = 'Direction artistique & design graphique';
const DETAILS: Record<string, Details> = {
  chapn: { role: DA,
    brief: "Chap'n avait besoin d'une identité capable de grandir avec la marque : un logo reconnaissable, une palette et des règles claires pour que chaque support parle le même langage.",
    concept: "Une étoile vive comme signature, un violet profond qui tranche avec la concurrence et une typographie ronde et généreuse. L'ensemble est accessible et énergique.",
    challenge: "Rester mémorable tout en restant simple à décliner. Le guide de marque fixe usages, couleurs, zones de protection et exemples pour que n'importe quel prestataire l'applique sans erreur." },
  lumora: { role: DA,
    brief: "Créer l'identité visuelle de Lumora : un nom autour de la lumière, qui devait inspirer élégance et confiance dès le premier regard.",
    concept: "Des faisceaux qui s'élèvent au-dessus d'un logotype fin, sur un bordeaux profond. La lumière devient un symbole simple, chaleureux et premium.",
    challenge: "Traduire une idée abstraite, la lumière, en un signe lisible du petit format (réseaux, cachet) au grand format (enseigne, affiche)." },
  pakinou: { role: DA,
    brief: "Donner à Pakinou un univers graphique festif, ancré dans la culture et la musique, qui donne envie de participer.",
    concept: "Un lettrage massif et chaleureux entouré d'instruments (tambour, maracas) et de notes. Le logo se lit comme une invitation à la fête.",
    challenge: "Garder un logo lisible malgré la richesse des illustrations, avec une version simplifiée pour les petits formats." },
  'kpalo-energie': { role: 'Direction artistique, design publicitaire & retouche',
    brief: "Lancer la boisson KPALO Énergie avec une campagne qui associe le produit au dépassement de soi et à la jeunesse.",
    concept: "« Joue chaque instant à fond » : une athlète en plein effort, la canette en héros et un éclairage dramatique, déclinés en affichage grand format.",
    challenge: "Faire exister la canette dans une scène d'action sans la noyer, et garder un message lisible en une seconde sur un panneau vu de loin." },
  freeandize: { role: 'Design packaging & visuel publicitaire',
    brief: "Concevoir le packaging et le visuel de lancement d'un produit Freeandize, pour qu'il se démarque en rayon et sur les réseaux.",
    concept: "Un sachet aux couleurs franches et un visuel publicitaire spectaculaire : un sportif en plein saut qui attrape le produit, pour l'énergie et le plaisir.",
    challenge: "Concilier un pack lisible en magasin (nom, saveur, mentions) et une mise en scène publicitaire forte qui reste fidèle au produit réel." },
  'deborah-djaouri': { role: DA,
    brief: "Réaliser une affiche pour Deborah Djaouri, pensée pour être vue, partagée et retenue.",
    concept: "Une composition éditoriale qui met en scène les produits dans un univers lumineux, avec une hiérarchie claire entre l'accroche et les informations pratiques.",
    challenge: "Faire tenir beaucoup d'informations sans perdre l'impact visuel, en version imprimée comme en version écran." },
  'king-fish': { role: 'Design graphique (print & digital)',
    brief: "King Fish voulait des affiches et des bannières qui donnent faim et font venir les clients pour son poisson.",
    concept: "Le plat en vedette, des couleurs chaudes et une accroche gourmande et directe, avec prix et contacts bien visibles.",
    challenge: "Adapter un même visuel à plusieurs formats (affiche, bannière, réseaux) sans perdre la lisibilité du prix et du message." },
  'poulet-a-gogo': { role: 'Design graphique pour les réseaux sociaux',
    brief: "Faire connaître les offres de Poulet à gogo et générer des commandes, notamment le « kit commando ».",
    concept: "Des visuels qui vont droit au but : produit, contenu du kit, prix en FCFA, localisation et numéro de commande, dans un style frais et rural assumé.",
    challenge: "Rendre une offre très détaillée lisible en quelques secondes sur un téléphone, et la décliner en affichage." },
  'placali-chap': { role: 'Design graphique pour les réseaux sociaux',
    brief: "Mettre en avant les plats de Placali Chap sur les réseaux sociaux et attirer de nouveaux clients.",
    concept: "Des couleurs vives (rouge, jaune), le plat photographié en gros plan, un prix d'appel bien visible et la livraison mise en avant.",
    challenge: "Créer une série de posts cohérents et reconnaissables d'une publication à l'autre, tout en variant les plats et les offres." },
  finance: { role: 'Design graphique pour les réseaux sociaux',
    brief: "Rendre la finance personnelle accessible : épargne, budget, assurance, avec des publications pédagogiques pour les réseaux sociaux.",
    concept: "Une ligne verte rassurante, des portraits authentiques et des titres simples (« Planifier dès aujourd'hui ») pour un ton proche et bienveillant.",
    challenge: "Vulgariser des sujets techniques sans perdre en crédibilité, et garder une série cohérente sur de nombreux posts." },
  'retouche-photo-1': { role: 'Retouche photo & colorimétrie',
    brief: "Sublimer une série de portraits beauté tout en gardant une peau naturelle et crédible.",
    concept: "Une retouche fine : grain de peau préservé, lumière travaillée et couleurs chaudes pour des portraits lumineux et expressifs.",
    challenge: "Trouver l'équilibre entre une image soignée et un rendu authentique, sans effet « plastique »." },
  'retouche-photo-2': { role: 'Retouche photo & colorimétrie',
    brief: "Retoucher une série de portraits expressifs sur fond coloré, pour un usage publicitaire et réseaux sociaux.",
    concept: "Des couleurs franches (orange, accessoires vifs), des contrastes nets et une peau unifiée qui garde sa texture.",
    challenge: "Gérer une colorimétrie très saturée sans dénaturer les teintes de peau, sur toute la série." }
};

export const PROJECTS: Project[] = BASE.map((p) => ({ ...p, ...DETAILS[p.slug] }));

export const CLIENTS = ["Chap'n", 'Lumora', 'Pakinou', 'KPALO', 'Freeandize', 'Deborah Djaouri', 'King Fish', 'Poulet à gogo', 'Placali Chap'];

export const COURSES = [
  { title: 'Brand identity : du brief à la charte graphique', desc: 'La méthode complète pour créer une identité cohérente : brief, recherches, logo, couleurs, typographies et charte.', level: 'Tous niveaux', format: 'En ligne', img: '/images/projets/chapn.webp' },
  { title: 'Retouche photo professionnelle', desc: 'Peau naturelle, lumière et couleurs : les techniques de retouche beauté et produit sur Photoshop.', level: 'Débutant', format: 'Présentiel', img: '/images/projets/retouche-2.webp' },
  { title: "Création d'affiches qui marquent", desc: 'Hiérarchie, typographie, couleurs : concevoir des affiches lisibles qui attirent l’œil, en print comme sur écran.', level: 'Débutant', format: 'En ligne', img: '/images/projets/king-fish.webp' },
  { title: 'Design pour les réseaux sociaux', desc: 'Créer des posts cohérents et efficaces pour une marque : gabarits, séries, formats et déclinaisons.', level: 'Débutant', format: 'En ligne', img: '/images/projets/placali-chap.webp' },
  { title: 'Packaging et visuels publicitaires', desc: 'Concevoir un emballage qui se démarque en rayon, puis le visuel publicitaire qui le met en scène.', level: 'Intermédiaire', format: 'Atelier', img: '/images/projets/freeandize.webp' },
  { title: "Et bien d'autres : formation sur mesure", desc: 'Un besoin précis ou une équipe à former ? On construit ensemble un programme adapté à ton niveau et à tes objectifs.', level: 'Tous niveaux', format: 'Atelier', img: '/images/projets/lumora.webp' }
];
