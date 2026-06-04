import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import { useAppState } from '../context/StateContext.jsx'
import { ACTIONS } from '../context/StateContext.jsx'
import { getSoundOn, getACtx, playTone } from '../lib/audio.js'
import { TH_ALPHA, EN_ALPHA } from '../config/gameConfig.js'

const ITEM_REWARDS = ['food','food','food','star','ribbon','potion']
const ITEM_EMOJI   = { food:'🍗', star:'⭐', ribbon:'🎀', potion:'💧' }
const delay = ms => new Promise(res => setTimeout(res, ms))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickBattleQuestion(sessionLog) {
  const recent = (sessionLog || []).slice(-20)
  const counts = { thai: 0, math: 0, eng: 0 }
  for (const s of recent) {
    if (s.world in counts) counts[s.world]++
  }
  // Prefer subject with most recent play — most comfortable = best chance of success
  const subject = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .find(s => counts[s] > 0) || 'math'

  if (subject === 'thai') {
    const items = shuffle([...TH_ALPHA])
    const correct = items[0]
    const wrongs = items.slice(1, 4).map(x => x.char)
    return {
      question: `${correct.emoji} ${correct.word} ขึ้นต้นด้วยตัวไหน?`,
      choices: shuffle([correct.char, ...wrongs]),
      answer: correct.char,
    }
  }

  if (subject === 'eng') {
    const items = shuffle([...EN_ALPHA])
    const correct = items[0]
    const wrongs = items.slice(1, 4).map(x => x.emoji)
    return {
      question: `${correct.letter} is for... ${correct.phonics}`,
      choices: shuffle([correct.emoji, ...wrongs]),
      answer: correct.emoji,
    }
  }

  // Default: simple math (always safe for kindergarten)
  const a = 1 + Math.floor(Math.random() * 4)
  const b = 1 + Math.floor(Math.random() * 4)
  const ans = a + b
  const pool = [ans - 2, ans - 1, ans + 1, ans + 2].filter(n => n > 0 && n !== ans)
  return {
    question: `${a} + ${b} = ?`,
    choices: shuffle([ans, ...shuffle(pool).slice(0, 3)]),
    answer: ans,
  }
}

function playBattleSound(type) {
  if (!getSoundOn()) return
  try {
    const ctx = getACtx()
    const now = ctx.currentTime
    const tone = (freq, t, dur, vol=0.25, wave='square') => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = wave; o.frequency.value = freq
      g.gain.setValueAtTime(vol, now+t)
      g.gain.exponentialRampToValueAtTime(0.001, now+t+dur)
      o.connect(g); g.connect(ctx.destination)
      o.start(now+t); o.stop(now+t+dur)
    }
    if (type==='attack') {
      tone(300, 0,    0.06, 0.18, 'sawtooth')
      tone(500, 0.05, 0.08, 0.14, 'sawtooth')
    }
    if (type==='hit') {
      tone(180, 0,    0.14, 0.30, 'square')
      tone(100, 0.04, 0.12, 0.22, 'square')
      tone(60,  0.08, 0.10, 0.18, 'sawtooth')
    }
    if (type==='crit') {
      tone(440,  0,    0.08, 0.30, 'square')
      tone(660,  0.08, 0.12, 0.30, 'square')
      tone(880,  0.18, 0.16, 0.28, 'square')
      tone(1100, 0.32, 0.22, 0.22, 'sine')
    }
    if (type==='special') {
      // Knowledge power — ascending 5-note fanfare
      tone(523,  0,    0.08, 0.30, 'square')
      tone(659,  0.08, 0.10, 0.30, 'square')
      tone(784,  0.16, 0.12, 0.28, 'square')
      tone(1047, 0.26, 0.16, 0.26, 'sine')
      tone(1319, 0.40, 0.22, 0.24, 'sine')
    }
    if (type==='warning') {
      tone(880, 0,    0.12, 0.22, 'sine')
      tone(880, 0.22, 0.12, 0.22, 'sine')
    }
    if (type==='win') {
      [523,659,784,880,1047,1319].forEach((f,i) => tone(f, i*0.12, 0.34, 0.22, 'sine'))
    }
    if (type==='lose') {
      [400,320,240,160].forEach((f,i) => tone(f, i*0.20, 0.25, 0.15, 'sine'))
    }
  } catch {}
}

