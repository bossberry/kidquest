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
// FURRED — quadruped mammal
// Silhouette cues: TRIANGULAR ears pointing up, WIDE body, 4 VISIBLE
// legs in two pairs (inner front + outer back), curling tail.
// ═══════════════════════════════════════════════════════════════════
function drawFurredBaby(r, c) {
  // Pointy triangular ears (NOT round bumps)
  r(3,0,1,1, c.d); r(8,0,1,1, c.d)           // ear tips
  r(2,1,2,2, c.d); r(8,1,2,2, c.d)           // ear body
  r(3,1,1,2, c.l); r(9,1,1,2, c.l)           // inner ear
  // Head
  r(2,2,8,3, c.l)
  r(3,3,1,1,'#1A1A2C'); r(7,3,1,1,'#1A1A2C') // eyes
  r(5,4,2,1, c.d)                              // nose
  r(2,4,1,1, c.a, 0.55); r(9,4,1,1, c.a, 0.55) // cheeks
  // Body — wider than head, quadruped proportion
  r(1,5,10,4, c.p)
  r(3,6,6,2, c.l, 0.38)                        // belly
  // Tail — fluffy curl (right side)
  r(10,5,2,2, c.p); r(11,4,1,3, c.d); r(11,3,1,1, c.a)
  // 4 LEGS — two pairs with belly gap between
  r(1,9,2,3, c.d)   // outer-left (back)
  r(3,9,2,3, c.d)   // inner-left (front)
  r(7,9,2,3, c.d)   // inner-right (front)
  r(9,9,2,3, c.d)   // outer-right (back)
  // Paw pads
  r(1,11,2,1, c.d, 0.65); r(3,11,2,1, c.d, 0.65)
  r(7,11,2,1, c.d, 0.65); r(9,11,2,1, c.d, 0.65)
}

function drawFurredTeen(r, c) {
  // Sharper, taller ears
  r(3,0,1,1, c.d); r(8,0,1,1, c.d)
  r(2,0,2,3, c.d); r(8,0,2,3, c.d)
  r(3,0,1,2, c.l); r(9,0,1,2, c.l)
  // Head
  r(2,2,8,3, c.l)
  r(3,3,2,1,'#1A1A2C'); r(7,3,2,1,'#1A1A2C')
  r(5,4,2,1, c.d)
  // Body (wider, more muscular)
  r(0,5,12,5, c.p)
  r(2,6,8,3, c.l, 0.32)
  // Shoulder mane tufts
  r(0,5,2,3, c.d, 0.5); r(10,5,2,3, c.d, 0.5)
  // Tail
  r(10,6,2,3, c.p); r(11,5,1,4, c.d); r(11,4,1,2, c.a)
  // 4 LEGS
  r(1,10,2,2, c.d); r(3,10,2,2, c.d)
  r(7,10,2,2, c.d); r(9,10,2,2, c.d)
  r(1,11,2,1, c.d, 0.6); r(3,11,2,1, c.d, 0.6)
  r(7,11,2,1, c.d, 0.6); r(9,11,2,1, c.d, 0.6)
}

// FURRED FINAL uses 16×16 grid — lion/wolf king with mane
function drawFurredFinal(r, c) {
  // Mane radiating from head center
  r(0,1,16,3, c.d)                              // mane band top
  r(0,0,16,1, c.a, 0.45)                        // mane shimmer
  r(0,1,3,6, c.d); r(13,1,3,6, c.d)            // mane sides draping
  r(1,1,2,5, c.p, 0.4); r(13,1,2,5, c.p, 0.4) // mane depth
  // Head (within mane)
  r(5,2,6,5, c.l)
  r(6,4,2,1, c.a); r(10,4,2,1, c.a)            // glowing eyes
  r(8,6,2,1, c.d)                               // nose
  // Crown jewel
  r(8,1,2,2, c.a, 0.8)
  // Body — massive, barrel-chested
  r(2,7,12,7, c.p)
  r(5,8,6,5, c.d)                               // chest plate
  r(6,9,4,3, c.a, 0.35)                         // chest gem
  // 4 THICK LEGS — unmistakably quadruped
  r(2,14,3,2, c.d)    // back-left
  r(5,14,3,2, c.d)    // front-left
  r(8,14,3,2, c.d)    // front-right
  r(11,14,3,2, c.d)   // back-right
  // Massive paws
  r(1,15,4,1, c.d); r(5,15,3,1, c.d)
  r(8,15,3,1, c.d); r(11,15,4,1, c.d)
  // Long flowing tail
  r(13,9,3,4, c.p); r(14,7,2,5, c.d); r(15,5,1,5, c.a)
  r(15,4,1,1, c.a, 0.7)
}

