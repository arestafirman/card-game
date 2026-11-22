// The screenshot scenes behind ?shot=table|title|win|loss.
// Each one plays the real rules forward from a fresh deal for a fixed number
// of rounds, steered by the autopilot, so the frame is what a short duel
// really looks like and the same seed always gives the same frame.
//
//   table — the cover: mid-duel at its densest (full hand, a live combo,
//           the rival's life low, her intent declared). Never a calm opening.
//   title — the title screen over a dimmed, dealt table.
//   win   — the duel played until you win, with the victory flourish.
//   loss  — the duel played until Seraphine wins.
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSS, playSelected, guardRound, createGame } from './state.js';
import { autopilotMove } from './ai.js';
import { strongestCard } from './rules.js';

const TABLE_ROUNDS = 6;
const MAX_ROUNDS_STAGED = 40;

/** Run one autopilot round for `game` in the given mode. */
function autopilotRound(game, mode) {
  if (game.over) return;
  const move = autopilotMove(game, mode);
  if (move.type === 'play') {
    game.selected = game.hand.findIndex((c) => c.id === move.card.id);
    playSelected(game);
  } else if (move.type === 'guard') {
    guardRound(game);
  } else {
    // Out of affordable cards: guard the round away.
    guardRound(game);
  }
}

/**
 * Stage `game` to the named scene and return the screen to draw over it.
 * The game is reset first, so staging is deterministic per seed.
 */
export function stageShot(name, game) {
  const fresh = createGame(game.seed);
  Object.assign(game, fresh);
  if (name === 'title') {
    game.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE };
  }
  if (name === 'table') {
    for (let i = 0; i < TABLE_ROUNDS; i += 1) autopilotRound(game, 'dense');
    if (game.over) {
      // A duel that ended early is no cover frame: re-deal one seed further
      // on and stage the same six rounds again (still deterministic).
      const retry = createGame(game.seed + 100);
      Object.assign(game, retry);
      for (let i = 0; i < TABLE_ROUNDS; i += 1) autopilotRound(game, 'dense');
    }
    // Freeze the frame mid-duel: a strong card raised, the clock mid-round,
    // the combo banner from the last trick still on the table.
    game.screen = SCREEN_PLAY;
    const strong = strongestCard(game.hand, game.energy);
    if (strong) game.selected = game.hand.findIndex((c) => c.id === strong.id);
    game.turnTimer = 31;
    return { screen: SCREEN_PLAY };
  }
  const mode = name === 'loss' ? 'lose' : 'win';
  for (let i = 0; i < MAX_ROUNDS_STAGED && !game.over; i += 1) autopilotRound(game, mode);
  if (game.screen === SCREEN_WIN) return { screen: SCREEN_WIN };
  if (game.screen === SCREEN_LOSS) return { screen: SCREEN_LOSS };
  // A staged duel that never ended (deck ran dry): show the table as it stands.
  game.screen = SCREEN_PLAY;
  return { screen: SCREEN_PLAY };
}

export { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSS };
