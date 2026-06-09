import React, { useState, useEffect, useRef } from 'react'
import { playTone, speakTh, speakEn } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'
import EggCanvas from '../components/EggCanvas.jsx'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const BG = { math:'#1a1040', thai:'#0d2b1d', eng:'#0a1f3d' }

function answerFontSize(content) {
  const s = String(content)
  if (s.length <= 2) return 64   // single emoji, single digit/letter
  if (s.length <= 4) return 54   // short emoji sequence, 3-4 char
  return 44                       // longer (ZWJ emoji, word)
}

const REGULAR_ENEMIES = {
  math:[{name:'หุ่นยนต์เลข',emoji:'🤖'},{name:'ผีคณิต',emoji:'👻'},{name:'ปีศาจจ้อน',emoji:'😈'}],
  thai:[{name:'โอครจ้อน',emoji:'👺'},{name:'หมีดุ',emoji:'🐻'},{name:'เสือดุ',emoji:'🐯'}],
  eng :[{name:'Space Bug',emoji:'👾'},{name:'Alien',emoji:'👽'},{name:'Dark Bot',emoji:'🦾'}],
}
const BOSS_ENEMIES = {
  math:[{name:'ราชามังกร',emoji:'🐲',isBoss:true}],
  thai:[{name:'ราชาหมีน้ำแข็ง',emoji:'🐻‍❄️',isBoss:true}],
  eng :[{name:'Space Commander',emoji:'🛸',isBoss:true}],
}
const TEACH_INTRO = {
  math:{ hint:'เลือกท่าที่มีคำตอบถูก', eg:'2+3 → แตะท่าที่มีเลข 5' },
  thai:{ hint:'ฟังเสียง แล้วแตะรูปที่ตรง', eg:'ได้ยิน "ปลา" → แตะ 🐟' },
  eng :{ hint:'Listen, then tap the right picture', eg:'Hear "cat" → tap 🐱' },
}

// ─── HP Bar ───────────────────────────────────────────────────────────────────

