// Tile maps for all 9 Green Meadow screens
// T = tile type constants, objects = tiles with metadata
import { T } from './tileEngine.js'

const G = T.GRASS
const TL = T.TALL
const TR = T.TREE
const P = T.PATH
const W = T.WATER
const FL = T.FLOWER
const EN = T.EXIT_N
const ES = T.EXIT_S
const EE = T.EXIT_E
const EW = T.EXIT_W
const NPC = (npc_type) => ({ type: T.NPC, npc_type })
const SIGN = T.SIGN
const ENEMY = (enemy_type) => ({ type: T.ENEMY, enemy_type })

// ─── BM — Starting Path (20×15) ──────────────────────────────────────────────
// Player starts at col 10, row 12
// EXIT_N cols 7–12 at row 14 → MC (north)
// EXIT_E col 19 row 7 → BR
// EXIT_W col 0 row 7 → BL

export const BM_MAP = [
  // Row 0 — all TREE
  [TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR,TR],
  // Row 1 — TREE border
  [TR,G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, TR],
  // Row 2 — flowers scattered
  [TR,G, FL,G, G, G, G, FL,G, G, G, G, G, G, G, G, G, G, G, TR],
  // Row 3 — owl NPC
  [TR,G, G, G, G, G, NPC('owl'), G, G, G, G, G, G, G, G, G, G, G, G, TR],
  // Row 4 — sign
  [TR,G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, SIGN, TR],
  // Row 5 — tall grass bands
  [TR,G, G, TL,TL,TL,G, G, G, G, G, G, G, TL,TL,TL,G, G, G, TR],
  // Row 6 — tall grass bands
  [TR,G, G, TL,TL,TL,G, G, G, G, G, G, G, TL,TL,TL,G, G, G, TR],
  // Row 7 — exits E and W
  [EW,G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, EE],
  // Row 8 — stone path horizontal
  [TR,G, G, G, G, P, P, P, P, P, P, P, P, P, P, G, G, G, G, TR],
  // Row 9 — stone path horizontal
  [TR,G, G, G, G, P, P, P, P, P, P, P, P, P, P, G, G, G, G, TR],
  // Row 10 — open grass
  [TR,G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, TR],
  // Row 11 — open grass (enemies placed dynamically via SCREEN_ENEMIES)
  [TR,G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, TR],
  // Row 12 — flowers, player start here (col 10)
  [TR,G, G, G, G, G, FL,G, G, G, G, G, G, G, G, G, G, G, G, TR],
  // Row 13 — open
  [TR,G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, TR],
  // Row 14 — EXIT_N at cols 7–12 (south edge → leads to MC north)
  [TR,TR,TR,TR,TR,TR,TR,EN,EN,EN,EN,EN,EN,TR,TR,TR,TR,TR,TR,TR],
]

export const BM_START = { col: 10, row: 12 }

// ─── Minimal maps for other 8 screens ────────────────────────────────────────
// Each: TREE border, GRASS fill, EXIT tiles matching worldConfig.js connections

function makeMinimalMap(exits) {
  // exits: array of {side:'N'|'S'|'E'|'W', col, row}
  const map = []
  for (let r = 0; r < 15; r++) {
    const row = []
    for (let c = 0; c < 20; c++) {
      const isBorder = r === 0 || r === 14 || c === 0 || c === 19
      row.push(isBorder ? TR : G)
    }
    map.push(row)
  }
  for (const ex of exits) {
    const tileType = ex.side === 'N' ? EN : ex.side === 'S' ? ES : ex.side === 'E' ? EE : EW
    if (ex.side === 'N') {
      for (let c = ex.startCol; c <= ex.endCol; c++) map[0][c] = tileType
    } else if (ex.side === 'S') {
      for (let c = ex.startCol; c <= ex.endCol; c++) map[14][c] = tileType
    } else if (ex.side === 'E') {
      for (let r = ex.startRow; r <= ex.endRow; r++) map[r][19] = tileType
    } else {
      for (let r = ex.startRow; r <= ex.endRow; r++) map[r][0] = tileType
    }
  }
  return map
}

// MC — Town Square: N→TM, S→BM, E→MR, W→ML
export const MC_MAP = makeMinimalMap([
  { side: 'N', startCol: 7, endCol: 12 },
  { side: 'S', startCol: 7, endCol: 12 },
  { side: 'E', startRow: 6, endRow: 8 },
  { side: 'W', startRow: 6, endRow: 8 },
])
export const MC_START = { col: 10, row: 13 } // entering from S

// TM — N:null, S→MC, E→TR, W→TL
export const TM_MAP = makeMinimalMap([
  { side: 'S', startCol: 7, endCol: 12 },
  { side: 'E', startRow: 6, endRow: 8 },
  { side: 'W', startRow: 6, endRow: 8 },
])
export const TM_START = { col: 10, row: 13 }

