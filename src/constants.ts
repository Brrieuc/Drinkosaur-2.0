
export const METABOLISM_RATE = 0.015; // Average elimination rate per hour in % (approx 0.15 g/L/h)
export const ALCOHOL_DENSITY = 0.789; // g/ml

export const GENDER_CONSTANT = {
  male: 0.7,
  female: 0.6,
};

export const MAX_SAFE_BAC = 0.08;

export const THEME_COLORS = {
  safe: 'from-emerald-400 to-cyan-400',
  buzz: 'from-yellow-400 to-orange-400',
  drunk: 'from-pink-500 to-rose-500',
  danger: 'from-red-600 to-purple-600'
};

// Consumption Speeds in ml/minute
export const CONSUMPTION_RATES = {
  beer: { slow: 17, average: 21, fast: 25 },     // Demi (250ml) ~12min avg
  wine: { slow: 6, average: 7, fast: 8 },        // Glass (125ml) ~18min avg
  cocktail: { slow: 5, average: 7.5, fast: 10 }, // Glass (150ml) ~20min avg
  spirit: { slow: 10, average: 20, fast: 40 },   // Usually faster or sipped strictly
  other: { slow: 10, average: 15, fast: 20 }
};

// --- DATA LIBRARIES ---

export interface DrinkReference {
  name: string;
  name_fr?: string;
  abv: number;
  type: 'beer' | 'spirit' | 'wine' | 'cocktail' | 'other';
  color: string; // Hex or rgba for liquid rendering
  carbonated?: boolean; // Controls foam and bubbles
  tags?: string[];
  defaultVolume?: number;
}

export interface MixerReference {
  name: string;
  name_fr?: string;
  color: string;
  carbonated?: boolean;
}

export const FUNNY_EXPRESSIONS = [
  "bleu métal", "défoncé", "arraché", "satellisé", "imbibé",
  "plein comme un oeuf", "bourré", "beurré complet", "blindé",
  "cuit", "en pétard", "pinté", "pété", "raide", "rétamé",
  "torché", "brindezingue", "explosé", "queue de pelle",
  "cabane sur le chien", "pas loupé"
];

export const BEER_LIBRARY: DrinkReference[] = [
  // Classiques / Lagers (Gold/Yellow)
  { name: 'Heineken', abv: 5.0, type: 'beer', color: '#FCD34D', carbonated: true },
  { name: 'Stella Artois', abv: 5.0, type: 'beer', color: '#FCD34D', carbonated: true },
  { name: '1664', abv: 5.5, type: 'beer', color: '#FBBF24', carbonated: true },
  { name: 'Kronenbourg', abv: 4.2, type: 'beer', color: '#FCD34D', carbonated: true },
  { name: 'Budweiser', abv: 5.0, type: 'beer', color: '#FEF08A', carbonated: true },
  { name: 'Corona', abv: 4.5, type: 'beer', color: '#FEF9C3', carbonated: true },
  { name: 'Desperados', abv: 5.9, type: 'beer', color: '#FBBF24', carbonated: true },
  { name: 'Jupiler', abv: 5.2, type: 'beer', color: '#FCD34D', carbonated: true },

  // Spéciales & Fortes (Amber/Dark Gold)
  { name: 'Paix-Dieu', abv: 10.0, type: 'beer', color: '#F59E0B', carbonated: true },
  { name: 'Rince-Cochon', abv: 8.5, type: 'beer', color: '#FCD34D', carbonated: true },
  { name: 'La Chouffe', abv: 8.0, type: 'beer', color: '#F59E0B', carbonated: true },
  { name: 'Tripel Karmeliet', abv: 8.4, type: 'beer', color: '#fbbf24', carbonated: true },
  { name: 'Duvel', abv: 8.5, type: 'beer', color: '#FEF3C7', carbonated: true },
  { name: 'La Goudale', abv: 7.2, type: 'beer', color: '#FBBF24', carbonated: true },
  { name: '3 Monts', abv: 8.5, type: 'beer', color: '#FCD34D', carbonated: true },
  { name: 'Pelforth Blonde', abv: 5.8, type: 'beer', color: '#FBBF24', carbonated: true },
  { name: 'Pelforth Brune', abv: 6.5, type: 'beer', color: '#451a03', carbonated: true },
  { name: 'Pelican', abv: 7.5, type: 'beer', color: '#FBBF24', carbonated: true },
  { name: 'Delirium Tremens', abv: 8.5, type: 'beer', color: '#FEF3C7', carbonated: true },
  { name: 'Grimbergen Blonde', abv: 6.7, type: 'beer', color: '#FBBF24', carbonated: true },
  { name: 'Chimay Bleue', abv: 9.0, type: 'beer', color: '#451a03', carbonated: true }, // Dark
  { name: 'Rochefort 10', abv: 11.3, type: 'beer', color: '#3E1F11', carbonated: true }, // Very Dark
  { name: 'Guinness', abv: 4.2, type: 'beer', color: '#000000', carbonated: false }, // Creamy

  // IPAs (Orange)
  { name: 'Punk IPA', abv: 5.4, type: 'beer', color: '#F59E0B', carbonated: true },
  { name: 'Lagunitas IPA', abv: 6.2, type: 'beer', color: '#D97706', carbonated: true },

  // Blanches (Pale Yellow)
  { name: 'Hoegaarden', abv: 4.9, type: 'beer', color: '#FEF9C3', carbonated: true },
  { name: '1664 Blanc', abv: 5.0, type: 'beer', color: '#FEF9C3', carbonated: true },
  { name: 'Leffe Ruby', abv: 5.0, type: 'beer', color: '#9F1239', carbonated: true }, // Red
];