function HPBar({ pct, isBoss }) {
  const color = pct > 50 ? '#E24B4A' : pct > 25 ? '#EF9F27' : '#f66'
  return (
    <div style={{ width:'100%', height: isBoss ? 12 : 9, background:'rgba(255,255,255,.15)', borderRadius:20, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.max(0, pct)}%`, background:color, transition:'width .65s ease', borderRadius:20 }} />
    </div>
  )
}

// ─── Answer Card — content is the move ───────────────────────────────────────

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

// ─── Question Hint (compact, no card) ────────────────────────────────────────

function QuestionHint({ q, subject, onSpeak }) {
  const btnStyle = {
    background:'rgba(255,255,255,.12)', border:'none', borderRadius:8,
    padding:'4px 10px', fontSize:13, cursor:'pointer', color:'rgba(255,255,255,.85)',
    fontFamily:'Mitr,sans-serif', touchAction:'manipulation', flexShrink:0,
  }
  if (subject === 'thai') return (
    <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
      <span style={{ fontSize:36, lineHeight:1 }}>{q.ttsWord ? '🎵' : ''}</span>
      <button onClick={onSpeak} style={btnStyle}>🔊 ฟังอีกครั้ง</button>
    </div>
  )
  if (subject === 'eng') return (
    <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
      <button onClick={onSpeak} style={btnStyle}>🔊 Listen again</button>
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
}) {
  const bg = BG[subject] || '#1a1040'
  const nearHatch = readyToHatch || (eggProgress?.stage ?? 0) >= 5

  // ── Enemy (selected once) ────────────────────────────────────────────────
  const [{ enemy, isBoss }] = useState(() => {
    const pool   = REGULAR_ENEMIES[subject] || REGULAR_ENEMIES.math
    const bosses = BOSS_ENEMIES[subject]    || BOSS_ENEMIES.math
    const boss   = Math.random() < 0.12
    return boss
      ? { enemy: bosses[Math.floor(Math.random() * bosses.length)], isBoss: true }
      : { enemy: pool[Math.floor(Math.random() * pool.length)], isBoss: false }
  })
  const maxHP  = isBoss ? total * 14 : total * 9
  const dmgBase = Math.ceil(maxHP / total)

  // ── Refs ─────────────────────────────────────────────────────────────────
  const lockedRef     = useRef(false)
  const comboRef      = useRef(0)
  const ultimateRef   = useRef(false)
  const enemyHPRef    = useRef(maxHP)
  const mountedRef    = useRef(true)
  useEffect(() => { return () => { mountedRef.current = false } }, [])

  // ── State ────────────────────────────────────────────────────────────────
  const [enemyHP, setEnemyHP]           = useState(maxHP)
  const [battleLog, setBattleLog]       = useState(`${enemy.emoji} ${enemy.name} ปรากฏตัว!`)
  const [hitFlash, setHitFlash]         = useState(false)
  const [dmgFloat, setDmgFloat]         = useState(null)
  const [eggAnimClass, setEggAnimClass] = useState('')
  const [selectedCard, setSelectedCard] = useState(-1)
  const [missCard, setMissCard]         = useState(-1)
  const [comboDisplay, setComboDisplay] = useState(0)
  const [ultimateReady, setUltimateReady] = useState(false)
  const [critFlash, setCritFlash]       = useState(false)
  const [enemyDefeating, setEnemyDefeating] = useState(false)
  const [victoryMode, setVictoryMode]   = useState(false)
  const [showTeach, setShowTeach]       = useState(() => !!isFirstLevel && cur === 0)

  // ── TTS on question change ───────────────────────────────────────────────
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

  // ── Tap handler ──────────────────────────────────────────────────────────
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
      mult = 2
      ultimateRef.current = false
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
      log = '🔥 คอมโบ! 3 ต่อเนื่อง'
      playTone('combo')
    } else if (combo === 2) {
      log = '✨ คอมโบ! 2 ต่อเนื่อง'
      playTone('combo')
    } else {
      log = `⚔️ โจมตี! +${earned} XP`
      playTone('correct')
    }
    if (mountedRef.current) {
      setBattleLog(log)
      setComboDisplay(Math.min(combo, 3))
    }

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
        enemyHPRef.current = 0
        setEnemyHP(0)
        setTimeout(() => mountedRef.current && showVictory(), 350)
      } else {
        lockedRef.current = false
        onNext()
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
    }
    playTone('miss')

    const isLast = cur + 1 >= total
    setTimeout(() => {
      if (!mountedRef.current) return
      if (isLast) {
        enemyHPRef.current = 0
        setEnemyHP(0)
        setTimeout(() => mountedRef.current && showVictory(), 350)
      } else {
        lockedRef.current = false
        onNext()
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
    setTimeout(() => {
      if (!mountedRef.current) return
      onNext()
    }, 1900)
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

  // ── Derived styles ───────────────────────────────────────────────────────
  const hpPct = (enemyHP / maxHP) * 100
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ flex:1, minHeight:0, background:bg, display:'flex', flexDirection:'column', fontFamily:'Mitr,sans-serif', position:'relative', overflow:'hidden' }}>

      {/* Screen flash on crit/ultimate */}
      {critFlash && (
        <div style={{ position:'absolute', inset:0, background:'rgba(255,215,0,.13)', pointerEvents:'none', zIndex:50, animation:'crit-flash .35s ease forwards' }} />
      )}

      {/* ── ENEMY AREA (top ~40%) ─────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'14px 20px 6px', gap:4 }}>

        {/* Enemy emoji — large, idle bounce */}
        <div style={{ position:'relative', lineHeight:1, textAlign:'center',
          fontSize: isBoss ? 148 : 130,
          filter: hitFlash ? 'brightness(3) sepia(1) saturate(5) hue-rotate(-20deg)' : 'none',
          animation: enemyDefeating
            ? 'enemy-defeat .8s ease forwards'
            : hitFlash
            ? 'battle-shake .3s ease'
            : 'enemy-idle 2s ease-in-out infinite',
          transition:'filter .12s',
        }}>
          {enemy.emoji}
          {/* Damage float */}
          {dmgFloat && (
            <div style={{
              position:'absolute', top:'-24px', left:'50%', transform:'translateX(-50%)',
              fontFamily:"'Fredoka One',cursive",
              fontSize: dmgFloat.isUlt ? 28 : dmgFloat.isCrit ? 24 : 20,
              color: dmgFloat.isUlt ? '#FFD700' : dmgFloat.isCrit ? '#FFD700' : '#ff8080',
              animation:'dmg-float 1s ease-out forwards',
              pointerEvents:'none', fontWeight:900, whiteSpace:'nowrap',
              textShadow: dmgFloat.isUlt ? '0 0 10px gold' : 'none',
            }}>
              -{dmgFloat.val}{dmgFloat.isUlt ? ' 🌟' : dmgFloat.isCrit ? ' ⚡' : ''}
            </div>
          )}
        </div>

        {/* Name + boss badge + counter */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:13, color:'rgba(255,255,255,.8)' }}>
            {isBoss ? '👑 ' : ''}{enemy.name}
          </div>
          {isBoss && <span style={{ fontSize:9, background:'rgba(255,215,0,.18)', color:'#FFD700', borderRadius:6, padding:'1px 6px', fontFamily:"'Fredoka One',cursive" }}>BOSS</span>}
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:11, color:'rgba(255,255,255,.3)', marginLeft:4 }}>{cur+1}/{total}</div>
        </div>

        {/* HP bar — full width */}
        <HPBar pct={hpPct} isBoss={isBoss} />
      </div>

      {/* ── BATTLE LOG (1 line, dark pill) ─────────────────────────────────── */}
      <div style={{ margin:'0 14px 4px', background:'rgba(0,0,0,.45)', borderRadius:8, padding:'5px 12px', borderLeft:'3px solid rgba(127,119,221,.6)' }}>
        <div style={{ fontSize:13, color:'#fff', lineHeight:1.4 }}>▷ {battleLog}</div>
      </div>

      {/* ── EGG + COMBO (middle row) ────────────────────────────────────────── */}
      <div style={{ padding:'2px 14px 4px', display:'flex', alignItems:'center', gap:10 }}>

        {/* Egg */}
        <div style={{ position:'relative', flexShrink:0 }}>
          {eggStats ? (
            <EggCanvas stats={eggStats} width={62} height={72} style={{
              animation: eggAnim,
              filter: eggFilter,
              transition:'filter .25s',
              display:'block',
            }} />
          ) : (
            <div style={{ fontSize:40, lineHeight:1, animation: eggAnim }}>🥚</div>
          )}
          {comboDisplay >= 1 && (
            <div style={{
              position:'absolute', inset:-5, borderRadius:'50%',
              boxShadow: comboGlow,
              pointerEvents:'none',
              animation: comboDisplay >= 3 ? 'streak-bounce .6s ease' : 'none',
            }} />
          )}
          {victoryMode && (
            <div style={{ position:'absolute', top:'-14px', left:'50%', transform:'translateX(-50%)',
              fontSize:18, animation:'dmg-float .6s ease-out forwards', pointerEvents:'none' }}>✨</div>
          )}
        </div>

        {/* Egg progress */}
        {eggProgress && (
          <div style={{ flex:1, padding:'3px 8px',
            background: nearHatch ? 'rgba(255,215,0,.06)' : 'rgba(255,255,255,.04)',
            borderRadius:7,
            border: nearHatch ? '1px solid rgba(255,215,0,.22)' : '1px solid rgba(255,255,255,.07)',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:9,
                color: nearHatch ? '#FFD700' : 'rgba(255,255,255,.4)' }}>
                🥚 {EGG_STAGE_NAMES[eggProgress.stage] || 'ไข่ลึกลับ'}
              </div>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:9,
                color: nearHatch ? '#FFD700' : 'rgba(255,255,255,.3)' }}>
                {nearHatch ? '✨ ใกล้ฟักแล้ว!' : `${Math.round(eggProgress.pct)}%`}
              </div>
            </div>
            <div style={{ height:3, background:'rgba(255,255,255,.1)', borderRadius:10, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100, eggProgress.pct)}%`,
                background: nearHatch ? 'linear-gradient(90deg,#FFD700,#FF9900)' : 'rgba(127,119,221,.8)',
                transition:'width .7s ease', borderRadius:10 }} />
            </div>
          </div>
        )}

        {/* Ultimate + combo indicators — compact */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          {ultimateReady && !victoryMode && (
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:10, color:'#FFD700',
              textAlign:'center', lineHeight:1.2,
              animation:'streak-bounce .55s ease', textShadow:'0 0 8px gold' }}>
              🌟<br/>ท่าพิเศษ
            </div>
          )}
          {comboDisplay >= 1 && !victoryMode && (
            <div style={{
              fontFamily:"'Fredoka One',cursive", fontSize:11,
              background: comboDisplay >= 3 ? 'rgba(255,215,0,.2)' : 'rgba(255,255,255,.1)',
              color: comboDisplay >= 3 ? '#FFD700' : 'rgba(255,255,255,.7)',
              borderRadius:8, padding:'3px 7px',
              border: comboDisplay >= 3 ? '1px solid rgba(255,215,0,.4)' : '1px solid rgba(255,255,255,.15)',
            }}>
              {comboDisplay >= 3 ? '💥' : comboDisplay === 2 ? '🔥' : '✨'} {comboRef.current}x
            </div>
          )}
        </div>
      </div>

      {/* ── QUESTION HINT (compact, above move panel) ──────────────────────── */}
      {!victoryMode && (
        <div style={{ padding:'2px 14px 4px', display:'flex', alignItems:'center', justifyContent:'center', minHeight:36 }}>
          <QuestionHint q={q} subject={subject} onSpeak={onSpeak} />
        </div>
      )}

      {/* ── MOVE PANEL (bottom ~50%, 2×2 grid) ─────────────────────────────── */}
      {!victoryMode && (
        <div style={{ flex:1, padding:'0 12px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:10, minHeight:0 }}>
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

      {/* ── VICTORY STATE ──────────────────────────────────────────────────── */}
      {victoryMode && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
          <div style={{ fontSize:68, animation:'victory-bounce .7s ease' }}>🎉</div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:'#FFD700' }}>ชนะแล้ว!</div>
        </div>
      )}

      {/* ── TEACH INTRO OVERLAY ────────────────────────────────────────────── */}
      {showTeach && (
        <div style={{
          position:'absolute', inset:0, zIndex:80,
          background:'rgba(0,0,0,.88)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:24, textAlign:'center',
        }}>
          <div style={{ fontSize:64, marginBottom:10 }}>{enemy.emoji}</div>
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
              background:'#7F77DD', color:'#fff', border:'none',
              borderRadius:14, padding:'13px 38px',
              fontFamily:"'Fredoka One',cursive", fontSize:18,
              cursor:'pointer', touchAction:'manipulation',
            }}
          >
            ⚔️ เริ่มต่อสู้!
          </button>
        </div>
      )}
    </div>
  )
}