// ═══════════════════════════════════════════════════════════════════
// WINGED — avian / dragon
// Silhouette cues: WINGS are the WIDEST part and dominate the canvas.
// Narrow body/torso. BEAK (not round nose). 2 talon feet (not paws).
// FAN-shaped tail feathers (not fluffy curl).
// ═══════════════════════════════════════════════════════════════════
function drawWingedBaby(r, c) {
  // Head — small, at top center
  r(4,0,4,3, c.l)
  r(4,1,1,1,'#1A1A2C'); r(7,1,1,1,'#1A1A2C')  // eyes
  // Beak (triangular, below head)
  r(5,3,2,1, c.d); r(5,4,1,1, c.d)             // upper + lower beak tip
  // WINGS — dominant horizontal spread
  r(0,2,4,3, c.d); r(8,2,3,3, c.d)            // wing body dark
  r(0,3,3,2, c.a, 0.5); r(9,3,3,2, c.a, 0.5) // inner wing lighter
  r(0,2,1,1, c.a); r(11,2,1,1, c.a)           // wingtips
  // Narrow body (NOT wide like furred)
  r(4,3,4,5, c.p)
  r(5,4,2,3, c.l, 0.42)                        // breast
  // TAIL FEATHERS — fan shape (not round curl)
  r(4,8,4,1, c.d)                               // tail bar
  r(3,9,1,3, c.a); r(5,9,1,3, c.a); r(7,9,1,3, c.a)  // individual feathers
  r(4,8,1,1, c.l, 0.4); r(6,8,1,1, c.l, 0.4)
  // 2 TALON LEGS (not 4 paw legs)
  r(5,10,1,2, c.d); r(6,10,1,2, c.d)
  r(4,11,1,1, c.d); r(5,11,1,1, c.d); r(6,11,1,1, c.d); r(7,11,1,1, c.d) // talons spread
}

function drawWingedTeen(r, c) {
  // Head
  r(4,0,4,3, c.l)
  r(4,1,2,1,'#1A1A2C'); r(7,1,1,1,'#1A1A2C')
  // Head crest
  r(5,0,3,1, c.d)
  // Longer beak
  r(5,3,2,1, c.d); r(4,4,3,1, c.d); r(4,5,2,1, c.a)
  // LARGER WINGS — extend to canvas edges
  r(0,1,4,5, c.d); r(8,1,4,5, c.d)             // wing body
  r(0,2,3,4, c.a, 0.5); r(9,2,3,4, c.a, 0.5)  // wing inner
  r(0,1,1,1, c.a); r(11,1,1,1, c.a)            // wingtips
  // Wing feather detail
  r(1,1,1,1, c.l, 0.4); r(10,1,1,1, c.l, 0.4)
  // Narrow body
  r(4,3,4,6, c.p)
  r(5,4,2,4, c.l, 0.38)
  // TAIL FAN (larger)
  r(3,9,6,1, c.d)
  r(3,10,1,2, c.a); r(5,10,1,2, c.a); r(7,10,1,2, c.a)
  r(4,10,1,2, c.d, 0.4); r(6,10,1,2, c.d, 0.4)
  // 2 talon legs
  r(5,11,1,1, c.d); r(6,11,1,1, c.d)
  r(4,11,1,1, c.d); r(7,11,1,1, c.d)
}

