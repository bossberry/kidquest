import { hash } from './eggAlgorithm.js'

export function getCreatureSeed(egg) {
  const s = egg.eggStats || {}
  return hash((s.name||'') + (s.grade||0)) ^ hash('' + (s.dow||0) + (s.month||1) + (s.day||1) + (s.hour||12))
}

// ─── Element palettes (3–4 variants each) ────────────────────────────────────
const PALETTES = {
  fire: [
    { p:'#E24B4A', l:'#F09977', d:'#C23A30', a:'#EF9F27' },
    { p:'#CC2244', l:'#EE6677', d:'#990022', a:'#FF8833' },
    { p:'#CC3399', l:'#FF77BB', d:'#882266', a:'#FFAA00' },
    { p:'#DD6622', l:'#FFAA55', d:'#992200', a:'#FFDD00' },
  ],
  water: [
    { p:'#378ADD', l:'#85B7EB', d:'#185FA5', a:'#B5D4F4' },
    { p:'#227799', l:'#55BBCC', d:'#114455', a:'#88DDEE' },
    { p:'#3344BB', l:'#7788EE', d:'#112277', a:'#88CCFF' },
  ],
  thunder: [
    { p:'#EF9F27', l:'#FAC775', d:'#BA7517', a:'#FFFFFF' },
    { p:'#CCDD22', l:'#EEFF66', d:'#889900', a:'#FFFFCC' },
    { p:'#DD7700', l:'#FFAA44', d:'#995500', a:'#FFEEAA' },
  ],
  nature: [
    { p:'#639922', l:'#97C459', d:'#3B6D11', a:'#C0DD97' },
    { p:'#44BB66', l:'#88DD99', d:'#226644', a:'#CCFFAA' },
    { p:'#336633', l:'#668855', d:'#114422', a:'#AABB77' },
    { p:'#BB6688', l:'#DDAACC', d:'#884455', a:'#FFDDEE' },
  ],
  shadow: [
    { p:'#534AB7', l:'#7F77DD', d:'#3C3489', a:'#AFA9EC' },
    { p:'#334488', l:'#6677BB', d:'#112255', a:'#AABBDD' },
    { p:'#551166', l:'#8833AA', d:'#330044', a:'#BB77DD' },
  ],
  light: [
    { p:'#EF9F27', l:'#FAC775', d:'#BA7517', a:'#FAEEDA' },
    { p:'#CCCCEE', l:'#EEEEFF', d:'#9999BB', a:'#FFEEDD' },
    { p:'#EE88AA', l:'#FFCCDD', d:'#BB5577', a:'#FFEEFF' },
    { p:'#FF9977', l:'#FFCCAA', d:'#CC6644', a:'#AADDFF' },
  ],
}

const NAMES = {
  fire:    { baby:'ฟุระ',   teen:'เปลวไฟ',  final:'ราชันเพลิง' },
  water:   { baby:'อาควา',  teen:'กระแส',   final:'ไทดัน' },
  thunder: { baby:'ซาปิ',   teen:'สายฟ้า',  final:'โวลเทน' },
  nature:  { baby:'ลีฟู',   teen:'ป่าลึก',  final:'ซิลวาน' },
  shadow:  { baby:'นิกซ์',  teen:'เงามืด',  final:'อัมบรา' },
  light:   { baby:'ลูมิ',   teen:'แสงทอง',  final:'ออโรร่า' },
}

export function getCreatureName(element, evoStage) {
  return NAMES[element]?.[evoStage] ?? 'ลึกลับ'
}

function getElement(stats) {
  const { xpThai=0, xpMath=0, xpEng=0, acc=70, streak=0 } = stats
  if (streak >= 7) return 'shadow'
  if (acc >= 85)   return 'nature'
  const total = (xpThai + xpMath + xpEng) || 1
  const thP = xpThai / total, maP = xpMath / total, enP = xpEng / total
  const mx  = Math.max(thP, maP, enP)
  if (mx < 0.45)  return 'light'
  if (thP === mx) return 'fire'
  if (maP === mx) return 'water'
  return 'thunder'
}

function prng(seed) {
  let s = seed >>> 0
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
}

