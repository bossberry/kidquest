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

// ── CRAFTING: the workbench + 15 craftable furniture pieces ─────────────────
// crafting_table is a NORMAL bought item (coins). The 15 below are craftedOnly —
// unlocked only by CRAFT_ITEM at the table, never coin-buyable — each carries a
// subtle craftGlint() so it reads as handmade.

function drawCraftingTable(ctx, cx, cy, sz) {
  const wood = '#9a6a38', dark = '#5c3a1c', lite = '#b8834a', metal = '#8a8a96'
  isoSide(ctx,cx,cy, -20,-6, 40,10, 5, '#4a2c14', sz)
  isoTop(ctx,cx,cy, -20,-6, 40, 5, lite, sz)
  rS(ctx,cx,cy, -20,-6, 40,10, wood, sz)      // tabletop
  rS(ctx,cx,cy, -20,-6, 40,3,  lite, sz)
  rS(ctx,cx,cy, -18,4, 6,16, dark, sz)         // legs
  rS(ctx,cx,cy, 12,4,  6,16, dark, sz)
  rS(ctx,cx,cy, -16,4, 32,4,  dark, sz)        // apron
  // hammer
  rS(ctx,cx,cy, -13,-16, 3,10, '#6b4a28', sz)
  rS(ctx,cx,cy, -17,-18, 9,5,  metal, sz)
  rS(ctx,cx,cy, -17,-18, 9,2,  '#c0c0cc', sz)
  // saw
  rS(ctx,cx,cy, 2,-13, 11,3, metal, sz)
  rS(ctx,cx,cy, 2,-13, 11,1, '#c0c0cc', sz)
  rS(ctx,cx,cy, 13,-14, 4,4, '#6b4a28', sz)
  // gear
  rS(ctx,cx,cy, -5,-13, 7,7, '#c9a24a', sz)
  rS(ctx,cx,cy, -3,-11, 3,3, dark, sz)
  craftGlint(ctx,cx,cy,sz, 16,-18)
}

function drawWoodenChair(ctx, cx, cy, sz) {
  const wood = '#a9773f', dark = '#6b4a24', lite = '#c49a5e'
  rS(ctx,cx,cy, -10,-20, 20,4, wood, sz)       // top rail
  rS(ctx,cx,cy, -10,-16, 4,18, wood, sz)        // back post L
  rS(ctx,cx,cy, 6,-16,  4,18, wood, sz)         // back post R
  rS(ctx,cx,cy, -8,-12, 16,3, dark, sz)          // mid rail
  rS(ctx,cx,cy, -12,0, 24,6, wood, sz)           // seat
  rS(ctx,cx,cy, -12,0, 24,2, lite, sz)
  rS(ctx,cx,cy, -11,6, 4,14, dark, sz)           // legs
  rS(ctx,cx,cy, 7,6,  4,14, dark, sz)
  craftGlint(ctx,cx,cy,sz, 12,-18)
}

function drawStoneTable(ctx, cx, cy, sz) {
  const stone = '#8f9299', dark = '#5f636b', lite = '#b4b8c0'
  isoSide(ctx,cx,cy, -20,-8, 40,8, 5, '#4a4d54', sz)
  isoTop(ctx,cx,cy, -20,-8, 40, 5, lite, sz)
  rS(ctx,cx,cy, -20,-8, 40,8, stone, sz)         // top slab
  rS(ctx,cx,cy, -20,-8, 40,3, lite, sz)
  rS(ctx,cx,cy, -8,0, 16,18, stone, sz)          // stone pedestal
  rS(ctx,cx,cy, -8,0, 5,18, dark, sz)
  rS(ctx,cx,cy, -12,18, 24,4, dark, sz)          // base
  rS(ctx,cx,cy, -18,-6, 5,3, dark, sz)           // chips
  rS(ctx,cx,cy, 12,-5,  4,3, dark, sz)
  craftGlint(ctx,cx,cy,sz, 15,-12)
}

