/**
 * eggCosmeticLayer.js — wearable cosmetic items (head + face slots)
 *
 * Same coordinate conventions as eggRegaliaLayer.js:
 *   px    — pixels per cell (scales with egg stage)
 *   ox    — x offset to left edge of sprite (= -eggW/2 in pose-transform space)
 *   oy    — y offset to top edge of sprite  (= -eggH)
 *   faceX — face center in cell coords (shape.crownX = 9 for baby)
 *   t     — seconds (used for gentle bob/twinkle animations)
 *
 * Baby egg reference (18×18 cells):
 *   crownX = 9, eyeY = 8.5, mouthY = 12.4
 *   Head items: y < 1  (on / above the egg top)
 *   Face items: y ≈ 7–13 (eye-to-mouth region)
 */

// Compact filled-rect helper — cell coordinates → canvas pixels
function q(ctx, ox, oy, px, x, y, w, h, col) {
  ctx.fillStyle = col
  ctx.fillRect(ox + x * px, oy + y * px, w * px, h * px)
}

// ── HEAD ITEMS ─────────────────────────────────────────────────────────────

function drawBow(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Red/pink bow with two lobes and a dark center knot
  const M = '#e83c3c', H = '#ff9ec0', K = '#a01818'
  // Left lobe
  q(ctx, ox, oy, px, fx - 4.5, -2.3, 3.0, 0.9, M)
  q(ctx, ox, oy, px, fx - 4.2, -1.5, 3.2, 1.0, M)
  q(ctx, ox, oy, px, fx - 4.5, -0.7, 3.0, 0.8, M)
  q(ctx, ox, oy, px, fx - 4.0, -2.0, 1.2, 0.6, H)  // highlight
  // Right lobe (mirrored)
  q(ctx, ox, oy, px, fx + 1.5, -2.3, 3.0, 0.9, M)
  q(ctx, ox, oy, px, fx + 1.0, -1.5, 3.2, 1.0, M)
  q(ctx, ox, oy, px, fx + 1.5, -0.7, 3.0, 0.8, M)
  q(ctx, ox, oy, px, fx + 2.0, -2.0, 1.2, 0.6, H)
  // Center knot
  q(ctx, ox, oy, px, fx - 0.7, -1.7, 1.4, 1.2, K)
}

function drawPartyHat(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Striped cone hat — alternating magenta / gold, with brim
  const A = '#e040e0', B = '#FFD23F', rim = '#8a0888'
  const rows = [
    { y: -7.5, x0: fx - 0.5, w: 1.0 },
    { y: -6.5, x0: fx - 1.0, w: 2.0 },
    { y: -5.5, x0: fx - 1.5, w: 3.0 },
    { y: -4.5, x0: fx - 2.0, w: 4.0 },
    { y: -3.5, x0: fx - 2.5, w: 5.0 },
    { y: -2.5, x0: fx - 3.0, w: 6.0 },
    { y: -1.5, x0: fx - 3.5, w: 7.0 },
    { y: -0.5, x0: fx - 4.0, w: 8.0 },
  ]
  rows.forEach(({ y, x0, w }, i) => {
    ctx.fillStyle = i % 2 === 0 ? A : B
    ctx.fillRect(ox + x0 * px, oy + y * px, w * px, px)
  })
  // Brim
  q(ctx, ox, oy, px, fx - 4.5, 0.0, 9.0, 0.8, rim)
  // White tip
  q(ctx, ox, oy, px, fx - 0.4, -8.0, 0.8, 0.6, '#ffffff')
  // Pom-pom ball
  q(ctx, ox, oy, px, fx - 0.6, -8.5, 1.2, 0.7, '#ffffff')
}

function drawBeanie(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Teal knitted beanie with ribbed band and white pom-pom
  const M = '#3db8a0', D = '#1e8a74', L = '#6ddfc8', W = '#ffffff'
  // Dome body
  q(ctx, ox, oy, px, fx - 4.5, -5.5, 9.0, 2.0, M)
  q(ctx, ox, oy, px, fx - 5.0, -4.0, 10.0, 3.8, M)
  // Shade on right
  q(ctx, ox, oy, px, fx + 2.0, -5.5, 2.5, 5.5, D)
  // Ribbed band at base
  q(ctx, ox, oy, px, fx - 5.0, -0.5, 10.0, 0.9, L)
  // Pom-pom
  q(ctx, ox, oy, px, fx - 1.2, -7.0, 2.4, 1.5, W)
  q(ctx, ox, oy, px, fx - 0.8, -7.5, 1.6, 0.6, W)
}

function drawCap(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Blue baseball cap — dome body + forward-projecting bill
  const M = '#3399ff', D = '#1a6abf', L = '#66bbff', W = '#ffffff'
  // Dome body
  q(ctx, ox, oy, px, fx - 4.0, -5.5, 8.0, 2.0, M)
  q(ctx, ox, oy, px, fx - 4.5, -4.0, 9.0, 4.0, M)
  // Shade on right
  q(ctx, ox, oy, px, fx + 1.5, -5.5, 2.0, 5.5, D)
  // Bill (extends right / forward)
  q(ctx, ox, oy, px, fx + 2.5,  0.0, 4.0, 1.0, D)
  q(ctx, ox, oy, px, fx + 2.5, -0.4, 4.0, 0.5, L)
  // Button on top
  q(ctx, ox, oy, px, fx - 0.4, -5.7, 0.8, 0.4, W)
}

