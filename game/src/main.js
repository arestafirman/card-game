// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The duel moves
// between four screens: title, play, win and loss.
//
// ?seed=N fixes the deal. ?shot=table|title|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { STEP, BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import {
  createGame, startDuel, playSelected, drawForPlayer, guardRound,
  tickTimer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSS,
} from './state.js';
import {
  ACTION_CONFIRM, ACTION_DRAW, ACTION_GUARD,
  createInput, handCardAt, buttonAt,
} from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
let game = createGame(seed);
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, game);
  let painted = 0;
  function paint() {
    renderer.draw(game, scene.screen, game.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let best = readBest();
  game.best = best;
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each trick.
  function announce(message) {
    status.textContent = message;
  }

  function beginDuel() {
    game = startDuel(game);
    game.best = best;
    announce('The duel begins. Seven cards each, forty life.');
  }

  function finishDuel() {
    if (game.tricksYou > best) {
      best = game.tricksYou;
      saveBest(best);
    }
    announce(game.winner === 'you'
      ? `Victory. Final life ${game.lifeYou} to ${game.lifeRival}.`
      : `Defeat. Final life ${game.lifeYou} to ${game.lifeRival}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    const keySelect = input.takeKeySelect();
    const click = input.takeClick();
    if (game.screen === SCREEN_TITLE || game.screen === SCREEN_WIN || game.screen === SCREEN_LOSS) {
      if ((actions & ACTION_CONFIRM) || click) beginDuel();
      return;
    }
    if (game.screen !== SCREEN_PLAY || game.over) return;
    if (keySelect >= 0 && keySelect < game.hand.length) game.selected = keySelect;
    else if (keySelect === -2) game.selected = (game.selected + game.hand.length - 1) % game.hand.length;
    else if (keySelect === -3) game.selected = (game.selected + 1) % game.hand.length;
    if (click) {
      const cardIndex = handCardAt(click, renderer.handRects);
      if (cardIndex >= 0) {
        if (cardIndex === game.selected) {
          const result = playSelected(game);
          if (result) announce(result.text);
          if (game.over) finishDuel();
        } else {
          game.selected = cardIndex;
        }
        return;
      }
      const button = buttonAt(click, renderer.buttons);
      if (button === 'play') {
        const result = playSelected(game);
        if (result) announce(result.text);
        if (game.over) finishDuel();
      } else if (button === 'draw') {
        drawForPlayer(game);
      } else if (button === 'guard') {
        const result = guardRound(game);
        if (result) announce(result.text);
        if (game.over) finishDuel();
      }
      return;
    }
    if (actions & ACTION_CONFIRM) {
      const result = playSelected(game);
      if (result) announce(result.text);
      if (game.over) finishDuel();
    } else if (actions & ACTION_DRAW) {
      drawForPlayer(game);
    } else if (actions & ACTION_GUARD) {
      const result = guardRound(game);
      if (result) announce(result.text);
      if (game.over) finishDuel();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (game.screen === SCREEN_PLAY && !game.over) {
      while (accumulator >= STEP) {
        tickTimer(game, STEP);
        accumulator -= STEP;
        if (game.over) {
          finishDuel();
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(game, game.screen, best);
  }

  // Leaving the tab pauses the round timer rather than letting it run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) game.turnTimer = 45;
  });

  announce('Emberfall Duel. Press Enter or click to play.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();

// Keep the seeded generator referenced so a fresh deal never reuses a stale one.
void createRandom;