function drawFlowerVase(ctx, cx, cy, sz) {
  const vase = '#4aa3c4', vaseLite = '#7fc8e2', stem = '#3e8c35'
  rS(ctx,cx,cy, -8,2, 16,18, vase, sz)           // vase body
  rS(ctx,cx,cy, -8,2, 5,18, vaseLite, sz)
  rS(ctx,cx,cy, -9,0, 18,4, vaseLite, sz)         // rim
  rS(ctx,cx,cy, -6,18, 12,3, '#2e6f88', sz)       // base
  // stems
  rS(ctx,cx,cy, -1,-14, 2,16, stem, sz)
  rS(ctx,cx,cy, -8,-8, 2,10, stem, sz)
  rS(ctx,cx,cy, 6,-10, 2,12, stem, sz)
  // blossoms
  const blooms = [[-1,-20,'#ff6ea0'],[-8,-14,'#ffd23f'],[6,-16,'#c86ff0']]
  for (const [bx,by,col] of blooms) {
    rS(ctx,cx,cy, bx-3,by, 6,6, col, sz)
    rS(ctx,cx,cy, bx-1,by+2, 2,2, '#fff6c0', sz)
  }
  craftGlint(ctx,cx,cy,sz, 12,-20)
}

function drawMushroomLamp(ctx, cx, cy, sz) {
  const stalk = '#f0e6d0', cap = '#e2483f', spot = '#fff0e0'
  rS(ctx,cx,cy, -6,-2, 12,20, stalk, sz)          // stalk
  rS(ctx,cx,cy, -6,-2, 4,20, '#d8cbb0', sz)
  rS(ctx,cx,cy, -9,18, 18,4, '#c8b898', sz)        // base
  // glowing cap
  ctx.save(); ctx.shadowColor = '#ff8a5a'; ctx.shadowBlur = (sz/48)*8
  rS(ctx,cx,cy, -15,-14, 30,12, cap, sz)
  ctx.restore()
  rS(ctx,cx,cy, -15,-6, 30,4, '#b83029', sz)       // cap underside
  rS(ctx,cx,cy, -10,-13, 6,4, spot, sz)            // spots
  rS(ctx,cx,cy, 4,-12,  5,4, spot, sz)
  rS(ctx,cx,cy, -2,-9,  4,3, spot, sz)
  craftGlint(ctx,cx,cy,sz, 13,-14)
}

function drawCrystalBall(ctx, cx, cy, sz) {
  const stand = '#6b4a28', dark = '#4a3018', glass = '#a8e0f0'
  rS(ctx,cx,cy, -10,10, 20,8, stand, sz)          // stand
  rS(ctx,cx,cy, -10,10, 20,3, '#8a6238', sz)
  rS(ctx,cx,cy, -6,16, 12,4, dark, sz)
  // glowing orb (pixel circle)
  ctx.save(); ctx.shadowColor = '#8fdcff'; ctx.shadowBlur = (sz/48)*9
  const rows = [[-14,5],[-11,9],[-8,11],[-5,12],[-2,12],[1,11],[4,9],[7,5]]
  for (const [dy,hw] of rows) rS(ctx,cx,cy, -hw,dy, hw*2,3, glass, sz)
  ctx.restore()
  ctx.globalAlpha = 0.6
  rS(ctx,cx,cy, -7,-10, 4,8, '#eafaff', sz)        // shine
  ctx.globalAlpha = 1
  rS(ctx,cx,cy, -3,-4, 3,3, '#ffffff', sz)         // sparkle inside
  craftGlint(ctx,cx,cy,sz, 12,-14)
}

function drawStarMobile(ctx, cx, cy, sz) {
  const bar = '#8a8a96', str = '#b0b0bc'
  rS(ctx,cx,cy, -1,-2, 2,22, '#6b6b76', sz)        // stand pole
  rS(ctx,cx,cy, -8,20, 16,4, '#5a5a64', sz)        // base
  rS(ctx,cx,cy, -16,-4, 32,2, bar, sz)             // cross bar
  const stars = [[-14,'#ffd23f'],[-4,'#ff6ea0'],[6,'#7fc8e2'],[14,'#c86ff0']]
  for (const [bx,col] of stars) {
    rS(ctx,cx,cy, bx,-2, 1,5, str, sz)             // string
    rS(ctx,cx,cy, bx-0.5,4, 2,6, col, sz)          // star: vert
    rS(ctx,cx,cy, bx-3,6, 7,2, col, sz)            // star: horiz
    rS(ctx,cx,cy, bx-2,4, 2,2, col, sz)
    rS(ctx,cx,cy, bx+1,4, 2,2, col, sz)
  }
  craftGlint(ctx,cx,cy,sz, 15,-6)
}

