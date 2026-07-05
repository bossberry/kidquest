// minigameUI.jsx — shared visual/UX layer for the 5 minigames (2026-07-05).
//   • THEMES        per-game colour palette + ambient shape kind
//   • MinigameBg    paint-once themed backdrop canvas (BattleBackground pattern)
//   • InGameHUD     themed top strip: hearts (right) + live coin preview (left) + center label
//   • MinigameResult redesigned game-over screen: bounce emoji, gold Press-Start score,
//                    coin-fly + spinning coin count, hearts row, retry / home buttons
//                    (retry auto-disabled → "😴 พรุ่งนี้นะ!" when no daily lives remain)
import React, { useRef, useEffect, useState } from 'react'
import { heartsStr } from '../../lib/minigameLives.js'

const GOLD = '#FFD23F'

// Per-game palette + ambient decoration kind (drawn once behind the game).
export const THEMES = {
  memory:  { top:'#0f1b3d', bot:'#25306b', accent:'#7F77DD', ink:'#cfd8ff', amb:'stars' },
  catch:   { top:'#7cc0ff', bot:'#cfeaff', accent:'#1D9E75', ink:'#0C447C', amb:'clouds' },
  tower:   { top:'#2a1a44', bot:'#150f26', accent:'#7F77DD', ink:'#d8c7ff', amb:'stone' },
  eggrun:  { top:'#1e5a30', bot:'#0c2a16', accent:'#1D9E75', ink:'#c7ffd8', amb:'speed' },
  fishing: { top:'#0d6b7e', bot:'#062730', accent:'#378ADD', ink:'#bfeeff', amb:'bubbles' },
}

// Paint the themed gradient + 2–3 ambient shapes ONCE (no per-frame animation) —
// same "static offscreen paint" approach used by BattleBackground / DressingRoom.
export function paintMinigameBg(canvas, gameKey) {
  const t = THEMES[gameKey]; if (!canvas || !t) return
  const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, t.top); g.addColorStop(1, t.bot)
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  const rnd = (seed => () => (seed = (seed * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff)(97)

  if (t.amb === 'stars') {
    for (let i = 0; i < 42; i++) {
      const r = rnd() * 1.6 + 0.4
      ctx.globalAlpha = 0.3 + rnd() * 0.6
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H * 0.85, r, 0, Math.PI * 2); ctx.fill()
    }
  } else if (t.amb === 'clouds') {
    ctx.globalAlpha = 0.85; ctx.fillStyle = 'rgba(255,255,255,.9)'
    for (let i = 0; i < 3; i++) {
      const cx = rnd() * W, cy = 20 + rnd() * H * 0.4, s = 26 + rnd() * 26
      for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(cx + j * s * 0.55 - s, cy, s * (0.6 + rnd() * 0.4), 0, Math.PI * 2); ctx.fill() }
    }
  } else if (t.amb === 'stone') {
    ctx.globalAlpha = 0.5
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(120,90,160,.4)' : 'rgba(70,50,110,.5)'
      const bw = 60 + rnd() * 90, bx = rnd() * (W - bw), by = H * 0.5 + rnd() * H * 0.4
      ctx.fillRect(bx, by, bw, 22 + rnd() * 18)
    }
  } else if (t.amb === 'speed') {
    ctx.globalAlpha = 0.35; ctx.strokeStyle = '#eaffea'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    for (let i = 0; i < 10; i++) {
      const y = rnd() * H, len = 40 + rnd() * 80, x = rnd() * W
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke()
    }
  } else if (t.amb === 'bubbles') {
    for (let i = 0; i < 26; i++) {
      const r = rnd() * 7 + 2
      ctx.globalAlpha = 0.12 + rnd() * 0.25; ctx.strokeStyle = '#cdefff'; ctx.lineWidth = 1.4
      ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, r, 0, Math.PI * 2); ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

// Full-bleed backdrop behind a game's content. Wrap game content in a
// position:relative container and drop this as the first child.
export function MinigameBg({ gameKey, radius = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const paint = () => {
      const p = cv.parentElement; if (!p) return
      cv.width = p.clientWidth || 480; cv.height = p.clientHeight || 400
      paintMinigameBg(cv, gameKey)
    }
    paint()
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  }, [gameKey])
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:0, borderRadius:radius, pointerEvents:'none' }} />
}

