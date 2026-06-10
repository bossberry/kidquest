import React, { useState, useEffect, useRef } from 'react'
import { playTone, speakTh, speakEn } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'
import EggCanvas from '../components/EggCanvas.jsx'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { drawEnemy } from '../lib/drawEnemy.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const BG = { math:'#1a1040', thai:'#0d2b1d', eng:'#0a1f3d' }

function answerFontSize(content) {
  const s = String(content)
  if (s.length <= 2) return 64
  if (s.length <= 4) return 54
  return 44
}

const REGULAR_ENEMIES = {
  math:[
    {name:'หุ่นยนต์เลข', emoji:'🤖', type:'egg_pawn'},
    {name:'ผีคณิต',       emoji:'👻', type:'slime'},
    {name:'ปีศาจจ้อน',   emoji:'😈', type:'fox'},
  ],
  thai:[
    {name:'โอครจ้อน', emoji:'👺', type:'bunny'},
    {name:'หมีดุ',    emoji:'🐻', type:'slime'},
    {name:'เสือดุ',   emoji:'🐯', type:'fox'},
  ],
  eng:[
    {name:'Space Bug',  emoji:'👾', type:'egg_pawn'},
    {name:'Alien',      emoji:'👽', type:'slime'},
    {name:'Dark Bot',   emoji:'🦾', type:'fox'},
  ],
}
const BOSS_ENEMIES = {
  math:[{name:'ราชามังกร',      emoji:'🐲', isBoss:true, type:'egg_pawn'}],
  thai:[{name:'ราชาหมีน้ำแข็ง', emoji:'🐻‍❄️', isBoss:true, type:'bunny'}],
  eng: [{name:'Space Commander', emoji:'🛸', isBoss:true, type:'egg_pawn'}],
}
const TEACH_INTRO = {
  math:{ hint:'เลือกท่าที่มีคำตอบถูก', eg:'2+3 → แตะท่าที่มีเลข 5' },
  thai:{ hint:'ฟังเสียง แล้วแตะรูปที่ตรง', eg:'ได้ยิน "ปลา" → แตะ 🐟' },
  eng :{ hint:'Listen, then tap the right picture', eg:'Hear "cat" → tap 🐱' },
}

const MAX_PLAYER_HP = 60

// ─── GB-style HP Bar ──────────────────────────────────────────────────────────

function GBHPBar({ pct, isPlayer, isBoss }) {
  const color = isPlayer
    ? (pct > 50 ? '#44bb44' : pct > 25 ? '#ffcc00' : '#ee5522')
    : (pct > 50 ? '#E24B4A' : pct > 25 ? '#EF9F27' : '#f66')
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', flexShrink:0, fontFamily:'monospace' }}>HP</span>
      <div style={{ flex:1, height: isBoss ? 8 : 6, background:'rgba(0,0,0,0.4)', borderRadius:3, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ height:'100%', width:`${Math.max(0, pct)}%`, background:color, transition:'width .65s ease, background-color .3s', borderRadius:2 }} />
      </div>
    </div>
  )
}

// ─── Enemy canvas sprite ──────────────────────────────────────────────────────

function EnemyCanvas({ enemyType, size, hitFlash, enemyDefeating }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawEnemy(canvas.getContext('2d'), enemyType, size)
  }, [enemyType, size])
  return (
    <canvas
      ref={canvasRef}
      width={size} height={size}
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        filter: hitFlash ? 'brightness(10) saturate(0)' : enemyDefeating ? 'brightness(0.4)' : 'none',
        transform: enemyDefeating ? 'translateY(14px) rotate(-18deg)' : 'none',
        opacity: enemyDefeating ? 0 : 1,
        transition: enemyDefeating ? 'opacity 500ms ease, transform 500ms ease' : 'filter 80ms',
      }}
    />
  )
}

// ─── Move Card ────────────────────────────────────────────────────────────────

