/**
 * KidQuest — Egg Base Layer (pixel art)  [Layer 1 of the compositing stack]
 * --------------------------------------------------------------------------
 * The egg body. Drawn FIRST; every other layer (element / stage / eyes /
 * expression / aura) composites on top.
 *
 * Two approved silhouettes, used to express growth across the 9 egg stages:
 *   - "baby"  : 18x18, round & chubby  (early stages)
 *   - "grown" : 18x21, taller & full   (later stages)
 *
 * Authored in GRAYSCALE (5 tones) so a single sprite recolors into all six
 * elements by code via EGG_TINTS — no per-element art needed.
 * Renders crisp at any scale (16px world map -> 192px modal).
 *
 * Sprite legend: "." transparent | D outline | H highlight | M main | S shadow | s deep shadow
 */

// --- Sprites --------------------------------------------------------------
export const EGG_SPRITE_BABY = [
  "......DDDDDD......", "....DHHHMMMMSD....", "...DHHHMMMMMSSD...", "..DHHHMMMMMMSSSD..",
  "..DHHMMMMMMMSSSD..", ".DHHMMMMMMMMSSSSD.", ".DHMMMMMMMMSSSSsD.", ".DHMMMMMMMSSSSssD.",
  ".DMMMMMMMSSSSsssD.", ".DMMMMMMSSSSssssD.", ".DMMMMMSSSSsssssD.", ".DMMMMSSSSssssssD.",
  ".DMMMSSSSsssssssD.", "..DMMSSSsssssssD..", "...DMSSSssssssD...", "....DSSssssssD....",
  ".....DSsssssD.....", ".......DDDD.......",
];

export const EGG_SPRITE_GROWN = [
  ".......DDDD.......", ".....DHHMMMSD.....", "....DHHHMMMSSD....", "...DHHHMMMMMSSD...",
  "...DHHMMMMMMSSD...", "..DHHHMMMMMMSSSD..", "..DHHMMMMMMMSSSD..", ".DHHMMMMMMMMSSSSD.",
  ".DHMMMMMMMMSSSSsD.", ".DHMMMMMMMSSSSssD.", ".DMMMMMMMSSSSsssD.", ".DMMMMMMSSSSssssD.",
  ".DMMMMMSSSSsssssD.", ".DMMMMSSSSssssssD.", ".DMMMSSSSsssssssD.", "..DMMSSSsssssssD..",
  "..DMSSSssssssssD..", "...DSSssssssssD...", "....DSsssssssD....", "......DssssD......",
  ".......DDDD.......",
];

// --- Shape registry (sprite + grid size + alignment anchors in CELL coords)
// Anchors let the eye / expression / element layers line up to each shape.
export const EGG_SHAPES = {
  baby:  { sprite: EGG_SPRITE_BABY,  w: 18, h: 18,
           eyeY: 8.5,  eyeLX: 6.5,  eyeRX: 11.5, mouthY: 12.4, crownX: 9, crownY: 0 },
  grown: { sprite: EGG_SPRITE_GROWN, w: 18, h: 21,
           eyeY: 9.5,  eyeLX: 6.5,  eyeRX: 11.5, mouthY: 13.6, crownX: 9, crownY: 0 },
};

// Stage -> shape. The tall "grown" silhouette is DEPRECATED for visuals: a
// taller/oval body reads as older, not cuter. We now use the ROUND baby sprite
// for ALL stages and convey power via (a) a small capped size increase and
// (b) element regalia (see eggRegaliaLayer.js). STAGE_SHAPE kept for back-compat
// but the compositor should use STAGE_SHAPE_ROUND.
export const STAGE_SHAPE = ["baby","baby","baby","grown","grown","grown","grown","grown","grown"];
export const STAGE_SHAPE_ROUND = ["baby","baby","baby","baby","baby","baby","baby","baby","baby"];

/**
 * Body size multiplier by stage. Grows from stage 1 then CAPS at ~stage 5 so a
 * high-stage egg never outgrows the frame / its regalia. Multiply the egg's
 * base px by this.
 */
export function stageSizeMul(stage){
  const capped = Math.min(Math.max(stage, 1), 5);
  return 0.82 + (capped - 1) / 8 * 0.42;            // 0.82 (s1) → 1.03 (s5+)
}

