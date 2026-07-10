// src/egg/index.js — single import point for the Living Egg renderer.
//
// Usage:
//   import { drawRegalia, drawBodyMass, isBodyReplacedBy, ... } from "@/egg";
//   import EggCanvas from "@/egg/EggCanvas.jsx";   // created by the integration prompt
//
// NOTE: eggAlgorithm.js is intentionally NOT part of this folder. It is locked
// and lives wherever it already is; none of the layers below import it.

// Base body: round sprite for all stages, palettes, capped-size + saturation helpers
export {
  EGG_SHAPES, STAGE_SHAPE_ROUND, EGG_TINTS, EGG_GRAYSCALE,
  drawEggBody, stageSizeMul, stageSaturation, EGG_BASE_LAYER,
} from "./eggBaseLayer.js";

// Eyes (+ female eyelashes/blush via the `gender` option) and dark-body set
export { EYE_STYLES, EYE_STYLE_KEYS, DARK_BODY_ELEMENTS, drawEyeLayer, EGG_EYE_LAYER } from "./eggEyeLayer.js";

// Expression (mood mouth/brows; shadow uses white "ink")
export { EXPRESSION_KEYS, eyeModeFor, drawExpression, EGG_EXPRESSION_LAYER } from "./eggExpressionLayer.js";

// Legacy element-pattern/crown motif. Kept for reference but EggCanvas does NOT
// use it (regalia replaces head adornment). Import only if you want it.
export { drawElementLayer, ELEMENT_LAYER } from "./eggElementLayer.js";

// Stage: tier mapping, mass bodies (fire/water/shadow/light), and per-tier FX
export { stageToTier, isBodyReplacedBy, drawStageLayer, drawBodyMass, EGG_STAGE_LAYER } from "./eggStageLayer.js";

// Aura glow (5 levels)
export { AURA_LEVELS, drawAuraLayer, EGG_AURA_LAYER } from "./eggAuraLayer.js";

// SPEC GAME-A §A.2: subject-affinity tint + motif badge (sage/architect/
// explorer/prism). Purely additive — separate axis from element above.
export { AFFINITY_COLOR, drawAffinityLayer, EGG_AFFINITY_LAYER } from "./eggAffinityLayer.js";

// Regalia: element-themed stage appendages (fire/shadow horns, light halo,
// thunder Pikachu-tail horns, nature leaf wings; water has none — body spins)
export { regaliaTier, regaliaScale, drawRegalia, EGG_REGALIA_LAYER } from "./eggRegaliaLayer.js";

// Animation poses / pose transform / ground shadow / flash
export {
  getEggPose, isEyesClosed, applyEggPose, flashEgg, drawGroundShadow,
  EGG_STATES, EGG_ANIMATIONS,
} from "./eggAnimations.js";

// Cosmetic items (head + face wearables) drawn last in the render pipeline
export { COSMETIC_ITEMS, drawCosmetics } from "./eggCosmeticLayer.js";

// The React component (created by the integration prompt, same folder):
// export { default as EggCanvas } from "./EggCanvas.jsx";
