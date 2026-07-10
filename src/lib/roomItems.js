/**
 * roomItems.js — furniture catalog for the Room / Den decoration screen.
 *
 * Each item has:
 *   id       — stable string key stored in state.roomLayout
 *   nameTh   — Thai display name
 *   price    — coins cost
 *   tier     — 'small' | 'mid' | 'big'
 *   draw(ctx, cx, cy, sz) — pixel-art icon centered at (cx, cy), approximate size sz px
 *
 * Draw convention: (cx, cy) = center of drawing area, sz ≈ usable diameter in pixels.
 * Items are designed for sz ≈ 44-56 (slot previews) and sz ≈ 56-64 (shop previews).
 * Use ctx.fillRect only — no paths/arcs — for consistent pixel-art style.
 */

// Compact helper: draw filled rect relative to center (cx, cy)
function R(ctx, cx, cy, dx, dy, w, h, col) {
  ctx.fillStyle = col
  ctx.fillRect(cx + dx, cy + dy, w, h)
}

// Scale helper — scales from baseline sz=48
function rS(ctx, cx, cy, dx, dy, w, h, col, sz) {
  const s = sz / 48
  R(ctx, cx, cy, dx * s, dy * s, w * s, h * s, col)
}

// ── ISO helpers ─────────────────────────────────────────────────────────────
// Flat contact shadow (pixel-stepped diamond) so a floor item reads as grounded
// on an iso tile instead of floating. Drawn under the item's feet.
function groundShadow(ctx, cx, cy, sz) {
  const s = sz / 48
  ctx.save()
  ctx.globalAlpha = 0.20
  const base = 18 // baseline-48 px below center (near the feet)
  const rows = [[-3, 12], [-2, 20], [-1, 26], [0, 28], [1, 26], [2, 20], [3, 12]]
  for (const [dy, w] of rows) {
    R(ctx, cx, cy, -(w / 2) * s, (base + dy * 2) * s, w * s, 2 * s, '#000000')
  }
  ctx.restore()
}

// Iso right side-face for a box whose FRONT face is R(cx,cy, dx,dy, w,h).
// Adds a receding parallelogram to the right → 3D depth. Baseline-48 units.
function isoSide(ctx, cx, cy, dx, dy, w, h, depth, col, sz) {
  const s = sz / 48
  const rx = cx + (dx + w) * s, y = cy + dy * s, hh = h * s, d = depth * s
  ctx.beginPath()
  ctx.moveTo(rx, y)
  ctx.lineTo(rx + d, y - d * 0.5)
  ctx.lineTo(rx + d, y + hh - d * 0.5)
  ctx.lineTo(rx, y + hh)
  ctx.closePath()
  ctx.fillStyle = col
  ctx.fill()
}

// Iso top-face for a box whose FRONT-TOP edge is R(cx,cy, dx,dy, w,·).
function isoTop(ctx, cx, cy, dx, dy, w, depth, col, sz) {
  const s = sz / 48
  const x = cx + dx * s, y = cy + dy * s, ww = w * s, d = depth * s
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + ww, y)
  ctx.lineTo(x + ww + d, y - d * 0.5)
  ctx.lineTo(x + d, y - d * 0.5)
  ctx.closePath()
  ctx.fillStyle = col
  ctx.fill()
}

// Wrap a floor item's draw fn so every floor item gets a grounding shadow.
function withGround(fn) {
  return (ctx, cx, cy, sz) => { groundShadow(ctx, cx, cy, sz); fn(ctx, cx, cy, sz) }
}

// Subtle animated "crafted" glint — a small pulsing sparkle (Date.now()-seeded)
// drawn at a corner of a crafted item so it reads as special/handmade. Cheap:
// runs every animation frame like any furniture draw. Consistent with the
// globalAlpha-based glow already used by drawFairyLights/drawWallLampRight.
function craftGlint(ctx, cx, cy, sz, gx = 12, gy = -16) {
  const t = (Date.now() % 1500) / 1500
  const a = 0.22 + 0.42 * Math.abs(Math.sin(t * Math.PI))
  ctx.save()
  ctx.globalAlpha = a
  rS(ctx, cx, cy, gx - 0.5, gy - 3.5, 1, 8, '#ffffff', sz)   // vertical ray
  rS(ctx, cx, cy, gx - 3.5, gy - 0.5, 8, 1, '#ffffff', sz)   // horizontal ray
  ctx.globalAlpha = Math.min(1, a * 0.8)
  rS(ctx, cx, cy, gx - 1.5, gy - 1.5, 3, 3, '#fff7d0', sz)   // hot center
  ctx.restore()
}

// ── DRAW FUNCTIONS ─────────────────────────────────────────────────────────

function drawPlant(ctx, cx, cy, sz) {
  const s = sz / 48
  // Pot
  rS(ctx,cx,cy, -10,2, 20,18, '#C9623F', sz)
  rS(ctx,cx,cy, -12,0, 24,5,  '#E07850', sz)  // rim
  rS(ctx,cx,cy, -6,18, 12,4,  '#A04030', sz)  // base
  rS(ctx,cx,cy, -10,2, 20,6,  '#3D2009', sz)  // soil
  // Stem
  rS(ctx,cx,cy, -2,-22, 4,24, '#2D5A27', sz)
  // Leaves
  rS(ctx,cx,cy, -18,-18, 16,10, '#3E8C35', sz)  // left 1
  rS(ctx,cx,cy, -16,-9,  14,9,  '#3E8C35', sz)  // left 2
  rS(ctx,cx,cy, 2,-13,   16,10, '#3E8C35', sz)  // right 1
  rS(ctx,cx,cy, 0,-4,    14,9,  '#3E8C35', sz)  // right 2
  rS(ctx,cx,cy, -16,-18, 7,5,   '#52AA48', sz)  // highlights
  rS(ctx,cx,cy, 2,-13,   7,5,   '#52AA48', sz)
}

function drawRug(ctx, cx, cy, sz) {
  // Flat oval rug — wider than tall
  rS(ctx,cx,cy, -22,-10, 44,20, '#C01C5A', sz)  // outer
  rS(ctx,cx,cy, -18,-7,  36,14, '#E83C80', sz)  // mid
  rS(ctx,cx,cy, -13,-4,  26,8,  '#FFD23F', sz)  // inner
  rS(ctx,cx,cy, -7,-2,   14,4,  '#C01C5A', sz)  // center pattern
  // Fringe
  const s = sz / 48
  for (let i = -10; i <= 10; i += 4) {
    R(ctx, cx, cy, i*s - 1*s, -12*s, 2*s, 3*s, '#E83C80')
    R(ctx, cx, cy, i*s - 1*s,  9*s,  2*s, 3*s, '#E83C80')
  }
}

function drawLamp(ctx, cx, cy, sz) {
  // Floor lamp: base + pole + shade
  rS(ctx,cx,cy, -12,18, 24,6,  '#444466', sz)   // base
  rS(ctx,cx,cy, -2,-16, 4,36,  '#888899', sz)   // pole
  rS(ctx,cx,cy, -14,-26, 28,14,'#333344', sz)   // shade border
  rS(ctx,cx,cy, -11,-23, 22,10,'#FFE0A0', sz)   // shade inner (warm glow)
  rS(ctx,cx,cy, -8,-21, 16,6,  '#FFF0C8', sz)   // bright center of shade
  // Glow dot on floor
  ctx.globalAlpha = 0.25
  rS(ctx,cx,cy, -10,22, 20,4,  '#FFD23F', sz)
  ctx.globalAlpha = 1
}

function drawStuffedAnimal(ctx, cx, cy, sz) {
  // Teddy bear
  const tan = '#D4A07A', dark = '#B8885C', pink = '#FF9EC0'
  // Body
  rS(ctx,cx,cy, -10,0, 20,18, tan, sz)
  rS(ctx,cx,cy, -8,2, 16,14, '#E0B898', sz)  // belly lighter
  // Head
  rS(ctx,cx,cy, -9,-20, 18,18, tan, sz)
  // Ears
  rS(ctx,cx,cy, -12,-22, 7,7, dark, sz)
  rS(ctx,cx,cy, 5,-22,  7,7, dark, sz)
  rS(ctx,cx,cy, -10,-21, 4,4, pink, sz)
  rS(ctx,cx,cy, 6,-21,  4,4, pink, sz)
  // Eyes
  rS(ctx,cx,cy, -6,-14, 3,3, '#1A1040', sz)
  rS(ctx,cx,cy, 3,-14,  3,3, '#1A1040', sz)
  // Nose
  rS(ctx,cx,cy, -2,-9, 4,3, '#C06070', sz)
  // Paws
  rS(ctx,cx,cy, -14,4, 5,12, dark, sz)
  rS(ctx,cx,cy, 9,4,   5,12, dark, sz)
}

function drawWindowCurtain(ctx, cx, cy, sz) {
  // Window frame with curtains
  const wood = '#8B6340', glass = '#B8D8F0', curtain = '#E83C80'
  // Frame
  rS(ctx,cx,cy, -18,-22, 36,38, wood, sz)
  // Glass panes
  rS(ctx,cx,cy, -14,-18, 12,14, glass, sz)  // top-left pane
  rS(ctx,cx,cy, 2,-18,   12,14, glass, sz)  // top-right pane
  rS(ctx,cx,cy, -14,-2,  12,14, glass, sz)  // bottom-left pane
  rS(ctx,cx,cy, 2,-2,    12,14, glass, sz)  // bottom-right pane
  // Curtains (overlapping panes on sides)
  rS(ctx,cx,cy, -18,-22, 8,38, curtain, sz)  // left curtain
  rS(ctx,cx,cy, 10,-22,  8,38, curtain, sz)  // right curtain
  rS(ctx,cx,cy, -18,-22, 8,6,  '#FF6E9C', sz) // curtain top tie
  rS(ctx,cx,cy, 10,-22,  8,6,  '#FF6E9C', sz)
  // Outside sky visible in glass
  ctx.globalAlpha = 0.4
  rS(ctx,cx,cy, -12,-16, 9,10, '#DDEEFF', sz)
  rS(ctx,cx,cy, 3,-16,   9,10, '#DDEEFF', sz)
  ctx.globalAlpha = 1
}

