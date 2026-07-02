import React, { useRef, useState, useEffect } from 'react'
import { useAppState, ACTIONS } from '../../context/StateContext.jsx'
import { FISH_TYPES, ITEMS } from '../../config/gameConfig.js'
import { playTone } from '../../lib/audio.js'
import { showItemToast, spawnConfetti } from '../../components/Toasts.jsx'
import { livesRemaining, heartsStr, MINIGAMES } from '../../lib/minigameLives.js'

const G = MINIGAMES.fishing
// Rarer fish (lower spawn-weight `rarity`) award more coins.
// 🐟.5→3  🐠.25→5  🐡.15→7  🦑.08→10  🐙.02→15
const fishCoins = (r) => r <= .03 ? 15 : r <= .1 ? 10 : r <= .2 ? 7 : r <= .35 ? 5 : 3

export default function EggFishing() {
  const { state, dispatch } = useAppState()
  const canvasRef = useRef(null)
  const gsRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const timerRef = useRef(null)
  const holdRef = useRef(false)
  const coinsRef = useRef(0)
  const [phase, setPhase] = useState('ready') // 'ready'|'playing'|'done'
  const [timeLeft, setTimeLeft] = useState(60)
  const [caught, setCaught] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [caughtItems, setCaughtItems] = useState([])

  const lives = livesRemaining(state, 'fishing')

  const startGame = () => {
    if (lives <= 0) return
    dispatch({ type: ACTIONS.FISHING_DEDUCT_LIFE })
    coinsRef.current = 0
    setCaught(0); setCaughtItems([]); setCoinsEarned(0); setTimeLeft(60)
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current; if (!canvas) return
    const gY = canvas.height * .4
    const maxDepth = (state.happiness || 80) / 100 * (canvas.height - gY - 30)
    const gs = { egg: { x: canvas.width * .5, y: gY - 30 }, line: 0, lineDir: 1, fishes: [], maxDepth, frame: 0 }
    gsRef.current = gs; runRef.current = true
    for (let i = 0; i < 5; i++) spawnFish(gs, canvas)
    const loop = () => {
      if (!runRef.current) return
      updateFishing(gs, canvas, holdRef.current)
      drawFishing(gs, canvas)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        clearInterval(timerRef.current); runRef.current = false
        const total = coinsRef.current
        setCoinsEarned(total); setPhase('done')
        if (total > 0) dispatch({ type: ACTIONS.ADD_COINS, payload: { amount: total } })
        dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak:0, score:0 } })
        return 0
      }
      return t - 1
    }), 1000)
    return () => { runRef.current = false; cancelAnimationFrame(animRef.current); clearInterval(timerRef.current) }
  }, [phase]) // eslint-disable-line

  const checkCatch = () => {
    const gs = gsRef.current; const canvas = canvasRef.current
    if (!gs || !canvas || gs.line < 20) return
    const gY = canvas.height * .4; const lineY = gY + gs.line + 10
    for (let i = gs.fishes.length - 1; i >= 0; i--) {
      const f = gs.fishes[i]
      if (Math.sqrt((gs.egg.x - f.x)**2 + (lineY - f.y)**2) < 24) {
        gs.fishes.splice(i, 1); spawnFish(gs, canvas)
        setCaught(c => c + 1)
        coinsRef.current += fishCoins(f.rarity)
        playTone('streak')
        if (!state.items) return
        if (f.item === 'all') {
          ['food','star','ribbon','potion'].forEach(k => dispatch({ type: ACTIONS.DROP_ITEM, payload: { key:k } }))
          showItemToast('🎉 ปลาหมึกยักษ์! ได้ item ทุกชนิด!')
        } else if (ITEMS[f.item]) {
          dispatch({ type: ACTIONS.DROP_ITEM, payload: { key: f.item } })
          showItemToast(ITEMS[f.item].emoji + ' ได้ ' + f.name + ' → ' + ITEMS[f.item].name + '!')
          setCaughtItems(ci => [...ci, f.sym])
        }
        return
      }
    }
  }

  const cW = Math.min(typeof window!=='undefined'?window.innerWidth:480, 480)
  const cH = Math.max(240, Math.min(320, typeof window!=='undefined'?window.innerHeight-160:300))

  if (phase === 'ready') return (
    <div style={{ width:'100%', maxWidth:480, padding:20, fontFamily:'Mitr,sans-serif' }}>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, textAlign:'center', marginBottom:16 }}>{G.title}</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--muted)', marginBottom:16 }}>กดค้างเพื่อหย่อนเบ็ด ปลาหายากได้เหรียญมากกว่า! 🐙</div>
      <div style={{ display:'flex', justifyContent:'center', padding:'10px 14px', background:'var(--blue-l, rgba(55,138,221,.15))', borderRadius:12, marginBottom:16, fontSize:20 }}>
        {heartsStr(lives, G.max)}
      </div>
      {lives <= 0
        ? <div style={{ textAlign:'center', padding:20, color:'var(--muted)' }}>มาเล่นใหม่พรุ่งนี้นะ! 🌙</div>
        : <button onClick={startGame} style={{ width:'100%', background:'var(--blue)', color:'#fff', border:'none', borderRadius:12, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer' }}>🎣 เริ่มเล่น!</button>
      }
    </div>
  )

  if (phase === 'done') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:24, textAlign:'center' }}>
      <div style={{ fontSize:64, marginBottom:10 }}>🎣</div>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:24, marginBottom:4 }}>หมดเวลา!</div>
      <div style={{ fontSize:16, marginBottom:8 }}>ตกปลาได้ {caught} ตัว</div>
      {caughtItems.length > 0 && <div style={{ fontSize:20, marginBottom:8 }}>{caughtItems.join(' ')}</div>}
      <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(255,210,63,0.12)', border:'1px solid rgba(255,210,63,0.35)', borderRadius:20, padding:'4px 14px', marginBottom:16, fontFamily:'var(--font-pixel)', fontSize:11, color:'#FFD23F' }}>🪙 +{coinsEarned}</div>
      <button onClick={() => setPhase('ready')} style={{ width:'100%', background:'var(--blue)', color:'#fff', border:'none', borderRadius:10, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer' }}>🔄 เล่นอีกครั้ง</button>
    </div>
  )

  return (
    <div style={{ width:'100%', maxWidth:480 }}>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 16px 4px', fontFamily:'Mitr,sans-serif', fontSize:13 }}>
        <span>🐟 {caught} ตัว</span>
        <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:18, color:'var(--blue-d)' }}>{timeLeft}s</span>
        <span>กดค้างเพื่อหย่อนเบ็ด</span>
      </div>
      <canvas
        ref={canvasRef} width={cW} height={cH}
        style={{ display:'block', borderRadius:12, cursor:'pointer' }}
        onMouseDown={() => { holdRef.current = true }}
        onMouseUp={() => { holdRef.current = false; checkCatch() }}
        onTouchStart={() => { holdRef.current = true }}
        onTouchEnd={() => { holdRef.current = false; checkCatch() }}
      />
    </div>
  )
}

