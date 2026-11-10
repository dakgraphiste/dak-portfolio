import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Coordonnées et liens de Davy Aymard Kouassi (Dak.graphiste)
export const SITE = {
  brand: 'dak.graphiste',
  name: 'Davy Aymard Kouassi',
  role: 'Senior Graphic Designer',
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
export const sm = (src: string) => src.replace(/\.webp(\?.*)?$/, '-480.webp$1');
/** srcset pour laisser le navigateur choisir la bonne taille. */
export const srcset = (src: string) => `${sm(src)} 480w, ${src} 1600w`;

export const NAV = [
  { href: '/projets', label: 'Projets' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/formations', label: 'Formations' },
  { href: '/contact', label: 'Contact' }
];

export type Category = 'Identité' | 'Réseaux sociaux' | 'Campagnes' | 'Packaging' | 'Affiches' | 'Retouche';
export const CATEGORIES: Category[] = ['Identité', 'Réseaux sociaux', 'Campagnes', 'Packaging', 'Affiches', 'Retouche'];

export type Project = {
  slug: string;
  title: string;
  client: string;
  category: Category;
  categoryLabel: string;
  deliverables: string;
  cover: string;
  behance: string; // vide si le projet n'est pas sur Behance
  year: string;
  role: string;
  brief: string;
  concept: string;
  conceptLabel?: string; // « Le concept », « Le mécanisme », « La mission »…
  challenge: string;
  gallery: string[]; // 3 visuels du projet (cascade au survol + galerie)
  poster: string; // version verticale soignée (livre ouvert de l'accueil, roue, projets récents)
  theme?: { p1: string; p2: string; ink?: string }; // couleurs de la page du projet
  brand?: { logo: string; symbol?: string; palette: { name: string; hex: string }[]; values: string[] }; // identités visuelles
  posts?: string[]; // publications regroupées (réseaux sociaux, affiches, campagnes)
  slides?: { src: string; caption: string }[]; // extraits du dossier Behance (images 16:9 + légende)
  secret?: [string, string][]; // note « Top secret » du dossier : infos propres au projet
};

const DA = 'Direction artistique & design graphique';
const AGENCE = 'Direction artistique · agence SimplyBlack';
// Empreinte du fichier dans l'adresse : une image modifiée est rechargée tout de suite (pas d'ancienne version en cache)
const version = (name: string) => {
  try { return createHash('md5').update(readFileSync(`public/images/projets/${name}.webp`)).digest('hex').slice(0, 8); } catch { return '1'; }
};
const img = (name: string) => `/images/projets/${name}.webp?v=${version(name)}`;
const crops = (name: string, n = 3) => Array.from({ length: n }, (_, k) => img(`${name}-c${k + 1}`));

type In = Omit<Project, 'cover' | 'gallery' | 'poster' | 'behance' | 'year' | 'role' | 'brief' | 'concept' | 'challenge'> &
  Partial<Pick<Project, 'behance' | 'year' | 'role' | 'brief' | 'concept' | 'challenge'>> & { image: string; gallery?: string[]; shots?: number };
const make = ({ image, gallery, shots = 3, ...p }: In): Project => ({
  behance: '', year: '', role: DA, brief: '', concept: '', challenge: '',
  ...p, cover: img(image), poster: img(`${image}-poster`), gallery: gallery || crops(image, shots)
});

/* ---------- Projets du portfolio PDF (textes de Davy) ---------- */
const PORTFOLIO: Project[] = [
  // Brand & Visual Identity
  make({ slug: 'orika', title: 'Orika — Brand identity', client: 'Orika', category: 'Identité', categoryLabel: 'Identité visuelle', deliverables: 'Logo, palette, univers de marque', image: 'orika',
    brief: "Orika conçoit des produits cosmétiques premium, pensés et fabriqués localement, avec l'ambition de s'imposer sur les marchés internationaux. Sa promesse : transformer un geste quotidien, l'application d'une crème, en une expérience sensorielle à part entière.",
    concept: "Une palette douce et charnelle (Magenta Bloom, Dusty Rose, Snow) et un symbole inspiré du geste : une pommade qui glisse délicatement du doigt à la peau, cette courbure du geste.",
    challenge: "Représenter la délicatesse, le côté premium et l'expérience sensorielle du toucher dans une seule forme." }),
  make({ slug: 'chapn', title: "Chap'n — Brand identity", client: "Chap'n", category: 'Identité', categoryLabel: 'Identité visuelle', deliverables: 'Logo, palette, charte, déclinaisons app & réseaux', image: 'chapn-brand',
    behance: 'https://www.behance.net/gallery/253832481/CHAPN-BRAND-GUIDELINES',
    brief: "Chap'n est une fintech pensée pour les jeunes entrepreneurs et freelances d'Afrique de l'Ouest. Le nom vient du nouchi ivoirien « chap'n » = vite : une promesse assumée, la vitesse n'est pas un argument marketing, c'est le produit.",
    concept: "Une palette Indigo Bloom (#5E2BBF), Chartreuse (#C9F35B), noir et Porcelain, et un symbole unique qui fusionne l'éclair, le mouvement et l'échange : « Envoie. Reçois. Chap'n. »",
    challenge: "Dire trois choses avec une seule forme : l'éclair (vitesse), le mouvement (rapidité) et la transaction (envoi/réception), sans superposer plusieurs pictogrammes." }),
  make({ slug: 'lumora', title: 'Lumora — Brand identity', client: 'Lumora', category: 'Identité', categoryLabel: 'Identité visuelle', deliverables: 'Logo, palette, identité visuelle, déclinaisons', image: 'lumora-brand',
    behance: 'https://www.behance.net/gallery/243408119/Lumora-Branding-Visual-Identity',
    brief: "Lumora™ est une entreprise polyvalente qui regroupe plusieurs secteurs essentiels : agriculture et élevage, immobilier, mobilier et import-export. L'objectif : une identité solide, cohérente et moderne, capable de représenter cette diversité tout en inspirant confiance et stabilité.",
    concept: "Tout part du nom : Lumora, la lumière. Des faisceaux qui s'élèvent au-dessus d'un logotype élégant, sur une palette chaude du bordeaux au corail.",
    challenge: "Représenter la diversité, la polyvalence, l'authenticité et la confiance en un seul symbole, unique et moderne." }),
  make({ slug: 'pakinou', title: 'Pakinou — Brand identity', client: 'Pakinou', category: 'Identité', categoryLabel: 'Identité visuelle', deliverables: 'Logo, palette, univers graphique', image: 'pakinou-brand',
    behance: 'https://www.behance.net/gallery/249453527/PROJET-PAKINOU',
    brief: "Pakinou est une célébration, une fête culturelle baoulé qui rassemble des milliers de personnes autour d'une chaleur conviviale. L'objectif : une identité solide qui transmet le rythme, la danse, la joie, la cérémonie et la culture.",
    concept: "Un lettrage massif et chaleureux, des instruments traditionnels et une palette terre, du crème au brun profond, pour une identité festive et enracinée.",
    challenge: "Concevoir un logo qui transmet cette ambiance : le rythme, la danse et cette culture." }),
  // Social Media Visuals
  make({ slug: 'budweiser', title: 'Budweiser — Social media & Fan Festival', client: "Budweiser Côte d'Ivoire", category: 'Réseaux sociaux', categoryLabel: 'Réseaux sociaux & évènementiel', deliverables: 'Content calendar 2024–2026, Fan Festival BudFC 2026', image: 'budweiser', year: '2024 – 2026', role: AGENCE,
    brief: "Au sein de l'agence SimplyBlack, j'ai travaillé sur la direction artistique de Budweiser Côte d'Ivoire, l'un des comptes les plus exigeants du marché local : codes de marque mondiaux à respecter à la lettre et actualité sportive à suivre au jour le jour.",
    concept: "Deux volets : le Fan Festival BudFC 2026 pendant la Coupe du Monde (expérience food & fan zone, dans la continuité du territoire « Let It Pour »), et le content calendar 2024–2026, produit en continu au rythme du calendrier sportif sans jamais perdre la cohérence de marque.",
    challenge: "Faire cohabiter des codes de marque mondiaux non négociables avec un calendrier sportif local qui ne laisse aucune place à l'approximation ni au retard." }),
  make({ slug: 'fanmilk', title: 'FanMilk — Social media', client: 'FanMilk', category: 'Réseaux sociaux', categoryLabel: 'Réseaux sociaux', deliverables: "Content calendars Côte d'Ivoire, Togo, Bénin", image: 'fanmilk',
    brief: "FanMilk est une marque de produits laitiers frais et onctueux. J'ai travaillé sur la marque, ses contraintes et des content calendars à livrer à temps pour plusieurs pays : Côte d'Ivoire, Togo et Bénin.",
    challenge: "Produire une série de contenus d'une même marque pour trois pays, avec des codes propres à chaque pays." }),
  make({ slug: 'bonnet-rouge', title: 'Bonnet Rouge — Social media', client: 'Bonnet Rouge', category: 'Réseaux sociaux', categoryLabel: 'Réseaux sociaux', deliverables: "Content calendars Côte d'Ivoire & Burkina Faso", image: 'bonnet-rouge-sm',
    brief: "Deux pays (Côte d'Ivoire et Burkina Faso), deux content calendars, un seul système visuel.",
    challenge: "La difficulté n'était pas créative mais opérationnelle : produire les mêmes packshots (lait en poudre, gamme crémeuse) en les recontextualisant pour deux marchés, sans dupliquer le travail ni décaler le planning de sortie." }),
  make({ slug: 'la-vache-qui-rit', title: 'La Vache qui rit — Social media', client: 'La Vache qui rit (Bel Group)', category: 'Réseaux sociaux', categoryLabel: 'Réseaux sociaux', deliverables: "Contenus Côte d'Ivoire & Sénégal", image: 'la-vache-qui-rit',
    brief: "Côte d'Ivoire et Sénégal. Bel Group impose des guidelines mondiales très strictes sur la mascotte (proportions, sourire, couleurs) : tout écart part en refus de validation.",
    challenge: "Produire des contenus qui parlent local (petit-déjeuner ivoirien, fêtes religieuses sénégalaises) tout en passant la validation globale du premier coup, pour ne pas perdre de jours de production sur un calendrier déjà serré." }),
  make({ slug: 'superclean', title: 'SuperClean — Social media', client: 'SuperClean', category: 'Réseaux sociaux', categoryLabel: 'Réseaux sociaux', deliverables: 'Content calendar', image: 'superclean', role: AGENCE,
    brief: "Au sein de l'agence SimplyBlack, j'ai travaillé sur la direction artistique de SuperClean « le génie » : un calendrier riche en concepts simples et efficaces.",
    challenge: "Montrer le génie de SuperClean dans un environnement simple et propre, en respectant les éléments de la charte graphique." }),
  make({ slug: 'yango', title: 'Yango — Social media', client: 'Yango', category: 'Réseaux sociaux', categoryLabel: 'Réseaux sociaux', deliverables: 'Contenus multi-pays', image: 'yango',
    brief: "Nous avons piloté la marque Yango, présente dans plusieurs pays africains : Côte d'Ivoire, Sénégal, Cameroun, Angola et bien d'autres.",
    challenge: "Faire cohabiter des codes de marque mondiaux non négociables avec un calendrier sans place pour l'approximation, en s'adaptant aux contraintes de chaque marché : pays, langues et habitudes." }),
  make({ slug: 'bavaria-smalt', title: 'Bavaria Smalt — Social media', client: 'Bavaria', category: 'Réseaux sociaux', categoryLabel: 'Réseaux sociaux', deliverables: "Contenus Gabon, Côte d'Ivoire, Cameroun", image: 'bavaria-smalt',
    brief: "Bavaria Smalt, une boisson à base de malt et de soda. L'idée : faire comprendre aux consommateurs qu'elle respecte tous les codes du sans-alcool et peut facilement s'imposer au quotidien.",
    challenge: "Effacer l'association à la Bavaria alcoolisée et installer cette nouvelle gamme de soda au malt, en respectant les codes de la marque dans plusieurs pays : Gabon, Côte d'Ivoire, Cameroun." }),
  // KV Campaigns
  make({ slug: 'bonnet-rouge-fetes', title: 'Bonnet Rouge — KV fêtes de fin d’année', client: 'Bonnet Rouge', category: 'Campagnes', categoryLabel: 'Campagne (KV)', deliverables: "Key visual Côte d'Ivoire & Burkina Faso", image: 'bonnet-rouge-kv', shots: 1,
    brief: "Pour les fêtes de fin d'année, un KV pour Bonnet Rouge utilisé au Burkina Faso et en Côte d'Ivoire. L'idée : intégrer Bonnet Rouge comme un membre de la famille, celui qu'on côtoie tout le temps, même pour Noël et le Nouvel An.",
    concept: "Célébrer avec Bonnet Rouge." }),
  make({ slug: 'totalenergies-rentree', title: 'TotalEnergies — Back to School', client: 'TotalEnergies', category: 'Campagnes', categoryLabel: 'Campagne (KV)', deliverables: 'Key visual promo boutique', image: 'totalenergies-bts', shots: 1,
    brief: "Pour la rentrée, un KV pour la campagne Promo Back to School de TotalEnergies, afin de mettre en avant sa boutique : un endroit où l'on repart avec un kit scolaire en cadeau (sac à dos, gourde, stylos, blocs-notes…).",
    concept: "Pour tout achat de 15 000 FCFA dans la boutique TotalEnergies, des kits scolaires, gourdes et autres cadeaux offerts.", conceptLabel: 'Le mécanisme' }),
  make({ slug: 'totalenergies-pakinou', title: 'TotalEnergies — Promo Pakinou', client: 'TotalEnergies', category: 'Campagnes', categoryLabel: 'Campagne (KV)', deliverables: 'Key visual promo boutique', image: 'totalenergies-pakinou', shots: 1, year: '2025',
    brief: "Pour la fête de Pakinou, un KV pour la campagne Promo Pakinou de TotalEnergies : mettre en avant la boutique tout en reflétant l'esprit de la fête.",
    concept: "Du 1er au 30 avril 2025, pour tout achat en boutique à partir de 10 000 FCFA, tentez de gagner un an de carburant.", conceptLabel: 'Le mécanisme' }),
  make({ slug: 'totalenergies-quartz', title: 'TotalEnergies — Promo Quartz', client: 'TotalEnergies', category: 'Campagnes', categoryLabel: 'Campagne (KV)', deliverables: 'Key visual promo lubrifiants', image: 'totalenergies-quartz', shots: 2, year: '2025', role: AGENCE,
    brief: "Promo Quartz pour la rentrée : un KV pour mettre en avant la réduction sur les lubrifiants Quartz de TotalEnergies.",
    concept: "« À la rentrée Quartz, ça chauffe pas ! » : 1 000 FCFA de réduction sur les lubrifiants Quartz, du 1er au 30 septembre 2025.", conceptLabel: 'Le mécanisme' }),
  make({ slug: 'mitsubishi-destinator', title: 'Mitsubishi — Destinator', client: 'Mitsubishi', category: 'Campagnes', categoryLabel: 'Campagne (KV)', deliverables: "Key visuals pour appel d'offres", image: 'mitsubishi-destinator',
    brief: "Pour le lancement du Destinator, SUV 7 places, nous avons conçu des KV pour l'appel d'offres de Mitsubishi.",
    concept: "Le véhicule parfait pour toute la famille." }),
  make({ slug: 'air-elegance-can', title: 'Air Elegance — CAN au Maroc', client: 'Air Elegance', category: 'Campagnes', categoryLabel: 'Campagne (KV)', deliverables: 'Key visual campagne « No Stress »', image: 'air-elegance-can', shots: 1, year: '2025',
    brief: "Pour la CAN au Maroc, Air Elegance lance une campagne « No Stress » pour ses clients. Un KV réalisé pour communiquer sur leur offre.",
    concept: "« No stress. Sois serein, on gère. »" }),
  make({ slug: 'pakinou-campagne', title: 'Pakinou — Campagne évènement', client: 'Pakinou', category: 'Campagnes', categoryLabel: 'Campagne (KV)', deliverables: 'Teasers, KV 12 m², supports évènement', image: 'pakinou-kv',
    brief: "À l'occasion de Pâques, nous avons géré la communication autour de l'évènement culturel Pakinou : teasers, KV pour 12 m² et autres supports, pour promouvoir l'évènement.",
    concept: "« Lève-toi et danse. Aujourd'hui ça va chauffer. »" }),
  // Packaging & Product Design
  make({ slug: 'trajolou', title: 'Trajolou — Packaging', client: 'Trajolou', category: 'Packaging', categoryLabel: 'Packaging', deliverables: 'Packaging de la nouvelle gamme de poupées', image: 'trajolou', shots: 1, year: '2025',
    brief: "Trajolou, marque de poupées locale : le compagnon idéal pour les petites filles qui veulent des poupées aux codes internationaux, dans le respect de la culture africaine.",
    concept: "Création du packaging de la nouvelle gamme de poupées Trajolou, en restant dans l'univers des petites filles.", conceptLabel: 'La mission' }),
  make({ slug: 'abodjama', title: 'Abodjama — Attiéké de Babi', client: 'Abodjama', category: 'Packaging', categoryLabel: 'Packaging', deliverables: 'Packaging 900 g à 50 kg', image: 'abodjama', shots: 1,
    brief: "Abodjama commercialise l'attiéké, semoule de manioc, dans des emballages représentatifs de la culture ivoirienne.",
    concept: "Créer le packaging « Attiéké de Babi » en respectant les codes visuels d'Abodjama et les codes culturels.", conceptLabel: 'La mission' }),
  make({ slug: 'bronze', title: 'Bronzé — Logo & packaging', client: 'Bronzé', category: 'Packaging', categoryLabel: 'Logo & packaging', deliverables: 'Logo, packaging', image: 'bronze', shots: 1,
    brief: "Bronzé, marque de senteurs de luxe et de bougies parfumées, qui se veut unique et premium. Nous avons réalisé le logo et le packaging.",
    concept: "Un packaging simple, épuré et luxueux.", conceptLabel: 'La mission' }),
  // Posters
  make({ slug: 'posters-coupe-du-monde-2026', title: 'Posters — Coupe du Monde 2026', client: 'Création personnelle', category: 'Affiches', categoryLabel: 'Affiches sport', deliverables: 'Série de posters', image: 'posters-fwc-2026', year: '2026', role: 'Direction artistique, illustration & design',
    brief: "À l'occasion de la Coupe du Monde 2026, des visuels de soutien à la Côte d'Ivoire autour d'un seul fil conducteur : « D'Abidjan to the World ».",
    concept: "Plusieurs concepts pour illustrer le parcours des Éléphants à chaque étape de la compétition, tout en motivant et en supportant l'équipe." }),
  make({ slug: 'posters-can-2025', title: 'Posters — CAN 2025', client: 'Création personnelle', category: 'Affiches', categoryLabel: 'Affiches sport', deliverables: 'Série de posters', image: 'posters-can-2025', year: '2025', role: 'Direction artistique, illustration & design',
    brief: "À l'occasion de la CAN au Maroc, des visuels de soutien à la Côte d'Ivoire avec un storytelling fort, qui casse les codes du design déjà connus.",
    concept: "Passer par les histoires des animés pour mettre en scène les duels et confrontations, ou l'histoire des différents pays.", conceptLabel: 'La direction' })
];

/* ---------- Autres projets publiés sur Behance ---------- */
const bh = (slug: string, title: string, client: string, category: Category, categoryLabel: string, deliverables: string, cover: string, behanceId: string): Project =>
  make({ slug, title, client, category, categoryLabel, deliverables, image: cover, behance: `https://www.behance.net/gallery/${behanceId}`, gallery: [img(cover)] });

// Textes rédigés d'après les visuels publiés sur Behance (à relire)
type Details = Partial<Pick<Project, 'role' | 'brief' | 'concept' | 'challenge' | 'year'>>;
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

const BEHANCE: Project[] = [
  bh('kpalo-energie', 'KPALO Énergie — Campagne', 'KPALO Énergie', 'Campagnes', 'Campagne publicitaire', 'Campagne visuelle, affichage', 'kpalo', '225557179/Projet-Visuel-KPALO-ENERGIE'),
  bh('freeandize', 'Freeandize — Packaging', 'Freeandize', 'Packaging', 'Packaging & publicité', 'Packaging, visuel publicitaire', 'freeandize', '220603885/PACKAGING-FREEANDIZE'),
  bh('king-fish', 'King Fish — Posters & bannières', 'King Fish', 'Affiches', 'Affiches', 'Posters, bannières', 'king-fish', '223531183/KING-FISH-POSTERS-BANNERS'),
  bh('deborah-djaouri', 'Poster Deborah Djaouri', 'Deborah Djaouri', 'Affiches', 'Affiche', 'Poster', 'deborah-djaouri', '223583551/POSTER-DEBORAH-DJAOURI'),
  bh('poulet-a-gogo', 'Poulet à gogo — Social media', 'Poulet à gogo', 'Réseaux sociaux', 'Réseaux sociaux', 'Visuels social media', 'poulet-a-gogo', '220603711/SOCIAL-MEDIA-DESIGN-POULET-a-GOGO'),
  bh('placali-chap', 'Placali Chap — Social media', 'Placali Chap', 'Réseaux sociaux', 'Réseaux sociaux', 'Visuels social media', 'placali-chap', '220603459/SOCIAL-MEDIA-DESIGN-PLACALI-CHAP'),
  bh('finance', 'Finance — Social media', 'Marque de services financiers', 'Réseaux sociaux', 'Réseaux sociaux', 'Visuels social media', 'finance', '215856159/SOCIAL-MEDIA-DESIGN-FINANCE'),
  bh('retouche-photo-1', 'Retouche photo — Série 1', 'Shooting beauté', 'Retouche', 'Retouche photo', 'Retouche beauté', 'retouche-1', '238235983/RETOUCHE-PHOTO'),
  bh('retouche-photo-2', 'Retouche photo — Série 2', 'Shooting beauté', 'Retouche', 'Retouche photo', 'Retouche beauté', 'retouche-2', '236832235/RETOUCHE-PHOTO')
].map((p) => ({ ...p, ...DETAILS[p.slug] }));

/* ---------- Mise en scène des études de cas ---------- */
const posts = (image: string, n: number) => Array.from({ length: n }, (_, i) => img(`${image}-p${String(i + 1).padStart(2, '0')}`));
const STAGE: Record<string, Partial<Project>> = {
  orika: { theme: { p1: '#CE3754', p2: '#FAF1F2' }, brand: { logo: 'orika-logo', symbol: 'orika-symbole', values: ['Délicatesse', 'Premium', 'Sensoriel', 'Fait ici', 'Pensé pour le monde'],
    palette: [{ name: 'Magenta Bloom', hex: '#CE3754' }, { name: 'Dusty Rose', hex: '#CB7D79' }, { name: 'Snow', hex: '#FAF1F2' }] } },
  'kpalo-energie': {
    slides: [
      { src: img('kpalo-bh-01'), caption: 'Affichage en station : « Joue chaque instant à fond »' },
      { src: img('kpalo-bh-02'), caption: 'Déclinaisons réseaux sociaux' },
      { src: img('kpalo-bh-03'), caption: 'Grand format : « 4h du matin, serrez lêkê »' },
      { src: img('kpalo-bh-04'), caption: 'Abribus' },
      { src: img('kpalo-bh-05'), caption: 'Écran géant en façade' },
      { src: img('kpalo-bh-06'), caption: "L'affiche, format carré" },
      { src: img('kpalo-bh-07'), caption: 'Packaging, version noire' },
      { src: img('kpalo-bh-08'), caption: 'Packaging, version orange' },
    ],
  },
  chapn: { theme: { p1: '#5E2BBF', p2: '#C9F35B' },
    slides: [
      { src: img('chapn-bh-01'), caption: 'Couverture du guide de marque' },
      { src: img('chapn-bh-02'), caption: '« Le portefeuille de tous les entrepreneurs »' },
      { src: img('chapn-bh-03'), caption: 'Le logo sur Chartreuse' },
      { src: img('chapn-bh-04'), caption: 'Déclinaisons : notification, affiche, story' },
      { src: img('chapn-bh-05'), caption: 'La palette : Indigo Bloom, Noir, Chartreuse, Porcelain' },
    ],
    brand: { logo: 'chapn-logo', symbol: 'chapn-symbole', values: ['Vitesse', 'Mouvement', 'Envoie', 'Reçois', "Chap'n"],
    palette: [{ name: 'Indigo Bloom', hex: '#5E2BBF' }, { name: 'Chartreuse', hex: '#C9F35B' }, { name: 'Noir', hex: '#000000' }, { name: 'Porcelain', hex: '#F7F7EF' }] } },
  lumora: { theme: { p1: '#8E2222', p2: '#FD5F54' }, brand: { logo: 'lumora-logo', values: ['Lumière', 'Diversité', 'Confiance', 'Stabilité', 'Authenticité'],
    palette: [{ name: 'Bordeaux profond', hex: '#380E0F' }, { name: 'Rouge brique', hex: '#8E2222' }, { name: 'Corail', hex: '#FD5F54' }, { name: 'Rose poudré', hex: '#FACAC6' }, { name: 'Blanc lumière', hex: '#F7F7FF' }] } },
  pakinou: { theme: { p1: '#A6421E', p2: '#F3E8D2' }, brand: { logo: 'pakinou-logo', symbol: 'pakinou-symbole', values: ['Rythme', 'Danse', 'Joie', 'Cérémonie', 'Culture'],
    palette: [{ name: 'Terre cuite', hex: '#A6421E' }, { name: 'Ocre', hex: '#E8813E' }, { name: 'Brun rouge', hex: '#882E0C' }, { name: 'Orange festif', hex: '#FD8D37' }, { name: 'Crème', hex: '#F3E8D2' }] } },
  budweiser: { theme: { p1: '#C8102E', p2: '#F5F1E8' }, posts: posts('budweiser', 9) },
  fanmilk: { theme: { p1: '#1E5CC8', p2: '#EAF2FF' }, posts: posts('fanmilk', 10) },
  'bonnet-rouge': { theme: { p1: '#D0021B', p2: '#FFF1E8' }, posts: posts('bonnet-rouge-sm', 9) },
  'la-vache-qui-rit': { theme: { p1: '#E2001A', p2: '#FFF4E6' }, posts: posts('la-vache-qui-rit', 8) },
  superclean: { theme: { p1: '#2433A0', p2: '#EEF1FF' }, posts: posts('superclean', 10) },
  yango: { theme: { p1: '#E4002B', p2: '#FFF0F2' }, posts: posts('yango', 9) },
  'bavaria-smalt': { theme: { p1: '#0B4AA8', p2: '#EAF2FF' }, posts: posts('bavaria-smalt', 10) },
  'posters-coupe-du-monde-2026': { theme: { p1: '#FF6A13', p2: '#FFF3EA' }, posts: posts('posters-fwc-2026', 6) },
  'posters-can-2025': { theme: { p1: '#5B2A86', p2: '#F4EEFA' }, posts: posts('posters-can-2025', 5) },
  'mitsubishi-destinator': { theme: { p1: '#E60012', p2: '#F2F4F7' }, posts: posts('mitsubishi-destinator', 4) },
  'pakinou-campagne': { theme: { p1: '#A6421E', p2: '#F3E8D2' }, posts: posts('pakinou-kv', 3) },
  'totalenergies-rentree': { theme: { p1: '#E4002B', p2: '#FFF5EC' } }, 'totalenergies-pakinou': { theme: { p1: '#E4002B', p2: '#FFF5EC' } },
  'totalenergies-quartz': { theme: { p1: '#E4002B', p2: '#FFF5EC' } }, 'bonnet-rouge-fetes': { theme: { p1: '#D0021B', p2: '#FFF1E8' } },
  'air-elegance-can': { theme: { p1: '#0F7A4A', p2: '#EFF8F3' } }, trajolou: { theme: { p1: '#0E7C74', p2: '#FFEFF6' } },
  abodjama: { theme: { p1: '#C79A1B', p2: '#FBF5E6' } }, bronze: { theme: { p1: '#7A1F2B', p2: '#F4F1EE' } }
};

// Infos « Top secret » propres à chaque projet (tirées du portfolio)
const SECRET: Record<string, [string, string][]> = {
  "budweiser": [["Nom de code", "« Let It Pour »"], ["Période", "2024 – 2026"], ["Temps fort", "Fan Festival BudFC, Coupe du Monde 2026"]],
  "fanmilk": [["Marchés", "Côte d'Ivoire, Togo, Bénin"], ["Défi", "3 pays, 3 codes, une seule marque"]],
  "bonnet-rouge": [["Marchés", "Côte d'Ivoire, Burkina Faso"], ["Produits", "Lait en poudre, gamme crémeuse"], ["Règle", "Un seul système visuel"]],
  "la-vache-qui-rit": [["Marchés", "Côte d'Ivoire, Sénégal"], ["Contrainte", "Guidelines mondiales de la mascotte"], ["Temps forts", "Petit-déjeuner ivoirien, fêtes religieuses"]],
  "superclean": [["Héros", "« Le génie »"], ["Agence", "SimplyBlack"]],
  "yango": [["Marchés", "Côte d'Ivoire, Sénégal, Cameroun, Angola…"], ["Contrainte", "Codes de marque mondiaux"]],
  "bavaria-smalt": [["Marchés", "Gabon, Côte d'Ivoire, Cameroun"], ["Mission", "Imposer un soda au malt sans alcool"]],
  "totalenergies-rentree": [["Seuil", "15 000 FCFA d'achat"], ["Cadeaux", "Sac à dos, gourde, stylos, blocs-notes"]],
  "totalenergies-pakinou": [["Période", "Du 1er au 30 avril 2025"], ["Seuil", "10 000 FCFA d'achat"], ["À gagner", "Un an de carburant"]],
  "totalenergies-quartz": [["Accroche", "« Ça chauffe pas ! »"], ["Remise", "1 000 FCFA"], ["Période", "Septembre 2025"]],
  "mitsubishi-destinator": [["Véhicule", "Destinator, SUV 7 places"], ["Cadre", "Appel d'offres"]],
  "air-elegance-can": [["Événement", "CAN au Maroc"], ["Accroche", "« No stress »"]],
  "bonnet-rouge-fetes": [["Marchés", "Burkina Faso, Côte d'Ivoire"], ["Moment", "Noël et Nouvel An"]],
  "pakinou-campagne": [["Supports", "Teasers, KV de 12 m²"], ["Accroche", "« Lève-toi et danse »"]],
  "chapn": [["Origine du nom", "Nouchi « chap'n » = vite"], ["Cible", "Jeunes entrepreneurs et freelances d'Afrique de l'Ouest"], ["Couleur signature", "Indigo Bloom #5E2BBF"]],
  "orika": [["Fabrication", "Locale"], ["Ambition", "Les marchés internationaux"], ["Couleur signature", "Magenta Bloom #CE3754"]],
  "lumora": [["Secteurs", "Agriculture, élevage, immobilier, mobilier, import-export"], ["Idée source", "La lumière"]],
  "pakinou": [["Communauté", "Baoulé"], ["Esprit", "Rythme, danse, joie, cérémonie"]],
  "trajolou": [["Produit", "Poupée Érell, senteur chocolat"], ["Âge", "3 ans et plus"]],
  "abodjama": [["Produit", "Attiéké de Babi"], ["Formats", "De 900 g à 50 kg"]],
  "bronze": [["Univers", "Senteurs de luxe et bougies parfumées"], ["Livrables", "Logo et packaging"]],
  "posters-coupe-du-monde-2026": [["Fil conducteur", "« D'Abidjan to the World »"], ["Équipe", "Les Éléphants"]],
  "posters-can-2025": [["Inspiration", "Les animés"], ["Thème", "Duels et confrontations"]],
};

// Ordre d'affichage : grandes marques et projets d'agence d'abord
const ORDER = ['budweiser', 'totalenergies-rentree', 'la-vache-qui-rit', 'yango', 'fanmilk', 'totalenergies-pakinou', 'mitsubishi-destinator', 'bonnet-rouge',
  'air-elegance-can', 'totalenergies-quartz', 'bavaria-smalt', 'superclean', 'bonnet-rouge-fetes', 'chapn', 'orika', 'lumora', 'pakinou', 'pakinou-campagne',
  'trajolou', 'abodjama', 'bronze', 'posters-coupe-du-monde-2026', 'posters-can-2025'];
const rank = (s: string) => { const i = ORDER.indexOf(s); return i < 0 ? 999 : i; };
export const PROJECTS: Project[] = [...PORTFOLIO, ...BEHANCE].map((p) => ({ ...p, ...STAGE[p.slug], secret: SECRET[p.slug] })).sort((a, b) => rank(a.slug) - rank(b.slug));
export const isAgency = (p: Project) => /agence/i.test(p.role);
/** identifiant de catégorie pour les liens filtrés (/projets?cat=identite) */
export const catSlug = (c: string) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]+/g, '-');