function drawMossRug(ctx, cx, cy, sz) {
  rS(ctx,cx,cy, -22,-9, 44,18, '#2f6b2a', sz)      // outer
  rS(ctx,cx,cy, -18,-6, 36,12, '#3e8c35', sz)      // mid
  rS(ctx,cx,cy, -12,-3, 24,6,  '#52aa48', sz)      // inner
  // moss tufts + tiny flowers
  const s = sz/48
  for (let i = -16; i <= 16; i += 5) {
    R(ctx,cx,cy, i*s, -7*s, 2*s, 2*s, '#66c256')
    R(ctx,cx,cy, i*s,  5*s, 2*s, 2*s, '#66c256')
  }
  rS(ctx,cx,cy, -6,-1, 3,3, '#ff6ea0', sz)
  rS(ctx,cx,cy, 4,0,   3,3, '#ffd23f', sz)
  craftGlint(ctx,cx,cy,sz, 16,-9)
}

function drawStoneFountain(ctx, cx, cy, sz) {
  const stone = '#8f9299', dark = '#5f636b', water = '#5fb2e8'
  rS(ctx,cx,cy, -20,10, 40,10, stone, sz)          // basin
  rS(ctx,cx,cy, -20,10, 40,3, '#b4b8c0', sz)
  rS(ctx,cx,cy, -18,13, 36,5, water, sz)           // water pool
  rS(ctx,cx,cy, -18,13, 36,2, '#8fd0f4', sz)
  rS(ctx,cx,cy, -6,-6, 12,18, stone, sz)           // center column
  rS(ctx,cx,cy, -6,-6, 4,18, dark, sz)
  rS(ctx,cx,cy, -10,-10, 20,5, stone, sz)          // upper bowl
  rS(ctx,cx,cy, -10,-10, 20,2, '#b4b8c0', sz)
  // spouting water
  ctx.save(); ctx.globalAlpha = 0.75
  rS(ctx,cx,cy, -1,-18, 2,8, '#8fd0f4', sz)
  rS(ctx,cx,cy, -7,-6, 2,14, water, sz)
  rS(ctx,cx,cy, 5,-6,  2,14, water, sz)
  ctx.restore()
  // flowers on the rim
  rS(ctx,cx,cy, -16,8, 3,3, '#ff6ea0', sz)
  rS(ctx,cx,cy, 13,8,  3,3, '#ffd23f', sz)
  craftGlint(ctx,cx,cy,sz, 15,-14)
}

function drawIceSculpture(ctx, cx, cy, sz) {
  const ice = '#bfe8f5', iceLite = '#eafaff', iceDark = '#8fc4d8'
  rS(ctx,cx,cy, -12,16, 24,4, iceDark, sz)         // stone base
  ctx.save(); ctx.shadowColor = '#cdeefb'; ctx.shadowBlur = (sz/48)*7
  // faceted crystal figure
  rS(ctx,cx,cy, -6,2, 12,16, ice, sz)
  rS(ctx,cx,cy, -8,-6, 16,10, ice, sz)
  rS(ctx,cx,cy, -4,-18, 8,14, ice, sz)
  ctx.restore()
  rS(ctx,cx,cy, -6,2, 4,16, iceLite, sz)           // left highlight
  rS(ctx,cx,cy, -4,-18, 3,14, iceLite, sz)
  rS(ctx,cx,cy, 2,-6, 5,10, iceDark, sz)           // right shade
  rS(ctx,cx,cy, -2,-20, 3,3, '#ffffff', sz)        // tip shine
  craftGlint(ctx,cx,cy,sz, 12,-20)
}

// ── Wall crafted items ──
function drawFlowerWreath(ctx, cx, cy, sz) {
  const leaf = '#3e8c35'
  // ring of petals (pixel circle of blossoms)
  const ring = [[-16,-2],[-13,-9],[-7,-14],[0,-16],[7,-14],[13,-9],[16,-2],
                [13,5],[7,10],[0,12],[-7,10],[-13,5]]
  const cols = ['#ff6ea0','#ffd23f','#c86ff0','#ff9a5a']
  ring.forEach(([dx,dy],i) => {
    rS(ctx,cx,cy, dx-2,dy-2, 4,4, leaf, sz)
    rS(ctx,cx,cy, dx-2,dy-3, 5,5, cols[i%cols.length], sz)
    rS(ctx,cx,cy, dx-0.5,dy-1, 2,2, '#fff6c0', sz)
  })
  rS(ctx,cx,cy, -2,-20, 4,4, '#ff6ea0', sz)        // top bow
  craftGlint(ctx,cx,cy,sz, 14,-12)
}