/**
 * Color-richness multiplier by stage (saturation). Higher stage = a touch more
 * saturated/vivid. Apply to TINTED bodies (e.g. nature/thunder). Mass bodies
 * (fire/water/shadow/light) carry their own per-tier intensity and ignore this.
 */
export function stageSaturation(stage){
  return 0.9 + (Math.max(stage, 1) - 1) / 8 * 0.4;  // 0.9 (s1) → 1.3 (s9)
}

// --- Palettes -------------------------------------------------------------
export const EGG_GRAYSCALE = { H:"#f0f0ee", M:"#c8c8c5", S:"#8f8f8c", s:"#6f6f6c", D:"#2a2a28" };

// One palette per element. D (outline) is tinted dark toward the element hue.
export const EGG_TINTS = {
  fire:    { H:"#fff2d8", M:"#f6c57a", S:"#d88a3c", s:"#a85f22", D:"#3a1f0e" },
  water:   { H:"#eafaff", M:"#a9ddf5", S:"#5f9ec9", s:"#3a6f95", D:"#10293a" },
  thunder: { H:"#fff8d8", M:"#ffe27a", S:"#e0a81a", s:"#a87810", D:"#3a2c08" },
  nature:  { H:"#f3ffe6", M:"#a5d488", S:"#5d9c55", s:"#3a6638", D:"#16290f" },
  shadow:  { H:"#d8d4e6", M:"#9a90b2", S:"#6a5f86", s:"#46406a", D:"#1a1626" },
  light:   { H:"#fffdf0", M:"#ffe9a8", S:"#e8c060", s:"#b89030", D:"#3a3015" },
};

/**
 * Optional gender nudge: males slightly more saturated, females slightly less.
 * (Ribbon accessory is a separate layer; this only tweaks body saturation.)
 */
function applyGender(pal, gender) {
  if (gender !== "male" && gender !== "female") return pal;
  const amt = gender === "male" ? 1.08 : 0.92;
  const out = {};
  for (const k in pal) out[k] = adjustSaturation(pal[k], amt);
  return out;
}
function adjustSaturation(hex, mul) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const avg = (r + g + b) / 3;
  r = Math.max(0, Math.min(255, avg + (r - avg) * mul));
  g = Math.max(0, Math.min(255, avg + (g - avg) * mul));
  b = Math.max(0, Math.min(255, avg + (b - avg) * mul));
  return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
}

/**
 * Draw the egg body.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} o
 *   o.shape    "baby" | "grown"            (or pass o.stage 1..9 to auto-pick)
 *   o.stage    1..9 (optional; maps via STAGE_SHAPE if o.shape omitted)
 *   o.element  fire|water|thunder|nature|shadow|light  (omit => grayscale)
 *   o.gender   "male" | "female" (optional)
 *   o.px       pixel size (one cell = px*px device px)
 *   o.ox, o.oy top-left origin to draw at (device px)
 * @returns the resolved shape descriptor (handy for placing other layers)
 */
export function drawEggBody(ctx, o) {
  const shapeKey = o.shape || STAGE_SHAPE[(o.stage || 1) - 1] || "baby";
  const shape = EGG_SHAPES[shapeKey];
  let pal = o.element ? EGG_TINTS[o.element] : EGG_GRAYSCALE;
  pal = applyGender(pal, o.gender);
  const { sprite, w, h } = shape;
  const px = o.px, ox = o.ox || 0, oy = o.oy || 0;
  for (let r = 0; r < h; r++) {
    const row = sprite[r];
    for (let c = 0; c < w; c++) {
      const col = pal[row[c]];
      if (col) { ctx.fillStyle = col; ctx.fillRect(ox + c * px, oy + r * px, px, px); }
    }
  }
  return shape;
}

export const EGG_BASE_LAYER = {
  SHAPES: EGG_SHAPES, STAGE_SHAPE, STAGE_SHAPE_ROUND, GRAYSCALE: EGG_GRAYSCALE, TINTS: EGG_TINTS,
  draw: drawEggBody, stageSizeMul, stageSaturation, adjustSaturation,
};