// Marques accompagnées (en agence chez SimplyBlack et en freelance)
export const CLIENTS = ['Budweiser', 'TotalEnergies', 'La Vache qui rit', 'Yango', 'FanMilk', 'Bonnet Rouge', 'Mitsubishi', 'Bavaria', 'SuperClean', 'Air Elegance', 'Orika', "Chap'n", 'Lumora', 'Pakinou', 'Trajolou', 'Abodjama', 'Bronzé', 'KPALO'];

export const COURSES = [
  { title: 'Brand identity : du brief à la charte graphique', modules: ["Analyser un brief et définir la plateforme de marque", "Recherches, moodboard et pistes créatives", "Construire le logo et ses déclinaisons", "Couleurs, typographies et système graphique", "Monter la charte et la présenter au client"], desc: 'La méthode complète pour créer une identité cohérente : brief, recherches, logo, couleurs, typographies et charte.', level: 'Tous niveaux', format: 'En ligne', img: '/images/projets/chapn-brand.webp' },
  { title: 'Retouche photo professionnelle', modules: ["Préparer son image : formats, calques, non destructif", "Peau naturelle : nettoyage, dodge & burn", "Lumière et volumes", "Colorimétrie et étalonnage", "Retouche produit et export pour le web et l'impression"], desc: 'Peau naturelle, lumière et couleurs : les techniques de retouche beauté et produit sur Photoshop.', level: 'Débutant', format: 'Présentiel', img: '/images/projets/retouche-2.webp' },
  { title: "Création d'affiches qui marquent", modules: ["Comprendre le message et la cible", "Composition et hiérarchie de l'information", "Typographie expressive", "Couleurs, images et contraste", "Déclinaisons print, réseaux et grand format"], desc: 'Hiérarchie, typographie, couleurs : concevoir des affiches lisibles qui attirent l’œil, en print comme sur écran.', level: 'Débutant', format: 'En ligne', img: '/images/projets/king-fish.webp' },
  { title: 'Design pour les réseaux sociaux', modules: ["Construire un gabarit de marque", "Concevoir une série de posts cohérente", "Formats : post, carrousel, story", "Planifier un content calendar", "Exporter et livrer à un client"], desc: 'Créer des posts cohérents et efficaces pour une marque : gabarits, séries, formats et déclinaisons.', level: 'Débutant', format: 'En ligne', img: '/images/projets/placali-chap.webp' },
  { title: 'Packaging et visuels publicitaires', modules: ["Lire et préparer une dieline", "Habiller le packaging : faces, mentions, codes", "Contrôle avant impression", "Mettre le produit en scène (mockup, KV)", "Décliner la campagne publicitaire"], desc: 'Concevoir un emballage qui se démarque en rayon, puis le visuel publicitaire qui le met en scène.', level: 'Intermédiaire', format: 'Atelier', img: '/images/projets/freeandize.webp' },
  { title: "Et bien d'autres : formation sur mesure", modules: ["Un échange pour définir tes objectifs", "Un programme construit pour toi ou ton équipe", "Des exercices sur tes propres projets", "Un suivi après la formation"], desc: 'Un besoin précis ou une équipe à former ? On construit ensemble un programme adapté à ton niveau et à tes objectifs.', level: 'Tous niveaux', format: 'Atelier', img: '/images/projets/lumora-brand.webp' }
];
