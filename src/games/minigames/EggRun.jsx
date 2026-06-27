import React, { useState, useRef, useEffect } from 'react'
import { useAppState, ACTIONS } from '../../context/StateContext.jsx'
import EggCanvas from '../../components/EggCanvas.jsx'
import { ITEMS, shuffle } from '../../config/gameConfig.js'
import { erSfxJump, erSfxRing, erSfxHit, erSfxSpeedUp, erSfxMilestone, erSfxGameOver, erSfxRecord, erSfxCountdown } from '../../lib/audio.js'
import { showToast, spawnConfetti, showItemToast } from '../../components/Toasts.jsx'

const ER_GRAV = 0.55, ER_GY = 0.74

export default function EggRun({ navigate }) {
  const { state, dispatch, eggStatsData, eggProgressData, totalXP } = useAppState()
  const [phase, setPhase] = useState('stats') // 'stats'|'countdown'|'running'|'dead'
  const canvasRef = useRef(null)
  const gsRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const [countdownN, setCountdownN] = useState(3)

  // Check lives
  const checkLivesReset = () => {
    const today = new Date().toLocaleDateString()
    if ((state.lastRunDate || '') !== today) return 3
    return state.eggRunLives ?? 0
  }
  const livesAvail = checkLivesReset()

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return
    let n = 3; setCountdownN(3)
    const tick = () => {
      erSfxCountdown(n)
      setCountdownN(n)
      n--
      if (n < 0) { setPhase('running') } else setTimeout(tick, 900)
    }
    tick()
  }, [phase])

  // Game loop
  useEffect(() => {
    if (phase !== 'running') return
    const canvas = canvasRef.current
    if (!canvas) return
    dispatch({ type: ACTIONS.ER_DEDUCT_LIFE })
    const gs = initEggRun(canvas, state, totalXP, eggProgressData.stage, eggStatsData)
    gsRef.current = gs
    runRef.current = true

    const loop = () => {
      if (!runRef.current) return
      const alive = updateEggRun(gs, canvas)
      drawEggRun(gs, canvas)
      if (!alive) { runRef.current = false; setPhase('dead'); return }
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    const onJump = () => { if (gs.egg?.onGround) { gs.egg.vy = gs.egg.jumpForce; gs.egg.onGround = false; erSfxJump() } }
    canvas.addEventListener('mousedown', onJump)
    canvas.addEventListener('touchstart', onJump, { passive: true })
    const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); onJump() } }
    document.addEventListener('keydown', onKey)
    return () => {
      runRef.current = false
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener('mousedown', onJump)
      document.removeEventListener('keydown', onKey)
    }
  }, [phase]) // eslint-disable-line

  // Dead — save score + rewards
  useEffect(() => {
    if (phase !== 'dead' || !gsRef.current) return
    const gs = gsRef.current
    const dist = Math.floor(gs.dist || 0)
    const rings = gs.ringCount || 0
    dispatch({ type: ACTIONS.ER_SAVE_SCORE, payload: { dist, rings } })
    const newBest = dist > (state.erBestDist || 0)
    if (newBest) { erSfxRecord(); showToast('🏆 สถิติใหม่! ' + dist + 'm') } else erSfxGameOver()
    // Item reward
    const chance = rings >= 16 ? 0.8 : rings >= 6 ? 0.5 : 0.2
    if (Math.random() < chance) {
      const keys = ['food','star','ribbon','potion']
      const k = keys[Math.floor(Math.random() * keys.length)]
      dispatch({ type: ACTIONS.DROP_ITEM, payload: { key: k } })
      if (rings >= 16) dispatch({ type: ACTIONS.DROP_ITEM, payload: { key: 'food' } })
      showItemToast(ITEMS[k].emoji + ' ได้รับ ' + ITEMS[k].name + '!')
    }
    const runCoins = rings >= 16 ? 8 : rings >= 6 ? 5 : 3
    dispatch({ type: ACTIONS.ADD_COINS, payload: { amount: runCoins } })
    dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak: 0, score: 0 } })
  }, [phase]) // eslint-disable-line

  const cW = Math.min(typeof window !== 'undefined' ? window.innerWidth : 480, 480)
  const cH = Math.max(220, Math.min(300, typeof window !== 'undefined' ? window.innerHeight - 140 : 300))

  if (phase === 'stats') {
    return (
      <div style={{ width:'100%', maxWidth:480, padding:20, fontFamily:'Mitr,sans-serif' }}>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, textAlign:'center', marginBottom:16 }}>🏃 Egg Run</div>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:16, display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
          <EggCanvas stats={eggStatsData} width={56} height={68} style={{ borderRadius:10, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>ไข่ของ{state.name}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:3 }}>⚡ ความเร็ว {'⚡'.repeat(Math.min(5, Math.ceil((3 + totalXP/200)/2.4)))}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:3 }}>🌟 พลังกระโดด {'🌟'.repeat(Math.min(5, Math.ceil(eggProgressData.stage/1.4+1)))}</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>💫 แม่เหล็ก ring {'💫'.repeat(Math.min(5, Math.ceil((state.happiness||80)/20)))}</div>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'var(--amber-l)', borderRadius:12, marginBottom:14 }}>
          <span style={{ fontSize:13, color:'var(--amber-d)' }}>🏆 Best: {state.erBestDist||0}m</span>
          <span style={{ fontSize:13, color:'var(--amber-d)' }}>💛 {state.erBestRings||0} rings</span>
          <span style={{ fontSize:13, color:'var(--amber-d)' }}>{'❤️'.repeat(livesAvail)}{'🖤'.repeat(Math.max(0,3-livesAvail))}</span>
        </div>
        {livesAvail <= 0
          ? <div style={{ textAlign:'center', padding:20, color:'var(--muted)' }}>🌙 มาเรียนพรุ่งนี้เพื่อเล่นอีกครั้ง!</div>
          : <button onClick={() => setPhase('countdown')} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:12, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer' }}>🏃 เริ่มวิ่ง!</button>
        }
      </div>
    )
  }

  return (
    <div style={{ width:'100%', maxWidth:480 }}>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 16px 4px', fontFamily:'Mitr,sans-serif', fontSize:13 }}>
        <span>📏 <span id="er-dist-r">0</span>m</span>
        <span>{'❤️'.repeat(Math.max(0,livesAvail-1))}{'🖤'.repeat(Math.max(0,3-(livesAvail-1)))}</span>
        <span style={{ color:'#B8860B' }}>💛 <span id="er-rings-r">0</span></span>
      </div>
      <div style={{ position:'relative' }}>
        <canvas ref={canvasRef} width={cW} height={cH} style={{ display:'block', borderRadius:12, cursor:'pointer' }} />
        {phase === 'countdown' && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:12 }}>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:Math.round(cW*.22), color:'#fff' }}>{countdownN > 0 ? countdownN : 'GO! 🏃'}</div>
          </div>
        )}
        {phase === 'dead' && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.55)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:12, gap:8 }}>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:24, color:'#fff' }}>Game Over!</div>
            <div style={{ fontSize:16, color:'#fff', fontFamily:'Mitr,sans-serif' }}>📏 {Math.floor(gsRef.current?.dist||0)}m · 💛 {gsRef.current?.ringCount||0}</div>
            <button onClick={() => setPhase('stats')} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:10, padding:'10px 24px', color:'#fff', fontFamily:'Mitr,sans-serif', fontSize:14, cursor:'pointer', marginTop:8 }}>← Back</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── EggRun Game Engine (vanilla, lives in refs) ──