// WINGED FINAL uses 16×16 — phoenix/storm dragon, wings span full width
function drawWingedFinal(r, c) {
  // Head crest / crown
  r(6,0,4,1, c.a)
  r(7,0,2,2, c.d)
  // Head (narrow)
  r(6,1,4,4, c.l)
  r(6,3,2,1, c.a); r(10,3,2,1, c.a)            // glowing eyes
  // Long beak
  r(7,5,2,1, c.d); r(7,6,3,1, c.d); r(7,7,2,1, c.a)
  // MASSIVE WINGS — full canvas width
  r(0,3,6,7, c.d)                               // left wing
  r(10,3,6,7, c.d)                              // right wing
  r(0,4,5,6, c.a, 0.5)                          // left wing glow
  r(11,4,5,6, c.a, 0.5)                         // right wing glow
  r(0,3,1,1, c.a); r(15,3,1,1, c.a)            // wingtip gems
  // Wing feather lines
  r(1,3,1,6, c.l, 0.3); r(14,3,1,6, c.l, 0.3)
  r(2,4,1,5, c.l, 0.2); r(13,4,1,5, c.l, 0.2)
  // Narrow body
  r(6,4,4,8, c.p)
  r(7,5,2,6, c.l, 0.38)
  // TAIL FEATHERS (dramatic fan)
  r(3,12,10,1, c.d)                             // tail bar
  r(2,13,2,3, c.a); r(5,13,2,3, c.a); r(8,13,2,3, c.a); r(11,13,2,3, c.a)
  r(3,12,1,1, c.l, 0.5); r(6,12,1,1, c.l, 0.5)
  r(9,12,1,1, c.l, 0.5); r(12,12,1,1, c.l, 0.5)
  // 2 talon legs
  r(7,12,1,2, c.d); r(8,12,1,2, c.d)
  r(5,13,1,1, c.d); r(6,13,2,1, c.d); r(8,13,2,1, c.d); r(10,13,1,1, c.d)
}

// ═══════════════════════════════════════════════════════════════════
// SCALED — reptile / serpent
// Silhouette cues: HORIZONTAL layout (baby/teen) — head on LEFT,
// tail on RIGHT, body spans across. Frills (not ears), slit eyes,
// forked tongue, tiny/no legs. Final stage stands upright as dragon.
// ═══════════════════════════════════════════════════════════════════
function drawScaledBaby(r, c) {
  // HORIZONTAL creature — head LEFT, tail RIGHT
  // Frills on left edge (vertical fins, not round ears)
  r(0,2,2,2, c.a); r(0,5,2,2, c.a)
  r(0,2,1,2, c.d); r(0,5,1,2, c.d)
  // Head (x=2-4, y=3-6)
  r(2,3,3,4, c.l)
  // Slit eye (NOT round mammal eye)
  r(3,4,2,1, c.l)                               // eye white
  r(4,4,1,1,'#1A1A2C')                          // vertical slit
  // Forked tongue sticking LEFT out of mouth
  r(1,6,2,1, c.a)                               // tongue base
  r(1,7,1,1, c.a); r(2,7,1,1, c.a)             // forked tips
  // Body stretches to the RIGHT (x=5-9, y=3-6)
  r(5,3,5,4, c.p)
  r(5,5,5,2, c.l, 0.25)                         // belly (lighter underneath)
  // Scale dots along back
  r(5,3,1,1, c.d, 0.5); r(7,3,1,1, c.d, 0.5); r(9,3,1,1, c.d, 0.5)
  r(6,4,1,1, c.d, 0.45); r(8,4,1,1, c.d, 0.45)
  // Tiny legs (barely visible)
  r(6,7,1,1, c.d); r(8,7,1,1, c.d)
  // Tail curves UP at right (x=9-11, y=1-4)
  r(9,3,2,2, c.p)
  r(10,2,2,2, c.d)
  r(11,1,1,2, c.a)
}