// TL — N:null, E→TM, W:null, S→ML
export const TL_MAP = makeMinimalMap([
  { side: 'E', startRow: 6, endRow: 8 },
  { side: 'S', startCol: 7, endCol: 12 },
])
export const TL_START = { col: 10, row: 13 }

// TR — N:null, E:null, W→TM, S→MR
export const TR_MAP = makeMinimalMap([
  { side: 'W', startRow: 6, endRow: 8 },
  { side: 'S', startCol: 7, endCol: 12 },
])
export const TR_START = { col: 10, row: 13 }

// ML — N→TL, E→MC, W:null, S→BL
export const ML_MAP = makeMinimalMap([
  { side: 'N', startCol: 7, endCol: 12 },
  { side: 'E', startRow: 6, endRow: 8 },
  { side: 'S', startCol: 7, endCol: 12 },
])
export const ML_START = { col: 10, row: 13 }

// MR — N→TR, E:null, W→MC, S→BR
export const MR_MAP = makeMinimalMap([
  { side: 'N', startCol: 7, endCol: 12 },
  { side: 'W', startRow: 6, endRow: 8 },
  { side: 'S', startCol: 7, endCol: 12 },
])
export const MR_START = { col: 10, row: 13 }

// BL — N→ML, E→BM, W:null, S:null
export const BL_MAP = makeMinimalMap([
  { side: 'N', startCol: 7, endCol: 12 },
  { side: 'E', startRow: 6, endRow: 8 },
])
export const BL_START = { col: 10, row: 13 }

// BR — N→MR, E:null, W→BM, S:null
export const BR_MAP = makeMinimalMap([
  { side: 'N', startCol: 7, endCol: 12 },
  { side: 'W', startRow: 6, endRow: 8 },
])
export const BR_START = { col: 10, row: 13 }

// ─── Enemy placement per screen ───────────────────────────────────────────────
// Each entry: { type, col, row } — initial tile position (1-indexed from interior)

export const SCREEN_ENEMIES = {
  BM: [
    { type: 'sleepy_bunny', col: 4,  row: 5  },
    { type: 'sleepy_bunny', col: 15, row: 3  },
    { type: 'bouncy_slime', col: 8,  row: 11 },
    { type: 'leaf_sprite',  col: 16, row: 10 },
    { type: 'baby_zombie',  col: 14, row: 3  },
  ],
  MC: [
    { type: 'bouncy_slime', col: 5,  row: 4  },
    { type: 'fox_kit',      col: 14, row: 10 },
    { type: 'leaf_sprite',  col: 4,  row: 9  },
    { type: 'snake',        col: 10, row: 8  },
  ],
  TM: [
    { type: 'leaf_sprite',  col: 5,  row: 5  },
    { type: 'leaf_sprite',  col: 15, row: 9  },
    { type: 'grumpy_mole',  col: 10, row: 7  },
  ],
  TL: [
    { type: 'grumpy_mole',  col: 6,  row: 5  },
    { type: 'mushroom_imp', col: 14, row: 9  },
  ],
  TR: [
    { type: 'fox_kit',      col: 10, row: 5  },
    { type: 'mushroom_imp', col: 6,  row: 9  },
    { type: 'snake',        col: 13, row: 7  },
  ],
  ML: [
    { type: 'bouncy_slime', col: 5,  row: 7  },
    { type: 'leaf_sprite',  col: 13, row: 5  },
    { type: 'grumpy_mole',  col: 8,  row: 11 },
  ],
  MR: [
    { type: 'fox_kit',      col: 12, row: 7  },
    { type: 'bouncy_slime', col: 6,  row: 10 },
    { type: 'mushroom_imp', col: 15, row: 4  },
    { type: 'baby_zombie',  col: 8,  row: 3  },
    { type: 'snake',        col: 15, row: 11 },
  ],
  BL: [
    { type: 'egg_pawn',     col: 6,  row: 7  },
    { type: 'grumpy_mole',  col: 14, row: 5  },
  ],
  BR: [
    { type: 'egg_pawn',     col: 14, row: 7  },
    { type: 'mushroom_imp', col: 7,  row: 5  },
    { type: 'bouncy_slime', col: 10, row: 10 },
  ],
}

// ─── Map registry ─────────────────────────────────────────────────────────────

export const SCREEN_MAPS = {
  BM: { map: BM_MAP, start: BM_START },
  MC: { map: MC_MAP, start: MC_START },
  TM: { map: TM_MAP, start: TM_START },
  TL: { map: TL_MAP, start: TL_START },
  TR: { map: TR_MAP, start: TR_START },
  ML: { map: ML_MAP, start: ML_START },
  MR: { map: MR_MAP, start: MR_START },
  BL: { map: BL_MAP, start: BL_START },
  BR: { map: BR_MAP, start: BR_START },
}
