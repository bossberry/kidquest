import { hash } from './eggAlgorithm.js'

export function getCreatureSeed(egg) {
  const s = egg.eggStats || {}
  return hash((s.name||'') + (s.grade||0)) ^ hash('' + (s.dow||0) + (s.month||1) + (s.day||1) + (s.hour||12))
}

// ─── Element palettes ─────────────────────────────────────────────────────────
const COLORS = {
  fire:    { p:'#E24B4A', l:'#F09977', d:'#C23A30', a:'#EF9F27' },
  water:   { p:'#378ADD', l:'#85B7EB', d:'#185FA5', a:'#B5D4F4' },
  thunder: { p:'#EF9F27', l:'#FAC775', d:'#BA7517', a:'#FFFFFF' },
  nature:  { p:'#639922', l:'#97C459', d:'#3B6D11', a:'#C0DD97' },
  shadow:  { p:'#534AB7', l:'#7F77DD', d:'#3C3489', a:'#AFA9EC' },
  light:   { p:'#EF9F27', l:'#FAC775', d:'#BA7517', a:'#FAEEDA' },
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

// ─── Pixel-rect helper ────────────────────────────────────────────────────────
// Returns a draw function scoped to the grid origin and pixel scale.
function makeR(ctx, P, ox, oy) {
  return (x, y, w, h, color, alpha = 1) => {
    if (alpha < 1) { ctx.save(); ctx.globalAlpha = alpha }
    ctx.fillStyle = color
    ctx.fillRect(ox + x * P, oy + y * P, w * P, h * P)
    if (alpha < 1) ctx.restore()
  }
}

// ─── BABY stage (12×12 grid) ──────────────────────────────────────────────────
function drawBaby(r, el, c) {
  // Ears — shape varies by element
  if      (el === 'fire')    { r(2,1,2,2, c.d);        r(8,1,2,2, c.d) }
  else if (el === 'water')   { r(2,2,2,1, c.d);        r(8,2,2,1, c.d) }
  else if (el === 'thunder') { r(3,0,1,2, c.d);        r(8,0,1,2, c.d) }
  else if (el === 'nature')  { r(2,0,2,3, c.d);        r(8,0,2,3, c.d) }
  else if (el === 'shadow')  { r(2,0,2,4, c.d);        r(8,0,2,4, c.d) }
  else                       { r(2,1,2,2, c.a);        r(8,1,2,2, c.a) } // light

  // Head
  r(3,1,6,4, c.l)

  // Eyes
  r(4,2,1,1, '#1A1A2C')
  r(7,2,1,1, '#1A1A2C')

  // Nose
  r(5,3,2,1, c.d)

  // Cheeks
  const blush = el === 'water'   ? '#A8D4FF'
              : el === 'thunder' ? '#FFF3A8'
              : el === 'nature'  ? '#C8ECA8'
              : el === 'shadow'  ? c.a
              : el === 'light'   ? '#FAEEDA'
              :                    '#F9A8A8'   // fire
  r(3,3,1,1, blush, 0.7)
  r(8,3,1,1, blush, 0.7)

  // Body
  r(3,4,6,5, c.p)

  // Side features — element-specific
  if      (el === 'fire')    { r(2,4,1,3, c.a);         r(9,4,1,3, c.a) }
  else if (el === 'water')   { r(1,5,2,2, c.a);         r(9,5,2,2, c.a) }
  else if (el === 'thunder') { r(2,4,1,1, c.a); r(2,6,1,1, c.a); r(9,4,1,1, c.a); r(9,6,1,1, c.a) }
  else if (el === 'nature')  { r(2,5,1,2, c.d); r(2,7,1,1, c.a); r(9,5,1,2, c.d); r(9,7,1,1, c.a) }
  else if (el === 'shadow')  { r(1,4,2,5, c.d, 0.55);  r(9,4,2,5, c.d, 0.55) }
  else                       { r(1,4,2,4, c.a, 0.45);  r(9,4,2,4, c.a, 0.45) } // light

  // Tail — element-specific
  if      (el === 'fire')    { r(9,5,2,1, c.a); r(10,4,1,2, c.l) }
  else if (el === 'water')   { r(9,6,2,1, c.a); r(10,5,1,2, c.l); r(9,8,1,1, c.d) }
  else if (el === 'thunder') { r(9,5,1,1, c.a); r(10,4,1,1, c.a); r(10,6,1,1, c.a) }
  else if (el === 'nature')  { r(10,4,1,3, c.a); r(9,5,2,1, c.d) }
  else if (el === 'shadow')  { r(9,5,2,2, c.d, 0.8); r(10,4,1,3, c.l, 0.6) }
  else                       { r(9,5,2,1, c.a); r(10,4,1,1, c.a); r(10,6,1,1, c.a) } // light

  // Legs
  r(3,9,2,2, c.d)
  r(7,9,2,2, c.d)
}

// ─── TEEN stage ───────────────────────────────────────────────────────────────
function drawTeen(r, el, c) {
  // Ears — taller / more dramatic
  if      (el === 'fire')    { r(1,0,2,3, c.d); r(9,0,2,3, c.d) }
  else if (el === 'water')   { r(1,1,2,2, c.d); r(9,1,2,2, c.d) }
  else if (el === 'thunder') { r(2,0,2,3, c.d); r(8,0,2,3, c.d) }
  else if (el === 'nature')  { r(1,0,2,4, c.d); r(9,0,2,4, c.d); r(2,0,1,2, c.a); r(9,0,1,2, c.a) }
  else if (el === 'shadow')  { r(1,0,3,4, c.d); r(8,0,3,4, c.d) }
  else                       { r(1,0,3,3, c.a); r(8,0,3,3, c.a) } // light

  // Head — wider
  r(2,1,8,4, c.l)

  // Eyes — wider
  r(3,2,2,1, '#1A1A2C')
  r(7,2,2,1, '#1A1A2C')

  // Nose
  r(5,3,2,1, c.d)

  // Body — wider and taller
  r(2,4,8,6, c.p)

  // Shoulder pads in accent
  r(1,4,2,2, c.a)
  r(9,4,2,2, c.a)

  // Element accessories
  if      (el === 'fire')    { r(1,6,1,2, c.d);        r(10,6,1,2, c.d);        r(5,0,2,2, c.a) }
  else if (el === 'water')   { r(0,5,2,3, c.d);        r(10,5,2,3, c.d);        r(4,2,1,1, c.a); r(7,2,1,1, c.a) }
  else if (el === 'thunder') { r(1,4,1,1, c.a);        r(10,4,1,1, c.a);        r(5,1,2,1, c.d) }
  else if (el === 'nature')  { r(1,6,1,2, c.d);        r(10,6,1,2, c.d);        r(3,1,1,1, c.d); r(8,1,1,1, c.d) }
  else if (el === 'shadow')  { r(0,4,2,6, c.d, 0.4);  r(10,4,2,6, c.d, 0.4);  r(4,2,1,1, c.a); r(7,2,1,1, c.a) }
  else                       { r(0,4,2,4, c.a, 0.35); r(10,4,2,4, c.a, 0.35); r(5,0,2,2, c.a, 0.8) } // light

  // Tail — bigger
  if      (el === 'fire')    { r(10,5,2,2, c.a); r(11,4,1,3, c.l) }
  else if (el === 'water')   { r(10,6,2,2, c.a); r(11,5,1,3, c.l) }
  else if (el === 'thunder') { r(10,4,1,1, c.a); r(11,5,1,1, c.a); r(10,6,1,1, c.a); r(11,7,1,1, c.a) }
  else if (el === 'nature')  { r(10,5,1,4, c.a); r(11,4,1,2, c.d) }
  else if (el === 'shadow')  { r(10,5,2,3, c.d, 0.8); r(11,4,1,4, c.l, 0.5) }
  else                       { r(10,4,2,2, c.a); r(11,5,1,2, c.a, 0.6) } // light

  // Legs
  r(2,10,3,2, c.d)
  r(7,10,3,2, c.d)
}

// ─── FINAL stage ─────────────────────────────────────────────────────────────
function drawFinal(r, el, c) {
  // Crown / helmet — element-specific
  if      (el === 'fire')    { r(4,0,4,1, c.a); r(3,0,1,2, c.d); r(8,0,1,2, c.d); r(5,0,2,2, c.a) }
  else if (el === 'water')   { r(3,0,6,2, c.d); r(4,0,4,1, c.a) }
  else if (el === 'thunder') { r(2,0,2,1, c.d); r(8,0,2,1, c.d); r(5,0,2,2, c.a) }
  else if (el === 'nature')  { r(1,0,2,1, c.d); r(3,0,1,3, c.d); r(5,0,2,1, c.a); r(8,0,1,3, c.d); r(9,0,2,1, c.d) }
  else if (el === 'shadow')  { r(3,0,6,1, c.d); r(5,0,2,2, c.a, 0.7) }
  else                       { r(3,0,6,1, c.a); r(4,0,4,2, c.a, 0.6) } // light

  // Head — wide
  r(2,1,8,3, c.l)

  // Eyes — fierce (glow for shadow and fire)
  if (el === 'shadow' || el === 'fire') {
    r(3,2,2,1, c.a); r(7,2,2,1, c.a)
  } else {
    r(3,2,2,1, '#1A1A2C'); r(7,2,2,1, '#1A1A2C')
  }

  // Nose
  r(5,3,2,1, c.d)

  // Body — full width
  r(1,3,10,7, c.p)

  // Armor chest — element-specific
  if (el === 'fire') {
    r(3,4,6,4, c.d); r(4,5,4,2, c.a, 0.35); r(3,3,6,1, c.d)
  } else if (el === 'water') {
    r(3,4,6,4, c.d); r(4,5,4,2, c.a, 0.35); r(2,5,2,2, c.a); r(8,5,2,2, c.a)
  } else if (el === 'thunder') {
    r(3,4,6,4, c.d); r(5,4,2,4, c.a, 0.5)
  } else if (el === 'nature') {
    r(3,4,6,4, c.d); r(4,5,4,2, c.a, 0.4); r(2,4,1,3, c.a); r(9,4,1,3, c.a)
  } else if (el === 'shadow') {
    r(3,4,6,4, c.d, 0.8); r(4,5,4,2, c.a, 0.3); r(2,3,2,5, c.d, 0.5); r(8,3,2,5, c.d, 0.5)
  } else { // light
    r(3,4,6,4, c.d, 0.6); r(4,5,4,2, c.a, 0.6); r(0,3,3,5, c.a, 0.3); r(9,3,3,5, c.a, 0.3)
  }

  // Large tail
  if      (el === 'fire')    { r(10,4,2,3, c.a); r(11,3,1,4, c.l); r(10,7,1,1, c.d) }
  else if (el === 'water')   { r(10,5,2,3, c.a); r(11,4,1,4, c.l); r(10,8,2,1, c.d) }
  else if (el === 'thunder') { r(10,3,1,1, c.a); r(11,4,1,1, c.a); r(10,5,1,1, c.a); r(11,6,1,1, c.a); r(10,7,1,1, c.a) }
  else if (el === 'nature')  { r(10,4,2,1, c.a); r(11,3,1,3, c.d); r(10,6,2,2, c.a); r(11,7,1,2, c.d) }
  else if (el === 'shadow')  { r(10,4,2,5, c.d, 0.8); r(11,3,1,6, c.l, 0.5) }
  else                       { r(10,3,2,3, c.a); r(11,4,1,3, c.a, 0.6) } // light

  // Thick legs
  r(2,10,3,2, c.d)
  r(7,10,3,2, c.d)
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function drawCreature(canvas, seed, stats) {
  const W = canvas.width, H = canvas.height
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, W, H)

  // Dark background
  ctx.fillStyle = '#0a0a12'
  ctx.fillRect(0, 0, W, H)

  const S  = stats || {}
  const el = getElement(S)
  const stage = S.evoStage ?? 'baby'
  const c  = COLORS[el]

  // Scale pixel grid to canvas — each grid unit = P px, centered
  const P  = Math.floor(Math.min(W, H) / 12)
  const ox = Math.floor((W - P * 12) / 2)
  const oy = Math.floor((H - P * 12) / 2)
  const r  = makeR(ctx, P, ox, oy)

  if      (stage === 'final') drawFinal(r, el, c)
  else if (stage === 'teen')  drawTeen(r, el, c)
  else                        drawBaby(r, el, c)
}
