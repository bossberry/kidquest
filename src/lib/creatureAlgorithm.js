import { hash } from './eggAlgorithm.js'

export function getCreatureSeed(egg) {
  const s = egg.eggStats || {}
  return hash((s.name||'') + (s.grade||0)) ^ hash('' + (s.dow||0) + (s.month||1) + (s.day||1) + (s.hour||12))
}

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

// ─────────────────────────────────────────────────────────────────────────────
// FURRED
//
// Focal feature: BIG ROUND HEAD + EAR BUMPS (the head IS the creature).
// Head occupies top 50% at baby, 42% at teen. Body is NARROWER than head
// to emphasise the dome silhouette. 4 stub legs visible at bottom.
//
// Eyes: 2×2 round dark squares with white shine (the standard chibi eye).
// Accent: used only for mane shimmer at final. Everywhere else: p / l / d.
//
// Evolution: stub tail → ruff collar + bigger tail → full mane frame
// ─────────────────────────────────────────────────────────────────────────────

function drawFurredBaby(r, c) {
  // ── EARS: triangular points (3-px dark tip row merges into head shell at y=1) ──
  r(2,0,3,1, c.d); r(3,0,1,1, c.l)        // left ear: dark+inner
  r(7,0,3,1, c.d); r(8,0,1,1, c.l)        // right ear: dark+inner

  // ── HEAD: 10×5 dark shell → 8×3 light fill (1px outline all around) ──
  r(1,1,10,5, c.d)                          // head dark shell (ear bases at y=1, chin at y=5)
  r(2,2,8,3, c.l)                           // head light fill (y=2–4, x=2–9)
  r(3,2,2,2, c.d); r(3,2,1,1,'#ffffff')    // left eye 2×2 + white shine
  r(7,2,2,2, c.d); r(7,2,1,1,'#ffffff')    // right eye
  r(5,4,2,1, c.d)                           // nose
  // y=5 = solid dark chin row (bottom of head shell, no fill = natural neck line)

  // ── SHOULDER BRIDGE: same width as head, body color (zero visible seam) ──
  r(1,6,1,1, c.d); r(10,6,1,1, c.d)        // dark side pillars at y=6
  r(2,6,8,1, c.p)                           // primary fill = same x-extent as head interior

  // ── BODY: steps in 1px each side vs shoulder (diagonal shoulder transition) ──
  r(2,7,8,3, c.d)                           // body dark shell (x=2–9, y=7–9)
  r(3,7,6,2, c.p)                           // body fill y=7–8 (y=9 stays all-dark = clean floor)
  r(4,8,4,1, c.l, 0.35)                     // belly highlight

  // ── TAIL: diagonal arc — x=9 at y=6, steps right to x=10 at y=7 ──
  r(9,6,3,1, c.d)                           // tail dark start (x=9–11, y=6)
  r(10,7,2,1, c.d)                          // tail dark step (x=10–11, y=7, shifted 1px right)
  r(10,6,1,1, c.p)                          // tail fill y=6
  r(10,7,1,1, c.p)                          // tail fill y=7

  // ── 4 THIN LEGS (quadruped) ──
  r(3,10,1,2, c.d); r(5,10,1,2, c.d)       // left pair
  r(6,10,1,2, c.d); r(8,10,1,2, c.d)       // right pair
  r(2,11,2,1, c.d,0.6); r(4,11,2,1,c.d,0.6)   // paws L
  r(6,11,2,1, c.d,0.6); r(8,11,2,1,c.d,0.6)   // paws R
}

function drawFurredTeen(r, c) {
  // EARS — shorter (2 rows vs 3): proportion shift toward adult
  r(1,0,2,2, c.d); r(2,0,1,1, c.l)
  r(9,0,2,2, c.d); r(9,0,1,1, c.l)

  // HEAD — starts one row lower (y=1–4). Head region now y=0–4 = 42%.
  r(2,1,8,4, c.l)
  r(3,2,2,2, c.d); r(3,2,1,1,'#ffffff')
  r(7,2,2,2, c.d); r(7,2,1,1,'#ffffff')
  r(5,4,2,1, c.d)

  // RUFF — the ONE new feature at teen: a band wider than both head and body
  r(1,5,10,1, c.d)                      // ruff (10 wide, wider than 8-wide head)
  r(2,5,8,1, c.l, 0.32)                // ruff highlight

  // BODY — 4 rows (was 3 at baby: body grew)
  r(3,6,6,4, c.p)
  r(4,7,4,2, c.l, 0.32)
  r(9,8,2,2, c.d)                       // larger tail (2 wide)

  // LEGS — 2 rows only (body fills more canvas = more adult)
  r(2,10,2,2, c.d); r(5,10,2,2, c.d)   // left pair (2 wide each)
  r(7,10,2,2, c.d); r(9,10,2,2, c.d)   // right pair
}