function makeR(ctx, P, ox, oy) {
  return (x, y, w, h, color, alpha = 1) => {
    if (alpha < 1) { ctx.save(); ctx.globalAlpha = alpha }
    ctx.fillStyle = color
    ctx.fillRect(ox + x * P, oy + y * P, w * P, h * P)
    if (alpha < 1) ctx.restore()
  }
}

// ═══════════════════════════════════════════════════════════════════
// FURRED — quadruped mammal (Bulbasaur/Eevee proportion)
//
// Silhouette cues: WIDE body filling ~10 of 12 columns; FOUR legs in
// two separate pairs with visible belly gap; TRIANGULAR EARS above head.
// The 4-leg stance is the primary visual differentiator from all other types.
// ═══════════════════════════════════════════════════════════════════

function drawFurredBaby(r, c) {
  // Triangular ears — two distinct points above head
  r(3,0,1,1, c.d); r(8,0,1,1, c.d)
  r(2,1,2,2, c.d); r(8,1,2,2, c.d)
  r(3,1,1,2, c.l); r(9,1,1,2, c.l)
  // Head — wide (8 of 12 cols)
  r(2,2,8,3, c.l)
  r(3,3,1,1,'#1A1A2C'); r(7,3,1,1,'#1A1A2C')
  r(5,4,2,1, c.d)
  r(2,4,1,1, c.a, 0.5); r(9,4,1,1, c.a, 0.5)
  // Body — 10 wide (wider than head → quadruped proportion)
  r(1,5,10,3, c.p)
  r(3,6,6,1, c.l, 0.38)
  // Stub tail
  r(10,6,2,1, c.p); r(11,5,1,2, c.d)
  // FOUR LEGS in two pairs with belly gap (belly at x=5-6 stays clear)
  r(1,8,2,3, c.d); r(3,8,2,3, c.d)
  r(7,8,2,3, c.d); r(9,8,2,3, c.d)
  r(1,10,2,1, c.d, 0.65); r(3,10,2,1, c.d, 0.65)
  r(7,10,2,1, c.d, 0.65); r(9,10,2,1, c.d, 0.65)
}

function drawFurredTeen(r, c) {
  // Taller sharper ears
  r(3,0,1,1, c.d); r(8,0,1,1, c.d)
  r(2,0,2,3, c.d); r(8,0,2,3, c.d)
  r(3,0,1,2, c.l); r(9,0,1,2, c.l)
  // Head
  r(2,2,8,3, c.l)
  r(3,3,2,1,'#1A1A2C'); r(7,3,2,1,'#1A1A2C')
  r(5,4,2,1, c.d)
  // Shoulder mane tufts (teen signature feature)
  r(0,5,2,3, c.d, 0.55); r(10,5,2,3, c.d, 0.55)
  // Body — full 12 wide
  r(0,5,12,3, c.p)
  r(2,6,8,1, c.l, 0.32)
  // Bushy tail
  r(10,6,2,2, c.p); r(11,5,1,4, c.d); r(11,4,1,1, c.a)
  // Four legs, slightly thicker
  r(0,8,3,3, c.d); r(3,8,2,3, c.d)
  r(7,8,2,3, c.d); r(9,8,3,3, c.d)
  r(0,10,3,1, c.d, 0.65); r(3,10,2,1, c.d, 0.65)
  r(7,10,2,1, c.d, 0.65); r(9,10,3,1, c.d, 0.65)
}

function drawFurredFinal(r, c) {
  // Full mane — radiates from head (final signature feature)
  r(1,0,10,3, c.d)
  r(2,0,8,2, c.a, 0.42)
  r(0,2,3,5, c.d); r(9,2,3,5, c.d)
  // Ears within mane
  r(3,0,2,2, c.d); r(7,0,2,2, c.d)
  // Head — regal
  r(3,2,6,3, c.l)
  r(3,3,2,1, c.a); r(7,3,2,1, c.a)
  r(5,4,2,1, c.d)
  // Body — massive, full 12 wide
  r(0,5,12,5, c.p)
  r(3,6,6,3, c.d)
  r(4,7,4,1, c.a, 0.4)
  // Long tail
  r(10,7,2,3, c.p); r(11,5,1,5, c.d); r(11,4,1,1, c.a)
  // Four thick legs
  r(0,10,3,2, c.d); r(3,10,2,2, c.d)
  r(7,10,2,2, c.d); r(9,10,3,2, c.d)
  r(0,11,3,1, c.d, 0.7); r(3,11,2,1, c.d, 0.7)
  r(7,11,2,1, c.d, 0.7); r(9,11,3,1, c.d, 0.7)
}