function drawHeadbandStars(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  // Gold headband with three bobbing star ornaments
  const band = '#FFD23F', shine = '#ffffff', star = '#ff9ec0'
  // Band
  q(ctx, ox, oy, px, fx - 5.0, -0.6, 10.0, 1.2, band)
  q(ctx, ox, oy, px, fx - 5.0, -0.6, 10.0, 0.4, shine)
  // Stars: plus-cross shape at three positions
  const sxs = [fx - 3.5, fx, fx + 3.5]
  sxs.forEach((sx, i) => {
    const bob = Math.sin(t * 2.5 + i * 1.2) * 0.3
    const col = i === 1 ? shine : star
    q(ctx, ox, oy, px, sx - 0.4, -2.5 + bob, 0.8, 0.8, col)   // up spike
    q(ctx, ox, oy, px, sx - 0.8, -2.0 + bob, 1.6, 0.8, col)   // center bar
    q(ctx, ox, oy, px, sx - 0.4, -1.4 + bob, 0.8, 0.8, col)   // down spike
  })
}

function drawFlowerCrown(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  // Floral wreath — green band with 5 little pixel flowers
  const stemC = '#44cc44', cols = ['#ff6e9c', '#FFD23F', '#ffffff', '#cc44ff', '#ff9933']
  q(ctx, ox, oy, px, fx - 5.0, -0.4, 10.0, 0.9, stemC)
  const spots = [fx - 4, fx - 2, fx, fx + 2, fx + 4]
  spots.forEach((sx, i) => {
    const col = cols[i % cols.length]
    const bob = Math.sin(t * 1.8 + i) * 0.25
    // 4 petals
    q(ctx, ox, oy, px, sx - 0.4, -2.2 + bob, 0.8, 0.8, col)
    q(ctx, ox, oy, px, sx - 0.4, -0.9 + bob, 0.8, 0.8, col)
    q(ctx, ox, oy, px, sx - 1.1, -1.5 + bob, 0.8, 0.8, col)
    q(ctx, ox, oy, px, sx + 0.3, -1.5 + bob, 0.8, 0.8, col)
    // Yellow center
    q(ctx, ox, oy, px, sx - 0.4, -1.5 + bob, 0.8, 0.8, '#FFD23F')
  })
}

function drawTopHat(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Classic tall top hat — wide brim, cylinder body, white band
  const M = '#1a1a2e', D = '#333355', W = '#f0f0f0'
  // Wide brim
  q(ctx, ox, oy, px, fx - 5.5, -0.3, 11.0, 0.9, M)
  q(ctx, ox, oy, px, fx - 5.5, -0.3, 11.0, 0.3, D)
  // Tall cylinder
  q(ctx, ox, oy, px, fx - 3.5, -6.0,  7.0, 5.8, M)
  q(ctx, ox, oy, px, fx + 1.5, -6.0,  2.0, 5.8, D)   // right shade
  // White band
  q(ctx, ox, oy, px, fx - 3.5, -0.9,  7.0, 0.7, W)
}

function drawWizardHat(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  // Tall pointy wizard hat — purple cone + wide brim + twinkling stars
  const M = '#5a52b0', D = '#3a3480', L = '#8880e0'
  const starC = '#FFD23F'
  // Cone rows (narrowing toward tip)
  const rows = [
    { y: -10.0, x0: fx - 0.4, w: 0.8 },
    { y:  -9.0, x0: fx - 0.9, w: 1.8 },
    { y:  -8.0, x0: fx - 1.4, w: 2.8 },
    { y:  -7.0, x0: fx - 1.9, w: 3.8 },
    { y:  -6.0, x0: fx - 2.4, w: 4.8 },
    { y:  -5.0, x0: fx - 2.9, w: 5.8 },
    { y:  -4.0, x0: fx - 3.4, w: 6.8 },
    { y:  -3.0, x0: fx - 3.9, w: 7.8 },
    { y:  -2.0, x0: fx - 4.4, w: 8.8 },
    { y:  -1.0, x0: fx - 4.9, w: 9.8 },
  ]
  rows.forEach(({ y, x0, w }, i) => {
    const col = i === rows.length - 1 ? L : M
    ctx.fillStyle = col
    ctx.fillRect(ox + x0 * px, oy + y * px, w * px, px)
    // Right-edge shade
    ctx.fillStyle = D
    ctx.fillRect(ox + (x0 + w - 0.8) * px, oy + y * px, 0.8 * px, px)
  })
  // Wide brim
  q(ctx, ox, oy, px, fx - 6.0, -0.3, 12.0, 0.9, M)
  q(ctx, ox, oy, px, fx - 6.0, -0.3, 12.0, 0.3, D)
  // Twinkling stars on cone
  const starPos = [[fx - 2.5, -5.5], [fx + 1.0, -7.5], [fx - 1.0, -3.5]]
  starPos.forEach(([sx, sy], i) => {
    const alpha = 0.5 + 0.5 * Math.sin(t * 1.5 + i * 2.1)
    ctx.globalAlpha = alpha
    q(ctx, ox, oy, px, sx - 0.4, sy, 0.8, 0.8, starC)
    q(ctx, ox, oy, px, sx,       sy - 0.4, 0.8, 0.8, starC)
    ctx.globalAlpha = 1
  })
}

