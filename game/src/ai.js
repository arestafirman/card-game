// Seraphine, the rival: her choices are readable and counterable, by design.
// Before you play she declares an intent — the suit she leans on and how
// strong her hand looks — then she answers your card with the cheapest card
// that still beats it, and sheds her weakest card when she cannot win.
// The autopilot below drives the staged screenshots with the same rules.
import { cheapestWinningCard, strongestCard, weakestCard } from './rules.js';

/**
 * The rival's declared intent for this round: the suit of the card she most
 * wants to play and a strength hint (LOW / MID / STRONG) from her best card
 * of that suit. Shown on the table before you commit.
 */
export function rivalIntent(hand) {
  if (hand.length === 0) return { suit: 'EMBER', strength: 'LOW', label: '—' };
  let best = hand[0];
  for (const card of hand) {
    if (card.value > best.value) best = card;
  }
  const strength = best.value >= 7 ? 'STRONG' : best.value >= 4 ? 'MID' : 'LOW';
  return { suit: best.suit, strength, label: `${best.suit} • ${strength}` };
}

/** Seraphine's answer to the card you just played. */
export function rivalAnswer(hand, yourCard, energy) {
  const winning = cheapestWinningCard(hand, yourCard.value, energy);
  if (winning) return winning;
  return weakestCard(hand, energy);
}

/** The card Seraphine leads with when you guard: her strongest affordable. */
export function rivalLead(hand, energy) {
  return strongestCard(hand, energy);
}

/**
 * The staging autopilot: pick the player's move for a screenshot scene.
 * `mode` is 'win' (play to crush: best winning card, never guard),
 * 'lose' (play to fall: weakest card, guard often) or 'dense' (win, but
 * keep the hand full and the combo alive for the cover frame).
 */
export function autopilotMove(state, mode) {
  const { hand, energy } = state;
  if (hand.length === 0) return { type: 'draw' };
  if (mode === 'lose') {
    const weak = weakestCard(hand, energy);
    if (weak && state.rng() < 0.4) return { type: 'guard' };
    return weak ? { type: 'play', card: weak } : { type: 'draw' };
  }
  if (mode === 'dense') {
    // Cover-frame autopilot: play mid cards, preferring the table's suit for
    // resonance, so the duel stays alive and contested through round six.
    const affordable = hand.filter((c) => c.value <= 9 && (c.value <= 3 ? 1 : c.value <= 6 ? 2 : 3) <= energy);
    if (affordable.length > 0) {
      const tableSuit = state.tableCard ? state.tableCard.suit : null;
      const scored = affordable.map((c) => ({
        card: c,
        score: Math.abs(c.value - 6) - (c.suit === tableSuit ? 1.5 : 0),
      }));
      scored.sort((a, b) => a.score - b.score);
      return { type: 'play', card: scored[0].card };
    }
    return { type: 'draw' };
  }
  // Win: beat the rival's declared intent when we can.
  const intent = state.rivalIntent;
  const suited = hand.filter((c) => c.suit === intent.suit && c.value >= 6);
  const pick = suited.length > 0 ? suited[0] : strongestCard(hand, energy);
  if (pick) return { type: 'play', card: pick };
  return { type: 'draw' };
}

/** The rival's autopilot for staged scenes: 'weak' sheds low cards (she loses), 'strong' answers hard. */
export function rivalAutopilotMove(state, mode) {
  const { rivalHand, rivalEnergy } = state;
  if (rivalHand.length === 0) return null;
  if (mode === 'weak') return weakestCard(rivalHand, rivalEnergy);
  return strongestCard(rivalHand, rivalEnergy);
}
