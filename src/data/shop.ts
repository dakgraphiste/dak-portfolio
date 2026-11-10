// Boutique : mockups, extensions, templates… vendus par Dak.
// Pour publier un produit : remplir ses infos et mettre `published: true`.
// Le menu « Boutique » et l'encart de l'accueil n'apparaissent que s'il y a au moins un produit publié.
import { SITE } from './site';

export type ProductType = 'Mockups' | 'Extensions' | 'Templates' | 'Packs';
export const PRODUCT_TYPES: ProductType[] = ['Mockups', 'Extensions', 'Templates', 'Packs'];

export type Product = {
  slug: string;          // adresse : /boutique/<slug>
  name: string;
  type: ProductType;
  price: string;         // ex. '5 000 FCFA' ou '9 €'
  short: string;         // une phrase pour la carte
  description: string;   // présentation sur la fiche produit
  includes: string[];    // ce que contient le fichier
  images: string[];      // 1 à 4 aperçus (dans public/images/boutique/)
  buyUrl?: string;       // lien de paiement (Chariow, Selar, Gumroad…) ; sinon commande WhatsApp
  published: boolean;
};

// Pour ajouter un produit : copier un bloc ci-dessous. Lien Chariow à mettre dans `buyUrl`.
const ALL: Product[] = [
  {
    slug: 'brandforge', name: 'BrandForge V8', type: 'Extensions', price: '10 000 FCFA',
    short: "L'extension Illustrator qui génère ta charte graphique complète, de 20 à 109 pages, et tout l'écosystème de la marque.",
    description: "BrandForge est une extension Adobe Illustrator qui génère des chartes graphiques de 20 à 109 pages à partir de 21 modèles, et tout l'écosystème autour : stratégie, propositions de logos, kits de logos, réseaux sociaux, papeterie, site web, contrats, devis, factures, mockups 3D et logo animé. Tu gagnes des jours de mise en page sur chaque projet d'identité.",
    includes: [
      'Extension Adobe Illustrator (Windows et Mac)',
      '21 modèles de chartes graphiques, de 20 à 109 pages',
      'Stratégie, propositions et kits de logos',
      'Réseaux sociaux, papeterie et site web de la marque',
      'Contrats, devis et factures',
      'Studio de mockups 3D et logo animé',
      'Interface en français, licence à vie'
    ],
    images: ['/images/boutique/brandforge-1.webp', '/images/boutique/brandforge-2.webp', '/images/boutique/brandforge-3.webp', '/images/boutique/brandforge-4.webp'],
    published: true
  },
  {
    slug: 'packforge', name: 'PackForge 1.2', type: 'Extensions', price: '10 000 FCFA',
    short: "L'extension Illustrator des designers packaging : 41 modèles de dielines, pliage 3D et contrôle avant impression.",
    description: "PackForge est une extension Adobe Illustrator pensée pour les designers packaging, une alternative à Pacdora et Esko directement dans Illustrator. Choisis un modèle ou pars des dimensions de ton produit, génère la dieline (coupe, rainage, fond perdu, zones de colle), vois le montage en 3D de l'aplat au produit fermé, puis contrôle et corrige ton fichier avant l'impression.",
    includes: [
      'Extension Adobe Illustrator 2022 et plus (Windows et Mac)',
      '41 modèles : étuis, boîtes, sachets, étiquettes, PLV…',
      '« Partir du produit » : cotes et modèles conseillés',
      'Pliage 3D animé et vue éclatée',
      'Contrôle avant impression, corrections en un clic',
      'QR code, code-barres EAN-13, tableau nutritionnel',
      'Exports PDF/X-4, DXF, SVG, fiche technique, vidéo',
      'Interface en français, thèmes clair et sombre'
    ],
    images: ['/images/boutique/packforge-1.webp', '/images/boutique/packforge-2.webp', '/images/boutique/packforge-3.webp', '/images/boutique/packforge-4.webp'],
    published: true
  }
];

// En local, `PREVIEW_DRAFTS=1 npm run build` affiche aussi les produits non publiés (pour prévisualiser)
const preview = (globalThis as any).process?.env?.PREVIEW_DRAFTS === '1';
export const PRODUCTS = ALL.filter((p) => p.published || preview);
export const SHOP_OPEN = PRODUCTS.length > 0;

export const orderLink = (p: Product) =>
  p.buyUrl || `${SITE.whatsapp}?text=${encodeURIComponent(`Bonjour Dak, je souhaite acheter « ${p.name} » (${p.price}).`)}`;