function drawSmallChair(ctx, cx, cy, sz) {
  // Cozy armchair
  const wood = '#A07040', cushion = '#7F77DD', dark = '#6B4F10'
  // Back rest
  rS(ctx,cx,cy, -14,-18, 28,20, wood, sz)
  rS(ctx,cx,cy, -11,-15, 22,14, cushion, sz)  // back cushion
  // Seat
  rS(ctx,cx,cy, -14,0, 28,10, wood, sz)
  rS(ctx,cx,cy, -12,1, 24,8,  cushion, sz)    // seat cushion
  // Arms
  rS(ctx,cx,cy, -16,-6, 4,18, dark, sz)
  rS(ctx,cx,cy, 12,-6,  4,18, dark, sz)
  // Legs
  rS(ctx,cx,cy, -12,10, 4,12, dark, sz)
  rS(ctx,cx,cy, 8,10,   4,12, dark, sz)
  // Cushion highlight
  rS(ctx,cx,cy, -10,-14, 8,4, '#A09ADD', sz)
  rS(ctx,cx,cy, -10,2,   8,3, '#A09ADD', sz)
}

function drawDesk(ctx, cx, cy, sz) {
  // Study desk with a small book on top
  const wood = '#A07040', dark = '#6B4F10', lite = '#C09060'
  // Tabletop
  rS(ctx,cx,cy, -22,-10, 44,8, wood, sz)
  rS(ctx,cx,cy, -22,-10, 44,3, lite, sz)  // top shine
  // Legs (two panel sides)
  rS(ctx,cx,cy, -22,-2, 7,22, dark, sz)
  rS(ctx,cx,cy, 15,-2,  7,22, dark, sz)
  // Drawer panel
  rS(ctx,cx,cy, -13,-2, 26,14, wood, sz)
  rS(ctx,cx,cy, -3,3, 6,4, dark, sz)    // drawer knob area
  rS(ctx,cx,cy, -1,4, 2,2, '#FFD23F', sz) // knob
  // Book on top
  rS(ctx,cx,cy, 5,-18, 12,8, '#3355AA', sz)
  rS(ctx,cx,cy, 5,-18, 3,8,  '#22357A', sz)   // spine
  rS(ctx,cx,cy, 7,-19, 9,2,  '#5577BB', sz)   // pages
}

function drawToyChest(ctx, cx, cy, sz) {
  // Colorful toy chest
  const box = '#E87030', lid = '#FF9944', dark = '#A04010', gold = '#FFD23F'
  // Iso depth: right side-face + lid top-face (behind the front art)
  isoSide(ctx,cx,cy, -16,-10, 32,30, 5, '#B4581F', sz)
  isoTop(ctx,cx,cy, -17,-10, 34, 5, '#FFBB66', sz)
  // Box body
  rS(ctx,cx,cy, -16,-2, 32,22, box, sz)
  rS(ctx,cx,cy, -16,-2, 32,5,  '#F0944A', sz) // front shade
  // Lid
  rS(ctx,cx,cy, -17,-10, 34,10, lid, sz)
  rS(ctx,cx,cy, -17,-10, 34,4,  '#FFBB66', sz) // lid highlight
  // Latch on lid
  rS(ctx,cx,cy, -4,-10, 8,5, gold, sz)
  rS(ctx,cx,cy, -2,-8,  4,3, dark, sz)
  // Star on front
  rS(ctx,cx,cy, -4,4, 2,6, gold, sz)  // vertical
  rS(ctx,cx,cy, -7,6, 8,2, gold, sz)  // horizontal
  rS(ctx,cx,cy, -5,3, 2,2, gold, sz)  // diag top-left
  rS(ctx,cx,cy, 3,3,  2,2, gold, sz)  // diag top-right
  rS(ctx,cx,cy, -5,8, 2,2, gold, sz)  // diag bot-left
  rS(ctx,cx,cy, 3,8,  2,2, gold, sz)  // diag bot-right
  // Side handles
  rS(ctx,cx,cy, -18,4, 3,6, dark, sz)
  rS(ctx,cx,cy, 15,4,  3,6, dark, sz)
}

function drawBookshelf(ctx, cx, cy, sz) {
  // Wooden bookshelf with colorful books
  const wood = '#8B6340', dark = '#5C3820'
  // Iso depth: right side-face + top-face
  isoSide(ctx,cx,cy, -18,-24, 36,46, 4, '#3E2614', sz)
  isoTop(ctx,cx,cy, -18,-24, 36, 4, '#6E4A2A', sz)
  // Outer frame
  rS(ctx,cx,cy, -18,-24, 36,46, dark, sz)
  rS(ctx,cx,cy, -15,-22, 30,42, wood, sz)
  // Shelves
  rS(ctx,cx,cy, -15,-8,  30,3, dark, sz)
  rS(ctx,cx,cy, -15,8,   30,3, dark, sz)
  // Books top shelf (-22 to -8)
  const bookColors = ['#E83C3C','#3399FF','#44CC44','#FFD23F','#CC44CC','#FF9933']
  let bx = -14
  bookColors.forEach((col, i) => {
    const bw = 4 + (i % 2) * 1
    rS(ctx,cx,cy, bx,-22, bw,14, col, sz)
    rS(ctx,cx,cy, bx,-22, bw,3, '#ffffff', sz) // pages top
    bx += bw + 1
  })
  // Books mid shelf (-8 to 8)
  bx = -14
  bookColors.reverse().forEach((col, i) => {
    const bw = 4 + (i % 2) * 1
    rS(ctx,cx,cy, bx,-7, bw,14, col, sz)
    rS(ctx,cx,cy, bx,-7, bw,3, '#ffffff', sz)
    bx += bw + 1
  })
  // Bottom shelf (8 to 20) — fewer/larger books
  rS(ctx,cx,cy, -13,9, 10,12, '#E83C3C', sz)
  rS(ctx,cx,cy, -2,9,  10,12, '#3399FF', sz)
  rS(ctx,cx,cy, 9,9,   8,12,  '#44CC44', sz)
}

function drawWallArt(ctx, cx, cy, sz) {
  // Framed picture with a simple landscape
  const frame = '#B8860B', wood = '#8B6340', canvas = '#FFFBF0'
  // Outer frame (gold border)
  rS(ctx,cx,cy, -18,-22, 36,38, frame, sz)
  rS(ctx,cx,cy, -15,-19, 30,32, wood, sz)  // wooden inset
  // Canvas
  rS(ctx,cx,cy, -13,-17, 26,28, canvas, sz)
  // Sky
  rS(ctx,cx,cy, -13,-17, 26,14, '#C8E8FF', sz)
  // Sun
  rS(ctx,cx,cy, 4,-15, 6,6, '#FFD23F', sz)
  rS(ctx,cx,cy, 2,-16, 10,2, '#FFD23F', sz)  // sun rays
  rS(ctx,cx,cy, 4,-17, 6,2,  '#FFD23F', sz)
  // Cloud
  rS(ctx,cx,cy, -10,-14, 8,4, '#ffffff', sz)
  rS(ctx,cx,cy, -9,-16,  6,3, '#ffffff', sz)
  // Ground / hills
  rS(ctx,cx,cy, -13,-3, 26,14, '#5D9C55', sz)
  rS(ctx,cx,cy, -8,-6,  12,6, '#44AA38', sz)   // hill
  rS(ctx,cx,cy, 2,-4,   9,4,  '#44AA38', sz)    // hill 2
}

function drawBed(ctx, cx, cy, sz) {
  // Cozy bed (side view)
  const wood = '#8B6340', dark = '#5C3820', blanket = '#3399FF', pillow = '#EEE8FF'
  // Iso depth: right side-face along the bed body
  isoSide(ctx,cx,cy, -20,-18, 40,40, 5, '#4A2C19', sz)
  // Headboard
  rS(ctx,cx,cy, -20,-18, 40,14, wood, sz)
  rS(ctx,cx,cy, -20,-18, 40,4, '#A07040', sz)  // headboard top edge
  rS(ctx,cx,cy, -17,-13, 10,10, dark, sz)       // decorative panel L
  rS(ctx,cx,cy, 7,-13,   10,10, dark, sz)        // panel R
  // Mattress frame
  rS(ctx,cx,cy, -20,-4, 40,4, dark, sz)
  rS(ctx,cx,cy, -20,-4, 40,3, '#A07040', sz)
  // Mattress
  rS(ctx,cx,cy, -20,-1, 40,18, '#F0ECE4', sz)
  // Pillow
  rS(ctx,cx,cy, -18,0, 16,8, pillow, sz)
  rS(ctx,cx,cy, -17,1, 14,5, '#ffffff', sz)
  // Blanket
  rS(ctx,cx,cy, -20,7, 40,12, blanket, sz)
  rS(ctx,cx,cy, -20,7, 40,3,  '#66BBFF', sz)  // blanket fold
  // Footboard
  rS(ctx,cx,cy, -20,16, 40,6, wood, sz)
}