function drawScaledTeen(r, c) {
  // HORIZONTAL — bigger version
  // Frills (taller)
  r(0,1,2,3, c.a); r(0,5,2,3, c.a)
  r(0,1,1,3, c.d); r(0,5,1,3, c.d)
  // Head crest spines
  r(3,1,1,2, c.a); r(4,1,1,2, c.a)
  // Head (x=2-5, y=2-7)
  r(2,2,4,5, c.l)
  // Slit eye
  r(3,4,2,1, c.l)
  r(4,4,1,1,'#1A1A2C')
  // Forked tongue
  r(1,6,2,1, c.a); r(0,7,1,1, c.a); r(2,7,1,1, c.a)
  // Body (x=5-10, y=3-7)
  r(5,3,6,5, c.p)
  r(6,5,5,3, c.l, 0.22)                         // belly
  // Scale rows
  r(5,3,2,1, c.d, 0.45); r(8,3,2,1, c.d, 0.45)
  r(6,5,2,1, c.d, 0.4); r(9,5,2,1, c.d, 0.4)
  // Stubby legs
  r(6,8,2,2, c.d); r(9,8,2,2, c.d)
  // Tail curls up (x=10-11, y=1-5)
  r(10,3,2,3, c.p)
  r(11,1,1,4, c.d)
  r(11,0,1,2, c.a)
}

// SCALED FINAL uses 16×16 — standing serpent dragon
function drawScaledFinal(r, c) {
  // Large dramatic frills flanking head
  r(0,0,4,6, c.a)                               // left frill
  r(12,0,4,6, c.a)                              // right frill
  r(0,0,3,5, c.d, 0.65); r(13,0,3,5, c.d, 0.65) // frill shadow
  // Neck / long head
  r(5,0,6,6, c.l)
  // Horns
  r(6,0,1,2, c.d); r(9,0,1,2, c.d)
  // Slit eyes (large, menacing)
  r(5,3,3,1, c.l); r(8,3,3,1, c.l)             // eye whites
  r(7,3,1,1,'#1A1A2C'); r(10,3,1,1,'#1A1A2C')  // pupils
  // Long forked tongue
  r(7,6,2,3, c.a)                               // tongue base
  r(6,8,2,1, c.a); r(9,8,2,1, c.a)             // fork
  // Body (armored, wide)
  r(3,5,10,8, c.p)
  // Armor scale rows
  r(4,6,2,1,c.d); r(7,6,2,1,c.d); r(10,6,2,1,c.d)
  r(5,8,2,1,c.d); r(8,8,2,1,c.d); r(11,8,2,1,c.d)
  r(4,10,2,1,c.d); r(7,10,2,1,c.d); r(10,10,2,1,c.d)
  r(5,12,2,1,c.d); r(8,12,2,1,c.d)
  // Belly (lighter)
  r(6,6,4,7, c.l, 0.22)
  // 2 powerful legs (dragon, not 4)
  r(3,12,4,4, c.d); r(9,12,4,4, c.d)
  // Clawed feet
  r(2,15,3,1, c.d); r(4,15,3,1, c.d)
  r(9,15,3,1, c.d); r(11,15,3,1, c.d)
  // Long serrated tail curling right
  r(12,10,4,4, c.p)
  r(13,7,3,5, c.d)
  r(14,5,2,4, c.a)
  r(15,4,1,5, c.d)
  r(15,5,1,1, c.a); r(15,7,1,1, c.a); r(15,9,1,1, c.a) // serrations
}

