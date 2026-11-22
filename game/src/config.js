// Emberfall Duel — every tuning number, suit and colour in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds. */
export const STEP = 1 / 60;

/** Life each duelist starts with, and the round cap before sudden death. */
export const START_LIFE = 40;
export const MAX_ROUNDS = 12;
export const HAND_SIZE = 7;
export const ENERGY_PER_ROUND = 10;
export const DRAW_COST = 2;
export const RESONANCE_BONUS = 2;
export const GUARD_FRACTION = 0.5;

/** The four houses of Emberfall. Each suit has a colour AND a drawn shape,
// so a card is readable by colour, by shape and by name — never text alone. */
export const SUITS = {
  EMBER: { name: 'Ember', glyph: 'flame', color: '#d9483b', dark: '#8f241c', light: '#f6b8ae' },
  TIDE: { name: 'Tide', glyph: 'wave', color: '#2f7fc4', dark: '#174a75', light: '#aed6f2' },
  THORN: { name: 'Thorn', glyph: 'leaf', color: '#3f9e57', dark: '#1f5c31', light: '#a9d8b4' },
  GALE: { name: 'Gale', glyph: 'wind', color: '#d9a521', dark: '#7d5e08', light: '#f2d98c' },
};
export const SUIT_ORDER = ['EMBER', 'TIDE', 'THORN', 'GALE'];
export const MIN_VALUE = 1;
export const MAX_VALUE = 9;

/** A card's ember cost: its value in three tiers, so every hand has a real choice. */
export function cardCost(value) {
  return value <= 3 ? 1 : value <= 6 ? 2 : 3;
}

export const PALETTE = {
  backdrop: '#0d1a12',
  felt: '#14532d',
  feltDark: '#0b3d20',
  feltLight: '#1d6b3a',
  gold: '#d4af37',
  goldDark: '#8a6d1f',
  panel: '#101d16',
  panelEdge: '#2c4a38',
  ivory: '#f7f2e7',
  ink: '#1c2420',
  text: '#eef1e8',
  muted: '#9db3a4',
  red: '#e5534b',
  blue: '#4fc3f7',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best match score is kept between visits (this browser only). */
export const BEST_KEY = 'emberfall-duel.best';
