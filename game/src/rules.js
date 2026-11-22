// The rules of Emberfall Duel, pure functions over plain card objects so the
// game, the AI and the screenshot staging all resolve a trick the same way.
//
// A trick: both duelists play one card. The higher value wins the trick and
// deals damage equal to the difference, plus bonuses:
//   RESONANCE — winner's suit matches the suit of the last card on the
//     table: +2 damage.
//   SET — winner's value equals the last card's value: damage doubled.
//   COMBO — winning two or more tricks in a row adds the streak to damage.
// Guarding halves the damage you take and draws you a card. Drawing costs 2
// embers and is allowed once a round. A card costs 1-3 embers by its value.
import { cardCost, RESONANCE_BONUS } from './config.js';

/**
 * Resolve one trick. `played` is the player's card (or null when guarding),
 * `rival` is the rival's card, `table` is the last card left on the table
 * (or null on the first trick), `streak` is the player's current win streak.
 * Returns { winner, damage, bonuses, text } where winner is 'you', 'rival'
 * or 'tie' and damage is dealt to the loser.
 */
export function resolveTrick(played, rival, table, youStreak, rivalStreak) {
  const bonuses = [];
  if (played === null) {
    // Guarding: no trick is fought; the rival's card lands unopposed.
    return { winner: 'rival', damage: rival.value, bonuses, text: 'Guarded — half damage' };
  }
  if (played.value === rival.value) {
    return { winner: 'tie', damage: 0, bonuses, text: 'Equal values — no damage' };
  }
  const winner = played.value > rival.value ? 'you' : 'rival';
  const winningCard = winner === 'you' ? played : rival;
  let damage = Math.abs(played.value - rival.value);
  if (table && winningCard.suit === table.suit) {
    damage += RESONANCE_BONUS;
    bonuses.push(`RESONANCE +${RESONANCE_BONUS}`);
  }
  if (table && winningCard.value === table.value) {
    damage *= 2;
    bonuses.push('SET ×2');
  }
  const streak = winner === 'you' ? youStreak : rivalStreak;
  if (streak >= 1) {
    damage += streak + 1;
    bonuses.push(`COMBO ×${streak + 1}`);
  }
  // No single trick may wound more than 12: duels run long enough to be
  // decided by play, not by one lucky set.
  damage = Math.min(damage, 12);
  return { winner, damage, bonuses, text: bonuses.join(' • ') || 'Clean hit' };
}

/** Can this card be played with this much energy left? */
export function canAfford(card, energy) {
  return cardCost(card.value) <= energy;
}

/** The cheapest card in a hand that beats `target` (or null). */
export function cheapestWinningCard(hand, target, energy) {
  let best = null;
  for (const card of hand) {
    if (card.value > target && canAfford(card, energy)) {
      if (best === null || card.value < best.value) best = card;
    }
  }
  return best;
}

/** The weakest card in a hand (ties: the cheapest). */
export function weakestCard(hand, energy) {
  let best = null;
  for (const card of hand) {
    if (!canAfford(card, energy)) continue;
    if (best === null || card.value < best.value || (card.value === best.value && cardCost(card.value) < cardCost(best.value))) best = card;
  }
  return best;
}

/** The strongest card in a hand. */
export function strongestCard(hand, energy) {
  let best = null;
  for (const card of hand) {
    if (!canAfford(card, energy)) continue;
    if (best === null || card.value > best.value) best = card;
  }
  return best;
}

/**
 * A rough win chance for the player, 5-95%, from the hand's muscle, the
 * energy left and the life gap. Shown on the table as HAND STRENGTH so the
 * player can feel each hand's shape before committing.
 */
export function handStrength(hand, energy, lifeYou, lifeRival) {
  if (hand.length === 0) return 50;
  const values = hand.map((c) => c.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const high = values.filter((v) => v >= 7).length;
  let score = 50 + (avg - 5) * 9 + high * 6 + (energy - 5) * 2 + (lifeYou - lifeRival) * 1.2;
  return Math.max(5, Math.min(95, Math.round(score)));
}

/** A one-line label for a card, used by the log strip. */
export function cardLabel(card) {
  return `${card.suit} ${card.value}`;
}
