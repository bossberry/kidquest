// MoveSelectBattleMode.jsx — Pokémon-style battle engine: question delivery, move selection, hit/miss animation, and XP dispatch.
import React, { useState, useEffect, useRef } from 'react'
import { playTone, speakTh, speakEn, playSFX } from '../lib/audio.js'
import EggCanvas from '../components/EggCanvas.jsx'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { useBattleEffects } from '../hooks/useBattleEffects.js'
import { useBattleCombat } from '../hooks/useBattleCombat.js'
import { ELEMENTS } from '../config/elementConfig.js'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import PixelItemIcon from '../components/PixelItemIcon.jsx'
import { BATTLE_ITEMS } from '../config/itemConfig.js'
import GBHPBar from '../components/battle/GBHPBar.jsx'
import BattleBackground from '../components/battle/BattleBackground.jsx'
import EnemyCanvas from '../components/battle/EnemyCanvas.jsx'
import MoveCard from '../components/battle/MoveCard.jsx'
import { numTh, mathToThai } from '../components/battle/HintBar.jsx'
import NumpadInput from '../components/battle/NumpadInput.jsx'
import WordBuildInput, { DEFAULT_ENG_DISTRACTORS } from '../components/battle/WordBuildInput.jsx'
import SequenceInput from '../components/battle/SequenceInput.jsx'
import MemoryCardInput from '../components/battle/MemoryCardInput.jsx'
import { getAttackVariant } from '../lib/enemyAttackVariants.js'

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

// SPEC GAME-B §B.4 (2026-07-12) — 600ms vs-splash subject icon.
const SUBJECT_ICON = { thai: '📖', math: '🔢', eng: '🔤' }

const ELEMENT_ICONS = {
  lightning: '⚡',
  fire:      '🔥',
  ice:       '❄️',
  wind:      '🌪️',
  laser:     '💜',
  water:     '💧',
}