function initEggRun(canvas, state, totalXPV, stage, eggStats) {
  const gY = Math.floor(canvas.height * ER_GY)
  const spd = Math.min(12, 3 + totalXPV / 200)
  const jf = -(8 + stage * 1.5)
  const mag = 10 + (state.happiness || 80) * 0.4
  const eggOff = document.createElement('canvas')
  eggOff.width = 32; eggOff.height = 40
  import('../../lib/eggAlgorithm.js').then(m => m.drawEgg(eggOff, eggStats))
  const gs = {
    egg: { x:70, y:gY-40, vy:0, onGround:true, w:32, h:40, speed:spd, jumpForce:jf, mag, bobPhase:0, flash:0 },
    obstacles: [], rings: [], clouds: [], clouds2: [], floats: [],
    dist: 0, ringCount: 0, spawnTimer: 0, ringTimer: 0, frame: 0,
    combo: 0, comboTimer: 0, lastMilestone: 0, eggOff, gY,
  }
  for(let i=0;i<4;i++) gs.clouds.push({x:60+i*120,y:15+Math.random()*45,w:50+Math.random()*40,s:.2+Math.random()*.15})
  for(let i=0;i<5;i++) gs.clouds2.push({x:30+i*100,y:50+Math.random()*30,w:30+Math.random()*30,s:.5+Math.random()*.3})
  return gs
}

