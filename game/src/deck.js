// The deck of Emberfall: four suits, values 1-9, 36 cards, no jokers.
// A card is { suit, value, id } — id is stable across shuffles so the log,
// the AI and the renderer all name the same card.
import { SUIT_ORDER, MIN_VALUE, MAX_VALUE } from './config.js';

/** Build a fresh ordered deck. */
export function buildDeck() {
  const deck = [];
  for (const suit of SUIT_ORDER) {
    for (let value = MIN_VALUE; value <= MAX_VALUE; value += 1) {
      deck.push({ suit, value, id: `${suit}-${value}` });
    }
  }
  return deck;
}

/** Fisher-Yates shuffle in place, driven by the seeded generator. */
export function shuffle(deck, rng) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

/** Draw the top card, or null when the pile is empty. */
export function drawCard(deck) {
  return deck.length > 0 ? deck.pop() : null;
}

/** Deal `count` cards from the deck into a hand, in order. */
export function dealHand(deck, count) {
  const hand = [];
  for (let i = 0; i < count; i += 1) {
    const card = drawCard(deck);
    if (card) hand.push(card);
  }
  return hand;
}

/** Sort a hand for display: by suit, then by value, high first. */
export function sortHand(hand) {
  return [...hand].sort((a, b) => {
    const suitDiff = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
    return suitDiff !== 0 ? suitDiff : b.value - a.value;
  });
}
