import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import LevelSelector from './LevelSelector.jsx'
import TeachOverlay from './TeachOverlay.jsx'
import { EN_ALPHA, CVC_WORDS, SIGHT_DATA, ENG_SENTS, shuffle } from '../config/gameConfig.js'
import { playTone, speakEn, playPhonicsSound } from '../lib/audio.js'
import { showToast, showItemToast, spawnConfetti } from '../components/Toasts.jsx'

export default function GamePhonics() {
  const [view, setView] = useState('levels')
  const [activeLv, setActiveLv] = useState(null)
  const { state } = useAppState()

  const handleSelect = (lv) => {
    setActiveLv(lv)
    const key = `eng-${lv.id}`
    setView((state.seenTeach||[]).includes(key)?'play':'teach')
  }

  if (view === 'levels') return <LevelSelector world="eng" onSelect={handleSelect} />
  if (view === 'teach') return <TeachOverlay world="eng" levelId={activeLv?.id} onDone={() => setView('play')} />
  if (activeLv?.type === 'phonics') return <PhonicsGame lv={activeLv} onBack={() => setView('levels')} />
  if (activeLv?.type === 'cvc') return <CVCGame lv={activeLv} onBack={() => setView('levels')} />
  if (activeLv?.type === 'sight') return <SightGame lv={activeLv} onBack={() => setView('levels')} />
  return <SentenceGame lv={activeLv} onBack={() => setView('levels')} />
}

