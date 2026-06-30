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

// ── CATALOG ────────────────────────────────────────────────────────────────

export const ROOM_ITEMS = [
  // ─── SMALL (30-60 coins) ───
  { id: 'plant',          nameTh: 'ต้นไม้',      price: 30,  tier: 'small', draw: drawPlant },
  { id: 'rug',            nameTh: 'พรม',          price: 40,  tier: 'small', draw: drawRug },
  { id: 'lamp',           nameTh: 'โคมไฟ',        price: 45,  tier: 'small', draw: drawLamp },
  { id: 'stuffed_animal', nameTh: 'ตุ๊กตา',       price: 50,  tier: 'small', draw: drawStuffedAnimal },
  { id: 'window_curtain', nameTh: 'หน้าต่าง',     price: 60,  tier: 'small', draw: drawWindowCurtain },
  // ─── MID (150-300 coins) ───
  { id: 'small_chair',    nameTh: 'เก้าอี้',       price: 150, tier: 'mid',   draw: drawSmallChair },
  { id: 'desk',           nameTh: 'โต๊ะ',          price: 180, tier: 'mid',   draw: drawDesk },
  { id: 'toy_chest',      nameTh: 'กล่องของเล่น', price: 200, tier: 'mid',   draw: drawToyChest },
  { id: 'bookshelf',      nameTh: 'ชั้นหนังสือ',  price: 280, tier: 'mid',   draw: drawBookshelf },
  { id: 'wall_art',       nameTh: 'ภาพวาด',        price: 250, tier: 'mid',   draw: drawWallArt },
  // ─── BIG (500+ coins) ───
  { id: 'bed',            nameTh: 'เตียง',          price: 500, tier: 'big',   draw: drawBed },
  { id: 'fish_tank',      nameTh: 'ตู้ปลา',        price: 600, tier: 'big',   draw: drawFishTank },
]
