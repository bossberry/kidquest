// MoveSelectBattleMode.jsx — Pokémon-style battle engine: question delivery, move selection, hit/miss animation, and XP dispatch.
import React, { useState, useEffect, useRef } from 'react'
import { playTone, speakTh, speakEn, playSFX } from '../lib/audio.js'
import EggCanvas from '../components/EggCanvas.jsx'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import { useBattleEffects } from '../hooks/useBattleEffects.js'
import { useBattleCombat } from '../hooks/useBattleCombat.js'
import { ELEMENTS } from '../config/elementConfig.js'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import PixelItemIcon from '../components/PixelItemIcon.jsx'
import { BATTLE_ITEMS } from '../config/itemConfig.js'
import GBHPBar from '../components/battle/GBHPBar.jsx'
import EnemyCanvas from '../components/battle/EnemyCanvas.jsx'
import MoveCard from '../components/battle/MoveCard.jsx'
import HintBar, { numTh, mathToThai } from '../components/battle/HintBar.jsx'
import NumpadInput from '../components/battle/NumpadInput.jsx'
import WordBuildInput from '../components/battle/WordBuildInput.jsx'

// ─── Constants ────────────────────────────────────────────────────────────────

const BG = { math:'#1a1040', thai:'#0d2b1d', eng:'#0a1f3d' }

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

const ELEMENT_ICONS = {
  lightning: '⚡',
  fire:      '🔥',
  ice:       '❄️',
  wind:      '🌪️',
  laser:     '💜',
  water:     '💧',
}