function GameHeader({ cur, total, xp, streak }) {
  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',padding:'0 20px 6px',fontSize:12,color:'var(--muted)'}}>
        <span>{cur}/{total}</span>
        <span>{streak>=3?`${streak}🔥`:streak>0?`streak ${streak}`:''}</span>
        <span>+{xp} XP</span>
      </div>
      <div style={{padding:'0 20px 8px'}}>
        <div style={{height:6,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
          <div style={{height:6,background:'var(--blue)',borderRadius:4,width:`${(cur/total)*100}%`,transition:'width .4s'}}/>
        </div>
      </div>
    </>
  )
}

function ResultScreen({ score, total, xp, streak, coins, onReplay, onBack }) {
  const p = score / total
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:24,textAlign:'center',width:'100%',maxWidth:480}}>
      <div style={{fontSize:64,marginBottom:10}}>{p>=.9?'🏆':p>=.7?'🎉':'😊'}</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:'var(--blue-d)',marginBottom:8}}>{p>=.9?'Phonics Star!':'Great Job!'}</div>
      <div style={{fontSize:14,color:'var(--muted)',marginBottom:coins>0?8:16}}>{score}/{total} · +{xp} XP</div>
      {coins > 0 && <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(255,210,63,0.12)',border:'1px solid rgba(255,210,63,0.35)',borderRadius:20,padding:'4px 14px',marginBottom:16,fontFamily:'var(--font-pixel)',fontSize:11,color:'#FFD23F'}}>🪙 +{coins}</div>}
      <button onClick={onReplay} style={{width:'100%',background:'var(--blue)',color:'#fff',border:'none',borderRadius:10,padding:14,fontFamily:'Mitr,sans-serif',fontSize:16,fontWeight:600,cursor:'pointer',marginBottom:8}}>🔄 Play Again</button>
      <button onClick={onBack} style={{width:'100%',background:'var(--purple-l)',color:'var(--purple-d)',border:'none',borderRadius:10,padding:13,fontFamily:'Mitr,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>← Levels</button>
    </div>
  )
}

function PhonicsGame({ lv, onBack }) {
  const { state, dispatch } = useAppState()
  const [qs] = useState(() => shuffle([...EN_ALPHA]).slice(0,10))
  const [cur, setCur] = useState(0)
  const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const [xp, setXp] = useState(0)
  const [answered, setAnswered] = useState(false); const [feedback, setFeedback] = useState(null); const [done, setDone] = useState(false); const [coinsEarned, setCoinsEarned] = useState(0)
  const sessionStart = useRef(Date.now())
  const q = qs[cur]
  const wrong = shuffle(EN_ALPHA.filter(a=>a.letter!==q?.letter)).slice(0,3)
  const choices = React.useMemo(() => q ? shuffle([q,...wrong]) : [], [cur]) // eslint-disable-line
  useEffect(() => { if(q) setTimeout(()=>playPhonicsSound(q,true),300) },[cur]) // eslint-disable-line

  const check = (c) => {
    if(answered||!q)return; setAnswered(true)
    const ok=c.letter===q.letter
    if(ok){const ns=streak+1;setStreak(ns);const earned=10+(ns>=3?5:0);setXp(x=>x+earned);setScore(s=>s+1);dispatch({type:ACTIONS.ADD_XP,payload:{world:'eng',amount:earned,accDelta:100}});if(ns>=3){playTone('streak');spawnConfetti(5)}else playTone('correct');setFeedback({type:'win',msg:['Great! 🎉','Correct! ✅','Awesome! 🌟'][Math.floor(Math.random()*3)]+` +${earned} XP`});setTimeout(()=>speakEn(q.letter+' for '+q.word,.8),300)}
    else{setStreak(0);playTone('wrong');setFeedback({type:'lose',msg:`It's "${q.letter}" for ${q.emoji} ${q.word}`});setTimeout(()=>playPhonicsSound(q,()=>speakEn(q.letter+' for '+q.word,.78)),300)}
  }
  const next=()=>{playTone('next');if(cur+1>=10){setDone(true);const p=score/10;const _c1=Math.max(2,Math.min(12,Math.round(12*(p<0.5?0.3:p)*(1-(state.levelMastery?.eng?.[1]||0)))));setCoinsEarned(_c1);dispatch({type:ACTIONS.ADD_COINS,payload:{amount:_c1}});showItemToast(`🪙 +${_c1}`);dispatch({type:ACTIONS.ROUND_COMPLETE,payload:{streak,score:p}});dispatch({type:ACTIONS.UPDATE_LEVEL_MASTERY,payload:{world:'eng',levelId:1,value:p*0.4+((state.levelMastery?.eng?.[1])||0)*0.6}});if(p>=0.8){const cur2=state.subjectLevels?.eng||1;if(cur2<4){dispatch({type:ACTIONS.UNLOCK_LEVEL,payload:{world:'eng',newLevel:cur2+1}});dispatch({type:ACTIONS.ADD_COINS,payload:{amount:15,bonusKey:`eng_${cur2+1}`}});showToast(`✨ Level ${cur2+1} Unlocked!`);spawnConfetti(15);playTone('unlock')}}if(p>=0.9){playTone('fanfare');spawnConfetti(30)}else if(p>=0.8){playTone('complete')}dispatch({type:ACTIONS.LOG_SESSION,payload:{ts:sessionStart.current,world:'eng',missionId:null,level:1,dur:Date.now()-sessionStart.current,score:p,wrong:10-score,hints:0,completed:p>=0.8,nextAction:null,phaseStats:null}})}else{setAnswered(false);setFeedback(null);setCur(c=>c+1)}}

  if(done)return<ResultScreen score={score} total={10} xp={xp} streak={streak} coins={coinsEarned} onReplay={()=>{sessionStart.current=Date.now();setCur(0);setScore(0);setStreak(0);setXp(0);setDone(false);setAnswered(false);setFeedback(null);setCoinsEarned(0)}} onBack={onBack}/>
  if(!q)return null
  return(
    <div style={{width:'100%',maxWidth:480,padding:'8px 0'}}>
      <GameHeader cur={cur} total={10} xp={xp} streak={streak}/>
      <div style={{background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:16,margin:'0 20px',padding:'18px 16px'}}>
        <div style={{fontSize:12,color:'var(--muted)',textAlign:'center',marginBottom:6}}>What starts with this letter?</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:90,color:'var(--blue-d)',textAlign:'center',cursor:'pointer',lineHeight:1,marginBottom:4}} onClick={()=>playPhonicsSound(q,true)}>{q.letter}</div>
        <div style={{textAlign:'center',fontSize:14,color:'var(--muted)',marginBottom:16}}>{q.phonics}</div>
        <div className="choices">
          {choices.map((c,i)=><button key={i} className={`choice-btn${answered&&c.letter===q.letter?' correct':''}`} onClick={()=>check(c)}><span style={{fontSize:20}}>{c.emoji}</span><br/><span style={{fontSize:14,fontWeight:500}}>{c.word}</span></button>)}
        </div>
        {feedback&&<div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {answered&&<button className="next-btn show" style={{background:'var(--blue)',color:'#fff'}} onClick={next}>Next →</button>}
      </div>
    </div>
  )
}

