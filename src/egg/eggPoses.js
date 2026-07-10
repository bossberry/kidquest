/**
 * KidQuest — Egg Pose System (SPEC GAME-A §A.3)
 * --------------------------------------------------------------------------
 * 14 named situational poses, additive to the 6 battle-state animations
 * already in eggAnimations.js (idle/happy/hurt/attack/sleepy/excited — those
 * stay untouched, battle code depends on them). This module covers the
 * richer non-battle vocabulary: Home idle variety, feed/sleep/touch-play
 * scenes, minigame reactions, the evolution ceremony.
 *
 * getEggPose() in eggAnimations.js delegates here for any state name it
 * doesn't itself recognize, so every existing call site (renderEggSprite,
 * EggCanvas) gets all 14 poses for free via the same `anim` prop — no new
 * per-pose sprite art, all procedural transforms on the existing layers.
 *
 * Poses share the {tx,ty,sx,sy,rot,flash} shape used by applyEggPose().
 */

const TAU = Math.PI * 2;
function rand(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function clamp01(x) { return Math.min(1, Math.max(0, x)); }

export const EGG_POSES = [
  "idle", "idle_blink", "happy_bounce", "eat", "sleep", "yawn", "curious_tilt",
  "laugh", "hug", "dizzy", "proud", "sit", "walk_l", "walk_r", "celebrate",
];

/**
 * @param {string} pose one of EGG_POSES
 * @param {number} t loop clock in seconds (continuous)
 * @param {number} since seconds since this pose became active — drives the
 *        200-400ms ease-out "settle" on poses that have a one-shot entry
 *        (hug/proud/yawn). Omit for a pose that's been active "a while".
 */
export function getPoseTransform(pose, t, since = 999) {
  const p = { tx: 0, ty: 0, sx: 1, sy: 1, rot: 0, flash: 0 };
  const settleIn = easeOutCubic(clamp01(since / 0.3)); // 300ms ease-out into the pose

  switch (pose) {
    case "idle_blink":
    case "idle": {
      const b = Math.sin(t * 2.2);
      p.sy = 1 + b * 0.025; p.sx = 1 - b * 0.025; p.ty = -Math.abs(b) * 2;
      break;
    }
    case "happy_bounce": {
      const T = 0.62, ph = (t % T) / T, hop = Math.sin(ph * Math.PI);
      const land = Math.max(0, 1 - hop * 6);
      p.ty = -hop * 24;
      p.sy = 1 + hop * 0.16 - land * 0.22;
      p.sx = 1 - hop * 0.10 + land * 0.18;
      break;
    }
    case "eat": {
      const T = 0.5, ph = (t % T) / T, chomp = Math.abs(Math.sin(ph * Math.PI));
      p.sy = 1 - chomp * 0.08; p.sx = 1 + chomp * 0.05; p.ty = chomp * 1.5;
      break;
    }
    case "sleep": {
      const sl = Math.sin(t * 0.7);
      p.sy = 0.92 + sl * 0.015; p.sx = 1.06 - sl * 0.015;
      p.rot = Math.sin(t * 0.5) * 0.03; p.ty = 3;
      break;
    }
    case "yawn": {
      const ph = Math.sin(clamp01(since / 1.4) * Math.PI); // one 1.4s open/close cycle
      p.sy = 1 + ph * 0.12; p.sx = 1 - ph * 0.06; p.rot = -ph * 0.05; p.ty = -ph * 2;
      break;
    }
    case "curious_tilt": {
      p.rot = Math.sin(t * 1.6) * 0.12;
      p.ty = -Math.abs(Math.sin(t * 1.6)) * 1.5;
      break;
    }
    case "laugh": {
      p.rot = Math.sin(t * 18) * 0.10;
      p.ty = -Math.abs(Math.sin(t * 9)) * 6;
      p.sx = 1 + Math.sin(t * 18) * 0.03; p.sy = 1 - Math.sin(t * 18) * 0.03;
      break;
    }
    case "hug": {
      p.sx = 1 + settleIn * 0.08; p.sy = 1 - settleIn * 0.05;
      p.rot = Math.sin(t * 3) * 0.04 * settleIn;
      break;
    }
    case "dizzy": {
      p.rot = Math.sin(t * 6) * 0.3;
      p.tx = Math.sin(t * 6) * 6;
      p.ty = -Math.abs(Math.sin(t * 3)) * 2;
      break;
    }
    case "proud": {
      p.ty = -6 * settleIn - Math.abs(Math.sin(t * 2)) * 1.5;
      p.sy = 1 + 0.05 * settleIn; p.sx = 1 - 0.03 * settleIn;
      break;
    }
    case "sit": {
      p.sy = 0.88 + Math.sin(t * 2) * 0.01; p.sx = 1.08; p.ty = 4;
      break;
    }
    case "walk_l":
    case "walk_r": {
      const dir = pose === "walk_l" ? -1 : 1;
      const T = 0.45, ph = (t % T) / T, bob = Math.abs(Math.sin(ph * TAU));
      p.ty = -bob * 3;
      p.rot = Math.sin(ph * TAU) * 0.06 * dir;
      p.sx = 1 - bob * 0.03;
      break;
    }
    case "celebrate": {
      p.rot = Math.sin(t * 16) * 0.14;
      p.ty = -Math.abs(Math.sin(t * 8)) * 9;
      p.sx = 1 + Math.sin(t * 16) * 0.04; p.sy = 1 - Math.sin(t * 16) * 0.04;
      break;
    }
    default: {
      const b = Math.sin(t * 2.2);
      p.sy = 1 + b * 0.025; p.sx = 1 - b * 0.025; p.ty = -Math.abs(b) * 2;
    }
  }
  return p;
}

/** Poses that should render with eyes closed (independent of the blink timer below). */
export function isPoseEyesClosed(pose) {
  return pose === "sleep";
}

// --- Mood-driven idle (SPEC GAME-A §A.3) -----------------------------------
// Derives which idle "flavor" to play from live eggCare state (hunger/energy/
// happiness — see src/lib/eggCare.js). This modulates the SAME 'idle' pose
// (bob speed/amplitude + a small per-mood gesture) rather than swapping to a
// different named pose, so it stays inside the 14-pose vocabulary above.

/** @param {{hunger:number,energy:number,happiness:number}} care */
export function deriveCareMood(care) {
  if (!care) return "content";
  if (care.energy <= 30) return "sleepy";
  if (care.hunger <= 40) return "hungry";
  if (care.happiness >= 85) return "happy";
  return "content";
}

/** @param {'happy'|'hungry'|'sleepy'|'content'} careMood */
export function getIdleMoodTransform(careMood, t) {
  const p = { tx: 0, ty: 0, sx: 1, sy: 1, rot: 0, flash: 0 };
  if (careMood === "sleepy") {
    // slower bob + droop + occasional micro-nod
    const sl = Math.sin(t * 1.0);
    p.sy = 0.95 + sl * 0.015; p.sx = 1.03 - sl * 0.015; p.ty = 1.5;
    p.rot = Math.sin(t * 0.35) * 0.05;
  } else if (careMood === "hungry") {
    // slower bob + a periodic downward tummy-glance tilt
    const b = Math.sin(t * 1.4);
    p.sy = 1 + b * 0.02; p.sx = 1 - b * 0.02; p.ty = -Math.abs(b) * 1.5;
    const glance = Math.max(0, Math.sin(t * 0.5 - 1.2));
    p.rot = glance * 0.08;
  } else if (careMood === "happy") {
    // brighter bob + an occasional full spin
    const b = Math.sin(t * 2.6);
    p.sy = 1 + b * 0.03; p.sx = 1 - b * 0.03; p.ty = -Math.abs(b) * 2.5;
    const spinPhase = t % 6;
    if (spinPhase > 5.3) p.rot = ((spinPhase - 5.3) / 0.7) * TAU;
  } else {
    // content: same as the base idle bob
    const b = Math.sin(t * 2.2);
    p.sy = 1 + b * 0.025; p.sx = 1 - b * 0.025; p.ty = -Math.abs(b) * 2;
  }
  return p;
}

// --- Always-on blink (SPEC GAME-A §A.3) ------------------------------------
// Fixed cadence rather than literally re-randomized 3-6s per cycle (which
// would need per-egg persistent state this pure-function draw pipeline
// doesn't carry) — picked 4.2s, inside the spec's 3-6s range, cheap and
// deterministic from `t` alone.
const BLINK_PERIOD = 4.2;
const BLINK_DURATION = 0.12;

/** True during a ~120ms closed-eye window every ~4.2s. */
export function shouldBlink(t) {
  const local = t % BLINK_PERIOD;
  return local > BLINK_PERIOD - BLINK_DURATION;
}

export const EGG_POSE_SYSTEM = {
  POSES: EGG_POSES, get: getPoseTransform, isEyesClosed: isPoseEyesClosed,
  deriveCareMood, getIdleMoodTransform, shouldBlink,
};