function drawFishTank(ctx, cx, cy, sz) {
  // Aquarium with fish
  const glass = '#aaddff', dark = '#223344', water = '#1e5c8a'
  // Iso depth: right side-face + top-face
  isoSide(ctx,cx,cy, -20,-22, 40,40, 4, '#16222E', sz)
  isoTop(ctx,cx,cy, -20,-22, 40, 4, '#3A5566', sz)
  // Tank border
  rS(ctx,cx,cy, -20,-22, 40,40, dark, sz)
  // Water fill
  rS(ctx,cx,cy, -18,-20, 36,36, glass, sz)
  // Deeper water beneath
  rS(ctx,cx,cy, -18,-4, 36,18, '#88BBEE', sz)
  // Sand bottom
  rS(ctx,cx,cy, -18,14, 36,4, '#C8A870', sz)
  rS(ctx,cx,cy, -14,15, 8,2, '#D4B888', sz)
  // Seaweed
  rS(ctx,cx,cy, -12,-4, 3,18, '#2D7A27', sz)
  rS(ctx,cx,cy, -10,-8, 3,8,  '#3E8C35', sz)
  rS(ctx,cx,cy, 8,-6,   3,20, '#2D7A27', sz)
  // Fish 1 (orange)
  rS(ctx,cx,cy, -9,-10, 10,6, '#FF7733', sz)
  rS(ctx,cx,cy, -11,-9, 3,4,  '#CC5500', sz)   // tail
  rS(ctx,cx,cy, -2,-9,  2,2,  '#1A1040', sz)   // eye
  // Fish 2 (blue-white)
  rS(ctx,cx,cy, 4,0,    9,5, '#5599DD', sz)
  rS(ctx,cx,cy, 12,1,   3,3, '#3377BB', sz)    // tail
  rS(ctx,cx,cy, 5,0,    2,2, '#1A1040', sz)    // eye
  // Bubbles
  rS(ctx,cx,cy, -6,-12, 2,2, '#DDEEFF', sz)
  rS(ctx,cx,cy, 6,-14,  2,2, '#DDEEFF', sz)
  // Water surface shimmer
  ctx.globalAlpha = 0.4
  rS(ctx,cx,cy, -18,-20, 36,4, '#E8F4FF', sz)
  ctx.globalAlpha = 1
  // Lid / top
  rS(ctx,cx,cy, -20,-22, 40,4, '#334455', sz)
}

function drawBookshelfWall(ctx, cx, cy, sz) {
  // Wall-mounted bookshelf: flat frame + 2 dividers (3 shelves) + alternating books
  const wood = '#8B6340', dark = '#5C3820'
  rS(ctx,cx,cy, -18,-24, 36,46, dark, sz)
  rS(ctx,cx,cy, -15,-22, 30,42, wood, sz)
  rS(ctx,cx,cy, -15,-8,  30,3, dark, sz)   // divider 1
  rS(ctx,cx,cy, -15,8,   30,3, dark, sz)   // divider 2
  const cols = ['#E83C3C','#3399FF','#44CC44','#FFD23F']
  let bx = -14
  cols.forEach(col => { rS(ctx,cx,cy, bx,-21, 6,12, col, sz); bx += 7 })
  bx = -14
  ;[...cols].reverse().forEach(col => { rS(ctx,cx,cy, bx,-6, 6,12, col, sz); bx += 7 })
  bx = -14
  cols.forEach(col => { rS(ctx,cx,cy, bx,9, 6,12, col, sz); bx += 7 })
}

function drawTrophy(ctx, cx, cy, sz) {
  // Small wall bracket shelf holding a golden trophy cup
  const wood = '#8B6340', dark = '#5C3820', gold = '#FFD23F', goldDark = '#D4A017'
  // Bracket
  rS(ctx,cx,cy, -3,2,  3,6, dark, sz)
  rS(ctx,cx,cy, -9,4,  4,3, dark, sz)
  rS(ctx,cx,cy, 5,4,   4,3, dark, sz)
  rS(ctx,cx,cy, -13,-2, 26,4, wood, sz)
  rS(ctx,cx,cy, -13,-2, 26,1, '#C09060', sz)
  // Trophy cup (sits on shelf)
  rS(ctx,cx,cy, -6,-24, 12,3, gold, sz)     // rim
  rS(ctx,cx,cy, -9,-21, 3,5,  gold, sz)     // left handle
  rS(ctx,cx,cy, 6,-21,  3,5,  gold, sz)     // right handle
  rS(ctx,cx,cy, -5,-21, 10,5, gold, sz)     // upper cup
  rS(ctx,cx,cy, -4,-16, 8,4,  goldDark, sz) // lower cup (narrower/shaded)
  rS(ctx,cx,cy, -1,-12, 2,6,  goldDark, sz) // stem
  rS(ctx,cx,cy, -5,-6,  10,3, gold, sz)     // base wide
  rS(ctx,cx,cy, -6,-3,  12,2, dark, sz)     // base foot
}

function drawFairyLights(ctx, cx, cy, sz) {
  // Horizontal wire with 9 glowing bulbs, alternating warm colors, soft glow
  const s = sz / 48
  ctx.fillStyle = '#544838'
  ctx.fillRect(cx - 20 * s, cy - 14 * s, 40 * s, 1.5 * s)
  const colors = ['#FFD23F', '#FF6E9C', '#66CCFF']
  const n = 9
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const dx = (-18 + t * 36) * s
    const dy = (-14 + Math.sin(t * Math.PI) * 3) * s
    const col = colors[i % colors.length]
    ctx.save()
    ctx.shadowColor = col
    ctx.shadowBlur = 6 * s
    ctx.fillStyle = col
    ctx.fillRect(cx + dx - 1.5 * s, cy + dy, 3 * s, 4 * s)
    ctx.restore()
  }
}

function drawWorldMapPoster(ctx, cx, cy, sz) {
  // Framed poster: ocean background + blocky continent shapes
  const frame = '#3A2818', ocean = '#4488C0', land = '#4CAF50', landDark = '#3E8C35'
  rS(ctx,cx,cy, -18,-22, 36,38, frame, sz)
  rS(ctx,cx,cy, -15,-19, 30,32, ocean, sz)
  rS(ctx,cx,cy, -13,-15, 8,6,  land, sz)
  rS(ctx,cx,cy, -12,-9,  6,5,  landDark, sz)
  rS(ctx,cx,cy, -2,-16,  10,5, land, sz)
  rS(ctx,cx,cy, 0,-10,   7,6,  landDark, sz)
  rS(ctx,cx,cy, -8,-2,   9,6,  land, sz)
  rS(ctx,cx,cy, 4,-3,    8,7,  landDark, sz)
  rS(ctx,cx,cy, -3,5,    6,4,  land, sz)
}

function drawChalkboard(ctx, cx, cy, sz) {
  // Wooden-framed chalkboard with chalk scribbles, a star, and a small doodle
  const wood = '#8B6340', board = '#1E3A2A', chalk = '#F5F0E0'
  rS(ctx,cx,cy, -18,-20, 36,32, wood, sz)
  rS(ctx,cx,cy, -15,-17, 30,26, board, sz)
  // Wavy scribble lines
  rS(ctx,cx,cy, -11,-11, 6,2, chalk, sz)
  rS(ctx,cx,cy, -6,-9,   6,2, chalk, sz)
  rS(ctx,cx,cy, -11,-7,  6,2, chalk, sz)
  // Star
  rS(ctx,cx,cy, 5,-13, 2,6, chalk, sz)
  rS(ctx,cx,cy, 2,-11, 8,2, chalk, sz)
  rS(ctx,cx,cy, 3,-13, 2,2, chalk, sz)
  rS(ctx,cx,cy, 7,-13, 2,2, chalk, sz)
  rS(ctx,cx,cy, 3,-8,  2,2, chalk, sz)
  rS(ctx,cx,cy, 7,-8,  2,2, chalk, sz)
  // Small house doodle
  rS(ctx,cx,cy, -10,2, 8,6, chalk, sz)
  rS(ctx,cx,cy, -8,-1, 4,3, chalk, sz)
  // Chalk tray + stick
  rS(ctx,cx,cy, -15,10, 30,3, wood, sz)
  rS(ctx,cx,cy, -4,8,  6,2, '#ffffff', sz)
}

function drawMirrorRound(ctx, cx, cy, sz) {
  // Round mirror: pixel-circle gold frame + slightly-lighter glass, built from
  // stacked fillRect rows (same technique as groundShadow's row list above).
  const s = sz / 48
  const gold = '#D4AF37', goldDark = '#A67C1E', glass = '#DCEAF2', glassLite = '#EFF7FC'
  const frameRows = [[-13,5],[-11,9],[-8,12],[-5,14],[-2,15],[1,15],[4,14],[7,12],[10,9],[12,5]]
  for (const [dy, hw] of frameRows) R(ctx, cx, cy, -hw*s, dy*s, hw*2*s, 3*s, gold)
  const glassRows = [[-10,7],[-7,10],[-4,12],[-1,13],[2,13],[5,12],[8,10],[11,7]]
  for (const [dy, hw] of glassRows) R(ctx, cx, cy, -hw*s, dy*s, hw*2*s, 3*s, glass)
  ctx.globalAlpha = 0.5
  R(ctx, cx, cy, -6*s, -5*s, 4*s, 10*s, glassLite)
  ctx.globalAlpha = 1
  R(ctx, cx, cy, -2*s, -17*s, 4*s, 3*s, goldDark) // hanger
}

function drawWindowDrapes(ctx, cx, cy, sz) {
  // Window with wide teal drapes (distinct variant from the original window_curtain item)
  const wood = '#8B6340', glass = '#B8D8F0', curtain = '#2E9C8C', curtainDark = '#1E7C6C', tie = '#FFD9E8'
  rS(ctx,cx,cy, -18,-22, 36,38, wood, sz)
  rS(ctx,cx,cy, -14,-18, 12,14, glass, sz)
  rS(ctx,cx,cy, 2,-18,   12,14, glass, sz)
  rS(ctx,cx,cy, -14,-2,  12,14, glass, sz)
  rS(ctx,cx,cy, 2,-2,    12,14, glass, sz)
  rS(ctx,cx,cy, -22,-24, 8,40, curtain, sz)
  rS(ctx,cx,cy, 14,-24,  8,40, curtain, sz)
  rS(ctx,cx,cy, -22,-24, 8,6,  curtainDark, sz)
  rS(ctx,cx,cy, 14,-24,  8,6,  curtainDark, sz)
  rS(ctx,cx,cy, -20,2, 5,4, tie, sz)
  rS(ctx,cx,cy, 15,2,  5,4, tie, sz)
  ctx.globalAlpha = 0.4
  rS(ctx,cx,cy, -12,-16, 9,10, '#DDEEFF', sz)
  rS(ctx,cx,cy, 3,-16,   9,10, '#DDEEFF', sz)
  ctx.globalAlpha = 1
}