export const SPIRIT_LIBRARY: DrinkReference[] = [
  // Whisky (Amber)
  { name: "Jack Daniel's", abv: 40, type: 'spirit', color: '#B45309', carbonated: false },
  { name: "Jameson", abv: 40, type: 'spirit', color: '#D97706', carbonated: false },
  { name: "Chivas Regal", abv: 40, type: 'spirit', color: '#B45309', carbonated: false },
  { name: "Nikka", abv: 45, type: 'spirit', color: '#92400E', carbonated: false },

  // Vodka (Clear)
  { name: "Grey Goose", abv: 40, type: 'spirit', color: '#E0F2FE', carbonated: false },
  { name: "Absolut", abv: 40, type: 'spirit', color: '#E0F2FE', carbonated: false },
  { name: "Smirnoff", abv: 37.5, type: 'spirit', color: '#E0F2FE', carbonated: false },

  // Rhum (Brown/Clear)
  { name: "Captain Morgan", abv: 35, type: 'spirit', color: '#78350F', carbonated: false },
  { name: "Havana Club 3 ans", abv: 40, type: 'spirit', color: '#FEF3C7', carbonated: false },
  { name: "Diplomatico", abv: 40, type: 'spirit', color: '#451a03', carbonated: false },
  { name: "Don Papa", abv: 40, type: 'spirit', color: '#92400E', carbonated: false },

  // Gin (Clear)
  { name: "Tanqueray", abv: 43, type: 'spirit', color: '#ECFEFF', carbonated: false },
  { name: "Hendrick's", abv: 41.4, type: 'spirit', color: '#ECFEFF', carbonated: false },
  { name: "Bombay Sapphire", abv: 40, type: 'spirit', color: '#CFFAFE', carbonated: false },

  // Tequila (Clear/Gold)
  { name: "Jose Cuervo", abv: 38, type: 'spirit', color: '#FEF3C7', carbonated: false },
  { name: "Patron Silver", abv: 40, type: 'spirit', color: '#E0F2FE', carbonated: false },

  // Liqueurs
  { name: "Jägermeister", abv: 35, type: 'spirit', color: '#280802', carbonated: false },
  { name: "Ricard", abv: 45, type: 'spirit', color: '#FEF9C3', carbonated: false },
  { name: "Aperol", abv: 11, type: 'spirit', color: '#FB923C', carbonated: false },
  { name: "Campari", abv: 25, type: 'spirit', color: '#DC2626', carbonated: false },
  { name: "Get 27", abv: 21, type: 'spirit', color: '#22C55E', carbonated: false },
  { name: "Baileys", abv: 17, type: 'spirit', color: '#E7E5E4', carbonated: false },

  // Flask-Common Brands (Supermarket classics)
  { name: "William Peel", abv: 40, type: 'spirit', color: '#B45309', carbonated: false },
  { name: "Label 5", abv: 40, type: 'spirit', color: '#B45309', carbonated: false },
  { name: "Poliakov", abv: 37.5, type: 'spirit', color: '#E0F2FE', carbonated: false },
  { name: "Clan Campbell", abv: 40, type: 'spirit', color: '#B45309', carbonated: false },
  { name: "Gordon's", abv: 37.5, type: 'spirit', color: '#ECFEFF', carbonated: false },
  { name: "Grant's", abv: 40, type: 'spirit', color: '#B45309', carbonated: false },
  { name: "Sir Edward's", abv: 40, type: 'spirit', color: '#B45309', carbonated: false },
];

