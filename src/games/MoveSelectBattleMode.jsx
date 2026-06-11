import React, { useState, useEffect, useRef } from 'react'
import { playTone, speakTh, speakEn, playSFX, playElementSFX } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'
import EggCanvas from '../components/EggCanvas.jsx'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'
import { drawEnemy, drawEnemyHurt } from '../lib/drawEnemy.js'
import { mkBeam, mkOrb, mkLightning, mkSparks, tickEffects } from '../lib/particles.js'
import { ELEMENTS, getElementTier } from '../config/elementConfig.js'
import { playElementAttack } from '../lib/elementAnimations.js'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import PixelItemIcon from '../components/PixelItemIcon.jsx'
import { BATTLE_ITEMS, rollBattleItem } from '../config/itemConfig.js'

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

// ─── GB-style HP Bar ──────────────────────────────────────────────────────────

function GBHPBar({ pct, isPlayer }) {
  const color = isPlayer
    ? (pct > 50 ? 'var(--px-green)' : pct > 25 ? 'var(--px-yellow)' : 'var(--px-red)')
    : (pct > 50 ? 'var(--px-red)' : pct > 25 ? 'var(--px-orange)' : '#f66')
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', flexShrink:0, fontFamily:'monospace' }}>HP</span>
      <div className="px-hp-bar-outer" style={{ flex:1 }}>
        <div className="px-hp-bar-inner" style={{ width:`${Math.max(0, pct)}%`, background:color }} />
      </div>
    </div>
  )
}

// ─── Enemy canvas sprite ──────────────────────────────────────────────────────

function EnemyCanvas({ enemyType, size, hitFlash, enemyDefeating, enemyHurt }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (enemyHurt) {
      drawEnemyHurt(canvas.getContext('2d'), enemyType, size)
    } else {
      drawEnemy(canvas.getContext('2d'), enemyType, size)
    }
  }, [enemyType, size, enemyHurt])
  return (
    <canvas
      ref={canvasRef}
      width={size} height={size}
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        filter: hitFlash ? 'brightness(10) saturate(0)' : enemyDefeating ? 'brightness(0.35)' : 'none',
        transform: enemyDefeating ? 'translateY(18px) rotate(-22deg)' : 'none',
        opacity: enemyDefeating ? 0 : 1,
        transition: enemyDefeating ? 'opacity 500ms ease, transform 500ms ease' : 'filter 80ms',
      }}
    />
  )
}

// ─── Move Card (compact) ──────────────────────────────────────────────────────

function MoveCard({ content, isSelected, isMiss, onTap, disabled }) {
  const str = String(content)
  const isEmoji = str.length <= 2
  const fs = isEmoji ? 30 : str.length <= 4 ? 26 : str.length <= 8 ? 18 : 14
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      className={`move-card-btn px-answer-card${isMiss ? ' wrong' : ''}`}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        touchAction: 'manipulation',
        animation: isSelected ? 'move-pulse .22s ease' : undefined,
        opacity: isMiss ? 0.4 : 1,
        userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
      <div style={{
        fontFamily: isEmoji ? 'system-ui,sans-serif' : "'Fredoka One',cursive",
        fontSize: fs, color: '#fff', lineHeight: 1,
      }}>
        {content}
      </div>
    </button>
  )
}

// ─── Math speech helpers ──────────────────────────────────────────────────────

const THAI_NUMS = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า',
  'สิบ','สิบเอ็ด','สิบสอง','สิบสาม','สิบสี่','สิบห้า','สิบหก','สิบเจ็ด','สิบแปด','สิบเก้า','ยี่สิบ']
function numTh(n) { return THAI_NUMS[n] ?? String(n) }
function mathToThai(q) {
  if (!q) return ''
  if (q.isCount) return 'มีกี่อัน'
  if (q.isPattern) return 'อะไรมาต่อ'
  if (q.isWord || q.a === undefined) return ''
  const opTh = q.op === '+' ? 'บวก' : q.op === '-' ? 'ลบ' : ''
  return opTh ? `${numTh(q.a)} ${opTh} ${numTh(q.b)} เท่ากับ เท่าไหร่` : ''
}