function drawWallLampRight(ctx, cx, cy, sz) {
  // Bracket lamp: wall plate + arm + lampshade + warm glowing bulb
  const s = sz / 48
  const metal = '#5A5A66', shade = '#3A3A4A', shadeIn = '#FFDFA0'
  ctx.fillStyle = metal
  ctx.fillRect(cx - 3 * s, cy - 6 * s, 6 * s, 6 * s)   // wall plate
  ctx.fillRect(cx - 1 * s, cy - 4 * s, 14 * s, 3 * s)  // arm
  ctx.fillStyle = shade
  ctx.fillRect(cx + 6 * s, cy - 16 * s, 14 * s, 4 * s) // shade lower
  ctx.fillRect(cx + 8 * s, cy - 19 * s, 10 * s, 4 * s) // shade upper
  // Ambient wall glow wash
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#FFD23F'
  ctx.fillRect(cx - 2 * s, cy - 22 * s, 28 * s, 20 * s)
  ctx.restore()
  // Bulb glow
  ctx.save()
  ctx.shadowColor = '#FFD23F'
  ctx.shadowBlur = 8 * s
  ctx.fillStyle = shadeIn
  ctx.fillRect(cx + 8 * s, cy - 13 * s, 10 * s, 6 * s)
  ctx.restore()
}

function drawPhotoFrame(ctx, cx, cy, sz) {
  // Cluster of 3 small frames arranged in a triangle
  const frame = '#B8860B'
  // Top frame — landscape
  rS(ctx,cx,cy, -7,-24, 14,12, frame, sz)
  rS(ctx,cx,cy, -5,-22, 10,8, '#8FBFE0', sz)
  rS(ctx,cx,cy, -5,-16, 10,2, '#5D9C55', sz)
  // Bottom-left frame — family
  rS(ctx,cx,cy, -18,-8, 14,12, frame, sz)
  rS(ctx,cx,cy, -16,-6, 10,8, '#F0C89A', sz)
  rS(ctx,cx,cy, -13,-3, 4,5, '#5C3820', sz)
  rS(ctx,cx,cy, -9,-3,  4,5, '#8B6340', sz)
  // Bottom-right frame — pet
  rS(ctx,cx,cy, 4,-8, 14,12, frame, sz)
  rS(ctx,cx,cy, 6,-6, 10,8, '#E8C8D8', sz)
  rS(ctx,cx,cy, 9,-3, 5,5, '#D4A07A', sz)
  rS(ctx,cx,cy, 10,-5, 2,2, '#5C3820', sz)
}

function drawCuckooClock(ctx, cx, cy, sz) {
  // Wooden cuckoo clock: pointed roof, carved body, clock face + hands, little bird
  const s = sz / 48
  const wood = '#6B4A28', dark = '#4A3018', face = '#F5F0E0', gold = '#D4AF37', accent = '#8B6340'
  const roofRows = [[-26,3],[-24,6],[-22,9],[-20,12],[-18,15]]
  for (const [dy, hw] of roofRows) R(ctx, cx, cy, -hw*s, dy*s, hw*2*s, 3*s, dark)
  rS(ctx,cx,cy, -14,-18, 28,34, wood, sz)
  rS(ctx,cx,cy, -12,-16, 24,10, accent, sz)  // carved trim band
  const faceRows = [[-8,6],[-5,8],[-2,8],[1,8],[4,6]]
  for (const [dy, hw] of faceRows) R(ctx, cx, cy, -hw*s, dy*s, hw*2*s, 3*s, face)
  rS(ctx,cx,cy, -1,-6, 2,6, dark, sz)  // hour hand
  rS(ctx,cx,cy, -1,-3, 7,2, dark, sz)  // minute hand
  rS(ctx,cx,cy, -2,-4, 3,3, gold, sz)  // center pin
  rS(ctx,cx,cy, -10,8, 20,10, accent, sz)  // lower door panel
  rS(ctx,cx,cy, -3,10, 6,6, dark, sz)      // door detail
  rS(ctx,cx,cy, -3,-24, 6,4, '#8B4A2A', sz) // little bird
  rS(ctx,cx,cy, -1,-26, 2,2, gold, sz)      // beak
}

// ── SIMPLIFIED ROOM ITEMS (2026-07-07 replacement) ──────────────────────────
// Two acquisition paths, no workbench furniture item and no manual world-map
// collect button (see StateContext.jsx / WorldScreen.jsx / useBattleCombat.js):
//   1. dropOnly  — 30% chance from a defeated monster (MONSTER_DROPS below),
//      added straight to ownedRoomItems via ADD_OWNED_ROOM_ITEM. Never
//      coin-buyable, no craftGlint (they're loot, not handmade).
//   2. craftedOnly — instant-crafted in Room.jsx from auto-collected walking
//      materials (CRAFT_RECIPES below), via CRAFT_ITEM. craftGlint() marks
//      them as handmade, same convention the previous crafting system used.