export const COCKTAIL_LIBRARY: DrinkReference[] = [
  // Mojito
  { name: "Mojito", abv: 13, type: 'cocktail', color: '#eefab6', carbonated: true, defaultVolume: 140 },
  // Spritz
  { name: "Spritz", abv: 11, type: 'cocktail', color: '#fdba74', carbonated: true, defaultVolume: 150 },
  // Margarita
  { name: "Margarita", abv: 25, type: 'cocktail', color: '#fefce8', carbonated: false, defaultVolume: 90 },
  // Gin Tonic
  { name: "Gin Tonic", abv: 14, type: 'cocktail', color: '#ecfeff', carbonated: true, defaultVolume: 150 },
  // Old Fashioned
  { name: "Old Fashioned", abv: 30, type: 'cocktail', color: '#b45309', carbonated: false, defaultVolume: 60 },
  // Moscow Mule
  { name: "Moscow Mule", abv: 12, type: 'cocktail', color: '#fef3c7', carbonated: true, defaultVolume: 150 },
  // Caïpirinha
  { name: "Caïpirinha", abv: 25, type: 'cocktail', color: '#ecfccb', carbonated: false, defaultVolume: 100 },
  // Piña Colada
  { name: "Piña Colada", abv: 13, type: 'cocktail', color: '#fefce8', carbonated: false, defaultVolume: 160 },
  // Negroni
  { name: "Negroni", abv: 25, type: 'cocktail', color: '#ef4444', carbonated: false, defaultVolume: 90 },
  // Espresso Martini
  { name: "Espresso Martini", abv: 20, type: 'cocktail', color: '#451a03', carbonated: false, defaultVolume: 90 },
  // Cosmopolitan
  { name: "Cosmopolitan", abv: 20, type: 'cocktail', color: '#f472b6', carbonated: false, defaultVolume: 100 },
  // Long Island
  { name: "Long Island", abv: 20, type: 'cocktail', color: '#a8a29e', carbonated: true, defaultVolume: 150 },
  // Whiskey Sour
  { name: "Whiskey Sour", abv: 18, type: 'cocktail', color: '#fbbf24', carbonated: false, defaultVolume: 100 },
  // Daiquiri
  { name: "Daiquiri", abv: 25, type: 'cocktail', color: '#fef08a', carbonated: false, defaultVolume: 90 },
  // Sex on the Beach
  { name: "Sex on the Beach", abv: 12, type: 'cocktail', color: '#f472b6', carbonated: false, defaultVolume: 180 },
  // Bloody Mary
  { name: "Bloody Mary", abv: 12, type: 'cocktail', color: '#ef4444', carbonated: false, defaultVolume: 150 },
  // Mai Tai
  { name: "Mai Tai", abv: 25, type: 'cocktail', color: '#fb923c', carbonated: false, defaultVolume: 120 },
  // Cuba Libre
  { name: "Cuba Libre", abv: 12, type: 'cocktail', color: '#78350f', carbonated: true, defaultVolume: 160 },
  // Tequila Sunrise
  { name: "Tequila Sunrise", abv: 12, type: 'cocktail', color: '#fb923c', carbonated: false, defaultVolume: 150 },
  // Blue Lagoon
  { name: "Blue Lagoon", abv: 16, type: 'cocktail', color: '#3b82f6', carbonated: true, defaultVolume: 120 },
  // Manhattan
  { name: "Manhattan", abv: 30, type: 'cocktail', color: '#b91c1c', carbonated: false, defaultVolume: 80 },
  // White Russian
  { name: "White Russian", abv: 20, type: 'cocktail', color: '#d6d3d1', carbonated: false, defaultVolume: 100 },
  // Dry Martini
  { name: "Dry Martini", abv: 35, type: 'cocktail', color: '#fef3c7', carbonated: false, defaultVolume: 75 },
  // Dark 'n' Stormy
  { name: "Dark 'n' Stormy", abv: 15, type: 'cocktail', color: '#78350f', carbonated: true, defaultVolume: 160 },
  // Pisco Sour
  { name: "Pisco Sour", abv: 20, type: 'cocktail', color: '#fef08a', carbonated: false, defaultVolume: 120 }
];