function drawFurredFinal(r, c) {
  // MANE — the final signature. Full-width dark frame at canvas edges,
  // making the head region span the entire 12-column width.
  r(0,0,12,1, c.d)                      // crown row (full width)
  r(0,0,12,1, c.a, 0.28)               // accent shimmer on crown
  r(0,1,2,5, c.d)                       // left mane column
  r(10,1,2,5, c.d)                      // right mane column

  // HEAD — inside the mane frame, y=1–5
  r(2,1,8,5, c.l)
  r(3,2,2,2, c.d); r(3,2,1,1, c.a)    // eyes: accent shine (regal glow)
  r(7,2,2,2, c.d); r(7,2,1,1, c.a)
  r(5,5,2,1, c.d)

  // BODY — large, with mane draping down the sides
  r(2,6,8,4, c.p)
  r(0,6,2,4, c.d, 0.35)               // mane drape left
  r(10,6,2,4, c.d, 0.35)              // mane drape right
  r(4,7,4,2, c.l, 0.3)
  r(10,8,2,3, c.d)                     // thick tail

  // LEGS — thick paws (y=10–11 only: body is dominant)
  r(2,10,3,2, c.d)                     // left paw (3 wide)
  r(7,10,3,2, c.d)                     // right paw
}

// ─────────────────────────────────────────────────────────────────────────────
// WINGED
//
// Focal feature: THE WINGS — every other element is kept simple so wings read.
// Head is 6 wide (narrower than furred's 8). Eyes sit HIGH on the face (avian).
// No ears: smooth dome top, which silhouette-reads as "not furred" instantly.
// Body stays narrow (4 wide) at all stages — wings handle the width.
//
// Accent (a): wing interior only, so the wings pop in colour from the body.
// Evolution: shoulder nubs → folded wings (acc colour) → fully spread
// ─────────────────────────────────────────────────────────────────────────────

function drawWingedBaby(r, c) {
  // ── HEAD: 8×6 dark shell → 6×4 light fill (smooth dome top, no ear bumps) ──
  r(2,0,8,6, c.d)                           // head dark shell (y=0 = dome; y=5 = chin/beak)
  r(3,1,6,4, c.l)                           // head light fill (y=1–4, x=3–8)
  // Eyes HIGH at y=1–2 (avian) — 2×2 dark + white shine
  r(4,1,2,2, c.d); r(4,1,1,1,'#ffffff')    // left eye + shine
  r(6,1,2,2, c.d); r(6,1,1,1,'#ffffff')    // right eye + shine
  // y=5 = solid dark chin/beak row (bottom of head shell, no fill)

  // ── BODY: steps in 1px each side from head (diagonal shoulder transition) ──
  r(3,6,6,4, c.d)                           // body dark shell (x=3–8, y=6–9)
  r(4,6,4,3, c.p)                           // body fill (y=6–8; y=9 stays dark = floor)
  r(5,7,2,1, c.l, 0.35)                     // belly

  // ── WING NUBS: diagonal taper — 2-wide at top, 1-wide at tip (stair step) ──
  r(0,6,3,3, c.d)                           // left nub dark block (x=0–2, y=6–8)
  r(1,6,2,2, c.p)                           // left fill: 2 wide at y=6–7
  r(2,8,1,1, c.p)                           // left tip: 1 wide at y=8 (left edge steps right)
  r(9,6,3,3, c.d)                           // right nub dark block (x=9–11, y=6–8)
  r(9,6,2,2, c.p)                           // right fill: 2 wide at y=6–7
  r(9,8,1,1, c.p)                           // right tip: 1 wide at y=8 (right edge steps left)

  // ── TAIL: diagonal arc at bottom-right ──
  r(8,8,3,2, c.d)                           // tail dark (x=8–10, y=8–9)
  r(9,8,1,2, c.p)                           // tail fill

  // ── 2 LEGS ONLY (bipedal) ──
  r(5,10,1,2, c.d); r(6,10,1,2, c.d)
  r(4,11,1,1, c.d); r(5,11,2,1, c.d); r(6,11,2,1, c.d); r(7,11,1,1, c.d)
}