function spawnFish(gs, canvas) {
  const gY = canvas.height * .42
  let roll = Math.random(), cum = 0, ft = FISH_TYPES[0]
  for (const f of FISH_TYPES) { cum += f.rarity; if (roll < cum) { ft = f; break } }
  gs.fishes.push({ x: Math.random()*(canvas.width-60)+30, y: gY+20+Math.random()*(canvas.height-gY-60), sym: ft.sym, item: ft.item, name: ft.name, rarity: ft.rarity, vx: (Math.random()-.5)*2 })
}

function updateFishing(gs, canvas, holding) {
  const gY = canvas.height * .4
  const maxDepth = gs.maxDepth
  if (holding && gs.line < maxDepth) gs.line += 2.5
  else if (!holding && gs.line > 0) gs.line -= 4
  gs.line = Math.max(0, Math.min(maxDepth, gs.line))
  gs.frame++
  for (const f of gs.fishes) { f.x += f.vx; if (f.x < 20 || f.x > canvas.width - 20) f.vx *= -1 }
  if (Math.random() < .01 && gs.fishes.length < 8) spawnFish(gs, canvas)
}

function drawFishing(gs, canvas) {
  const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d'), gY = H * .4
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, W, gY)
  const water = ctx.createLinearGradient(0, gY, 0, H); water.addColorStop(0,'#1565C0'); water.addColorStop(1,'#0D47A1')
  ctx.fillStyle = water; ctx.fillRect(0, gY, W, H - gY)
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2
  for (let wy = gY + 15; wy < H; wy += 25) { ctx.beginPath(); ctx.moveTo(0, wy + Math.sin(Date.now()*.001+wy)*3); ctx.lineTo(W, wy + Math.cos(Date.now()*.001+wy)*3); ctx.stroke() }
  ctx.fillStyle = '#8B4513'; ctx.beginPath(); ctx.moveTo(gs.egg.x-30,gY-2); ctx.lineTo(gs.egg.x+30,gY-2); ctx.lineTo(gs.egg.x+22,gY+14); ctx.lineTo(gs.egg.x-22,gY+14); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#A0522D'; ctx.fillRect(gs.egg.x-30, gY-10, 60, 8)
  ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.fillText('🥚', gs.egg.x, gY - 12)
  if (gs.line > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gs.egg.x, gY); ctx.lineTo(gs.egg.x, gY + gs.line); ctx.stroke()
    ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(gs.egg.x, gY + gs.line + 8, 5, 0, Math.PI*2); ctx.fill()
  }
  for (const f of gs.fishes) ctx.fillText(f.sym, f.x, f.y)
  ctx.textAlign = 'start'
}
