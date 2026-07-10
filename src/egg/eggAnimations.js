/**
 * KidQuest — Egg Animation System (situational poses)
 * --------------------------------------------------------------------------
 * One static egg sprite -> many situations, via transform-only animation
 * (squash & stretch / translate / rotate). No extra frames to draw.
 *
 * States: idle | happy | hurt | attack | sleepy | excited
 *   idle    - gentle breathing bob            (Home, resting)
 *   happy   - hop with squash on land         (correct answer, win)
 *   hurt    - shake + red flash               (takes damage, wrong answer)
 *   attack  - wind up then lunge forward      (casting a move)
 *   sleepy  - slow squash + tilt, eyes closed (idle too long / night)
 *   excited - fast wiggle + bounce            (level up, reward)
 *
 * Usage (per animation frame):
 *   const t = (performance.now() - stateStart) / 1000;
 *   const p = getEggPose(state, t);
 *   applyEggPose(ctx, p, anchorX, anchorYbottom);  // ctx now transformed
 *   drawEggBody(ctx, { shape, element, px, ox: -w*px/2, oy: -h*px });
 *   // ...draw element / eyes / expression layers with the same ox/oy...
 *   if (p.flash) flashEgg(ctx, w*px, h*px);
 *   ctx.restore();
 *
 * SPEC GAME-A §A.3: the 6 states below (idle/happy/hurt/attack/sleepy/excited)
 * are the battle/reaction states and stay untouched. getEggPose() falls
 * through to eggPoses.js's richer 14-pose vocabulary (eat/sleep/yawn/hug/
 * dizzy/proud/sit/walk_l/walk_r/celebrate/etc — see EGG_POSES) for any other
 * `state` name, so every existing caller gets all 14 poses for free.
 */
import { getPoseTransform, isPoseEyesClosed, getIdleMoodTransform, EGG_POSES } from "./eggPoses.js";

const TAU = Math.PI * 2;
const CORE_STATES = ["idle", "happy", "hurt", "attack", "sleepy", "excited"];

/**
 * @param {string} state
 * @param {number} t  seconds since this state began
 * @param {string} [careMood] SPEC GAME-A §A.3 — 'happy'|'hungry'|'sleepy'|'content'
 *        (see deriveCareMood in eggPoses.js). Only affects the plain 'idle'
 *        state, so passing it is always safe even mid-interaction/battle.
 * @returns {{tx:number, ty:number, sx:number, sy:number, rot:number, flash:number}}
 *          translate (px), scale, rotate (rad), flash (0..1 red overlay alpha)
 */
export function getEggPose(state, t, careMood) {
  if (state === "idle" && careMood) return getIdleMoodTransform(careMood, t);
  if (!CORE_STATES.includes(state) && EGG_POSES.includes(state)) {
    return getPoseTransform(state, t);
  }
  const p = { tx: 0, ty: 0, sx: 1, sy: 1, rot: 0, flash: 0 };
  switch (state) {
    case "happy": {
      const T = 0.62, ph = (t % T) / T, hop = Math.sin(ph * Math.PI);
      const land = Math.max(0, 1 - hop * 6);
      p.ty = -hop * 24;
      p.sy = 1 + hop * 0.16 - land * 0.22;
      p.sx = 1 - hop * 0.10 + land * 0.18;
      break;
    }
    case "hurt": {
      p.tx = Math.sin(t * 45) * 5;
      p.sx = 0.97; p.sy = 0.97; p.ty = -1;
      p.flash = Math.sin(t * 30) > 0 ? 0.45 : 0;
      break;
    }
    case "attack": {
      const T = 0.72, q = (t % T) / T;
      let lx;
      if (q < 0.30) lx = -(q / 0.30) * 9;                 // wind up back
      else if (q < 0.50) lx = -9 + ((q - 0.30) / 0.20) * 39; // lunge forward
      else lx = 30 - ((q - 0.50) / 0.50) * 30;            // recover
      p.tx = lx;
      p.rot = lx * 0.004;
      p.sx = 1 + (lx > 0 ? 0.06 : 0);
      p.sy = 1 - (lx > 0 ? 0.04 : 0);
      break;
    }
    case "sleepy": {
      const sl = Math.sin(t * 1.1);
      p.sy = 0.93 + sl * 0.02;
      p.sx = 1.05 - sl * 0.02;
      p.rot = Math.sin(t * 0.8) * 0.05;
      p.ty = 2;
      break;
    }
    case "excited": {
      p.rot = Math.sin(t * 16) * 0.14;
      p.ty = -Math.abs(Math.sin(t * 8)) * 9;
      p.sx = 1 + Math.sin(t * 16) * 0.04;
      p.sy = 1 - Math.sin(t * 16) * 0.04;
      break;
    }
    case "idle":
    default: {
      const b = Math.sin(t * 2.2);
      p.sy = 1 + b * 0.025;
      p.sx = 1 - b * 0.025;
      p.ty = -Math.abs(b) * 2;
      break;
    }
  }
  return p;
}

/** Whether this state should render with eyes closed (for the expression layer). */
export function isEyesClosed(state) { return state === "sleepy" || isPoseEyesClosed(state); }

/**
 * Apply a pose to the context. Anchor is the egg's BOTTOM-CENTER (its "feet"),
 * so squash/stretch keeps it planted on the ground.
 * After this call, draw the egg with top-left at (-w*px/2, -h*px).
 */
export function applyEggPose(ctx, p, anchorX, anchorYbottom) {
  ctx.save();
  ctx.translate(anchorX + p.tx, anchorYbottom + p.ty);
  ctx.rotate(p.rot);
  ctx.scale(p.sx, p.sy);
}

/** Red hit-flash overlay, clipped to the egg pixels already drawn. */
export function flashEgg(ctx, drawW, drawH, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "#ff3b30";
  ctx.fillRect(-drawW / 2, -drawH, drawW, drawH);
  ctx.restore();
}

/** Ground shadow that shrinks as the egg leaves the ground. */
export function drawGroundShadow(ctx, cx, groundY, baseRadiusX, pose) {
  const air = Math.max(0, -pose.ty / 24);
  ctx.save();
  ctx.globalAlpha = 0.15 * (1 - air * 0.5);
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cx, groundY, baseRadiusX * (1 - air * 0.35), 6 * (1 - air * 0.35), 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export const EGG_STATES = [...CORE_STATES, ...EGG_POSES.filter(s => !CORE_STATES.includes(s))];

export const EGG_ANIMATIONS = {
  STATES: EGG_STATES, getPose: getEggPose, apply: applyEggPose,
  flash: flashEgg, groundShadow: drawGroundShadow, isEyesClosed,
};