// ── Monster-drop items (18) ─────────────────────────────────────────────────
function drawBunnyCushion(ctx, cx, cy, sz) {
  const pink = '#ffb8cc', lite = '#ffd8e4', ear = '#ff9ab8'
  rS(ctx,cx,cy, -16,-4, 32,14, pink, sz)
  rS(ctx,cx,cy, -16,-4, 32,4, lite, sz)
  rS(ctx,cx,cy, -10,-16, 5,14, ear, sz)
  rS(ctx,cx,cy, 5,-16,  5,14, ear, sz)
  rS(ctx,cx,cy, -9,-13, 3,10, '#ffe0ea', sz)
  rS(ctx,cx,cy, 6,-13,  3,10, '#ffe0ea', sz)
  rS(ctx,cx,cy, -3,0, 2,2, '#a85878', sz)
  rS(ctx,cx,cy, 1,0,  2,2, '#a85878', sz)
}
function drawCarrotPlanter(ctx, cx, cy, sz) {
  const pot = '#c9623f', dirt = '#5c3a1c', carrot = '#ff8a3a', leaf = '#3e8c35'
  rS(ctx,cx,cy, -9,4, 18,14, pot, sz)
  rS(ctx,cx,cy, -9,4, 18,4, '#e08050', sz)
  rS(ctx,cx,cy, -10,2, 20,3, dirt, sz)
  rS(ctx,cx,cy, -4,-10, 8,14, carrot, sz)
  rS(ctx,cx,cy, -3,-8, 3,10, '#ffab5c', sz)
  rS(ctx,cx,cy, -1,-18, 2,9, leaf, sz)
  rS(ctx,cx,cy, -4,-16, 3,8, leaf, sz)
  rS(ctx,cx,cy, 2,-16,  3,8, leaf, sz)
}
function drawSlimeLamp(ctx, cx, cy, sz) {
  const base = '#5c3a1c', teal = '#3ecfa8', lite = '#8ff0d4'
  rS(ctx,cx,cy, -10,10, 20,4, base, sz)
  ctx.save(); ctx.shadowColor = '#6ef0c8'; ctx.shadowBlur = (sz/48)*9
  rS(ctx,cx,cy, -9,-8, 18,18, teal, sz)
  rS(ctx,cx,cy, -6,-14, 12,8, teal, sz)
  ctx.restore()
  rS(ctx,cx,cy, -5,-6, 4,6, lite, sz)
  rS(ctx,cx,cy, -3,0, 2,2, '#1a4a3a', sz)
  rS(ctx,cx,cy, 2,0,  2,2, '#1a4a3a', sz)
}
function drawJellyRug(ctx, cx, cy, sz) {
  rS(ctx,cx,cy, -22,-7, 44,14, '#3ecfa8', sz)
  rS(ctx,cx,cy, -17,-5, 34,10, '#6ef0c8', sz)
  rS(ctx,cx,cy, -10,-3, 20,6,  '#a8f8e4', sz)
  const s = sz / 48
  for (let i = -16; i <= 16; i += 8) R(ctx,cx,cy, i*s, -8*s, 3*s, 3*s, '#2ea888')
}
function drawFoxPlushie(ctx, cx, cy, sz) {
  const orange = '#e8863a', white = '#fff8ee', dark = '#3a2010'
  rS(ctx,cx,cy, -8,-2, 16,16, orange, sz)
  rS(ctx,cx,cy, -5,4, 10,8, white, sz)
  rS(ctx,cx,cy, -7,-14, 14,14, orange, sz)
  rS(ctx,cx,cy, -4,-8, 8,6, white, sz)
  rS(ctx,cx,cy, -8,-20, 4,8, orange, sz)
  rS(ctx,cx,cy, 4,-20,  4,8, orange, sz)
  rS(ctx,cx,cy, -3,-11, 2,2, dark, sz)
  rS(ctx,cx,cy, 1,-11,  2,2, dark, sz)
  rS(ctx,cx,cy, -1,-7, 2,2, dark, sz)
}
function drawForestLantern(ctx, cx, cy, sz) {
  const leaf = '#3e8c35', glow = '#ffd23f'
  rS(ctx,cx,cy, -1,-16, 2,6, '#6b6b76', sz)
  rS(ctx,cx,cy, -6,-10, 12,4, leaf, sz)
  ctx.save(); ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = (sz/48)*8
  rS(ctx,cx,cy, -6,-6, 12,14, glow, sz)
  ctx.restore()
  rS(ctx,cx,cy, -6,-6, 12,3, '#8a8a96', sz)
  rS(ctx,cx,cy, -6,5, 12,3, '#8a8a96', sz)
  rS(ctx,cx,cy, -8,-11, 4,3, leaf, sz)
  rS(ctx,cx,cy, 4,-11,  4,3, leaf, sz)
}
function drawRobotShelf(ctx, cx, cy, sz) {
  const metal = '#7a7a9a', dark = '#4a4a68', bolt = '#c9a24a'
  rS(ctx,cx,cy, -18,-6, 36,5, metal, sz)
  rS(ctx,cx,cy, -18,-6, 36,2, '#a8a8c8', sz)
  rS(ctx,cx,cy, -18,9, 36,5, metal, sz)
  rS(ctx,cx,cy, -18,-6, 4,20, dark, sz)
  rS(ctx,cx,cy, 14,-6,  4,20, dark, sz)
  rS(ctx,cx,cy, -16,-5, 3,3, bolt, sz)
  rS(ctx,cx,cy, 13,-5,  3,3, bolt, sz)
  rS(ctx,cx,cy, -16,10, 3,3, bolt, sz)
  rS(ctx,cx,cy, 13,10,  3,3, bolt, sz)
  rS(ctx,cx,cy, -8,-13, 6,7, '#8a8ab0', sz)
}
function drawGearClock(ctx, cx, cy, sz) {
  const face = '#f5f0e0', metal = '#c9a24a', dark = '#5c3a1c'
  const rows = [[-14,4],[-11,8],[-8,10],[-5,11],[-2,11],[1,11],[4,10],[7,8],[10,4]]
  for (const [dy,hw] of rows) rS(ctx,cx,cy, -hw,dy, hw*2,3, face, sz)
  rS(ctx,cx,cy, -1,-2, 2,4, dark, sz)
  rS(ctx,cx,cy, -1,0, 6,1.5, dark, sz)
  rS(ctx,cx,cy, 8,4, 5,5, metal, sz)
  rS(ctx,cx,cy, -13,-9, 4,4, metal, sz)
}
function drawLeafHammock(ctx, cx, cy, sz) {
  const leaf = '#3e8c35', lite = '#5aaa3a', post = '#6b4a24'
  rS(ctx,cx,cy, -22,-16, 4,26, post, sz)
  rS(ctx,cx,cy, 18,-16,  4,26, post, sz)
  rS(ctx,cx,cy, -20,2, 40,7, leaf, sz)
  rS(ctx,cx,cy, -20,2, 40,3, lite, sz)
  const s = sz / 48
  for (let i = -16; i <= 16; i += 8) R(ctx,cx,cy, i*s, 5*s, 2*s, 3*s, '#2a6a1a')
}
function drawVineCurtain(ctx, cx, cy, sz) {
  const vine = '#3e8c35', leaf = '#5aaa3a'
  rS(ctx,cx,cy, -18,-18, 36,3, '#6b4a24', sz)
  const s = sz / 48
  for (const x of [-14, -4, 6, 16]) {
    R(ctx,cx,cy, x*s, -15*s, 2*s, 26*s, vine)
    R(ctx,cx,cy, (x-3)*s, -8*s, 4*s, 4*s, leaf)
    R(ctx,cx,cy, (x+2)*s, 0*s, 4*s, 4*s, leaf)
  }
}
function drawMushroomStool(ctx, cx, cy, sz) {
  const cap = '#e2483f', spot = '#fff0e0', stalk = '#f0e6d0'
  rS(ctx,cx,cy, -6,2, 12,14, stalk, sz)
  rS(ctx,cx,cy, -6,2, 4,14, '#d8cbb0', sz)
  rS(ctx,cx,cy, -16,-10, 32,10, cap, sz)
  rS(ctx,cx,cy, -16,-10, 32,3, '#f06a5a', sz)
  rS(ctx,cx,cy, -11,-7, 6,4, spot, sz)
  rS(ctx,cx,cy, 5,-6,  5,4, spot, sz)
}
function drawSporeLamp(ctx, cx, cy, sz) {
  const cap = '#e2483f', glow = '#ffab5c'
  rS(ctx,cx,cy, -1,-14, 2,6, '#6b6b76', sz)
  ctx.save(); ctx.shadowColor = '#ffcf8a'; ctx.shadowBlur = (sz/48)*8
  rS(ctx,cx,cy, -12,-8, 24,7, cap, sz)
  rS(ctx,cx,cy, -8,-2, 16,10, glow, sz)
  ctx.restore()
  rS(ctx,cx,cy, -12,-8, 24,2, '#f06a5a', sz)
  rS(ctx,cx,cy, -7,-6, 4,3, '#fff0e0', sz)
  rS(ctx,cx,cy, 4,-6,  4,3, '#fff0e0', sz)
}
function drawZombiePoster(ctx, cx, cy, sz) {
  const paper = '#c8bfa0', dark = '#4a4636', skull = '#e8e2d0'
  rS(ctx,cx,cy, -15,-18, 30,36, paper, sz)
  rS(ctx,cx,cy, -15,-18, 30,3, '#a89f80', sz)
  rS(ctx,cx,cy, -8,-8, 16,14, skull, sz)
  rS(ctx,cx,cy, -5,-3, 3,4, dark, sz)
  rS(ctx,cx,cy, 2,-3,  3,4, dark, sz)
  rS(ctx,cx,cy, -3,4, 6,3, dark, sz)
  rS(ctx,cx,cy, -14,12, 6,4, dark, sz)
  rS(ctx,cx,cy, 9,-16,  5,4, dark, sz)
}
function drawBoneShelf(ctx, cx, cy, sz) {
  const bone = '#e8e2d0', dark = '#8a8270'
  rS(ctx,cx,cy, -18,-4, 36,5, bone, sz)
  rS(ctx,cx,cy, -18,-4, 36,2, '#f5f0e0', sz)
  rS(ctx,cx,cy, -18,-4, 3,18, dark, sz)
  rS(ctx,cx,cy, 15,-4,  3,18, dark, sz)
  rS(ctx,cx,cy, -12,-14, 4,10, bone, sz)
  rS(ctx,cx,cy, -12,-16, 6,4, bone, sz)
  rS(ctx,cx,cy, 4,-13, 4,9, bone, sz)
}
function drawGhostLamp(ctx, cx, cy, sz) {
  const ghost = '#d8ceff'
  rS(ctx,cx,cy, -9,10, 18,4, '#6b4a28', sz)
  rS(ctx,cx,cy, -1,-2, 2,12, '#5c3a1c', sz)
  ctx.save(); ctx.shadowColor = '#c0b0ff'; ctx.shadowBlur = (sz/48)*9; ctx.globalAlpha = 0.85
  rS(ctx,cx,cy, -8,-18, 16,16, ghost, sz)
  ctx.restore()
  rS(ctx,cx,cy, -5,-12, 3,3, '#6a3acc', sz)
  rS(ctx,cx,cy, 2,-12,  3,3, '#6a3acc', sz)
}
function drawSpiritMirror(ctx, cx, cy, sz) {
  const frame = '#8a8ab0', glass = '#d8ceff'
  rS(ctx,cx,cy, -12,-16, 24,32, frame, sz)
  rS(ctx,cx,cy, -9,-13, 18,26, glass, sz)
  ctx.save(); ctx.globalAlpha = 0.5
  rS(ctx,cx,cy, -6,-10, 6,20, '#ffffff', sz)
  ctx.restore()
  rS(ctx,cx,cy, -3,-2, 3,3, '#5c3a8c', sz)
  rS(ctx,cx,cy, 1,3,  3,3, '#5c3a8c', sz)
}
function drawSnakeRug(ctx, cx, cy, sz) {
  rS(ctx,cx,cy, -22,-8, 44,16, '#3a9a3a', sz)
  rS(ctx,cx,cy, -17,-5, 34,10, '#5aba4a', sz)
  const s = sz / 48
  ctx.save(); ctx.fillStyle = 'rgba(20,60,20,0.5)'
  for (let i = -14; i <= 14; i += 6) {
    ctx.beginPath()
    ctx.moveTo(cx+i*s, cy-2*s); ctx.lineTo(cx+(i+2)*s, cy); ctx.lineTo(cx+i*s, cy+2*s); ctx.lineTo(cx+(i-2)*s, cy)
    ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}
function drawScaleShelf(ctx, cx, cy, sz) {
  const metal = '#5f9f5f', dark = '#2a6a1a'
  rS(ctx,cx,cy, -18,-6, 36,5, metal, sz)
  rS(ctx,cx,cy, -18,9, 36,5, metal, sz)
  rS(ctx,cx,cy, -18,-6, 4,20, dark, sz)
  rS(ctx,cx,cy, 14,-6,  4,20, dark, sz)
  const s = sz / 48
  ctx.fillStyle = '#3a9a3a'
  for (let i = -14; i <= 10; i += 6) {
    ctx.beginPath()
    ctx.moveTo(cx+i*s, cy-9*s); ctx.lineTo(cx+(i+3)*s, cy-6*s); ctx.lineTo(cx+i*s, cy-3*s); ctx.lineTo(cx+(i-3)*s, cy-6*s)
    ctx.closePath(); ctx.fill()
  }
}

// ── Craft-only items (6, instant recipes) ───────────────────────────────────
function drawFlowerWreath(ctx, cx, cy, sz) {
  const leaf = '#3e8c35'
  const ring = [[-16,-2],[-13,-9],[-7,-14],[0,-16],[7,-14],[13,-9],[16,-2],
                [13,5],[7,10],[0,12],[-7,10],[-13,5]]
  const cols = ['#ff6ea0','#ffd23f','#c86ff0','#ff9a5a']
  ring.forEach(([dx,dy],i) => {
    rS(ctx,cx,cy, dx-2,dy-2, 4,4, leaf, sz)
    rS(ctx,cx,cy, dx-2,dy-3, 5,5, cols[i%cols.length], sz)
    rS(ctx,cx,cy, dx-0.5,dy-1, 2,2, '#fff6c0', sz)
  })
  rS(ctx,cx,cy, -2,-20, 4,4, '#ff6ea0', sz)
  craftGlint(ctx,cx,cy,sz, 14,-12)
}
function drawMossyLog(ctx, cx, cy, sz) {
  const wood = '#6b4a28', moss = '#4a9a2a', dark = '#4a3018'
  rS(ctx,cx,cy, -20,-2, 40,12, wood, sz)
  rS(ctx,cx,cy, -20,-2, 40,3, '#8a6238', sz)
  rS(ctx,cx,cy, -20,-2, 6,12, dark, sz)
  rS(ctx,cx,cy, 14,-2,  6,12, dark, sz)
  rS(ctx,cx,cy, -18,-4, 10,4, moss, sz)
  rS(ctx,cx,cy, 2,-3, 8,3, moss, sz)
  craftGlint(ctx,cx,cy,sz, 15,-8)
}
function drawPebblePath(ctx, cx, cy, sz) {
  const dirt = '#7a6248', stone = '#8f9299', lite = '#b4b8c0'
  rS(ctx,cx,cy, -20,-8, 40,16, dirt, sz)
  const pebbles = [[-14,-4],[-4,-6],[6,-3],[14,-6],[-8,2],[2,4],[10,1]]
  for (const [dx,dy] of pebbles) {
    rS(ctx,cx,cy, dx-2,dy-2, 5,4, stone, sz)
    rS(ctx,cx,cy, dx-2,dy-2, 5,1, lite, sz)
  }
  craftGlint(ctx,cx,cy,sz, 15,-6)
}
function drawWaterBowl(ctx, cx, cy, sz) {
  const stone = '#8f9299', water = '#5fb2e8', lite = '#8fd0f4'
  rS(ctx,cx,cy, -18,-4, 36,10, stone, sz)
  rS(ctx,cx,cy, -15,-2, 30,6, water, sz)
  rS(ctx,cx,cy, -15,-2, 30,2, lite, sz)
  ctx.save(); ctx.globalAlpha = 0.5
  rS(ctx,cx,cy, -8,0, 4,2, '#ffffff', sz)
  ctx.restore()
  craftGlint(ctx,cx,cy,sz, 14,-6)
}
function drawStarLantern(ctx, cx, cy, sz) {
  const glow = '#fff2b8'
  rS(ctx,cx,cy, -1,-16, 2,6, '#c9a24a', sz)
  rS(ctx,cx,cy, -8,-10, 16,3, '#c9a24a', sz)
  ctx.save(); ctx.shadowColor = '#fff2b8'; ctx.shadowBlur = (sz/48)*9
  rS(ctx,cx,cy, -7,-7, 14,16, glow, sz)
  ctx.restore()
  rS(ctx,cx,cy, -1,-4, 2,8, '#ffd23f', sz)
  rS(ctx,cx,cy, -5,0, 10,2, '#ffd23f', sz)
  craftGlint(ctx,cx,cy,sz, 12,-16)
}
function drawMushroomRing(ctx, cx, cy, sz) {
  const cap = '#e2483f', stalk = '#f0e6d0', spot = '#fff0e0'
  const ring = [-14, -7, 0, 7, 14]
  for (const dx of ring) {
    rS(ctx,cx,cy, dx-2,6, 4,6, stalk, sz)
    rS(ctx,cx,cy, dx-5,0, 10,6, cap, sz)
    rS(ctx,cx,cy, dx-3,1, 3,2, spot, sz)
  }
  craftGlint(ctx,cx,cy,sz, 15,2)
}

// ── CATALOG ────────────────────────────────────────────────────────────────

// allowedZones controls which iso zones an item may be placed in:
//   'floor'      — sits on the diamond floor (grounded, iso side/top faces)
//   'left_wall'  — hangs flat on the on-screen LEFT (4-wide) back wall
//   'right_wall' — hangs flat on the on-screen RIGHT (6-wide) back wall
// Floor items are wrapped in withGround() so they draw a contact shadow.
export const ROOM_ITEMS = [
  // ─── SMALL (30-60 coins) ───
  { id: 'plant',          nameTh: 'ต้นไม้',      price: 30,  tier: 'small', allowedZones: ['floor'],                    draw: withGround(drawPlant) },
  { id: 'rug',            nameTh: 'พรม',          price: 40,  tier: 'small', allowedZones: ['floor'],                    draw: withGround(drawRug) },
  { id: 'lamp',           nameTh: 'โคมไฟ',        price: 45,  tier: 'small', allowedZones: ['floor'],                    draw: withGround(drawLamp) },
  { id: 'stuffed_animal', nameTh: 'ตุ๊กตา',       price: 50,  tier: 'small', allowedZones: ['floor'],                    draw: withGround(drawStuffedAnimal) },
  { id: 'window_curtain', nameTh: 'หน้าต่าง',     price: 60,  tier: 'small', allowedZones: ['left_wall', 'right_wall'],  draw: drawWindowCurtain },
  // ─── MID (150-300 coins) ───
  { id: 'small_chair',    nameTh: 'เก้าอี้',       price: 150, tier: 'mid',   allowedZones: ['floor'],                    draw: withGround(drawSmallChair) },
  { id: 'desk',           nameTh: 'โต๊ะ',          price: 180, tier: 'mid',   allowedZones: ['floor'],                    draw: withGround(drawDesk) },
  { id: 'toy_chest',      nameTh: 'กล่องของเล่น', price: 200, tier: 'mid',   allowedZones: ['floor'],                    draw: withGround(drawToyChest) },
  { id: 'bookshelf',      nameTh: 'ชั้นหนังสือ',  price: 280, tier: 'mid',   allowedZones: ['floor'],                    draw: withGround(drawBookshelf) },
  { id: 'wall_art',       nameTh: 'ภาพวาด',        price: 250, tier: 'mid',   allowedZones: ['left_wall', 'right_wall'],  draw: drawWallArt },
  // ─── BIG (500+ coins) ───
  { id: 'bed',            nameTh: 'เตียง',          price: 500, tier: 'big',   allowedZones: ['floor'],                    draw: withGround(drawBed) },
  { id: 'fish_tank',      nameTh: 'ตู้ปลา',        price: 600, tier: 'big',   allowedZones: ['floor'],                    draw: withGround(drawFishTank) },
  // ─── WALL — left_wall ───
  { id: 'fairy_lights',    nameTh: 'ไฟประดับ',   price: 80,  tier: 'small', allowedZones: ['left_wall'],  draw: drawFairyLights },
  { id: 'trophy',          nameTh: 'ถ้วยรางวัล', price: 120, tier: 'mid',   allowedZones: ['left_wall'],  draw: drawTrophy },
  { id: 'chalkboard',      nameTh: 'กระดานดำ',   price: 150, tier: 'mid',   allowedZones: ['left_wall'],  draw: drawChalkboard },
  { id: 'bookshelf_wall',  nameTh: 'ชั้นผนัง',    price: 180, tier: 'mid',   allowedZones: ['left_wall'],  draw: drawBookshelfWall },
  { id: 'world_map_poster',nameTh: 'แผนที่โลก',   price: 200, tier: 'mid',   allowedZones: ['left_wall'],  draw: drawWorldMapPoster },
  { id: 'mirror_round',    nameTh: 'กระจกกลม',    price: 220, tier: 'mid',   allowedZones: ['left_wall'],  draw: drawMirrorRound },
  // ─── WALL — right_wall ───
  { id: 'wall_lamp_right', nameTh: 'โคมผนัง',     price: 90,  tier: 'small', allowedZones: ['right_wall'], draw: drawWallLampRight },
  { id: 'photo_frame',     nameTh: 'กรอบรูป',     price: 130, tier: 'mid',   allowedZones: ['right_wall'], draw: drawPhotoFrame },
  { id: 'window_drapes',   nameTh: 'ม่านหน้าต่าง', price: 160, tier: 'mid',   allowedZones: ['right_wall'], draw: drawWindowDrapes },
  { id: 'cuckoo_clock',    nameTh: 'นาฬิกาไม้',   price: 280, tier: 'big',   allowedZones: ['right_wall'], draw: drawCuckooClock },

  // ─── MONSTER-DROP furniture (dropOnly: true → never coin-buyable; only
  //     unlocked via ADD_OWNED_ROOM_ITEM on a 30% post-battle drop roll,
  //     see MONSTER_DROPS below). `icon` is a plain emoji for compact display
  //     (victory-screen drop notification) — separate from the pixel-art `draw`. ───
  { id: 'bunny_cushion',  nameTh: 'เบาะกระต่าย',  icon: '🐰', dropOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawBunnyCushion) },
  { id: 'carrot_planter', nameTh: 'กระถางแครอท',  icon: '🥕', dropOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawCarrotPlanter) },
  { id: 'slime_lamp',     nameTh: 'โคมสไลม์',      icon: '🟢', dropOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawSlimeLamp) },
  { id: 'jelly_rug',      nameTh: 'พรมเยลลี่',     icon: '🟦', dropOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawJellyRug) },
  { id: 'fox_plushie',    nameTh: 'ตุ๊กตาจิ้งจอก', icon: '🦊', dropOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawFoxPlushie) },
  { id: 'forest_lantern', nameTh: 'โคมป่า',        icon: '🏮', dropOnly: true, tier: 'small', allowedZones: ['left_wall', 'right_wall'], draw: drawForestLantern },
  { id: 'robot_shelf',    nameTh: 'ชั้นหุ่นยนต์',  icon: '🤖', dropOnly: true, tier: 'mid',   allowedZones: ['left_wall', 'right_wall'], draw: drawRobotShelf },
  { id: 'gear_clock',     nameTh: 'นาฬิกาเฟือง',   icon: '⚙️', dropOnly: true, tier: 'mid',   allowedZones: ['left_wall', 'right_wall'], draw: drawGearClock },
  { id: 'leaf_hammock',   nameTh: 'เปลใบไม้',      icon: '🍃', dropOnly: true, tier: 'mid',   allowedZones: ['floor'], draw: withGround(drawLeafHammock) },
  { id: 'vine_curtain',   nameTh: 'ม่านเถาวัลย์',  icon: '🌿', dropOnly: true, tier: 'small', allowedZones: ['left_wall', 'right_wall'], draw: drawVineCurtain },
  { id: 'mushroom_stool', nameTh: 'เก้าอี้เห็ด',   icon: '🍄', dropOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawMushroomStool) },
  { id: 'spore_lamp',     nameTh: 'โคมสปอร์',      icon: '💡', dropOnly: true, tier: 'small', allowedZones: ['left_wall', 'right_wall'], draw: drawSporeLamp },
  { id: 'zombie_poster',  nameTh: 'โปสเตอร์ซอมบี้', icon: '🧟', dropOnly: true, tier: 'mid',   allowedZones: ['left_wall', 'right_wall'], draw: drawZombiePoster },
  { id: 'bone_shelf',     nameTh: 'ชั้นกระดูก',    icon: '🦴', dropOnly: true, tier: 'mid',   allowedZones: ['left_wall', 'right_wall'], draw: drawBoneShelf },
  { id: 'ghost_lamp',     nameTh: 'โคมผี',          icon: '👻', dropOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawGhostLamp) },
  { id: 'spirit_mirror',  nameTh: 'กระจกวิญญาณ',   icon: '🪞', dropOnly: true, tier: 'mid',   allowedZones: ['left_wall', 'right_wall'], draw: drawSpiritMirror },
  { id: 'snake_rug',      nameTh: 'พรมงู',          icon: '🐍', dropOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawSnakeRug) },
  { id: 'scale_shelf',    nameTh: 'ชั้นเกล็ด',      icon: '🛡️', dropOnly: true, tier: 'mid',   allowedZones: ['left_wall', 'right_wall'], draw: drawScaleShelf },

  // ─── CRAFT-ONLY furniture (craftedOnly: true → never coin-buyable; instant
  //     CRAFT_ITEM from auto-collected walking materials, see CRAFT_RECIPES). ───
  { id: 'flower_wreath', nameTh: 'พวงดอกไม้',   icon: '🌸', craftedOnly: true, tier: 'small', allowedZones: ['left_wall', 'right_wall'], draw: drawFlowerWreath },
  { id: 'mossy_log',     nameTh: 'ท่อนไม้มอส',  icon: '🪵', craftedOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawMossyLog) },
  { id: 'pebble_path',   nameTh: 'ทางเดินหิน',  icon: '🪨', craftedOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawPebblePath) },
  { id: 'water_bowl',    nameTh: 'อ่างน้ำ',      icon: '💧', craftedOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawWaterBowl) },
  { id: 'star_lantern',  nameTh: 'โคมดาว',       icon: '⭐', craftedOnly: true, tier: 'small', allowedZones: ['left_wall', 'right_wall'], draw: drawStarLantern },
  { id: 'mushroom_ring', nameTh: 'วงแหวนเห็ด',   icon: '🍄', craftedOnly: true, tier: 'small', allowedZones: ['floor'], draw: withGround(drawMushroomRing) },
]