function CVCGame({ lv, onBack }) {
  const { state, dispatch } = useAppState()
  const [qs] = useState(() => shuffle([...CVC_WORDS]).slice(0,10))
  const [cur, setCur] = useState(0); const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const [xp, setXp] = useState(0); const [answered, setAnswered] = useState(false); const [feedback, setFeedback] = useState(null); const [done, setDone] = useState(false); const [coinsEarned, setCoinsEarned] = useState(0)
  const sessionStart = useRef(Date.now())
  const q = qs[cur]
  const choices = React.useMemo(() => q ? shuffle([q.word,...q.alts]) : [], [cur]) // eslint-disable-line
  useEffect(() => { if(q) setTimeout(()=>speakEn(q.word,.8),300) },[cur]) // eslint-disable-line
  const check=(w)=>{if(answered||!q)return;setAnswered(true);const ok=w===q.word;if(ok){const ns=streak+1;setStreak(ns);const earned=Math.max(2,Math.round(10*1.5*(1-((state.levelMastery?.eng?.[2])||0))));setXp(x=>x+earned);setScore(s=>s+1);dispatch({type:ACTIONS.ADD_XP,payload:{world:'eng',amount:earned,accDelta:100}});if(ns>=3){playTone('streak');spawnConfetti(5)}else playTone('correct');setFeedback({type:'win',msg:['Great! 🎉','Correct! ✅','Perfect! 🌟'][Math.floor(Math.random()*3)]+` +${earned} XP`});setTimeout(()=>speakEn(q.word),300)}else{setStreak(0);playTone('wrong');setFeedback({type:'lose',msg:`It's "${q.word}" ${q.emoji}`});setTimeout(()=>speakEn(q.word),300)}}
  const next=()=>{playTone('next');if(cur+1>=10){setDone(true);const p=score/10;const _c2=Math.max(2,Math.min(12,Math.round(12*(p<0.5?0.3:p)*(1-(state.levelMastery?.eng?.[2]||0)))));setCoinsEarned(_c2);dispatch({type:ACTIONS.ADD_COINS,payload:{amount:_c2}});showItemToast(`🪙 +${_c2}`);dispatch({type:ACTIONS.ROUND_COMPLETE,payload:{streak,score:p}});dispatch({type:ACTIONS.UPDATE_LEVEL_MASTERY,payload:{world:'eng',levelId:2,value:p*0.4+((state.levelMastery?.eng?.[2])||0)*0.6}});if(p>=0.8){const c2=state.subjectLevels?.eng||1;if(c2<4){dispatch({type:ACTIONS.UNLOCK_LEVEL,payload:{world:'eng',newLevel:c2+1}});dispatch({type:ACTIONS.ADD_COINS,payload:{amount:15,bonusKey:`eng_${c2+1}`}});showToast(`✨ Level ${c2+1} Unlocked!`);spawnConfetti(15)}}if(p>=0.9){playTone('fanfare');spawnConfetti(30)}dispatch({type:ACTIONS.LOG_SESSION,payload:{ts:sessionStart.current,world:'eng',missionId:null,level:2,dur:Date.now()-sessionStart.current,score:p,wrong:10-score,hints:0,completed:p>=0.8,nextAction:null,phaseStats:null}})}else{setAnswered(false);setFeedback(null);setCur(c=>c+1)}}
  if(done)return<ResultScreen score={score} total={10} xp={xp} streak={streak} coins={coinsEarned} onReplay={()=>{sessionStart.current=Date.now();setCur(0);setScore(0);setStreak(0);setXp(0);setDone(false);setAnswered(false);setFeedback(null);setCoinsEarned(0)}} onBack={onBack}/>
  if(!q)return null
  return(
    <div style={{width:'100%',maxWidth:480,padding:'8px 0'}}>
      <GameHeader cur={cur} total={10} xp={xp} streak={streak}/>
      <div style={{background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:16,margin:'0 20px',padding:'18px 16px'}}>
        <div style={{fontSize:12,color:'var(--muted)',textAlign:'center',marginBottom:6}}>Hear the word → pick the spelling</div>
        <div style={{fontSize:64,textAlign:'center',cursor:'pointer',marginBottom:4,lineHeight:1.2}} onClick={()=>speakEn(q.word,.8)}>{q.emoji}</div>
        <div style={{fontSize:12,color:'var(--muted)',textAlign:'center',marginBottom:14}}>แตะเพื่อฟัง 🔊</div>
        <div className="choices">
          {choices.map((w,i)=><button key={i} className={`choice-btn${answered&&w===q.word?' correct':''}`} style={{fontSize:20,fontFamily:"'Fredoka One',cursive"}} onClick={()=>check(w)}>{w}</button>)}
        </div>
        {feedback&&<div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {answered&&<button className="next-btn show" style={{background:'var(--blue)',color:'#fff'}} onClick={next}>Next →</button>}
      </div>
    </div>
  )
}

function SightGame({ lv, onBack }) {
  const { state, dispatch } = useAppState()
  const [qs] = useState(() => shuffle([...SIGHT_DATA]).slice(0,8))
  const [cur, setCur] = useState(0); const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const [xp, setXp] = useState(0); const [answered, setAnswered] = useState(false); const [feedback, setFeedback] = useState(null); const [done, setDone] = useState(false); const [coinsEarned, setCoinsEarned] = useState(0)
  const sessionStart = useRef(Date.now())
  const q = qs[cur]
  const choices = React.useMemo(() => q ? shuffle([...q.choices]) : [], [cur]) // eslint-disable-line
  useEffect(() => { if(q) setTimeout(()=>speakEn(q.sentence.replace('___','blank'),.8),300) },[cur]) // eslint-disable-line
  const check=(w)=>{if(answered||!q)return;setAnswered(true);const ok=w===q.blank;if(ok){const ns=streak+1;setStreak(ns);const earned=Math.max(2,Math.round(10*2));setXp(x=>x+earned);setScore(s=>s+1);dispatch({type:ACTIONS.ADD_XP,payload:{world:'eng',amount:earned,accDelta:100}});playTone('correct');setFeedback({type:'win',msg:q.sentence.replace('___',q.blank)+` +${earned} XP`});setTimeout(()=>speakEn(q.sentence.replace('___',q.blank),.85),300)}else{setStreak(0);playTone('wrong');setFeedback({type:'lose',msg:`"${q.blank}" is correct!`})}}
  const next=()=>{playTone('next');if(cur+1>=qs.length){setDone(true);const p=score/qs.length;const _c3=Math.max(2,Math.min(12,Math.round(12*(p<0.5?0.3:p)*(1-(state.levelMastery?.eng?.[3]||0)))));setCoinsEarned(_c3);dispatch({type:ACTIONS.ADD_COINS,payload:{amount:_c3}});showItemToast(`🪙 +${_c3}`);dispatch({type:ACTIONS.ROUND_COMPLETE,payload:{streak,score:p}});dispatch({type:ACTIONS.UPDATE_LEVEL_MASTERY,payload:{world:'eng',levelId:3,value:p*0.4+((state.levelMastery?.eng?.[3])||0)*0.6}});if(p>=0.8){const c2=state.subjectLevels?.eng||1;if(c2<4){dispatch({type:ACTIONS.UNLOCK_LEVEL,payload:{world:'eng',newLevel:c2+1}});dispatch({type:ACTIONS.ADD_COINS,payload:{amount:15,bonusKey:`eng_${c2+1}`}});showToast(`✨ Level ${c2+1} Unlocked!`);spawnConfetti(15)}}if(p>=0.9){playTone('fanfare');spawnConfetti(30)}dispatch({type:ACTIONS.LOG_SESSION,payload:{ts:sessionStart.current,world:'eng',missionId:null,level:3,dur:Date.now()-sessionStart.current,score:p,wrong:qs.length-score,hints:0,completed:p>=0.8,nextAction:null,phaseStats:null}})}else{setAnswered(false);setFeedback(null);setCur(c=>c+1)}}
  if(done)return<ResultScreen score={score} total={qs.length} xp={xp} streak={streak} coins={coinsEarned} onReplay={()=>{sessionStart.current=Date.now();setCur(0);setScore(0);setStreak(0);setXp(0);setDone(false);setAnswered(false);setFeedback(null);setCoinsEarned(0)}} onBack={onBack}/>
  if(!q)return null
  return(
    <div style={{width:'100%',maxWidth:480,padding:'8px 0'}}>
      <GameHeader cur={cur} total={qs.length} xp={xp} streak={streak}/>
      <div style={{background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:16,margin:'0 20px',padding:'18px 16px'}}>
        <div style={{fontSize:12,color:'var(--muted)',textAlign:'center',marginBottom:8}}>เลือกคำที่หายไป</div>
        <div style={{fontSize:42,textAlign:'center',marginBottom:8}}>{q.emoji}</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:'var(--text)',textAlign:'center',marginBottom:16,lineHeight:1.6}}>{q.sentence}</div>
        <div className="choices">
          {choices.map((w,i)=><button key={i} className={`choice-btn${answered&&w===q.blank?' correct':''}`} onClick={()=>check(w)}>{w}</button>)}
        </div>
        {feedback&&<div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {answered&&<button className="next-btn show" style={{background:'var(--blue)',color:'#fff'}} onClick={next}>Next →</button>}
      </div>
    </div>
  )
}