function drawGoldCrown(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Three-spike gold crown with gem accents
  const G = '#FFD23F', D = '#B8860B', S = '#ffffff'
  // Base ring
  q(ctx, ox, oy, px, fx - 4.5, -0.3, 9.0, 1.5, G)
  q(ctx, ox, oy, px, fx - 4.5, -0.3, 9.0, 0.4, S)  // shine
  q(ctx, ox, oy, px, fx - 4.5,  0.9, 9.0, 0.4, D)  // base shadow
  // Three spikes
  const spikes = [fx - 3, fx, fx + 3]
  spikes.forEach(sx => {
    q(ctx, ox, oy, px, sx - 0.5, -3.3, 1.0, 3.0, G)
    q(ctx, ox, oy, px, sx - 0.5, -3.5, 1.0, 0.3, S)  // tip shine
    ctx.fillStyle = D
    ctx.fillRect(ox + (sx + 0.3) * px, oy + (-3.3) * px, 0.4 * px, 3.0 * px)
  })
  // White gems at spike bases
  q(ctx, ox, oy, px, fx - 3.4, 0.1, 0.8, 0.8, S)
  q(ctx, ox, oy, px, fx - 0.4, 0.1, 0.8, 0.8, S)
  q(ctx, ox, oy, px, fx + 2.6, 0.1, 0.8, 0.8, S)
}

function drawJeweledCrown(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Five-spike jeweled crown with colored gem pixels
  const G = '#FFD23F', D = '#B8860B', S = '#ffffff'
  const gems = ['#ff4466', '#44aaff', '#44dd66', '#ee44ee', '#ff8844']
  // Wider base ring
  q(ctx, ox, oy, px, fx - 5.0, -0.3, 10.0, 1.8, G)
  q(ctx, ox, oy, px, fx - 5.0, -0.3, 10.0, 0.4, S)
  q(ctx, ox, oy, px, fx - 5.0,  1.2, 10.0, 0.4, D)
  // Five spikes (outer two taller)
  const spikes5 = [fx - 4, fx - 2, fx, fx + 2, fx + 4]
  spikes5.forEach((sx, i) => {
    const h = i % 2 === 0 ? 4.0 : 2.8
    q(ctx, ox, oy, px, sx - 0.5, -h - 0.3, 1.0, h, G)
    q(ctx, ox, oy, px, sx + 0.2, -h - 0.3, 0.3, h, D)
    q(ctx, ox, oy, px, sx - 0.3,  0.0, 0.8, 0.9, gems[i])
  })
}

// ── FACE ITEMS ─────────────────────────────────────────────────────────────

function drawBlush(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Soft rosy cheek ovals — slightly transparent
  ctx.globalAlpha = 0.65
  const A = '#ff9ec0', B = '#ffb3ce'
  // Left cheek
  q(ctx, ox, oy, px, fx - 5.2, 9.8, 2.0, 1.0, A)
  q(ctx, ox, oy, px, fx - 5.6, 10.1, 2.4, 0.8, B)
  // Right cheek
  q(ctx, ox, oy, px, fx + 3.2, 9.8, 2.0, 1.0, A)
  q(ctx, ox, oy, px, fx + 3.2, 10.1, 2.4, 0.8, B)
  ctx.globalAlpha = 1
}

function drawFreckles(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Six small tan freckle dots scattered across the nose/cheek area
  const col = '#c4956a'
  const dots = [
    [fx - 2.2, 9.4], [fx - 1.0, 9.9], [fx - 0.2, 9.2],
    [fx + 1.2, 9.4], [fx + 2.0, 9.9], [fx + 0.5, 10.3],
  ]
  ctx.fillStyle = col
  dots.forEach(([dx, dy]) => {
    ctx.fillRect(ox + dx * px, oy + dy * px, 0.7 * px, 0.7 * px)
  })
}

function drawMustache(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Wide droopy cartoon mustache below nose
  const M = '#4a2c0a', L = '#7a4a1a', K = '#2a1808'
  // Left half
  q(ctx, ox, oy, px, fx - 4.0, 11.8, 3.5, 1.0, L)
  q(ctx, ox, oy, px, fx - 4.4, 12.4, 2.5, 0.8, M)
  q(ctx, ox, oy, px, fx - 4.7, 12.8, 1.5, 0.7, M)
  // Right half
  q(ctx, ox, oy, px, fx + 0.5, 11.8, 3.5, 1.0, L)
  q(ctx, ox, oy, px, fx + 1.9, 12.4, 2.5, 0.8, M)
  q(ctx, ox, oy, px, fx + 3.2, 12.8, 1.5, 0.7, M)
  // Center gap / divot
  q(ctx, ox, oy, px, fx - 0.5, 12.1, 1.0, 0.5, K)
}

function drawFlowerCheek(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // A small pink flower on the left cheek
  const P = '#ff7eb3', C = '#FFD23F', L = '#44cc44'
  // Small leaf
  q(ctx, ox, oy, px, fx - 5.8, 10.5, 1.5, 0.5, L)
  // Petals (cross)
  q(ctx, ox, oy, px, fx - 5.5, 9.9, 0.8, 0.8, P)
  q(ctx, ox, oy, px, fx - 5.5, 11.0, 0.8, 0.8, P)
  q(ctx, ox, oy, px, fx - 6.2, 10.4, 0.8, 0.8, P)
  q(ctx, ox, oy, px, fx - 4.8, 10.4, 0.8, 0.8, P)
  // Yellow center
  q(ctx, ox, oy, px, fx - 5.5, 10.4, 0.8, 0.8, C)
}

