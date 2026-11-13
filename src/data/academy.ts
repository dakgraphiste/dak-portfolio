// Dak Studio School : parcours, cours, niveaux et leçons.
// ─ Pour ajouter un cours : copier un bloc de COURSES, changer le slug (adresse : /formations/<slug>).
// ─ Quand une vidéo est tournée : passer la leçon en `ready: true` (et `free: true` pour une leçon offerte en aperçu).
// ─ Quand les inscriptions ouvrent : `status: 'ouvert'` et un `price` (ex. '25 000 FCFA').
//   Plus tard, `buyUrl` pourra pointer vers la page de paiement / le portail élève.
import { img } from './site';

export type Level = 'Débutant' | 'Intermédiaire' | 'Avancé';
export const LEVELS: Level[] = ['Débutant', 'Intermédiaire', 'Avancé'];
export const LEVEL_DOTS: Record<Level, number> = { 'Débutant': 1, 'Intermédiaire': 2, 'Avancé': 3 };

export type Topic = 'Design' | 'Brand' | 'Publicité' | 'Retouche' | 'Packaging';
export const TOPICS: Topic[] = ['Design', 'Brand', 'Publicité', 'Retouche', 'Packaging'];

export type Lesson = { title: string; duration?: string; ready?: boolean; free?: boolean };
export type Module = { title: string; lessons: Lesson[] };
export type Course = {
  slug: string; title: string; topic: Topic; level: Level; format: 'En ligne' | 'Présentiel' | 'Atelier';
  duration: string; img: string; short: string; description: string;
  outcomes: string[]; prerequisites: string[]; software: string[]; project: string;
  modules: Module[];
  status: 'bientot' | 'ouvert'; price?: string; buyUrl?: string;
};
export type Track = { slug: string; title: string; tagline: string; description: string; img: string; courses: string[]; career: string };

const L = (...titles: string[]): Lesson[] => titles.map((title) => ({ title }));

