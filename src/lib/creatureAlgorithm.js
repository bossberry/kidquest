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

// ─── Creature names ───────────────────────────────────────────────────────────
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

// ─── Determine element from stats ─────────────────────────────────────────────
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

// ─── XorShift32 PRNG (matches eggAlgorithm.js) ───────────────────────────────
function prng(seed) {
  let s = seed >>> 0
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
}

// ─── Pixel-rect helper ────────────────────────────────────────────────────────
function makeR(ctx, P, ox, oy) {
  return (x, y, w, h, color, alpha = 1) => {
    if (alpha < 1) { ctx.save(); ctx.globalAlpha = alpha }
    ctx.fillStyle = color
    ctx.fillRect(ox + x * P, oy + y * P, w * P, h * P)
    if (alpha < 1) ctx.restore()
  }
}

// ─── FURRED — round ears, 4 legs, fluffy tail ────────────────────────────────
function drawFurredBaby(r, c) {
  r(2,0,2,3, c.d); r(8,0,2,3, c.d)          // outer ears
  r(3,0,1,2, c.l); r(9,0,1,2, c.l)          // inner ear
  r(3,1,6,4, c.l)                             // head
  r(3,4,6,5, c.p)                             // body
  r(4,5,4,3, c.l, 0.4)                       // belly
  r(3,9,2,3, c.d); r(7,9,2,3, c.d)          // legs
  r(9,7,2,2, c.p); r(10,6,1,2, c.d); r(10,5,1,1, c.a)  // tail
  r(4,2,1,1,'#1A1A2C'); r(7,2,1,1,'#1A1A2C')  // eyes
  r(5,3,2,1, c.d)                             // nose
  r(3,3,1,1, c.a, 0.6); r(8,3,1,1, c.a, 0.6)  // cheeks
}

function drawFurredTeen(r, c) {
  r(2,0,2,4, c.d); r(8,0,2,4, c.d)          // pointed ears
  r(3,0,1,3, c.l); r(9,0,1,3, c.l)
  r(2,1,8,4, c.l)                             // head (wider)
  r(2,4,8,6, c.p)                             // body
  r(4,5,4,4, c.l, 0.35)                      // belly
  r(1,4,2,2, c.d, 0.55); r(9,4,2,2, c.d, 0.55)  // shoulder tufts
  r(2,10,3,2, c.d); r(7,10,3,2, c.d)        // legs
  r(10,6,2,3, c.p); r(11,5,1,4, c.d); r(11,4,1,1, c.a)  // tail
  r(3,2,2,1,'#1A1A2C'); r(7,2,2,1,'#1A1A2C')  // eyes
  r(5,3,2,1, c.d)                             // nose
}

function drawFurredFinal(r, c) {
  r(2,0,8,2, c.d)                             // mane
  r(3,0,6,1, c.a, 0.5)
  r(1,1,2,2, c.d); r(9,1,2,2, c.d)          // ear protrusions
  r(2,1,8,3, c.l)                             // head
  r(1,3,10,7, c.p)                            // body (full width)
  r(3,4,6,4, c.d); r(4,5,4,2, c.a, 0.35)    // chest plate
  r(2,10,3,2, c.d); r(7,10,3,2, c.d)        // legs
  r(10,5,2,4, c.p); r(11,4,1,5, c.d); r(11,3,1,1, c.a)  // tail
  r(3,2,2,1, c.a); r(7,2,2,1, c.a)          // glowing eyes
  r(5,3,2,1, c.d)                             // nose
}

// ─── WINGED — beak, spread wings, tail feathers ───────────────────────────────
function drawWingedBaby(r, c) {
  r(1,3,2,3, c.d); r(9,3,2,3, c.d)          // stubby wing nubs
  r(0,4,2,2, c.a, 0.6); r(10,4,2,2, c.a, 0.6)
  r(3,1,6,4, c.l)                             // head
  r(3,5,6,4, c.p)                             // body
  r(4,6,4,2, c.l, 0.5)                       // belly
  r(4,9,2,3, c.d); r(6,9,2,3, c.d)          // stick legs
  r(9,8,1,2, c.d); r(10,7,1,3, c.a, 0.8)    // tail feathers
  r(4,2,1,1,'#1A1A2C'); r(7,2,1,1,'#1A1A2C')  // eyes
  r(5,4,2,1, c.d); r(5,5,2,1, c.a)          // beak (upper + lower)
}

