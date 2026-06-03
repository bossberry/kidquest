import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AI_OPPONENTS } from '../config/gameConfig.js'
import { drawCreature, getCreatureSeed } from '../lib/creatureAlgorithm.js'
import { useAppState } from '../context/StateContext.jsx'
import { ACTIONS } from '../context/StateContext.jsx'

const ITEM_REWARDS = ['food','food','food','star','ribbon','potion']
const ITEM_EMOJI = { food:'🍗', star:'⭐', ribbon:'🎀', potion:'💧' }

function simulateBattle(player, opponent) {
  let pHP = player.HP
  let oHP = opponent.HP
  const pFirst = player.SPD >= opponent.SPD
  const log = []

  while (pHP > 0 && oHP > 0 && log.length < 80) {
    const first = pFirst ? 'player' : 'opponent'
    const second = pFirst ? 'opponent' : 'player'
    for (const who of [first, second]) {
      if (pHP <= 0 || oHP <= 0) break
      if (who === 'player') {
        const base = Math.max(1, player.ATK - Math.floor(opponent.DEF / 2))
        const crit = Math.random() < (player.CRIT || 0)
        const dmg = crit ? base * 2 : base
        oHP = Math.max(0, oHP - dmg)
        log.push({ by:'player', dmg, crit, pHP, oHP })
      } else {
        const dmg = Math.max(1, opponent.ATK - Math.floor(player.DEF / 2))
        pHP = Math.max(0, pHP - dmg)
        log.push({ by:'opponent', dmg, crit:false, pHP, oHP })
      }
    }
  }
  return { winner: pHP > 0 ? 'player' : 'opponent', log }
}

function HPBar({ current, max, color }) {
  const pct = Math.max(0, Math.round((current / max) * 100))
  return (
    <div style={{ width:'100%', background:'#e0e0e0', borderRadius:20, height:10, overflow:'hidden' }}>
      <div style={{ height:10, borderRadius:20, background:color, width:`${pct}%`, transition:'width .4s ease' }} />
    </div>
  )
}

