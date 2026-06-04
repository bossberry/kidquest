import React, { useState, useEffect, useMemo, useRef } from 'react'
import { playTone, speakTh, speakEn } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'
import EggCanvas from '../components/EggCanvas.jsx'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { shuffle } from '../config/gameConfig.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const ICONS = ['⚡','🔥','❄️','🌪️','🌊','🌟','💥','🌿']
const MOVE_NAME = {
  '⚡':'Thunder','🔥':'Firespin','❄️':'Blizzard','🌪️':'Whirlwind',
  '🌊':'Surf','🌟':'Starfall','💥':'Blast','🌿':'Leafage',
}
const BG = { math:'#1a1040', thai:'#0d2b1d', eng:'#0a1f3d' }

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

// ─── Helper components ────────────────────────────────────────────────────────

function HPBar({ pct, isBoss }) {
  const color = pct > 50 ? '#E24B4A' : pct > 25 ? '#EF9F27' : '#f66'
  return (
    <div style={{ flex:1, height: isBoss ? 10 : 7, background:'rgba(255,255,255,.15)', borderRadius:20, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.max(0, pct)}%`, background:color, transition:'width .65s ease', borderRadius:20 }} />
    </div>
  )
}

function MoveCard({ icon, moveName, content, isSelected, isMiss, onTap, disabled }) {
  const large = typeof content === 'string' && content.length <= 2  // emoji vs number
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      style={{
        background: isMiss ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.1)',
        border: isSelected ? '2px solid rgba(255,255,255,.7)' : '1.5px solid rgba(255,255,255,.2)',
        borderRadius:14, padding:'10px 6px',
        cursor: disabled ? 'default' : 'pointer',
        display:'flex', flexDirection:'column', alignItems:'center', gap:3,
        touchAction:'manipulation',
        animation: isSelected ? 'move-pulse .22s ease' : isMiss ? 'miss-fizzle .5s ease forwards' : 'none',
        opacity: isMiss ? 0.4 : 1,
        transition:'opacity .15s, border-color .1s',
        userSelect:'none', WebkitUserSelect:'none',
      }}
    >
      <div style={{ fontSize:26, lineHeight:1 }}>{icon}</div>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize: large ? 38 : 32, color:'#fff', lineHeight:1, marginTop:2 }}>
        {content}
      </div>
      <div style={{ fontSize:8, color:'rgba(255,255,255,.3)', letterSpacing:'0.3px', textTransform:'uppercase' }}>{moveName}</div>
    </button>
  )
}

function QuestionHint({ q, subject, onSpeak }) {
  const btnStyle = {
    background:'rgba(255,255,255,.12)', border:'none', borderRadius:8,
    padding:'5px 12px', fontSize:13, cursor:'pointer', color:'rgba(255,255,255,.85)',
    fontFamily:'Mitr,sans-serif', touchAction:'manipulation',
  }
  if (subject === 'thai') return (
    <div style={{ textAlign:'center', padding:'2px 0' }}>
      <button onClick={onSpeak} style={btnStyle}>🔊 ฟังอีกครั้ง</button>
    </div>
  )
  if (subject === 'eng') return (
    <div style={{ textAlign:'center', padding:'2px 0' }}>
      <button onClick={onSpeak} style={btnStyle}>🔊 Listen again</button>
    </div>
  )
  // Math variants
  if (q.isCount) return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:10, color:'rgba(255,255,255,.55)', marginBottom:4 }}>มีกี่อัน?</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, justifyContent:'center' }}>
        {q.objects.map((e,i) => <span key={i} style={{ fontSize:26, lineHeight:1 }}>{e}</span>)}
      </div>
    </div>
  )
  if (q.isPattern) return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:10, color:'rgba(255,255,255,.55)', marginBottom:4 }}>อะไรต่อไป?</div>
      <div style={{ display:'flex', gap:4, justifyContent:'center', alignItems:'center', flexWrap:'wrap' }}>
        {q.seq.map((e,i) => <span key={i} style={{ fontSize:22 }}>{e}</span>)}
        <span style={{ fontSize:18, border:'2px dashed rgba(255,255,255,.35)', borderRadius:6, padding:'2px 8px', color:'rgba(255,255,255,.5)', fontWeight:700 }}>?</span>
      </div>
    </div>
  )
  if (q.isWord) return (
    <div style={{ fontSize:11, color:'rgba(255,255,255,.75)', lineHeight:1.5, textAlign:'center' }}>{q.story}</div>
  )
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:42, color:'#FFD700', lineHeight:1 }}>{q.a}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:30, color:'rgba(255,255,255,.5)' }}>{q.op}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:42, color:'#FFD700', lineHeight:1 }}>{q.b}</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:30, color:'rgba(255,255,255,.3)' }}>=</span>
      <span style={{ fontFamily:"'Fredoka One',cursive", fontSize:42, color:'#fff', lineHeight:1 }}>?</span>
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

  // ── Refs (synchronous access in callbacks) ───────────────────────────────
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
  const [dmgFloat, setDmgFloat]         = useState(null)   // {val,isCrit,isUlt}
  const [eggAnimClass, setEggAnimClass] = useState('')
  const [selectedCard, setSelectedCard] = useState(-1)
  const [missCard, setMissCard]         = useState(-1)
  const [comboDisplay, setComboDisplay] = useState(0)      // 0–3 for glow intensity
  const [ultimateReady, setUltimateReady] = useState(false)
  const [critFlash, setCritFlash]       = useState(false)
  const [enemyDefeating, setEnemyDefeating] = useState(false)
  const [victoryMode, setVictoryMode]   = useState(false)
  const [showTeach, setShowTeach]       = useState(() => !!isFirstLevel && cur === 0)

  // ── Move icons per question ──────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const moveIcons = useMemo(() => shuffle([...ICONS]).slice(0, 4), [cur])

  // ── TTS on question change ───────────────────────────────────────────────
  useEffect(() => {
    if (!q?.ttsWord) return
    const delay = 400
    const t = setTimeout(() => {
      if (!mountedRef.current) return
      if (subject === 'thai') speakTh(q.ttsWord)
      else if (subject === 'eng') speakEn(q.ttsWord)
    }, delay)
    return () => clearTimeout(t)
  }, [cur, subject]) // eslint-disable-line

  // Reset per question (new q arrives)
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

  function fireHit(idx) {
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

    // Visual hit effects
    if (mountedRef.current) {
      setSelectedCard(-1)
      setHitFlash(true)
      setTimeout(() => mountedRef.current && setHitFlash(false), 300)
      setDmgFloat({ val: dmg, isCrit: mult > 1, isUlt })
      setTimeout(() => mountedRef.current && setDmgFloat(null), 950)
    }

    // Battle log + sounds
    const icon = moveIcons[idx]
    const name = MOVE_NAME[icon] || '⚔️'
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
      log = `${icon} ${name}! +${earned} XP`
      playTone('correct')
    }
    if (mountedRef.current) {
      setBattleLog(log)
      setComboDisplay(Math.min(combo, 3))
    }

    // Check ultimate charge after this hit (not if just consumed)
    if (!isUlt && !ultimateRef.current && combo >= 3) {
      ultimateRef.current = true
      if (mountedRef.current) {
        setUltimateReady(true)
        setTimeout(() => mountedRef.current && setBattleLog('🌟 ท่าพิเศษพร้อม!'), 1100)
      }
    }

    // Advance
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
    : 'none'
  const eggFilter = victoryMode         ? 'drop-shadow(0 0 18px gold) brightness(1.25)'
    : eggAnimClass === 'lunge'          ? 'drop-shadow(0 0 14px gold) brightness(1.2)'
    : comboDisplay >= 2                 ? 'drop-shadow(0 0 8px rgba(255,215,0,.7))'
    : comboDisplay >= 1                 ? 'drop-shadow(0 0 4px rgba(255,215,0,.4))'
    : nearHatch                         ? 'drop-shadow(0 0 5px rgba(255,215,0,.5))'
    : 'none'
  const comboGlow = comboDisplay === 3  ? '0 0 0 3px #FFD700, 0 0 18px rgba(255,215,0,.5)'
    : comboDisplay === 2                ? '0 0 0 2px rgba(255,215,0,.7)'
    : comboDisplay === 1                ? '0 0 0 1.5px rgba(255,215,0,.4)'
    : 'none'

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100%', background:bg, display:'flex', flexDirection:'column', fontFamily:'Mitr,sans-serif', position:'relative', overflow:'hidden' }}>

      {/* Crit/Ultimate screen flash */}
      {critFlash && (
        <div style={{ position:'absolute', inset:0, background:'rgba(255,215,0,.13)', pointerEvents:'none', zIndex:50, animation:'crit-flash .35s ease forwards' }} />
      )}

      {/* Enemy area */}
      <div style={{ padding:'12px 16px 6px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ fontSize: isBoss ? 58 : 50, lineHeight:1, position:'relative', flexShrink:0,
          filter: hitFlash ? 'brightness(3) sepia(1) saturate(5) hue-rotate(-20deg)' : 'none',
          animation: enemyDefeating ? 'enemy-defeat .8s ease forwards' : 'none',
          transition:'filter .12s',
        }}>
          {enemy.emoji}
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
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
            <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:12, color:'#fff', opacity:.85, whiteSpace:'nowrap' }}>
              {isBoss ? '👑 ' : ''}{enemy.name}
            </div>
            {isBoss && <span style={{ fontSize:9, background:'rgba(255,215,0,.18)', color:'#FFD700', borderRadius:6, padding:'1px 5px', fontFamily:"'Fredoka One',cursive" }}>BOSS</span>}
          </div>
          <HPBar pct={hpPct} isBoss={isBoss} />
        </div>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:12, color:'rgba(255,255,255,.4)', flexShrink:0 }}>
          {cur+1}/{total}
        </div>
      </div>

      {/* Battle log */}
      <div style={{ margin:'0 14px 6px', background:'rgba(255,255,255,.9)', borderRadius:10, padding:'8px 13px' }}>
        <div style={{ fontSize:12, color:'#111', lineHeight:1.5 }}>▷ {battleLog}</div>
      </div>

      {/* Egg + Combo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 16px 6px' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          {eggStats ? (
            <EggCanvas stats={eggStats} width={46} height={54} style={{
              animation: eggAnim,
              filter: eggFilter,
              transition:'filter .25s',
              display:'block',
            }} />
          ) : (
            <div style={{ fontSize:30, lineHeight:1, animation: eggAnim }}>🥚</div>
          )}
          {comboDisplay >= 1 && (
            <div style={{
              position:'absolute', inset:-4, borderRadius:'50%',
              boxShadow: comboGlow,
              pointerEvents:'none',
              animation: comboDisplay >= 3 ? 'streak-bounce .6s ease' : 'none',
            }} />
          )}
          {victoryMode && (
            <div style={{ position:'absolute', top:'-14px', left:'50%', transform:'translateX(-50%)',
              fontSize:16, animation:'dmg-float .6s ease-out forwards', pointerEvents:'none' }}>✨</div>
          )}
        </div>

        {/* Egg growth bar */}
        {eggProgress && (
          <div style={{ flex:1, padding:'4px 8px',
            background: nearHatch ? 'rgba(255,215,0,.07)' : 'rgba(255,255,255,.05)',
            borderRadius:8,
            border: nearHatch ? '1px solid rgba(255,215,0,.3)' : '1px solid rgba(255,255,255,.08)',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:9,
                color: nearHatch ? '#FFD700' : 'rgba(255,255,255,.45)' }}>
                🥚 {EGG_STAGE_NAMES[eggProgress.stage] || 'ไข่ลึกลับ'}
              </div>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:9,
                color: nearHatch ? '#FFD700' : 'rgba(255,255,255,.35)' }}>
                {Math.round(eggProgress.pct)}%
              </div>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,.1)', borderRadius:10, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(100, eggProgress.pct)}%`,
                background: nearHatch ? 'linear-gradient(90deg,#FFD700,#FF9900)' : 'rgba(127,119,221,.8)',
                transition:'width .7s ease', borderRadius:10 }} />
            </div>
            {nearHatch && (
              <div style={{ fontSize:8, color:'#FFD700', marginTop:2, textAlign:'center', fontFamily:"'Fredoka One',cursive" }}>
                ✨ ใกล้ฟักแล้ว!
              </div>
            )}
          </div>
        )}

        {/* Ultimate indicator */}
        {ultimateReady && !victoryMode && (
          <div style={{
            fontFamily:"'Fredoka One',cursive", fontSize:11,
            color:'#FFD700', textAlign:'center', flexShrink:0,
            animation:'streak-bounce .55s ease',
            textShadow:'0 0 8px gold',
          }}>
            🌟<br/>ท่า<br/>พิเศษ
          </div>
        )}

        {/* Combo streak badge */}
        {comboDisplay >= 1 && !victoryMode && (
          <div style={{
            fontFamily:"'Fredoka One',cursive", fontSize:10,
            background: comboDisplay >= 3 ? 'rgba(255,215,0,.2)' : 'rgba(255,255,255,.1)',
            color: comboDisplay >= 3 ? '#FFD700' : 'rgba(255,255,255,.7)',
            borderRadius:8, padding:'3px 7px', flexShrink:0,
            border: comboDisplay >= 3 ? '1px solid rgba(255,215,0,.4)' : '1px solid rgba(255,255,255,.15)',
          }}>
            {comboDisplay >= 3 ? '💥' : comboDisplay === 2 ? '🔥' : '✨'} {comboRef.current}x
          </div>
        )}
      </div>

      {/* Question hint + Move panel */}
      <div style={{ flex:1, padding:'0 12px 12px', display:'flex', flexDirection:'column', gap:8 }}>
        {/* Hint */}
        <div style={{ padding:'4px 4px 2px', minHeight:48, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {!victoryMode && <QuestionHint q={q} subject={subject} onSpeak={onSpeak} />}
          {victoryMode && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, animation:'victory-bounce .7s ease' }}>🎉</div>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:16, color:'#FFD700' }}>ชนะแล้ว!</div>
            </div>
          )}
        </div>

        {/* 2×2 Move panel */}
        {!victoryMode && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, flex:1 }}>
            {q.choices.map((choice, idx) => (
              <MoveCard
                key={idx}
                icon={moveIcons[idx]}
                moveName={MOVE_NAME[moveIcons[idx]] || ''}
                content={choice}
                isSelected={selectedCard === idx}
                isMiss={missCard === idx}
                onTap={() => handleTap(choice, idx)}
                disabled={lockedRef.current || victoryMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Teach intro overlay */}
      {showTeach && (
        <div style={{
          position:'absolute', inset:0, zIndex:80,
          background:'rgba(0,0,0,.88)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:24, textAlign:'center',
        }}>
          <div style={{ fontSize:56, marginBottom:10 }}>{enemy.emoji}</div>
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