// ═══════════════════════════════════════════════════════════════════
// CHITIN — insect
// Silhouette cues: 3 DISTINCT SEGMENTS (head/thorax/abdomen, stacked).
// Thin antennae (not ears). Multiple thin legs radiating from thorax.
// Abdomen is LARGEST segment at bottom (insect proportion).
// ═══════════════════════════════════════════════════════════════════
function drawChitinBaby(r, c) {
  // Antennae — thin lines going UP (not triangular ears)
  r(4,0,1,3, c.d); r(7,0,1,3, c.d)
  r(3,0,2,1, c.a); r(7,0,2,1, c.a)             // knob tips
  // SEGMENT 1 — HEAD (small, 4 wide)
  r(4,2,4,2, c.l)
  // Compound eyes (large, colored, bulge outward from head)
  r(3,3,2,1, c.a); r(7,3,2,1, c.a)
  r(3,3,1,1,'#1A1A2C'); r(8,3,1,1,'#1A1A2C')
  // Mandibles
  r(4,4,1,1, c.d); r(7,4,1,1, c.d)
  // SEGMENT 2 — THORAX (medium, 6 wide)
  r(3,4,6,3, c.p)
  // Legs (2 pairs, thin, radiating from thorax sides)
  r(1,4,2,1, c.d); r(9,4,2,1, c.d)             // front legs horizontal
  r(0,5,3,1, c.d); r(9,5,3,1, c.d)             // back legs angled down
  r(0,5,1,2, c.d); r(11,5,1,2, c.d)            // leg ends going down
  // Mandibles drawn AFTER thorax (on top)
  r(4,4,1,1, c.d); r(7,4,1,1, c.d)
  // SEGMENT 3 — ABDOMEN (LARGEST, 8 wide)
  r(2,7,8,4, c.d)
  r(3,7,6,4, c.p, 0.6)                          // primary color overlay
  r(2,9,8,1, c.a, 0.4)                          // accent ring
  r(3,7,6,1, c.l, 0.35)                         // thorax-abdomen joint
}

function drawChitinTeen(r, c) {
  // Longer antennae (angled)
  r(4,0,1,4, c.d); r(7,0,1,4, c.d)
  r(3,0,2,1, c.a); r(7,0,2,1, c.a)
  r(3,1,2,1, c.d); r(7,1,2,1, c.d)             // antenna curve
  // SEGMENT 1 — HEAD (slightly bigger)
  r(3,3,6,2, c.l)
  // Large compound eyes
  r(3,4,2,1, c.a); r(7,4,2,1, c.a)
  r(3,4,1,1,'#1A1A2C'); r(8,4,1,1,'#1A1A2C')
  // SEGMENT 2 — THORAX (wider, 8 wide)
  r(2,5,8,3, c.p)
  // Wing nubs (hint of wings to come)
  r(0,5,2,2, c.a, 0.6); r(10,5,2,2, c.a, 0.6)
  // 3 pairs of legs (6 legs total — insect!)
  r(0,5,2,1, c.d); r(10,5,2,1, c.d)            // front pair
  r(0,6,2,1, c.d); r(10,6,2,1, c.d)            // middle pair
  r(1,7,2,1, c.d); r(9,7,2,1, c.d)             // back pair
  // Joint
  r(2,7,8,1, c.l, 0.38)
  // Mandibles
  r(4,5,1,1, c.d); r(7,5,1,1, c.d)
  // SEGMENT 3 — ABDOMEN (large, 8 wide)
  r(2,8,8,4, c.d)
  r(3,8,6,4, c.p, 0.6)
  r(2,10,8,1, c.a, 0.42)                        // ring 1
  r(3,8,6,1, c.l, 0.35)                         // joint line
}

// CHITIN FINAL uses 16×16 — titan mantis/beetle, wings spread
function drawChitinFinal(r, c) {
  // Long curved antennae
  r(6,0,1,5, c.d); r(9,0,1,5, c.d)             // stalks
  r(4,0,3,1, c.a); r(9,0,3,1, c.a)             // base knobs
  r(5,1,2,1, c.d); r(9,1,2,1, c.d)             // curve
  // SEGMENT 1 — HEAD
  r(5,4,6,3, c.l)
  // Massive compound eyes
  r(4,4,2,2, c.a); r(10,4,2,2, c.a)
  r(4,4,1,1,'#1A1A2C'); r(11,4,1,1,'#1A1A2C')
  // Pincers/mandibles (large)
  r(3,6,3,2, c.d); r(10,6,3,2, c.d)
  r(3,7,2,1, c.a); r(11,7,2,1, c.a)            // pincer tips
  // SEGMENT 2 — THORAX (wide)
  r(4,6,8,5, c.p)
  // WINGS spread (semi-transparent, extend beyond thorax)
  r(0,6,4,5, c.a, 0.45)                         // left wing
  r(12,6,4,5, c.a, 0.45)                        // right wing
  r(0,7,3,4, c.d, 0.22)                         // wing veins left
  r(13,7,3,4, c.d, 0.22)                        // wing veins right
  // 6 legs (3 pairs)
  r(1,6,3,1, c.d); r(12,6,3,1, c.d)            // front legs
  r(0,8,4,1, c.d); r(12,8,4,1, c.d)            // middle legs
  r(1,10,3,1, c.d); r(12,10,3,1, c.d)          // back legs
  // Mandibles on top of thorax
  r(3,6,3,2, c.d); r(10,6,3,2, c.d)
  r(3,7,2,1, c.a); r(11,7,2,1, c.a)
  // SEGMENT 3 — ABDOMEN (largest, tapers to point)
  r(4,11,8,5, c.d)
  r(5,11,6,5, c.p, 0.65)
  r(4,13,8,1, c.a, 0.45)                        // ring 1
  r(5,15,6,1, c.a, 0.3)                         // ring 2
  r(5,11,6,1, c.l, 0.4)                         // joint
}