export const MIXERS: MixerReference[] = [
  { name: 'Coca-Cola', color: '#280802', carbonated: true },
  { name: 'Tonic Water', color: '#E0F2FE', carbonated: true },
  { name: 'Orange Juice', color: '#FDBA74', carbonated: false },
  { name: 'Red Bull', color: '#FEF08A', carbonated: true },
  { name: 'Sprite/7Up', color: '#F0FDFA', carbonated: true },
  { name: 'Soda Water', color: '#E0F2FE', carbonated: true },
  { name: 'Cranberry', color: '#BE123C', carbonated: false },
  { name: 'Ginger Beer', color: '#FEF3C7', carbonated: true },
  { name: 'Apple Juice', name_fr: 'Jus de Pomme', color: '#B45309', carbonated: false },
  { name: 'Pineapple Juice', name_fr: 'Jus d\'Ananas', color: '#FDE68A', carbonated: false },
];

export interface MixPreset {
  name: string;
  name_fr?: string;
  spiritName: string;
  mixerName: string;
  defaultAlcohol: number;
  defaultMixer: number;
}

export const MIX_PRESETS: MixPreset[] = [
  { name: 'Vodka Red Bull', spiritName: 'Absolut', mixerName: 'Red Bull', defaultAlcohol: 50, defaultMixer: 150 },
  { name: 'Jack Coca', spiritName: "Jack Daniel's", mixerName: 'Coca-Cola', defaultAlcohol: 50, defaultMixer: 150 },
  { name: 'Captain Coca', spiritName: 'Captain Morgan', mixerName: 'Coca-Cola', defaultAlcohol: 50, defaultMixer: 150 },
  { name: 'Vodka Pomme', name_fr: 'Vodka Pomme', spiritName: 'Absolut', mixerName: 'Apple Juice', defaultAlcohol: 50, defaultMixer: 150 },
  { name: 'Vodka Orange', name_fr: 'Vodka Orange', spiritName: 'Absolut', mixerName: 'Orange Juice', defaultAlcohol: 50, defaultMixer: 150 },
  { name: 'Gin Tonic', spiritName: 'Tanqueray', mixerName: 'Tonic Water', defaultAlcohol: 50, defaultMixer: 150 },
  { name: 'Whisky Baby', name_fr: 'Whisky Baby', spiritName: "William Peel", mixerName: 'Coca-Cola', defaultAlcohol: 30, defaultMixer: 70 },
];

export const GENERIC_BEERS: DrinkReference[] = [
  { name: "Lager / Blonde", name_fr: "Lager / Blonde", abv: 5.0, type: 'beer', color: '#FCD34D', carbonated: true },
  { name: "Blanche / White", name_fr: "Blanche", abv: 4.5, type: 'beer', color: '#FEF9C3', carbonated: true },
  { name: "IPA", name_fr: "IPA", abv: 6.0, type: 'beer', color: '#F59E0B', carbonated: true },
  { name: "Triple", name_fr: "Triple", abv: 8.5, type: 'beer', color: '#D97706', carbonated: true },
  { name: "Stout / Brune", name_fr: "Stout / Brune", abv: 5.5, type: 'beer', color: '#280802', carbonated: true }, // Semi-carb
  { name: "Forte / Strong", name_fr: "Forte", abv: 10.0, type: 'beer', color: '#B45309', carbonated: true },
];

