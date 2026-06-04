import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import { useAppState } from '../context/StateContext.jsx'
import { ACTIONS } from '../context/StateContext.jsx'
import { getSoundOn, getACtx } from '../lib/audio.js'

const ITEM_REWARDS = ['food','food','food','star','ribbon','potion']
const ITEM_EMOJI   = { food:'🍗', star:'⭐', ribbon:'🎀', potion:'💧' }
const delay = ms => new Promise(res => setTimeout(res, ms))

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
  const { dispatch } = useAppState()
  const [phase, setPhase]         = useState('fighting')
  const [battleText, setBattleText] = useState('⚔️ เริ่มต่อสู้!')
  const [pHP, setPHP]             = useState(egg.stats.HP)
  const [oHP, setOHP]             = useState(opponent.HP)
  const [shaking, setShaking]     = useState(null)   // 'player' | 'opponent'
  const [flashRed, setFlashRed]   = useState(null)
  const [dmgFloat, setDmgFloat]   = useState(null)   // { key, dmg, side, crit }
  const [winner, setWinner]       = useState(null)
  const [rewardItem, setRewardItem] = useState(null)
  const canvasRef   = useRef(null)
  const activeRef   = useRef(true)
  const battleRef   = useRef(null)

  const stats   = egg.stats
  const creature = egg.creature || {}

  useEffect(() => {
    if (canvasRef.current) drawCreature(canvasRef.current, getCreatureSeed(egg), egg.eggStats || {})
    battleRef.current = simulateBattle(stats, opponent)
    activeRef.current = true
    runAnimation()
    return () => { activeRef.current = false }
  }, []) // eslint-disable-line

  async function runAnimation() {
    const { log, winner: w } = battleRef.current
    const alive = () => activeRef.current

    await delay(800)

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
    ATK: { msg:`ATK คุณ: ${stats.ATK} vs ${opponent.name}: ${opponent.ATK} → เรียนภาษาไทยเพิ่มเพื่อเพิ่ม ATK!`, emoji:'🇹🇭' },
    DEF: { msg:`DEF คุณ: ${stats.DEF} vs ${opponent.name}: ${opponent.DEF} → เรียน Math เพิ่มเพื่อเพิ่ม DEF!`, emoji:'🔢' },
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