function MoveCard({ content, isSelected, isMiss, onTap, disabled }) {
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      style={{
        background: isMiss ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.11)',
        border: isSelected ? '2px solid rgba(255,255,255,.75)' : '1.5px solid rgba(255,255,255,.2)',
        borderRadius:16,
        cursor: disabled ? 'default' : 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        touchAction:'manipulation',
        animation: isSelected ? 'move-pulse .22s ease' : isMiss ? 'miss-fizzle .5s ease forwards' : 'none',
        opacity: isMiss ? 0.4 : 1,
        transition:'opacity .15s, border-color .1s',
        userSelect:'none', WebkitUserSelect:'none',
      }}
    >
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize: answerFontSize(content), color:'#fff', lineHeight:1 }}>
        {content}
      </div>
    </button>
  )
}

// ─── Question Hint (compact) ──────────────────────────────────────────────────

function QuestionHint({ q, subject, onSpeak }) {
  const btnStyle = {
    background:'rgba(255,255,255,.12)', border:'none', borderRadius:8,
    padding:'4px 10px', fontSize:13, cursor:'pointer', color:'rgba(255,255,255,.85)',
    fontFamily:'Mitr,sans-serif', touchAction:'manipulation', flexShrink:0,
  }
  if (subject === 'thai') return (
    <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color:'#FFD700', lineHeight:1 }}>{q.word}</span>
      <button onClick={onSpeak} style={btnStyle}>🔊 ฟังอีกครั้ง</button>
    </div>
  )
  if (subject === 'eng') return (
    <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:'#FFD700', lineHeight:1, textTransform:'capitalize' }}>{q.word}</span>
      <button onClick={onSpeak} style={btnStyle}>🔊 Listen</button>
    </div>
  )
  if (q.isCount) return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:10, color:'rgba(255,255,255,.5)', marginBottom:3 }}>มีกี่อัน?</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:3, justifyContent:'center' }}>
        {q.objects.map((e,i) => <span key={i} style={{ fontSize:24, lineHeight:1 }}>{e}</span>)}
      </div>
    </div>
  )
  if (q.isPattern) return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:10, color:'rgba(255,255,255,.5)', marginBottom:3 }}>อะไรต่อไป?</div>
      <div style={{ display:'flex', gap:3, justifyContent:'center', alignItems:'center', flexWrap:'wrap' }}>
        {q.seq.map((e,i) => <span key={i} style={{ fontSize:18 }}>{e}</span>)}
        <span style={{ fontSize:16, border:'2px dashed rgba(255,255,255,.35)', borderRadius:5, padding:'2px 6px', color:'rgba(255,255,255,.5)', fontWeight:700 }}>?</span>
      </div>
    </div>
  )
  if (q.isWord) return (
    <div style={{ fontSize:11, color:'rgba(255,255,255,.75)', lineHeight:1.5, textAlign:'center', maxWidth:240 }}>{q.story}</div>
  )
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:38, color:'#FFD700', lineHeight:1 }}>{q.a}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'rgba(255,255,255,.5)' }}>{q.op}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:38, color:'#FFD700', lineHeight:1 }}>{q.b}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'rgba(255,255,255,.3)' }}>=</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:38, color:'#fff', lineHeight:1 }}>?</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MoveSelectBattleMode({
  q, cur, total, streak, subject,
  onCorrect, onWrong, onNext, onSpeak,
  eggStats, eggProgress, readyToHatch, isFirstLevel,
  enemyData,        // optional: { name, type, isBoss }
  showReturnButton, // optional: boolean — shows return button instead of auto-advance
}) {
  const bg = BG[subject] || '#1a1040'
  const nearHatch = readyToHatch || (eggProgress?.stage ?? 0) >= 5

  // Enemy (selected once on mount)
  const [{ enemy, isBoss }] = useState(() => {
    if (enemyData) return { enemy: { ...enemyData, type: enemyData.type || 'bunny' }, isBoss: !!enemyData.isBoss }
    const pool   = REGULAR_ENEMIES[subject] || REGULAR_ENEMIES.math
    const bosses = BOSS_ENEMIES[subject]    || BOSS_ENEMIES.math
    const boss   = Math.random() < 0.12
    return boss
      ? { enemy: bosses[Math.floor(Math.random() * bosses.length)], isBoss: true }
      : { enemy: pool[Math.floor(Math.random() * pool.length)], isBoss: false }
  })
  const enemyType = enemy.type || 'bunny'
  const maxHP     = isBoss ? total * 14 : total * 9
  const dmgBase   = Math.ceil(maxHP / total)

  // Refs
  const lockedRef    = useRef(false)
  const comboRef     = useRef(0)
  const ultimateRef  = useRef(false)
  const enemyHPRef   = useRef(maxHP)
  const mountedRef   = useRef(true)
  const typeTimerRef = useRef(null)
  useEffect(() => () => {
    mountedRef.current = false
    if (typeTimerRef.current) clearInterval(typeTimerRef.current)
  }, [])

  // State
  const [enemyHP, setEnemyHP]             = useState(maxHP)
  const [playerHP, setPlayerHP]           = useState(MAX_PLAYER_HP)
  const [battleLog, setBattleLog]         = useState(`${enemy.name} ปรากฏตัว!`)
  const [shownText, setShownText]         = useState(`${enemy.name} ปรากฏตัว!`)
  const [hitFlash, setHitFlash]           = useState(false)
  const [enemyLunge, setEnemyLunge]       = useState(false)
  const [eggHitFlash, setEggHitFlash]     = useState(false)
  const [dmgFloat, setDmgFloat]           = useState(null)
  const [eggAnimClass, setEggAnimClass]   = useState('')
  const [selectedCard, setSelectedCard]   = useState(-1)
  const [missCard, setMissCard]           = useState(-1)
  const [comboDisplay, setComboDisplay]   = useState(0)
  const [ultimateReady, setUltimateReady] = useState(false)
  const [critFlash, setCritFlash]         = useState(false)
  const [enemyDefeating, setEnemyDefeating] = useState(false)
  const [victoryMode, setVictoryMode]     = useState(false)
  const [showTeach, setShowTeach]         = useState(() => !!isFirstLevel && cur === 0)
  const [flashVisible, setFlashVisible]   = useState(true)

  // Entry flash: 3 white flashes on mount
  useEffect(() => {
    const times = [80,  200, 280, 400, 480]
    const vals  = [false, true, false, true, false]
    const timers = times.map((t, i) => setTimeout(() => mountedRef.current && setFlashVisible(vals[i]), t))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Typewriter dialogue
  useEffect(() => {
    if (typeTimerRef.current) clearInterval(typeTimerRef.current)
    let i = 0
    if (mountedRef.current) setShownText(battleLog[0] || '')
    typeTimerRef.current = setInterval(() => {
      i++
      if (i >= battleLog.length) { clearInterval(typeTimerRef.current); return }
      if (mountedRef.current) setShownText(battleLog.slice(0, i + 1))
    }, 28)
  }, [battleLog]) // eslint-disable-line

  // TTS on question change
  useEffect(() => {
    if (!q?.ttsWord) return
    const t = setTimeout(() => {
      if (!mountedRef.current) return
      if (subject === 'thai') speakTh(q.ttsWord)
      else if (subject === 'eng') speakEn(q.ttsWord)
    }, 400)
    return () => clearTimeout(t)
  }, [cur, subject]) // eslint-disable-line

  // Reset per question
  useEffect(() => {
    if (!mountedRef.current) return
    setSelectedCard(-1); setMissCard(-1)
    setEggAnimClass('')
    lockedRef.current = false
    if (cur > 0) setBattleLog('⚔️ เลือกท่าโจมตี!')
  }, [cur])

  // ── Tap handler ────────────────────────────────────────────────────────────
  function handleTap(choiceVal, idx) {
    if (lockedRef.current || victoryMode || showTeach) return
    lockedRef.current = true
    setSelectedCard(idx)
    playTone('tap')
    setEggAnimClass('charge')
    setTimeout(() => {
      if (!mountedRef.current) return
      setEggAnimClass('lunge')
      setTimeout(() => {
        if (!mountedRef.current) return
        setEggAnimClass('')
        if (choiceVal === q.answer) fireHit(idx)
        else                         fireMiss(idx)
      }, 280)
    }, 220)
  }

  function fireHit(_idx) {
    const { earned, isCrit } = onCorrect()
    comboRef.current += 1
    const combo = comboRef.current
    const isUlt = ultimateRef.current
    let mult = 1
    if (isUlt) {
      mult = 2; ultimateRef.current = false
      if (mountedRef.current) setUltimateReady(false)
    } else if (combo >= 4 || isCrit) {
      mult = 1.5
    }
    const dmg   = Math.ceil(dmgBase * mult)
    const newHP = Math.max(0, enemyHPRef.current - dmg)
    enemyHPRef.current = newHP
    if (mountedRef.current) setEnemyHP(newHP)
    if (mountedRef.current) {
      setSelectedCard(-1)
      setHitFlash(true)
      setTimeout(() => mountedRef.current && setHitFlash(false), 300)
      setDmgFloat({ val: dmg, isCrit: mult > 1, isUlt })
      setTimeout(() => mountedRef.current && setDmgFloat(null), 950)
    }
    let log
    if (isUlt) {
      log = '💥 ULTIMATE!! ×2'
      playTone('ultimate')
      if (mountedRef.current) { setCritFlash(true); setTimeout(() => mountedRef.current && setCritFlash(false), 400) }
      spawnConfetti(25)
    } else if (combo >= 4) {
      log = `⚡ CRITICAL! ×1.5  ${combo} Combo`
      playTone('streak')
      if (mountedRef.current) { setCritFlash(true); setTimeout(() => mountedRef.current && setCritFlash(false), 250) }
      spawnConfetti(8)
    } else if (combo === 3) {
      log = '🔥 คอมโบ! 3 ต่อเนื่อง'; playTone('combo')
    } else if (combo === 2) {
      log = '✨ คอมโบ! 2 ต่อเนื่อง'; playTone('combo')
    } else {
      log = `⚔️ โจมตี! +${earned} XP`; playTone('correct')
    }
    if (mountedRef.current) { setBattleLog(log); setComboDisplay(Math.min(combo, 3)) }
    if (!isUlt && !ultimateRef.current && combo >= 3) {
      ultimateRef.current = true
      if (mountedRef.current) {
        setUltimateReady(true)
        setTimeout(() => mountedRef.current && setBattleLog('🌟 ท่าพิเศษพร้อม!'), 1100)
      }
    }
    const isLast = cur + 1 >= total
    setTimeout(() => {
      if (!mountedRef.current) return
      if (isLast) {
        enemyHPRef.current = 0; setEnemyHP(0)
        setTimeout(() => mountedRef.current && showVictory(), 350)
      } else {
        lockedRef.current = false; onNext()
      }
    }, 700)
  }

  function fireMiss(idx) {
    onWrong()
    comboRef.current = 0
    if (ultimateRef.current) { ultimateRef.current = false; if (mountedRef.current) setUltimateReady(false) }
    if (mountedRef.current) {
      setSelectedCard(-1)
      setMissCard(idx)
      setTimeout(() => mountedRef.current && setMissCard(-1), 550)
      setBattleLog('💨 โจมตีพลาด!')
      setComboDisplay(0)
      setPlayerHP(h => Math.max(8, h - 8))
      // Enemy counterattack animation
      setTimeout(() => {
        if (!mountedRef.current) return
        setEnemyLunge(true)
        setTimeout(() => mountedRef.current && setEnemyLunge(false), 300)
      }, 200)
      setTimeout(() => {
        if (!mountedRef.current) return
        setEggHitFlash(true)
        setTimeout(() => mountedRef.current && setEggHitFlash(false), 200)
      }, 280)
    }
    playTone('miss')
    const isLast = cur + 1 >= total
    setTimeout(() => {
      if (!mountedRef.current) return
      if (isLast) {
        enemyHPRef.current = 0; setEnemyHP(0)
        setTimeout(() => mountedRef.current && showVictory(), 350)
      } else {
        lockedRef.current = false; onNext()
      }
    }, 550)
  }

  function showVictory() {
    setEnemyDefeating(true)
    setVictoryMode(true)
    setBattleLog('🎉 มอนสเตอร์พ่ายแพ้!')
    playTone('fanfare')
    setTimeout(() => mountedRef.current && playTone('item'), 400)
    spawnConfetti(35)
    if (!showReturnButton) {
      setTimeout(() => { if (mountedRef.current) onNext() }, 1900)
    }
  }

  function handleDismissTeach() {
    setShowTeach(false)
    if (q?.ttsWord) {
      setTimeout(() => {
        if (!mountedRef.current) return
        if (subject === 'thai') speakTh(q.ttsWord)
        else if (subject === 'eng') speakEn(q.ttsWord)
      }, 300)
    }
  }

  // Derived styles
  const hpPct       = (enemyHP / maxHP) * 100
  const playerHpPct = (playerHP / MAX_PLAYER_HP) * 100
  const eggAnim = eggAnimClass === 'charge' ? 'egg-charge .3s ease'
    : eggAnimClass === 'lunge'  ? 'adv-jump .42s ease'
    : victoryMode               ? 'eggBounce .6s ease infinite'
    : nearHatch                 ? 'egg-near-hatch 2s ease-in-out infinite'
    : 'egg-idle 3s ease-in-out infinite'
  const eggFilter = victoryMode         ? 'drop-shadow(0 0 18px gold) brightness(1.25)'
    : eggAnimClass === 'lunge'          ? 'drop-shadow(0 0 14px gold) brightness(1.2)'
    : comboDisplay >= 2                 ? 'drop-shadow(0 0 8px rgba(255,215,0,.7))'
    : comboDisplay >= 1                 ? 'drop-shadow(0 0 4px rgba(255,215,0,.4))'
    : nearHatch                         ? 'drop-shadow(0 0 5px rgba(255,215,0,.5))'
    : 'none'
  const comboGlow = comboDisplay === 3  ? '0 0 0 4px #FFD700, 0 0 20px rgba(255,215,0,.5)'
    : comboDisplay === 2                ? '0 0 0 3px rgba(255,215,0,.7)'
    : comboDisplay === 1                ? '0 0 0 2px rgba(255,215,0,.4)'
    : 'none'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex:1, minHeight:0, background:bg, display:'flex', flexDirection:'column', fontFamily:'Mitr,sans-serif', position:'relative', overflow:'hidden' }}>

      {/* Entry flash */}
      {flashVisible && (
        <div style={{ position:'absolute', inset:0, background:'#fff', zIndex:100, pointerEvents:'none' }} />
      )}

      {/* Screen flash on crit/ultimate */}
      {critFlash && (
        <div style={{ position:'absolute', inset:0, background:'rgba(255,215,0,.13)', pointerEvents:'none', zIndex:50, animation:'crit-flash .35s ease forwards' }} />
      )}

      {/* ── BATTLE FIELD ─────────────────────────────────────────────────── */}
      <div style={{
        position:'relative', height:190, flexShrink:0,
        background:'linear-gradient(180deg, #1a2a1a 0%, #243a24 55%, #2e4a20 100%)',
        overflow:'hidden', borderBottom:'2px solid #3a6a3a',
      }}>

        {/* Enemy status — top left */}
        <div style={{
          position:'absolute', top:8, left:10,
          background:'rgba(0,0,0,0.58)', borderRadius:8, padding:'5px 10px', minWidth:140, maxWidth:178,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:12, color:'#fff', lineHeight:1 }}>
              {isBoss ? '👑 ' : ''}{enemy.name}
            </span>
            <span style={{ fontSize:9, color:'rgba(255,255,255,.3)', marginLeft:6 }}>{cur+1}/{total}</span>
          </div>
          <GBHPBar pct={hpPct} isBoss={isBoss} />
        </div>

        {/* Enemy canvas sprite — top right */}
        <div style={{
          position:'absolute', right:8, top:4,
          transform: `translateX(${enemyLunge ? -30 : 0}px)`,
          transition:'transform 130ms ease',
        }}>
          <EnemyCanvas enemyType={enemyType} size={88} hitFlash={hitFlash} enemyDefeating={enemyDefeating} />
          {dmgFloat && (
            <div style={{
              position:'absolute', top:'-20px', left:'50%', transform:'translateX(-50%)',
              fontFamily:"'Fredoka One',cursive",
              fontSize: dmgFloat.isUlt ? 26 : dmgFloat.isCrit ? 22 : 18,
              color: dmgFloat.isUlt ? '#FFD700' : dmgFloat.isCrit ? '#FFD700' : '#ff8080',
              animation:'dmg-float 1s ease-out forwards',
              pointerEvents:'none', fontWeight:900, whiteSpace:'nowrap',
              textShadow: dmgFloat.isUlt ? '0 0 10px gold' : 'none',
            }}>
              -{dmgFloat.val}{dmgFloat.isUlt ? ' 🌟' : dmgFloat.isCrit ? ' ⚡' : ''}
            </div>
          )}
        </div>

        {/* Player status — bottom right */}
        <div style={{
          position:'absolute', bottom:8, right:10,
          background:'rgba(0,0,0,0.58)', borderRadius:8, padding:'5px 10px', minWidth:140, maxWidth:172,
        }}>
          <div style={{ marginBottom:4, fontFamily:"'Fredoka One',cursive", fontSize:11, color:'rgba(255,255,255,.7)' }}>
            {EGG_STAGE_NAMES?.[eggProgress?.stage ?? 0] || 'ไข่ลึกลับ'}
          </div>
          <GBHPBar pct={playerHpPct} isPlayer />
        </div>

        {/* Egg/player sprite — bottom left */}
        <div style={{ position:'absolute', left:8, bottom:0, animation: eggAnim }}>
          <div style={{ transform: `translateX(${eggAnimClass === 'lunge' ? 20 : 0}px)`, transition:'transform 150ms ease' }}>
            {eggStats ? (
              <EggCanvas stats={eggStats} width={62} height={72} style={{
                display:'block',
                filter: eggHitFlash ? 'brightness(8) saturate(0)' : eggFilter,
                transition:'filter .2s',
              }} />
            ) : (
              <div style={{ fontSize:40, lineHeight:1, filter: eggHitFlash ? 'brightness(8) saturate(0)' : eggFilter }}>🥚</div>
            )}
          </div>
          {comboDisplay >= 1 && (
            <div style={{
              position:'absolute', inset:-5, borderRadius:'50%',
              boxShadow: comboGlow, pointerEvents:'none',
              animation: comboDisplay >= 3 ? 'streak-bounce .6s ease' : 'none',
            }} />
          )}
          {victoryMode && (
            <div style={{ position:'absolute', top:'-14px', left:'50%', transform:'translateX(-50%)', fontSize:18, animation:'dmg-float .6s ease-out forwards', pointerEvents:'none' }}>✨</div>
          )}
        </div>

        {/* Combo / ultimate indicators */}
        {comboDisplay >= 1 && !victoryMode && (
          <div style={{
            position:'absolute', left:76, bottom:26,
            fontFamily:"'Fredoka One',cursive", fontSize:11,
            background: comboDisplay >= 3 ? 'rgba(255,215,0,.22)' : 'rgba(255,255,255,.1)',
            color: comboDisplay >= 3 ? '#FFD700' : 'rgba(255,255,255,.75)',
            borderRadius:8, padding:'2px 8px',
            border: comboDisplay >= 3 ? '1px solid rgba(255,215,0,.4)' : '1px solid rgba(255,255,255,.12)',
          }}>
            {comboDisplay >= 3 ? '💥' : comboDisplay === 2 ? '🔥' : '✨'} {comboRef.current}x
          </div>
        )}
        {ultimateReady && !victoryMode && (
          <div style={{
            position:'absolute', left:76, bottom:48,
            fontFamily:"'Fredoka One',cursive", fontSize:10, color:'#FFD700',
            animation:'streak-bounce .55s ease', textShadow:'0 0 8px gold',
          }}>
            🌟 ท่าพิเศษ
          </div>
        )}
      </div>

      {/* ── DIALOGUE BOX ─────────────────────────────────────────────────── */}
      <div style={{
        background:'#0a1a0a', padding:'8px 14px', minHeight:52, flexShrink:0,
        borderBottom:'1px solid rgba(58,106,58,0.45)',
      }}>
        <div style={{ fontFamily:'Mitr,sans-serif', fontSize:13, color:'#c8e8c8', lineHeight:1.6 }}>
          ▶ {shownText}
        </div>
      </div>

      {/* ── QUESTION HINT ────────────────────────────────────────────────── */}
      {!victoryMode && (
        <div style={{ padding:'5px 14px 3px', display:'flex', alignItems:'center', justifyContent:'center', minHeight:42, flexShrink:0 }}>
          <QuestionHint q={q} subject={subject} onSpeak={onSpeak} />
        </div>
      )}

      {/* ── MOVE PANEL ───────────────────────────────────────────────────── */}
      {!victoryMode && (
        <div style={{ flex:1, padding:'0 10px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:8, minHeight:0 }}>
          {q.choices.map((choice, idx) => (
            <MoveCard
              key={idx}
              content={choice}
              isSelected={selectedCard === idx}
              isMiss={missCard === idx}
              onTap={() => handleTap(choice, idx)}
              disabled={lockedRef.current || victoryMode}
            />
          ))}
        </div>
      )}

      {/* ── VICTORY STATE ────────────────────────────────────────────────── */}
      {victoryMode && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:'0 20px 20px' }}>
          <div style={{ fontSize:64, animation:'victory-bounce .7s ease' }}>🎉</div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:'#FFD700' }}>ชนะแล้ว!</div>
          {showReturnButton && (
            <button
              onClick={onNext}
              style={{
                marginTop:8, background:'rgba(58,106,58,0.85)', color:'#c8f8c8',
                border:'2px solid rgba(88,160,88,0.6)', borderRadius:14, padding:'13px 36px',
                fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:700,
                cursor:'pointer', touchAction:'manipulation',
              }}
            >
              🗺️ กลับสำรวจ
            </button>
          )}
        </div>
      )}

      {/* ── TEACH INTRO OVERLAY ──────────────────────────────────────────── */}
      {showTeach && (
        <div style={{
          position:'absolute', inset:0, zIndex:80, background:'rgba(0,0,0,.88)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:24, textAlign:'center',
        }}>
          <div style={{ marginBottom:12 }}>
            <EnemyCanvas enemyType={enemyType} size={72} hitFlash={false} enemyDefeating={false} />
          </div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:20, color:'#FFD700', marginBottom:8 }}>
            {isBoss ? `👑 BOSS: ${enemy.name}` : enemy.name}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.85)', marginBottom:6, maxWidth:260 }}>
            {TEACH_INTRO[subject]?.hint}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:22, maxWidth:240 }}>
            💡 {TEACH_INTRO[subject]?.eg}
          </div>
          <button
            onClick={handleDismissTeach}
            style={{
              background:'#7F77DD', color:'#fff', border:'none', borderRadius:14, padding:'13px 38px',
              fontFamily:"'Fredoka One',cursive", fontSize:18, cursor:'pointer', touchAction:'manipulation',
            }}
          >
            ⚔️ เริ่มต่อสู้!
          </button>
        </div>
      )}
    </div>
  )
}