// ═══════════════════════════════════════════════════════════════════
// WINGED — avian / dragon (Charmander→Charizard proportion)
//
// Silhouette cues: NARROW upright body (4 wide vs furred's 10+);
// BIPEDAL (2 legs only); BEAK below head; tail extends to one side.
// Wings evolve: tiny nubs → folded buds → fully spread wingspan.
// Draw order rule: body first, beak drawn AFTER so it sits on top.
// ═══════════════════════════════════════════════════════════════════

function drawWingedBaby(r, c) {
  // Head — narrow, 4 wide (centred at x=4-7)
  r(4,0,4,3, c.l)
  r(4,1,1,1,'#1A1A2C'); r(7,1,1,1,'#1A1A2C')
  // Tiny wing nubs (barely visible — hatchling shoulder bumps)
  r(2,4,2,2, c.d, 0.65); r(8,4,2,2, c.d, 0.65)
  // Body FIRST — NARROW, tall, bipedal (4 wide vs furred's 10+)
  r(4,3,4,7, c.p)
  r(5,4,2,5, c.l, 0.42)
  // Beak drawn AFTER body so it appears on top at head-neck junction
  r(5,3,2,1, c.d)
  r(6,4,1,1, c.d)
  // Simple tail (right of body)
  r(8,7,2,3, c.d); r(9,6,1,4, c.d); r(9,5,1,1, c.a)
  // TWO LEGS ONLY (bipedal — key difference from 4-legged furred)
  r(5,9,1,3, c.d); r(6,9,1,3, c.d)
  r(4,11,1,1,c.d); r(5,11,1,1,c.d); r(6,11,1,1,c.d); r(7,11,1,1,c.d)
}

function drawWingedTeen(r, c) {
  // Small crest starts
  r(5,0,2,1, c.d)
  // Head (same narrow 4 wide)
  r(4,1,4,3, c.l)
  r(4,2,1,1,'#1A1A2C'); r(7,2,1,1,'#1A1A2C')
  // FOLDED WING BUDS — clearly visible, teen signature feature
  r(1,4,3,5, c.d); r(8,4,3,5, c.d)
  r(1,5,2,4, c.a, 0.5); r(9,5,2,4, c.a, 0.5)
  // Body (draw before beak)
  r(4,4,4,6, c.p)
  r(5,5,2,4, c.l, 0.38)
  // Beak drawn AFTER body
  r(5,4,2,1, c.d); r(6,5,1,1, c.d)
  // Longer tail
  r(9,7,3,4, c.d); r(10,6,2,4, c.d); r(11,5,1,5, c.d); r(11,4,1,1, c.a)
  // Two legs
  r(5,10,1,2, c.d); r(6,10,1,2, c.d)
  r(4,11,1,1,c.d); r(5,11,2,1,c.d); r(7,11,2,1,c.d); r(8,11,1,1,c.d)
}

function drawWingedFinal(r, c) {
  // Head crest
  r(5,0,3,1, c.d); r(6,0,1,2, c.a)
  // Head (narrow, centred)
  r(4,1,4,3, c.l)
  r(4,2,2,1, c.a); r(8,2,1,1, c.a)
  // WINGS FULLY SPREAD — spans full canvas width (final signature)
  r(0,2,4,7, c.d); r(8,2,4,7, c.d)
  r(0,3,3,6, c.a, 0.48)
  r(9,3,3,6, c.a, 0.48)
  r(0,2,1,1, c.a); r(11,2,1,1, c.a)
  // Body between wings (draw after wings)
  r(4,4,4,6, c.p)
  r(5,5,2,4, c.l, 0.35)
  // Beak drawn AFTER body+wings
  r(5,4,2,1, c.d); r(5,5,2,1, c.a)
  // Long dramatic tail
  r(8,8,4,4, c.d); r(9,7,3,4, c.d); r(10,5,2,6, c.d); r(11,4,1,7, c.a)
  // Two legs
  r(5,10,1,2, c.d); r(6,10,1,2, c.d)
  r(4,11,1,1,c.d); r(5,11,2,1,c.d); r(7,11,2,1,c.d); r(8,11,1,1,c.d)
}