// ─── HintBar: dot groups for math arithmetic only ─────────────────────────────

function HintBar({ q, subject }) {
  if (subject !== 'math') return null
  if (!q || q.isCount || q.isPattern || q.isWord || q.a === undefined) return null
  const numA = Math.min(q.a, 10)
  const numB = Math.min(q.b, 10)
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
      <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'center', maxWidth:80 }}>
        {Array.from({ length: numA }, (_, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:'50%', background:'#4488ff', boxShadow:'0 0 4px #4488ff88' }} />
        ))}
      </div>
      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:18, fontWeight:'bold' }}>{q.op}</div>
      <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'center', maxWidth:80 }}>
        {Array.from({ length: numB }, (_, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:'50%', background:'#ff8844', boxShadow:'0 0 4px #ff884488' }} />
        ))}
      </div>
      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:18 }}>= ?</div>
    </div>
  )
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
  creatureStats,
  creatureCurrentHP,
  creatureName,
  onCreatureTakeDamage,
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
  const isFirstQuestionRef = useRef(true)

  // Effect system refs
  const battleFieldRef  = useRef(null)
  const eggDivRef       = useRef(null)
  const enemyDivRef     = useRef(null)
  const effectCanvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const effectsRef      = useRef([])
  const effectRafRef    = useRef(null)
  const rafTimeRef      = useRef(0)

  // Element system
  const [battleElement] = useState(() => {
    const keys = Object.keys(ELEMENTS)
    return keys[Math.floor(Math.random() * keys.length)]
  })
  const [attackLabel, setAttackLabel] = useState(null)

  useEffect(() => () => {
    mountedRef.current = false
    if (typeTimerRef.current) clearInterval(typeTimerRef.current)
    if (effectRafRef.current) cancelAnimationFrame(effectRafRef.current)
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

  // ── Sync effect canvas + overlay canvas size to battle field ────────────────
  useEffect(() => {
    const field   = battleFieldRef.current
    const canvas  = effectCanvasRef.current
    const overlay = overlayCanvasRef.current
    if (!field || !canvas) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        canvas.width  = Math.round(entry.contentRect.width)
        canvas.height = Math.round(entry.contentRect.height)
        if (overlay) {
          overlay.width  = Math.round(entry.contentRect.width)
          overlay.height = Math.round(entry.contentRect.height)
        }
      }
    })
    ro.observe(field)
    return () => ro.disconnect()
  }, [])

  // ── Effects RAF loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = effectCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let alive = true
    function loop(now) {
      if (!alive) return
      const dt = rafTimeRef.current ? Math.min(50, now - rafTimeRef.current) : 16
      rafTimeRef.current = now
      if (effectsRef.current.length > 0) {
        effectsRef.current = tickEffects(ctx, effectsRef.current, dt)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      effectRafRef.current = requestAnimationFrame(loop)
    }
    effectRafRef.current = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(effectRafRef.current) }
  }, [])

  // ── Enemy name announce on mount ────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (!mountedRef.current) return
      speakTh(enemy.name + ' ปรากฏตัว')
    }, 700)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line

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

  // ── TTS on question ─────────────────────────────────────────────────────────
  useEffect(() => {
    // First question: delay until after enemy-name announce (700ms) completes
    const delay = isFirstQuestionRef.current ? 1800 : 500
    isFirstQuestionRef.current = false
    const t = setTimeout(() => {
      if (!mountedRef.current) return
      if (subject === 'thai' && q?.ttsWord) speakTh(q.ttsWord)
      else if (subject === 'eng' && q?.ttsWord) speakEn(q.ttsWord)
      else if (subject === 'math' && q) { const txt = mathToThai(q); if (txt) speakTh(txt) }
    }, delay)
    return () => clearTimeout(t)
  }, [cur, subject]) // eslint-disable-line

  // ── Reset per question ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current) return
    setSelectedCard(-1); setMissCard(-1)
    setEggAnimClass('')
    setEliminated([])
    lockedRef.current = false
    if (cur > 0) setBattleLog('⚔️ เลือกท่าโจมตี!')
  }, [cur])

  // ── Spawn canvas effect ─────────────────────────────────────────────────────
  function spawnEffect(type) {
    const field   = battleFieldRef.current
    const eggEl   = eggDivRef.current
    const enemyEl = enemyDivRef.current
    if (!field || !eggEl || !enemyEl) return
    const fr = field.getBoundingClientRect()
    const er = eggEl.getBoundingClientRect()
    const nr = enemyEl.getBoundingClientRect()
    const ex = er.left + er.width  / 2 - fr.left
    const ey = er.top  + er.height / 2 - fr.top
    const nx = nr.left + nr.width  / 2 - fr.left
    const ny = nr.top  + nr.height / 2 - fr.top

    if (type === 'attack') {
      if (subject === 'thai')      effectsRef.current.push(mkOrb(ex,ey,nx,ny,'#FFD700'))
      else if (subject === 'math') effectsRef.current.push(mkBeam(ex,ey,nx,ny,'#44ff88'))
      else                         effectsRef.current.push(mkLightning(ex,ey,nx,ny,380,13))
    } else if (type === 'combo') {
      effectsRef.current.push(mkLightning(ex,ey,nx,ny,380,7))
      effectsRef.current.push(mkOrb(ex,ey,nx,ny,'#FFD700',400,60))
    } else if (type === 'ultimate') {
      effectsRef.current.push(mkBeam(ex,ey,nx,ny,'#FFD700',300))
      effectsRef.current.push(mkLightning(ex,ey,nx,ny,420,29))
      effectsRef.current.push(mkOrb(ex,ey,nx,ny,'#ff8800',440,80))
    } else if (type === 'miss') {
      effectsRef.current.push(mkSparks(ex,ey))
    } else if (type === 'xp') {
      for (let i = 0; i < 3; i++) effectsRef.current.push(mkOrb(nx,ny,ex,ey,'#FFD700',580,i*140))
    }
  }

  // ── Battle item use ────────────────────────────────────────────────────────
  function useBattleItem(itemKey) {
    if (itemUsed || lockedRef.current || victoryMode || battleOverRef.current) return
    if ((state.items?.[itemKey] || 0) <= 0) return

    dispatch({ type: ACTIONS.USE_ITEM, payload: { key: itemKey } })
    setItemUsed(true)
    playSFX('item_collect')

    const effect = BATTLE_ITEMS[itemKey]?.effect

    if (effect === 'skip') {
      setBattleLog('ม้วนใบ! ข้ามคำถาม')
      lockedRef.current = true
      setTimeout(() => {
        if (!mountedRef.current) return
        // World battles loop infinitely — victory only from enemy HP=0
        if (isWorldBattle) {
          lockedRef.current = false; onNext()
        } else if (cur + 1 >= total) {
          enemyHPRef.current = 0; setEnemyHP(0)
          showVictory()
        } else {
          lockedRef.current = false; onNext()
        }
      }, 500)
    } else if (effect === 'free_attack') {
      const dmg = 15
      const newHP = Math.max(0, enemyHPRef.current - dmg)
      enemyHPRef.current = newHP
      setEnemyHP(newHP)
      setDmgFloat({ val: dmg, isCrit: true, isUlt: false })
      setTimeout(() => mountedRef.current && setDmgFloat(null), 950)
      setHitFlash(true)
      setTimeout(() => mountedRef.current && setHitFlash(false), 300)
      setBattleLog('สายฟ้า! โจมตีอิสระ!')
      spawnEffect('attack')
      if (newHP <= 0) {
        enemyHPRef.current = 0; setEnemyHP(0)
        setTimeout(() => mountedRef.current && showVictory(), 700)
      }
    } else if (effect === 'hint') {
      const wrongIdxs = q.choices
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c !== q.answer)
        .map(({ i }) => i)
      const toElim = wrongIdxs.sort(() => Math.random() - 0.5).slice(0, 2)
      setEliminated(toElim)
      setBattleLog('กระจก! ตัวเลือกผิด 2 ตัว หายไป!')
    } else if (effect === 'block') {
      shieldActiveRef.current = true
      setShieldActive(true)
      setBattleLog('โคลเวอร์! ป้องกันการโจมตีครั้งถัดไป!')
    } else if (effect === 'double_xp') {
      xpBoostActiveRef.current = true
      setXpBoost(true)
      setBattleLog('อัญมณี! XP สองเท่าสำหรับคำตอบถัดไป!')
    }
  }

  // ── Tap handler ────────────────────────────────────────────────────────────
  function handleTap(choiceVal, idx) {
    if (lockedRef.current || victoryMode || showTeach || battleOverRef.current) return
    lockedRef.current = true
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

  function fireHit(_idx) {
    const { earned, isCrit } = onCorrect()
    if (xpBoostActiveRef.current) {
      xpBoostActiveRef.current = false
      if (mountedRef.current) setXpBoost(false)
      dispatch({ type: ACTIONS.ADD_XP, payload: { world: subject, amount: earned } })
    }
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

    // Spawn canvas effect
    if (isUlt)             spawnEffect('ultimate')
    else if (combo >= 3)   spawnEffect('combo')
    else                   spawnEffect('attack')

    // Element attack animation
    const { tier: elTier, tierIndex: elTierIndex } = getElementTier(battleElement, combo)
    playElementSFX(battleElement, elTierIndex)
    setAttackLabel(elTier.name)
    setTimeout(() => { if (mountedRef.current) setAttackLabel(null) }, 900)
    const field   = battleFieldRef.current
    const eggEl   = eggDivRef.current
    const enemyEl = enemyDivRef.current
    if (field && eggEl && enemyEl && overlayCanvasRef.current) {
      const fr = field.getBoundingClientRect()
      const er = eggEl.getBoundingClientRect()
      const nr = enemyEl.getBoundingClientRect()
      playElementAttack(
        overlayCanvasRef.current,
        battleElement,
        elTierIndex,
        { x: er.left + er.width / 2 - fr.left, y: er.top + er.height / 2 - fr.top },
        { x: nr.left + nr.width / 2 - fr.left, y: nr.top + nr.height / 2 - fr.top },
        null,
      )
    }

    const dmg   = isWorldBattle
      ? Math.ceil((creatureStats?.ATK ?? 20) * mult)
      : Math.ceil(dmgBase * mult)
    const newHP = Math.max(0, enemyHPRef.current - dmg)
    enemyHPRef.current = newHP
    if (mountedRef.current) setEnemyHP(newHP)
    if (mountedRef.current) {
      setSelectedCard(-1)
      setHitFlash(true)
      setTimeout(() => mountedRef.current && setHitFlash(false), 300)
      setEnemyHurt(true)
      setTimeout(() => mountedRef.current && setEnemyHurt(false), 400)
      setDmgFloat({ val: dmg, isCrit: mult > 1, isUlt })
      setTimeout(() => mountedRef.current && setDmgFloat(null), 950)
    }
    let log
    if (isUlt) {
      log = '💥 ULTIMATE!! ×2'
      playTone('ultimate'); playSFX('ultra_move')
      if (mountedRef.current) { setCritFlash(true); setTimeout(() => mountedRef.current && setCritFlash(false), 400) }
      spawnConfetti(25)
    } else if (combo >= 4) {
      log = `⚡ CRITICAL! ×1.5  ${combo} Combo`
      playTone('streak')
      if (mountedRef.current) { setCritFlash(true); setTimeout(() => mountedRef.current && setCritFlash(false), 250) }
      spawnConfetti(8)
    } else if (combo === 3) {
      log = '🔥 คอมโบ! 3 ต่อเนื่อง'; playTone('combo'); playSFX('combo')
    } else if (combo === 2) {
      log = '✨ คอมโบ! 2 ต่อเนื่อง'; playTone('combo'); playSFX('combo')
    } else {
      log = `⚔️ โจมตี! +${earned} XP`; playTone('correct'); playSFX('attack_hit')
    }
    if (mountedRef.current) { setBattleLog(log); setComboDisplay(Math.min(combo, 3)) }
    if (!isUlt && !ultimateRef.current && combo >= 3) {
      ultimateRef.current = true
      if (mountedRef.current) {
        setUltimateReady(true)
        setTimeout(() => mountedRef.current && setBattleLog('🌟 ท่าพิเศษพร้อม!'), 1100)
      }
    }
    // Victory from HP=0; in world battle questions loop, no question-count victory
    const isOver = newHP <= 0 || (!isWorldBattle && cur + 1 >= total)
    setTimeout(() => {
      if (!mountedRef.current) return
      if (isOver) {
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
    // Shield absorbs the first miss
    if (shieldActiveRef.current) {
      shieldActiveRef.current = false
      if (mountedRef.current) {
        setShieldActive(false)
        setSelectedCard(-1)
        setMissCard(idx)
        setTimeout(() => mountedRef.current && setMissCard(-1), 550)
        setBattleLog('โล่ป้องกัน! ไม่ได้รับความเสียหาย!')
        setComboDisplay(0)
      }
      playTone('miss')
      setTimeout(() => {
        if (!mountedRef.current) return
        if (!isWorldBattle && cur + 1 >= total) {
          enemyHPRef.current = 0; setEnemyHP(0)
          setTimeout(() => mountedRef.current && showVictory(), 350)
        } else {
          lockedRef.current = false; onNext()
        }
      }, 600)
      return
    }

    // World battle: SPD dodge + creature damage + faint check
    let faintTriggered = false
    let missLog = '💨 โจมตีพลาด!'
    if (isWorldBattle) {
      const spd    = creatureStats?.SPD ?? 40
      const dodged = Math.random() < spd / 200
      if (dodged) {
        missLog = '🌀 หลบได้!'
      } else {
        const rawDmg   = enemy.atk ?? 10
        const def      = creatureStats?.DEF ?? 10
        const finalDmg = Math.max(1, Math.round(rawDmg - def * 0.5))
        missLog = `💥 โดนโจมตี -${finalDmg} HP!`
        onCreatureTakeDamage?.(finalDmg)
        const newCreatureHP = (creatureCurrentHP ?? 0) - finalDmg
        if (newCreatureHP <= 0) {
          faintTriggered = true
          battleOverRef.current = true
          missLog = '😴 ตัวเอกหมดแรง...'
        }
      }
    }

    spawnEffect('miss')
    if (mountedRef.current) {
      setSelectedCard(-1)
      setMissCard(idx)
      setTimeout(() => mountedRef.current && setMissCard(-1), 550)
      setBattleLog(missLog)
      setComboDisplay(0)
      if (!isWorldBattle) setPlayerHP(h => Math.max(8, h - 8))
      setTimeout(() => {
        if (!mountedRef.current) return
        setEnemyLunge(true)
        setTimeout(() => mountedRef.current && setEnemyLunge(false), 300)
      }, 220)
      setTimeout(() => {
        if (!mountedRef.current) return
        setEggHitFlash(true)
        setTimeout(() => mountedRef.current && setEggHitFlash(false), 200)
      }, 300)
    }
    playTone('miss'); playSFX('attack_miss')

    if (faintTriggered) {
      setTimeout(() => { if (mountedRef.current) onFaint?.() }, 1000)
      return
    }
    setTimeout(() => {
      if (!mountedRef.current) return
      if (!isWorldBattle && cur + 1 >= total) {
        enemyHPRef.current = 0; setEnemyHP(0)
        setTimeout(() => mountedRef.current && showVictory(), 350)
      } else {
        lockedRef.current = false; onNext()
      }
    }, 600)
  }

  function showVictory() {
    battleOverRef.current = true
    setEnemyDefeating(true)
    setVictoryMode(true)
    setBattleLog(`${enemy.name} หมดแรง!`)
    playTone('fanfare'); playSFX('victory')
    spawnConfetti(35)
    // 10% chance to drop a battle item on victory
    if (Math.random() < 0.10) {
      const bonus = rollBattleItem()
      if (bonus) {
        dispatch({ type: ACTIONS.DROP_ITEM, payload: { key: bonus } })
        if (mountedRef.current) setVictoryBonus(bonus)
      }
    }
    // XP orbs fly from enemy to egg
    setTimeout(() => {
      if (!mountedRef.current) return
      spawnEffect('xp')
      setBattleLog('✨ ไข่ได้รับ XP!')
      playTone('item')
      if (isWorldBattle && onBattleXP) {
        onBattleXP(10 + (comboRef.current >= 3 ? 5 : 0))
      }
    }, 750)
    // Auto-advance only when no return button shown
    // Use onComplete if provided (handles early-KO finalization); else fall back to onNext
    if (!showReturnButton) {
      setTimeout(() => { if (mountedRef.current) (onComplete || onNext)() }, 2100)
    }
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
  const _displayPlayerHP   = isWorldBattle ? (creatureCurrentHP ?? 0) : playerHP
  const _displayMaxPlayerHP = isWorldBattle ? (creatureStats?.HP || 1) : MAX_PLAYER_HP
  const playerHpPct        = (_displayPlayerHP / _displayMaxPlayerHP) * 100
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
            <span className="px-name-badge" style={{ fontFamily:'var(--font-thai)', fontSize:12 }}>
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
          <GBHPBar pct={hpPct} />
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
          <div className="px-name-badge" style={{ marginBottom:5, fontFamily:'var(--font-thai)', fontSize:11 }}>
            {isWorldBattle ? (creatureName || 'ตัวเอก') : (EGG_STAGE_NAMES?.[eggProgress?.stage ?? 0] || 'ไข่ลึกลับ')}
          </div>
          <GBHPBar pct={playerHpPct} isPlayer />
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
                {eggStats ? (
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
      {/* Always shows the question clearly above the 4 answer cards. */}
      {!victoryMode && q && (
        <div style={{ padding:'10px 14px 4px', textAlign:'center', flexShrink:0 }}>
          {subject === 'math' ? (
            <span style={{
              fontSize:28, fontWeight:'bold', color:'var(--px-yellow)',
              fontFamily:'var(--font-pixel, "Press Start 2P", monospace)',
            }}>
              {q.question ?? (q.a !== undefined && q.op ? `${q.a} ${q.op} ${q.b} = ?` : '')}
            </span>
          ) : subject === 'thai' ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <span style={{
                fontSize:36, fontWeight:'bold', color:'var(--px-yellow)',
                fontFamily:'Sarabun, var(--font-thai), sans-serif',
              }}>
                {q.word}
              </span>
              <button
                onClick={() => q.ttsWord && speakTh(q.ttsWord)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', padding:4, opacity:0.85 }}
              >
                🔊
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <span style={{
                fontSize:36, fontWeight:'bold', color:'var(--px-yellow)',
                fontFamily:'var(--font-pixel, "Press Start 2P", monospace)',
              }}>
                {q.word || q.letter}
              </span>
              <button
                onClick={() => (q.ttsWord || q.word || q.letter) && speakEn(q.ttsWord || q.word || q.letter)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', padding:4, opacity:0.85 }}
              >
                🔊
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ITEM BAR (Zone 2.5) ──────────────────────────────────────────── */}
      {!victoryMode && Object.keys(BATTLE_ITEMS).some(k => (state.items?.[k] || 0) > 0) && (
        <div style={{ display:'flex', gap:6, padding:'0 10px 4px', flexShrink:0, alignItems:'center' }}>
          {Object.keys(BATTLE_ITEMS).map(key => {
            const count = state.items?.[key] || 0
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
        const count = state.items?.[key] || 0
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
        <div style={{
          padding:'4px 10px 10px',
          display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr',
          gap:8, height:168, flexShrink:0,
        }}>
          {q.choices.map((choice, idx) => {
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
          })}
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