export const GENERIC_WINES: DrinkReference[] = [
  { name: "Red Wine", name_fr: "Vin Rouge", abv: 13.5, type: 'wine', color: '#7f1d1d', carbonated: false },
  { name: "White Wine", name_fr: "Vin Blanc", abv: 12.0, type: 'wine', color: '#fef9c3', carbonated: false },
  { name: "Rosé", name_fr: "Rosé", abv: 12.5, type: 'wine', color: '#fda4af', carbonated: false },
  { name: "Champagne", name_fr: "Champagne", abv: 12.0, type: 'wine', color: '#fef3c7', carbonated: true },
];

// Presets are originally in French, adding English mapping
export const BEER_PRESETS = [
  { label: 'Galopin', label_en: 'Small (125)', ml: 125 },
  { label: 'Demi', label_en: 'Half (250)', ml: 250 },
  { label: 'Bouteille', label_en: 'Bottle', ml: 330 },
  { label: 'Pinte', label_en: 'Pint (500)', ml: 500 },
  { label: 'Litron', label_en: 'Liter', ml: 1000 },
];

export const SHOT_SIZES = [
  { label: 'Small', label_fr: 'Petit', ml: 30 },
  { label: 'Standard', label_fr: 'Standard', ml: 40 },
  { label: 'Large', label_fr: 'Grand', ml: 50 },
];

export const FLASK_SIZES = [
  { label: '20cl', ml: 200 },
  { label: '25cl', ml: 250 },
  { label: '35cl', ml: 350 },
  { label: '50cl', ml: 500 },
];

// GLASS DEFINITIONS
export const GLASS_SHAPES = [
  {
    id: 'pint',
    name: 'Pint',
    name_fr: 'Pinte',
    capacity: 568,
    path: 'M 20,5 L 24,90 Q 24,97 50,97 Q 76,97 76,90 L 80,5',
    mask: 'M 22,5 L 26,90 Q 26,95 50,95 Q 74,95 74,90 L 78,5 Z',
    liquidBottom: 95,
    liquidTop: 5,
    fillType: 'cylinder'
  },
  {
    id: 'wine_std',
    name: 'Wine',
    name_fr: 'Vin',
    capacity: 450,
    path: 'M 24,5 L 24,50 C 24,75 76,75 76,50 L 76,5 M 50,75 L 50,92 M 30,96 Q 50,88 70,96',
    mask: 'M 26,5 L 26,50 C 26,73 74,73 74,50 L 74,5 Z',
    liquidBottom: 73,
    liquidTop: 5,
    fillType: 'bowl'
  },
  {
    id: 'flute',
    name: 'Flute',
    name_fr: 'Flûte',
    capacity: 200,
    path: 'M 38,5 L 40,70 C 40,83 60,83 60,70 L 62,5 M 50,83 L 50,92 M 35,96 Q 50,88 65,96',
    mask: 'M 40,5 L 42,70 C 42,81 58,81 58,70 L 60,5 Z',
    liquidBottom: 81,
    liquidTop: 5,
    fillType: 'cylinder'
  },
  {
    id: 'martini',
    name: 'Martini',
    name_fr: 'Martini',
    capacity: 200,
    path: 'M 10,5 L 50,55 L 90,5 M 50,55 L 50,92 M 30,96 Q 50,88 70,96',
    mask: 'M 12,5 L 50,53 L 88,5 Z',
    liquidBottom: 53,
    liquidTop: 5,
    fillType: 'cone'
  },
  {
    id: 'tumbler',
    name: 'Tumbler',
    name_fr: 'Tumbler',
    capacity: 300,
    path: 'M 15,10 L 20,90 Q 20,97 50,97 Q 80,97 80,90 L 85,10',
    mask: 'M 18,10 L 22,88 Q 22,92 50,92 Q 78,92 78,88 L 82,10 Z',
    liquidBottom: 92,
    liquidTop: 10,
    fillType: 'cylinder'
  },
  {
    id: 'shot',
    name: 'Shot',
    name_fr: 'Shot',
    capacity: 60,
    path: 'M 30,25 L 35,90 L 65,90 L 70,25',
    mask: 'M 32,25 L 37,88 L 63,88 L 68,25 Z',
    liquidBottom: 88,
    liquidTop: 25,
    fillType: 'cylinder'
  },
];