function drawStoneRelief(ctx, cx, cy, sz) {
  const stone = '#8f9299', dark = '#5f636b', lite = '#b4b8c0'
  rS(ctx,cx,cy, -18,-20, 36,40, stone, sz)         // slab
  rS(ctx,cx,cy, -18,-20, 36,3, lite, sz)
  rS(ctx,cx,cy, -18,17, 36,3, dark, sz)
  // carved spiral/face motif
  rS(ctx,cx,cy, -10,-12, 20,3, dark, sz)
  rS(ctx,cx,cy, -10,-12, 3,16, dark, sz)
  rS(ctx,cx,cy, 7,-12,  3,16, dark, sz)
  rS(ctx,cx,cy, -6,0, 12,3, dark, sz)
  rS(ctx,cx,cy, -3,-6, 6,6, lite, sz)               // gem inset
  rS(ctx,cx,cy, -2,-5, 3,3, '#7fc8e2', sz)
  // border cracks
  rS(ctx,cx,cy, -14,6, 2,8, dark, sz)
  rS(ctx,cx,cy, 12,-6, 2,8, dark, sz)
  craftGlint(ctx,cx,cy,sz, 13,-16)
}

function drawWoodShelf(ctx, cx, cy, sz) {
  const wood = '#a9773f', dark = '#6b4a24', lite = '#c49a5e'
  rS(ctx,cx,cy, -18,-6, 36,5, wood, sz)            // top shelf plank
  rS(ctx,cx,cy, -18,-6, 36,2, lite, sz)
  rS(ctx,cx,cy, -18,10, 36,5, wood, sz)            // bottom shelf plank
  rS(ctx,cx,cy, -18,10, 36,2, lite, sz)
  rS(ctx,cx,cy, -18,-6, 4,21, dark, sz)             // side supports
  rS(ctx,cx,cy, 14,-6,  4,21, dark, sz)
  // little items on shelves
  rS(ctx,cx,cy, -12,-14, 5,8, '#e83c3c', sz)        // book
  rS(ctx,cx,cy, -6,-13,  5,7, '#3399ff', sz)
  rS(ctx,cx,cy, 2,-14,   4,8, '#44cc44', sz)
  rS(ctx,cx,cy, 8,-12,   6,6, '#3e8c35', sz)         // plant
  rS(ctx,cx,cy, -10,2, 6,6, '#ffd23f', sz)          // star trinket
  rS(ctx,cx,cy, 4,3, 7,5, '#c9623f', sz)            // pot
  craftGlint(ctx,cx,cy,sz, 13,-16)
}

function drawCrystalLamp(ctx, cx, cy, sz) {
  const metal = '#6b6b76', crystal = '#a8e0f0'
  rS(ctx,cx,cy, -3,-8, 6,6, metal, sz)             // wall plate
  rS(ctx,cx,cy, -1,-6, 12,3, metal, sz)             // arm
  ctx.save(); ctx.shadowColor = '#8fdcff'; ctx.shadowBlur = (sz/48)*8
  // hanging crystal cluster
  rS(ctx,cx,cy, 6,-4, 10,10, crystal, sz)
  rS(ctx,cx,cy, 8,4,  6,8,  crystal, sz)
  ctx.restore()
  rS(ctx,cx,cy, 7,-4, 3,10, '#eafaff', sz)          // highlight
  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#8fdcff'
  ctx.fillRect(cx - (sz/48)*4, cy - (sz/48)*10, (sz/48)*26, (sz/48)*24)
  ctx.restore()
  // little star accent
  rS(ctx,cx,cy, 10,-12, 1,4, '#ffd23f', sz)
  rS(ctx,cx,cy, 8,-11, 5,1, '#ffd23f', sz)
  craftGlint(ctx,cx,cy,sz, 15,-12)
}