// ═══════════════════════════════════════════════════════════════════
// SCALED — compact reptile (Squirtle proportion)
//
// Silhouette cues: ROUND compact body; DORSAL RIDGE (not triangular
// ears); SLIT EYES (not round); ARM STUBS on body sides + only 2
// bottom legs; visible tail from the very first stage.
// ═══════════════════════════════════════════════════════════════════

function drawScaledBaby(r, c) {
  // Dorsal ridge — NOT ears. This is the #1 visual cue vs furred.
  r(4,0,4,2, c.a)
  r(3,1,6,1, c.d, 0.5)
  // Head (similar width but no ear bumps = different silhouette)
  r(2,2,8,3, c.l)
  // SLIT EYES — vertical pupils, distinguishes from furred/winged
  r(3,3,2,1, c.l); r(7,3,2,1, c.l)
  r(4,3,1,1,'#1A1A2C'); r(8,3,1,1,'#1A1A2C')
  r(5,4,2,1, c.d)
  // Body — round and compact
  r(1,5,10,3, c.p)
  r(3,6,6,1, c.l, 0.28)
  // ARM STUBS on body sides (not bottom legs — Squirtle-style)
  r(0,5,1,3, c.d); r(11,5,1,3, c.d)
  // Scale texture
  r(3,5,1,1,c.d,0.42); r(6,5,1,1,c.d,0.42); r(9,5,1,1,c.d,0.42)
  // Short tail (visible from baby)
  r(10,6,2,2, c.p); r(11,5,1,3, c.d); r(11,4,1,1, c.a)
  // TWO short bottom legs (shorter+fewer than furred's four legs)
  r(2,8,3,2, c.d); r(7,8,3,2, c.d)
  r(2,9,3,1, c.d, 0.6); r(7,9,3,1, c.d, 0.6)
}

function drawScaledTeen(r, c) {
  // Frills grow onto SIDES of head (teen signature feature)
  r(0,2,2,3, c.a); r(10,2,2,3, c.a)
  r(0,2,1,3, c.d); r(11,2,1,3, c.d)
  // Head
  r(2,2,8,3, c.l)
  r(3,3,2,1, c.l); r(7,3,2,1, c.l)
  r(4,3,1,1,'#1A1A2C'); r(8,3,1,1,'#1A1A2C')
  r(5,4,2,1, c.d)
  // Body
  r(1,5,10,4, c.p)
  r(3,6,6,2, c.l, 0.25)
  // Arm stubs (larger)
  r(0,5,1,4, c.d); r(11,5,1,4, c.d)
  // Scale rows (more prominent)
  r(2,5,2,1,c.d,0.42); r(5,5,2,1,c.d,0.42); r(8,5,2,1,c.d,0.42)
  r(3,7,2,1,c.d,0.38); r(6,7,2,1,c.d,0.38); r(9,7,2,1,c.d,0.38)
  // Longer tail
  r(10,7,2,3, c.p); r(11,6,1,4, c.d); r(11,5,1,1, c.a)
  // Two short legs
  r(2,9,3,2, c.d); r(7,9,3,2, c.d)
  r(2,10,3,1, c.d, 0.6); r(7,10,3,1, c.d, 0.6)
}