export const COURSES: Course[] = [
  {
    slug: 'fondamentaux-design-graphique', title: 'Les fondamentaux du design graphique', topic: 'Design', level: 'Débutant', format: 'En ligne', duration: '6 h',
    img: img('posters-fwc-2026'), short: 'Les bases solides de tout designer : composition, typographie, couleur et outils.',
    description: "Le point de départ idéal. Tu apprends à regarder un visuel comme un designer, à composer une page lisible, à choisir et marier les typographies et les couleurs, puis à prendre en main les outils Adobe pour produire tes premiers visuels propres.",
    outcomes: ['Composer un visuel clair avec une vraie hiérarchie', 'Choisir et associer des typographies', 'Construire une palette de couleurs cohérente', 'Préparer un fichier pour le web et pour l’impression'],
    prerequisites: ['Aucun : on part de zéro', 'Un ordinateur avec Photoshop et Illustrator (version d’essai possible)'], software: ['Photoshop', 'Illustrator'],
    project: 'Une série de 3 affiches pour un événement de ton choix.',
    modules: [
      { title: 'Voir comme un designer', lessons: L('Ce qui fait un bon visuel', 'Les grandes règles de composition', 'Analyser des affiches qui marchent') },
      { title: 'Typographie', lessons: L('Familles et graisses', 'Associer deux polices', 'Hiérarchie et lisibilité') },
      { title: 'Couleur', lessons: L('Le cercle chromatique', 'Créer une palette', 'Contraste et accessibilité') },
      { title: 'Prendre en main les outils', lessons: L('Photoshop : l’essentiel', 'Illustrator : l’essentiel', 'Exporter pour le web et l’impression') },
    ],
    status: 'bientot',
  },
  {
    slug: 'brand-identity', title: 'Brand identity : du brief à la charte graphique', topic: 'Brand', level: 'Intermédiaire', format: 'En ligne', duration: '10 h',
    img: img('chapn-brand'), short: 'La méthode complète pour créer une identité cohérente, comme pour Chap’n, Lumora ou Orika.',
    description: "Le cœur de mon métier, étape par étape. On part d’un vrai brief, on construit la plateforme de marque, on cherche, on dessine le logo, on fixe le système graphique et on monte une charte que le client pourra appliquer sans toi.",
    outcomes: ['Analyser un brief et poser la plateforme de marque', 'Mener des recherches et des pistes créatives', 'Dessiner un logo et ses déclinaisons', 'Monter et présenter une charte graphique complète'],
    prerequisites: ['Connaître les bases d’Illustrator', 'Idéalement : avoir suivi « Les fondamentaux du design graphique »'], software: ['Illustrator', 'Photoshop'],
    project: 'L’identité complète d’une marque fictive, du logo à la charte de 20 pages.',
    modules: [
      { title: 'Le brief et la stratégie', lessons: L('Lire un brief client', 'Plateforme de marque : mission, valeurs, ton', 'Étudier la concurrence') },
      { title: 'Recherches et pistes', lessons: L('Moodboard et références', 'Croquis et mots clés', 'Choisir les pistes à présenter') },
      { title: 'Le logo', lessons: L('Construire le symbole', 'Le logotype et la typographie', 'Déclinaisons et zones de protection') },
      { title: 'Le système graphique', lessons: L('Palette de couleurs', 'Typographies de marque', 'Éléments graphiques et iconographie') },
      { title: 'La charte et la présentation', lessons: L('Monter la charte', 'Mockups et mises en situation', 'Présenter au client et défendre ses choix') },
    ],
    status: 'bientot',
  },
  {
    slug: 'direction-artistique-de-marque', title: 'Direction artistique de marque', topic: 'Brand', level: 'Avancé', format: 'Atelier', duration: '8 h',
    img: img('lumora-brand'), short: 'Passer de designer à directeur artistique : concept, campagne et pilotage d’une marque.',
    description: "Pour les designers qui veulent porter une vision. On travaille le concept créatif, la direction photo, la déclinaison d’une marque en campagne et la façon de piloter une équipe et un client, comme en agence.",
    outcomes: ['Formuler un concept créatif fort', 'Écrire une direction artistique et un brief photo', 'Décliner une marque en campagne 360°', 'Piloter un projet et présenter comme en agence'],
    prerequisites: ['Avoir déjà réalisé au moins une identité visuelle', 'Maîtriser Illustrator et Photoshop'], software: ['Illustrator', 'Photoshop', 'InDesign'],
    project: 'Une campagne de lancement complète pour une marque existante.',
    modules: [
      { title: 'Le concept', lessons: L('De l’insight à l’idée', 'Tester et choisir un concept') },
      { title: 'La direction artistique', lessons: L('Moodboard de DA', 'Brief photo et brief illustration', 'Garder la cohérence sur tous les supports') },
      { title: 'La campagne', lessons: L('Key visual', 'Déclinaisons print, digital et terrain') },
      { title: 'Travailler comme en agence', lessons: L('Présenter et convaincre', 'Gérer les retours client') },
    ],
    status: 'bientot',
  },
  {
    slug: 'affiches-qui-marquent', title: 'Création d’affiches qui marquent', topic: 'Publicité', level: 'Débutant', format: 'En ligne', duration: '6 h',
    img: img('posters-football'), short: 'Hiérarchie, typographie, photomontage : des affiches qui attirent l’œil, en print comme sur écran.',
    description: "Des affiches sport aux affiches d’événement : comment je construis une scène, je hiérarchise l’information et je fais ressortir le message. Tu repars avec une méthode réutilisable pour chaque nouvelle affiche.",
    outcomes: ['Hiérarchiser titre, image et infos pratiques', 'Construire une scène en photomontage', 'Utiliser une typographie expressive', 'Décliner une affiche en formats réseaux et grand format'],
    prerequisites: ['Les bases de Photoshop'], software: ['Photoshop'],
    project: 'Une affiche de match ou d’événement et ses 3 déclinaisons.',
    modules: [
      { title: 'Le message', lessons: L('Comprendre la cible', 'Trouver l’idée de l’affiche') },
      { title: 'Composition', lessons: L('Hiérarchie de l’information', 'Grilles et équilibre') },
      { title: 'Photomontage', lessons: L('Détourer proprement', 'Lumière et intégration', 'Effets et finitions') },
      { title: 'Déclinaisons', lessons: L('Formats réseaux sociaux', 'Grand format et impression') },
    ],
    status: 'bientot',
  },
  {
    slug: 'design-reseaux-sociaux', title: 'Design pour les réseaux sociaux', topic: 'Publicité', level: 'Intermédiaire', format: 'En ligne', duration: '7 h',
    img: img('budweiser'), short: 'Gabarits, séries et calendrier : créer des posts cohérents pour une marque, comme pour Budweiser ou Yango.',
    description: "Ce que je fais chaque semaine pour de grandes marques. On construit un gabarit de marque, on conçoit une série de posts qui se répondent, on maîtrise les formats et on organise la production pour livrer vite et bien.",
    outcomes: ['Créer un gabarit de marque réutilisable', 'Concevoir une série de posts cohérente', 'Maîtriser posts, carrousels et stories', 'Organiser un calendrier et livrer à un client'],
    prerequisites: ['Les bases de Photoshop ou Illustrator'], software: ['Photoshop', 'Illustrator'],
    project: 'Un mois de publications pour une marque (12 posts et 4 stories).',
    modules: [
      { title: 'La marque sur les réseaux', lessons: L('Analyser une marque et son ton', 'Construire le gabarit') },
      { title: 'Concevoir la série', lessons: L('Une idée par post', 'Rythme et cohérence visuelle', 'Carrousels qui retiennent') },
      { title: 'Produire efficacement', lessons: L('Calendrier de contenus', 'Exports et livraison') },
    ],
    status: 'bientot',
  },
  {
    slug: 'campagnes-key-visuals', title: 'Campagnes publicitaires & key visuals', topic: 'Publicité', level: 'Avancé', format: 'Atelier', duration: '8 h',
    img: img('kpalo'), short: 'Du concept au key visual décliné en affichage, abribus et digital, comme pour TotalEnergies ou KPALO.',
    description: "On passe à l’échelle d’une campagne : un concept, un key visual fort, puis toutes ses déclinaisons, de l’écran géant au post Instagram, en gardant l’impact à chaque format.",
    outcomes: ['Construire un key visual de campagne', 'Décliner en affichage, abribus et digital', 'Préparer les fichiers pour l’imprimeur', 'Présenter une campagne à un annonceur'],
    prerequisites: ['Maîtriser Photoshop', 'Idéalement : avoir suivi « Création d’affiches qui marquent »'], software: ['Photoshop', 'Illustrator'],
    project: 'Une campagne complète : KV, 4x3, abribus et 3 visuels digitaux.',
    modules: [
      { title: 'Le concept de campagne', lessons: L('Brief annonceur', 'Accroche et idée') },
      { title: 'Le key visual', lessons: L('Mise en scène du produit', 'Retouche et finitions') },
      { title: 'Le plan de déclinaison', lessons: L('Grand format', 'Digital et réseaux', 'Fichiers d’impression') },
    ],
    status: 'bientot',
  },
  {
    slug: 'retouche-photo-pro', title: 'Retouche photo professionnelle', topic: 'Retouche', level: 'Débutant', format: 'Présentiel', duration: '6 h',
    img: img('retouche-ba'), short: 'Peau naturelle, lumière et couleurs : les techniques de retouche beauté, sport et produit.',
    description: "La retouche telle que je la pratique : non destructive, naturelle et percutante. Nettoyage de peau, dodge & burn, sculpture de la lumière et étalonnage, jusqu’à l’export.",
    outcomes: ['Travailler en non destructif', 'Retoucher une peau sans l’effet plastique', 'Sculpter la lumière (dodge & burn)', 'Étalonner et exporter pour chaque usage'],
    prerequisites: ['Aucun', 'Un ordinateur avec Photoshop'], software: ['Photoshop', 'Lightroom'],
    project: 'La retouche complète de 3 photos : portrait, sport et produit.',
    modules: [
      { title: 'Préparer son image', lessons: L('Formats, calques et non destructif', 'Organiser son fichier') },
      { title: 'La peau', lessons: L('Nettoyage', 'Séparation de fréquences', 'Dodge & burn') },
      { title: 'Lumière et couleur', lessons: L('Volumes et contrastes', 'Colorimétrie et étalonnage') },
      { title: 'Finitions', lessons: L('Netteté et grain', 'Export web et impression') },
    ],
    status: 'bientot',
  },
  {
    slug: 'photomontage-creatif', title: 'Photomontage créatif & manipulation', topic: 'Retouche', level: 'Intermédiaire', format: 'En ligne', duration: '7 h',
    img: img('posters-can-2025'), short: 'Créer des scènes impossibles et crédibles : intégration, lumière, ambiance.',
    description: "Les techniques derrière mes affiches CAN et Coupe du Monde : choisir les bonnes images, détourer, intégrer, recréer la lumière et l’ambiance pour qu’une scène impossible paraisse réelle.",
    outcomes: ['Choisir des images compatibles', 'Détourer cheveux et objets complexes', 'Recréer ombres et lumières', 'Unifier l’ambiance colorimétrique'],
    prerequisites: ['Avoir suivi « Retouche photo professionnelle » ou maîtriser les calques et masques'], software: ['Photoshop'],
    project: 'Un poster de joueur ou d’artiste en photomontage complet.',
    modules: [
      { title: 'Préparer la scène', lessons: L('Croquis et recherche d’images', 'Perspective et échelle') },
      { title: 'Intégrer', lessons: L('Détourages avancés', 'Ombres de contact', 'Lumière et reflets') },
      { title: 'Ambiance', lessons: L('Étalonnage global', 'Effets : particules, flares, grain') },
    ],
    status: 'bientot',
  },
  {
    slug: 'packaging', title: 'Packaging : de la dieline au rayon', topic: 'Packaging', level: 'Intermédiaire', format: 'Atelier', duration: '8 h',
    img: img('trajolou'), short: 'Concevoir un emballage qui se démarque en rayon, et le visuel publicitaire qui le met en scène.',
    description: "Comme pour Trajolou, Abodjama ou Bonnet Rouge : lire une dieline, habiller chaque face, respecter les mentions obligatoires, contrôler avant impression, puis mettre le produit en scène.",
    outcomes: ['Lire et préparer une dieline', 'Habiller les faces d’un packaging', 'Contrôler un fichier avant impression', 'Créer le mockup et le visuel produit'],
    prerequisites: ['Maîtriser Illustrator'], software: ['Illustrator', 'Photoshop'],
    project: 'Le packaging d’une gamme de 3 produits et son visuel publicitaire.',
    modules: [
      { title: 'Comprendre le packaging', lessons: L('Les types d’emballages', 'Lire une dieline') },
      { title: 'Habiller le pack', lessons: L('Hiérarchie des faces', 'Mentions et codes obligatoires', 'Décliner une gamme') },
      { title: 'De l’écran au rayon', lessons: L('Contrôle avant impression', 'Mockup 3D et visuel produit') },
    ],
    status: 'bientot',
  },
];

