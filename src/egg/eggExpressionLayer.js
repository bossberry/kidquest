/**
 * KidQuest — Egg Expression Layer (pixel art)  [composited over Base + Eyes]
 * --------------------------------------------------------------------------
 * 6 moods: normal | happy | sleepy | angry | sad | excited
 *
 * Style-agnostic by design: the EYE layer still draws the chosen Eye DNA, and
 * this layer only adds BROWS + MOUTH + CHEEKS + EXTRAS (+ a small facial pose).
 * So 4 eye styles x 6 moods = 24 faces from one code set.
 *   - sleepy : eyes render CLOSED (eye layer drawn with blink:true)
 *   - excited: eyes render open + a tiny sparkle highlight added here
 *   - others : eyes render normally
 *
 * Mouth/brow positions take face anchors (eyeY / mouthY / faceX) from the
 * Base Egg shape, so they adapt to baby vs grown automatically.
 *
 * Fixes applied: angry mouth is a tight downturned closed mouth (no teeth);
 * excited sparkles are small, soft cream-colored, and drift (not hard blinks).
 */

import { EYE_STYLES, DARK_BODY_ELEMENTS } from "./eggEyeLayer.js";

const DARK = "#2a2a28";
export const EXPRESSION_KEYS = ["normal", "happy", "sleepy", "angry", "sad", "excited"];

/**
 * Structural "ink" color for brows + mouth outline. On dark-bodied elements
 * (e.g. shadow) the normal near-black ink vanishes into the body, so it flips
 * to white — matching the eye layer's contrast inversion. Accent colors
 * (pink lip, blue tear, etc.) are left untouched as they read fine on dark.
 */
export function inkFor(element) {
  return DARK_BODY_ELEMENTS.has(element) ? "#ffffff" : DARK;
}

/** What the eye layer should draw for this mood. */
export function eyeModeFor(mood) {
  if (mood === "sleepy") return "closed";
  return "open";
}

/** Eye geometry in cell coords for a given eye style. */
export function eyeGeom(styleKey, faceX = 9) {
  const e = EYE_STYLES[styleKey];
  const pairW = 2 * e.w + e.gap;
  const LX = faceX - pairW / 2;
  return { LX, RX: LX + e.w + e.gap, EW: e.w, EH: e.h };
}

function R(ctx, ox, oy, px, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(ox + x * px, oy + y * px, w * px, h * px); }

// --- Brows (angry / sad) --------------------------------------------------
export function drawBrows(ctx, mood, g, eyeY, px, ox, oy, ink = DARK) {
  if (mood === "angry") {
    R(ctx, ox, oy, px, g.LX,   eyeY - 1.1, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.LX+1, eyeY - 0.8, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.LX+2, eyeY - 0.5, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.RX+2, eyeY - 1.1, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.RX+1, eyeY - 0.8, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.RX,   eyeY - 0.5, 1, 0.7, ink);
  } else if (mood === "sad") {
    R(ctx, ox, oy, px, g.LX,   eyeY - 0.5, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.LX+1, eyeY - 0.8, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.LX+2, eyeY - 1.1, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.RX+2, eyeY - 0.5, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.RX+1, eyeY - 0.8, 1, 0.7, ink);
    R(ctx, ox, oy, px, g.RX,   eyeY - 1.1, 1, 0.7, ink);
  }
}