function drawRoundGlasses(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Round scholar glasses — brown frames, light blue tint lenses
  const F = '#6b4226', L = '#aaddff'
  const drawFrame = (lx) => {
    // Lens fill (semi-transparent)
    ctx.globalAlpha = 0.35
    q(ctx, ox, oy, px, lx, 7.8, 3.5, 2.5, L)
    ctx.globalAlpha = 1
    // Frame outline
    q(ctx, ox, oy, px, lx, 7.8, 3.5, 0.5, F)       // top
    q(ctx, ox, oy, px, lx, 10.0, 3.5, 0.5, F)      // bottom
    q(ctx, ox, oy, px, lx, 7.8, 0.5, 2.7, F)       // left
    q(ctx, ox, oy, px, lx + 3.0, 7.8, 0.5, 2.7, F) // right
  }
  drawFrame(fx - 4.8)
  drawFrame(fx + 1.3)
  // Bridge
  q(ctx, ox, oy, px, fx - 1.3, 9.0, 2.6, 0.5, F)
  // Temples
  q(ctx, ox, oy, px, fx - 5.3, 9.2, 0.5, 1.5, F)
  q(ctx, ox, oy, px, fx + 4.3, 9.2, 0.5, 1.5, F)
}

function drawSunglasses(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Dark rectangular sunglasses with glint
  const F = '#1a1a2e', L = '#1a3540', G = '#5599bb'
  // Dark lens fills
  q(ctx, ox, oy, px, fx - 4.8, 7.8, 3.5, 2.5, L)
  q(ctx, ox, oy, px, fx + 1.3, 7.8, 3.5, 2.5, L)
  // Glints
  q(ctx, ox, oy, px, fx - 4.4, 8.0, 1.0, 0.5, G)
  q(ctx, ox, oy, px, fx + 1.7, 8.0, 1.0, 0.5, G)
  // Top frame bar (solid, spanning both lenses)
  q(ctx, ox, oy, px, fx - 5.0, 7.5, 10.0, 0.6, F)
  // Bottom frames
  q(ctx, ox, oy, px, fx - 4.8, 10.0, 3.5, 0.5, F)
  q(ctx, ox, oy, px, fx + 1.3, 10.0, 3.5, 0.5, F)
  // Side frames
  q(ctx, ox, oy, px, fx - 4.8, 7.8, 0.5, 2.5, F)
  q(ctx, ox, oy, px, fx + 4.3, 7.8, 0.5, 2.5, F)
  // Bridge
  q(ctx, ox, oy, px, fx - 1.3, 8.5, 2.6, 0.5, F)
  // Temples
  q(ctx, ox, oy, px, fx - 5.3, 9.0, 0.5, 1.5, F)
  q(ctx, ox, oy, px, fx + 4.8, 9.0, 0.5, 1.5, F)
}

function drawStarGlasses(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  // Star-shaped yellow/pink glasses — animated twinkle on center
  const F = '#FFD23F', B = '#d4a000', C = '#ff9ec0'
  const drawStar = (cx, cy) => {
    // Cross beams
    q(ctx, ox, oy, px, cx - 0.4, cy - 2.0, 0.8, 4.0, F)
    q(ctx, ox, oy, px, cx - 2.0, cy - 0.4, 4.0, 0.8, F)
    // Diagonal corners
    q(ctx, ox, oy, px, cx - 1.6, cy - 1.6, 0.8, 0.8, F)
    q(ctx, ox, oy, px, cx + 0.8, cy - 1.6, 0.8, 0.8, F)
    q(ctx, ox, oy, px, cx - 1.6, cy + 0.8, 0.8, 0.8, F)
    q(ctx, ox, oy, px, cx + 0.8, cy + 0.8, 0.8, 0.8, F)
    // Outline accent
    q(ctx, ox, oy, px, cx - 0.5, cy - 2.1, 1.0, 0.2, B)
    q(ctx, ox, oy, px, cx - 0.5, cy + 1.9, 1.0, 0.2, B)
    // Twinkle center
    const tw = 0.5 + 0.5 * Math.sin(t * 3.0 + cx)
    ctx.globalAlpha = tw
    q(ctx, ox, oy, px, cx - 0.4, cy - 0.4, 0.8, 0.8, C)
    ctx.globalAlpha = 1
  }
  drawStar(fx - 3.0, 9.0)
  drawStar(fx + 3.0, 9.0)
  // Bridge
  q(ctx, ox, oy, px, fx - 1.0, 9.2, 2.0, 0.5, B)
}

function drawEyeMask(ctx, { px, ox, oy, faceX: fx = 9 }) {
  // Superhero / masquerade eye mask — dark band with lighter eye openings
  const M = '#1a2e5c', E = '#3055aa', G = '#88aadd', W = '#ffffff'
  // Main band
  q(ctx, ox, oy, px, fx - 5.5, 7.5, 11.0, 3.0, M)
  // Top edge highlight
  q(ctx, ox, oy, px, fx - 5.5, 7.5, 11.0, 0.4, E)
  // Eye-region ovals (lighter cutout look)
  q(ctx, ox, oy, px, fx - 4.5, 8.1, 3.0, 1.8, E)
  q(ctx, ox, oy, px, fx + 1.5, 8.1, 3.0, 1.8, E)
  // Glints
  q(ctx, ox, oy, px, fx - 4.0, 8.3, 0.8, 0.4, G)
  q(ctx, ox, oy, px, fx + 2.0, 8.3, 0.8, 0.4, G)
  // Tie dots at ears
  q(ctx, ox, oy, px, fx - 5.5, 8.7, 0.5, 0.5, W)
  q(ctx, ox, oy, px, fx + 5.0, 8.7, 0.5, 0.5, W)
}

