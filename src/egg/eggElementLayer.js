/**
 * KidQuest — Egg Element Layer (pixel art)  [Layer 4 of the compositing stack]
 * --------------------------------------------------------------------------
 * One motif per element. Sits centered on the TOP of the egg head ("crown"),
 * drawn LAST / in front, so it never occludes the face
 * (eyes ~47% / mouth ~60%; crown ~0-18% of egg height).
 *
 * Hand-placed pixel sprites — renders crisp at ANY scale (16px world map -> 192px modal).
 * No image assets, no GPT: this file is the single source of truth for the element layer.
 *
 * Elements (locked, from getElement()): fire | water | thunder | nature | shadow | light
 *
 * Sprite legend per palette below. "." = transparent.
 */

// --- Palettes -------------------------------------------------------------
export const ELEMENT_PALETTES = {
  fire:    { Y: "#ffd23c", O: "#ff7a1c", W: "#fff4c4", R: "#d2321a" },
  water:   { B: "#3d8fc4", L: "#8fd0ef", H: "#eafaff" },
  thunder: { Y: "#ffe24a", O: "#e0a81a" },
  nature:  { g: "#8cc24f", l: "#c7e6a3", G: "#4f8c34" },
  shadow:  { p: "#6a5f86", l: "#9a90b2" },
  light:   { Y: "#ffe89a", W: "#fff8e0" },
};

// --- Sprites (array of frames; each frame = array of equal-length rows) ----
export const ELEMENT_SPRITES = {
  fire: [
    ["...YY...", "..YOOY..", ".YOOOY..", ".OOWWOO.", ".OWWWWO.", ".OWWWWO.", ".RWWWWR.", ".RROORR.", "..RRRR.."],
    ["....Y...", "..YYOY..", ".YOOOY..", ".OOWWOO.", ".OWWWWO.", ".OWWWWO.", ".RWWWWR.", ".RROORR.", "..RRRR.."],
  ],
  water: [
    ["...B....", "...BB...", "..BLLB..", "..BLLB..", ".BLHLLB.", ".BLLLLB.", ".BLLLLB.", "..BLLB..", "..BBBB.."],
    ["...B....", "...BB...", "..BHLB..", "..BLLB..", ".BLLLLB.", ".BLHLLB.", ".BLLLLB.", "..BLLB..", "..BBBB.."],
  ],
  thunder: [["....YO..", "...YYO..", "..YYO...", "..YYO...", ".YYYYO..", "...YYO..", "..YYO...", "..YO....", ".YO....."]],
  nature:  [["...g....", "..glg...", ".gglgg..", ".glllg..", "gglllgg.", ".glllg..", "..glg...", "...g....", "...G...."]],
  shadow:  [["..ppp...", ".plllp..", ".pllpp..", ".pllp...", "..pp....", "..pp....", ".pp.....", "..p....."]],
  light:   [["...Y....", "...Y....", "..YWY...", "YYWWWYY.", "..YWY...", "...Y....", "...Y...."]],
};

// --- Motion metadata (applied per-frame by the renderer) ------------------
export const ELEMENT_MOTION = {
  fire:    { type: "frames",  fps: 6.7 },
  water:   { type: "frames",  fps: 6.7 },
  thunder: { type: "flash",   periodMs: 1000 },
  nature:  { type: "sway",    periodMs: 2600, deg: 7 },
  shadow:  { type: "waft",    periodMs: 2800, dyPx: 3, fade: [0.9, 0.55] },
  light:   { type: "twinkle", periodMs: 1600, scale: [0.82, 1.12], alpha: [0.7, 1] },
};

/**
 * Draw the element motif onto a 2D canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} element  fire|water|thunder|nature|shadow|light
 * @param {number} px       pixel size (one sprite cell = px*px device pixels)
 * @param {number} originX  x of egg center (device px)
 * @param {number} crownY   y of egg crown line (device px); motif anchors here
 * @param {number} timeMs   animation clock, e.g. performance.now() (0 = static)
 */
export function drawElementLayer(ctx, element, px, originX, crownY, timeMs = 0) {
  const frames = ELEMENT_SPRITES[element];
  const pal = ELEMENT_PALETTES[element];
  const m = ELEMENT_MOTION[element];
  if (!frames || !pal) return;

  // frame selection (frame-swap elements)
  let fi = 0;
  if (m.type === "frames") fi = Math.floor((timeMs / 1000) * m.fps) % frames.length;
  const fr = frames[fi];
  const w = fr[0].length, h = fr.length;
  const drawW = w * px, drawH = h * px;

  // anchor: horizontally centered, ~55% above the crown line / ~45% overlapping the head
  const x0 = Math.round(originX - drawW / 2);
  const y0 = Math.round(crownY - drawH * 0.55);
  const cx = x0 + drawW / 2, cy = y0 + drawH / 2;

  ctx.save();
  ctx.translate(cx, cy);

  switch (m.type) {
    case "sway": {
      const t = Math.sin((timeMs / m.periodMs) * 2 * Math.PI);
      ctx.rotate((t * m.deg * Math.PI) / 180);
      break;
    }
    case "twinkle": {
      const t = (Math.sin((timeMs / m.periodMs) * 2 * Math.PI) + 1) / 2;
      const s = m.scale[0] + (m.scale[1] - m.scale[0]) * t;
      ctx.scale(s, s);
      ctx.globalAlpha = m.alpha[0] + (m.alpha[1] - m.alpha[0]) * t;
      break;
    }
    case "waft": {
      const t = (Math.sin((timeMs / m.periodMs) * 2 * Math.PI) + 1) / 2;
      ctx.translate(0, -m.dyPx * t);
      ctx.globalAlpha = m.fade[0] + (m.fade[1] - m.fade[0]) * t;
      break;
    }
    case "flash": {
      const phase = (timeMs % m.periodMs) / m.periodMs;
      ctx.globalAlpha = phase > 0.68 ? 0.4 : 1;
      break;
    }
    default: break; // "frames" -> no transform, animation is in the frame swap
  }

  ctx.translate(-drawW / 2, -drawH / 2);

  // paint pixels (crisp; integer rects)
  for (let r = 0; r < h; r++) {
    const row = fr[r];
    for (let c = 0; c < w; c++) {
      const col = pal[row[c]];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(c * px, r * px, px, px);
      }
    }
  }

  ctx.restore();
}

export const ELEMENT_LAYER = {
  PALETTES: ELEMENT_PALETTES,
  SPRITES: ELEMENT_SPRITES,
  MOTION: ELEMENT_MOTION,
  draw: drawElementLayer,
};