const ITEM_DESCRIPTIONS = {
  skip:        'เปลี่ยนคำถามใหม่ทันที\nถ้าไม่รู้คำตอบ ใช้ได้เลย!',
  free_attack: 'โจมตีมอนสเตอร์ฟรี 1 ครั้ง\nไม่ต้องตอบคำถาม!',
  hint:        'ตัดตัวเลือกผิดออก 2 อัน\nเหลือแค่ 2 ตัวเลือก ง่ายขึ้น!',
  block:       'ป้องกันการโจมตีครั้งต่อไป\nตอบผิดก็ไม่โดนตี 1 ครั้ง',
  double_xp:   'คำถามถัดไปถ้าตอบถูก\nได้ XP เพิ่มเป็น 2 เท่า!',
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MoveSelectBattleMode({
  q, cur, total, streak, subject,
  onCorrect, onWrong, onNext, onSpeak,
  eggStats, eggProgress, readyToHatch, isFirstLevel,
  enemyData,
  showReturnButton,
  onComplete,
  isWorldBattle,
  isBossBattle,
  creature,
  creatureStats,
  creatureCurrentHP,
  creatureName,
  onCreatureTakeDamage,
  onCreatureHeal,
  onBattleXP,
  onFaint,
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
  const maxHP     = isWorldBattle ? (enemyData?.hp ?? 200) : (isBoss ? total * 14 : total * 9)
  const dmgBase   = isWorldBattle ? 1 : Math.ceil(maxHP / total)

  // Core refs
  const lockedRef          = useRef(false)
  const battleOverRef      = useRef(false)
  const comboRef           = useRef(0)
  const ultimateRef        = useRef(false)
  const enemyHPRef         = useRef(maxHP)
  const mountedRef         = useRef(true)
  const typeTimerRef       = useRef(null)

  // Effect system refs
  const battleFieldRef  = useRef(null)
  const eggDivRef       = useRef(null)
  const enemyDivRef     = useRef(null)

  const { effectCanvasRef, overlayCanvasRef, spawnEffect } = useBattleEffects({
    battleFieldRef, eggDivRef, enemyDivRef, subject,
  })

  const questionStartTime = useRef(null)
  const responseTimeRef   = useRef(0)

  // Element system
  const [battleElement] = useState(() => {
    const keys = Object.keys(ELEMENTS)
    return keys[Math.floor(Math.random() * keys.length)]
  })
  const [attackLabel, setAttackLabel] = useState(null)

  useEffect(() => () => {
    mountedRef.current = false
    if (typeTimerRef.current) clearInterval(typeTimerRef.current)
  }, [])

  // State
  const [enemyHP, setEnemyHP]             = useState(maxHP)
  const [playerHP, setPlayerHP]           = useState(MAX_PLAYER_HP)
  const [localCreatureHP, setLocalCreatureHP] = useState(() => creatureCurrentHP ?? creatureStats?.HP ?? 15)
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
  const [entered, setEntered]             = useState(false)

  // Battle item state
  const { state, dispatch } = useAppState()
  const [itemUsed, setItemUsed]             = useState(false)
  const [eliminatedChoices, setEliminated]  = useState([])
  const [shieldActive, setShieldActive]     = useState(false)
  const [xpBoostActive, setXpBoost]         = useState(false)
  const [victoryBonus, setVictoryBonus]     = useState(null)
  const [pendingItem, setPendingItem]       = useState(null)
  const [enemyHurt, setEnemyHurt]           = useState(false)
  const shieldActiveRef  = useRef(false)
  const xpBoostActiveRef = useRef(false)

  // ── Entry: 3 white flashes + slide-in ──────────────────────────────────────
  useEffect(() => {
    const times = [80,  200, 280, 400, 480, 530]
    const fns   = [
      () => mountedRef.current && setFlashVisible(false),
      () => { mountedRef.current && setFlashVisible(true); playSFX('battle_start') },
      () => mountedRef.current && setFlashVisible(false),
      () => mountedRef.current && setFlashVisible(true),
      () => mountedRef.current && setFlashVisible(false),
      () => mountedRef.current && setEntered(true),
    ]
    const timers = times.map((t, i) => setTimeout(fns[i], t))
    return () => timers.forEach(clearTimeout)
  }, [])

  // ── Typewriter dialogue ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeTimerRef.current) clearInterval(typeTimerRef.current)
    let i = 0
    if (mountedRef.current) setShownText(battleLog[0] || '')
    typeTimerRef.current = setInterval(() => {
      i++
      if (i >= battleLog.length) { clearInterval(typeTimerRef.current); return }
      if (mountedRef.current) setShownText(battleLog.slice(0, i + 1))
    }, 25)
  }, [battleLog]) // eslint-disable-line

  // ── TTS on question + start response timer ───────────────────────────────────
  useEffect(() => {
    questionStartTime.current = Date.now()
    const t = setTimeout(() => {
      if (!mountedRef.current) return
      if (subject === 'thai' && q?.ttsWord) speakTh(q.ttsWord)
      else if (subject === 'eng' && q?.ttsWord) speakEn(q.ttsWord)
      else if (subject === 'math' && q) { const txt = mathToThai(q); if (txt) speakTh(txt) }
    }, 500)
    return () => clearTimeout(t)
  }, [cur, subject]) // eslint-disable-line

  // ── Reset per question ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current) return
    setSelectedCard(-1); setMissCard(-1)
    setEggAnimClass('')
    setEliminated([])
    setItemUsed(false)
    lockedRef.current = false
    if (cur > 0) setBattleLog('⚔️ เลือกท่าโจมตี!')
  }, [cur])

  const { fireHit, fireMiss, showVictory, useBattleItem } = useBattleCombat({
    q, cur, total, subject, isWorldBattle, isBoss, isBossBattle,
    enemy, enemyData, creature, creatureStats,
    onCorrect, onWrong, onNext, onComplete, onCreatureTakeDamage, onBattleXP, onFaint,
    showReturnButton, maxHP, dmgBase, battleElement,
    mountedRef, lockedRef, battleOverRef, comboRef, ultimateRef, enemyHPRef,
    responseTimeRef, shieldActiveRef, xpBoostActiveRef,
    battleFieldRef, eggDivRef, enemyDivRef,
    spawnEffect, overlayCanvasRef,
    setEnemyHP, setLocalCreatureHP, setXpBoost, setSelectedCard, setHitFlash,
    setEnemyHurt, setDmgFloat, setBattleLog, setComboDisplay, setUltimateReady,
    setCritFlash, setEnemyDefeating, setVictoryMode, setVictoryBonus,
    setAttackLabel, setMissCard, setEggHitFlash, setEggAnimClass,
    setItemUsed, setEliminated, setShieldActive,
    setPlayerHP, setEnemyLunge,
    localCreatureHP, itemUsed, victoryMode,
  })

  // ── Tap handler ────────────────────────────────────────────────────────────
  function handleTap(choiceVal, idx) {
    if (lockedRef.current || victoryMode || showTeach || battleOverRef.current) return
    lockedRef.current = true
    responseTimeRef.current = Date.now() - (questionStartTime.current ?? Date.now())
    questionStartTime.current = null
    setSelectedCard(idx)
    playTone('tap'); playSFX('attack_launch')
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

  function handleDismissTeach() {
    setShowTeach(false)
    setTimeout(() => {
      if (!mountedRef.current) return
      if (subject === 'thai' && q?.ttsWord) speakTh(q.ttsWord)
      else if (subject === 'eng' && q?.ttsWord) speakEn(q.ttsWord)
      else if (subject === 'math' && q) { const txt = mathToThai(q); if (txt) speakTh(txt) }
    }, 300)
  }

  // Derived
  const hpPct              = (enemyHP / maxHP) * 100
  const _displayPlayerHP    = isWorldBattle ? localCreatureHP : playerHP
  const _displayMaxPlayerHP = isWorldBattle ? (creatureStats?.HP || 1) : MAX_PLAYER_HP
  const playerHpPct        = (_displayPlayerHP / _displayMaxPlayerHP) * 100
  const eggAnim = eggAnimClass === 'charge' ? 'egg-charge .3s ease'
    : eggAnimClass === 'lunge'  ? 'adv-jump .42s ease'
    : victoryMode               ? 'eggBounce .6s ease infinite'
    : nearHatch                 ? 'egg-near-hatch 2s ease-in-out infinite'
    : 'egg-idle 3s ease-in-out infinite'
  const saiyanActive = (state.activeBoosts?.rainbow_star?.endsAt ?? 0) > Date.now()
  useEffect(() => { if (saiyanActive) playTone('ultimate') }, [saiyanActive]) // eslint-disable-line
  const eggFilter = victoryMode         ? 'drop-shadow(0 0 18px gold) brightness(1.25)'
    : eggAnimClass === 'lunge'          ? 'drop-shadow(0 0 14px gold) brightness(1.2)'
    : saiyanActive                      ? 'drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 20px #FF8800) brightness(1.3)'
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
    <div style={{
      flex:1, minHeight:0, background:bg,
      display:'flex', flexDirection:'column',
      fontFamily:'Mitr,sans-serif', position:'relative', overflow:'hidden',
    }}>

      {/* Entry flash */}
      {flashVisible && (
        <div style={{ position:'absolute', inset:0, background:'#fff', zIndex:100, pointerEvents:'none' }} />
      )}

      {/* Crit/ultimate screen flash */}
      {critFlash && (
        <div style={{ position:'absolute', inset:0, background:'rgba(255,215,0,.13)', pointerEvents:'none', zIndex:50, animation:'crit-flash .35s ease forwards' }} />
      )}

      {/* ── BATTLE FIELD ─────────────────────────────────────────────────── */}
      <div ref={battleFieldRef} style={{
        flex:1, minHeight:200, position:'relative',
        background:'linear-gradient(180deg, #1a2a1a 0%, #1e3020 40%, #2a4020 100%)',
        overflow:'hidden', borderBottom:'2px solid #3a6a3a',
      }}>

        {/* Canvas effect overlay */}
        <canvas
          ref={effectCanvasRef}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:15 }}
        />
        {/* Element attack overlay */}
        <canvas
          ref={overlayCanvasRef}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:16 }}
        />
        {/* Attack tier name flash */}
        {attackLabel && (
          <div style={{
            position:'absolute', top:'35%', left:0, right:0, zIndex:20,
            textAlign:'center', fontSize:28, fontWeight:'bold',
            color: ELEMENTS[battleElement].color,
            textShadow: `0 0 20px ${ELEMENTS[battleElement].color}`,
            animation: 'fadeInOut 0.9s ease forwards',
            pointerEvents:'none', fontFamily:'Mitr,sans-serif',
          }}>
            {attackLabel}
          </div>
        )}

        {/* Enemy status — top left */}
        <div className="px-box" style={{
          position:'absolute', top:8, left:10, zIndex:10,
          minWidth:140, maxWidth:178, padding:'5px 10px',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span className="px-name-badge" style={{ fontFamily:'var(--font-thai)', fontSize:12, color:'#ffffff', background:'rgba(0,0,0,0.6)' }}>
              {isBoss ? 'BOSS: ' : ''}{enemy.name}
            </span>
            <span style={{ fontSize:9, color:'rgba(255,255,255,.3)', marginLeft:6 }}>{cur+1}/{total}</span>
          </div>
          <div style={{
            display:'inline-block', marginBottom:5,
            background: ELEMENTS[battleElement].color + '28',
            border: `1px solid ${ELEMENTS[battleElement].color}66`,
            color: ELEMENTS[battleElement].color,
            borderRadius:10, padding:'1px 8px', fontSize:10,
          }}>
            {ELEMENT_ICONS[battleElement]} {ELEMENTS[battleElement].name}
          </div>
          <GBHPBar pct={hpPct} current={enemyHP} max={maxHP} />
        </div>

        {/* Enemy canvas sprite — top right, slides in from right */}
        <div style={{
          position:'absolute', right:8, top:8, zIndex:10,
          transform: `translateX(${entered ? 0 : 120}px)`,
          transition: 'transform 300ms ease-out',
        }}>
          <div style={{
            transform: `translateX(${enemyLunge ? -34 : 0}px)`,
            transition: 'transform 130ms ease',
          }}>
            <div ref={enemyDivRef}>
              <EnemyCanvas enemyType={enemyType} size={120} hitFlash={hitFlash} enemyDefeating={enemyDefeating} enemyHurt={enemyHurt} />
              {dmgFloat && (
                <div style={{
                  position:'absolute', top:'-24px', left:'50%', transform:'translateX(-50%)',
                  fontFamily:"'Fredoka One',cursive",
                  fontSize: dmgFloat.isUlt ? 28 : dmgFloat.isCrit ? 24 : 18,
                  color: dmgFloat.isUlt ? '#FFD700' : dmgFloat.isCrit ? '#FFD700' : '#ff9090',
                  animation:'dmg-float 1s ease-out forwards',
                  pointerEvents:'none', fontWeight:900, whiteSpace:'nowrap',
                  textShadow: dmgFloat.isUlt ? '0 0 10px gold' : 'none',
                }}>
                  -{dmgFloat.val}{dmgFloat.isUlt ? ' 🌟' : dmgFloat.isCrit ? ' ⚡' : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player status — bottom right */}
        <div className="px-box" style={{
          position:'absolute', bottom:8, right:10, zIndex:10,
          minWidth:140, maxWidth:172, padding:'5px 10px',
        }}>
          <div className="px-name-badge" style={{ marginBottom:5, fontFamily:'var(--font-thai)', fontSize:11, color:'#ffffff', background:'rgba(0,0,0,0.6)' }}>
            {isWorldBattle ? (creatureName || 'ตัวเอก') : (EGG_STAGE_NAMES?.[eggProgress?.stage ?? 0] || 'ไข่ลึกลับ')}
          </div>
          <GBHPBar pct={playerHpPct} isPlayer current={_displayPlayerHP} max={_displayMaxPlayerHP} />
        </div>

        {/* Egg/player — bottom left, slides in from left */}
        <div style={{
          position:'absolute', left:8, bottom:0, zIndex:10,
          transform: `translateX(${entered ? 0 : -120}px)`,
          transition: 'transform 300ms ease-out 100ms',
        }}>
          <div style={{ animation: eggAnim, position:'relative' }}>
            <div style={{ transform: `translateX(${eggAnimClass === 'lunge' ? 22 : 0}px)`, transition:'transform 150ms ease' }}>
              <div ref={eggDivRef}>
                {isWorldBattle && creature ? (
                  <canvas
                    key={creature.id}
                    ref={r => { if (r) drawCreature(r, getCreatureSeed(creature), creature.eggStats ?? {}) }}
                    width={96} height={96}
                    style={{
                      imageRendering:'pixelated', display:'block',
                      filter: eggHitFlash ? 'brightness(8) saturate(0)' : eggFilter,
                      transform: eggAnimClass === 'shake' ? 'translateX(-8px)' : 'none',
                      transition:'filter .2s, transform .1s',
                    }}
                  />
                ) : eggStats ? (
                  <EggCanvas stats={eggStats} width={96} height={112} style={{
                    display:'block',
                    filter: eggHitFlash ? 'brightness(8) saturate(0)' : eggFilter,
                    transition:'filter .2s',
                  }} />
                ) : (
                  <div style={{ fontSize:52, lineHeight:1, filter: eggHitFlash ? 'brightness(8) saturate(0)' : eggFilter }}>🥚</div>
                )}
              </div>
            </div>
            {comboDisplay >= 1 && (
              <div style={{
                position:'absolute', inset:-5, borderRadius:'50%',
                boxShadow: comboGlow, pointerEvents:'none',
                animation: comboDisplay >= 3 ? 'streak-bounce .6s ease' : 'none',
              }} />
            )}
            {victoryMode && (
              <div style={{ position:'absolute', top:'-16px', left:'50%', transform:'translateX(-50%)', fontSize:20, animation:'dmg-float .6s ease-out forwards', pointerEvents:'none' }}>✨</div>
            )}
          </div>
        </div>

        {/* Combo / ultimate indicators */}
        {comboDisplay >= 1 && !victoryMode && (
          <div style={{
            position:'absolute', left:114, bottom:30, zIndex:10,
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
            position:'absolute', left:114, bottom:52, zIndex:10,
            fontFamily:"'Fredoka One',cursive", fontSize:10, color:'#FFD700',
            animation:'streak-bounce .55s ease', textShadow:'0 0 8px gold',
          }}>
            🌟 ท่าพิเศษ
          </div>
        )}
      </div>

      {/* ── DIALOGUE BOX (Zone 1) ────────────────────────────────────────── */}
      {/* Math arithmetic: dot groups. All other cases: battle log text. */}
      <div className="px-dialogue" style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {!victoryMode && q && subject === 'math' && !q.isCount && !q.isPattern && !q.isWord && q.a !== undefined
          ? <HintBar q={q} subject={subject} />
          : <div style={{ fontFamily:'var(--font-thai)', fontSize:13, color:'var(--px-white)', lineHeight:1.6 }}>{shownText}</div>
        }
      </div>

      {/* ── QUESTION DISPLAY (Zone 2) ─────────────────────────────────────── */}
      {!victoryMode && q && (() => {
        // Compute display text per question type
        let display = null
        if (subject === 'math') {
          if (q.isCount)                                display = (q.objects || []).join(' ') + ' = ?'
          else if (q.isPattern)                         display = (q.seq || []).join(' ') + ' ?'
          else if (q.question)                          display = q.question
          else if (q.a !== undefined && q.op != null)  display = `${q.a} ${q.op} ${q.b} = ?`
          else if (q.story)                             display = q.story
        } else if (subject === 'thai') {
          display = q.word ?? q.question
        } else {
          display = q.word ?? q.letter ?? q.question
        }
        if (!display) return null

        const ttsText = q.ttsWord || q.question || q.word || q.letter || ''
        return (
          <div style={{
            textAlign: 'center',
            padding: '12px 16px 8px',
            background: 'var(--px-darkest, #0a0a12)',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: subject === 'thai'
                ? 'Sarabun, sans-serif'
                : 'var(--font-pixel, "Press Start 2P"), monospace',
              fontSize: subject === 'thai' ? 34 : 26,
              fontWeight: 'bold',
              color: '#f0d020',
            }}>
              {display}
            </span>
            {' '}
            <button
              onClick={() => {
                if (!ttsText) return
                if (subject === 'thai') speakTh(ttsText)
                else speakEn(ttsText)
              }}
              style={{
                background: 'transparent', border: 'none',
                fontSize: 18, cursor: 'pointer', verticalAlign: 'middle',
              }}
            >
              🔊
            </button>
          </div>
        )
      })()}

      {/* ── ITEM BAR (Zone 2.5) ──────────────────────────────────────────── */}
      {!victoryMode && !isBossBattle && Object.keys(BATTLE_ITEMS).some(k => (state.battleItems?.[k] || 0) > 0) && (
        <div style={{ display:'flex', gap:6, padding:'0 10px 4px', flexShrink:0, alignItems:'center' }}>
          {Object.keys(BATTLE_ITEMS).map(key => {
            const count = state.battleItems?.[key] || 0
            if (count <= 0) return null
            const item = BATTLE_ITEMS[key]
            return (
              <button
                key={key}
                onClick={() => !itemUsed && setPendingItem(key)}
                disabled={itemUsed}
                title={item.name_th}
                style={{
                  position: 'relative',
                  background: itemUsed ? 'rgba(60,60,60,0.5)' : `${item.color}22`,
                  border: `2px solid ${itemUsed ? '#555' : item.color}`,
                  borderRadius: 4, padding: 4, cursor: itemUsed ? 'default' : 'pointer',
                  opacity: itemUsed ? 0.45 : 1,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <PixelItemIcon type={key} size={24} />
                <div style={{
                  position: 'absolute', top: -5, right: -5,
                  background: '#ff4444', color: '#fff',
                  fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold',
                  borderRadius: '50%', width: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {count}
                </div>
              </button>
            )
          })}
          {shieldActive && (
            <span style={{ fontSize:10, color:'#44cc44', fontFamily:'var(--font-thai)', marginLeft:2 }}>โล่</span>
          )}
          {xpBoostActive && (
            <span style={{ fontSize:10, color:'#ffcc00', fontFamily:'var(--font-thai)', marginLeft:2 }}>XP×2</span>
          )}
        </div>
      )}

      {/* ── ITEM TOOLTIP POPUP ───────────────────────────────────────────── */}
      {pendingItem && !victoryMode && (() => {
        const key = pendingItem
        const item = BATTLE_ITEMS[key]
        const count = state.battleItems?.[key] || 0
        const descLines = (ITEM_DESCRIPTIONS[item.effect] || '').split('\n')
        return (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 85,
              background: 'rgba(0,0,0,0.82)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setPendingItem(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#1a1a2e',
                border: `2px solid ${item.color}`,
                borderRadius: 12, padding: '20px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                minWidth: 200, maxWidth: 260,
                boxShadow: `0 0 20px ${item.color}44`,
              }}
            >
              <PixelItemIcon type={key} size={40} />
              <div style={{ fontFamily: 'var(--font-thai)', fontSize: 17, color: 'var(--px-yellow)', fontWeight: 'bold' }}>
                {item.name_th}
              </div>
              <div style={{ fontFamily: 'var(--font-thai)', fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.6 }}>
                {descLines.map((line, i) => <div key={i}>{line}</div>)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                มี {count} ชิ้น
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                <button
                  onClick={() => { setPendingItem(null); useBattleItem(key) }}
                  style={{
                    background: item.color, color: '#fff',
                    border: 'none', borderRadius: 6,
                    padding: '8px 18px', fontSize: 14,
                    fontFamily: 'var(--font-thai)', cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  ใช้เลย!
                </button>
                <button
                  onClick={() => setPendingItem(null)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 6, padding: '8px 18px', fontSize: 14,
                    fontFamily: 'var(--font-thai)', cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── MOVE PANEL (Zone 3) ──────────────────────────────────────────── */}
      {!victoryMode && (
        <div style={(q?.inputMode === 'numpad' || q?.inputMode === 'wordbuild')
          ? { padding:'4px 10px 10px', display:'flex', alignItems:'center', justifyContent:'center', height:168, flexShrink:0 }
          : { padding:'4px 10px 10px', display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:8, height:168, flexShrink:0 }
        }>
          {q?.inputMode === 'numpad' ? (
            <NumpadInput
              resetKey={cur}
              disabled={lockedRef.current || victoryMode || showTeach || battleOverRef.current}
              onSubmit={(value) => {
                if (lockedRef.current || victoryMode || showTeach || battleOverRef.current) return
                lockedRef.current = true
                responseTimeRef.current = Date.now() - (questionStartTime.current ?? Date.now())
                questionStartTime.current = null
                playTone('tap'); playSFX('attack_launch')
                setEggAnimClass('charge')
                setTimeout(() => {
                  if (!mountedRef.current) return
                  setEggAnimClass('lunge')
                  setTimeout(() => {
                    if (!mountedRef.current) return
                    setEggAnimClass('')
                    if (value === q.answer) fireHit(-1)
                    else                    fireMiss(-1)
                  }, 280)
                }, 220)
              }}
            />
          ) : q?.inputMode === 'wordbuild' ? (
            <WordBuildInput
              chars={q.chars}
              emoji={q.word}
              resetKey={cur}
              disabled={lockedRef.current || victoryMode || showTeach || battleOverRef.current}
              onSubmit={(isCorrect) => {
                if (lockedRef.current || victoryMode || showTeach || battleOverRef.current) return
                lockedRef.current = true
                responseTimeRef.current = Date.now() - (questionStartTime.current ?? Date.now())
                questionStartTime.current = null
                playTone('tap'); playSFX('attack_launch')
                setEggAnimClass('charge')
                setTimeout(() => {
                  if (!mountedRef.current) return
                  setEggAnimClass('lunge')
                  setTimeout(() => {
                    if (!mountedRef.current) return
                    setEggAnimClass('')
                    if (isCorrect) fireHit(-1)
                    else           fireMiss(-1)
                  }, 280)
                }, 220)
              }}
            />
          ) : (
            q.choices.map((choice, idx) => {
              const eliminated = eliminatedChoices.includes(idx)
              return (
                <MoveCard
                  key={idx}
                  content={choice}
                  isSelected={selectedCard === idx}
                  isMiss={missCard === idx || eliminated}
                  onTap={() => !eliminated && handleTap(choice, idx)}
                  disabled={lockedRef.current || victoryMode || eliminated}
                />
              )
            })
          )}
        </div>
      )}

      {/* ── VICTORY STATE ────────────────────────────────────────────────── */}
      {victoryMode && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:'0 20px 20px' }}>
          <div style={{ fontSize:64, animation:'victory-bounce .7s ease' }}>🎉</div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:'#FFD700' }}>ชนะแล้ว!</div>
          {victoryBonus && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.1)', border:`1px solid ${BATTLE_ITEMS[victoryBonus].color}`, borderRadius:8, padding:'6px 12px' }}>
              <PixelItemIcon type={victoryBonus} size={20} />
              <span style={{ fontSize:12, color:'#FFD700', fontFamily:'var(--font-thai)' }}>ได้รับ: {BATTLE_ITEMS[victoryBonus].name_th}</span>
            </div>
          )}
          {showReturnButton && (
            <button
              onClick={onComplete || onNext}
              className="px-btn px-btn-dark"
              style={{ marginTop:8, fontFamily:'var(--font-thai)', fontSize:16, touchAction:'manipulation' }}
            >
              กลับสำรวจ
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
            <EnemyCanvas enemyType={enemyType} size={80} hitFlash={false} enemyDefeating={false} />
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
            className="px-btn px-btn-purple"
            style={{ marginTop:22, fontFamily:'var(--font-thai)', fontSize:16, touchAction:'manipulation' }}
          >
            เริ่มต่อสู้!
          </button>
        </div>
      )}
    </div>
  )
}
