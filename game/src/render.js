// Every pixel of Emberfall Duel: the felt table, the cards, the ten HUD
// clusters of the cover frame, and the title / win / loss screens.
// The table is a fixed 1280x720 logical area; the canvas backing store is
// exactly that size, so a screenshot is the game at 1:1.
import { FIELD, PALETTE, SUITS, FONT, cardCost, START_LIFE } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSS, currentStrength } from './state.js';

export { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSS };

const W = FIELD.width;
const H = FIELD.height;
const SIDEBAR_X = 1004;
const SIDEBAR_W = 260;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 700, align = 'left', font = FONT) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

/** Draw one suit glyph — colour AND shape, never text alone. */
export function drawSuitGlyph(ctx, suitKey, cx, cy, size, color) {
  const suit = SUITS[suitKey];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color || suit.color;
  ctx.strokeStyle = color || suit.color;
  const s = size;
  if (suit.glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.bezierCurveTo(s * 0.42, -s * 0.2, s * 0.38, s * 0.28, s * 0.14, s * 0.42);
    ctx.bezierCurveTo(s * 0.3, s * 0.3, s * 0.18, s * 0.05, 0, s * 0.18);
    ctx.bezierCurveTo(-s * 0.18, s * 0.05, -s * 0.3, s * 0.3, -s * 0.14, s * 0.42);
    ctx.bezierCurveTo(-s * 0.38, s * 0.28, -s * 0.42, -s * 0.2, 0, -s * 0.55);
    ctx.fill();
  } else if (suit.glyph === 'wave') {
    ctx.lineWidth = s * 0.16;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(0, i * s * 0.34, s * 0.34, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  } else if (suit.glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.bezierCurveTo(s * 0.5, -s * 0.1, s * 0.42, s * 0.4, 0, s * 0.55);
    ctx.bezierCurveTo(-s * 0.42, s * 0.4, -s * 0.5, -s * 0.1, 0, -s * 0.55);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(0, s * 0.45);
    ctx.stroke();
  } else {
    // wind: three swooshes
    ctx.lineWidth = s * 0.15;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * s * 0.12, i * s * 0.3, s * (0.42 - Math.abs(i) * 0.1), Math.PI * 0.9, Math.PI * 1.75);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** A face-up card: big value, suit glyph, ember-cost pips, suit name. */
export function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  const selected = opts.selected === true;
  const dim = opts.dim === true;
  ctx.save();
  if (selected) {
    ctx.shadowColor = PALETTE.gold;
    ctx.shadowBlur = 22;
  }
  roundRect(ctx, x, y, w, h, Math.max(8, w * 0.09));
  ctx.fillStyle = PALETTE.ivory;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = selected ? 4 : 2.5;
  ctx.strokeStyle = selected ? PALETTE.gold : suit.color;
  ctx.stroke();
  if (dim) {
    ctx.fillStyle = 'rgba(13,26,18,0.45)';
    roundRect(ctx, x, y, w, h, Math.max(8, w * 0.09));
    ctx.fill();
  }
  // Value, top-left and bottom-right (upright, so a 9 never reads as a 6).
  const vSize = Math.round(w * 0.3);
  text(ctx, String(card.value), x + w * 0.1, y + vSize * 0.95, vSize, suit.color, 800);
  text(ctx, String(card.value), x + w - w * 0.1, y + h - vSize * 0.15, Math.round(vSize * 0.8), suit.color, 800, 'right');
  // Ember cost pips, top-right.
  const cost = cardCost(card.value);
  for (let i = 0; i < cost; i += 1) {
    ctx.fillStyle = '#b3541e';
    ctx.beginPath();
    ctx.arc(x + w - 10 - i * 13, y + 13, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6b8ae';
    ctx.beginPath();
    ctx.arc(x + w - 11.5 - i * 13, y + 11.5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Centre glyph + suit name.
  drawSuitGlyph(ctx, card.suit, x + w / 2, y + h * 0.52, Math.min(w, h) * 0.34, suit.color);
  text(ctx, suit.name.toUpperCase(), x + w / 2, y + h * 0.88, Math.round(w * 0.11), suit.dark, 800, 'center');
  ctx.restore();
}

/** A face-down card: patterned back with a gold emblem. */
export function drawCardBack(ctx, x, y, w, h, rot = 0) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.translate(-w / 2, -h / 2);
  roundRect(ctx, 0, 0, w, h, Math.max(6, w * 0.09));
  ctx.fillStyle = '#232a4a';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  roundRect(ctx, 5, 5, w - 10, h - 10, Math.max(4, w * 0.06));
  ctx.strokeStyle = 'rgba(212,175,55,0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Diamond lattice.
  ctx.strokeStyle = 'rgba(212,175,55,0.28)';
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * 14, 8);
    ctx.lineTo(w / 2 + i * 14, h - 8);
    ctx.stroke();
  }
  drawSuitGlyph(ctx, 'EMBER', w / 2, h / 2, Math.min(w, h) * 0.3, PALETTE.gold);
  ctx.restore();
}

function drawPanel(ctx, x, y, w, h, title) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = 'rgba(16,29,22,0.92)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.stroke();
  if (title) text(ctx, title, x + 12, y + 22, 13, PALETTE.gold, 800);
}