export const TRACKS: Track[] = [
  { slug: 'brand-designer', title: 'Brand Designer', tagline: 'Crée des identités de marque de A à Z', img: img('orika'), career: 'Designer d’identité visuelle, freelance ou en agence',
    description: 'Le parcours pour créer des marques : tu poses les bases du design, tu maîtrises la création d’identité, puis tu passes à la direction artistique.',
    courses: ['fondamentaux-design-graphique', 'brand-identity', 'direction-artistique-de-marque'] },
  { slug: 'designer-publicitaire', title: 'Designer publicitaire', tagline: 'Affiches, réseaux sociaux et campagnes', img: img('totalenergies-pakinou'), career: 'Designer social media, DA junior en agence de communication',
    description: 'Le parcours des agences : des affiches qui marquent aux posts de marque, jusqu’aux campagnes 360° déclinées sur tous les supports.',
    courses: ['affiches-qui-marquent', 'design-reseaux-sociaux', 'campagnes-key-visuals'] },
  { slug: 'retoucheur-photomonteur', title: 'Retoucheur & photomonteur', tagline: 'La retouche pro et les scènes impossibles', img: img('posters-fwc-2026'), career: 'Retoucheur photo, créateur de posters sport et événementiels',
    description: 'De la retouche naturelle au photomontage spectaculaire : les deux savoir-faire derrière mes affiches sport et mes visuels publicitaires.',
    courses: ['retouche-photo-pro', 'photomontage-creatif'] },
];

export const courseBySlug = (s: string) => COURSES.find((c) => c.slug === s)!;
export const lessonCount = (c: Course) => c.modules.reduce((n, m) => n + m.lessons.length, 0);
export const tracksOf = (c: Course) => TRACKS.filter((t) => t.courses.includes(c.slug));
export const hours = (d: string) => Number(d.replace(/[^0-9.]/g, '')) || 0;