export default function BattleScreen({ egg, onClose }) {
  const { state, dispatch } = useAppState()
  const [phase, setPhase] = useState('select')
  const [opponent, setOpponent] = useState(null)
  const [opponentType, setOpponentType] = useState(null)
  const [logStep, setLogStep] = useState(-1)
  const [pHP, setPHP] = useState(egg.stats?.HP || 100)
  const [oHP, setOHP] = useState(0)
  const [winner, setWinner] = useState(null)
  const [rewardItem, setRewardItem] = useState(null)
  const battleRef = useRef(null)
  const canvasRef = useRef(null)

  const tier = Math.min(egg.tier || 0, 1) // clamp to available AI tiers
  const tierData = AI_OPPONENTS[tier] || AI_OPPONENTS[0]
  const tierHistory = (state.battleHistory || []).filter(b => b.tier === egg.tier)
  const normalWins = tierHistory.filter(b => b.type === 'normal' && b.result === 'win').length
  const miniBossWins = tierHistory.filter(b => b.type === 'miniBoss' && b.result === 'win').length
  const bossKey = `tier_${egg.tier}_boss`
  const bossDefeated = (state.defeatedBosses || []).includes(bossKey)
  const miniBossUnlocked = normalWins >= 3
  const bossUnlocked = miniBossWins >= 1

  useEffect(() => {
    if (canvasRef.current) drawCreature(canvasRef.current, getCreatureSeed(egg), egg.eggStats || {})
  }, [egg, phase])

  // Battle animation loop
  useEffect(() => {
    if (phase !== 'fighting') return
    const br = battleRef.current
    if (!br) return
    if (logStep >= br.log.length) {
      setTimeout(() => {
        setWinner(br.winner)
        if (br.winner === 'player') {
          const item = ITEM_REWARDS[Math.floor(Math.random() * ITEM_REWARDS.length)]
          setRewardItem(item)
          dispatch({ type: ACTIONS.RECORD_BATTLE, payload: {
            entry: { tier: egg.tier, type: opponentType, opponent: opponent.name, result: 'win', ts: Date.now() },
            bossKey: opponentType === 'boss' ? bossKey : null,
            itemKey: item,
          }})
        } else {
          dispatch({ type: ACTIONS.RECORD_BATTLE, payload: {
            entry: { tier: egg.tier, type: opponentType, opponent: opponent.name, result: 'loss', ts: Date.now() },
            bossKey: null, itemKey: null,
          }})
        }
        setPhase('result')
      }, 600)
      return
    }
    if (logStep < 0) { setLogStep(0); return }
    const entry = br.log[logStep]
    if (entry) { setPHP(entry.pHP); setOHP(entry.oHP) }
    const t = setTimeout(() => setLogStep(i => i + 1), 700)
    return () => clearTimeout(t)
  }, [phase, logStep])

  function startBattle(opp, type) {
    const result = simulateBattle(egg.stats, opp)
    battleRef.current = result
    setOpponent(opp)
    setOpponentType(type)
    setPHP(egg.stats.HP)
    setOHP(opp.HP)
    setLogStep(-1)
    setPhase('fighting')
  }

  function pickNormal() {
    const arr = tierData.normal
    startBattle(arr[Math.floor(Math.random() * arr.length)], 'normal')
  }

  const currentEntry = battleRef.current?.log[logStep - 1]
  const stats = egg.stats || {}
  const creature = egg.creature || {}

  // ── PHASE: select ──
  if (phase === 'select') {
    return createPortal(
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
        <div style={{ background:'var(--bg)',borderRadius:'20px 20px 0 0',padding:'20px 20px 32px',width:'100%',maxWidth:480,fontFamily:'Mitr,sans-serif' }}>
          <div style={{ width:36,height:4,background:'var(--border)',borderRadius:2,margin:'0 auto 16px' }} />
          <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:20,color:'var(--text)',marginBottom:4 }}>⚔️ เลือกคู่ต่อสู้</div>
          <div style={{ fontSize:12,color:'var(--muted)',marginBottom:16 }}>
            {creature.e} {creature.n} · HP:{stats.HP} ATK:{stats.ATK} DEF:{stats.DEF} SPD:{stats.SPD}
          </div>

          {/* Normal */}
          <div style={{ background:'var(--card)',border:'0.5px solid var(--border)',borderRadius:14,padding:14,marginBottom:10,cursor:'pointer' }} onClick={pickNormal}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:600,fontSize:15 }}>🤖 Normal Enemy</div>
                <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>สุ่มจากศัตรูธรรมดา</div>
              </div>
              <div style={{ fontSize:24 }}>▶</div>
            </div>
            <div style={{ fontSize:11,color:'var(--green-d)',marginTop:6 }}>ชนะแล้ว {normalWins} ครั้ง</div>
          </div>

          {/* Mini Boss */}
          <div style={{ background:miniBossUnlocked?'var(--card)':'#f5f5f5',border:'0.5px solid var(--border)',borderRadius:14,padding:14,marginBottom:10,cursor:miniBossUnlocked?'pointer':'default',opacity:miniBossUnlocked?1:.6 }}
               onClick={miniBossUnlocked ? () => startBattle(tierData.miniBoss,'miniBoss') : undefined}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:600,fontSize:15 }}>{miniBossUnlocked?tierData.miniBoss.emoji:'🔒'} Mini Boss: {tierData.miniBoss.name}</div>
                <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>
                  {miniBossUnlocked ? `HP:${tierData.miniBoss.HP} ATK:${tierData.miniBoss.ATK} DEF:${tierData.miniBoss.DEF}` : `🔒 ชนะ Normal ${normalWins}/3 ครั้งเพื่อ unlock`}
                </div>
              </div>
              {miniBossUnlocked && <div style={{ fontSize:24 }}>▶</div>}
            </div>
          </div>

          {/* Boss */}
          <div style={{ background:bossUnlocked&&!bossDefeated?'#fff8e1':bossDefeated?'#f0f0f0':'#f5f5f5',border:'0.5px solid var(--border)',borderRadius:14,padding:14,marginBottom:16,cursor:bossUnlocked&&!bossDefeated?'pointer':'default',opacity:bossUnlocked&&!bossDefeated?1:.6 }}
               onClick={bossUnlocked&&!bossDefeated ? () => startBattle(tierData.boss,'boss') : undefined}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:600,fontSize:15 }}>{bossDefeated?'✅':bossUnlocked?tierData.boss.emoji:'🔒'} Boss: {tierData.boss.name}</div>
                <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>
                  {bossDefeated ? 'ชนะแล้ว!' : bossUnlocked ? `HP:${tierData.boss.HP} ATK:${tierData.boss.ATK}` : `🔒 ชนะ Mini Boss ก่อน`}
                </div>
              </div>
              {bossUnlocked && !bossDefeated && <div style={{ fontSize:24 }}>▶</div>}
            </div>
          </div>

          <button onClick={onClose} style={{ width:'100%',background:'none',border:'1px solid var(--border)',borderRadius:10,padding:11,fontFamily:'Mitr,sans-serif',fontSize:14,color:'var(--muted)',cursor:'pointer' }}>ถอย</button>
        </div>
      </div>,
      document.body
    )
  }

  // ── PHASE: fighting ──
  if (phase === 'fighting' && opponent) {
    const oMax = opponent.HP
    const logMsg = currentEntry
      ? currentEntry.by === 'player'
        ? `${creature.e} ${creature.n} โจมตี! -${currentEntry.dmg} HP${currentEntry.crit?' 💥 CRIT!':''}`
        : `${opponent.emoji} ${opponent.name} โจมตี! -${currentEntry.dmg} HP`
      : 'กำลังต่อสู้...'

    return createPortal(
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
        <div style={{ background:'var(--bg)',borderRadius:20,padding:20,width:'100%',maxWidth:440,fontFamily:'Mitr,sans-serif' }}>
          <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:18,textAlign:'center',marginBottom:16,color:'var(--text)' }}>⚔️ ต่อสู้!</div>

          {/* Combatants */}
          <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-around',marginBottom:16,gap:12 }}>
            {/* Player */}
            <div style={{ flex:1,textAlign:'center' }}>
              <canvas ref={canvasRef} width={80} height={80} style={{ borderRadius:8,background:'var(--card)',display:'block',margin:'0 auto 4px' }} />
              <div style={{ fontSize:11,fontWeight:600 }}>{creature.n || 'สัตว์'}</div>
              <div style={{ fontSize:10,color:'var(--muted)',marginBottom:4 }}>HP {Math.max(0,pHP)}/{stats.HP}</div>
              <HPBar current={Math.max(0,pHP)} max={stats.HP} color={pHP > stats.HP*0.5?'#1D9E75':pHP>stats.HP*0.2?'#EF9F27':'#E24B4A'} />
            </div>
            <div style={{ fontSize:22,fontWeight:900,color:'var(--text)',paddingBottom:20 }}>VS</div>
            {/* Opponent */}
            <div style={{ flex:1,textAlign:'center' }}>
              <div style={{ fontSize:56,lineHeight:1,marginBottom:4 }}>{opponent.emoji}</div>
              <div style={{ fontSize:11,fontWeight:600 }}>{opponent.name}</div>
              <div style={{ fontSize:10,color:'var(--muted)',marginBottom:4 }}>HP {Math.max(0,oHP)}/{oMax}</div>
              <HPBar current={Math.max(0,oHP)} max={oMax} color={oHP > oMax*0.5?'#E24B4A':oHP>oMax*0.2?'#EF9F27':'#aaa'} />
            </div>
          </div>

          {/* Log box */}
          <div style={{ background:'var(--card)',border:'0.5px solid var(--border)',borderRadius:12,padding:'10px 14px',minHeight:40,fontSize:13,color:'var(--text)',textAlign:'center',lineHeight:1.5 }}>
            {logMsg}
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // ── PHASE: result ──
  if (phase === 'result') {
    const won = winner === 'player'
    const adviceMap = {
      ATK: { msg:'ATK ต่ำกว่า → เรียนภาษาไทยเพิ่ม!', emoji:'🇹🇭' },
      DEF: { msg:'DEF ต่ำกว่า → เรียน Math เพิ่ม!', emoji:'🔢' },
      SPD: { msg:'SPD ต่ำกว่า → เรียน English เพิ่ม!', emoji:'🔤' },
    }
    let advice = null
    if (!won && opponent) {
      const gaps = [
        { stat:'ATK', gap: opponent.ATK - stats.ATK },
        { stat:'DEF', gap: opponent.DEF - stats.DEF },
        { stat:'SPD', gap: opponent.SPD - stats.SPD },
      ].filter(g => g.gap > 0).sort((a,b) => b.gap - a.gap)
      if (gaps.length) advice = adviceMap[gaps[0].stat]
    }
    const isBossWin = won && opponentType === 'boss'

    return createPortal(
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
        <div style={{ background:'var(--bg)',borderRadius:20,padding:24,width:'100%',maxWidth:400,fontFamily:'Mitr,sans-serif',textAlign:'center' }}>
          <div style={{ fontSize:60,marginBottom:8 }}>{won?'🎉':'😤'}</div>
          <div style={{ fontFamily:"'Fredoka One',cursive",fontSize:24,color:won?'var(--green-d)':'var(--red)',marginBottom:8 }}>
            {won ? 'ชนะแล้ว!' : 'สู้ต่อไป!'}
          </div>

          {won && rewardItem && (
            <div style={{ background:'var(--purple-l)',border:'0.5px solid var(--purple)',borderRadius:12,padding:14,marginBottom:14 }}>
              <div style={{ fontSize:13,color:'var(--purple-d)',marginBottom:4 }}>รางวัลที่ได้</div>
              <div style={{ fontSize:32 }}>{ITEM_EMOJI[rewardItem]}</div>
              <div style={{ fontSize:12,color:'var(--text)',marginTop:4 }}>{rewardItem} +1</div>
            </div>
          )}

          {isBossWin && opponent?.dialogue && (
            <div style={{ background:'#fff8e1',border:'0.5px solid #EF9F27',borderRadius:12,padding:12,marginBottom:14,fontSize:12,color:'#633806',lineHeight:1.6 }}>
              <div style={{ fontSize:20,marginBottom:4 }}>{opponent.emoji}</div>
              "{opponent.dialogue}"
            </div>
          )}

          {!won && advice && (
            <div style={{ background:'var(--blue-l)',border:'0.5px solid var(--blue-d)',borderRadius:12,padding:12,marginBottom:14 }}>
              <div style={{ fontSize:22,marginBottom:4 }}>{advice.emoji}</div>
              <div style={{ fontSize:13,color:'var(--blue-d)',lineHeight:1.6 }}>{advice.msg}</div>
            </div>
          )}

          {!won && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16 }}>
              {[['ATK',stats.ATK,opponent?.ATK,'🗡️'],['DEF',stats.DEF,opponent?.DEF,'🛡️'],['SPD',stats.SPD,opponent?.SPD,'⚡']].map(([k,p,o,e])=>(
                <div key={k} style={{ background:'var(--card)',borderRadius:10,padding:'8px 4px',fontSize:11 }}>
                  <div>{e} {k}</div>
                  <div style={{ color: p>=o?'var(--green-d)':'var(--red)',fontWeight:700,fontSize:14 }}>{p}</div>
                  <div style={{ color:'var(--muted)' }}>vs {o}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'flex',gap:10 }}>
            <button onClick={() => setPhase('select')} style={{ flex:1,background:'var(--purple)',color:'#fff',border:'none',borderRadius:10,padding:12,fontFamily:'Mitr,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer' }}>
              ⚔️ สู้อีกครั้ง
            </button>
            <button onClick={onClose} style={{ flex:1,background:'none',border:'1px solid var(--border)',borderRadius:10,padding:12,fontFamily:'Mitr,sans-serif',fontSize:14,color:'var(--muted)',cursor:'pointer' }}>
              กลับ
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return null
}