function drawScaledFinal(r, c) {
  // LARGE DRAMATIC FRILLS — final signature (much bigger than teen)
  r(0,0,3,5, c.a); r(9,0,3,5, c.a)
  r(0,0,2,4, c.d, 0.62); r(10,0,2,4, c.d, 0.62)
  // Head
  r(3,1,6,4, c.l)
  r(3,2,2,1, c.a); r(7,2,2,1, c.a)
  r(4,4,4,1, c.d)
  // Armored body
  r(2,4,8,6, c.p)
  r(4,5,4,4, c.d)
  r(5,6,2,2, c.a, 0.38)
  // Scale armor rows
  r(2,4,2,1,c.d); r(5,4,2,1,c.d); r(8,4,2,1,c.d)
  r(3,6,2,1,c.d); r(6,6,2,1,c.d); r(9,6,2,1,c.d)
  r(2,8,2,1,c.d); r(5,8,2,1,c.d); r(8,8,2,1,c.d)
  // Long serrated tail
  r(10,7,2,4, c.d); r(11,6,1,5, c.a); r(11,5,1,1, c.d)
  r(11,7,1,1, c.d, 0.5); r(11,9,1,1, c.d, 0.5)
  // TWO powerful legs (not four — dragon vs furred)
  r(2,10,3,2, c.d); r(7,10,3,2, c.d)
  r(1,11,2,1,c.d); r(3,11,2,1,c.d)
  r(7,11,2,1,c.d); r(9,11,2,1,c.d)
  // Forked tongue drawn LAST (over chest armor so it is visible)
  r(5,5,1,2, c.a); r(6,5,1,2, c.a)
}

// ═══════════════════════════════════════════════════════════════════
// CHITIN — insect (3-segment stacking body)
//
// Silhouette cues: THREE STACKED SEGMENTS at all stages (head=small,
// thorax=medium, abdomen=LARGEST at bottom). ANTENNAE (thin vertical
// lines, never round ears). LEGS ONLY from thorax, never head/abdomen.
// This stacked proportion is unique — no other type has it.
// ═══════════════════════════════════════════════════════════════════

function drawChitinBaby(r, c) {
  // Antennae — thin lines pointing up (NOT triangular ears)
  r(4,0,1,3, c.d); r(7,0,1,3, c.d)
  r(3,0,2,1, c.a); r(7,0,2,1, c.a)
  // SEGMENT 1: HEAD — smallest, 4 wide (y=2-3)
  r(4,2,4,2, c.l)
  // Compound eyes bulge slightly beyond head
  r(3,3,2,1, c.a); r(7,3,2,1, c.a)
  r(3,3,1,1,'#1A1A2C'); r(8,3,1,1,'#1A1A2C')
  // SEGMENT 2: THORAX — medium, 6 wide (y=4-6)
  r(3,4,6,3, c.p)
  r(4,4,1,1, c.d); r(7,4,1,1, c.d)           // mandibles below head
  // 4 legs from thorax ONLY
  r(1,4,2,1, c.d); r(9,4,2,1, c.d)
  r(0,5,3,1, c.d); r(9,5,3,1, c.d)
  r(0,5,1,2, c.d); r(11,5,1,2, c.d)
  // SEGMENT 3: ABDOMEN — LARGEST, 8 wide (y=7-10)
  r(2,7,8,4, c.d)
  r(3,7,6,4, c.p, 0.62)
  r(2,9,8,1, c.a, 0.42)
  r(3,7,6,1, c.l, 0.38)
}

function drawChitinTeen(r, c) {
  // Longer antennae
  r(4,0,1,4, c.d); r(7,0,1,4, c.d)
  r(3,0,2,1, c.a); r(7,0,2,1, c.a)
  r(3,1,1,1, c.d); r(8,1,1,1, c.d)
  // SEGMENT 1: HEAD (y=3-4)
  r(3,3,6,2, c.l)
  r(3,4,2,1, c.a); r(7,4,2,1, c.a)
  r(3,4,1,1,'#1A1A2C'); r(8,4,1,1,'#1A1A2C')
  // SEGMENT 2: THORAX — wider now, 8 wide (y=5-7)
  r(2,5,8,3, c.p)
  r(4,5,1,1, c.d); r(7,5,1,1, c.d)           // mandibles
  // WING BUDS — teen signature feature
  r(0,5,2,2, c.a, 0.65); r(10,5,2,2, c.a, 0.65)
  // 6 LEGS (more than baby's 4)
  r(0,5,2,1, c.d); r(10,5,2,1, c.d)
  r(0,6,2,1, c.d); r(10,6,2,1, c.d)
  r(1,7,2,1, c.d); r(9,7,2,1, c.d)
  // Joint
  r(2,7,8,1, c.l, 0.35)
  // SEGMENT 3: ABDOMEN — larger and longer (y=8-11)
  r(2,8,8,4, c.d)
  r(3,8,6,4, c.p, 0.62)
  r(2,10,8,1, c.a, 0.45)
  r(3,8,6,1, c.l, 0.35)
}