// ─── Pattern overlays ─────────────────────────────────────────────────────────
function drawSpots(r, bodyType, stage, c) {
  const a = 0.42
  if (bodyType === 'furred') {
    if (stage === 'baby')  { r(4,6,1,1,c.d,a); r(7,7,1,1,c.d,a); r(5,8,1,1,c.d,a) }
    if (stage === 'teen')  { r(2,6,1,1,c.d,a); r(5,7,1,1,c.d,a); r(8,7,1,1,c.d,a); r(4,8,1,1,c.d,a) }
  } else if (bodyType === 'winged') {
    if (stage === 'baby')  { r(4,4,1,1,c.d,a); r(7,5,1,1,c.d,a) }
    if (stage === 'teen')  { r(4,4,1,1,c.d,a); r(7,4,1,1,c.d,a); r(5,6,1,1,c.d,a) }
  } else if (bodyType === 'scaled') {
    // For horizontal scaled: spots along back
    if (stage === 'baby')  { r(6,3,1,1,c.a,a); r(8,3,1,1,c.a,a) }
    if (stage === 'teen')  { r(6,3,1,1,c.a,a); r(8,3,1,1,c.a,a); r(7,4,1,1,c.a,a) }
  } else { // chitin
    if (stage === 'baby')  { r(5,7,1,1,c.a,a); r(7,8,1,1,c.a,a) }
    if (stage === 'teen')  { r(4,8,1,1,c.a,a); r(7,8,1,1,c.a,a); r(6,10,1,1,c.a,a) }
  }
}

function drawStripes(r, bodyType, stage, c) {
  if (bodyType === 'scaled') {
    // Vertical stripes (perpendicular to body direction = looks like scale segments)
    if (stage === 'baby')  { r(7,3,1,4,c.d,0.28); r(9,3,1,4,c.d,0.28) }
    if (stage === 'teen')  { r(7,3,1,5,c.d,0.28); r(9,3,1,5,c.d,0.28); r(11,3,1,5,c.d,0.28) }
  } else if (bodyType === 'chitin') {
    if (stage === 'baby')  { r(3,8,6,1,c.a,0.42) }
    if (stage === 'teen')  { r(3,8,6,1,c.a,0.42); r(3,10,6,1,c.a,0.3) }
  } else {
    if (stage === 'baby')  { r(2,6,8,1,c.d,0.26); r(2,8,8,1,c.d,0.26) }
    if (stage === 'teen')  { r(1,6,10,1,c.d,0.26); r(1,8,10,1,c.d,0.26); r(1,10,10,1,c.d,0.26) }
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
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

  // Final stage uses 16×16 for more detail and silhouette complexity
  const gridSize = stage === 'final' ? 16 : 12
  const P  = Math.floor(Math.min(W, H) / gridSize)
  const ox = Math.floor((W - P * gridSize) / 2)
  const oy = Math.floor((H - P * gridSize) / 2)
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

  // Patterns on baby/teen only (final has its own full detail)
  if (stage !== 'final') {
    if (pattern === 'spots') drawSpots(r, bodyType, stage, c)
    else if (pattern === 'stripes') drawStripes(r, bodyType, stage, c)
  }
}
