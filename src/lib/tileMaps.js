// Tile maps: legacy 9-screen Green Meadow + dynamic level generators
import { T } from './tileEngine.js'
import { WORLD_LEVELS, QUEST_GIVER } from '../config/worldConfig.js'

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

// ─── Dynamic map generators ───────────────────────────────────────────────────
// Exit placement per slot:
//   NW:  EXIT_E(right), EXIT_S(bottom)
//   NE:  EXIT_W(left),  EXIT_S(bottom)
//   SW:  EXIT_N(top),   EXIT_E(right),  EXIT_S(bottom)
//   SE:  EXIT_N(top),   EXIT_W(left),   EXIT_S(bottom)
//   BOSS: EXIT_N at row 14 (entry+return to SW via north connection)
//   MAZE: EXIT_N(top row 0), EXIT_E(right), EXIT_S(bottom)

const TALL_PATCHES = {
  NW: [[3, 5], [8, 3]],
  NE: [[3, 14], [7, 12]],
  SW: [[9, 5], [12, 3]],
  SE: [[9, 14], [11, 12]],
}

export function generateScreenMap(screenSlot, worldLevel) {
  const map = Array.from({ length: 15 }, () => Array(20).fill(T.GRASS))

  // TREE border
  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 20; c++)
      if (r === 0 || r === 14 || c === 0 || c === 19) map[r][c] = T.TREE

  // PATH strip (horizontal, rows 7-8)
  for (let c = 1; c < 19; c++) { map[7][c] = T.PATH; map[8][c] = T.PATH }

  // Tall grass patches (vary by slot)
  const patches = TALL_PATCHES[screenSlot] ?? [[4, 5], [9, 12]]
  for (const [pr, pc] of patches) {
    for (let dr = 0; dr < 3; dr++)
      for (let dc = 0; dc < 4; dc++)
        if (map[pr + dr]?.[pc + dc] !== undefined) map[pr + dr][pc + dc] = T.TALL
  }

  // Flower accents
  for (let c = 2; c < 18; c += 4) map[2][c] = T.FLOWER

  // SPEC GAME-B §B.3 (2026-07-11) — side-quest NPC. The only pre-existing NPC
  // (the owl) lives in the legacy BM_MAP, which is unreachable from the live
  // dynamic NW/NE/SW/SE navigation (WorldScreen.jsx always starts screenId at
  // 'NW' from VALID_DYNAMIC) — a judgment call, documented in CHATBOT_NOTES:
  // rather than "extend" a genuinely dead NPC, this places one reachable
  // quest-giver on NW at a spot clear of the path/tall-grass/exit tiles above.
  if (screenSlot === 'NW') map[QUEST_GIVER.row][QUEST_GIVER.col] = NPC(QUEST_GIVER.npcType)

  // Exit tiles
  const slot = screenSlot
  if (slot === 'NW' || slot === 'SW' || slot === 'SE') {
    // EXIT_N at top (row 0)
    if (slot === 'SW' || slot === 'SE') {
      for (let c = 7; c <= 12; c++) map[0][c] = T.EXIT_N
    }
  }
  if (slot === 'NE') {
    // NE has no top exit
  }
  // EXIT_S at bottom (row 14)
  for (let c = 7; c <= 12; c++) map[14][c] = T.EXIT_S
  // EXIT_E at right (col 19)
  if (slot === 'NW' || slot === 'SW') {
    for (let r = 6; r <= 8; r++) map[r][19] = T.EXIT_E
  }
  // EXIT_W at left (col 0)
  if (slot === 'NE' || slot === 'SE') {
    for (let r = 6; r <= 8; r++) map[r][0] = T.EXIT_W
  }

  return map
}

// SPEC GAME-B §B.3 (2026-07-11) — hidden-passage secret glade. A small,
// fully tree-enclosed 1-screen reward room: a single chest at the center
// (spawned by the caller, same generic chestsRef mechanism as every other
// screen), one EXIT_S tile back to the NW screen the bush lives on.
export function generateGladeMap() {
  const map = Array.from({ length: 15 }, () => Array(20).fill(T.GRASS))
  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 20; c++)
      if (r === 0 || r === 14 || c === 0 || c === 19) map[r][c] = T.TREE
  for (let c = 2; c < 18; c += 3) map[2][c] = T.FLOWER
  map[14][9] = T.EXIT_S; map[14][10] = T.EXIT_S
  return map
}
export const GLADE_START = { col: 10, row: 6 }
export const GLADE_CHEST = { col: 10, row: 8 }

