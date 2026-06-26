/**
 * KidQuest — Egg Aura Layer (glow)  [Layer 6 / drawn BEHIND the egg body]
 * --------------------------------------------------------------------------
 * Rarity glow around the egg. 5 levels: 0 none, 1 small, 2 medium, 3 large,
 * 4 legendary. Levels 1-3 are tinted to the element color (harmonize with the
 * egg); level 4 (legendary) is a cycling RAINBOW, independent of element.
 *
 * The glow is a soft radial gradient (smooth, reads as light) + orbiting
 * pixel sparkles. Draw this FIRST (behind everything), then the egg + layers.
 */

import { EGG_TINTS } from "./eggBaseLayer.js";

export const AURA_LEVELS = ["none", "small", "medium", "large", "legendary"];

// Glow color per element (for levels 1-3). Legendary ignores this.
export const AURA_GLOW = {
  fire: "#ff8c2c", water: "#4db8e8", thunder: "#ffd23c",
  nature: "#6fc24a", shadow: "#7a5fd0", light: "#ffe39a",
};

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n>>16)&255) + "," + ((n>>8)&255) + "," + (n&255) + "," + a + ")";
}

/**
 * Draw the aura behind the egg.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} o
 *   o.level    0..4 (or AURA_LEVELS string)
 *   o.element  fire|water|... (picks the tint for levels 1-3)
 *   o.cx,o.cy  egg center (device px)
 *   o.eggR     egg radius (device px) ~ (spriteWidth*px)/2
 *   o.t        animation clock (seconds)
 */
export function drawAuraLayer(ctx, o) {
  let level = o.level;
  if (typeof level === "string") level = AURA_LEVELS.indexOf(level);
  if (!level || level <= 0) return;
  const { cx, cy, eggR, t = 0 } = o;
  const glow = AURA_GLOW[o.element] || "#ffd9a0";
  const pulse = (Math.sin(t * 2) + 1) / 2;

  if (level < 4) {
    const rad = [0, 1.45, 1.8, 2.3][level] * eggR * (0.95 + pulse * 0.1);
    const inten = [0, 0.35, 0.5, 0.7][level];
    ctx.save(); ctx.imageSmoothingEnabled = true;
    const g = ctx.createRadialGradient(cx, cy, eggR * 0.5, cx, cy, rad);
    g.addColorStop(0, rgba(glow, inten));
    g.addColorStop(0.5, rgba(glow, inten * 0.5));
    g.addColorStop(1, rgba(glow, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const nSp = [0, 0, 3, 6][level];
    for (let i = 0; i < nSp; i++) {
      const ang = t * 1.2 + i * (Math.PI * 2 / nSp);
      const orr = eggR * 1.3 + Math.sin(t * 2 + i) * 3;
      const sx = cx + Math.cos(ang) * orr, sy = cy + Math.sin(ang) * orr * 0.85;
      ctx.globalAlpha = (0.5 + 0.5 * Math.sin(t * 3 + i)) * 0.9;
      ctx.fillStyle = "#ffe6b0";
      ctx.fillRect(sx - 2, sy - 1, 4, 2); ctx.fillRect(sx - 1, sy - 2, 2, 4);
      ctx.globalAlpha = 1;
    }
  } else {
    // LEGENDARY: rainbow cycling glow + rotating ring + rainbow sparkles
    const hue = (t * 60) % 360;
    const rad = 2.5 * eggR * (0.95 + pulse * 0.12);
    ctx.save(); ctx.imageSmoothingEnabled = true;
    const g = ctx.createRadialGradient(cx, cy, eggR * 0.5, cx, cy, rad);
    g.addColorStop(0, "hsla(" + hue + ",90%,65%,0.55)");
    g.addColorStop(0.45, "hsla(" + ((hue + 60) % 360) + ",90%,60%,0.3)");
    g.addColorStop(1, "hsla(" + ((hue + 120) % 360) + ",90%,60%,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
    const ringR = eggR * 1.55;
    for (let k = 0; k < 24; k++) {
      const ang = t * 0.8 + k * (Math.PI * 2 / 24);
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 2 + k);
      ctx.fillStyle = "hsl(" + ((hue + k * 15) % 360) + ",90%,65%)";
      const rx = cx + Math.cos(ang) * ringR, ry = cy + Math.sin(ang) * ringR * 0.85;
      ctx.fillRect(rx - 1.5, ry - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1; ctx.restore();
    for (let i = 0; i < 8; i++) {
      const ang = t * 1.4 + i * (Math.PI * 2 / 8);
      const orr = eggR * 1.25 + Math.sin(t * 2.5 + i) * 4;
      const sx = cx + Math.cos(ang) * orr, sy = cy + Math.sin(ang) * orr * 0.85;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4 + i);
      ctx.fillStyle = "hsl(" + ((hue + i * 45) % 360) + ",95%,70%)";
      ctx.fillRect(sx - 2, sy - 1, 4, 2); ctx.fillRect(sx - 1, sy - 2, 2, 4);
      ctx.globalAlpha = 1;
    }
  }
}

export const EGG_AURA_LAYER = { LEVELS: AURA_LEVELS, GLOW: AURA_GLOW, draw: drawAuraLayer };