function drawMushroomClock(ctx, cx, cy, sz) {
  const cap = '#e2483f', stalk = '#f0e6d0', face = '#f5f0e0', dark = '#5c3a1c'
  rS(ctx,cx,cy, -16,-16, 32,14, cap, sz)           // mushroom cap
  rS(ctx,cx,cy, -16,-16, 32,4, '#f06a5a', sz)
  rS(ctx,cx,cy, -11,-13, 6,4, '#fff0e0', sz)        // spots
  rS(ctx,cx,cy, 5,-14,  5,4, '#fff0e0', sz)
  rS(ctx,cx,cy, -8,-2, 16,16, stalk, sz)            // stalk body
  rS(ctx,cx,cy, -8,-2, 4,16, '#d8cbb0', sz)
  // clock face on stalk
  const rows = [[0,5],[3,6],[6,6],[9,5]]
  for (const [dy,hw] of rows) rS(ctx,cx,cy, -hw,dy-1, hw*2,3, face, sz)
  rS(ctx,cx,cy, -1,3, 2,4, dark, sz)                // hour hand
  rS(ctx,cx,cy, -1,5, 5,1.5, dark, sz)              // minute hand
  rS(ctx,cx,cy, -1.5,4, 3,3, '#c9623f', sz)         // pin
  craftGlint(ctx,cx,cy,sz, 14,-16)
}

function drawStarPoster(ctx, cx, cy, sz) {
  const frame = '#c9a24a', sky = '#1a2050', star = '#ffd23f'
  rS(ctx,cx,cy, -16,-20, 32,40, frame, sz)          // frame
  rS(ctx,cx,cy, -13,-17, 26,34, sky, sz)            // night sky
  rS(ctx,cx,cy, -13,4, 26,13, '#2a3068', sz)         // horizon glow
  // big central star
  rS(ctx,cx,cy, -1,-14, 2,12, star, sz)
  rS(ctx,cx,cy, -6,-9, 12,2, star, sz)
  rS(ctx,cx,cy, -3,-11, 2,2, star, sz)
  rS(ctx,cx,cy, 2,-11,  2,2, star, sz)
  rS(ctx,cx,cy, -3,-6,  2,2, star, sz)
  rS(ctx,cx,cy, 2,-6,   2,2, star, sz)
  // scattered small stars + a flower
  rS(ctx,cx,cy, -9,-13, 2,2, '#fff', sz)
  rS(ctx,cx,cy, 8,-6,  2,2, '#fff', sz)
  rS(ctx,cx,cy, -8,8,  3,3, '#ff6ea0', sz)          // flower accent
  rS(ctx,cx,cy, 6,10,  3,3, '#c86ff0', sz)
  craftGlint(ctx,cx,cy,sz, 13,-16)
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

  // ─── CRAFTING TABLE — bought with coins, opens the recipe UI when tapped ───
  { id: 'crafting_table',  nameTh: 'โต๊ะประดิษฐ์', price: 200, tier: 'mid',   allowedZones: ['floor'],                    draw: withGround(drawCraftingTable) },

  // ─── CRAFTED-ONLY furniture (craftedOnly: true → never coin-buyable; only
  //     unlocked via CRAFT_ITEM at the crafting table). No `price`. ───
  { id: 'wooden_chair',   nameTh: 'เก้าอี้ไม้',    craftedOnly: true, tier: 'mid', allowedZones: ['floor'],                    draw: withGround(drawWoodenChair) },
  { id: 'stone_table',    nameTh: 'โต๊ะหิน',       craftedOnly: true, tier: 'mid', allowedZones: ['floor'],                    draw: withGround(drawStoneTable) },
  { id: 'flower_vase',    nameTh: 'แจกันดอกไม้',   craftedOnly: true, tier: 'small', allowedZones: ['floor'],                  draw: withGround(drawFlowerVase) },
  { id: 'mushroom_lamp',  nameTh: 'โคมเห็ด',       craftedOnly: true, tier: 'small', allowedZones: ['floor'],                  draw: withGround(drawMushroomLamp) },
  { id: 'crystal_ball',   nameTh: 'ลูกแก้ว',       craftedOnly: true, tier: 'small', allowedZones: ['floor'],                  draw: withGround(drawCrystalBall) },
  { id: 'star_mobile',    nameTh: 'โมบายดาว',      craftedOnly: true, tier: 'small', allowedZones: ['floor'],                  draw: withGround(drawStarMobile) },
  { id: 'moss_rug',       nameTh: 'พรมมอส',        craftedOnly: true, tier: 'small', allowedZones: ['floor'],                  draw: withGround(drawMossRug) },
  { id: 'stone_fountain', nameTh: 'น้ำพุหิน',      craftedOnly: true, tier: 'big', allowedZones: ['floor'],                    draw: withGround(drawStoneFountain) },
  { id: 'ice_sculpture',  nameTh: 'รูปปั้นน้ำแข็ง', craftedOnly: true, tier: 'big', allowedZones: ['floor'],                    draw: withGround(drawIceSculpture) },
  { id: 'flower_wreath',  nameTh: 'พวงดอกไม้',     craftedOnly: true, tier: 'small', allowedZones: ['left_wall', 'right_wall'], draw: drawFlowerWreath },
  { id: 'stone_relief',   nameTh: 'ภาพสลักหิน',    craftedOnly: true, tier: 'mid', allowedZones: ['left_wall', 'right_wall'], draw: drawStoneRelief },
  { id: 'wood_shelf',     nameTh: 'ชั้นไม้',        craftedOnly: true, tier: 'mid', allowedZones: ['left_wall', 'right_wall'], draw: drawWoodShelf },
  { id: 'crystal_lamp',   nameTh: 'โคมคริสตัล',    craftedOnly: true, tier: 'mid', allowedZones: ['left_wall', 'right_wall'], draw: drawCrystalLamp },
  { id: 'mushroom_clock', nameTh: 'นาฬิกาเห็ด',    craftedOnly: true, tier: 'mid', allowedZones: ['left_wall', 'right_wall'], draw: drawMushroomClock },
  { id: 'star_poster',    nameTh: 'โปสเตอร์ดาว',   craftedOnly: true, tier: 'mid', allowedZones: ['left_wall', 'right_wall'], draw: drawStarPoster },
]