function drawChitinFinal(r, c) {
  // Dramatic antennae
  r(3,0,1,3, c.d); r(8,0,1,3, c.d)
  r(2,0,3,1, c.a); r(8,0,3,1, c.a)
  r(2,1,2,1, c.d); r(8,1,2,1, c.d)
  // SEGMENT 1: HEAD (y=2-4)
  r(3,2,6,3, c.l)
  r(3,3,2,2, c.a); r(7,3,2,2, c.a)           // massive 2×2 compound eyes
  r(3,3,1,1,'#1A1A2C'); r(8,3,1,1,'#1A1A2C')
  // SEGMENT 2: THORAX (y=5-7)
  r(2,5,8,3, c.p)
  // WINGS FULLY SPREAD — final signature, spans full canvas
  r(0,4,2,5, c.a, 0.5); r(10,4,2,5, c.a, 0.5)
  r(0,5,1,4, c.d, 0.28); r(11,5,1,4, c.d, 0.28)
  // LARGE PINCERS drawn AFTER wings (appear on top)
  r(1,4,3,2, c.d); r(8,4,3,2, c.d)
  r(1,5,2,1, c.a); r(9,5,2,1, c.a)
  r(4,5,1,1, c.d); r(7,5,1,1, c.d)           // mandibles
  // 6 legs
  r(0,5,2,1, c.d); r(10,5,2,1, c.d)
  r(0,6,2,1, c.d); r(10,6,2,1, c.d)
  r(1,7,2,1, c.d); r(9,7,2,1, c.d)
  // Joint
  r(2,7,8,1, c.l, 0.38)
  // SEGMENT 3: ABDOMEN — largest, prominent rings (y=8-11)
  r(2,8,8,4, c.d)
  r(3,8,6,4, c.p, 0.65)
  r(2,9,8,1, c.a, 0.5)
  r(2,11,8,1, c.a, 0.35)
  r(3,8,6,1, c.l, 0.4)
}

// ─── Pattern overlays ─────────────────────────────────────────────────────────
function drawSpots(r, bodyType, stage, c) {
  const a = 0.42
  if (bodyType === 'furred') {
    if (stage === 'baby')  { r(4,6,1,1,c.d,a); r(7,6,1,1,c.d,a); r(5,7,1,1,c.d,a) }
    if (stage === 'teen')  { r(3,6,1,1,c.d,a); r(6,6,1,1,c.d,a); r(8,6,1,1,c.d,a); r(5,7,1,1,c.d,a) }
    if (stage === 'final') { r(3,6,1,1,c.d,a); r(6,6,1,1,c.d,a); r(9,6,1,1,c.d,a); r(4,8,1,1,c.d,a); r(8,8,1,1,c.d,a) }
  } else if (bodyType === 'winged') {
    if (stage === 'baby')  { r(5,5,1,1,c.d,a); r(6,6,1,1,c.d,a) }
    if (stage === 'teen')  { r(5,5,1,1,c.d,a); r(6,6,1,1,c.d,a); r(5,7,1,1,c.d,a) }
    if (stage === 'final') { r(5,5,1,1,c.d,a); r(6,6,1,1,c.d,a); r(5,7,1,1,c.d,a); r(6,8,1,1,c.d,a) }
  } else if (bodyType === 'scaled') {
    if (stage === 'baby')  { r(4,6,1,1,c.a,a); r(7,6,1,1,c.a,a) }
    if (stage === 'teen')  { r(4,6,1,1,c.a,a); r(7,6,1,1,c.a,a); r(5,8,1,1,c.a,a) }
    if (stage === 'final') { r(5,6,1,1,c.a,a); r(7,6,1,1,c.a,a); r(5,8,1,1,c.a,a); r(7,8,1,1,c.a,a) }
  } else {
    if (stage === 'baby')  { r(5,8,1,1,c.a,a); r(7,9,1,1,c.a,a) }
    if (stage === 'teen')  { r(5,9,1,1,c.a,a); r(7,9,1,1,c.a,a); r(6,10,1,1,c.a,a) }
    if (stage === 'final') { r(5,9,1,1,c.a,a); r(7,9,1,1,c.a,a); r(6,10,1,1,c.a,a); r(4,10,1,1,c.a,a) }
  }
}

