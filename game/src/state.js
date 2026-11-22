// The game state: one duel from the first deal to the last life point.
// State is plain data — the renderer reads it, the input writes moves into
// it, and the screenshot stager fast-forwards it with the real rules.
import {
  START_LIFE, MAX_ROUNDS, HAND_SIZE, ENERGY_PER_ROUND, DRAW_COST,
  GUARD_FRACTION, cardCost,
} from './config.js';
import { createRandom } from './random.js';
import { buildDeck, shuffle, drawCard, dealHand, sortHand } from './deck.js';
import { resolveTrick, handStrength, cardLabel } from './rules.js';
import { rivalIntent, rivalAnswer, rivalLead } from './ai.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

/** A fresh duel. `seed` fixes the shuffle; `rng` is kept for staging rolls. */
export function createGame(seed) {
  const rng = createRandom(seed);
  const deck = shuffle(buildDeck(), rng);
  const game = {
    seed,
    rng,
    screen: SCREEN_TITLE,
    round: 1,
    turnTimer: 45,
    lifeYou: START_LIFE,
    lifeRival: START_LIFE,
    tricksYou: 0,
    tricksRival: 0,
    energy: ENERGY_PER_ROUND,
    rivalEnergy: ENERGY_PER_ROUND,
    deck,
    discard: [],
    hand: [],
    rivalHand: [],
    tableCard: null,
    rivalTableCard: null,
    rivalIntent: { suit: 'EMBER', strength: 'LOW', label: '—' },
    selected: 0,
    streak: 0,
    rivalStreak: 0,
    combo: 0,
    trickHistory: [],
    lastResult: null,
    log: [],
    drawsThisRound: 0,
    guarded: false,
    over: false,
    winner: null,
    best: 0,
    confetti: [],
  };
  game.hand = sortHand(dealHand(game.deck, HAND_SIZE));
  game.rivalHand = dealHand(game.deck, HAND_SIZE);
  game.rivalIntent = rivalIntent(game.rivalHand);
  pushLog(game, 'The duel begins — Emberfall deals seven cards each.');
  return game;
}

/** Start a new duel from the title screen, keeping the best score. */
export function startDuel(game) {
  const best = game.best;
  const fresh = createGame(game.seed + 1);
  fresh.best = best;
  return fresh;
}

export function pushLog(game, text) {
  game.log.unshift(text);
  if (game.log.length > 3) game.log.length = 3;
}

/** Refill both hands to seven at the start of a round, if the deck allows. */
export function refillHands(game) {
  while (game.hand.length < HAND_SIZE) {
    const card = drawCard(game.deck);
    if (!card) break;
    game.hand.push(card);
  }
  while (game.rivalHand.length < HAND_SIZE) {
    const card = drawCard(game.deck);
    if (!card) break;
    game.rivalHand.push(card);
  }
  game.hand = sortHand(game.hand);
  game.rivalIntent = rivalIntent(game.rivalHand);
}

/** Draw one card for 2 embers, once a round. */
export function drawForPlayer(game) {
  if (game.drawsThisRound >= 1 || game.energy < DRAW_COST) return false;
  const card = drawCard(game.deck);
  if (!card) return false;
  game.energy -= DRAW_COST;
  game.drawsThisRound += 1;
  game.hand = sortHand([...game.hand, card]);
  pushLog(game, `You draw ${cardLabel(card)} (−${DRAW_COST} embers).`);
  return true;
}

/** Guard: take half damage this trick and draw a card. */
export function guardRound(game) {
  game.guarded = true;
  const lead = rivalLead(game.rivalHand, game.rivalEnergy);
  if (!lead) return endRound(game, null, null, game.tableCard);
  game.rivalHand = game.rivalHand.filter((c) => c.id !== lead.id);
  game.rivalEnergy -= cardCost(lead.value);
  game.rivalTableCard = lead;
  return endRound(game, null, lead, game.tableCard);
}

/**
 * Play the selected card, resolve the trick against Seraphine's answer, and
 * advance the round. Returns the trick result for the renderer to flourish.
 */
export function playSelected(game) {
  const card = game.hand[game.selected];
  if (!card || cardCost(card.value) > game.energy) return null;
  const prevTable = game.tableCard;
  game.hand = game.hand.filter((c) => c.id !== card.id);
  game.energy -= cardCost(card.value);
  game.tableCard = card;
  const answer = rivalAnswer(game.rivalHand, card, game.rivalEnergy);
  if (answer) {
    game.rivalHand = game.rivalHand.filter((c) => c.id !== answer.id);
    game.rivalEnergy -= cardCost(answer.value);
    game.rivalTableCard = answer;
  }
  return endRound(game, card, answer, prevTable);
}

