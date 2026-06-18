import { useRef, useEffect } from 'react'
import { mkBeam, mkOrb, mkLightning, mkSparks, tickEffects } from '../lib/particles.js'

/**
 * useBattleEffects — owns the particle/effect canvas system for battle attacks:
 * canvas sizing (synced to the battle field via ResizeObserver), the RAF tick
 * loop that animates particles, and spawnEffect() which queues new particles
 * based on attack type and subject.
 *
 * @param {object} params
 * @param {React.MutableRefObject} params.battleFieldRef
 * @param {React.MutableRefObject} params.eggDivRef
 * @param {React.MutableRefObject} params.enemyDivRef
 * @param {string} params.subject - 'thai' | 'math' | 'eng', determines attack visual
 */
export function useBattleEffects({ battleFieldRef, eggDivRef, enemyDivRef, subject }) {
  const effectCanvasRef  = useRef(null)
  const overlayCanvasRef = useRef(null)
  const effectsRef       = useRef([])
  const effectRafRef     = useRef(null)
  const rafTimeRef       = useRef(0)

  // Sync effect canvas + overlay canvas size to battle field
  useEffect(() => {
    const field   = battleFieldRef.current
    const canvas  = effectCanvasRef.current
    const overlay = overlayCanvasRef.current
    if (!field || !canvas) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        canvas.width  = Math.round(entry.contentRect.width)
        canvas.height = Math.round(entry.contentRect.height)
        if (overlay) {
          overlay.width  = Math.round(entry.contentRect.width)
          overlay.height = Math.round(entry.contentRect.height)
        }
      }
    })
    ro.observe(field)
    return () => ro.disconnect()
  }, []) // eslint-disable-line

  // Effects RAF loop
  useEffect(() => {
    const canvas = effectCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let alive = true
    function loop(now) {
      if (!alive) return
      const dt = rafTimeRef.current ? Math.min(50, now - rafTimeRef.current) : 16
      rafTimeRef.current = now
      if (effectsRef.current.length > 0) {
        effectsRef.current = tickEffects(ctx, effectsRef.current, dt)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      effectRafRef.current = requestAnimationFrame(loop)
    }
    effectRafRef.current = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(effectRafRef.current) }
  }, []) // eslint-disable-line

  function spawnEffect(type) {
    const field   = battleFieldRef.current
    const eggEl   = eggDivRef.current
    const enemyEl = enemyDivRef.current
    if (!field || !eggEl || !enemyEl) return
    const fr = field.getBoundingClientRect()
    const er = eggEl.getBoundingClientRect()
    const nr = enemyEl.getBoundingClientRect()
    const ex = er.left + er.width  / 2 - fr.left
    const ey = er.top  + er.height / 2 - fr.top
    const nx = nr.left + nr.width  / 2 - fr.left
    const ny = nr.top  + nr.height / 2 - fr.top

    if (type === 'attack') {
      if (subject === 'thai')      effectsRef.current.push(mkOrb(ex,ey,nx,ny,'#FFD700'))
      else if (subject === 'math') effectsRef.current.push(mkBeam(ex,ey,nx,ny,'#44ff88'))
      else                         effectsRef.current.push(mkLightning(ex,ey,nx,ny,380,13))
    } else if (type === 'combo') {
      effectsRef.current.push(mkLightning(ex,ey,nx,ny,380,7))
      effectsRef.current.push(mkOrb(ex,ey,nx,ny,'#FFD700',400,60))
    } else if (type === 'ultimate') {
      effectsRef.current.push(mkBeam(ex,ey,nx,ny,'#FFD700',300))
      effectsRef.current.push(mkLightning(ex,ey,nx,ny,420,29))
      effectsRef.current.push(mkOrb(ex,ey,nx,ny,'#ff8800',440,80))
    } else if (type === 'miss') {
      effectsRef.current.push(mkSparks(ex,ey))
    } else if (type === 'xp') {
      for (let i = 0; i < 3; i++) effectsRef.current.push(mkOrb(nx,ny,ex,ey,'#FFD700',580,i*140))
    }
  }

  return { effectCanvasRef, overlayCanvasRef, spawnEffect }
}