// ── MATERIALS ────────────────────────────────────────────────────────────────
// Material display meta (icon-first — a pre-reader recognises the emoji). Keys
// match state.materials. Order defines HUD display order.
export const MATERIALS = [
  { id: 'flower',   icon: '🌸', nameTh: 'ดอกไม้' },
  { id: 'wood',     icon: '🪵', nameTh: 'ไม้' },
  { id: 'stone',    icon: '🪨', nameTh: 'หิน' },
  { id: 'water',    icon: '💧', nameTh: 'น้ำ' },
  { id: 'stardust', icon: '⭐', nameTh: 'ผงดาว' },
  { id: 'mushroom', icon: '🍄', nameTh: 'เห็ด' },
  // Added 2026-07-08 for the visible map-collectible snow node. No craft
  // recipe yet (CRAFT_RECIPES below is unrelated to this task's scope) —
  // it accumulates in state.materials like the others, just nothing spends
  // it yet.
  { id: 'crystal',  icon: '❄️', nameTh: 'คริสตัล' },
]
export const MATERIAL_ICON = MATERIALS.reduce((m, x) => (m[x.id] = x.icon, m), {})

// ── Monster drops ────────────────────────────────────────────────────────────
// Enemy type (drawEnemy.js / enemyConfig.js keys) → candidate drop items.
// Consumed by useBattleCombat.js's showVictory() on a 30%-per-win roll.
// SPEC GAME-B §B.1 (2026-07-10) adds 2 drop-only COSMETIC items (turtle_shell/
// ninja_suit — see src/egg/eggCosmeticLayer.js COSMETIC_ITEMS) as a 3rd
// candidate on top of each enemy's existing 2 furniture drops, rather than a
// separate drop system — literally extends MONSTER_DROPS per the spec's own
// instruction. Enemy picks are a thematic judgment call (documented in
// CHATBOT_NOTES.md): turtle_shell → snake (reptile theme), ninja_suit →
// fox_kit (foxes read as sly/agile, closest thing to "stealthy" this enemy
// roster has — no enemy is literally ninja-themed).
export const MONSTER_DROPS = {
  sleepy_bunny: ['bunny_cushion', 'carrot_planter'],
  bouncy_slime: ['slime_lamp', 'jelly_rug'],
  fox_kit:      ['fox_plushie', 'forest_lantern', 'ninja_suit'],
  egg_pawn:     ['robot_shelf', 'gear_clock'],
  leaf_sprite:  ['leaf_hammock', 'vine_curtain'],
  mushroom_imp: ['mushroom_stool', 'spore_lamp'],
  baby_zombie:  ['zombie_poster', 'bone_shelf'],
  ghost_wisp:   ['ghost_lamp', 'spirit_mirror'],
  snake:        ['snake_rug', 'scale_shelf', 'turtle_shell'],
}