// ITEM_DESCRIPTIONS removed (2026-07-14) — only ever used by the item-bar
// tooltip popup, which no longer renders in this screen (see the Zone 2.5
// removal comment further down).

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
  onHintUsed,
  onBossPhase2,
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
  // SPEC GAME-B §B.4 (2026-07-12) — chosen once per battle, like battleElement below.
  const [attackVariant] = useState(() => getAttackVariant(enemyType))

  // Core refs
  const lockedRef          = useRef(false)
  const battleOverRef      = useRef(false)
  const comboRef           = useRef(0)
  const ultimateRef        = useRef(false)
  const enemyHPRef         = useRef(maxHP)
  const mountedRef         = useRef(true)
  const typeTimerRef       = useRef(null)
  // SPEC GAME-B §B.4 (2026-07-12)
  const chargeRef          = useRef(0)
  const bossPhase2FiredRef = useRef(false)

  // Effect system refs
  const battleFieldRef  = useRef(null)
  const eggDivRef       = useRef(null)
  const enemyDivRef     = useRef(null)

  const { effectCanvasRef, overlayCanvasRef, spawnEffect } = useBattleEffects({
    battleFieldRef, eggDivRef, enemyDivRef, subject,
  })

  const questionStartTime  = useRef(null)
  const responseTimeRef    = useRef(0)
  const memoryMatchedRef   = useRef(0)

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
  // SPEC GAME-B §B.4 (2026-07-12)
  const [chargeMeter, setChargeMeter]     = useState(0)
  const [screenShake, setScreenShake]     = useState(false)
  const [bossPhase2, setBossPhase2]       = useState(false)
  const [showVsSplash, setShowVsSplash]   = useState(true)

  // Battle item state
  const { state, dispatch } = useAppState()
  const [itemUsed, setItemUsed]             = useState(false)
  const [eliminatedChoices, setEliminated]  = useState([])
  const [shieldActive, setShieldActive]     = useState(false)
  const [xpBoostActive, setXpBoost]         = useState(false)
  const [victoryBonus, setVictoryBonus]     = useState(null)
  const [victoryDrop, setVictoryDrop]       = useState(null)   // ROOM_ITEMS entry | null — monster furniture drop
  const [pendingItem, setPendingItem]       = useState(null)
  const [enemyHurt, setEnemyHurt]           = useState(false)
  const shieldActiveRef  = useRef(false)
  const xpBoostActiveRef = useRef(false)

  // ── Entry: 600ms vs-splash, THEN 3 white flashes + slide-in ─────────────────
  // SPEC GAME-B §B.4 (2026-07-12) — the vs-splash (enemy slide-in + name
  // plate + subject icon, see the render block below) plays first and owns
  // its own single 600ms timer; the pre-existing flash+slide-in sequence is
  // simply shifted +600ms later so the two chain rather than overlap. This
  // is the one genuinely ADDED serial delay in this whole spec section —
  // everything else (attack variants, wobble, charge blast, phase 2, ranks)
  // reuses existing timing windows or runs non-blocking. See
  // docs/CHATBOT_NOTES.md's §B.4 entry for the full added-time ledger.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!mountedRef.current) return
      setShowVsSplash(false)
      // URGENT FIX (2026-07-13) — consolidate to ONE intro presentation.
      // The vs-splash just announced the enemy (name plate + VS + subject
      // icon); the dialogue box underneath was still showing its OWN
      // initial "${enemy.name} ปรากฏตัว!" text (set at mount, before the
      // splash even existed) the whole time it was hidden behind the
      // splash — a redundant second "X has appeared!" message once the
      // splash clears.
      // URGENT FIX (2026-07-14) — "⚔️ เลือกท่าโจมตี!" (a legacy "choose
      // your attack move" instruction from before this was a question-
      // driven battle screen) was reported as a confusing banner competing
      // with the actual question for the child's attention, especially
      // since it has no real accompanying "attack move" affordance in any
      // input mode besides the 4-choice grid. Per the required flow, the
      // ONLY strings a child should see during battle are the question
      // itself, real-time feedback, or a hint — clear to empty instead of
      // a static instruction; real feedback text still overwrites this on
      // every hit/miss via fireHit/fireMiss's own setBattleLog calls.
      setBattleLog('')
    }, 600)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line
  useEffect(() => {
    const times = [680, 800, 880, 1000, 1080, 1130]
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
      else if (q?.instructionTh && subject === 'thai') speakTh(q.instructionTh)
      else if (q?.instructionEn && subject === 'eng')  speakEn(q.instructionEn)
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
    memoryMatchedRef.current = 0
    // URGENT FIX (2026-07-14) — see the vs-splash effect above for why this
    // is now empty instead of the old "⚔️ เลือกท่าโจมตี!" instruction.
    if (cur > 0) setBattleLog('')
  }, [cur])

  // Time-based auto-hint — declared here so setTimeoutHintActive is in scope
  // when passed to useBattleCombat below (avoids temporal dead zone crash)
  const [timeoutHintActive, setTimeoutHintActive] = useState(false)
  const timeoutHintTimerRef = useRef(null)

  const HINT_DELAY_MS = {
    choice: 4000, numpad: 5000, fillgap: 4000, visualdiscrim: 4000,
    wordbuild: 6000, sequence: 6000,
  }

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
    setCritFlash, setEnemyDefeating, setVictoryMode, setVictoryBonus, setVictoryDrop,
    setAttackLabel, setMissCard, setEggHitFlash, setEggAnimClass,
    setItemUsed, setEliminated, setShieldActive,
    setPlayerHP, setEnemyLunge,
    setTimeoutHintActive,
    chargeRef, setChargeMeter, setScreenShake, onHintUsed,
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
        if (choiceVal === q.correctAnswer) fireHit(idx)
        else                                fireMiss(idx)
      }, 280)
    }, 220)
  }

  function handleMemoryPairFound() {
    if (victoryMode || battleOverRef.current) return
    memoryMatchedRef.current += 1
    const isLast = memoryMatchedRef.current >= (q?.memoryPairCount ?? 3)
    if (isLast) {
      fireHit(-1) // final pair — full reward + advances to next question / triggers victory
    } else {
      playTone('correct')
      spawnEffect('attack')
    }
  }

  function handleDismissTeach() {
    setShowTeach(false)
    setTimeout(() => {
      if (!mountedRef.current) return
      if (subject === 'thai' && q?.ttsWord) speakTh(q.ttsWord)
      else if (subject === 'eng' && q?.ttsWord) speakEn(q.ttsWord)
      else if (subject === 'math' && q) { const txt = mathToThai(q); if (txt) speakTh(txt) }
      else if (q?.instructionTh && subject === 'thai') speakTh(q.instructionTh)
      else if (q?.instructionEn && subject === 'eng')  speakEn(q.instructionEn)
    }, 300)
  }

  // Input mode hint eligibility (mastery < 0.5 → show hint)
  const wordbuildMastery  = state.inputModeMastery?.wordbuild ?? 0
  const sequenceMastery   = state.inputModeMastery?.sequence  ?? 0

  useEffect(() => {
    setTimeoutHintActive(false)
    clearTimeout(timeoutHintTimerRef.current)
    if (q?.inputMode === 'memory') return
    const mode = q?.inputMode || 'choice'
    const delay = HINT_DELAY_MS[mode] ?? 4000
    timeoutHintTimerRef.current = setTimeout(() => {
      if (mountedRef.current && !lockedRef.current && !victoryMode && !battleOverRef.current) {
        setTimeoutHintActive(true)
        onHintUsed?.() // SPEC GAME-B §B.4 (2026-07-12) — counts toward the boss-rank hint tally
      }
    }, delay)
    return () => clearTimeout(timeoutHintTimerRef.current)
  }, [cur]) // eslint-disable-line

  // SPEC GAME-B §B.4 (2026-07-12) — boss phase 2 at <=50% HP: costume shift
  // (CSS filter on the enemy sprite wrapper, render block below) + a
  // playful bubble line via the existing battleLog mechanism + notifies
  // WorldBattle.jsx (onBossPhase2) so its NEXT selectBattleQuestion call
  // gets opts.reviewBoost. Ref-guarded so it only ever fires once per battle
  // (enemyHP only decreases, but this is cheap insurance either way).
  useEffect(() => {
    if (isBoss && !bossPhase2FiredRef.current && enemyHP > 0 && enemyHP <= maxHP / 2) {
      bossPhase2FiredRef.current = true
      setBossPhase2(true)
      setBattleLog(`${enemy.name}: ยังไม่ยอมง่ายๆ นะ! 😤✨`)
      onBossPhase2?.()
    }
  }, [enemyHP]) // eslint-disable-line

  // Auto-eliminate 2 wrong choices on timeout (choice/fillgap/visualdiscrim modes)
  useEffect(() => {
    if (!timeoutHintActive) return
    if (q?.inputMode === 'numpad' || q?.inputMode === 'wordbuild' ||
        q?.inputMode === 'sequence' || q?.inputMode === 'memory') return
    if (!q?.choices) return
    if (eliminatedChoices.length > 0) return
    const wrongIdxs = q.choices
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c !== q.correctAnswer)
      .map(({ i }) => i)
    const toElim = wrongIdxs.sort(() => Math.random() - 0.5).slice(0, 2)
    setEliminated(toElim)
  }, [timeoutHintActive]) // eslint-disable-line

  const showWordbuildHint = wordbuildMastery < 0.5 || timeoutHintActive
  const showSequenceHint  = sequenceMastery  < 0.5 || timeoutHintActive

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
  // Map battle state to EggCanvas anim/mood props
  const companionAnim = eggAnimClass === 'shake' ? 'hurt'
    : (eggAnimClass === 'lunge' || eggAnimClass === 'charge') ? 'attack'
    : victoryMode ? 'excited'
    : 'idle'
  const companionMood = eggAnimClass === 'shake' ? 'angry'
    : victoryMode ? 'excited'
    : 'normal'
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

      {/* SPEC GAME-B §B.4 (2026-07-12) — 600ms vs-splash, replacing the old
          hard cut straight into the flash+slide-in sequence below. Own
          overlay, own single timer (see the effect above) — the pre-existing
          entry sequence is simply delayed +600ms so the two chain cleanly. */}
      {showVsSplash && (
        <div style={{
          position:'absolute', inset:0, zIndex:110, background:'#0a0a12',
          display:'flex', alignItems:'center', justifyContent:'center', gap:18,
          pointerEvents:'none', overflow:'hidden',
        }}>
          <div style={{
            fontSize:44, animation:'vs-slide-left 0.5s ease-out both',
          }}>{SUBJECT_ICON[subject] ?? '❓'}</div>
          <div style={{
            fontFamily:"'Fredoka One',cursive", fontSize:26, color:'#FFD700',
            textShadow:'0 0 12px rgba(255,215,0,.6)', animation:'fadeInOut 0.6s ease both',
          }}>VS</div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, animation:'vs-slide-right 0.5s ease-out both' }}>
            <div style={{ fontSize:44 }}>{enemy.emoji ?? (isBoss ? '👑' : '👾')}</div>
            <div className="px-name-badge" style={{
              fontFamily:'var(--font-thai)', fontSize:12, color:'#fff',
              background:'rgba(0,0,0,0.6)', padding:'2px 10px',
            }}>
              {isBoss ? 'BOSS: ' : ''}{enemy.name}
            </div>
          </div>
        </div>
      )}

      {/* Entry flash */}
      {flashVisible && (
        <div style={{ position:'absolute', inset:0, background:'#fff', zIndex:100, pointerEvents:'none' }} />
      )}

      {/* Crit/ultimate screen flash */}
      {critFlash && (
        <div style={{ position:'absolute', inset:0, background:'rgba(255,215,0,.13)', pointerEvents:'none', zIndex:50, animation:'crit-flash .35s ease forwards' }} />
      )}

      {/* ── BATTLE FIELD ─────────────────────────────────────────────────── */}
      {/* URGENT FIX (2026-07-13) — the canvas is now the ONLY zone allowed to
          shrink on a short viewport (minHeight dropped 200->180, still
          flex:1). Every zone below (dialogue/question/item-bar/input) stays
          flexShrink:0 and is never clipped — see the move-panel fix further
          down for the other half of this (its old fixed height:168 could
          overflow ABOVE its own box and visually cover the item-bar row). */}
      <div ref={battleFieldRef} style={{
        flex:1, minHeight:180, position:'relative',
        background:'linear-gradient(180deg, #1a2a1a 0%, #1e3020 40%, #2a4020 100%)',
        overflow:'hidden', borderBottom:'2px solid #3a6a3a',
        // SPEC GAME-B §B.4 (2026-07-12) — element-blast screen shake, <=250ms.
        animation: screenShake ? 'battle-shake 0.25s ease' : 'none',
      }}>

        {/* Painted atmospheric scene (behind everything) */}
        <BattleBackground subject={subject} />

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
          {/* SPEC GAME-B §B.4 (2026-07-12) — telegraphed attack-variant
              animation on a wrong answer, driven by the SAME enemyLunge
              boolean/timing fireMiss already toggles (300ms window) — just
              richer motion than the old flat translateX, picked once per
              battle by enemy body type (getAttackVariant). */}
          <div style={{
            animation: enemyLunge ? `enemy-atk-${attackVariant} 0.3s ease` : 'none',
          }}>
            {/* Boss phase 2 costume shift — palette hue-rotate on the sprite. */}
            {/* URGENT FIX (2026-07-13) — added `position:'relative'` here so
                dmgFloat's `position:absolute` anchors DIRECTLY to this box
                (the enemy sprite itself) instead of skipping past it to an
                ancestor 2 levels up (the outer slide-in wrapper, whose own
                width/position depends on the `entered` slide-in transform).
                Also gave dmgFloat an explicit zIndex so its stacking is
                deterministic rather than implicit/paint-order-dependent —
                both are hardening against the reported stray floating
                number, on top of battleField's own overflow:hidden already
                guaranteeing it can never escape the canvas area. */}
            <div ref={enemyDivRef} style={{
              position:'relative',
              filter: bossPhase2 ? 'hue-rotate(140deg) saturate(1.4)' : 'none',
              transition: 'filter 0.4s ease',
            }}>
              <EnemyCanvas enemyType={enemyType} size={120} hitFlash={hitFlash} enemyDefeating={enemyDefeating} enemyHurt={enemyHurt} />
              {dmgFloat && (
                <div style={{
                  position:'absolute', top:'-24px', left:'50%', transform:'translateX(-50%)',
                  zIndex:21, fontFamily:"'Fredoka One',cursive",
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
            {state.name || 'ตัวเอก'}
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
                <EggCanvas
                  stats={eggStats}
                  anim={companionAnim}
                  mood={companionMood}
                  width={96} height={112}
                  style={{
                    display:'block',
                    filter: eggHitFlash ? 'brightness(8) saturate(0)' : eggFilter,
                    // SPEC GAME-B §B.4 (2026-07-12) — egg "wobbles" on a wrong
                    // answer: an oscillating keyframe instead of the old
                    // single static translateX nudge, same 400ms window
                    // fireMiss's setEggAnimClass('shake')...setTimeout(...,400)
                    // already drives.
                    animation: eggAnimClass === 'shake' ? 'egg-wobble 0.4s ease' : 'none',
                    transition:'filter .2s',
                  }}
                />
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

        {/* SPEC GAME-B §B.4 (2026-07-12) — element charge meter, 3 segments.
            Only shown once charging has started, so an untouched battle
            doesn't clutter the field with an empty meter. */}
        {chargeMeter > 0 && !victoryMode && (
          <div style={{
            position:'absolute', left:114, bottom:74, zIndex:10,
            display:'flex', alignItems:'center', gap:3,
            background:'rgba(0,0,0,.25)', borderRadius:8, padding:'3px 6px',
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width:9, height:9, borderRadius:'50%',
                background: i < chargeMeter ? ELEMENTS[battleElement].color : 'rgba(255,255,255,.15)',
                boxShadow: i < chargeMeter ? `0 0 6px ${ELEMENTS[battleElement].color}` : 'none',
                transition:'background .2s, box-shadow .2s',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* ── DIALOGUE BOX (Zone 1) — real-time feedback only ─────────────────── */}
      {/* URGENT FIX (2026-07-14) — removed the HintBar branch: it checked
          q.isCount/q.isPattern/q.isWord/q.a, none of which any real
          questionBank.js generator has ever set (they're pre-Phase-1.1
          fields; math prompts are pre-formatted strings like "3 + 1 = ?"
          in q.prompt, not separate a/op/b fields) — the condition could
          never be true, so this branch was dead code. Reviving HintBar's
          dot-visualization would need either questionBank.js to grow back
          structured a/op/b fields or HintBar to parse them out of the
          prompt string — out of scope for this fix; flagged in
          CHATBOT_NOTES.md as a possible future enhancement, not attempted
          here. This box now purely shows transient feedback text (set by
          fireHit/fireMiss) — empty between questions, per the required
          flow's "only question/feedback/hint" rule. */}
      <div className="px-dialogue" style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:'var(--font-thai)', fontSize:13, color:'var(--px-white)', lineHeight:1.6 }}>{shownText}</div>
      </div>

      {/* ── QUESTION DISPLAY (Zone 2) ─────────────────────────────────────── */}
      {/* URGENT FIX (2026-07-14) — ROOT CAUSE of the reported blank "?":
          this block used to branch on q.isFillGap/q.isVisualDiscrim/
          q.isSequence (early returns) and, for the generic case, checked
          q.question/q.word/q.letter/q.a+q.op/q.isCount/q.isPattern/
          q.story — ALL fields/flags from the pre-Phase-1.1 (before
          2026-07-09) battle engine. Sampled every real generator across
          all 43 curriculum nodes: NONE of them has EVER set any of those
          fields — every real question instead carries a single uniform
          `prompt` string (confirmed non-empty for all 43 nodes) plus an
          optional `promptTh` secondary line for some Thai nodes. So
          `display` was ALWAYS null here, this whole block ALWAYS returned
          null, and the only "?" glyph left on screen was NumpadInput's own
          internal digit-placeholder box — mistaken for "the question" in
          the bug report, since there was genuinely no real question text
          anywhere. QuestionRenderer.jsx/PlacementQuest.jsx/
          TeachingMoment.jsx (the newer Phase 1.2/1.3 components) already
          read q.prompt correctly — this was the one place never migrated.
          Fixed by reading q.prompt directly: no subject-specific branching
          needed at all (prompt is uniform across thai/math/eng), and the
          3 structural early-return branches above are removed as dead
          code (no generator sets isFillGap/isVisualDiscrim/isSequence —
          sequence-mode questions use inputMode:'sequence' + this same
          generic prompt display instead). Font size now scales down for
          longer prompts (reading-comprehension passages can run 2-3
          sentences) while staying >=22px; a maxHeight+scroll fallback
          guards against the rare very-long passage overflowing the layout. */}
      {!victoryMode && q && q.prompt && (() => {
        const display = q.prompt
        const fontSize = display.length > 60 ? 22 : display.length > 30 ? 24 : (subject === 'thai' ? 34 : 26)
        const ttsText = q.ttsWord || q.prompt || ''
        return (
          <div style={{
            textAlign: 'center',
            padding: '12px 16px 8px',
            background: 'var(--px-darkest, #0a0a12)',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
            flexShrink: 0, maxHeight: 150, overflowY: 'auto',
          }}>
            <span style={{
              fontFamily: subject === 'thai'
                ? 'Sarabun, sans-serif'
                : 'var(--font-pixel, "Press Start 2P"), monospace',
              fontSize, fontWeight: 'bold', color: '#f0d020',
              lineHeight: 1.4, whiteSpace: 'pre-wrap',
            }}>
              {display}
            </span>
            {q.promptTh && (
              <div style={{ fontFamily: 'var(--font-thai)', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>
                {q.promptTh}
              </div>
            )}
            {' '}
            <button
              onClick={() => {
                if (!ttsText) return
                if (subject === 'thai') speakTh(ttsText)
                else speakEn(ttsText)
              }}
              aria-label="ฟังอีกครั้ง"
              style={{
                background: 'transparent', border: 'none',
                fontSize: 28, cursor: 'pointer', verticalAlign: 'middle',
                minWidth: 44, minHeight: 44, lineHeight: 1,
              }}
            >
              🔊
            </button>
          </div>
        )
      })()}

      {/* URGENT FIX (2026-07-14) — the battle-items icon row (Zone 2.5,
          previously here) and its tap-to-use tooltip popup are REMOVED
          entirely per explicit instruction: whatever it was, it must not
          render inside the battle screen. Re-identified definitively this
          time — it's the SAME pre-existing BATTLE ITEMS bar flagged
          2026-07-13 (scroll/thunder/gem/mirror/clover), just showing much
          higher counts (11-18) on a real, heavily-played account than my
          own harness's forced count of 1 each — not a different feature.
          Yesterday's fix only addressed the OVERLAP; today's instruction
          is to remove the row outright, since the required child-facing
          flow allows only question/feedback/hint on screen, nothing else
          interactive. This is a real feature-scope cut, not just a bug
          fix: scroll/thunder/gem/mirror/clover become unusable DURING a
          battle (no other in-battle entry point exists) — flagged in
          CHATBOT_NOTES.md/TASKS.md as a judgment call, since it was
          explicitly instructed rather than something I decided
          unilaterally. useBattleCombat.js's useBattleItem/shieldActive/
          xpBoostActive machinery is left fully intact (untouched) in case
          a different UI — e.g. a pre-battle loadout screen — wants to
          surface item use later; only this screen's trigger UI is gone. */}

      {/* ── MOVE PANEL (Zone 3) ──────────────────────────────────────────── */}
      {/* URGENT FIX (2026-07-13) — ROOT CAUSE of the reported "hint text
          overlaps the item-bar icon row": this container used a FIXED
          `height:168` with `justifyContent:'center'` and no overflow
          containment. NumpadInput's own column (display + a hint line +
          digit grid + confirm/backspace) is naturally TALLER than 168px
          once the "💡 ตัวแรกคือ X" hint line appears — flexbox still only
          RESERVES 168px of space for this zone in the column layout, so
          the extra height rendered outside that reserved box, centered,
          spilled symmetrically both up AND down — the "up" half visually
          landed on top of the ITEM BAR (Zone 2.5) row directly above it.
          Fixed by switching height->minHeight (lets the box genuinely grow
          to fit its content instead of overflowing it) and, for the
          flex-row branch (numpad/wordbuild/sequence/memory), center->
          flex-start (so any remaining growth pushes DOWN from a stable top
          edge, never back up into Zone 2.5). */}
      {!victoryMode && (
        <div style={(q?.inputMode === 'numpad' || q?.inputMode === 'wordbuild' || q?.inputMode === 'sequence' || q?.inputMode === 'memory')
          ? { padding:'4px 10px 10px', display:'flex', alignItems:'center', justifyContent:'flex-start', minHeight:168, flexShrink:0 }
          : { padding:'4px 10px 10px', display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:8, minHeight:168, flexShrink:0 }
        }>
          {q?.inputMode === 'numpad' ? (
            <NumpadInput
              resetKey={cur}
              revealDigit={timeoutHintActive ? String(q.correctAnswer)[0] : null}
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
                    // NumpadInput.onSubmit passes a parsed integer, but
                    // questionBank.js's numpad generators always store
                    // correctAnswer as a STRING (`String(n)`) — compare
                    // numerically so "12" (string) correctly matches 12 (number).
                    if (value === Number(q.correctAnswer)) fireHit(-1)
                    else                                    fireMiss(-1)
                  }, 280)
                }, 220)
              }}
            />
          ) : q?.inputMode === 'wordbuild' ? (
            <WordBuildInput
              chars={q.chars}
              resetKey={cur}
              distractorPool={subject === 'eng' ? DEFAULT_ENG_DISTRACTORS : undefined}
              showHint={showWordbuildHint}
              disabled={lockedRef.current || victoryMode || showTeach || battleOverRef.current}
              onSubmit={(isCorrect) => {
                if (lockedRef.current || victoryMode || showTeach || battleOverRef.current) return
                dispatch({ type: ACTIONS.RECORD_INPUT_MODE_RESULT, payload: { mode: 'wordbuild', success: isCorrect } })
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
          ) : q?.inputMode === 'sequence' ? (
            <SequenceInput
              correctOrder={q.sequenceChars}
              resetKey={cur}
              showHint={showSequenceHint}
              disabled={lockedRef.current || victoryMode || showTeach || battleOverRef.current}
              onSubmit={(isCorrect) => {
                if (lockedRef.current || victoryMode || showTeach || battleOverRef.current) return
                dispatch({ type: ACTIONS.RECORD_INPUT_MODE_RESULT, payload: { mode: 'sequence', success: isCorrect } })
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
          ) : q?.inputMode === 'memory' ? (
            <MemoryCardInput
              cards={q.memoryCards}
              pairCount={q.memoryPairCount}
              resetKey={cur}
              disabled={victoryMode || showTeach || battleOverRef.current}
              onPairFound={handleMemoryPairFound}
              onAllPairsFound={() => {}}
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
          {victoryDrop && (
            <div style={{
              display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.1)',
              border:'1px solid #FFD23F', borderRadius:8, padding:'6px 12px',
              animation:'victory-bounce .5s ease',
            }}>
              <span style={{ fontSize:20 }}>{victoryDrop.icon}</span>
              <span style={{ fontSize:12, color:'#FFD700', fontFamily:'var(--font-thai)' }}>✨ ได้ {victoryDrop.nameTh}!</span>
            </div>
          )}
          {showReturnButton && (
            <button
              onClick={onComplete || onNext}
              className="px-btn px-btn-dark"
              aria-label="กลับสำรวจ"
              style={{ marginTop:8, fontFamily:'var(--font-thai)', fontSize:16, touchAction:'manipulation', display:'inline-flex', alignItems:'center', gap:8 }}
            >
              <span style={{ fontSize:22, lineHeight:1 }}>🏃💨</span>
              <span style={{ fontSize:11 }}>กลับ</span>
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
            style={{ marginTop:22, fontFamily:'var(--font-thai)', fontSize:16, touchAction:'manipulation', display:'inline-flex', alignItems:'center', gap:8 }}
          >
            <span style={{ fontSize:22, lineHeight:1 }}>⚔️</span>
            เริ่มต่อสู้!
          </button>
        </div>
      )}
    </div>
  )
}