function drawWingedTeen(r, c) {
  // HEAD — y=0–4, same 6 wide. Head region shrinks to 42%.
  r(3,0,6,5, c.l)
  r(4,1,2,2, c.d); r(4,1,1,1,'#ffffff')
  r(6,1,2,2, c.d); r(6,1,1,1,'#ffffff')
  r(5,4,2,1, c.d)

  // FOLDED WINGS — the ONE new feature at teen. Accent interior makes them pop.
  // Folded shape: tall and narrow against the body sides.
  r(0,4,3,6, c.d)                        // left wing outline (x=0–2, y=4–9)
  r(1,5,2,4, c.a, 0.55)                  // left wing interior (accent!)
  r(9,4,3,6, c.d)                        // right wing outline
  r(9,5,2,4, c.a, 0.55)                  // right wing interior

  // BODY — between wings, same 4 wide
  r(4,4,4,6, c.p)
  r(5,5,2,4, c.l, 0.35)
  r(8,8,2,4, c.d)                         // longer tail (2 wide)

  r(5,10,1,2, c.d); r(6,10,1,2, c.d)     // 2 legs
  r(4,11,1,1, c.d); r(5,11,2,1, c.d); r(6,11,2,1, c.d); r(7,11,1,1, c.d)
}

function drawWingedFinal(r, c) {
  // HEAD — y=0–3, 6 wide. Head region 33%: most adult proportion.
  r(3,0,6,4, c.l)
  r(4,1,2,2, c.d); r(4,1,1,1,'#ffffff')
  r(6,1,2,2, c.d); r(6,1,1,1,'#ffffff')
  r(5,3,2,2, c.d)                          // beak more prominent at final (2 rows)

  // WINGS FULLY SPREAD — dominant at final, spans full canvas width.
  // The body becomes visually secondary to the wings.
  r(0,2,4,7, c.d)                           // left wing (x=0–3, y=2–8)
  r(0,3,3,5, c.a, 0.55)                     // left interior (accent)
  r(0,2,1,1, c.a)                            // left wingtip accent
  r(8,2,4,7, c.d)                            // right wing
  r(9,3,3,5, c.a, 0.55)                     // right interior
  r(11,2,1,1, c.a)                           // right wingtip accent

  // BODY — narrow pillar between wings
  r(4,3,4,7, c.p)
  r(5,4,2,5, c.l, 0.35)
  r(8,8,4,4, c.d)                            // long tail (spreads toward bottom-right)

  r(5,10,1,2, c.d); r(6,10,1,2, c.d)
  r(4,11,1,1, c.d); r(5,11,2,1, c.d); r(6,11,2,1, c.d); r(7,11,1,1, c.d)
}

// ─────────────────────────────────────────────────────────────────────────────
// SCALED
//
// Focal feature: THE TAIL — it grows in length and accent intensity stage by stage.
// Head has a FLAT TOP (no ears) + side frills (protrude sideways, not upward).
// Eyes are SLIT pupils (1×2 vertical) vs furred/winged's 2×2 round squares.
// These three cues (flat top, side frills, slit eyes) make baby SCALED visually
// distinct from baby FURRED even though both have wide 8-column heads.
//
// Accent (a): tail tip only — so the eye goes straight to the tail.
// Evolution: no accent tail → accent tip appears → large bold accent tail
// ─────────────────────────────────────────────────────────────────────────────