function endRound(game, playedCard, rivalCard, prevTable) {
  const result = resolveTrick(playedCard, rivalCard, prevTable, game.streak, game.rivalStreak);
  let damage = result.damage;
  let guardedText = '';
  if (game.guarded && result.winner === 'rival') {
    damage = Math.max(1, Math.floor(damage * GUARD_FRACTION));
    guardedText = ' (guarded)';
  }
  if (result.winner === 'you') {
    game.lifeRival = Math.max(0, game.lifeRival - damage);
    game.tricksYou += 1;
    game.streak += 1;
    game.rivalStreak = 0;
    game.combo = game.streak >= 2 ? game.streak : 0;
  } else if (result.winner === 'rival') {
    game.lifeYou = Math.max(0, game.lifeYou - damage);
    game.tricksRival += 1;
    game.rivalStreak += 1;
    game.streak = 0;
    game.combo = 0;
  } else {
    game.streak = 0;
    game.rivalStreak = 0;
    game.combo = 0;
  }
  game.lastResult = {
    winner: result.winner,
    damage,
    bonuses: result.bonuses,
    text: result.text + guardedText,
    youCard: playedCard,
    rivalCard,
  };
  game.trickHistory.push({ round: game.round, winner: result.winner, damage });
  game.tableCard = playedCard ?? rivalCard ?? game.tableCard;
  game.rivalTableCard = rivalCard ?? game.rivalTableCard;
  if (playedCard) game.discard.push(playedCard);
  if (rivalCard) game.discard.push(rivalCard);
  pushLog(game, describeTrick(game, result, damage));
  game.round += 1;
  game.turnTimer = 45;
  game.energy = ENERGY_PER_ROUND;
  game.rivalEnergy = ENERGY_PER_ROUND;
  game.drawsThisRound = 0;
  game.guarded = false;
  game.selected = Math.min(game.selected, Math.max(0, game.hand.length - 1));
  refillHands(game);
  checkOver(game);
  return game.lastResult;
}

function describeTrick(game, result, damage) {
  if (result.winner === 'you') return `You take the trick — ${damage} damage to Seraphine.`;
  if (result.winner === 'rival') return `Seraphine takes the trick — ${damage} damage to you.`;
  return 'Equal values — the trick is tied, no damage.';
}

function checkOver(game) {
  if (game.lifeRival <= 0) {
    game.over = true;
    game.winner = 'you';
    game.screen = SCREEN_WIN;
    game.best = Math.max(game.best, game.tricksYou);
    seedConfetti(game);
  } else if (game.lifeYou <= 0) {
    game.over = true;
    game.winner = 'rival';
    game.screen = SCREEN_LOSS;
    game.best = Math.max(game.best, game.tricksYou);
  } else if (game.round > MAX_ROUNDS) {
    game.over = true;
    game.winner = game.lifeYou >= game.lifeRival ? 'you' : 'rival';
    game.screen = game.winner === 'you' ? SCREEN_WIN : SCREEN_LOSS;
    game.best = Math.max(game.best, game.tricksYou);
    if (game.winner === 'you') seedConfetti(game);
  }
}

function seedConfetti(game) {
  const colors = ['#d4af37', '#d9483b', '#2f7fc4', '#3f9e57', '#f7f2e7'];
  game.confetti = [];
  for (let i = 0; i < 90; i += 1) {
    game.confetti.push({
      x: game.rng() * 1280,
      y: game.rng() * 720,
      w: 6 + game.rng() * 10,
      h: 4 + game.rng() * 8,
      color: colors[i % colors.length],
      rot: game.rng() * Math.PI,
    });
  }
}

/** The player's current win chance, for the HAND STRENGTH meter. */
export function currentStrength(game) {
  return handStrength(game.hand, game.energy, game.lifeYou, game.lifeRival);
}

/** Tick the round timer down; at zero the round is forfeited as a guard. */
export function tickTimer(game, dt) {
  if (game.screen !== SCREEN_PLAY || game.over) return;
  game.turnTimer -= dt;
  if (game.turnTimer <= 0) guardRound(game);
}