export function generateBossMap(worldLevel) {
  const map = Array.from({ length: 15 }, () => Array(20).fill(T.GRASS))

  // TREE border
  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 20; c++)
      if (r === 0 || r === 14 || c === 0 || c === 19) map[r][c] = T.TREE

  // Winding wall obstacles (corridor toward boss at row 3, col 7)
  for (let c = 3; c < 17; c++) map[5][c] = T.TREE
  for (let c = 3; c < 14; c++) map[10][c] = T.TREE
  map[5][9]  = T.GRASS; map[5][10] = T.GRASS   // gap in first wall
  map[10][14] = T.GRASS; map[10][15] = T.GRASS  // gap in second wall

  // Entry/return portal: EXIT_N at row 14 (connects back to SW via BOSS.connects.N)
  map[14][9] = T.EXIT_N; map[14][10] = T.EXIT_N

  return map
}

export function generateMazeMap() {
  const map = Array.from({ length: 15 }, () => Array(20).fill(T.TREE))
  const openCells = []

  // Recursive backtracker — carves through interior odd-coordinate cells
  function carve(r, c) {
    const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]]
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]]
    }
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc
      if (nr > 0 && nr < 14 && nc > 0 && nc < 19 && map[nr][nc] === T.TREE) {
        const mr = r + Math.sign(dr), mc = c + Math.sign(dc)
        map[mr][mc] = T.GRASS
        map[nr][nc] = T.GRASS
        openCells.push({ col: mc, row: mr }, { col: nc, row: nr })
        carve(nr, nc)
      }
    }
  }

  map[13][1] = T.GRASS
  openCells.push({ col: 1, row: 13 })
  carve(13, 1)

  // Ensure corridor reaches the exit corner (top-right)
  if (map[1][17] !== T.GRASS) { map[1][17] = T.GRASS; openCells.push({ col: 17, row: 1 }) }
  if (map[1][18] !== T.GRASS) { map[1][18] = T.GRASS; openCells.push({ col: 18, row: 1 }) }

  // Single exit portal tile — top-right corner, opposite the bottom-left entry.
  // Reuses EXIT_N for collision/routing; rendered as a purple portal by the RAF loop.
  map[1][18] = T.EXIT_N

  return { map, openCells, entryPos: { col: 1, row: 13 }, exitPos: { col: 18, row: 1 } }
}

export function spawnMazeContents(openCells, entryPos, exitPos) {
  const safeCells = openCells.filter(c =>
    (Math.abs(c.col - entryPos.col) + Math.abs(c.row - entryPos.row) > 2) &&
    (Math.abs(c.col - exitPos.col) + Math.abs(c.row - exitPos.row) > 2)
  )
  const shuffled = [...safeCells]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const chestCount = 2 + Math.floor(Math.random() * 2)
  const chests = shuffled.slice(0, chestCount).map((pos, i) => ({
    col: pos.col, row: pos.row,
    id: `maze_chest_${Date.now()}_${i}`,
    opened: false,
  }))

  const enemyCount = 3 + Math.floor(Math.random() * 2)
  const enemyCells = shuffled.slice(chestCount, chestCount + enemyCount)
  const enemies = enemyCells.map((pos, i) => ({
    id: `ghost_${Date.now()}_${i}`,
    type: 'ghost_wisp',
    col: pos.col, row: pos.row,
    dir: 'none', timer: 0,
    rngSeed: Math.floor(Math.random() * 97),
    woken: false, isAggro: false, aggroTimer: 0,
    defeated: false, respawnTimer: 0, dead: false, deathTimer: 0, opacity: 1,
  }))

  return { chests, enemies }
}

// Randomly place enemies from world level pool on a regular screen slot
export function getScreenEnemies(screenSlot, worldLevel) {
  if (screenSlot === 'BOSS' || screenSlot === 'MAZE') return []
  const levelConfig = WORLD_LEVELS[worldLevel ?? 0] ?? WORLD_LEVELS[0]
  const pool = levelConfig.enemies
  const count = 4 + Math.floor(Math.random() * 3)  // 4–6 per screen
  return Array.from({ length: count }, () => ({
    type: pool[Math.floor(Math.random() * pool.length)],
    col: 2 + Math.floor(Math.random() * 16),
    row: 2 + Math.floor(Math.random() * 11),
  }))
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