function updateEggRun(gs, canvas) {
  const W=canvas.width,H=canvas.height,gY=gs.gY
  const spd=Math.min(18,gs.egg.speed+(gs.dist/2000))
  gs.frame++
  gs.egg.bobPhase=(gs.egg.bobPhase||0)+.15
  gs.egg.vy+=ER_GRAV; gs.egg.y+=gs.egg.vy
  if(gs.egg.y>=gY-gs.egg.h){gs.egg.y=gY-gs.egg.h;gs.egg.vy=0;gs.egg.onGround=true}
  gs.egg.bobOffset=gs.egg.onGround?Math.sin(gs.egg.bobPhase)*1.5:0
  if(gs.egg.flash>0)gs.egg.flash--
  const prevDist=gs.dist
  gs.dist+=spd/60
  const el=document.getElementById('er-dist-r');if(el)el.textContent=Math.floor(gs.dist)
  const mile=Math.floor(gs.dist/100)
  if(mile>gs.lastMilestone&&gs.dist>10){gs.lastMilestone=mile;erSfxMilestone();spawnConfetti(10);gs.floats.push({x:W/2,y:H*.4,text:mile*100+'m! 🎉',life:80,vy:-1.2,scale:1.4})}
  gs.spawnTimer++
  if(gs.spawnTimer>Math.max(50,130-Math.floor(gs.dist*.1))){gs.spawnTimer=0;const h=24+Math.random()*32;gs.obstacles.push({x:W+20,y:gY-h,w:18+Math.random()*12,h})}
  gs.ringTimer++
  if(gs.ringTimer>32){gs.ringTimer=0;if(Math.random()<.75){const ry=gY-20-Math.random()*60;for(let i=0;i<3;i++)gs.rings.push({x:W+18+i*26,y:ry+(i===1?-14:0),col:false,angle:Math.random()*Math.PI*2})}}
  for(const o of gs.obstacles)o.x-=spd
  gs.obstacles=gs.obstacles.filter(o=>o.x>-80)
  for(const r of gs.rings){r.x-=spd;r.angle+=.08;if(!r.col){const dx=(gs.egg.x+16)-r.x,dy=(gs.egg.y+20)-r.y,d=Math.sqrt(dx*dx+dy*dy);if(d<gs.egg.mag){r.x+=dx*.18;r.y+=dy*.18}if(d<16){r.col=true;gs.ringCount++;gs.combo++;gs.comboTimer=80;const re=document.getElementById('er-rings-r');if(re)re.textContent=gs.ringCount;erSfxRing();gs.floats.push({x:r.x,y:r.y,text:'+1',life:40,vy:-1,scale:.9});if(gs.combo>=5&&gs.combo%5===0){gs.floats.push({x:W/2,y:H*.5,text:'COMBO! x'+Math.floor(gs.combo/5+1)+'🔥',life:60,vy:-1,scale:1.3});spawnConfetti(4)}}}}
  gs.rings=gs.rings.filter(r=>r.x>-20)
  for(const f of gs.floats){f.y+=f.vy;f.life--};gs.floats=gs.floats.filter(f=>f.life>0)
  for(const cl of gs.clouds){cl.x-=cl.s;if(cl.x<-100)cl.x=W+80}
  for(const cl of gs.clouds2){cl.x-=cl.s;if(cl.x<-60)cl.x=W+50}
  const eCx=gs.egg.x+gs.egg.w/2,eCy=gs.egg.y+gs.egg.h/2,eR2=gs.egg.w*.35
  for(const o of gs.obstacles){const oCx=o.x+o.w/2,oCy=o.y+o.h/2,oR=o.w*.35,dx=eCx-oCx,dy=eCy-oCy;if(Math.sqrt(dx*dx+dy*dy)<eR2+oR){gs.egg.flash=18;return false}}
  return true
}

