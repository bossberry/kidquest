/**
 * renderEggSprite — full egg pipeline for non-React canvas contexts.
 *
 * Draws the complete living-egg compositing chain (aura → pose → regalia-behind
 * → body → regalia-front → eyes → expression) directly onto `ctx`.
 * Call after ctx.clearRect(); the sprite is self-contained.
 *
 * Params:
 *   element, eye, gender, stage, aura, mood, anim — egg identity/state
 *   affinityLine (SPEC GAME-A §A.2, optional) — 'sage'|'architect'|'explorer'|
 *                'prism'; omit/null for no affinity tint or motif
 *   t           — animation time in seconds (use performance.now()/1000)
 *   canvasSize  — logical canvas width (height = canvasSize * 1.19)
 *   basePxOverride — if set, overrides the computed pixel-scale (use 2 for
 *                    48-63 px sprites so the egg fills the frame)
 *   lowFx       — SPEC GAME-A §A.3, optional — true skips the element aura
 *                 particle pass (no global perf-settings system exists yet
 *                 to source this from automatically; callers opt in)
 *   careMood    — SPEC GAME-A §A.3, optional — 'happy'|'hungry'|'sleepy'|
 *                 'content' (see deriveCareMood in eggPoses.js). Only
 *                 modulates the plain 'idle' anim; ignored otherwise.
 *   equipped    — SPEC GAME-B §B.1, optional — {head,face,body,back} cosmetic
 *                 ids; body/back are new slots, see eggCosmeticLayer.js
 *   auraTint    — SPEC GAME-B §B.1, optional — hex color override for the
 *                 aura glow (full outfit-set bonus, see outfitSets.js);
 *                 ignored at aura level 4 (legendary stays rainbow)
 *   setPose     — SPEC GAME-B §B.1, optional — pose name override for the
 *                 plain 'idle' anim (full outfit-set exclusive pose); takes
 *                 priority over careMood when both are set
 */
import {
  drawAuraLayer, drawRegalia, drawBodyMass, isBodyReplacedBy,
  drawStageLayer, drawEyeLayer, drawExpression, drawAffinityLayer,
  getEggPose, applyEggPose, flashEgg, drawGroundShadow, isEyesClosed,
  EGG_SHAPES, stageSizeMul, stageSaturation, stageToTier,
  drawEggBody, drawCosmetics, drawEggRimLight, shouldBlink,
} from './index.js'

export function renderEggSprite(ctx, {
  element = 'fire',
  eye     = 'gba',
  gender  = 'male',
  stage   = 1,
  aura    = 0,
  affinityLine = null,
  mood    = 'normal',
  anim    = 'idle',
  t       = 0,
  canvasSize    = 48,
  basePxOverride = null,
  equipped = null,
  lowFx = false,
  careMood = null,
  auraTint = null,
  setPose = null,
}) {
  const logicalW  = canvasSize
  const logicalH  = Math.round(canvasSize * 1.19)
  const shape     = EGG_SHAPES.baby
  const basePx    = basePxOverride ?? Math.max(1, Math.floor(Math.min(logicalW, logicalH) / 32))
  const px        = basePx * stageSizeMul(stage)
  const eggW      = shape.w * px
  const eggH      = shape.h * px
  const tier      = stageToTier(stage)
  const cx        = logicalW / 2
  const groundY   = logicalH * 0.83
  const eggCenterY = groundY - eggH / 2
  const eggR      = eggW / 2

  // 1. Aura (behind everything, not pose-transformed)
  drawAuraLayer(ctx, { level: aura, element, cx, cy: eggCenterY, eggR, t, stage, lowFx, tintOverride: auraTint })

  // 2. Pose + ground shadow — SPEC GAME-A §A.3 mood-driven idle, SPEC GAME-B
  // §B.1 full-outfit-set exclusive pose (takes priority over careMood)
  const pose = getEggPose(anim, t, careMood, setPose)
  drawGroundShadow(ctx, cx, groundY, eggR, pose)

  // 3. Apply pose transform — applyEggPose calls ctx.save()
  applyEggPose(ctx, pose, cx, groundY)

  const ox = -eggW / 2
  const oy = -eggH

  // 3.5. SPEC GAME-B §B.1 back-slot cosmetic (packs/wings/capes) — behind the
  // body, same depth idea as regalia-behind, drawn first so it reads as worn.
  drawCosmetics(ctx, { px, ox, oy, faceX: shape.crownX, t }, equipped, 'behind')

  // 4. Regalia behind (nature leaf wings)
  drawRegalia(ctx, { element, stage, px, ox, oy, faceX: shape.crownX, t, pass: 'behind' })

  // 5. Body
  if (isBodyReplacedBy(element)) {
    drawBodyMass(ctx, { element, px, ox, oy, t, tier, sprite: shape.sprite })
  } else {
    const sat = stageSaturation(stage)
    ctx.filter = `saturate(${Math.round(sat * 100)}%)`
    drawEggBody(ctx, { element, shape: 'baby', px, ox, oy, gender })
    ctx.filter = 'none'
    drawStageLayer(ctx, { element, px, ox, oy, t, tier, sprite: shape.sprite })
  }

  // 5.2. SPEC GAME-B §B.1 body-slot cosmetic (outfit) — overlay band on the
  // just-painted body, before rim light/affinity so those still read on top.
  drawCosmetics(ctx, { px, ox, oy, faceX: shape.crownX, t }, equipped, 'body')

  // 5.3. SPEC GAME-A §A.3 rim light — sells roundness, on every body-render path
  drawEggRimLight(ctx, { shape: 'baby', px, ox, oy })

  // 5.5. SPEC GAME-A §A.2 subject-affinity tint (source-atop, body pixels only)
  drawAffinityLayer(ctx, { line: affinityLine, pass: 'tint', px, ox, oy, eggW, eggH, t })

  // 6. Regalia front (horns, halo, thunder prongs)
  drawRegalia(ctx, { element, stage, px, ox, oy, faceX: shape.crownX, t, pass: 'front' })

  // 7. Eyes — SPEC GAME-A §A.3: always-on blink layered atop pose/mood state
  const blink = isEyesClosed(anim) || mood === 'sleepy' || shouldBlink(t)
  drawEyeLayer(ctx, {
    style: eye, element, px, ox, oy,
    faceX: shape.crownX, eyeY: shape.eyeY,
    blink, gender,
  })

  // 8. Expression (brows, mouth, cheeks)
  drawExpression(ctx, {
    mood, eyeStyle: eye, element,
    faceX: shape.crownX, eyeY: shape.eyeY, mouthY: shape.mouthY,
    px, ox, oy, t,
  })

  // 9. Cosmetics (hat + face items — on top of everything, inside pose)
  drawCosmetics(ctx, { px, ox, oy, faceX: shape.crownX, t }, equipped)

  // 9.5. SPEC GAME-A §A.2 subject-affinity motif (small pinned badge, on top)
  drawAffinityLayer(ctx, { line: affinityLine, pass: 'motif', px, ox, oy, eggW, eggH, t })

  // 10. Flash overlay (hurt animation)
  if (pose.flash) flashEgg(ctx, eggW, eggH, pose.flash)

  // Restore pose transform (matches ctx.save() from applyEggPose)
  ctx.restore()
}