// ── MATERIALS + RECIPES ──────────────────────────────────────────────────────
// Material display meta (icon-first — a pre-reader recognises the emoji). Keys
// match state.materials. Order defines HUD/panel display order.
export const MATERIALS = [
  { id: 'wood',     icon: '🪵', nameTh: 'ไม้' },
  { id: 'stone',    icon: '🪨', nameTh: 'หิน' },
  { id: 'flower',   icon: '🌸', nameTh: 'ดอกไม้' },
  { id: 'mushroom', icon: '🍄', nameTh: 'เห็ด' },
  { id: 'crystal',  icon: '❄️', nameTh: 'คริสตัล' },
  { id: 'stardust', icon: '⭐', nameTh: 'ผงดาว' },
]
export const MATERIAL_ICON = MATERIALS.reduce((m, x) => (m[x.id] = x.icon, m), {})

// Crafting recipes — keyed by the crafted item's id. Each value maps a material
// id → required count. Consumed by CRAFT_ITEM (StateContext) and the recipe UI.
export const RECIPES = {
  // floor
  wooden_chair:   { wood: 3 },
  stone_table:    { stone: 4 },
  flower_vase:    { flower: 5 },
  mushroom_lamp:  { mushroom: 3, wood: 1 },
  crystal_ball:   { crystal: 3 },
  star_mobile:    { stardust: 4 },
  moss_rug:       { flower: 3, wood: 2 },
  stone_fountain: { stone: 6, flower: 2 },
  ice_sculpture:  { crystal: 5, stone: 2 },
  // wall
  flower_wreath:  { flower: 6 },
  stone_relief:   { stone: 5 },
  wood_shelf:     { wood: 4 },
  crystal_lamp:   { crystal: 3, stardust: 1 },
  mushroom_clock: { mushroom: 4, stone: 1 },
  star_poster:    { stardust: 5, flower: 2 },
}

// Ordered recipe list for the crafting UI (floor group first, then wall).
export const RECIPE_LIST = [
  'wooden_chair', 'stone_table', 'flower_vase', 'mushroom_lamp', 'crystal_ball',
  'star_mobile', 'moss_rug', 'stone_fountain', 'ice_sculpture',
  'flower_wreath', 'stone_relief', 'wood_shelf', 'crystal_lamp',
  'mushroom_clock', 'star_poster',
]
