/**
 * KidQuest — Egg Eye Layer / "Eye DNA" (pixel art)  [composited over Base Egg]
 * --------------------------------------------------------------------------
 * 4 approved eye styles. Eye DNA is independent of element, so two fire eggs
 * can still look different. Placed using the Base Egg face anchors
 * (faceX / eyeY from EGG_SHAPES). Each style draws a left eye + a mirrored
 * right eye. Supports a "blink" / closed state (also reused by sleepy expression).
 *
 * Design note: at small pixel sizes, bold/simple eyes read best — these 4 were
 * chosen over busier iris+sparkle styles which turned muddy when scaled down.
 *
 * CONTRAST FIX (shadow element): the shadow egg's body is a dark flame mass, so
 * the normal near-black eye pixels (#2a2a28) vanish into it. For dark-bodied
 * elements we auto-invert the eye's black<->white so the eyes stay readable
 * (dark dots become white, white highlights become dark) — like glowing eyes.
 * Driven by DARK_BODY_ELEMENTS so more dark elements can opt in later.
 *
 * Sprite legend is per-style (see each palette). "." = transparent.
 */

export const EYE_STYLES = {
  gba: {
    label: "GBA Pokemon", w: 3, h: 4, gap: 4,
    grid: ["KKK", "hKK", "KKK", "KKW"],
    pal: { K: "#2a2a28", h: "#ffffff", W: "#dfeaff" },
  },
  tama: {
    label: "Tamagotchi", w: 3, h: 3, gap: 5,
    grid: ["hKK", "KKK", "KKK"],
    pal: { K: "#2a2a28", h: "#ffffff" },
  },
  sanrio: {
    label: "Sanrio", w: 2, h: 3, gap: 7,
    grid: ["KK", "KK", "KK"],
    pal: { K: "#2a2a28" },
  },
  summoners: {
    label: "Summoners War", w: 4, h: 4, gap: 3,
    grid: ["KKKW", "WIKW", "WIKW", "WWW."],
    pal: { W: "#ffffff", I: "#e0822a", K: "#2a2020", h: "#ffffff" },
  },
};

export const EYE_STYLE_KEYS = Object.keys(EYE_STYLES);

/**
 * Elements whose body is dark enough that near-black eye pixels disappear.
 * For these, the eye palette is inverted (dark<->white) for readability.
 */
export const DARK_BODY_ELEMENTS = new Set(["shadow"]);

// Black <-> white swap used on dark-bodied elements. Mid-tones (pale blue,
// orange iris) are already visible on dark and are left untouched.
const EYE_DARKS = new Set(["#2a2a28", "#2a2020"]);
const EYE_WHITES = new Set(["#ffffff", "#fff"]);
const EYE_INVERT_DARK_TO = "#ffffff";
const EYE_INVERT_WHITE_TO = "#2a2a28";

/**
 * Resolve the palette to use for a given style + element.
 * Returns the style's normal palette, unless the element is dark-bodied, in
 * which case it returns a black<->white-inverted copy.
 */
export function eyePaletteFor(style, element) {
  const e = EYE_STYLES[style];
  if (!e) return null;
  if (!DARK_BODY_ELEMENTS.has(element)) return e.pal;
  const out = {};
  for (const k in e.pal) {
    const c = String(e.pal[k]).toLowerCase();
    if (EYE_DARKS.has(c)) out[k] = EYE_INVERT_DARK_TO;
    else if (EYE_WHITES.has(c)) out[k] = EYE_INVERT_WHITE_TO;
    else out[k] = e.pal[k];
  }
  return out;
}

// Closed-eye (blink) bar color, inverted on dark-bodied elements.
function blinkColorFor(element) {
  return DARK_BODY_ELEMENTS.has(element) ? "#ffffff" : "#2a2a28";
}