function drawStripes(r, bodyType, stage, c) {
  if (bodyType === 'chitin') {
    if (stage === 'baby')  { r(3,8,6,1,c.a,0.42) }
    if (stage === 'teen')  { r(3,9,6,1,c.a,0.42); r(3,11,6,1,c.a,0.3) }
    if (stage === 'final') { r(3,9,6,1,c.a,0.45); r(3,11,6,1,c.a,0.35) }
  } else if (bodyType === 'winged') {
    if (stage === 'baby')  { r(4,5,4,1,c.d,0.28); r(4,7,4,1,c.d,0.28) }
    if (stage === 'teen')  { r(4,5,4,1,c.d,0.28); r(4,7,4,1,c.d,0.28); r(4,9,4,1,c.d,0.28) }
    if (stage === 'final') { r(4,5,4,1,c.d,0.28); r(4,7,4,1,c.d,0.28); r(4,8,4,1,c.d,0.28) }
  } else {
    if (stage === 'baby')  { r(2,6,8,1,c.d,0.26); r(2,8,8,1,c.d,0.26) }
    if (stage === 'teen')  { r(1,6,10,1,c.d,0.26); r(1,8,10,1,c.d,0.26) }
    if (stage === 'final') { r(1,6,10,1,c.d,0.26); r(1,8,10,1,c.d,0.26); r(1,10,10,1,c.d,0.26) }
  }
}

// ─── Main export — 12×12 grid for ALL stages ─────────────────────────────────
export function drawCreature(canvas, seed, stats) {
  const W = canvas.width, H = canvas.height
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)

  const S     = stats || {}
  const el    = getElement(S)
  const stage = S.evoStage ?? 'baby'

  const rng      = prng(seed)
  const palettes = PALETTES[el] || PALETTES.light
  const c        = palettes[Math.floor(rng() * palettes.length)]
  const BODY_TYPES = ['furred', 'winged', 'scaled', 'chitin']
  const bodyType   = BODY_TYPES[Math.floor(rng() * 4)]
  const PATTERNS   = ['none', 'none', 'spots', 'stripes']
  const pattern    = PATTERNS[Math.floor(rng() * 4)]

  // 12×12 for all stages — proportion/silhouette does the work, not pixel count
  const P  = Math.floor(Math.min(W, H) / 12)
  const ox = Math.floor((W - P * 12) / 2)
  const oy = Math.floor((H - P * 12) / 2)
  const r  = makeR(ctx, P, ox, oy)

  if (bodyType === 'furred') {
    if (stage === 'final') drawFurredFinal(r, c)
    else if (stage === 'teen') drawFurredTeen(r, c)
    else drawFurredBaby(r, c)
  } else if (bodyType === 'winged') {
    if (stage === 'final') drawWingedFinal(r, c)
    else if (stage === 'teen') drawWingedTeen(r, c)
    else drawWingedBaby(r, c)
  } else if (bodyType === 'scaled') {
    if (stage === 'final') drawScaledFinal(r, c)
    else if (stage === 'teen') drawScaledTeen(r, c)
    else drawScaledBaby(r, c)
  } else {
    if (stage === 'final') drawChitinFinal(r, c)
    else if (stage === 'teen') drawChitinTeen(r, c)
    else drawChitinBaby(r, c)
  }

  if (pattern === 'spots') drawSpots(r, bodyType, stage, c)
  else if (pattern === 'stripes') drawStripes(r, bodyType, stage, c)
}