function drawLifeBar(ctx, x, y, w, life, max) {
  roundRect(ctx, x, y, w, 16, 8);
  ctx.fillStyle = '#0a0f0c';
  ctx.fill();
  const frac = Math.max(0, life / max);
  roundRect(ctx, x + 2, y + 2, Math.max(8, (w - 4) * frac), 12, 6);
  ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#d9a521' : '#e5534b';
  ctx.fill();
}

/** The felt: radial green, gold oval trim, speckles, faint centre emblem. */
function drawFelt(ctx, dots) {
  const g = ctx.createRadialGradient(W / 2, 330, 80, W / 2, 360, 760);
  g.addColorStop(0, PALETTE.feltLight);
  g.addColorStop(0.6, PALETTE.felt);
  g.addColorStop(1, PALETTE.feltDark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (const d of dots) {
    ctx.fillRect(d.x, d.y, 2, 2);
  }
  // Gold oval trim around the table.
  ctx.save();
  ctx.strokeStyle = 'rgba(212,175,55,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(508, 312, 480, 128, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(212,175,55,0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(508, 312, 452, 108, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `00:${String(s).padStart(2, '0')}`;
}

/** Shorten a line with an ellipsis until it fits `maxW` pixels. */
function fitLine(ctx, str, maxW) {
  if (ctx.measureText(str).width <= maxW) return str;
  let cut = str;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxW) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/** The cover frame: the table at its densest — all ten HUD clusters live. */
function drawTable(ctx, game, dots) {
  drawFelt(ctx, dots);

  // (1) Top bar: name + round/turn + timer + match score.
  ctx.fillStyle = 'rgba(10,15,12,0.92)';
  ctx.fillRect(0, 0, W, 52);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, 52, W, 2);
  text(ctx, 'EMBERFALL DUEL', 16, 34, 24, PALETTE.gold, 800);
  text(ctx, `ROUND ${Math.min(game.round, 12)} / 12`, 290, 33, 18, PALETTE.text, 700);
  text(ctx, `MATCH  ${game.tricksYou} – ${game.tricksRival}`, 560, 33, 18, PALETTE.text, 700);
  text(ctx, `TIME ${fmtTime(game.turnTimer)}`, 800, 33, 18, game.turnTimer <= 10 ? PALETTE.red : PALETTE.text, 800);
  text(ctx, `BEST ${game.best}`, 1140, 33, 18, PALETTE.muted, 700);

  // (2) Rival panel: name + big life + bar + tricks. (3) Rival hand backs.
  drawPanel(ctx, 16, 60, 272, 132, 'RIVAL');
  // Seraphine's portrait: a hooded mask, gold ring, two lit eyes.
  ctx.save();
  ctx.beginPath();
  ctx.arc(52, 106, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#232a4a';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(30, 112);
  ctx.quadraticCurveTo(52, 76, 74, 112);
  ctx.quadraticCurveTo(52, 100, 30, 112);
  ctx.fillStyle = '#10131f';
  ctx.fill();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(44, 106, 3, 0, Math.PI * 2);
  ctx.arc(60, 106, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  text(ctx, 'SERAPHINE', 84, 102, 20, PALETTE.text, 800);
  text(ctx, 'THE RIVAL', 84, 122, 12, PALETTE.muted, 700);
  text(ctx, `LIFE ${game.lifeRival}`, 28, 168, 30, game.lifeRival <= 12 ? PALETTE.red : PALETTE.text, 800);
  text(ctx, `/ ${START_LIFE}`, 118, 168, 16, PALETTE.muted, 700);
  drawLifeBar(ctx, 170, 152, 106, game.lifeRival, START_LIFE);
  text(ctx, `TRICKS ${game.tricksRival}`, 170, 186, 14, PALETTE.muted, 700);

  // Rival hand: seven backs fanned, one face-up card at the end.
  const backs = game.rivalHand.length;
  for (let i = 0; i < backs; i += 1) {
    const bx = 308 + i * 62;
    drawCardBack(ctx, bx, 66 + Math.abs(i - 3) * 3, 58, 84, (i - 3) * 0.03);
  }
  text(ctx, `HAND ${backs}`, 308, 200, 13, PALETTE.muted, 700);
  if (game.rivalTableCard) {
    drawCardFace(ctx, game.rivalTableCard, 762, 62, 58, 84);
    text(ctx, 'LAST PLAY', 762, 200, 13, PALETTE.muted, 700);
  }

  // (6) Rival intent panel — what she is about to do, before you commit.
  drawPanel(ctx, 836, 60, 160, 132, 'RIVAL PLAYS…');
  drawSuitGlyph(ctx, game.rivalIntent.suit, 916, 128, 34, SUITS[game.rivalIntent.suit].color);
  text(ctx, game.rivalIntent.suit, 916, 168, 16, SUITS[game.rivalIntent.suit].color, 800, 'center');
  text(ctx, game.rivalIntent.strength, 916, 188, 14, PALETTE.text, 800, 'center');

  // (5) The table centre: the two played cards + combo banner + damage.
  text(ctx, 'THE TABLE', 16, 228, 13, PALETTE.gold, 800);
  if (game.tableCard) drawCardFace(ctx, game.tableCard, 330, 232, 118, 170);
  if (game.rivalTableCard) drawCardFace(ctx, game.rivalTableCard, 556, 232, 118, 170);
  text(ctx, 'YOU', 389, 424, 14, PALETTE.text, 800, 'center');
  text(ctx, 'RIVAL', 615, 424, 14, PALETTE.text, 800, 'center');
  const res = game.lastResult;
  if (res) {
    const bannerY = 250;
    if (game.combo >= 2) {
      ctx.fillStyle = 'rgba(212,175,55,0.95)';
      roundRect(ctx, 700, bannerY, 220, 44, 8);
      ctx.fill();
      text(ctx, `COMBO ×${game.combo}`, 810, bannerY + 30, 24, '#1c2420', 800, 'center');
    }
    const bonusText = res.bonuses.length > 0 ? res.bonuses.join('  •  ') : res.text;
    text(ctx, bonusText, 810, 322, 17, PALETTE.gold, 800, 'center');
    if (res.damage > 0) {
      text(ctx, `+${res.damage} DAMAGE`, 810, 352, 22, res.winner === 'you' ? '#7ee2a0' : PALETTE.red, 800, 'center');
      text(ctx, res.winner === 'you' ? 'YOU WON THE TRICK' : res.winner === 'rival' ? 'RIVAL WON THE TRICK' : 'TRICK TIED', 810, 378, 14, PALETTE.text, 700, 'center');
    }
  }

  // (2b) Player life panel, left of the hand.
  drawPanel(ctx, 16, 436, 170, 132, 'YOU');
  text(ctx, `LIFE ${game.lifeYou}`, 28, 500, 30, game.lifeYou <= 12 ? PALETTE.red : PALETTE.text, 800);
  text(ctx, `/ ${START_LIFE}`, 128, 500, 16, PALETTE.muted, 700);
  drawLifeBar(ctx, 28, 514, 146, game.lifeYou, START_LIFE);
  text(ctx, `TRICKS ${game.tricksYou}`, 28, 556, 14, PALETTE.muted, 700);

  // (11) Duel track: every trick so far as a chip — the dead band becomes proof.
  drawPanel(ctx, 200, 436, 796, 88, 'DUEL TRACK — TRICK BY TRICK');
  const history = game.trickHistory.slice(-8);
  history.forEach((entry, i) => {
    const cx = 216 + i * 84;
    const won = entry.winner === 'you';
    roundRect(ctx, cx, 462, 74, 50, 8);
    ctx.fillStyle = won ? 'rgba(63,158,87,0.9)' : entry.winner === 'tie' ? 'rgba(120,120,110,0.9)' : 'rgba(217,72,59,0.9)';
    ctx.fill();
    text(ctx, `R${entry.round}`, cx + 37, 480, 12, PALETTE.ivory, 800, 'center');
    text(ctx, won ? `W +${entry.damage}` : entry.winner === 'tie' ? 'TIE' : `L −${entry.damage}`, cx + 37, 503, 14, PALETTE.ivory, 800, 'center');
  });
  const nextX = 216 + history.length * 84;
  if (nextX + 74 <= 984) {
    roundRect(ctx, nextX, 462, 74, 50, 8);
    ctx.fillStyle = 'rgba(212,175,55,0.18)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = PALETTE.gold;
    ctx.stroke();
    text(ctx, `R${game.round}`, nextX + 37, 480, 12, PALETTE.gold, 800, 'center');
    text(ctx, 'YOUR MOVE', nextX + 37, 503, 11, PALETTE.gold, 800, 'center');
  }

  // (3) Player hand: seven face-up cards, the selected one raised and lit.
  const hand = game.hand;
  const cardW = 92;
  const cardH = 132;
  const handRects = [];
  const startX = 200;
  for (let i = 0; i < hand.length; i += 1) {
    const isSel = i === game.selected;
    const cx = startX + i * 108;
    const cy = isSel ? 540 : 566;
    drawCardFace(ctx, hand[i], cx, cy, cardW, cardH, { selected: isSel });
    handRects.push({ x: cx, y: cy, w: cardW, h: cardH });
  }
  text(ctx, 'YOUR HAND — CLICK A CARD, THEN PLAY', 200, 530, 13, PALETTE.muted, 700);
  if (hand[game.selected]) {
    const sel = hand[game.selected];
    ctx.font = `800 13px ${FONT}`;
    const hintW = ctx.measureText('YOUR HAND — CLICK A CARD, THEN PLAY  ').width;
    text(ctx, `${SUITS[sel.suit].name} ${sel.value}  •  cost ${cardCost(sel.value)} embers`, 200 + hintW, 530, 13, PALETTE.gold, 800);
  }

  // (7)(8)(9)(10) Sidebar: strength, energy, deck/discard, log, rules, buttons.
  const sx = SIDEBAR_X;
  const sw = SIDEBAR_W;
  drawPanel(ctx, sx, 60, sw, 92, 'HAND STRENGTH');
  const strength = currentStrength(game);
  text(ctx, `WIN ${strength}%`, sx + 14, 128, 30, strength >= 60 ? '#7ee2a0' : strength >= 40 ? PALETTE.gold : PALETTE.red, 800);
  roundRect(ctx, sx + 14, 136, sw - 28, 10, 5);
  ctx.fillStyle = '#0a0f0c';
  ctx.fill();
  roundRect(ctx, sx + 16, 138, (sw - 32) * (strength / 100), 6, 3);
  ctx.fillStyle = strength >= 60 ? '#58b368' : strength >= 40 ? '#d9a521' : '#e5534b';
  ctx.fill();

  drawPanel(ctx, sx, 160, sw, 64, 'ENERGY');
  for (let i = 0; i < 10; i += 1) {
    ctx.fillStyle = i < game.energy ? '#f2c94c' : 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.arc(sx + 24 + i * 23, 200, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, `${game.energy} / 10`, sx + sw - 14, 178, 14, PALETTE.text, 800, 'right');

  drawPanel(ctx, sx, 232, sw, 76, 'DECK & DISCARD');
  drawCardBack(ctx, sx + 14, 258, 30, 42);
  text(ctx, `DECK ${game.deck.length}`, sx + 54, 288, 18, PALETTE.text, 800);
  text(ctx, `DISCARD ${game.discard.length}`, sx + 150, 288, 18, PALETTE.text, 800);

  drawPanel(ctx, sx, 316, sw, 104, 'LAST MOVES');
  ctx.font = `600 12.5px ${FONT}`;
  game.log.forEach((line, i) => {
    text(ctx, `› ${fitLine(ctx, line, sw - 26)}`, sx + 12, 352 + i * 22, 12.5, i === 0 ? PALETTE.text : PALETTE.muted, 600);
  });

  drawPanel(ctx, sx, 428, sw, 96, 'HOW IT PAYS');
  text(ctx, 'SET — same value ×2 damage', sx + 12, 460, 13, PALETTE.text, 600);
  text(ctx, 'RESONANCE — same suit +2', sx + 12, 482, 13, PALETTE.text, 600);
  text(ctx, 'COMBO — win streak adds damage', sx + 12, 504, 13, PALETTE.text, 600);

  // Action buttons.
  const buttons = {
    play: { x: sx, y: 536, w: sw, h: 52 },
    draw: { x: sx, y: 596, w: 124, h: 44 },
    guard: { x: sx + 136, y: 596, w: 124, h: 44 },
  };
  roundRect(ctx, buttons.play.x, buttons.play.y, buttons.play.w, buttons.play.h, 10);
  ctx.fillStyle = PALETTE.gold;
  ctx.fill();
  text(ctx, '▶  PLAY CARD', sx + sw / 2, 570, 22, '#1c2420', 800, 'center');
  roundRect(ctx, buttons.draw.x, buttons.draw.y, buttons.draw.w, buttons.draw.h, 8);
  ctx.fillStyle = '#2c4a38';
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.stroke();
  text(ctx, 'DRAW  (D)', sx + 62, 624, 15, PALETTE.text, 800, 'center');
  roundRect(ctx, buttons.guard.x, buttons.guard.y, buttons.guard.w, buttons.guard.h, 8);
  ctx.fillStyle = '#2c4a38';
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.stroke();
  text(ctx, 'GUARD  (G)', sx + 198, 624, 15, PALETTE.text, 800, 'center');
  text(ctx, '1–7 select  •  ENTER play', sx + sw / 2, 668, 12.5, PALETTE.muted, 600, 'center');

  return { handRects, buttons };
}

function drawTitle(ctx, game, dots) {
  drawFelt(ctx, dots);
  // A dimmed, dealt table behind the title.
  ctx.fillStyle = 'rgba(10,15,12,0.55)';
  ctx.fillRect(0, 0, W, H);
  const preview = [
    { suit: 'EMBER', value: 9, id: 'p1' },
    { suit: 'TIDE', value: 7, id: 'p2' },
    { suit: 'THORN', value: 5, id: 'p3' },
    { suit: 'GALE', value: 8, id: 'p4' },
  ];
  for (let i = 0; i < 5; i += 1) drawCardBack(ctx, 420 + i * 72, 64, 58, 84, (i - 2) * 0.04);
  text(ctx, 'EMBERFALL', W / 2, 272, 118, PALETTE.gold, 800, 'center');
  text(ctx, 'DUEL', W / 2, 380, 118, PALETTE.ivory, 800, 'center');
  text(ctx, 'A duel of four winds — Ember, Tide, Thorn, Gale', W / 2, 422, 22, PALETTE.text, 600, 'center');
  // Suit legend.
  ['EMBER', 'TIDE', 'THORN', 'GALE'].forEach((suit, i) => {
    const cx = 448 + i * 118;
    drawSuitGlyph(ctx, suit, cx, 470, 26, SUITS[suit].color);
    text(ctx, SUITS[suit].name.toUpperCase(), cx, 498, 13, SUITS[suit].color, 800, 'center');
  });
  text(ctx, 'PRESS ENTER OR CLICK TO PLAY', W / 2, 540, 26, PALETTE.gold, 800, 'center');
  preview.forEach((card, i) => {
    drawCardFace(ctx, card, 380 + i * 140, 566, 100, 142, { dim: true });
  });
  if (game.best > 0) text(ctx, `BEST MATCH — ${game.best} TRICKS`, W / 2, 84, 16, PALETTE.muted, 700, 'center');
  return { handRects: [], buttons: {} };
}

function drawEnd(ctx, game, won, dots) {
  drawFelt(ctx, dots);
  ctx.fillStyle = won ? 'rgba(20,40,16,0.45)' : 'rgba(40,10,10,0.5)';
  ctx.fillRect(0, 0, W, H);
  if (won && game.confetti) {
    for (const c of game.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
  }
  text(ctx, won ? 'VICTORY!' : 'DEFEAT', W / 2, 220, 120, won ? PALETTE.gold : PALETTE.red, 800, 'center');
  text(ctx, won ? "Seraphine's life fell to zero — the table is yours." : 'Seraphine swept the table. The four winds turn against you.', W / 2, 268, 22, PALETTE.text, 600, 'center');
  text(ctx, `FINAL  •  LIFE ${game.lifeYou} – ${game.lifeRival}  •  TRICKS ${game.tricksYou} – ${game.tricksRival}`, W / 2, 312, 24, PALETTE.ivory, 800, 'center');
  const hero = won ? game.tableCard : game.rivalTableCard;
  if (hero) {
    drawCardFace(ctx, hero, W / 2 - 70, 350, 140, 200, { selected: won });
    text(ctx, won ? 'THE WINNING CARD' : 'THE CARD THAT BROKE YOU', W / 2, 584, 15, PALETTE.muted, 700, 'center');
  }
  text(ctx, 'PRESS ENTER TO DUEL AGAIN', W / 2, 640, 24, PALETTE.gold, 800, 'center');
  return { handRects: [], buttons: {} };
}

/** Create a renderer for a canvas; returns { draw, handRects, buttons }. */
export function createRenderer(canvas) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  // Fixed speckle field so the felt looks the same every frame and every run.
  let seed = 1234567;
  const dots = [];
  for (let i = 0; i < 420; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    dots.push({ x: (seed % 1280), y: ((seed >> 7) % 720) });
  }
  const renderer = {
    handRects: [],
    buttons: {},
    draw(game, screen, best) {
      game.best = Math.max(game.best, best || 0);
      let layout;
      if (screen === SCREEN_TITLE) layout = drawTitle(ctx, game, dots);
      else if (screen === SCREEN_WIN) layout = drawEnd(ctx, game, true, dots);
      else if (screen === SCREEN_LOSS) layout = drawEnd(ctx, game, false, dots);
      else layout = drawTable(ctx, game, dots);
      renderer.handRects = layout.handRects;
      renderer.buttons = layout.buttons;
    },
  };
  return renderer;
}
