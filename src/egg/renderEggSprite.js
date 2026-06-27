/**
 * renderEggSprite — full egg pipeline for non-React canvas contexts.
 *
 * Draws the complete living-egg compositing chain (aura → pose → regalia-behind
 * → body → regalia-front → eyes → expression) directly onto `ctx`.
 * Call after ctx.clearRect(); the sprite is self-contained.
 *
 * Params:
 *   element, eye, gender, stage, aura, mood, anim — egg identity/state
 *   t           — animation time in seconds (use performance.now()/1000)
 *   canvasSize  — logical canvas width (height = canvasSize * 1.19)
 *   basePxOverride — if set, overrides the computed pixel-scale (use 2 for
 *                    48-63 px sprites so the egg fills the frame)
 */
import {
  drawAuraLayer, drawRegalia, drawBodyMass, isBodyReplacedBy,
  drawStageLayer, drawEyeLayer, drawExpression,
  getEggPose, applyEggPose, flashEgg, drawGroundShadow, isEyesClosed,
  EGG_SHAPES, stageSizeMul, stageSaturation, stageToTier,
  drawEggBody,
} from './index.js'

export function renderEggSprite(ctx, {
  element = 'fire',
  eye     = 'gba',
  gender  = 'male',
  stage   = 1,
  aura    = 0,
  mood    = 'normal',
  anim    = 'idle',
  t       = 0,
  canvasSize    = 48,
  basePxOverride = null,
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
  drawAuraLayer(ctx, { level: aura, element, cx, cy: eggCenterY, eggR, t })

  // 2. Pose + ground shadow
  const pose = getEggPose(anim, t)
  drawGroundShadow(ctx, cx, groundY, eggR, pose)

  // 3. Apply pose transform — applyEggPose calls ctx.save()
  applyEggPose(ctx, pose, cx, groundY)

  const ox = -eggW / 2
  const oy = -eggH

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

  // 6. Regalia front (horns, halo, thunder prongs)
  drawRegalia(ctx, { element, stage, px, ox, oy, faceX: shape.crownX, t, pass: 'front' })

  // 7. Eyes
  const blink = isEyesClosed(anim) || mood === 'sleepy'
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

  // 9. Flash overlay (hurt animation)
  if (pose.flash) flashEgg(ctx, eggW, eggH, pose.flash)

  // Restore pose transform (matches ctx.save() from applyEggPose)
  ctx.restore()
}