// ── BODY ITEMS (SPEC GAME-B §B.1) ───────────────────────────────────────────
// "Overlay band on egg lower-half" — a garment silhouette following the
// baby sprite's own lower-body taper (rows 9-16 of EGG_SPRITE_BABY), drawn
// right after the body (before eyes/regalia-front). BODY_BAND's [y, width]
// pairs were read directly off the real sprite's row spans so the garment
// hugs the egg's own shape instead of floating as a rectangle over it.
const BODY_BAND = [
  [9, 16], [10, 16], [11, 16], [12, 16],
  [13, 14], [14, 12], [15, 10], [16, 8],
]
function drawBand(ctx, ox, oy, px, fx, color, rows = BODY_BAND) {
  rows.forEach(([y, w]) => q(ctx, ox, oy, px, fx - w / 2, y, w, 1, color))
}

function drawAdventurerSuit(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#8a9a5a', H = '#a8b878', belt = '#6b4226', buckle = '#c9a24a'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx - 8, 9, 16, 1, H)                 // collar highlight
  q(ctx, ox, oy, px, fx - 7, 12, 14, 1, belt)             // belt
  q(ctx, ox, oy, px, fx - 1, 11.7, 2, 1.6, buckle)        // buckle
}
function drawWinterCoat(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#6bb8e8', D = '#4a90c8', W = '#ffffff'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx - 8, 9, 16, 1.4, W)               // furry collar
  q(ctx, ox, oy, px, fx - 0.4, 10, 0.8, 6.5, D)           // zipper line
}
function drawSwimsuit(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#2ecfc4', A = '#ff9933'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx - 7, 11, 14, 0.9, A)              // diagonal-ish wave stripe
  q(ctx, ox, oy, px, fx - 5, 14, 10, 0.9, A)
}
function drawHawaiianShirt(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  const M = '#ff7a45', Y = '#FFD23F', G = '#5bbf6a'
  drawBand(ctx, ox, oy, px, fx, M)
  const spots = [[fx - 5, 10], [fx + 3, 11], [fx - 2, 13], [fx + 4, 14.5]]
  spots.forEach(([sx, sy], i) => {
    q(ctx, ox, oy, px, sx - 0.4, sy, 0.9, 0.9, i % 2 === 0 ? Y : G)
  })
}
function drawScientistCoat(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#f5f5f0', C = '#aaddff', pocket = '#d8d8d0', pen = '#e83c3c'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx - 8, 9, 16, 1, C)                 // light collar
  q(ctx, ox, oy, px, fx + 2, 12, 2.4, 2, pocket)          // pocket
  q(ctx, ox, oy, px, fx + 2.7, 10.5, 0.5, 2, pen)         // pen
}
function drawSportJersey(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#e83c3c', W = '#ffffff'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx - 6, 9, 2, 8, W)                  // side stripe
  q(ctx, ox, oy, px, fx + 4, 9, 2, 8, W)
  // stylized "1" numeral on the chest
  q(ctx, ox, oy, px, fx - 0.4, 10.5, 0.8, 3.2, W)
  q(ctx, ox, oy, px, fx - 1.0, 10.5, 0.8, 0.8, W)
}
function drawRoyalOutfit(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#6a3fa0', G = '#FFD23F', E = '#f5f0e8'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx - 8, 9, 16, 0.8, G)               // gold trim collar
  q(ctx, ox, oy, px, fx - 4, 16, 8, 0.8, E)               // ermine hem
  q(ctx, ox, oy, px, fx - 4, 15.2, 8, 0.6, G)             // gold hem trim
}
function drawNinjaSuit(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#232330', D = '#15151d', sash = '#c62828'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx + 4, 9, 2, 8, D)                  // side shade
  q(ctx, ox, oy, px, fx - 7, 11.5, 14, 1.2, sash)         // red sash
}
function drawGardenerOveralls(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#4a72a8', D = '#375a88', pocket = '#375a88'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx - 4.5, 9, 1, 3, D)                // left strap
  q(ctx, ox, oy, px, fx + 3.5, 9, 1, 3, D)                // right strap
  q(ctx, ox, oy, px, fx - 2, 11, 4, 3, pocket)            // bib pocket
  q(ctx, ox, oy, px, fx - 2, 11, 4, 0.6, '#5a8ac0')       // pocket rim highlight
}
function drawRaincoat(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#ffd23f', D = '#e0a81a'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx - 8, 9, 16, 1, D)                 // collar
  const buttons = [10.5, 12, 13.5]
  buttons.forEach(y => q(ctx, ox, oy, px, fx - 0.4, y, 0.8, 0.8, D))
}
function drawPajamas(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#a8d8f0', W = '#ffffff'
  drawBand(ctx, ox, oy, px, fx, M)
  const dots = [[fx - 5, 10.5], [fx + 3, 10.5], [fx - 3, 12.5], [fx + 4, 13.5], [fx - 1, 15]]
  dots.forEach(([dx, dy]) => q(ctx, ox, oy, px, dx - 0.4, dy, 0.8, 0.8, W))
}
function drawThaiCostume(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#c62828', G = '#FFD23F'
  drawBand(ctx, ox, oy, px, fx, M)
  q(ctx, ox, oy, px, fx - 8, 9, 16, 0.7, G)               // gold collar trim
  q(ctx, ox, oy, px, fx - 4, 16, 8, 0.7, G)               // gold hem trim
  // diagonal gold sash
  const sash = [[9.5, -6], [11, -4], [12.5, -2], [14, 0]]
  sash.forEach(([y, dx]) => q(ctx, ox, oy, px, fx + dx, y, 2.4, 1, G))
}