// --- Mouths ---------------------------------------------------------------
export function drawMouth(ctx, mood, mouthY, faceX, px, ox, oy, ink = DARK) {
  // positions are written for faceX=9; shift if a different center is used
  const dx = faceX - 9;
  const X = (x) => x + dx;
  if (mood === "normal") {
    R(ctx, ox, oy, px, X(7.4), mouthY, 0.7, 0.7, ink);
    R(ctx, ox, oy, px, X(8),   mouthY+0.4, 2, 0.7, ink);
    R(ctx, ox, oy, px, X(10),  mouthY, 0.7, 0.7, ink);
  } else if (mood === "happy") {
    R(ctx, ox, oy, px, X(7.2), mouthY, 0.7, 0.7, ink);
    R(ctx, ox, oy, px, X(7.6), mouthY+0.5, 3, 0.9, ink);
    R(ctx, ox, oy, px, X(10.4),mouthY, 0.7, 0.7, ink);
    R(ctx, ox, oy, px, X(8.2), mouthY+1.1, 1.8, 0.6, "#e87a7a");
  } else if (mood === "excited") {
    R(ctx, ox, oy, px, X(7.7), mouthY-0.2, 2.9, 0.6, ink);
    R(ctx, ox, oy, px, X(7.4), mouthY+0.3, 3.5, 1.4, ink);
    R(ctx, ox, oy, px, X(8.1), mouthY+1.1, 2.1, 0.7, "#e87a7a");
  } else if (mood === "angry") {
    // tight downturned closed mouth (no teeth)
    R(ctx, ox, oy, px, X(7.3),  mouthY+0.6, 0.8, 0.7, ink);
    R(ctx, ox, oy, px, X(8.0),  mouthY+0.25,0.9, 0.7, ink);
    R(ctx, ox, oy, px, X(8.8),  mouthY+0.1, 1.0, 0.7, ink);
    R(ctx, ox, oy, px, X(9.7),  mouthY+0.25,0.9, 0.7, ink);
    R(ctx, ox, oy, px, X(10.5), mouthY+0.6, 0.8, 0.7, ink);
  } else if (mood === "sad") {
    R(ctx, ox, oy, px, X(7.4), mouthY+0.5, 0.7, 0.7, ink);
    R(ctx, ox, oy, px, X(8),   mouthY+0.1, 2, 0.7, ink);
    R(ctx, ox, oy, px, X(10),  mouthY+0.5, 0.7, 0.7, ink);
  } else if (mood === "sleepy") {
    R(ctx, ox, oy, px, X(8.2), mouthY+0.3, 1.6, 0.7, ink);
  }
}

// --- Cheeks (happy / excited) --------------------------------------------
export function drawCheeks(ctx, mood, eyeY, px, ox, oy) {
  if (mood !== "happy" && mood !== "excited") return;
  ctx.fillStyle = "rgba(255,140,140,0.5)";
  ctx.fillRect(ox + 3.2 * px, oy + (eyeY + 2.7) * px, px * 1.7, px * 1.3);
  ctx.fillRect(ox + 13.1 * px, oy + (eyeY + 2.7) * px, px * 1.7, px * 1.3);
}