function drawWingedTeen(r, c) {
  r(0,2,3,5, c.d); r(9,2,3,5, c.d)          // spread wings
  r(0,3,2,4, c.a, 0.55); r(10,3,2,4, c.a, 0.55)
  r(0,2,1,1, c.a); r(11,2,1,1, c.a)         // wingtips
  r(3,1,6,4, c.l)                             // head
  r(3,5,6,5, c.p)                             // body
  r(4,6,4,3, c.l, 0.4)                       // belly
  r(3,10,2,2, c.d); r(7,10,2,2, c.d)        // legs
  r(9,8,1,2, c.d); r(10,7,2,3, c.a)         // tail fan
  r(3,2,2,1,'#1A1A2C'); r(7,2,2,1,'#1A1A2C')  // eyes
  r(4,4,4,1, c.d); r(5,5,2,1, c.a)          // beak
}

function drawWingedFinal(r, c) {
  r(0,1,3,7, c.d); r(9,1,3,7, c.d)          // large wings
  r(0,2,2,6, c.a, 0.5); r(10,2,2,6, c.a, 0.5)
  r(0,1,1,1, c.a); r(11,1,1,1, c.a)         // wingtips
  r(3,0,6,1, c.d)                             // head crest
  r(5,0,2,2, c.a, 0.7)
  r(3,1,6,3, c.l)                             // head
  r(2,4,8,6, c.p)                             // body
  r(4,5,4,4, c.d); r(5,6,2,2, c.a, 0.45)    // chest armor
  r(3,10,2,2, c.d); r(7,10,2,2, c.d)        // legs
  r(9,8,2,4, c.d); r(10,7,2,4, c.a); r(11,7,1,4, c.d)  // large tail fan
  r(3,2,2,1, c.a); r(7,2,2,1, c.a)          // fierce eyes
  r(4,4,4,1, c.d); r(4,5,3,1, c.a)          // long beak
}

// ─── SCALED — frills, slit eyes, forked tongue, serrated tail ────────────────
function drawScaledBaby(r, c) {
  r(3,0,1,2, c.a); r(8,0,1,2, c.a)          // tiny frills
  r(3,1,6,3, c.l)                             // head
  r(2,4,8,5, c.p)                             // body
  r(3,5,1,1, c.d, 0.5); r(6,5,1,1, c.d, 0.5); r(9,5,1,1, c.d, 0.5)  // scales
  r(4,7,1,1, c.d, 0.5); r(7,7,1,1, c.d, 0.5)
  r(4,4,4,4, c.l, 0.22)                      // belly
  r(2,9,2,2, c.d); r(8,9,2,2, c.d)          // stubby legs
  r(9,7,2,2, c.p); r(10,6,1,3, c.d)         // tail
  r(4,2,2,1, c.l); r(7,2,2,1, c.l)          // eye whites
  r(5,2,1,1,'#1A1A2C'); r(8,2,1,1,'#1A1A2C')  // slit pupils
  r(5,4,1,2, c.a); r(6,4,1,2, c.a)          // forked tongue (on top of body)
}

function drawScaledTeen(r, c) {
  r(2,0,2,3, c.a); r(8,0,2,3, c.a)          // frills
  r(2,0,1,2, c.d); r(9,0,1,2, c.d)
  r(2,1,8,3, c.l)                             // head
  r(1,3,10,6, c.p)                            // longer body
  r(2,4,2,1, c.d, 0.4); r(5,4,2,1, c.d, 0.4); r(8,4,2,1, c.d, 0.4)  // scale rows
  r(3,6,2,1, c.d, 0.4); r(6,6,2,1, c.d, 0.4); r(9,6,2,1, c.d, 0.4)
  r(4,4,4,5, c.l, 0.22)                      // belly
  r(1,9,3,3, c.d); r(8,9,3,3, c.d)          // legs
  r(10,7,2,3, c.d); r(11,6,1,4, c.p); r(11,5,1,1, c.a)  // curling tail
  r(3,2,2,1, c.l); r(7,2,2,1, c.l)          // eye whites
  r(4,2,1,1,'#1A1A2C'); r(8,2,1,1,'#1A1A2C')  // slit pupils
  r(4,4,1,2, c.a); r(7,4,1,2, c.a)          // tongue (on top of body)
}