// ── BACK ITEMS (SPEC GAME-B §B.1) ───────────────────────────────────────────
// Drawn BEHIND the egg body (pass:'behind', before the body draw), so packs/
// wings/capes read as worn ON the back rather than floating over the face.
function drawBackpack(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#a86b3c', D = '#8a5530', strap = '#6b4226'
  q(ctx, ox, oy, px, fx - 7.5, 10, 3, 6, strap)           // left strap peeking out
  q(ctx, ox, oy, px, fx + 4.5, 10, 3, 6, strap)
  q(ctx, ox, oy, px, fx - 7, 9.5, 14, 7, M)               // pack body (mostly hidden behind egg)
  q(ctx, ox, oy, px, fx - 7, 9.5, 14, 1, D)
}
function drawButterflyWings(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  const flap = Math.sin(t * 3) * 0.6
  const P = '#c77dff', Sp = '#ffe08a'
  ctx.globalAlpha = 0.78
  // Left wing
  q(ctx, ox, oy, px, fx - 11 + flap, 5, 5, 4, P)
  q(ctx, ox, oy, px, fx - 10 + flap, 9, 4, 3, P)
  q(ctx, ox, oy, px, fx - 9.5 + flap, 6, 1.2, 1.2, Sp)
  // Right wing (mirrored)
  q(ctx, ox, oy, px, fx + 6 - flap, 5, 5, 4, P)
  q(ctx, ox, oy, px, fx + 6 - flap, 9, 4, 3, P)
  q(ctx, ox, oy, px, fx + 8.3 - flap, 6, 1.2, 1.2, Sp)
  ctx.globalAlpha = 1
}
function drawAngelWings(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  const bob = Math.sin(t * 1.5) * 0.4
  const W = '#fdfdfb', S = '#e8e4dc'
  const rowsL = [[4 + bob, -12, 5], [6 + bob, -13, 6], [8 + bob, -12, 5], [10 + bob, -10, 4], [12 + bob, -8, 3]]
  rowsL.forEach(([y, dx, w]) => q(ctx, ox, oy, px, fx + dx, y, w, 1.4, W))
  const rowsR = [[4 + bob, 7, 5], [6 + bob, 7, 6], [8 + bob, 7, 5], [10 + bob, 6, 4], [12 + bob, 5, 3]]
  rowsR.forEach(([y, dx, w]) => q(ctx, ox, oy, px, fx + dx, y, w, 1.4, W))
  q(ctx, ox, oy, px, fx - 11, 6, 3, 1, S)
  q(ctx, ox, oy, px, fx + 8, 6, 3, 1, S)
}
function drawTurtleShell(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const M = '#5d9c55', D = '#3a6638', line = '#2a4a28'
  q(ctx, ox, oy, px, fx - 6, 8, 12, 8, M)
  q(ctx, ox, oy, px, fx - 6, 8, 12, 1.2, D)
  const grid = [[fx - 3, 10], [fx + 1, 10], [fx - 3, 13], [fx + 1, 13]]
  grid.forEach(([gx, gy]) => q(ctx, ox, oy, px, gx, gy, 2, 0.5, line))
}
function drawMiniRocket(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  const M = '#e83c3c', W = '#ffffff', fin = '#c62828', flame = '#FFD23F'
  const rx = fx + 6.5
  q(ctx, ox, oy, px, rx - 1.2, 3, 2.4, 8, M)
  q(ctx, ox, oy, px, rx - 1.2, 3, 2.4, 2, W)
  q(ctx, ox, oy, px, rx - 0.5, 5.5, 1, 1, W)              // window
  q(ctx, ox, oy, px, rx - 2.3, 9, 1.5, 2.5, fin)          // left fin
  q(ctx, ox, oy, px, rx + 1.3, 9, 1.5, 2.5, fin)          // right fin
  const flick = 0.6 + 0.4 * Math.sin(t * 8)
  ctx.globalAlpha = flick
  q(ctx, ox, oy, px, rx - 0.8, 11, 1.6, 2, flame)
  ctx.globalAlpha = 1
}
function drawHeroCape(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  const sway = Math.sin(t * 1.8) * 0.5
  const M = '#e83c3c', D = '#c62828', clasp = '#FFD23F'
  const rows = [
    [4, -6, 12], [6, -6.3 + sway * 0.3, 12.6], [8, -6.6 + sway * 0.5, 13.2],
    [10, -7 + sway * 0.7, 14], [12, -7.4 + sway, 14.8], [14, -7.8 + sway * 1.2, 15.6],
    [16, -8.2 + sway * 1.4, 16.4],
  ]
  rows.forEach(([y, dx, w], i) => q(ctx, ox, oy, px, fx + dx, y, w, 1.3, i % 3 === 0 ? D : M))
  q(ctx, ox, oy, px, fx - 1, 3.3, 2, 1.4, clasp)          // shoulder clasp
}
function drawMiniUmbrella(ctx, { px, ox, oy, faceX: fx = 9 }) {
  const cols = ['#e83c3c', '#FFD23F', '#4db8e8', '#5bbf6a']
  const cx = fx + 6
  cols.forEach((c, i) => q(ctx, ox, oy, px, cx - 2 + i, 2, 1, 2, c))
  q(ctx, ox, oy, px, cx - 2, 4, 4, 0.6, '#8a5530')        // canopy rim
  q(ctx, ox, oy, px, cx - 0.3, 4.6, 0.6, 5, '#8a5530')    // handle
}
function drawBalloon(ctx, { px, ox, oy, faceX: fx = 9, t = 0 }) {
  const drift = Math.sin(t * 1.2) * 0.6
  const M = '#ff6e9c', H = '#ffb3ce', string = '#6b6b76'
  const bx = fx + drift
  q(ctx, ox, oy, px, bx - 2, -6, 4, 5, M)
  q(ctx, ox, oy, px, bx - 1.5, -5.5, 1.3, 1.3, H)         // highlight
  q(ctx, ox, oy, px, bx - 0.2, -1, 0.4, 8, string)        // string down behind egg
}