function simulateBattle(player, opponent) {
  let pHP = player.HP, oHP = opponent.HP
  const pFirst = player.SPD >= opponent.SPD
  const log = []
  const calcDmg = (atk, def, crit) => {
    const base = Math.max(Math.ceil(atk * 0.3), atk - Math.floor(def / 2))
    const isCrit = Math.random() < (crit || 0)
    return { dmg: isCrit ? base * 2 : base, crit: isCrit }
  }
  while (pHP > 0 && oHP > 0 && log.length < 30) {
    const order = pFirst ? ['player','opponent'] : ['opponent','player']
    for (const who of order) {
      if (pHP <= 0 || oHP <= 0) break
      if (who === 'player') {
        const { dmg, crit } = calcDmg(player.ATK, opponent.DEF, player.CRIT)
        oHP = Math.max(0, oHP - dmg)
        log.push({ by:'player', dmg, crit, pHP, oHP })
      } else {
        const { dmg } = calcDmg(opponent.ATK, player.DEF, 0)
        pHP = Math.max(0, pHP - dmg)
        log.push({ by:'opponent', dmg, crit:false, pHP, oHP })
      }
    }
  }
  return { winner: pHP > 0 ? 'player' : 'opponent', log }
}

function HPBar({ current, max }) {
  const pct = Math.max(0, (current / max) * 100)
  const color = pct > 50 ? '#1D9E75' : pct > 20 ? '#EF9F27' : '#E24B4A'
  return (
    <div style={{ width:'100%', height:8, background:'rgba(0,0,0,.1)', borderRadius:20, overflow:'hidden' }}>
      <div style={{
        height:'100%', borderRadius:20, background:color,
        width:`${pct}%`, transition:'width .5s ease',
        animation: pct <= 20 ? 'hp-blink .6s ease infinite' : 'none',
      }} />
    </div>
  )
}