function drawEggRun(gs, canvas) {
  const W=canvas.width,H=canvas.height,ctx=canvas.getContext('2d'),gY=gs.gY
  ctx.clearRect(0,0,W,H)
  const phase=Math.min(1,gs.dist/400)
  const skyTop=phase<.5?`hsl(${210-phase*40},${70-phase*10}%,${55+phase*10}%)`:
    `hsl(${170+phase*80},60%,${65-phase*20}%)`
  const skyBot=phase<.5?`hsl(${200-phase*30},60%,${72+phase*8}%)`:
    `hsl(${20+phase*60},80%,${75-phase*20}%)`
  const sky=ctx.createLinearGradient(0,0,0,gY);sky.addColorStop(0,skyTop);sky.addColorStop(1,skyBot)
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,gY)
  ctx.fillStyle='rgba(255,255,255,.5)';for(const cl of gs.clouds){ctx.beginPath();ctx.ellipse(cl.x,cl.y,cl.w/2,10,0,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='rgba(255,255,255,.82)';for(const cl of gs.clouds2){ctx.beginPath();ctx.ellipse(cl.x,cl.y,cl.w/2,11,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(cl.x-10,cl.y+4,cl.w*.3,7,0,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#56A832';ctx.fillRect(0,gY,W,7);ctx.fillStyle='#3D7A24';ctx.fillRect(0,gY+7,W,H-gY-7)
  ctx.fillStyle='#4CAF50';const go=(gs.frame*(gs.egg.speed||3)*.5)%28;for(let gx=-go;gx<W+28;gx+=28){ctx.beginPath();ctx.moveTo(gx,gY+7);ctx.quadraticCurveTo(gx+4,gY,gx+8,gY+7);ctx.fill()}
  for(const o of gs.obstacles){const g2=ctx.createLinearGradient(o.x,o.y,o.x+o.w,o.y+o.h);g2.addColorStop(0,'#A0A0A0');g2.addColorStop(1,'#4A4A4A');ctx.fillStyle=g2;ctx.beginPath();ctx.moveTo(o.x+o.w/2,o.y);ctx.lineTo(o.x+o.w+4,o.y+o.h);ctx.lineTo(o.x-4,o.y+o.h);ctx.closePath();ctx.fill();ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.stroke()}
  for(const r of gs.rings){if(r.col)continue;ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.angle||0);ctx.strokeStyle='#FFD700';ctx.lineWidth=2.5;ctx.shadowColor='#FFD700';ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(0,0,7,5,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(255,215,0,.25)';ctx.fill();ctx.restore()}
  if(gs.eggOff){const eY=Math.round(gs.egg.y+(gs.egg.bobOffset||0));const angle=gs.egg.onGround?0:(gs.egg.vy<0?-.12:.12);ctx.save();if(gs.egg.flash>0)ctx.filter=`brightness(${1+gs.egg.flash*.1}) sepia(1)`;ctx.translate(gs.egg.x+gs.egg.w/2,eY+gs.egg.h/2);ctx.rotate(angle);ctx.drawImage(gs.eggOff,-gs.egg.w/2,-gs.egg.h/2,gs.egg.w,gs.egg.h);ctx.restore()}
  ctx.textAlign='center';for(const f of gs.floats){const alpha=Math.min(1,f.life/20);ctx.save();ctx.globalAlpha=alpha;ctx.font=`bold ${Math.round(14*f.scale)}px 'Fredoka One',cursive`;ctx.fillStyle=f.text.startsWith('+')?'#FFD700':f.text.includes('COMBO')?'#FF6B35':'#fff';ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=2;ctx.strokeText(f.text,f.x,f.y);ctx.fillText(f.text,f.x,f.y);ctx.restore()}
  ctx.textAlign='start';const spd2=Math.min(18,3+(gs.dist?gs.dist/2000:0));ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='10px Mitr,sans-serif';ctx.fillText('⚡'+spd2.toFixed(1),6,H-8)
}
