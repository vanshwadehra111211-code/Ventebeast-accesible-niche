import { v4 as uuid } from 'uuid';

const IMG = {
  noir: 'https://images.unsplash.com/photo-1643797519086-cc9a821fbcfe?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400',
  argent: 'https://images.unsplash.com/photo-1610461888750-10bfc601b874?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400',
  fumee: 'https://images.unsplash.com/photo-1519669011783-4eaa95fa1b7d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400',
  cuir: 'https://images.unsplash.com/photo-1643797517590-c44cb552ddcc?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400',
  rose: 'https://images.unsplash.com/photo-1583442801251-5ce051ed7cb3?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400',
  ambre: 'https://images.unsplash.com/photo-1598634222670-87c5f558119c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400',
};

// Bundle offer pricing
export const BUNDLE_OFFERS = [
  { id: 'pack-1', label: 'Pack of 1', qty: 1, price: 899, comparePrice: 2599, savePercent: 65, popular: true },
  { id: 'pack-3', label: 'Pack of 3', qty: 3, price: 1799, comparePrice: 7797, savePercent: 77 },
  { id: 'pack-5', label: 'Pack of 5', qty: 5, price: 2499, comparePrice: 12995, savePercent: 81, bestValue: true },
];

const base = (slug, name, gender, scent, family, notes, img) => ({
  slug, name,
  brand: 'VENTEBEAST',
  shortDescription: notes.tagline,
  description: notes.full,
  category: 'Eau de Parfum',
  collection: notes.collection,
  gender, // 'Women' | 'Men'
  concentration: 'Eau de Parfum',
  topNotes: notes.top,
  heartNotes: notes.heart,
  baseNotes: notes.base,
  longevity: '10–12 hours',
  projection: 'Heavy',
  scentFamily: family,
  featured: notes.featured || false,
  bestseller: notes.bestseller || false,
  newArrival: notes.newArrival || false,
  rating: notes.rating,
  reviewCount: notes.reviews,
  images: [img],
  variants: [
    { size: '50ml', sku: slug.toUpperCase().slice(0, 4) + '-50', price: 899, comparePrice: 2599, stock: 100 },
  ],
});

export const SEED_PRODUCTS = [
  // WOMEN (pink theme)
  base('rose-de-minuit', 'Rose de Minuit', 'Women', 'rose', 'Floral Gourmand', {
    tagline: 'Bulgarian rose absolute, black plum, and burnt cocoa.',
    full: 'ROSE DE MINUIT reimagines rose at the witching hour. Damascena absolute soaked in black plum sits over a dark cocoa-and-patchouli foundation. Composed with French and British botanical oils — a nocturnal rose.',
    collection: 'Florals Noir', top: ['Black Plum','Pink Pepper','Litchi'], heart: ['Bulgarian Rose','Damascena','Geranium'], base: ['Cocoa Absolute','Patchouli','Oud'],
    featured: true, newArrival: true, rating: 4.9, reviews: 184,
  }, IMG.rose),
  base('argent-eclat', 'Argent Éclat', 'Women', 'iris', 'Powdery Floral', {
    tagline: 'Cold silver, iris suede, and a knife-edge of metallic violet.',
    full: 'ARGENT ÉCLAT captures the moment moonlight strikes polished steel. Aldehydes and iris pallida open with a glacial brightness, supported by violet leaf and orris butter. The drydown reveals a sleek suede accord and powdered ambrette.',
    collection: 'Metallics', top: ['Aldehydes','Bergamot','Violet Leaf'], heart: ['Iris Pallida','Orris Butter','Ambrette'], base: ['Suede','White Musk','Cashmeran'],
    featured: true, bestseller: true, rating: 4.8, reviews: 142,
  }, IMG.argent),
  base('ambre-celeste', 'Ambre Céleste', 'Women', 'amber', 'Amber Oriental', {
    tagline: 'Liquid amber, vanilla orchid, and a thread of incense.',
    full: 'AMBRE CÉLESTE is an unapologetic amber. Tonka, benzoin, and Madagascar vanilla layered over a resinous heart of labdanum and frankincense. Crafted with naturals from Grasse.',
    collection: 'Ambres', top: ['Bergamot','Cardamom','Pink Pepper'], heart: ['Labdanum','Frankincense','Orchid'], base: ['Tonka Bean','Madagascar Vanilla','Benzoin'],
    featured: true, bestseller: true, rating: 4.9, reviews: 211,
  }, IMG.ambre),
  // MEN (navy/black theme)
  base('noir-obscur', 'Noir Obscur', 'Men', 'oud', 'Woody Oriental', {
    tagline: 'A liquid shadow. Smoked oud, bitter leather, and black incense.',
    full: 'NOIR OBSCUR is a study in darkness. Built around a heart of Cambodian oud and Mysore sandalwood, it unfurls slowly across the skin like silk dragged through smoke. Top notes of black pepper and bergamot give way to a smoldering core of leather, saffron, and dried tobacco. The base is a long, low whisper of vetiver, labdanum, and ambergris.',
    collection: 'Signature', top: ['Black Pepper','Bergamot','Saffron'], heart: ['Cambodian Oud','Leather','Tobacco'], base: ['Vetiver','Labdanum','Ambergris'],
    featured: true, bestseller: true, rating: 4.9, reviews: 247,
  }, IMG.noir),
  base('fume-sacre', 'Fumée Sacrée', 'Men', 'incense', 'Resinous Woody', {
    tagline: 'Frankincense cathedrals, myrrh resin, and burnt cedar embers.',
    full: 'FUMÉE SACRÉE is the scent of an empty stone chapel an hour after the censer has swung. Olibanum and myrrh smolder over papyrus and dry cedarwood, with a faint sweetness of benzoin in the deep base.',
    collection: 'Sacred', top: ['Olibanum','Pink Pepper','Elemi'], heart: ['Myrrh','Papyrus','Cypress'], base: ['Benzoin','Cedarwood','Guaiac Wood'],
    featured: true, newArrival: true, rating: 4.9, reviews: 156,
  }, IMG.fumee),
  base('cuir-volcanique', 'Cuir Volcanique', 'Men', 'leather', 'Leather', {
    tagline: 'Hot black leather, basalt, and a curl of birch tar smoke.',
    full: 'CUIR VOLCANIQUE is a brutalist leather: dense, mineral, and faintly animalic. Birch tar and styrax form the spine; castoreum and labdanum amplify the warmth.',
    collection: 'Leathers', top: ['Birch Tar','Cade','Saffron'], heart: ['Black Leather','Styrax','Cumin'], base: ['Castoreum','Labdanum','Vetiver'],
    bestseller: true, rating: 4.7, reviews: 128,
  }, IMG.cuir),
];

export const HERO_IMAGES = IMG;

export function buildSeedDocs() {
  const now = new Date();
  return SEED_PRODUCTS.map((p) => ({ _id: uuid(), ...p, gallery: p.images, createdAt: now, updatedAt: now }));
}