function drawScaledBaby(r, c) {
  // ── HEAD: 6×4 dark shell → 4×2 light fill (flat top at y=0, zero upward bumps) ──
  r(3,0,6,4, c.d)                           // head dark shell (x=3–8, y=0–3; flat dome)
  r(4,1,4,2, c.l)                           // head light fill (x=4–7, y=1–2)
  // Side frills: dark 2×2 blocks left and right (outward cue vs furred's upward ears)
  r(1,1,2,2, c.d)                           // left frill (x=1–2, adjacent to head x=3)
  r(9,1,2,2, c.d)                           // right frill (x=9–10)
  // Slit eyes: 1-wide × 2-tall (drawn after fill → overwrite with dark; not round 2×2)
  r(4,1,1,2, c.d)                           // left slit (leftmost fill pixel)
  r(7,1,1,2, c.d)                           // right slit
  // y=3 = solid dark chin row (bottom of head shell, no fill)

  // ── BODY: same x-range as head → continuous outline; taller = elongated reptile ──
  r(3,4,6,5, c.d)                           // body dark shell (x=3–8, y=4–8; same x as head)
  r(4,4,4,4, c.p)                           // body fill (x=4–7, y=4–7; y=8 stays dark)
  r(5,5,2,2, c.l, 0.28)                     // belly highlight

  // ── TAIL: 1-px column (y=5–7), diagonal bend 1 step right to x=10 (y=8–10) ──
  r(9,5,1,3, c.d)                           // tail upper (x=9, y=5–7)
  r(10,8,1,3, c.d)                          // tail bend (x=10, y=8–10; 1-px diagonal step)

  // ── LEGS: 2 short stubs ──
  r(3,9,2,2, c.d)                           // left leg (x=3–4, y=9–10)
  r(7,9,2,2, c.d)                           // right leg (x=7–8, y=9–10)
}

function drawScaledTeen(r, c) {
  // HEAD — y=0–4, same 8 wide. Head region shrinks to 42%.
  r(2,0,8,5, c.l)
  // FRILLS GROW — 3 wide (was 2) and taller (y=2–5, was y=3–4): the one new feature
  r(0,2,3,4, c.d)                         // left frill (bigger)
  r(9,2,3,4, c.d)                         // right frill
  r(4,2,1,2, c.d); r(7,2,1,2, c.d)       // slit eyes
  r(5,4,2,1, c.d)

  r(3,5,6,5, c.p)
  r(4,6,4,3, c.l, 0.3)

  // TAIL — longer (2 wide × 5 rows) and ACCENT TIP now appears
  r(9,7,2,5, c.d)                          // tail body (2 wide)
  r(9,10,2,2, c.a)                         // accent tip (eye goes here!)

  r(3,10,2,2, c.d); r(7,10,2,2, c.d)
}

function drawScaledFinal(r, c) {
  // FRILLS — very large at final (3 wide, taller than head itself)
  r(0,0,3,6, c.d)                          // left frill (taller than head)
  r(9,0,3,6, c.d)                          // right frill

  // HEAD — y=0–3, 6 wide (adult proportions: head region 33%)
  r(3,0,6,4, c.l)
  r(4,1,1,2, c.d); r(7,1,1,2, c.d)        // slit eyes
  r(5,3,2,1, c.d)                           // snout

  // BODY — large (8 wide)
  r(2,4,8,6, c.p)
  r(4,5,4,4, c.l, 0.28)

  // TAIL — THE focal feature at its maximum. Bold accent dominates lower right.
  r(10,6,2,6, c.d)                          // tail body (2 wide × 6 rows)
  r(10,8,2,4, c.a)                          // large accent block (4 rows — unmissable)

  r(3,10,3,2, c.d); r(7,10,3,2, c.d)       // 2 thick legs
}

// ─────────────────────────────────────────────────────────────────────────────
// CHITIN
//
// Focal feature: THREE STACKED SEGMENTS, widths 4 → 6 → 8.
// This inverted-pyramid stacking is immediately readable in silhouette
// and is unique to this type — no other type has it.
//
// Antennae: single-pixel-wide lines (vs furred's 2-wide ear blocks).
// Compound eyes: bulge 1 pixel BEYOND head width on each side.
// Legs: only from thorax, pointing sideways.
//
// Accent (a): wing feature only — nothing at baby, buds at teen, spread at final.
// Evolution: 4 legs → 6 legs + accent wing buds → 6 legs + full accent wings + pincers
// ─────────────────────────────────────────────────────────────────────────────