// ── CATALOG ────────────────────────────────────────────────────────────────

export const COSMETIC_ITEMS = [
  // ─── HEAD (small 30-60, mid 150-300, big 500+) ───
  { id: 'bow',            slot: 'head', nameTh: 'โบว์',           nameEn: 'Bow',          price:  30, tier: 'small', draw: drawBow },
  { id: 'party_hat',      slot: 'head', nameTh: 'หมวกปาร์ตี้',    nameEn: 'Party Hat',    price:  40, tier: 'small', draw: drawPartyHat },
  { id: 'beanie',         slot: 'head', nameTh: 'หมวกไหมพรม',     nameEn: 'Beanie',       price:  45, tier: 'small', draw: drawBeanie },
  { id: 'cap',            slot: 'head', nameTh: 'หมวกแก๊ป',       nameEn: 'Cap',          price:  50, tier: 'small', draw: drawCap },
  { id: 'headband_stars', slot: 'head', nameTh: 'ที่คาดผมดาว',    nameEn: 'Star Headband',price:  60, tier: 'small', draw: drawHeadbandStars },
  { id: 'flower_crown',   slot: 'head', nameTh: 'มงกุฎดอกไม้',   nameEn: 'Flower Crown', price: 150, tier: 'mid',   draw: drawFlowerCrown },
  { id: 'top_hat',        slot: 'head', nameTh: 'หมวกสูง',        nameEn: 'Top Hat',      price: 200, tier: 'mid',   draw: drawTopHat },
  { id: 'wizard_hat',     slot: 'head', nameTh: 'หมวกพ่อมด',      nameEn: 'Wizard Hat',   price: 250, tier: 'mid',   draw: drawWizardHat },
  { id: 'gold_crown',     slot: 'head', nameTh: 'มงกุฎทอง',       nameEn: 'Gold Crown',   price: 500, tier: 'big',   draw: drawGoldCrown },
  { id: 'jeweled_crown',  slot: 'head', nameTh: 'มงกุฎอัญมณี',   nameEn: 'Jeweled Crown', price: 800, tier: 'big',   draw: drawJeweledCrown },
  // ─── FACE (small 30-60, mid 150-200) ───
  { id: 'blush',          slot: 'face', nameTh: 'แก้มชมพู',       nameEn: 'Blush',        price:  30, tier: 'small', draw: drawBlush },
  { id: 'freckles',       slot: 'face', nameTh: 'ฝ้าจุด',          nameEn: 'Freckles',     price:  30, tier: 'small', draw: drawFreckles },
  { id: 'flower_cheek',   slot: 'face', nameTh: 'ดอกไม้แก้ม',     nameEn: 'Flower Cheek', price:  40, tier: 'small', draw: drawFlowerCheek },
  { id: 'mustache',       slot: 'face', nameTh: 'หนวด',            nameEn: 'Mustache',     price:  60, tier: 'small', draw: drawMustache },
  { id: 'round_glasses',  slot: 'face', nameTh: 'แว่นตากลม',      nameEn: 'Round Glasses',price:  50, tier: 'small', draw: drawRoundGlasses },
  { id: 'eye_mask',       slot: 'face', nameTh: 'หน้ากากตา',       nameEn: 'Eye Mask',     price: 180, tier: 'mid',   draw: drawEyeMask },
  { id: 'sunglasses',     slot: 'face', nameTh: 'แว่นกันแดด',     nameEn: 'Sunglasses',   price: 150, tier: 'mid',   draw: drawSunglasses },
  { id: 'star_glasses',   slot: 'face', nameTh: 'แว่นดาว',         nameEn: 'Star Glasses', price: 200, tier: 'mid',   draw: drawStarGlasses },
  // ─── BODY (SPEC GAME-B §B.1, 12 items — all shop unless noted) ───
  { id: 'adventurer_suit',    slot: 'body', nameTh: 'ชุดนักผจญภัย',  nameEn: 'Adventurer Suit',    price: 120, tier: 'mid', draw: drawAdventurerSuit },
  { id: 'winter_coat',        slot: 'body', nameTh: 'เสื้อกันหนาว',   nameEn: 'Winter Coat',        price: 130, tier: 'mid', draw: drawWinterCoat },
  { id: 'swimsuit',           slot: 'body', nameTh: 'ชุดว่ายน้ำ',     nameEn: 'Swimsuit',           price: 90,  tier: 'mid', draw: drawSwimsuit },
  { id: 'hawaiian_shirt',     slot: 'body', nameTh: 'เสื้อฮาวาย',     nameEn: 'Hawaiian Shirt',     price: 90,  tier: 'mid', draw: drawHawaiianShirt },
  { id: 'scientist_coat',     slot: 'body', nameTh: 'ชุดนักวิทย์',    nameEn: 'Scientist Coat',     price: 140, tier: 'mid', draw: drawScientistCoat },
  { id: 'sport_jersey',       slot: 'body', nameTh: 'เสื้อกีฬา',      nameEn: 'Sport Jersey',       price: 100, tier: 'mid', draw: drawSportJersey },
  { id: 'royal_outfit',       slot: 'body', nameTh: 'ชุดเจ้าหญิง/เจ้าชาย', nameEn: 'Royal Outfit',  price: 220, tier: 'big', draw: drawRoyalOutfit },
  { id: 'ninja_suit',         slot: 'body', nameTh: 'ชุดนินจา',       nameEn: 'Ninja Suit',         price: 150, tier: 'mid', draw: drawNinjaSuit, acquirable: 'drop', icon: '🥷' },
  { id: 'gardener_overalls',  slot: 'body', nameTh: 'เอี๊ยมชาวสวน',   nameEn: 'Gardener Overalls',  price: 100, tier: 'mid', draw: drawGardenerOveralls },
  { id: 'raincoat',           slot: 'body', nameTh: 'เสื้อกันฝน',     nameEn: 'Raincoat',           price: 80,  tier: 'small', draw: drawRaincoat },
  { id: 'pajamas',            slot: 'body', nameTh: 'ชุดนอน',         nameEn: 'Pajamas',            price: 70,  tier: 'small', draw: drawPajamas },
  { id: 'thai_costume',       slot: 'body', nameTh: 'ชุดไทย',         nameEn: 'Thai Costume',       price: null, tier: 'big', draw: drawThaiCostume, acquirable: 'event' },
  // ─── BACK (SPEC GAME-B §B.1, 8 items) ───
  { id: 'backpack',           slot: 'back', nameTh: 'กระเป๋าเป้',     nameEn: 'Backpack',           price: 60,  tier: 'small', draw: drawBackpack },
  { id: 'butterfly_wings',    slot: 'back', nameTh: 'ปีกผีเสื้อ',     nameEn: 'Butterfly Wings',    price: null, tier: 'mid', draw: drawButterflyWings, acquirable: 'craft' },
  { id: 'angel_wings',        slot: 'back', nameTh: 'ปีกนางฟ้า',      nameEn: 'Angel Wings',        price: null, tier: 'big', draw: drawAngelWings, acquirable: 'event' },
  { id: 'turtle_shell',       slot: 'back', nameTh: 'กระดองเต่า',     nameEn: 'Turtle Shell',       price: 110, tier: 'mid', draw: drawTurtleShell, acquirable: 'drop', icon: '🐢' },
  { id: 'mini_rocket',        slot: 'back', nameTh: 'จรวดจิ๋ว',       nameEn: 'Mini Rocket',        price: 180, tier: 'mid', draw: drawMiniRocket },
  { id: 'hero_cape',          slot: 'back', nameTh: 'ผ้าคลุมฮีโร่',   nameEn: 'Hero Cape',          price: 160, tier: 'mid', draw: drawHeroCape },
  { id: 'mini_umbrella',      slot: 'back', nameTh: 'ร่มจิ๋ว',        nameEn: 'Mini Umbrella',      price: null, tier: 'small', draw: drawMiniUmbrella, acquirable: 'craft' },
  { id: 'balloon',            slot: 'back', nameTh: 'ลูกโป่ง',        nameEn: 'Balloon',            price: 65,  tier: 'small', draw: drawBalloon },
]