function drawScaledFinal(r, c) {
  r(1,0,3,4, c.a); r(8,0,3,4, c.a)          // large frills
  r(1,0,2,3, c.d, 0.7); r(9,0,2,3, c.d, 0.7)
  r(2,1,8,3, c.l)                             // head
  r(1,3,10,7, c.p)                            // armored body
  r(2,4,2,1, c.d); r(5,4,2,1, c.d); r(8,4,2,1, c.d)   // armor plates row 1
  r(3,6,2,1, c.d); r(6,6,2,1, c.d); r(9,6,2,1, c.d)   // row 2
  r(2,8,2,1, c.d); r(5,8,2,1, c.d); r(8,8,2,1, c.d)   // row 3
  r(4,4,4,6, c.l, 0.22)                      // belly
  r(2,10,3,2, c.d); r(7,10,3,2, c.d)        // thick legs
  r(10,6,2,4, c.d); r(11,5,1,1, c.a); r(11,7,1,1, c.a); r(11,9,1,1, c.a)  // serrated tail
  r(3,2,2,1, c.a); r(7,2,2,1, c.a)          // fierce slit eyes
  r(4,4,1,3, c.a); r(6,4,1,3, c.a)          // long tongue (on top of body)
}

// ─── CHITIN — antennae, compound eyes, thorax + abdomen, 4 legs ──────────────
function drawChitinBaby(r, c) {
  r(4,0,1,1, c.a); r(7,0,1,1, c.a)          // antenna knobs
  r(4,1,1,2, c.d); r(7,1,1,2, c.d)          // antenna stalks
  r(3,3,6,3, c.l)                             // head (x=3-8, y=3-5)
  r(2,6,8,2, c.p)                             // thorax
  r(4,8,4,3, c.d)                             // abdomen
  r(1,6,2,1, c.d); r(9,6,2,1, c.d)          // front legs
  r(1,7,2,1, c.d); r(9,7,2,1, c.d)          // back legs
  r(4,8,4,1, c.l, 0.4)                       // segment join highlight
  r(2,4,3,1, c.a); r(7,4,3,1, c.a)          // compound eyes (bulging)
  r(3,4,1,1,'#1A1A2C'); r(8,4,1,1,'#1A1A2C')  // pupils
  r(4,6,1,1, c.d); r(7,6,1,1, c.d)          // mandibles (on thorax top)
}

function drawChitinTeen(r, c) {
  r(4,0,1,1, c.a); r(7,0,1,1, c.a)          // antenna knobs
  r(4,1,1,3, c.d); r(7,1,1,3, c.d)          // longer stalks
  r(3,0,2,1, c.d); r(7,0,2,1, c.d)          // antenna angle
  r(3,2,6,3, c.l)                             // head (y=2-4)
  r(2,5,8,3, c.p)                             // thorax (wider)
  r(1,5,2,2, c.a, 0.65); r(9,5,2,2, c.a, 0.65)  // wing nubs
  r(3,8,6,3, c.d)                             // abdomen
  r(3,8,6,1, c.l, 0.35)                      // segment join
  r(2,7,8,1, c.l, 0.4)                       // thorax-abdomen join
  r(0,5,2,1, c.d); r(10,5,2,1, c.d)         // front legs (longer)
  r(0,6,2,1, c.d); r(10,6,2,1, c.d)
  r(1,7,2,1, c.d); r(9,7,2,1, c.d)          // back legs
  r(0,7,1,1, c.d); r(11,7,1,1, c.d)
  r(3,3,2,2, c.a); r(7,3,2,2, c.a)          // bigger compound eyes
  r(3,3,1,1,'#1A1A2C'); r(8,3,1,1,'#1A1A2C')
  r(4,5,1,1, c.d); r(7,5,1,1, c.d)          // mandibles (on thorax)
}