function drawChitinBaby(r, c) {
  // ANTENNAE — 1-px stems (3 rows), knobs bend outward
  r(4,0,1,3, c.d); r(3,0,2,1, c.d)         // left: stem x=4 + knob (x=3–4, y=0)
  r(7,0,1,3, c.d); r(7,0,2,1, c.d)         // right: stem x=7 + knob (x=7–8, y=0)

  // ── SEGMENT 1: HEAD — 4-wide fill (x=4–7) inside 6-wide dark shell (x=3–8) ──
  r(3,3,6,3, c.d)                           // head dark shell (y=3–5; chin at y=5)
  r(4,3,4,2, c.l)                           // head light fill (y=3–4; y=5 stays dark)
  // Compound eyes: 1×2 protrusions at x=2 and x=9 — truly OUTSIDE the dark shell
  r(2,3,1,2, c.d)                           // left compound eye (x=2, y=3–4; outside shell)
  r(9,3,1,2, c.d)                           // right compound eye (x=9, y=3–4)

  // ── SEGMENT 2: THORAX — 6-wide fill (x=3–8) inside 8-wide dark shell (x=2–9) ──
  r(2,6,8,3, c.d)                           // thorax dark shell (steps out 1px each side vs head)
  r(3,6,6,2, c.p)                           // thorax fill (y=6–7; y=8 stays dark = bottom border)
  // Horizontal legs (sideways 1-px lines — only from thorax)
  r(0,6,2,1, c.d); r(0,7,3,1, c.d)         // left pair
  r(10,6,2,1, c.d); r(9,7,3,1, c.d)        // right pair

  // ── SEGMENT 3: ABDOMEN — 8-wide fill (x=2–9) inside 10-wide dark shell (x=1–10) ──
  // Width progression: 4→6→8 fill, 6→8→10 shell. Reads as inverted-pyramid insect.
  r(1,9,10,3, c.d)                          // abdomen dark shell (steps out 1px each side vs thorax)
  r(2,9,8,2, c.p)                           // abdomen fill (y=9–10; y=11 stays dark = bottom border)
  r(3,10,6,1, c.l, 0.4)                     // highlight band
}

function drawChitinTeen(r, c) {
  r(4,0,1,2, c.d); r(3,0,2,1, c.d)
  r(7,0,1,2, c.d); r(7,0,2,1, c.d)

  // HEAD — same size/position
  r(4,2,4,3, c.l)
  r(3,3,2,1, c.d); r(7,3,2,1, c.d)
  r(4,4,2,1, c.d)

  // WING BUDS — the ONE new feature at teen. Accent colour makes them unmissable.
  r(1,4,2,3, c.a, 0.8)                      // left wing bud (accent!)
  r(9,4,2,3, c.a, 0.8)                      // right wing bud
  r(1,4,1,3, c.d, 0.4)                      // bud outline

  // THORAX — same 6 wide
  r(3,5,6,3, c.p)
  // 6 LEGS (3 pairs — more than baby's 4)
  r(1,5,2,1, c.d); r(0,6,3,1, c.d); r(1,7,2,1, c.d)   // left 3 legs
  r(9,5,2,1, c.d); r(9,6,3,1, c.d); r(9,7,2,1, c.d)   // right 3 legs

  // ABDOMEN — same 8 wide but 1 row taller (y=8–11 = 4 rows)
  r(2,8,8,4, c.d)
  r(3,8,6,4, c.p)
  r(3,10,6,1, c.l, 0.4)
}

function drawChitinFinal(r, c) {
  r(4,0,1,2, c.d); r(3,0,2,1, c.d)
  r(7,0,1,2, c.d); r(7,0,2,1, c.d)

  // HEAD — same
  r(4,2,4,3, c.l)
  r(3,3,2,1, c.d); r(7,3,2,1, c.d)

  // PINCERS — new at final (extend from head sides at jaw level)
  r(2,4,2,2, c.d)                            // left pincer
  r(8,4,2,2, c.d)                            // right pincer

  // WINGS FULLY SPREAD — the final signature.
  // Accent interior spans y=3–8 on both sides.
  r(0,3,3,6, c.d)                            // left wing outline
  r(0,4,2,4, c.a, 0.6)                       // left wing interior (accent!)
  r(9,3,3,6, c.d)                            // right wing outline
  r(10,4,2,4, c.a, 0.6)                      // right wing interior

  // THORAX
  r(3,5,6,3, c.p)
  r(1,5,2,1, c.d); r(0,6,3,1, c.d); r(1,7,2,1, c.d)
  r(9,5,2,1, c.d); r(9,6,3,1, c.d); r(9,7,2,1, c.d)

  // ABDOMEN — same proportions, accent ring now visible
  r(2,8,8,4, c.d)
  r(3,8,6,4, c.p)
  r(2,10,8,1, c.a, 0.55)                     // accent ring (secondary accent use — abdomen)
}

