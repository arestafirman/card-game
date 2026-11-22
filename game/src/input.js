// Keyboard and mouse: click a card to raise it, click PLAY (or press Enter)
// to commit it, D to draw, G to guard, 1-7 to select, arrows to walk the hand.
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSS } from './state.js';

export const ACTION_CONFIRM = 1;
export const ACTION_DRAW = 2;
export const ACTION_GUARD = 4;

/** Wire the canvas: returns { takeActions, clickCardAt, buttonAt } for main.js. */
export function createInput(canvas, layout) {
  let actions = 0;
  let click = null;
  let keySelect = -1;

  function onKey(event) {
    if (event.repeat) return;
    const key = event.key;
    if (key === 'Enter' || key === ' ') actions |= ACTION_CONFIRM;
    else if (key === 'd' || key === 'D') actions |= ACTION_DRAW;
    else if (key === 'g' || key === 'G') actions |= ACTION_GUARD;
    else if (key >= '1' && key <= '7') keySelect = Number(key) - 1;
    else if (key === 'ArrowLeft') keySelect = -2;
    else if (key === 'ArrowRight') keySelect = -3;
    if ([' ', 'ArrowLeft', 'ArrowRight'].includes(key)) event.preventDefault();
  }

  function onPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointer);

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeKeySelect() {
      const taken = keySelect;
      keySelect = -1;
      return taken;
    },
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
    layout,
  };
}

/** Which hand card (if any) a click lands on; -1 when it lands elsewhere. */
export function handCardAt(click, handRects) {
  if (!click) return -1;
  for (let i = 0; i < handRects.length; i += 1) {
    const r = handRects[i];
    if (click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h) return i;
  }
  return -1;
}

/** Which action button (if any) a click lands on; '' when it lands elsewhere. */
export function buttonAt(click, buttons) {
  if (!click) return '';
  for (const [name, r] of Object.entries(buttons)) {
    if (click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h) return name;
  }
  return '';
}

export { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSS };
