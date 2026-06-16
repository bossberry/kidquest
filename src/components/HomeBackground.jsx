import React, { useRef, useEffect } from 'react'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'

const P = {
  skyD1:'#4ec8f0', skyD2:'#87ddff', skyD3:'#d4f7c0',
  skyN1:'#0a1a3a', skyN2:'#1a2a5a', skyN3:'#2a3a7a',
  gTop:'#5ac85a',  gMid:'#3a9a3a',  gBot:'#2a7a2a',
  gNTop:'#1a3c1a', gNMid:'#0e2010', gNBot:'#0a1a0e',
  mtn1D:'#a8d4a8', mtn2D:'#90c490',
  mtn1N:'#121e3c', mtn2N:'#0e1c32',
  trunk:'#5a3808', trunkN:'#182818',
  leaf1:'#6ec040', leaf2:'#4a9828',
  leafN1:'#1c3c1e', leafN2:'#122816',
  path:'#d2b478', pathN:'#233750',
  sun1:'#f8f040', sun2:'#f0c000', sunW:'#fffff0',
  moon1:'#f8f0c0', moon2:'#eadc70',
  cloud1:'#e8f0ff', cloud2:'#c8d4ee',
  fl1:'#ff88cc', fl2:'#ffdd44', fl3:'#88aaff', flC:'#f0d020',
  bfPink:'#ff99dd', bfYel:'#ffcc44', bfBody:'#443322',
  bird:'#554433',
}

const SIZE = 48

function makeEntity(egg, i, count, W, groundY) {
  // Deterministic seed per creature so initial positions/speeds are stable
  let s = Math.abs(((egg.id ?? '').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)) + i * 97)
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff }
  const startFrac = count === 1 ? 0.5 : 0.15 + (i / Math.max(1, count - 1)) * 0.70
  return {
    x: W * startFrac,
    y: groundY,
    dir: i % 2 === 0 ? 1 : -1,
    speed: 0.3 + rng() * 0.5,
    walkFrame: 0,
    walkFrameTimer: 0,
    state: 'walk',
    stateTimer: 120 + Math.floor(rng() * 180),
    jumpY: 0,
    jumpVel: 0,
    spinAngle: 0,
    meetingTimer: 0,
  }
}