// ─── Pattern overlays ─────────────────────────────────────────────────────────
function drawSpots(r, bodyType, stage, c) {
  const a = 0.38
  if (bodyType === 'furred') {
    if (stage === 'baby')  { r(4,7,1,1,c.d,a); r(7,7,1,1,c.d,a); r(5,8,1,1,c.d,a) }
    if (stage === 'teen')  { r(3,7,1,1,c.d,a); r(6,7,1,1,c.d,a); r(8,7,1,1,c.d,a) }
    if (stage === 'final') { r(3,7,1,1,c.d,a); r(6,7,1,1,c.d,a); r(9,7,1,1,c.d,a); r(4,9,1,1,c.d,a); r(7,9,1,1,c.d,a) }
  } else if (bodyType === 'winged') {
    if (stage === 'baby')  { r(5,7,1,1,c.d,a); r(6,8,1,1,c.d,a) }
    if (stage === 'teen')  { r(5,6,1,1,c.d,a); r(5,8,1,1,c.d,a); r(6,7,1,1,c.d,a) }
    if (stage === 'final') { r(5,5,1,1,c.d,a); r(5,7,1,1,c.d,a); r(6,6,1,1,c.d,a); r(6,8,1,1,c.d,a) }
  } else if (bodyType === 'scaled') {
    if (stage === 'baby')  { r(5,6,1,1,c.a,a); r(6,5,1,1,c.a,a) }
    if (stage === 'teen')  { r(5,7,1,1,c.a,a); r(7,7,1,1,c.a,a); r(5,9,1,1,c.a,a) }
    if (stage === 'final') { r(4,6,1,1,c.a,a); r(6,6,1,1,c.a,a); r(5,8,1,1,c.a,a); r(7,8,1,1,c.a,a) }
  } else {
    if (stage === 'baby')  { r(5,9,1,1,c.a,a); r(7,10,1,1,c.a,a) }
    if (stage === 'teen')  { r(4,9,1,1,c.a,a); r(6,9,1,1,c.a,a); r(5,10,1,1,c.a,a) }
    if (stage === 'final') { r(4,9,1,1,c.a,a); r(6,9,1,1,c.a,a); r(4,11,1,1,c.a,a); r(7,11,1,1,c.a,a) }
  }
}

function drawStripes(r, bodyType, stage, c) {
  if (bodyType === 'furred') {
    if (stage === 'baby')  { r(3,7,6,1,c.d,0.22); r(3,8,6,1,c.d,0.22) }
    if (stage === 'teen')  { r(3,7,6,1,c.d,0.22); r(3,9,6,1,c.d,0.22) }
    if (stage === 'final') { r(2,7,8,1,c.d,0.22); r(2,9,8,1,c.d,0.22) }
  } else if (bodyType === 'winged') {
    if (stage === 'baby')  { r(4,7,4,1,c.d,0.25) }
    if (stage === 'teen')  { r(4,6,4,1,c.d,0.25); r(4,8,4,1,c.d,0.25) }
    if (stage === 'final') { r(4,5,4,1,c.d,0.25); r(4,7,4,1,c.d,0.25); r(4,9,4,1,c.d,0.25) }
  } else if (bodyType === 'scaled') {
    if (stage === 'baby')  { r(4,6,4,1,c.d,0.22); r(4,5,4,1,c.d,0.22) }
    if (stage === 'teen')  { r(3,6,6,1,c.d,0.22); r(3,8,6,1,c.d,0.22) }
    if (stage === 'final') { r(2,5,8,1,c.d,0.22); r(2,7,8,1,c.d,0.22); r(2,9,8,1,c.d,0.22) }
  } else {
    if (stage === 'baby')  { r(3,9,6,1,c.a,0.35) }
    if (stage === 'teen')  { r(3,9,6,1,c.a,0.35); r(3,11,6,1,c.a,0.28) }
    if (stage === 'final') { r(2,9,8,1,c.a,0.4); r(2,11,8,1,c.a,0.3) }
  }
}

// ─── Dev test helper — force a specific bodyType + element combination ────────
export function drawCreatureDirect(canvas, bodyType, el, stage = 'baby') {
  const W = canvas.width, H = canvas.height
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  const palettes = PALETTES[el] || PALETTES.light
  const c = palettes[0]
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
}

// ─── Main export — 12×12 grid, all stages ─────────────────────────────────────
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
