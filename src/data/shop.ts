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

// Exemples à remplacer : ils restent masqués (published: false)
const ALL: Product[] = [
  {
    slug: 'mockup-boites-de-luxe', name: 'Mockup boîtes de luxe', type: 'Mockups', price: '[prix]',
    short: 'Trois boîtes premium à personnaliser en un clic, pour présenter un packaging haut de gamme.',
    description: "Un mockup PSD réaliste pour présenter vos packagings de luxe : remplacez le design par objet dynamique, changez les couleurs et l'arrière-plan.",
    includes: ['Fichier PSD haute définition', 'Objets dynamiques', 'Ombres et reflets séparés', 'Fond modifiable'],
    images: ['/images/projets/bronze.webp', '/images/projets/bronze-poster.webp'], published: false
  },
  {
    slug: 'mockup-sachet-alimentaire', name: 'Mockup sachet alimentaire', type: 'Mockups', price: '[prix]',
    short: 'Un sachet souple posé dans une cuisine lumineuse, idéal pour les produits locaux.',
    description: 'Mettez en scène vos emballages alimentaires dans un décor naturel et chaleureux.',
    includes: ['Fichier PSD haute définition', 'Objet dynamique', 'Scène modifiable'],
    images: ['/images/projets/abodjama.webp', '/images/projets/abodjama-poster.webp'], published: false
  },
  {
    slug: 'mockup-boite-jouet', name: 'Mockup boîte de jouet', type: 'Mockups', price: '[prix]',
    short: 'Une boîte vitrine pour jouets et poupées, prête pour vos présentations clients.',
    description: 'Présentez un packaging de jouet avec fenêtre transparente, de face et de trois quarts.',
    includes: ['Fichier PSD haute définition', '2 angles de vue', 'Objets dynamiques'],
    images: ['/images/projets/trajolou.webp', '/images/projets/trajolou-poster.webp'], published: false
  }
];

// En local, `PREVIEW_DRAFTS=1 npm run build` affiche aussi les produits non publiés (pour prévisualiser)
const preview = (globalThis as any).process?.env?.PREVIEW_DRAFTS === '1';
export const PRODUCTS = ALL.filter((p) => p.published || preview);
export const SHOP_OPEN = PRODUCTS.length > 0;

export const orderLink = (p: Product) =>
  p.buyUrl || `${SITE.whatsapp}?text=${encodeURIComponent(`Bonjour Dak, je souhaite acheter « ${p.name} » (${p.price}).`)}`;
