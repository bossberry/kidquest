import React, { useRef, useState, useEffect } from 'react'
import { useAppState, ACTIONS } from '../../context/StateContext.jsx'
import { ITEMS, CATCH_ITEMS, shuffle } from '../../config/gameConfig.js'
import { playTone } from '../../lib/audio.js'
import { showItemToast, spawnConfetti } from '../../components/Toasts.jsx'

export default function EggCatch() {
  const { state, dispatch, eggStatsData } = useAppState()
  const canvasRef = useRef(null)
  const gsRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const [phase, setPhase] = useState('playing') // 'playing'|'dead'
  const [score, setScore] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const eggSpd = 5 + Math.min(3, (state.xpThai||0)+(state.xpEng||0)+(state.xpMath||0))/200
    const gs = { egg:{x:canvas.width/2,y:canvas.height-40,w:36,h:36,dir:0,speed:eggSpd}, items:[], lives:3, score:0, frame:0, eggOff:null }
    import('../../lib/eggAlgorithm.js').then(m=>{gs.eggOff=document.createElement('canvas');gs.eggOff.width=36;gs.eggOff.height=44;m.drawEgg(gs.eggOff,eggStatsData)})
    gsRef.current=gs; runRef.current=true
    const loop=()=>{
      if(!runRef.current)return
      update(gs,canvas)
      draw(gs,canvas)
      if(gs.lives<=0){runRef.current=false;setPhase('dead');setScore(gs.score);handleReward(gs.score,dispatch);return}
      animRef.current=requestAnimationFrame(loop)
    }
    animRef.current=requestAnimationFrame(loop)
    const keys={};const onKD=e=>{keys[e.key]=true;if(gs.egg){if(keys['ArrowLeft']||keys['a'])gs.egg.dir=-1;if(keys['ArrowRight']||keys['d'])gs.egg.dir=1}};const onKU=()=>{if(gs.egg)gs.egg.dir=0}
    document.addEventListener('keydown',onKD);document.addEventListener('keyup',onKU)
    return()=>{runRef.current=false;cancelAnimationFrame(animRef.current);document.removeEventListener('keydown',onKD);document.removeEventListener('keyup',onKU)}
  },[]) // eslint-disable-line

  const cW=Math.min(typeof window!=='undefined'?window.innerWidth:480,480)
  const cH=Math.max(240,Math.min(340,typeof window!=='undefined'?window.innerHeight-160:300))

  if(phase==='dead') return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:24,textAlign:'center',width:'100%',maxWidth:480}}>
      <div style={{fontSize:64,marginBottom:10}}>🧺</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,marginBottom:8}}>Game Over!</div>
      <div style={{fontSize:16,marginBottom:20}}>คะแนน: {score}</div>
      <button onClick={()=>{setPhase('playing');setScore(0)}} style={{width:'100%',background:'var(--green)',color:'#fff',border:'none',borderRadius:10,padding:14,fontFamily:'Mitr,sans-serif',fontSize:16,fontWeight:600,cursor:'pointer'}}>🔄 เล่นอีกครั้ง</button>
    </div>
  )

  return(
    <div style={{width:'100%',maxWidth:480}}>
      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 16px 4px',fontFamily:'Mitr,sans-serif',fontSize:13}}>
        <span>❤️ <span id="ct-lives-r">3</span></span>
        <span style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:'var(--text)'}} id="ct-score-r">0</span>
        <span>⬅ กด ➡</span>
      </div>
      <canvas ref={canvasRef} width={cW} height={cH} style={{display:'block',borderRadius:12,touchAction:'none',cursor:'pointer'}}
        onTouchStart={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=-1}}
        onTouchEnd={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=0}}
      />
      <div style={{display:'flex',gap:8,padding:'8px 16px 0'}}>
        <button onTouchStart={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=-1}} onTouchEnd={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=0}} onMouseDown={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=-1}} onMouseUp={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=0}} style={{flex:1,background:'rgba(127,119,221,.8)',border:'none',borderRadius:'50%',width:64,height:64,fontSize:24,cursor:'pointer',touchAction:'none'}}>⬅</button>
        <div style={{flex:1}}/>
        <button onTouchStart={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=1}} onTouchEnd={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=0}} onMouseDown={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=1}} onMouseUp={()=>{if(gsRef.current?.egg)gsRef.current.egg.dir=0}} style={{flex:1,background:'rgba(127,119,221,.8)',border:'none',borderRadius:'50%',width:64,height:64,fontSize:24,cursor:'pointer',touchAction:'none'}}>➡</button>
      </div>
    </div>
  )
}

function update(gs,canvas){
  gs.frame++;const spd=1+gs.frame/1200
  gs.egg.x+=gs.egg.dir*gs.egg.speed*spd
  gs.egg.x=Math.max(gs.egg.w/2,Math.min(canvas.width-gs.egg.w/2,gs.egg.x))
  if(gs.frame%Math.max(25,50-Math.floor(gs.frame/200))===0){
    let roll=Math.random(),cum=0,sym,pts,danger=false,dmg=0
    for(const it of CATCH_ITEMS){cum+=it.w;if(roll<cum){sym=it.sym;pts=it.pts;danger=it.danger;dmg=it.dmg||0;break}}
    gs.items.push({x:Math.random()*(canvas.width-30)+15,y:-20,sym:sym||'💛',pts:pts||1,danger,dmg,vy:2+spd*1.5})
  }
  for(const it of gs.items)it.y+=it.vy*spd
  const eCx=gs.egg.x,eCy=gs.egg.y,eR=gs.egg.w*.4
  gs.items=gs.items.filter(it=>{
    if(it.y>canvas.height+30)return false
    const dx=eCx-it.x,dy=eCy-it.y
    if(Math.sqrt(dx*dx+dy*dy)<eR+16){
      if(it.danger){gs.lives=Math.max(0,gs.lives-it.dmg);const el=document.getElementById('ct-lives-r');if(el)el.textContent=gs.lives;playTone('wrong')}
      else{gs.score+=it.pts;const el=document.getElementById('ct-score-r');if(el)el.textContent=gs.score;if(it.pts>=10)spawnConfetti(5);playTone(it.pts>=10?'fanfare':'click')}
      return false
    }
    return true
  })
}

function draw(gs,canvas){
  const W=canvas.width,H=canvas.height,ctx=canvas.getContext('2d')
  ctx.clearRect(0,0,W,H)
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#87CEEB');sky.addColorStop(1,'#E0F4FF')
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H)
  ctx.fillStyle='#56A832';ctx.fillRect(0,H-20,W,20)
  ctx.font='24px serif';ctx.textAlign='center'
  for(const it of gs.items)ctx.fillText(it.sym,it.x,it.y+12)
  if(gs.eggOff)ctx.drawImage(gs.eggOff,gs.egg.x-18,gs.egg.y-22,36,44)
  ctx.textAlign='start'
}

function handleReward(score,dispatch){
  const rings=Math.floor(score/3)
  const chance=rings>=16?.8:rings>=6?.5:.2
  if(Math.random()<chance){
    const k=['food','star','ribbon','potion'][Math.floor(Math.random()*4)]
    dispatch({type:ACTIONS.DROP_ITEM,payload:{key:k}})
    showItemToast(ITEMS[k].emoji+' ได้รับ '+ITEMS[k].name+'!')
  }
  const catchCoins = score >= 20 ? 8 : score >= 8 ? 5 : 3
  dispatch({type:ACTIONS.ADD_COINS,payload:{amount:catchCoins}})
  dispatch({type:ACTIONS.ROUND_COMPLETE,payload:{streak:0,score:0}})
}