// Props: egg (hatchedEgg with .stats), opponent ({name,emoji,HP,ATK,DEF,SPD}), opponentType, onClose
export default function BattleScreen({ egg, opponent, opponentType, onClose }) {
  const { state, dispatch } = useAppState()
  const [phase, setPhase]           = useState('question')
  const [battleText, setBattleText] = useState('⚔️ เริ่มต่อสู้!')
  const [pHP, setPHP]               = useState(egg.stats.HP)
  const [oHP, setOHP]               = useState(opponent.HP)
  const [shaking, setShaking]       = useState(null)   // 'player' | 'opponent'
  const [flashRed, setFlashRed]     = useState(null)
  const [dmgFloat, setDmgFloat]     = useState(null)   // { key, dmg, side, crit }
  const [winner, setWinner]         = useState(null)
  const [rewardItem, setRewardItem] = useState(null)
  const [questionFeedback, setQuestionFeedback] = useState(null) // null | 'correct' | 'wrong'
  const canvasRef    = useRef(null)
  const activeRef    = useRef(true)
  const battleRef    = useRef(null)
  const specialDmgRef = useRef(0)

  // Pick question once from existing content, guided by sessionLog readiness
  const [questionData] = useState(() => pickBattleQuestion(state.sessionLog))

  const stats   = egg.stats
  const creature = egg.creature || {}

  // Start battle when phase transitions to 'fighting'
  useEffect(() => {
    if (phase !== 'fighting') return
    activeRef.current = true
    // Draw creature now that canvas is in the DOM
    if (canvasRef.current) drawCreature(canvasRef.current, getCreatureSeed(egg), egg.eggStats || {})
    const bonusDmg = specialDmgRef.current
    // Re-simulate with reduced enemy HP so win condition is correct
    const effectiveOpponent = bonusDmg > 0
      ? { ...opponent, HP: Math.max(1, opponent.HP - bonusDmg) }
      : opponent
    battleRef.current = simulateBattle(stats, effectiveOpponent)
    runAnimation(bonusDmg)
    return () => { activeRef.current = false }
  }, [phase]) // eslint-disable-line

  function handleAnswer(choice) {
    const correct = choice === questionData.answer
    if (correct) {
      specialDmgRef.current = Math.ceil(opponent.HP * 0.25)
      setQuestionFeedback('correct')
      setTimeout(() => setPhase('fighting'), 900)
    } else {
      // No penalty — battle continues normally
      setQuestionFeedback('wrong')
      setTimeout(() => setPhase('fighting'), 700)
    }
  }

  async function runAnimation(bonusDmg) {
    const { log, winner: w } = battleRef.current
    const alive = () => activeRef.current

    await delay(800)

    // Special move animation — plays before normal battle turns
    if (bonusDmg > 0) {
      const atkEmoji = creature.e || '🐉'
      setBattleText(`⚡ ${atkEmoji} ปล่อยท่าพิเศษ!`)
      playBattleSound('special')
      await delay(900); if (!alive()) return

      setShaking('opponent'); setFlashRed('opponent')
      playBattleSound('hit')
      await delay(200); if (!alive()) return; setFlashRed(null)
      await delay(150); if (!alive()) return; setFlashRed('opponent')
      await delay(150); if (!alive()) return; setFlashRed(null); setShaking(null)

      // Drop displayed oHP to match the simulation's starting point
      setOHP(opponent.HP - bonusDmg)
      setDmgFloat({ key: Date.now(), dmg: bonusDmg, side: 'opponent', crit: true })
      setBattleText(`💥 ท่าพิเศษ! -${bonusDmg} HP!`)
      await delay(700); if (!alive()) return; setDmgFloat(null)
    }

    for (const entry of log) {
      if (!alive()) return
      const isPlayer = entry.by === 'player'
      const atkEmoji = isPlayer ? (creature.e || '🐉') : opponent.emoji
      const atkName  = isPlayer ? (creature.n || 'สัตว์') : opponent.name
      const defSide  = isPlayer ? 'opponent' : 'player'

      setBattleText(`${atkEmoji} ${atkName} โจมตี!`)
      playBattleSound('attack')
      await delay(900)
      if (!alive()) return

      // Flash + shake
      setShaking(defSide); setFlashRed(defSide)
      playBattleSound('hit')
      await delay(200); if (!alive()) return; setFlashRed(null)
      await delay(150); if (!alive()) return; setFlashRed(defSide)
      await delay(150); if (!alive()) return; setFlashRed(null); setShaking(null)

      // Update HP + float damage
      if (isPlayer) setOHP(entry.oHP); else setPHP(entry.pHP)
      setDmgFloat({ key: Date.now(), dmg: entry.dmg, side: defSide, crit: entry.crit })
      if (entry.crit) { playBattleSound('crit'); setBattleText(`💥 Critical Hit! -${entry.dmg} HP!`) }
      else              setBattleText(`-${entry.dmg} HP`)
      await delay(700); if (!alive()) return; setDmgFloat(null)

      // Low HP warning
      const hpNow = isPlayer ? entry.oHP : entry.pHP
      const hpMax = isPlayer ? opponent.HP : stats.HP
      if (hpNow > 0 && hpNow < hpMax * 0.2) {
        playBattleSound('warning')
        setBattleText(`⚠️ ${isPlayer ? opponent.name : creature.n} HP เหลือน้อยมาก!`)
        await delay(800); if (!alive()) return
      }
    }

    await delay(600); if (!alive()) return

    const won = w === 'player'
    playBattleSound(won ? 'win' : 'lose')
    setBattleText(won ? '🎉 ชนะแล้ว!' : '😤 แพ้แล้ว...')

    if (won) {
      const item = ITEM_REWARDS[Math.floor(Math.random() * ITEM_REWARDS.length)]
      setRewardItem(item)
      setTimeout(() => playTone('item'), 950)
      dispatch({ type: ACTIONS.RECORD_BATTLE, payload: {
        entry: { tier: egg.tier, type: opponentType, opponent: opponent.name, result:'win', ts: Date.now() },
        bossKey: opponentType === 'boss' ? `tier_${egg.tier}_boss` : null,
        itemKey: item,
      }})
    } else {
      dispatch({ type: ACTIONS.RECORD_BATTLE, payload: {
        entry: { tier: egg.tier, type: opponentType, opponent: opponent.name, result:'loss', ts: Date.now() },
        bossKey: null, itemKey: null,
      }})
    }
    dispatch({ type: ACTIONS.CLEAR_CHALLENGER })

    await delay(900); if (!alive()) return
    setWinner(w); setPhase('result')
  }

  // ── QUESTION PHASE ──
  if (phase === 'question') {
    // Brief feedback overlay after answering
    if (questionFeedback) {
      return createPortal(
        <div style={{ position:'fixed', inset:0, background:'#1a1040', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Mitr,sans-serif' }}>
          <div style={{ fontSize:64 }}>{questionFeedback === 'correct' ? '🔥' : '💪'}</div>
          <div style={{ fontSize:20, fontWeight:700, marginTop:12, textAlign:'center', color: questionFeedback === 'correct' ? '#FFD700' : '#fff' }}>
            {questionFeedback === 'correct' ? 'ท่าพิเศษพร้อมแล้ว!' : 'สู้ต่อไปนะ!'}
          </div>
        </div>,
        document.body
      )
    }

    return createPortal(
      <div style={{ position:'fixed', inset:0, background:'#1a1040', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Mitr,sans-serif' }}>
        <div style={{ fontSize:36, marginBottom:6 }}>⚡</div>
        <div style={{ fontSize:16, fontWeight:700, color:'#FFD700', marginBottom:4, textAlign:'center' }}>
          ตอบถูก ปล่อยท่าพิเศษ!
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginBottom:24, textAlign:'center' }}>
          ใช้พลังความรู้โจมตีพิเศษ!
        </div>

        <div style={{ background:'rgba(255,255,255,.12)', borderRadius:16, padding:'18px 20px', width:'100%', maxWidth:340, marginBottom:20, textAlign:'center' }}>
          <div style={{ fontSize:15, color:'#fff', lineHeight:1.9 }}>{questionData.question}</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:340, marginBottom:20 }}>
          {questionData.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(choice)}
              style={{
                background:'rgba(255,255,255,.15)', color:'#fff',
                border:'2px solid rgba(255,255,255,.25)',
                borderRadius:12, padding:'14px 8px', fontSize:20,
                fontFamily:'Mitr,sans-serif', cursor:'pointer',
                fontWeight:700, touchAction:'manipulation',
              }}
            >
              {choice}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setQuestionFeedback('wrong'); setTimeout(() => setPhase('fighting'), 700) }}
          style={{ background:'transparent', color:'rgba(255,255,255,.4)', border:'none', fontSize:12, cursor:'pointer', fontFamily:'Mitr,sans-serif', padding:'8px 16px' }}
        >
          ข้ามไปก่อน
        </button>
      </div>,
      document.body
    )
  }

  // ── FIGHTING PHASE ──
  if (phase === 'fighting') {
    return createPortal(
      <div style={{ position:'fixed', inset:0, background:'#1a1040', zIndex:9999, display:'flex', flexDirection:'column', fontFamily:'Mitr,sans-serif', maxWidth:480, margin:'0 auto' }}>
        {/* Opponent card (top-right) */}
        <div style={{ padding:'18px 20px 0', display:'flex', justifyContent:'flex-end' }}>
          <div style={{ background:'rgba(255,255,255,.12)', borderRadius:14, padding:'10px 16px', minWidth:180 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>{opponent.emoji} {opponent.name}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.7)', marginBottom:4 }}>HP {Math.max(0,oHP)}/{opponent.HP}</div>
            <HPBar current={Math.max(0,oHP)} max={opponent.HP} />
          </div>
        </div>

        {/* Battlefield */}
        <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 24px' }}>
          {/* Player creature (left) */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', animation: shaking==='player' ? 'battle-shake .4s ease' : 'none', filter: flashRed==='player' ? 'brightness(2) sepia(1) saturate(5) hue-rotate(-20deg)' : 'none' }}>
            <canvas ref={canvasRef} width={90} height={90} style={{ borderRadius:10, background:'rgba(255,255,255,.08)' }} />
          </div>

          {/* Opponent (right) */}
          <div style={{ fontSize:72, lineHeight:1, animation: shaking==='opponent' ? 'battle-shake .4s ease' : 'none', filter: flashRed==='opponent' ? 'brightness(2) sepia(1) saturate(5) hue-rotate(-20deg)' : 'none' }}>
            {opponent.emoji}
          </div>

          {/* Damage float */}
          {dmgFloat && (
            <div key={dmgFloat.key} style={{
              position:'absolute',
              top: dmgFloat.side === 'opponent' ? '15%' : '55%',
              left: dmgFloat.side === 'opponent' ? '55%' : '10%',
              fontSize: dmgFloat.crit ? 28 : 20, fontWeight:900,
              color: dmgFloat.crit ? '#FFD700' : '#ff6b6b',
              animation:'dmg-float 1s ease-out forwards',
              pointerEvents:'none', textShadow:'0 2px 4px rgba(0,0,0,.5)',
            }}>
              -{dmgFloat.dmg}{dmgFloat.crit ? '💥' : ''}
            </div>
          )}
        </div>

        {/* Player card (bottom-left) */}
        <div style={{ padding:'0 20px 8px', display:'flex', justifyContent:'flex-start' }}>
          <div style={{ background:'rgba(255,255,255,.12)', borderRadius:14, padding:'10px 16px', minWidth:180 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>{creature.e || '🐣'} {creature.n || 'สัตว์'}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.7)', marginBottom:4 }}>HP {Math.max(0,pHP)}/{stats.HP}</div>
            <HPBar current={Math.max(0,pHP)} max={stats.HP} />
          </div>
        </div>

        {/* Text box */}
        <div style={{ margin:'0 16px 20px', background:'rgba(255,255,255,.95)', borderRadius:14, padding:'14px 18px', minHeight:52, border:'3px solid #fff' }}>
          <div style={{ fontSize:14, color:'#1a1a1a', lineHeight:1.6 }}>▷ {battleText}</div>
        </div>
      </div>,
      document.body
    )
  }

  // ── RESULT PHASE ──
  const won = winner === 'player'
  const adviceMap = {
    ATK: { msg:`ATK คุณ: ${stats.ATK} vs ${opponent.name}: ${opponent.ATK} → เรียน Math เพิ่มเพื่อเพิ่ม ATK!`, emoji:'🔢' },
    DEF: { msg:`DEF คุณ: ${stats.DEF} vs ${opponent.name}: ${opponent.DEF} → เรียนภาษาไทยเพิ่มเพื่อเพิ่ม DEF!`, emoji:'🇹🇭' },
    SPD: { msg:`SPD คุณ: ${stats.SPD} vs ${opponent.name}: ${opponent.SPD} → เรียน English เพิ่มเพื่อเพิ่ม SPD!`, emoji:'🔤' },
  }
  let advice = null
  if (!won) {
    const worst = [
      { stat:'ATK', gap: opponent.ATK - stats.ATK },
      { stat:'DEF', gap: opponent.DEF - stats.DEF },
      { stat:'SPD', gap: opponent.SPD - stats.SPD },
    ].filter(g => g.gap > 0).sort((a,b)=>b.gap-a.gap)[0]
    if (worst) advice = adviceMap[worst.stat]
  }

  return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg)', borderRadius:20, padding:24, width:'100%', maxWidth:400, fontFamily:'Mitr,sans-serif', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:8 }}>{won ? '🎉' : '😤'}</div>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:24, color: won?'var(--green-d)':'var(--red)', marginBottom:16 }}>
          {won ? 'ชนะแล้ว!' : 'สู้ต่อไปนะ!'}
        </div>

        {won && rewardItem && (
          <div style={{ background:'var(--purple-l)', border:'0.5px solid var(--purple)', borderRadius:14, padding:14, marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>รางวัล</div>
            <div style={{ fontSize:36 }}>{ITEM_EMOJI[rewardItem]}</div>
            <div style={{ fontSize:13, marginTop:4 }}>ได้รับ {rewardItem} +1</div>
          </div>
        )}

        {won && opponentType === 'boss' && opponent.dialogue && (
          <div style={{ background:'#fff8e1', border:'0.5px solid var(--amber)', borderRadius:12, padding:12, marginBottom:14, fontSize:12, color:'var(--amber-d)', lineHeight:1.6 }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{opponent.emoji}</div>
            "{opponent.dialogue}"
          </div>
        )}

        {!won && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
            {[['⚔️ ATK',stats.ATK,opponent.ATK],['🛡️ DEF',stats.DEF,opponent.DEF],['⚡ SPD',stats.SPD,opponent.SPD]].map(([k,p,o])=>(
              <div key={k} style={{ background:'var(--card)', borderRadius:10, padding:'8px 4px', fontSize:11, border:'0.5px solid var(--border)' }}>
                <div style={{ color:'var(--muted)' }}>{k}</div>
                <div style={{ fontWeight:700, fontSize:15, color: p>=o?'var(--green-d)':'var(--red)' }}>{p}</div>
                <div style={{ fontSize:10, color:'var(--muted)' }}>vs {o}</div>
              </div>
            ))}
          </div>
        )}

        {!won && advice && (
          <div style={{ background:'var(--blue-l)', border:'0.5px solid var(--blue)', borderRadius:12, padding:12, marginBottom:16, fontSize:12, color:'var(--blue-d)', lineHeight:1.6 }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{advice.emoji}</div>
            {advice.msg}
          </div>
        )}

        <button onClick={onClose} style={{ width:'100%', background: won?'var(--green)':'var(--purple)', color:'#fff', border:'none', borderRadius:12, padding:13, fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          {won ? 'เก็บของ ✨' : 'กลับไปเรียน 📚'}
        </button>
      </div>
    </div>,
    document.body
  )
}