// ── Craft recipes ────────────────────────────────────────────────────────────
// Keyed by the crafted item's id. Each value maps a material id → required
// count. Consumed by CRAFT_ITEM (StateContext) and Room.jsx's craft sheet.
// SPEC GAME-B §B.1 (2026-07-10) adds 2 craft-only COSMETIC items (
// butterfly_wings/mini_umbrella — see eggCosmeticLayer.js COSMETIC_ITEMS) to
// this SAME shared recipe table, per the spec's own instruction — CRAFT_ITEM
// (StateContext.jsx) routes the crafted item into ownedItems vs
// ownedRoomItems depending on which catalog it actually belongs to.
export const CRAFT_RECIPES = {
  flower_wreath:    { flower: 4 },
  mossy_log:        { wood: 3 },
  pebble_path:      { stone: 3 },
  water_bowl:       { water: 3 },
  star_lantern:     { stardust: 4 },
  mushroom_ring:    { mushroom: 3 },
  butterfly_wings:  { flower: 4, stardust: 2 },
  mini_umbrella:    { wood: 3, water: 2 },
}

export const CRAFT_RECIPE_LIST = [
  'flower_wreath', 'mossy_log', 'pebble_path', 'water_bowl', 'star_lantern', 'mushroom_ring',
  'butterfly_wings', 'mini_umbrella',
]

