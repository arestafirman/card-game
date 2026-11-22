# Emberfall Duel

[![Play on make.fun](https://make.fun/c/best-card-game-20261122-1826/badge.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![Entry: arestafirman/card-game](https://make.fun/c/best-card-game-20261122-1826/entry.svg)](https://github.com/arestafirman/card-game)
[![Competition: best-card-game-20261122-1826](https://make.fun/c/best-card-game-20261122-1826/status.svg)](https://make.fun/c/best-card-game-20261122-1826)

A complete, original card duel that plays offline in a desktop browser.
You face **Seraphine the Rival** across a felt table: seven cards each,
forty life each, four winds — **Ember, Tide, Thorn, Gale** — values 1–9,
and three ways to make a trick pay.

## How a trick pays

- **Win the trick** — higher value deals the difference as damage.
- **SET** — match the last card's value and the damage doubles.
- **RESONANCE** — match the last card's suit and add +2 damage.
- **COMBO** — win tricks in a row and the streak adds damage.
- **GUARD** — take half damage and draw a card; **DRAW** costs 2 embers.
- Every card costs 1–3 embers by its value; energy refills each round.
- Seraphine declares her intent before you play, and answers your card
  with the cheapest card that still beats it — read her, then counter her.

## Play

Serve `game/` with `node serve.ts` and open http://localhost:8080, or open
`game/index.html` from any static server. Click a card to raise it, then
**PLAY** (or press Enter). Keys: `1–7` select, `Enter` play, `D` draw,
`G` guard.

## Screenshots

Staged deterministically from the real rules (`game/src/shots.js`):

| File | Scene |
|---|---|
| `1-table.jpg` | Mid-duel at its densest: full hand, live combo, rival life low |
| `2-title.jpg` | Title screen |
| `3-win.jpg` | Victory screen |
| `4-loss.jpg` | Defeat screen |

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to the output directory and writes `dossier.json` with the
vendored make.fun library. No network requests, no copyrighted assets —
every glyph and texture is drawn in code.
