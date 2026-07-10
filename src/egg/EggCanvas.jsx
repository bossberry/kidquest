import React, { useRef, useEffect } from 'react'
import {
  drawAuraLayer, drawRegalia, drawBodyMass, isBodyReplacedBy,
  drawStageLayer, drawEyeLayer, drawExpression, drawAffinityLayer,
  getEggPose, applyEggPose, flashEgg, drawGroundShadow, isEyesClosed,
  EGG_SHAPES, stageSizeMul, stageSaturation, stageToTier,
  drawEggBody, drawCosmetics,
} from './index.js'

/**
 * Animated Living Egg renderer — uses the finalized layer system.
 * Props: element, eye, gender, mood, anim, stage, aura, size (logical canvas width).
 * affinityLine (SPEC GAME-A §A.2, optional) — 'sage'|'architect'|'explorer'|'prism';
 * omit/null for no affinity tint or motif (fully backward compatible).
 * Canvas height auto-computed as size * 1.19.
 */
export default function EggCanvas({
  element = 'fire',
  eye = 'gba',
  gender = 'male',
  mood = 'normal',
  anim = 'idle',
  stage = 1,
  aura = 0,
  affinityLine = null,
  size = 160,
  equipped = null,
  className,
  style,
  onClick,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const DPR = window.devicePixelRatio || 1
    const logicalW = size
    const logicalH = Math.round(size * 1.19)

    canvas.width  = Math.round(logicalW * DPR)
    canvas.height = Math.round(logicalH * DPR)

    let raf
    const startTime = performance.now()

    function render() {
      const ctx = canvas.getContext('2d')
      const t = (performance.now() - startTime) / 1000

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.clearRect(0, 0, logicalW, logicalH)

      const shape   = EGG_SHAPES.baby
      const basePx  = Math.max(1, Math.floor(Math.min(logicalW, logicalH) / 32))
      const px      = basePx * stageSizeMul(stage)
      const eggW    = shape.w * px
      const eggH    = shape.h * px
      const tier    = stageToTier(stage)
      const cx      = logicalW / 2
      const groundY = logicalH * 0.83
      const eggCenterY = groundY - eggH / 2
      const eggR    = eggW / 2

      // 1. Aura behind everything — NOT pose-transformed
      drawAuraLayer(ctx, { level: aura, element, cx, cy: eggCenterY, eggR, t })

      // 2. Pose + ground shadow (in canvas space, before pose transform)
      const pose = getEggPose(anim, t)
      drawGroundShadow(ctx, cx, groundY, eggR, pose)

      // 3. Apply pose transform — ctx.save() is called inside applyEggPose
      applyEggPose(ctx, pose, cx, groundY)

      const ox = -eggW / 2
      const oy = -eggH

      // 4. Regalia behind pass (nature leaf wings, drawn before body)
      drawRegalia(ctx, { element, stage, px, ox, oy, faceX: shape.crownX, t, pass: 'behind' })

      // 5. Body
      if (isBodyReplacedBy(element)) {
        // fire/water/shadow/light: draw animated mass instead of solid egg body
        drawBodyMass(ctx, { element, px, ox, oy, t, tier, sprite: shape.sprite })
      } else {
        // nature/thunder: tinted egg body with stage saturation + element FX overlay
        const sat = stageSaturation(stage)
        ctx.filter = `saturate(${Math.round(sat * 100)}%)`
        drawEggBody(ctx, { element, shape: 'baby', px, ox, oy, gender })
        ctx.filter = 'none'
        drawStageLayer(ctx, { element, px, ox, oy, t, tier, sprite: shape.sprite })
      }

      // 5.5. SPEC GAME-A §A.2 subject-affinity tint — faint wash restricted to
      // the just-painted body pixels only (source-atop), before regalia-front/
      // eyes/cosmetics so it never recolors a face or hat.
      drawAffinityLayer(ctx, { line: affinityLine, pass: 'tint', px, ox, oy, eggW, eggH, t })

      // 6. Regalia front pass (flame/shadow horns, light halo, thunder Pikachu-horns)
      drawRegalia(ctx, { element, stage, px, ox, oy, faceX: shape.crownX, t, pass: 'front' })

      // 7. Eyes (female gets eyelashes + blush via gender param)
      const blink = isEyesClosed(anim) || mood === 'sleepy'
      drawEyeLayer(ctx, {
        style: eye, element, px, ox, oy,
        faceX: shape.crownX, eyeY: shape.eyeY,
        blink, gender,
      })

      // 8. Expression overlay (brows, mouth, cheeks, extras)
      drawExpression(ctx, {
        mood, eyeStyle: eye, element,
        faceX: shape.crownX, eyeY: shape.eyeY, mouthY: shape.mouthY,
        px, ox, oy, t,
      })

      // 9. Cosmetics (hat + face items — drawn on top of everything, inside pose)
      drawCosmetics(ctx, { px, ox, oy, faceX: shape.crownX, t }, equipped)

      // 9.5. SPEC GAME-A §A.2 subject-affinity motif — small pinned badge,
      // drawn last (over cosmetics) so it always reads as a visible accessory.
      drawAffinityLayer(ctx, { line: affinityLine, pass: 'motif', px, ox, oy, eggW, eggH, t })

      // 10. Flash (e.g., hurt animation)
      if (pose.flash) flashEgg(ctx, eggW, eggH, pose.flash)

      // Restore pose transform (matches ctx.save() inside applyEggPose)
      ctx.restore()

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(raf) }
  }, [element, eye, gender, mood, anim, stage, aura, affinityLine, size, equipped])

  const logicalH = Math.round(size * 1.19)
  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: logicalH, imageRendering: 'pixelated', display: 'block', ...style }}
      className={className}
      onClick={onClick}
    />
  )
}