// ── Wallpaper & Flooring (SPEC GAME-B §B.2, 2026-07-10) ─────────────────────
// A NEW per-room-wide (not per-slot) cosmetic category — applies to the whole
// room, not one furniture slot, so it's a separate catalog from ROOM_ITEMS.
// Each entry's `draw` is a PATTERN PAINTER, deliberately decoupled from
// roomScene.js's iso/projection math (same self-contained style as every
// other draw fn in this file) — it receives a plain rectangle to fill:
//   wallpaper: draw(ctx, {x,y,w,h})            — roomScene.js clips to the
//              real wall-face polygon first, then calls this with its bbox
//   flooring:  draw(ctx, {x,y,w,h}, light)      — called once per floor tile
//              (light = the existing checkerboard-parity boolean, optional
//              to use for 2-tone variation within the pattern itself)
// `null` on a room (the default) means "use the theme's own base fill" —
// these patterns REPLACE that base fill when set, per the spec's own wording;
// roomScene.js still layers wallPolish/grid/vignette/decor on top either way.
function wallpaperStripes(ctx, { x, y, w, h }, bg, stripe, stripeW = 10) {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = stripe
  for (let dx = 0; dx < w + h; dx += stripeW * 2) ctx.fillRect(x + dx, y, stripeW, h)
}
function wallpaperDots(ctx, { x, y, w, h }, bg, dot, spacing = 16, r = 3) {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = dot
  for (let dy = spacing / 2; dy < h; dy += spacing) {
    for (let dx = spacing / 2; dx < w; dx += spacing) {
      ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill()
    }
  }
}
function wallpaperPlaid(ctx, { x, y, w, h }, bg, line) {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.globalAlpha = 0.5
  for (let dx = 0; dx < w; dx += 14) { ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x + dx, y + h); ctx.stroke() }
  for (let dy = 0; dy < h; dy += 14) { ctx.beginPath(); ctx.moveTo(x, y + dy); ctx.lineTo(x + w, y + dy); ctx.stroke() }
  ctx.globalAlpha = 1
}
function wallpaperHearts(ctx, { x, y, w, h }, bg, heart, spacing = 20) {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = heart
  for (let dy = spacing / 2; dy < h; dy += spacing) {
    for (let dx = spacing / 2; dx < w; dx += spacing) {
      const hx = x + dx, hy = y + dy, s = 2.5
      ctx.fillRect(hx - s * 1.5, hy - s * 0.5, s, s)
      ctx.fillRect(hx + s * 0.5, hy - s * 0.5, s, s)
      ctx.fillRect(hx - s * 0.5, hy - s * 1.5, s, s)
      ctx.fillRect(hx - s * 0.5, hy + s * 0.5, s, s)
      ctx.fillRect(hx - s * 0.5, hy - s * 0.5, s, s)
    }
  }
}
function wallpaperClouds(ctx, { x, y, w, h }, bg, cloud, spacing = 30) {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = cloud
  for (let dy = spacing / 2; dy < h; dy += spacing) {
    for (let dx = spacing / 2; dx < w; dx += spacing) {
      const cx2 = x + dx, cy2 = y + dy
      ctx.beginPath()
      ctx.arc(cx2 - 4, cy2, 3.5, 0, Math.PI * 2)
      ctx.arc(cx2 + 4, cy2, 3.5, 0, Math.PI * 2)
      ctx.arc(cx2, cy2 - 2, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
// bg: pass null to skip the background fill (caller already painted one).
function wallpaperStars(ctx, { x, y, w, h }, bg, star, n = 30) {
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(x, y, w, h) }
  ctx.fillStyle = star
  for (let i = 0; i < n; i++) {
    const sx = x + ((i * 53.7) % w), sy = y + ((i * 97.3) % h)
    const s = i % 3 === 0 ? 2 : 1
    ctx.fillRect(sx, sy, s, s)
  }
}

// `swatch` — a single representative hex color, used for the small
// (72x80 thumbnail) room-preview render path where the real pattern would
// just read as noise, and for the item-picker card icon.
export const WALLPAPER_ITEMS = [
  { id: 'stripes_pink', nameTh: 'ลายทางชมพู', price: 80,  tier: 'small', swatch: '#ffcfe0', draw: (ctx, r) => wallpaperStripes(ctx, r, '#ffe0ec', '#ffb3cf') },
  { id: 'stars_navy',   nameTh: 'ลายดาวน้ำเงิน', price: 100, tier: 'small', swatch: '#1b2a4a', draw: (ctx, r) => wallpaperStars(ctx, r, '#1b2a4a', '#ffffff', 30) },
  { id: 'polka_mint',   nameTh: 'ลายจุดมิ้นต์', price: 90,  tier: 'small', swatch: '#d8f5ea', draw: (ctx, r) => wallpaperDots(ctx, r, '#d8f5ea', '#ffffff') },
  { id: 'gingham_brown',nameTh: 'ลายตารางน้ำตาล', price: 120, tier: 'mid', swatch: '#e0c898', draw: (ctx, r) => wallpaperPlaid(ctx, r, '#f0e0c0', '#a87c3c') },
  { id: 'clouds_sky',   nameTh: 'ลายเมฆฟ้า', price: 150, tier: 'mid', swatch: '#cfe9ff', draw: (ctx, r) => wallpaperClouds(ctx, r, '#cfe9ff', '#ffffff') },
  { id: 'rainbow_stripe', nameTh: 'ลายทางรุ้ง', price: null, tier: 'mid', acquirable: 'craft', swatch: '#ffb84d', draw: (ctx, r) => {
    const cols = ['#ff6e6e', '#ffb84d', '#ffe066', '#7dffa0', '#6ecbff', '#c78cff']
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(r.x, r.y, r.w, r.h)
    let i = 0
    for (let dx = 0; dx < r.w + r.h; dx += 8) { ctx.fillStyle = cols[i++ % cols.length]; ctx.fillRect(r.x + dx, r.y, 8, r.h) }
  } },
  { id: 'hearts_pastel', nameTh: 'ลายหัวใจพาสเทล', price: null, tier: 'small', acquirable: 'craft', swatch: '#ffdce8', draw: (ctx, r) => wallpaperHearts(ctx, r, '#fff0f5', '#ffaacb') },
  { id: 'galaxy_dream',  nameTh: 'ลายกาแล็กซี่', price: null, tier: 'big', acquirable: 'event', swatch: '#241b4a', draw: (ctx, r) => {
    ctx.fillStyle = '#241b4a'; ctx.fillRect(r.x, r.y, r.w, r.h)
    wallpaperStars(ctx, r, null, '#e8ddff', 26) // null bg: background already painted above
  } },
]
export const WALLPAPER_BY_ID = WALLPAPER_ITEMS.reduce((m, i) => (m[i.id] = i, m), {})

function flooringChecker(ctx, { x, y, w, h }, light, colA, colB) {
  ctx.fillStyle = light ? colA : colB
  ctx.fillRect(x, y, w, h)
}
function flooringPlanks(ctx, { x, y, w, h }, light) {
  ctx.fillStyle = light ? '#c9915a' : '#b87d46'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = 'rgba(70,40,10,0.25)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(x, y + h * 0.5); ctx.lineTo(x + w, y + h * 0.5); ctx.stroke()
}
function flooringSpeckle(ctx, { x, y, w, h }, base, speck, n = 4) {
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = speck
  for (let i = 0; i < n; i++) {
    const sx = x + ((i * 37.1) % w), sy = y + ((i * 61.7) % h)
    ctx.fillRect(sx, sy, 2, 2)
  }
}

export const FLOORING_ITEMS = [
  { id: 'wood_planks',   nameTh: 'พื้นไม้',       price: 90,  tier: 'small', swatch: '#c9915a', draw: (ctx, r, light) => flooringPlanks(ctx, r, light) },
  { id: 'checker_mono',  nameTh: 'พื้นลายตาราง',  price: 80,  tier: 'small', swatch: '#c8c8c8', draw: (ctx, r, light) => flooringChecker(ctx, r, light, '#f2f2f2', '#2a2a2a') },
  { id: 'pebble_floor',  nameTh: 'พื้นกรวด',      price: 100, tier: 'small', swatch: '#bfbaae', draw: (ctx, r, light) => flooringSpeckle(ctx, r, light ? '#c9c4b8' : '#b6b0a2', '#8a8478', 5) },
  { id: 'grass_patch',   nameTh: 'พื้นหญ้า',      price: 110, tier: 'mid',   swatch: '#6fbe4a', draw: (ctx, r, light) => flooringSpeckle(ctx, r, light ? '#6fbe4a' : '#5fae3a', '#4a8c2a', 6) },
  { id: 'star_tile',     nameTh: 'พื้นลายดาว',    price: 140, tier: 'mid',   swatch: '#243258', draw: (ctx, r, light) => flooringSpeckle(ctx, r, light ? '#2a3a6a' : '#1e2a52', '#ffe066', 3) },
  { id: 'rainbow_tile',  nameTh: 'พื้นลายรุ้ง',   price: null, tier: 'mid', acquirable: 'craft', swatch: '#7dffa0', draw: (ctx, r) => {
    const cols = ['#ff6e6e', '#ffb84d', '#ffe066', '#7dffa0', '#6ecbff', '#c78cff']
    ctx.fillStyle = cols[Math.floor((r.x + r.y) / 20) % cols.length]
    ctx.fillRect(r.x, r.y, r.w, r.h)
  } },
  { id: 'cloud_carpet',  nameTh: 'พรมเมฆนุ่ม',    price: null, tier: 'small', acquirable: 'craft', swatch: '#eaf6ff', draw: (ctx, r, light) => flooringSpeckle(ctx, r, light ? '#eaf6ff' : '#dcefff', '#ffffff', 4) },
  { id: 'galaxy_floor',  nameTh: 'พื้นกาแล็กซี่', price: null, tier: 'big', acquirable: 'event', swatch: '#241948', draw: (ctx, r, light) => flooringSpeckle(ctx, r, light ? '#2a1f52' : '#1c1440', '#e8ddff', 5) },
]
export const FLOORING_BY_ID = FLOORING_ITEMS.reduce((m, i) => (m[i.id] = i, m), {})

// ── Cozy Room craft recipes (SPEC GAME-B §B.2) — kept in a SEPARATE table
// from CRAFT_RECIPES/CRAFT_RECIPE_LIST above (which is furniture+cosmetics
// only) since wallpaper/flooring are a different acquisition target
// (rooms[i].wallpaper/flooring, not ownedRoomItems/ownedItems) — StateContext's
// APPLY_WALLPAPER/APPLY_FLOORING-craft path looks these up separately so the
// existing CRAFT_ITEM reducer's ownedItems/ownedRoomItems branching (§B.1)
// doesn't need a 3rd branch.
export const COZY_CRAFT_RECIPES = {
  rainbow_stripe: { stardust: 3, crystal: 2 },
  hearts_pastel:  { flower: 3, mushroom: 2 },
  rainbow_tile:   { stardust: 2, stone: 3 },
  cloud_carpet:   { water: 3, flower: 2 },
}
export const COZY_CRAFT_RECIPE_LIST = ['rainbow_stripe', 'hearts_pastel', 'rainbow_tile', 'cloud_carpet']

// ── Furniture interactions (SPEC GAME-B §B.2) ────────────────────────────────
// Data-driven map: DecoratedRoom.jsx's idle/wander AI reads this to know
// which placed furniture ids it can walk to and interact with, which egg
// pose to hold (see src/egg/eggPoses.js's 15-pose vocabulary), for how long,
// and any one-shot particle to spawn. `weight` biases how often that specific
// interaction gets picked relative to the others when several are available
// in the current room (plain wander still dominates — see nextIdleDecision).
export const FURNITURE_INTERACTIONS = {
  bed:        { pose: 'sleep', duration: 6, weight: 1, particle: null },
  small_chair:{ pose: 'sit', duration: 5, weight: 2, particle: null },
  plant:      { pose: 'curious_tilt', duration: 3, weight: 2, particle: 'water' },
  carrot_planter: { pose: 'curious_tilt', duration: 3, weight: 1, particle: 'water' },
  fish_tank:  { pose: 'curious_tilt', duration: 4, weight: 2, particle: null },
  rug:        { pose: 'sleep', duration: 5, weight: 2, particle: null },
  jelly_rug:  { pose: 'sleep', duration: 4, weight: 1, particle: null },
  bunny_cushion: { pose: 'sit', duration: 4, weight: 1, particle: null },
}
