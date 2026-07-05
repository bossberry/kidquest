import React, { useRef, useState, useEffect } from 'react'
import { useAppState, ACTIONS, dispatchAddCoins } from '../../context/StateContext.jsx'
import { TOWER_COLORS } from '../../config/gameConfig.js'
import { playTone, playSFX } from '../../lib/audio.js'
import { spawnConfetti } from '../../components/Toasts.jsx'
import { livesRemaining, heartsStr, MINIGAMES } from '../../lib/minigameLives.js'
import { MinigameBg, InGameHUD, MinigameResult } from './minigameUI.jsx'

const G = MINIGAMES.tower
const towerCoinsFor = (score) => score >= 15 ? 5 : score >= 10 ? 4 : score >= 5 ? 3 : 1

export default function EggTower({ navigate }) {
  const { state, dispatch, eggProgressData } = useAppState()
  const canvasRef = useRef(null)
  const gsRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const [phase, setPhase] = useState('ready') // 'ready'|'playing'|'dead'
  const [score, setScore] = useState(0)

  const lives = livesRemaining(state, 'tower')

  useEffect(() => {
    if (phase === 'ready' && lives <= 0) playSFX('lives_empty')
  }, [phase, lives])

  const startGame = () => {
    if (lives <= 0) return
    dispatch({ type: ACTIONS.TOWER_DEDUCT_LIFE })
    setScore(0)
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current; if (!canvas) return
    const stage = eggProgressData.stage
    const baseW = Math.round(canvas.width * (.45 + stage * .03))
    const gs = {
      blocks: [{ x: canvas.width/2 - baseW/2, y: canvas.height-30, w: baseW, h: 20, color: TOWER_COLORS[0] }],
      current: { x: canvas.width/2 - baseW/2, y: canvas.height - 52, w: baseW, h: 20, color: TOWER_COLORS[1] },
      swingX: canvas.width/2, swingDir: 1, score: 0,
    }
    gsRef.current = gs; runRef.current = true
    const loop = () => {
      if (!runRef.current) return
      const spd = 2 + gs.score * .15
      gs.swingX += gs.swingDir * spd
      if (gs.swingX > canvas.width - gs.current.w*.3 || gs.swingX < gs.current.w*.3) gs.swingDir *= -1
      gs.current.x = gs.swingX - gs.current.w/2
      gs.current.y = canvas.height - gs.blocks.length * 22 - 44
      draw(gs, canvas)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    const place = () => placeFn(gs, canvas, setScore, setPhase, runRef, animRef, dispatch)
    canvas.addEventListener('click', place)
    canvas.addEventListener('touchstart', place, { passive: true })
    const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); place() } }
    document.addEventListener('keydown', onKey)
    return () => { runRef.current = false; cancelAnimationFrame(animRef.current); canvas.removeEventListener('click', place); document.removeEventListener('keydown', onKey) }
  }, [phase]) // eslint-disable-line

  const cW = Math.min(typeof window!=='undefined'?window.innerWidth:480, 480)
  const cH = Math.max(300, Math.min(420, typeof window!=='undefined'?window.innerHeight-130:400))

  if (phase === 'ready') {
    return (
      <div style={{ width:'100%', maxWidth:480, padding:20, fontFamily:'Mitr,sans-serif' }}>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, textAlign:'center', marginBottom:16 }}>{G.title}</div>
        <div style={{ textAlign:'center', fontSize:14, color:'var(--muted)', marginBottom:16 }}>แตะเพื่อวางบล็อกให้ตรงกัน สร้างหอให้สูงที่สุด!</div>
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 14px', background:'var(--purple-l)', borderRadius:12, marginBottom:16, fontSize:20 }}>
          {heartsStr(lives, G.max)}
        </div>
        {lives <= 0
          ? <div style={{ textAlign:'center', padding:20, color:'var(--muted)' }}>มาเล่นใหม่พรุ่งนี้นะ! 🌙</div>
          : <button onClick={startGame} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:12, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer' }}>🏗️ เริ่มเล่น!</button>
        }
      </div>
    )
  }

  if (phase === 'dead') {
    return (
      <MinigameResult
        gameKey="tower" emoji="🏗️" title={`Tower: ${score} ชั้น!`}
        stats={[]}
        coins={towerCoinsFor(score)} livesRemaining={lives} maxLives={G.max}
        onRetry={() => { setPhase('ready'); setScore(0) }} onHome={() => navigate?.('home')}
      />
    )
  }

  return (
    <div style={{ position:'relative', width:'100%', maxWidth:480, borderRadius:12, overflow:'hidden' }}>
      <MinigameBg gameKey="tower" radius={12} />
      <InGameHUD gameKey="tower" hearts={lives} maxHearts={G.max}
        coins={towerCoinsFor(score)} center={`${score} ชั้น`} />
      <canvas ref={canvasRef} width={cW} height={cH} style={{ position:'relative', zIndex:2, display:'block', borderRadius:12, cursor:'pointer' }} />
    </div>
  )
}

function placeFn(gs, canvas, setScore, setPhase, runRef, animRef, dispatch) {
  if (!runRef.current || !gs.current) return
  const top = gs.blocks[gs.blocks.length - 1]
  const oL = Math.max(gs.current.x, top.x), oR = Math.min(gs.current.x + gs.current.w, top.x + top.w)
  const overlap = oR - oL
  if (overlap <= 4) { runRef.current = false; cancelAnimationFrame(animRef.current); setPhase('dead'); const xp = Math.max(2, gs.score*3); const towerCoins = towerCoinsFor(gs.score); dispatch({ type: ACTIONS.ADD_XP, payload: { world: 'math', amount: xp } }); dispatchAddCoins(dispatch, towerCoins); dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak: 0, score: Math.min(1, gs.score/20) } }); return }
  playTone(overlap === gs.current.w ? 'streak' : 'correct')
  if (overlap === gs.current.w) spawnConfetti(3)
  const trimmed = { x: oL, y: top.y - 22, w: overlap, h: 20, color: TOWER_COLORS[gs.blocks.length % TOWER_COLORS.length] }
  gs.blocks.push(trimmed)
  gs.score++; setScore(gs.score)
  if (gs.blocks.length > canvas.height / 22) gs.blocks.forEach(b => b.y += 22)
  gs.current = { x: canvas.width/2 - overlap/2, y: trimmed.y - 40, w: overlap, h: 20, color: TOWER_COLORS[gs.blocks.length % TOWER_COLORS.length] }
}

function draw(gs, canvas) {
  const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  const sky = ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#1a1a2e'); sky.addColorStop(1,'#16213e')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#3D7A24'; ctx.fillRect(0, H-30, W, 30)
  for (const b of gs.blocks) {
    ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h)
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(b.x, b.y, b.w, 4)
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.strokeRect(b.x, b.y, b.w, b.h)
  }
  if (gs.current) {
    ctx.fillStyle = gs.current.color; ctx.fillRect(gs.current.x, gs.current.y, gs.current.w, gs.current.h)
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(gs.current.x, gs.current.y, gs.current.w, 4)
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.strokeRect(gs.current.x, gs.current.y, gs.current.w, gs.current.h)
    const top = gs.blocks[gs.blocks.length - 1]
    ctx.setLineDash([4,4]); ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1
    ctx.strokeRect(top.x, gs.current.y, top.w, gs.current.h); ctx.setLineDash([])
  }
}