export default function HomeBackground({ hour, creatures }) {
  const h = hour ?? new Date().getHours()
  const isDay = h >= 6 && h < 19

  const canvasRef   = useRef(null)
  const rafRef      = useRef(null)
  const offscreens  = useRef([])
  const entitiesRef = useRef([])

  // Rebuild offscreen canvases when creatures change
  useEffect(() => {
    offscreens.current = (creatures ?? []).map(egg => {
      const off = document.createElement('canvas')
      off.width  = SIZE
      off.height = SIZE
      drawCreature(off, getCreatureSeed(egg), egg.eggStats ?? egg.stats ?? {})
      return off
    })
  }, [creatures]) // eslint-disable-line

  // Rebuild entities when creature count changes
  useEffect(() => {
    const list = creatures ?? []
    const count = list.length
    if (entitiesRef.current.length === count) return
    const W = window.innerWidth
    const GY = Math.floor(Math.floor(window.innerHeight * 0.65) * 0.76)
    entitiesRef.current = list.map((egg, i) => makeEntity(egg, i, count, W, GY - SIZE))
  }, [creatures]) // eslint-disable-line

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const W = window.innerWidth
    const H = Math.floor(window.innerHeight * 0.65)
    canvas.width  = W
    canvas.height = H

    const S   = Math.max(1, Math.floor(W / 160))
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    const GY = Math.floor(H * 0.76)

    function fr(color, x, y, w, h2) {
      ctx.fillStyle = color
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h2)))
    }

    function drawSky() {
      if (isDay) {
        fr(P.skyD1, 0, 0,        W, H * 0.50)
        fr(P.skyD2, 0, H * 0.50, W, H * 0.22)
        fr(P.skyD3, 0, H * 0.72, W, H * 0.28)
      } else {
        fr(P.skyN1, 0, 0,        W, H * 0.50)
        fr(P.skyN2, 0, H * 0.50, W, H * 0.25)
        fr(P.skyN3, 0, H * 0.75, W, H * 0.25)
      }
    }

    function drawMountain(x, baseY, w, h2, color) {
      const rows = Math.max(1, Math.floor(h2 / S))
      for (let i = 0; i < rows; i++) {
        const ratio = i / rows
        const rw = Math.floor(w * (1 - ratio))
        const rx = Math.floor(x + w / 2 - rw / 2)
        ctx.fillStyle = color
        ctx.fillRect(rx, Math.floor(baseY - h2 + i * S), rw, S)
      }
    }

    function drawGround() {
      fr(isDay ? P.gTop  : P.gNTop,  0, GY,         W, 4 * S)
      fr(isDay ? P.gMid  : P.gNMid,  0, GY + 4 * S, W, 4 * S)
      fr(isDay ? P.gBot  : P.gNBot,  0, GY + 8 * S, W, H - GY - 8 * S)
    }

    function drawTree(cx, baseY) {
      const tw = 3 * S, th = 10 * S
      const lw = 14 * S, lh = 18 * S
      fr(isDay ? P.trunk : P.trunkN, cx - tw / 2, baseY - th, tw, th)
      const rows = Math.floor(lh / S)
      for (let i = 0; i < rows; i++) {
        const ratio = i / rows
        const rw = Math.floor(lw * (1 - ratio))
        const rx = Math.floor(cx - rw / 2)
        const ry = Math.floor(baseY - th - lh + i * S)
        ctx.fillStyle = i < rows / 2 ? (isDay ? P.leaf1 : P.leafN1) : (isDay ? P.leaf2 : P.leafN2)
        ctx.fillRect(rx, ry, rw, S)
      }
    }

    function drawPath(cx, baseY) {
      const rows = 14 * S
      for (let i = 0; i < rows; i += S) {
        const ratio = i / rows
        const pw = Math.floor((8 + ratio * 20) * S)
        const px = Math.floor(cx - pw / 2)
        ctx.fillStyle = isDay ? P.path : P.pathN
        ctx.fillRect(px, baseY - rows + i, pw, S)
      }
    }

    function drawFlower(cx, y, color) {
      const px = Math.floor(cx), py = Math.floor(y)
      ctx.fillStyle = color
      ctx.fillRect(px - S,     py - 3 * S, 2 * S, 2 * S)
      ctx.fillRect(px - S,     py + S,     2 * S, 2 * S)
      ctx.fillRect(px - 3 * S, py - S,     2 * S, 2 * S)
      ctx.fillRect(px + S,     py - S,     2 * S, 2 * S)
      ctx.fillStyle = P.flC
      ctx.fillRect(px - S, py - S, 2 * S, 2 * S)
    }

    function drawStatic() {
      drawSky()
      drawMountain(W * 0.04, H * 0.63, W * 0.53, H * 0.28, isDay ? P.mtn1D : P.mtn1N)
      drawMountain(W * 0.47, H * 0.65, W * 0.53, H * 0.22, isDay ? P.mtn2D : P.mtn2N)
      drawGround()
      drawTree(W * 0.07, GY)
      drawTree(W * 0.87, GY)
      drawPath(W / 2, GY)
      if (isDay) {
        const fxs = [0.12, 0.22, 0.35, 0.48, 0.58, 0.70, 0.80, 0.90]
        const fcs = [P.fl1, P.fl2, P.fl3, P.fl1, P.fl2, P.fl3, P.fl1, P.fl2]
        fxs.forEach((fx, i) => drawFlower(W * fx, GY - 2, fcs[i]))
      }
    }

    function drawSun(t) {
      const pulse = 1 + Math.sin(t * 0.02) * 0.12
      const cx = Math.floor(W * 0.84)
      const cy = Math.floor(H * 0.11)
      const r  = Math.floor(6 * S * pulse)
      const rl = Math.floor(4 * S)
      fr(P.sun1, cx - r, cy - r, 2 * r, 2 * r)
      fr(P.sunW, cx - S, cy - S, S, S)
      ctx.fillStyle = P.sun2
      ctx.fillRect(cx - S, cy - r - rl, 2 * S, rl)
      ctx.fillRect(cx - S, cy + r,       2 * S, rl)
      ctx.fillRect(cx - r - rl, cy - S,  rl,    2 * S)
      ctx.fillRect(cx + r,      cy - S,  rl,    2 * S)
      const dr = Math.floor(rl * 0.6)
      ctx.fillRect(cx - r - dr, cy - r - dr, dr, dr)
      ctx.fillRect(cx + r,      cy - r - dr, dr, dr)
      ctx.fillRect(cx - r - dr, cy + r,      dr, dr)
      ctx.fillRect(cx + r,      cy + r,      dr, dr)
    }

    function drawMoon() {
      const cx = Math.floor(W * 0.82)
      const cy = Math.floor(H * 0.10)
      const r  = 5 * S
      fr(P.moon1, cx - r, cy - r, 2 * r, 2 * r)
      fr(P.moon2, cx - r + S, cy - r + S, 2 * r - S, 2 * r - S)
      fr(P.skyN1, cx - r + 3 * S, cy - r, 2 * r, 2 * r)
    }

    const STAR_POS = [
      [0.04, 0.06, 0.0], [0.09, 0.16, 0.8], [0.16, 0.07, 1.4],
      [0.23, 0.20, 0.4], [0.30, 0.09, 2.0], [0.38, 0.14, 1.1],
      [0.46, 0.04, 1.8], [0.55, 0.18, 0.6], [0.64, 0.08, 2.3],
      [0.72, 0.13, 1.6], [0.80, 0.19, 0.9], [0.90, 0.06, 2.1],
    ]

    function drawStars(t) {
      STAR_POS.forEach(([fx, fy, phase]) => {
        const b = (Math.sin(t * 0.05 + phase) + 1) * 0.5
        if (b > 0.3) {
          ctx.fillStyle = `rgba(255,252,230,${b.toFixed(2)})`
          ctx.fillRect(Math.floor(fx * W), Math.floor(fy * H), S, S)
        }
      })
    }

    function drawCloud(x, y, w, h2) {
      fr(P.cloud1, x, y + h2 * 0.35, w, h2 * 0.65)
      fr(P.cloud1, x + w * 0.2, y, w * 0.6, h2)
      fr(P.cloud2, x, y + h2 * 0.65, w, h2 * 0.35)
    }

    function drawButterfly(bx, by, color, wingPhase) {
      const open = Math.abs(Math.cos(wingPhase))
      const ww   = Math.max(S, Math.floor(5 * S * open))
      ctx.fillStyle = color
      ctx.fillRect(Math.floor(bx) - ww - S, Math.floor(by), ww, 3 * S)
      ctx.fillRect(Math.floor(bx) + S,      Math.floor(by), ww, 3 * S)
      fr(P.bfBody, Math.floor(bx) - S, Math.floor(by), 2 * S, 4 * S)
    }

    function drawBird(bx, by, wingPhase) {
      const wingY = Math.sin(wingPhase) > 0 ? 0 : S
      const bxf = Math.floor(bx), byf = Math.floor(by)
      ctx.fillStyle = P.bird
      ctx.fillRect(bxf,           byf + S,    3 * S, S)
      ctx.fillRect(bxf - 3 * S,  byf + wingY, 3 * S, S)
      ctx.fillRect(bxf + 3 * S,  byf + wingY, 3 * S, S)
    }

    function drawFirefly(fx, fy, t, phase) {
      const g = (Math.sin(t * 0.08 + phase) + 1) * 0.5
      if (g > 0.35) {
        ctx.fillStyle = `rgba(255,255,170,${g.toFixed(2)})`
        ctx.fillRect(Math.floor(fx) - S, Math.floor(fy) - S, 4 * S, 4 * S)
        ctx.fillStyle = `rgba(255,255,170,${(g * 0.8).toFixed(2)})`
        ctx.fillRect(Math.floor(fx), Math.floor(fy), 2 * S, 2 * S)
      }
    }

    // Non-creature animation state (clouds, butterflies, bird, fireflies)
    const anim = {
      clouds: [
        { x: W * 0.15, y: H * 0.14, w: 24 * S, h: 8 * S, spd: 0.30 },
        { x: W * 0.55, y: H * 0.07, w: 16 * S, h: 6 * S, spd: 0.18 },
        { x: W * 0.78, y: H * 0.19, w: 20 * S, h: 7 * S, spd: 0.25 },
      ],
      bf: [
        { x: W * 0.25, baseY: H * 0.38, vx: 0.70, phase: 0,       wingP: 0,         color: P.bfPink },
        { x: W * 0.65, baseY: H * 0.44, vx: 0.45, phase: Math.PI, wingP: Math.PI/2, color: P.bfYel  },
      ],
      bird:  { x: -20 * S, vx: 1.0, wingP: 0 },
      ff: [
        { x: W * 0.22, baseY: H * 0.46, phase: 0 },
        { x: W * 0.68, baseY: H * 0.40, phase: Math.PI * 0.5 },
        { x: W * 0.44, baseY: H * 0.52, phase: Math.PI },
        { x: W * 0.80, baseY: H * 0.48, phase: Math.PI * 1.5 },
      ],
    }

    function updateEntities() {
      const ents = entitiesRef.current
      if (!ents.length) return

      // Meeting gimmick — two creatures walking toward each other
      for (let i = 0; i < ents.length; i++) {
        for (let j = i + 1; j < ents.length; j++) {
          const a = ents[i], b = ents[j]
          if (a.meetingTimer <= 0 && b.meetingTimer <= 0 &&
              a.state === 'walk' && b.state === 'walk' &&
              Math.abs(a.x - b.x) < 40) {
            a.state = b.state = 'idle'
            a.dir   = a.x < b.x ?  1 : -1  // face each other
            b.dir   = b.x < a.x ?  1 : -1
            a.meetingTimer = b.meetingTimer = 60
            a.stateTimer   = b.stateTimer   = 60
          }
        }
      }

      ents.forEach(e => {
        e.stateTimer--
        if (e.meetingTimer > 0) e.meetingTimer--

        // State transition when timer expires
        if (e.stateTimer <= 0) {
          if (e.meetingTimer > 0) {
            e.state      = 'idle'
            e.stateTimer = e.meetingTimer
          } else {
            const r = Math.random()
            if (r < 0.50) {
              e.state      = 'walk'
              e.stateTimer = 120 + Math.floor(Math.random() * 180)
            } else if (r < 0.70) {
              e.state      = 'idle'
              e.stateTimer = 60  + Math.floor(Math.random() * 60)
            } else if (r < 0.85) {
              e.state      = 'jump'
              e.jumpY      = 0
              e.jumpVel    = -4
              e.stateTimer = 120
            } else {
              e.state      = 'spin'
              e.spinAngle  = 0
              e.stateTimer = 60  + Math.floor(Math.random() * 60)
            }
          }
        }

        // 0.5% spontaneous jump while walking
        if (e.state === 'walk' && Math.random() < 0.005) {
          e.state = 'jump'; e.jumpY = 0; e.jumpVel = -4; e.stateTimer = 120
        }

        switch (e.state) {
          case 'walk':
            e.x += e.dir * e.speed
            if (e.x < SIZE / 2 + 10)     { e.x = SIZE / 2 + 10;       e.dir =  1 }
            if (e.x > W - SIZE / 2 - 10) { e.x = W - SIZE / 2 - 10;   e.dir = -1 }
            break
          case 'jump':
            e.jumpY   += e.jumpVel
            e.jumpVel += 0.3
            if (e.jumpY >= 0) {
              e.jumpY = 0; e.jumpVel = 0
              e.state = 'walk'
              e.stateTimer = 120 + Math.floor(Math.random() * 180)
            }
            break
          case 'spin':
            e.spinAngle += 0.15
            break
          default: break // 'idle' — bob handled in draw
        }

        e.walkFrameTimer++
        if (e.walkFrameTimer >= 20) {
          e.walkFrame     = 1 - e.walkFrame
          e.walkFrameTimer = 0
        }
      })
    }

    function drawEntities(t) {
      const ents = entitiesRef.current
      const offs = offscreens.current
      if (!ents.length || !offs.length) return

      // Which creature is closest to screen center gets a glow
      let centerIdx = 0, minDist = Infinity
      ents.forEach((e, i) => {
        const d = Math.abs(e.x - W / 2)
        if (d < minDist) { minDist = d; centerIdx = i }
      })

      ents.forEach((e, i) => {
        if (!offs[i]) return
        const bobOffset = e.state === 'idle' ? Math.floor(Math.sin(t * 0.1) * 2) : 0
        const drawY = Math.floor(e.y + e.jumpY + bobOffset)
        const drawX = Math.floor(e.x - SIZE / 2)

        // Soft glow halo for center creature (only meaningful with 2+)
        if (i === centerIdx && ents.length > 1) {
          ctx.save()
          ctx.shadowColor = 'rgba(255,220,80,0.9)'
          ctx.shadowBlur  = 14
          ctx.drawImage(offs[i], drawX, drawY, SIZE, SIZE)
          ctx.restore()
        }

        // Main draw — spin uses rotate transform, left-walk uses horizontal flip
        ctx.save()
        if (e.state === 'spin') {
          ctx.translate(Math.floor(e.x), drawY + SIZE / 2)
          ctx.rotate(e.spinAngle)
          ctx.drawImage(offs[i], -SIZE / 2, -SIZE / 2, SIZE, SIZE)
        } else if (e.dir < 0) {
          // Flip around creature center: translate to cx, scale -1, draw at -SIZE/2
          ctx.translate(Math.floor(e.x), 0)
          ctx.scale(-1, 1)
          ctx.drawImage(offs[i], -SIZE / 2, drawY, SIZE, SIZE)
        } else {
          ctx.drawImage(offs[i], drawX, drawY, SIZE, SIZE)
        }
        ctx.restore()
      })
    }

    let t = 0
    function frame() {
      t++
      ctx.clearRect(0, 0, W, H)
      drawStatic()

      if (isDay) {
        drawSun(t)
        anim.clouds.forEach(c => {
          c.x -= c.spd
          if (c.x + c.w < 0) c.x = W + c.w
          drawCloud(c.x, c.y, c.w, c.h)
        })
        anim.bf.forEach(b => {
          b.x     += b.vx
          b.phase += 0.04
          b.wingP += 0.18
          if (b.x > W + 20 * S) b.x = -20 * S
          drawButterfly(b.x, b.baseY + Math.sin(b.phase) * 10 * S, b.color, b.wingP)
        })
        anim.bird.x     += anim.bird.vx
        anim.bird.wingP += 0.22
        if (anim.bird.x > W + 30 * S) anim.bird.x = -30 * S
        drawBird(anim.bird.x, H * 0.10, anim.bird.wingP)
      } else {
        drawMoon()
        drawStars(t)
        anim.ff.forEach(f => {
          const fx = f.x + Math.sin(t * 0.02 + f.phase * 0.7) * 5 * S
          const fy = f.baseY + Math.sin(t * 0.03 + f.phase) * 8 * S
          drawFirefly(Math.floor(fx), Math.floor(fy), t, f.phase)
        })
      }

      updateEntities()
      drawEntities(t)

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isDay])

  return (
    <div style={{ position:'absolute', inset:0, zIndex:-1, pointerEvents:'none' }}>
      <canvas
        ref={canvasRef}
        style={{ display:'block', width:'100%', height:'65vh', imageRendering:'pixelated' }}
      />
      <div style={{
        position:'absolute', left:0, right:0, bottom:0, top:'65vh',
        background: isDay ? '#2a7a2a' : '#0a1a0e',
      }} />
    </div>
  )
}