function drawOneEye(ctx, e, pal, cellX, cellY, px, ox, oy, mirror) {
  for (let r = 0; r < e.h; r++) {
    const row = e.grid[r];
    for (let c = 0; c < e.w; c++) {
      const ch = mirror ? row[e.w - 1 - c] : row[c];
      const col = pal[ch];
      if (col) { ctx.fillStyle = col; ctx.fillRect(ox + (cellX + c) * px, oy + (cellY + r) * px, px, px); }
    }
  }
}

/**
 * Draw the eye pair onto the egg.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} o
 *   o.style   one of EYE_STYLE_KEYS
 *   o.element current element (e.g. "shadow") — triggers contrast inversion
 *   o.px      pixel size
 *   o.ox,oy   same top-left origin used to draw the egg body
 *   o.faceX   egg face center, cell coords (EGG_SHAPES[shape].crownX, default 9)
 *   o.eyeY    eye row, cell coords (EGG_SHAPES[shape].eyeY)
 *   o.blink   if true, draw closed eyes instead
 */
export function drawEyeLayer(ctx, o) {
  const e = EYE_STYLES[o.style];
  if (!e) return;
  const px = o.px, ox = o.ox || 0, oy = o.oy || 0;
  const faceX = o.faceX != null ? o.faceX : 9;
  const eyeY = o.eyeY != null ? o.eyeY : 7.4;
  const pairW = 2 * e.w + e.gap;
  const leftX = faceX - pairW / 2;
  const rightX = leftX + e.w + e.gap;
  const pal = eyePaletteFor(o.style, o.element);

  // Female: eyelashes (outer-top corner of each eye) + soft blush on the cheeks.
  if (o.gender === "female") {
    const lashCol = blinkColorFor(o.element);
    drawLashes(ctx, leftX, eyeY, -1, px, ox, oy, lashCol);
    drawLashes(ctx, rightX + e.w, eyeY, 1, px, ox, oy, lashCol);
    ctx.globalAlpha = 0.4; ctx.fillStyle = "#ff8fa8";
    ctx.fillRect(ox + (leftX - 0.6) * px, oy + (eyeY + 2.3) * px, px * 1.7, px * 1.0);
    ctx.fillRect(ox + (rightX + e.w - 1.1) * px, oy + (eyeY + 2.3) * px, px * 1.7, px * 1.0);
    ctx.globalAlpha = 1;
  }

  if (o.blink) {
    ctx.fillStyle = blinkColorFor(o.element);
    const by = eyeY + e.h / 2;
    ctx.fillRect(ox + leftX * px, oy + by * px, e.w * px, Math.max(px, px * 0.9));
    ctx.fillRect(ox + rightX * px, oy + by * px, e.w * px, Math.max(px, px * 0.9));
    return;
  }
  drawOneEye(ctx, e, pal, leftX, eyeY, px, ox, oy, false);
  drawOneEye(ctx, e, pal, rightX, eyeY, px, ox, oy, true);
}

/** Feminine eyelashes: three tapering strokes fanning up-and-outward from the
 *  outer-top corner of an eye. dir = -1 for the left eye, +1 for the right. */
function drawLashes(ctx, cornerX, eyeY, dir, px, ox, oy, col) {
  const lashes = [[1.7, -0.6], [1.05, -1.2], [0.4, -1.55]];
  ctx.fillStyle = col;
  for (const [lx, ly] of lashes) {
    const x1 = cornerX + dir*lx, y1 = eyeY + ly, steps = 4;
    for (let i = 1; i <= steps; i++) {
      const f = i/steps, x = cornerX + (x1-cornerX)*f, y = eyeY + (y1-eyeY)*f, w = 0.55 - f*0.25;
      ctx.fillRect(ox + (x - w/2)*px, oy + (y - w/2)*px, px*w, px*w);
    }
  }
}

export const EGG_EYE_LAYER = {
  STYLES: EYE_STYLES,
  KEYS: EYE_STYLE_KEYS,
  DARK_BODY_ELEMENTS,
  paletteFor: eyePaletteFor,
  draw: drawEyeLayer,
};
