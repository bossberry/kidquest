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

function rand(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// SPEC GAME-A §A.3: per-element drifting particle motif around the egg, at
// the aura layer (distinct from eggStageLayer.js's on-body element FX). The
// spec's own element list (fire/water/grass/electric/ice/ghost) doesn't match
// this game's real 6 elements — same mismatch A.1 found for favorite foods —
// remapped 1:1 here (grass->nature, electric->thunder, ghost->shadow); "ice"
// has no equivalent so "light" gets a twinkling-glimmer motif instead of snow.
const ELEMENT_PARTICLE = {
  fire:    { color: "#ff9d4d", kind: "ember" },    // drifting embers, rise + flicker
  water:   { color: "#8fd8f5", kind: "bubble" },   // rising bubbles, gentle wobble
  nature:  { color: "#8fce6a", kind: "leaf" },     // floating leaves, slow sway
  thunder: { color: "#ffe066", kind: "spark" },    // tiny sparks, <=3Hz snap-fade
  shadow:  { color: "#a99bd6", kind: "wisp" },     // slow drifting wisps
  light:   { color: "#fff2b8", kind: "glimmer" },  // twinkling glimmers
};

// Pooled/capped so combined with the existing glow sparkles (up to 6, level 3)
// the total stays comfortably under the spec's "<=20 alive" ceiling.
function particleCountForStage(stage) {
  const tier = stage <= 3 ? 0 : stage <= 6 ? 1 : 2;
  return [3, 7, 12][tier];
}

/**
 * Ambient element particles drifting around the egg. Deterministic from `t`
 * (no persistent object pool needed — matches this codebase's existing
 * seeded-procedural-FX style, see eggStageLayer.js's fxFire/fxWater/etc).
 * @param {object} o o.element, o.cx, o.cy, o.eggR, o.t, o.stage, o.lowFx
 */
function drawElementParticles(ctx, o) {
  const { element, cx, cy, eggR, t = 0, stage = 1, lowFx = false } = o;
  const spec = ELEMENT_PARTICLE[element];
  if (!spec || lowFx) return;
  const n = particleCountForStage(stage);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const seed = i * 13.7;
    const cycle = 2.2 + rand(seed) * 1.6;
    const gen = Math.floor((t + i * 0.37) / cycle);
    const age = ((t + i * 0.37) % cycle) / cycle;
    const rseed = gen * 41.1 + seed;
    const ang = rand(rseed) * Math.PI * 2;
    const dist = eggR * (1.1 + rand(rseed + 1) * 0.9);
    let px_, py_, alpha, size;
    switch (spec.kind) {
      case "ember":
        px_ = cx + Math.cos(ang) * dist * 0.6 + Math.sin(t * 2 + i) * 4;
        py_ = cy - age * eggR * 1.4 + Math.sin(ang) * eggR * 0.3;
        alpha = Math.sin(age * Math.PI) * 0.8;
        size = 2 + rand(rseed + 2) * 1.5;
        break;
      case "bubble":
        px_ = cx + Math.cos(ang) * dist * 0.7;
        py_ = cy + eggR * 0.8 - age * eggR * 1.8;
        alpha = Math.sin(age * Math.PI) * 0.7;
        size = 1.5 + rand(rseed + 2) * 2;
        break;
      case "leaf":
        px_ = cx + Math.cos(ang + t * 0.3) * dist;
        py_ = cy + Math.sin(ang * 1.3 + t * 0.5) * dist * 0.5 + Math.sin(age * Math.PI * 2) * 3;
        alpha = Math.sin(age * Math.PI) * 0.75;
        size = 2.5;
        break;
      case "spark": {
        const flick = (Math.sin(t * 3 + i) + 1) / 2; // <=3Hz
        px_ = cx + Math.cos(ang) * dist;
        py_ = cy + Math.sin(ang) * dist * 0.85;
        alpha = flick > 0.7 ? (flick - 0.7) / 0.3 : 0;
        size = 1.5 + rand(rseed + 2);
        break;
      }
      case "wisp":
        px_ = cx + Math.cos(ang + t * 0.15) * dist;
        py_ = cy + Math.sin(ang + t * 0.2) * dist * 0.85;
        alpha = Math.sin(age * Math.PI) * 0.5;
        size = 3 + rand(rseed + 2) * 1.5;
        break;
      case "glimmer":
      default:
        px_ = cx + Math.cos(ang) * dist;
        py_ = cy + Math.sin(ang) * dist * 0.85;
        alpha = Math.max(0, Math.sin(age * Math.PI * 4)) * 0.8;
        size = 1.5;
        break;
    }
    if (alpha <= 0.01) continue;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = spec.color;
    ctx.fillRect(px_ - size / 2, py_ - size / 2, size, size);
  }
  ctx.restore();
}

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
 *   o.stage    1..9, SPEC GAME-A §A.3 element-particle intensity (optional, default 1)
 *   o.lowFx    true to skip the element-particle pass entirely (optional)
 *   o.tintOverride  SPEC GAME-B §B.1, optional hex color — full-outfit-set
 *                   aura-tint bonus, replaces the element glow color at
 *                   levels 1-3 (legendary/level-4 stays rainbow regardless).
 *                   This bonus is always visible even at aura level 0 (a
 *                   common-rarity companion), so completing a set doesn't
 *                   depend on rarity RNG — floors the level to "small".
 */
export function drawAuraLayer(ctx, o) {
  let level = o.level;
  if (typeof level === "string") level = AURA_LEVELS.indexOf(level);
  if ((!level || level <= 0) && o.tintOverride) level = 1;
  if (!level || level <= 0) return;
  const { cx, cy, eggR, t = 0, stage = 1, lowFx = false } = o;
  const glow = (level < 4 && o.tintOverride) || AURA_GLOW[o.element] || "#ffd9a0";
  const pulse = (Math.sin(t * 2) + 1) / 2;

  drawElementParticles(ctx, { element: o.element, cx, cy, eggR, t, stage, lowFx });

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
