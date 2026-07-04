// World config — static 3×3 legacy Green Meadow + dynamic level system
// Dynamic layout: NW NE / SW SE / BOSS (+ MAZE replacing SW when active)

export const WORLD_REGIONS = {
  'green-meadow': { label: 'ทุ่งโคลเวอร์', entryScreen: 'BM' },
}

// connects: N/S/E/W → screen id, or null (no exit in that direction)
export const SCREENS = {
  BM: { label: 'ทางเดินเริ่มต้น', region: 'green-meadow', connects: { N: 'MC', E: 'BR', W: 'BL', S: null } },
  MC: { label: 'จัตุรัสเมือง',    region: 'green-meadow', connects: { N: 'TM', E: 'MR', W: 'ML', S: 'BM' } },
  TM: { label: 'บ้านคุณยายเต่า',  region: 'green-meadow', connects: { N: null, E: 'TR', W: 'TL', S: 'MC' } },
  TL: { label: 'ทุ่งดอกไม้',      region: 'green-meadow', connects: { N: null, E: 'TM', W: null, S: 'ML' } },
  TR: { label: 'ทางเข้าป่า',      region: 'green-meadow', connects: { N: null, E: null, W: 'TM', S: 'MR' } },
  ML: { label: 'ข้ามแม่น้ำ',      region: 'green-meadow', connects: { N: 'TL', E: 'MC', W: null, S: 'BL' } },
  MR: { label: 'เนินโคลเวอร์',    region: 'green-meadow', connects: { N: 'TR', E: null, W: 'MC', S: 'BR' } },
  BL: { label: 'สระน้ำต้นหลิว',   region: 'green-meadow', connects: { N: 'ML', E: 'BM', W: null, S: null } },
  BR: { label: 'ทุ่งกษัตริย์แบร์', region: 'green-meadow', connects: { N: 'MR', E: null, W: 'BM', S: null } },
}

// ─── Dynamic world level system ───────────────────────────────────────────────

// 5-tier world progression (2026-07-04). Each tier has a genuinely distinct
// RO-style visual theme, wired into the renderer via the `theme` key (consumed
// by setWorldTheme() in tileEngine.js). Ordering is an elevation/difficulty
// climb: meadow → shore → forest → snow peak → sky. See CHANGELOG for the
// scope note on retiring the old "Crystal Cave / cave" tier in favour of the
// fully-specified beach/snow/sky themes.
export const WORLD_LEVELS = [
  {
    level: 0,
    name: 'Green Meadow',
    nameTH: 'ทุ่งหญ้าเขียว',
    theme: 'grassland',
    bgColors: { sky: '#4ec8f0', ground: '#5acc5a', mountain: '#a8d4a8' },
    enemies: ['sleepy_bunny', 'bouncy_slime', 'leaf_sprite', 'mushroom_imp'],
    bossEnemy: 'grumpy_mole',
    bossNameTH: 'โมลราชา',
    bossHP: 120, bossATK: 8, bossDEF: 4,
    unlockRequirement: null,
  },
  {
    level: 1,
    name: 'Coral Coast',
    nameTH: 'ชายหาดปะการัง',
    theme: 'beach',
    bgColors: { sky: '#7fd4f0', ground: '#e6cf98', mountain: '#f0e0b0' },
    enemies: ['sleepy_bunny', 'bouncy_slime', 'leaf_sprite', 'fox_kit'],
    bossEnemy: 'bouncy_slime',
    bossNameTH: 'ราชาวุ้นทะเล',
    bossHP: 150, bossATK: 9, bossDEF: 5,
    unlockRequirement: { battleWins: 20 },
  },
  {
    level: 2,
    name: 'Dark Forest',
    nameTH: 'ป่ามืด',
    theme: 'forest',
    bgColors: { sky: '#1a2a1a', ground: '#2a4a24', mountain: '#16301a' },
    enemies: ['fox_kit', 'baby_zombie', 'grumpy_mole', 'egg_pawn'],
    bossEnemy: 'snake',
    bossNameTH: 'งูราชา',
    bossHP: 180, bossATK: 11, bossDEF: 6,
    unlockRequirement: { battleWins: 40 },
  },
  {
    level: 3,
    name: 'Frost Peak',
    nameTH: 'ยอดเขาน้ำแข็ง',
    theme: 'snow',
    bgColors: { sky: '#bfe0f0', ground: '#e6eef6', mountain: '#c8d8e8' },
    enemies: ['baby_zombie', 'snake', 'grumpy_mole', 'mushroom_imp'],
    bossEnemy: 'fox_kit',
    bossNameTH: 'ราชาจิ้งจอกหิมะ',
    bossHP: 220, bossATK: 13, bossDEF: 7,
    unlockRequirement: { battleWins: 70 },
  },
  {
    level: 4,
    name: 'Sky Kingdom',
    nameTH: 'อาณาจักรเมฆา',
    theme: 'sky',
    bgColors: { sky: '#9fd0ff', ground: '#dcecff', mountain: '#cfe4ff' },
    enemies: ['egg_pawn', 'snake', 'baby_zombie', 'grumpy_mole'],
    bossEnemy: 'egg_pawn',
    bossNameTH: 'ราชาหุ่นเวหา',
    bossHP: 260, bossATK: 15, bossDEF: 8,
    unlockRequirement: { battleWins: 110 },
  },
]