function drawChitinFinal(r, c) {
  r(2,0,2,1, c.a); r(8,0,2,1, c.a)          // antenna knobs
  r(3,1,1,3, c.d); r(8,1,1,3, c.d)          // stalks (curled base)
  r(3,0,2,1, c.d); r(7,0,2,1, c.d)          // antenna tips angled
  r(3,2,6,3, c.l)                             // head
  r(2,4,8,4, c.p)                             // thorax
  r(0,4,2,4, c.a, 0.5); r(10,4,2,4, c.a, 0.5)  // wings spread
  r(0,5,1,3, c.d, 0.3); r(11,5,1,3, c.d, 0.3)  // wing veins
  r(3,8,6,4, c.d)                             // abdomen (3 segments)
  r(3,9,6,1, c.l, 0.4)                       // ring 1
  r(3,11,6,1, c.l, 0.25)                     // ring 2
  r(2,7,8,1, c.l, 0.4)                       // thorax-abdomen join
  r(1,5,1,1, c.d); r(10,5,1,1, c.d)         // 3 pairs of legs
  r(1,6,1,1, c.d); r(10,6,1,1, c.d)
  r(0,5,1,1, c.d); r(11,5,1,1, c.d)
  r(0,6,1,1, c.d); r(11,6,1,1, c.d)
  r(1,7,1,1, c.d); r(10,7,1,1, c.d)
  r(0,7,1,1, c.d); r(11,7,1,1, c.d)
  r(3,2,2,2, c.a); r(7,2,2,2, c.a)          // large compound eyes
  r(3,2,1,1,'#1A1A2C'); r(8,2,1,1,'#1A1A2C')
  r(2,5,2,2, c.d); r(8,5,2,2, c.d)          // pincers
  r(2,6,1,1, c.a); r(9,6,1,1, c.a)          // pincer tips
}

// ─── Pattern overlays ─────────────────────────────────────────────────────────
function drawSpots(r, bodyType, stage, c) {
  const a = 0.45
  if (bodyType === 'furred') {
    if (stage === 'baby')  { r(4,5,1,1,c.d,a); r(7,6,1,1,c.d,a); r(5,7,1,1,c.d,a) }
    if (stage === 'teen')  { r(3,5,1,1,c.d,a); r(6,5,1,1,c.d,a); r(4,7,1,1,c.d,a); r(8,7,1,1,c.d,a) }
    if (stage === 'final') { r(3,5,1,1,c.d,a); r(6,5,1,1,c.d,a); r(9,5,1,1,c.d,a); r(4,7,1,1,c.d,a); r(8,7,1,1,c.d,a) }
  } else if (bodyType === 'winged') {
    if (stage === 'baby')  { r(4,6,1,1,c.d,a); r(7,7,1,1,c.d,a) }
    if (stage === 'teen')  { r(4,6,1,1,c.d,a); r(7,6,1,1,c.d,a); r(5,8,1,1,c.d,a) }
    if (stage === 'final') { r(3,5,1,1,c.d,a); r(6,5,1,1,c.d,a); r(4,7,1,1,c.d,a); r(8,7,1,1,c.d,a) }
  } else if (bodyType === 'scaled') {
    if (stage === 'baby')  { r(4,5,1,1,c.a,a); r(7,5,1,1,c.a,a) }
    if (stage === 'teen')  { r(3,5,1,1,c.a,a); r(6,5,1,1,c.a,a); r(9,5,1,1,c.a,a) }
    if (stage === 'final') { r(3,5,1,1,c.a,a); r(6,5,1,1,c.a,a); r(9,5,1,1,c.a,a); r(4,7,1,1,c.a,a); r(7,7,1,1,c.a,a) }
  } else {
    if (stage === 'baby')  { r(5,6,1,1,c.a,a); r(7,7,1,1,c.a,a) }
    if (stage === 'teen')  { r(4,6,1,1,c.a,a); r(7,6,1,1,c.a,a); r(6,9,1,1,c.a,a) }
    if (stage === 'final') { r(4,5,1,1,c.a,a); r(7,5,1,1,c.a,a); r(5,9,1,1,c.a,a); r(7,9,1,1,c.a,a) }
  }
}

function drawStripes(r, bodyType, stage, c) {
  if (bodyType === 'chitin') {
    if (stage === 'baby')  { r(4,7,4,1,c.a,0.45) }
    if (stage === 'teen')  { r(3,8,6,1,c.a,0.45); r(3,10,6,1,c.a,0.3) }
    if (stage === 'final') { r(3,8,6,1,c.a,0.45); r(3,10,6,1,c.a,0.35) }
  } else {
    if (stage === 'baby')  { r(3,5,6,1,c.d,0.28); r(3,7,6,1,c.d,0.28) }
    if (stage === 'teen')  { r(2,5,8,1,c.d,0.28); r(2,7,8,1,c.d,0.28); r(2,9,8,1,c.d,0.28) }
    if (stage === 'final') { r(1,5,10,1,c.d,0.28); r(1,7,10,1,c.d,0.28); r(1,9,10,1,c.d,0.28) }
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