function SentenceGame({ lv, onBack }) {
  const { state, dispatch } = useAppState()
  const [qs] = useState(() => shuffle([...ENG_SENTS]).slice(0,8))
  const [cur, setCur] = useState(0); const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const [xp, setXp] = useState(0); const [typed, setTyped] = useState([]); const [usedIdxs, setUsedIdxs] = useState([]); const [done, setDone] = useState(false); const [feedback, setFeedback] = useState(null); const [submitted, setSubmitted] = useState(false); const [coinsEarned, setCoinsEarned] = useState(0)
  const sessionStart = useRef(Date.now())
  const q = qs[cur]
  const tiles = React.useMemo(() => q ? shuffle([...q.words]) : [], [cur]) // eslint-disable-line
  useEffect(() => { setTyped([]); setUsedIdxs([]); setFeedback(null); setSubmitted(false); if(q)setTimeout(()=>speakEn(q.words.join(' '),.8),300) },[cur]) // eslint-disable-line
  const tapTile = (w,idx) => {
    if(submitted||usedIdxs.includes(idx))return
    const newTyped=[...typed,w]; setTyped(newTyped); setUsedIdxs(u=>[...u,idx])
    if(newTyped.length===q.words.length){
      setSubmitted(true)
      const ok=newTyped.join(' ')===q.words.join(' ')
      if(ok){const ns=streak+1;setStreak(ns);const earned=Math.max(2,Math.round(10*2.5));setXp(x=>x+earned);setScore(s=>s+1);dispatch({type:ACTIONS.ADD_XP,payload:{world:'eng',amount:earned,accDelta:100}});if(ns>=3){playTone('streak');spawnConfetti(5)}else playTone('correct');setFeedback({type:'win',msg:'Correct! '+q.words.join(' ')+` +${earned} XP`});setTimeout(()=>speakEn(q.words.join(' '),.85),300)}
      else{setStreak(0);playTone('wrong');setFeedback({type:'lose',msg:'Answer: '+q.words.join(' ')})}
    }
  }
  const next=()=>{playTone('next');if(cur+1>=qs.length){setDone(true);const p=score/qs.length;const _c4=Math.max(2,Math.min(12,Math.round(12*(p<0.5?0.3:p)*(1-(state.levelMastery?.eng?.[4]||0)))));setCoinsEarned(_c4);dispatch({type:ACTIONS.ADD_COINS,payload:{amount:_c4}});showItemToast(`🪙 +${_c4}`);dispatch({type:ACTIONS.ROUND_COMPLETE,payload:{streak,score:p}});dispatch({type:ACTIONS.UPDATE_LEVEL_MASTERY,payload:{world:'eng',levelId:4,value:p*0.4+((state.levelMastery?.eng?.[4])||0)*0.6}});if(p>=0.9){playTone('fanfare');spawnConfetti(30)}dispatch({type:ACTIONS.LOG_SESSION,payload:{ts:sessionStart.current,world:'eng',missionId:null,level:4,dur:Date.now()-sessionStart.current,score:p,wrong:qs.length-score,hints:0,completed:p>=0.8,nextAction:null,phaseStats:null}})}else setCur(c=>c+1)}
  if(done)return<ResultScreen score={score} total={qs.length} xp={xp} streak={streak} coins={coinsEarned} onReplay={()=>{sessionStart.current=Date.now();setCur(0);setScore(0);setStreak(0);setXp(0);setDone(false);setCoinsEarned(0)}} onBack={onBack}/>
  if(!q)return null
  return(
    <div style={{width:'100%',maxWidth:480,padding:'8px 0'}}>
      <GameHeader cur={cur} total={qs.length} xp={xp} streak={streak}/>
      <div style={{background:'var(--card)',border:'1.5px solid var(--border)',borderRadius:16,margin:'0 20px',padding:'18px 16px'}}>
        <div style={{fontSize:12,color:'var(--muted)',textAlign:'center',marginBottom:8}}>เรียงคำให้เป็นประโยค</div>
        <div style={{fontSize:48,textAlign:'center',cursor:'pointer',marginBottom:8}} onClick={()=>speakEn(q.words.join(' '),.8)}>{q.emoji}</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',minHeight:42,marginBottom:12,padding:8,background:'var(--bg)',borderRadius:10,border:'1.5px dashed var(--border)'}}>
          {typed.map((w,i)=><span key={i} style={{background:'var(--blue-l)',color:'var(--blue-d)',borderRadius:8,padding:'6px 10px',fontFamily:'Mitr,sans-serif',fontSize:14,fontWeight:600}}>{w}</span>)}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:4}}>
          {tiles.map((w,i)=>(
            <button key={i} onClick={()=>tapTile(w,i)} style={{background: usedIdxs.includes(i)?'transparent':'var(--card)',border:`2px solid ${usedIdxs.includes(i)?'transparent':'var(--border)'}`,borderRadius:10,padding:'8px 14px',fontFamily:'Mitr,sans-serif',fontSize:14,fontWeight:500,cursor:usedIdxs.includes(i)?'default':'pointer',opacity:usedIdxs.includes(i)?0:1,transition:'opacity .2s'}}>{w}</button>
          ))}
        </div>
        {feedback&&<div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {submitted&&<button className="next-btn show" style={{background:'var(--blue)',color:'#fff'}} onClick={next}>Next →</button>}
      </div>
    </div>
  )
}