/**
 * Draw equipped cosmetics on the Living Egg canvas, in 3 passes so body/back
 * (SPEC GAME-B §B.1) sit at the correct depth relative to the egg body,
 * while head/face keep their original "on top of everything" behavior:
 *   pass 'behind' — back slot only (packs/wings/capes), call BEFORE the body
 *   pass 'body'   — body slot only (outfits), call right AFTER the body
 *   pass 'front'  — head+face (default, original behavior), call last
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ px, ox, oy, faceX, t }} o  — same coordinate object passed to other layers
 * @param {{ head: string|null, face: string|null, body: string|null, back: string|null }|null} equipped
 * @param {'behind'|'body'|'front'} [pass]
 */
export function drawCosmetics(ctx, o, equipped, pass = 'front') {
  if (!equipped) return
  if (pass === 'behind') {
    const item = equipped.back && COSMETIC_ITEMS.find(i => i.id === equipped.back && i.slot === 'back')
    if (item) { ctx.globalAlpha = 1; item.draw(ctx, o) }
    ctx.globalAlpha = 1
    return
  }
  if (pass === 'body') {
    const item = equipped.body && COSMETIC_ITEMS.find(i => i.id === equipped.body && i.slot === 'body')
    if (item) { ctx.globalAlpha = 1; item.draw(ctx, o) }
    ctx.globalAlpha = 1
    return
  }
  const { face, head } = equipped
  // Face slot first (below head items)
  if (face) {
    const item = COSMETIC_ITEMS.find(i => i.id === face && i.slot === 'face')
    if (item) { ctx.globalAlpha = 1; item.draw(ctx, o) }
  }
  // Head slot last (on top of face)
  if (head) {
    const item = COSMETIC_ITEMS.find(i => i.id === head && i.slot === 'head')
    if (item) { ctx.globalAlpha = 1; item.draw(ctx, o) }
  }
  ctx.globalAlpha = 1
}