// Per-theme identifying emoji — icon-first UI (a pre-reader must recognise the
// current world by icon alone). Used by the HUD world badge + unlock banner.
export const WORLD_THEME_ICON = {
  grassland: '🌿',
  beach: '🌊',
  forest: '🌲',
  snow: '❄️',
  sky: '☁️',
}

// Screen slot IDs for dynamic layout
export const SCREEN_LAYOUT = ['NW', 'NE', 'SW', 'SE']
export const BOSS_SCREEN = 'BOSS'
export const MAZE_SCREEN = 'MAZE'

// Connections for NW/NE/SW/SE/BOSS/MAZE
// Maze routing (NW→S=MAZE, SE→W=MAZE) is applied dynamically in WorldScreen when mazeActive
export const DYNAMIC_SCREENS = {
  NW:   { connects: { N: null,  E: 'NE',  S: 'SW',   W: null   }, label: '' },
  NE:   { connects: { N: null,  E: null,  S: 'SE',   W: 'NW'   }, label: '' },
  SW:   { connects: { N: 'NW', E: 'SE',  S: 'BOSS', W: null   }, label: '' },
  SE:   { connects: { N: 'NE', E: null,  S: 'BOSS', W: 'SW'   }, label: '' },
  BOSS: { connects: { N: 'SW', E: null,  S: null,   W: null   }, label: 'Boss' },
  MAZE: { connects: { N: 'NW', E: 'SE',  S: 'BOSS', W: null   }, label: '???' },
}

// Visual palette per screen for placeholder backgrounds (Phase 1)
export const SCREEN_THEMES = {
  BM: { skyA: '#7EC8E3', skyB: '#C0E8FF', grdA: '#82C47A', grdB: '#5E9E56', icon: '🌿' },
  MC: { skyA: '#89C4E1', skyB: '#BED8EE', grdA: '#6CAF6A', grdB: '#4A8A48', icon: '🏘️' },
  TM: { skyA: '#FFD070', skyB: '#FFE8A0', grdA: '#7CB87A', grdB: '#5A9A5A', icon: '🏡' },
  TL: { skyA: '#87CEEB', skyB: '#D0EAFF', grdA: '#98D088', grdB: '#70B060', icon: '🌸' },
  TR: { skyA: '#5A9A5A', skyB: '#3A7A3A', grdA: '#3A6A3A', grdB: '#284A28', icon: '🌲' },
  ML: { skyA: '#7ABCD4', skyB: '#A8D4E8', grdA: '#4E8A6E', grdB: '#3A6A52', icon: '🌊' },
  MR: { skyA: '#A0D890', skyB: '#C8EAB8', grdA: '#78BC68', grdB: '#58A048', icon: '🍀' },
  BL: { skyA: '#6890C0', skyB: '#90B8D8', grdA: '#3A7A5A', grdB: '#284A3A', icon: '🌿' },
  BR: { skyA: '#F0C840', skyB: '#FFE070', grdA: '#90CC80', grdB: '#68AA58', icon: '👑' },
}