// Themed in-game top strip. `hearts`/`maxHearts` render ❤️/🖤; `coins` shows the
// live coin-tier preview; `center` is the score/label node.
export function InGameHUD({ gameKey, hearts, maxHearts, coins, center, lostKey }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'8px 14px', position:'relative', zIndex:2,
    }}>
      <span style={{
        display:'inline-flex', alignItems:'center', gap:3, fontFamily:'var(--font-pixel)',
        fontSize:9, color:GOLD, background:'rgba(0,0,0,.35)', padding:'4px 8px', borderRadius:12,
        border:'1px solid rgba(255,210,63,.4)',
      }}>🪙+{coins}</span>
      <span style={{ fontFamily:'var(--font-pixel)', fontSize:12, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,.5)' }}>{center}</span>
      <span key={lostKey} style={{ fontSize:16, display:'inline-flex', animation: lostKey ? 'mg-heart-loss .3s ease' : 'none' }}>
        {heartsStr(hearts, maxHearts)}
      </span>
    </div>
  )
}

// Redesigned result screen shared by all 5 games.
export function MinigameResult({ gameKey, emoji, title, stats = [], coins, livesRemaining, maxLives, onRetry, onHome }) {
  const t = THEMES[gameKey] || THEMES.memory
  const [shown, setShown] = useState(0)               // coin counter that fills as coins land
  const coinN = Math.max(3, Math.min(5, coins || 0))  // 3–5 flying coin sprites
  const canRetry = livesRemaining > 0

  useEffect(() => {
    if (!coins) { setShown(0); return }
    setShown(0)
    const step = Math.max(1, Math.round(coins / coinN))
    let landed = 0, acc = 0
    const timers = []
    for (let i = 0; i < coinN; i++) {
      timers.push(setTimeout(() => {
        landed++
        acc = landed === coinN ? coins : Math.min(coins, acc + step)
        setShown(acc)
      }, 240 + i * 130))
    }
    return () => timers.forEach(clearTimeout)
  }, [coins, coinN])

  return (
    <div style={{ position:'relative', width:'100%', maxWidth:480, minHeight:360, overflow:'hidden', borderRadius:16 }}>
      <MinigameBg gameKey={gameKey} radius={16} />
      <div style={{
        position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center',
        padding:'28px 24px', textAlign:'center', color:'#fff',
      }}>
        <div style={{ fontSize:66, marginBottom:6, animation:'mg-pop .55s cubic-bezier(.2,.8,.3,1.4) both' }}>{emoji}</div>
        {title && <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:24, marginBottom:6, textShadow:'0 2px 6px rgba(0,0,0,.4)' }}>{title}</div>}
        {stats.map((s, i) => (
          <div key={i} style={{ fontFamily:'Mitr,sans-serif', fontSize:15, color:t.ink, marginBottom:4 }}>{s}</div>
        ))}

        {/* Coin counter chip = coin-fly landing target */}
        <div style={{ position:'relative', margin:'14px 0 18px', minHeight:52 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,210,63,0.14)',
            border:'2px solid rgba(255,210,63,0.55)', borderRadius:22, padding:'8px 20px',
            fontFamily:'var(--font-pixel)', fontSize:16, color:GOLD, boxShadow:'0 0 16px rgba(255,210,63,.25)',
          }}>
            <span style={{ display:'inline-block', animation:'mg-coin-spin .7s ease-out both' }}>🪙</span>
            <span>+{shown}</span>
          </div>
          {/* Flying coins spawn from below (score area) and arc up into the chip */}
          {coins > 0 && Array.from({ length: coinN }).map((_, i) => (
            <span key={i} style={{
              position:'absolute', left:'50%', top:60, fontSize:22, pointerEvents:'none',
              '--dx': `${(i - (coinN - 1) / 2) * 26}px`, '--dy':'-58px',
              animation:`mg-coin-fly .8s ease-in ${0.2 + i * 0.13}s both`,
            }}>🪙</span>
          ))}
        </div>

        {/* Hearts remaining today */}
        <div style={{ fontSize:20, marginBottom:18, letterSpacing:2 }}>{heartsStr(livesRemaining, maxLives)}</div>

        <div style={{ display:'flex', gap:10, width:'100%' }}>
          {canRetry
            ? <button onClick={onRetry} style={btn(t.accent)}>🔄 เล่นอีก</button>
            : <button disabled style={{ ...btn('rgba(255,255,255,.15)'), cursor:'default', color:'rgba(255,255,255,.7)' }}>😴 พรุ่งนี้นะ!</button>
          }
          <button onClick={onHome} style={btn('rgba(0,0,0,.35)')}>🏠 กลับ</button>
        </div>
      </div>
    </div>
  )
}

const btn = (bg) => ({
  flex:1, background:bg, color:'#fff', border:'none', borderRadius:12, padding:14,
  fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer',
})