// --- Extras (animated): sparkles / tear / zzz / anger mark ----------------
export function drawExtras(ctx, mood, g, eyeY, t, px, ox, oy) {
  if (mood === "excited") {
    // small soft drifting cream sparkles
    const pts = [[3.0, 5.2, 0.9], [14.3, 6.0, 0.8], [12.5, 3.0, 0.7]];
    pts.forEach((p, i) => {
      const ph = (t * 0.6 + i * 0.7) % 1;
      const drift = Math.sin(t * 1.5 + i * 2) * 0.4;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.55;
      ctx.fillStyle = "#fff6e0";
      const s = p[2], sx = ox + (p[0] + drift) * px, sy = oy + (p[1] - ph * 1.2) * px;
      ctx.fillRect(sx, sy + 0.35 * px * s, px * 0.9 * s, px * 0.3 * s);
      ctx.fillRect(sx + 0.3 * px * s, sy, px * 0.3 * s, px * 0.9 * s);
    });
    ctx.globalAlpha = 1;
    // tiny eye sparkle highlight
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ox + (g.LX + 0.3) * px, oy + (eyeY - 0.5) * px, px, px * 0.8);
    ctx.fillRect(ox + (g.RX + g.EW - 1.3) * px, oy + (eyeY - 0.5) * px, px, px * 0.8);
  } else if (mood === "sad") {
    const ph = (t % 1.6) / 1.6;
    if (ph < 0.85) {
      ctx.fillStyle = "rgba(95,160,220,0.9)";
      ctx.fillRect(ox + (g.LX + 0.4) * px, oy + (eyeY + g.EH + ph * 4.5) * px, px * 0.9, px * 1.2);
    }
  } else if (mood === "sleepy") {
    const zc = (t % 2.2) / 2.2;
    ctx.fillStyle = "rgba(120,140,180," + (1 - zc) + ")";
    const zx = 13.5 + zc * 2, zy = 5.5 - zc * 3, sz = px * (0.7 + zc * 0.5);
    ctx.fillRect(ox + zx * px, oy + zy * px, sz, px * 0.4);
    ctx.fillRect(ox + (zx + 0.5) * px, oy + (zy + 0.4) * px, px * 0.4, px * 0.4);
    ctx.fillRect(ox + zx * px, oy + (zy + 0.8) * px, sz, px * 0.4);
  } else if (mood === "angry") {
    const p = (Math.sin(t * 6) + 1) / 2;
    ctx.strokeStyle = "rgba(220,60,40," + (0.6 + p * 0.4) + ")";
    ctx.lineWidth = Math.max(1.4, px * 0.28);
    const mx = ox + 14.2 * px, my = oy + 4.2 * px, r = px * 1.2;
    ctx.beginPath();
    ctx.moveTo(mx, my); ctx.lineTo(mx + r, my + r);
    ctx.moveTo(mx + r, my); ctx.lineTo(mx, my + r);
    ctx.moveTo(mx + r * 0.5, my - r * 0.4); ctx.lineTo(mx + r * 0.5, my + r * 1.4);
    ctx.stroke();
  }
}

/** Subtle per-mood facial idle (separate from the big action animations). */
export function getExpressionPose(mood, t) {
  const p = { tx: 0, ty: 0, sx: 1, sy: 1, rot: 0 };
  const b = Math.sin(t * 2.2);
  if (mood === "excited") { p.rot = Math.sin(t * 14) * 0.08; p.ty = -Math.abs(Math.sin(t * 7)) * 5; }
  else if (mood === "sad") { p.ty = 3 + b * 0.8; p.sy = 0.98; }
  else if (mood === "sleepy") { p.ty = 2; p.rot = Math.sin(t * 0.8) * 0.04; p.sy = 0.97; }
  else if (mood === "angry") { p.ty = -1 + Math.sin(t * 30) * 0.6; }
  else { p.sy = 1 + b * 0.025; p.sx = 1 - b * 0.025; p.ty = -Math.abs(b) * 2; }
  return p;
}

/**
 * Convenience: draw the whole expression overlay (brows + mouth + cheeks +
 * extras). Eyes are handled separately by the eye layer using eyeModeFor(mood).
 */
export function drawExpression(ctx, o) {
  const g = o.geom || eyeGeom(o.eyeStyle, o.faceX != null ? o.faceX : 9);
  const eyeY = o.eyeY != null ? o.eyeY : 7.4;
  const mouthY = o.mouthY != null ? o.mouthY : 12.0;
  const faceX = o.faceX != null ? o.faceX : 9;
  const ink = inkFor(o.element);
  drawBrows(ctx, o.mood, g, eyeY, o.px, o.ox, o.oy, ink);
  drawCheeks(ctx, o.mood, eyeY, o.px, o.ox, o.oy);
  drawMouth(ctx, o.mood, mouthY, faceX, o.px, o.ox, o.oy, ink);
  drawExtras(ctx, o.mood, g, eyeY, o.t || 0, o.px, o.ox, o.oy);
}

export const EGG_EXPRESSION_LAYER = {
  KEYS: EXPRESSION_KEYS, eyeModeFor, eyeGeom, inkFor, getPose: getExpressionPose, draw: drawExpression,
};
