// ReadAloud.jsx — Phase 1.4 "อ่านให้ไข่ฟัง" (Speaking & Reading-Aloud) minigame.
// Same ready/playing/done phase pattern as the other 5 minigames
// (see EggMemory.jsx). Words come from the child's actual current thai/eng
// active curriculum node (src/lib/readAloudWords.js). Speech recognition is
// wrapped by src/lib/speech.js — see that file's top comment for the mic-
// privacy note (browser API only, nothing ever uploaded).
import React, { useState, useEffect, useRef } from 'react'
import { useAppState, ACTIONS, dispatchAddCoins } from '../../context/StateContext.jsx'
import { playTone, playSFX, speakTh, speakEn } from '../../lib/audio.js'
import { spawnConfetti } from '../../components/Toasts.jsx'
import { livesRemaining, heartsStr, MINIGAMES } from '../../lib/minigameLives.js'
import { MinigameBg, InGameHUD, MinigameResult } from './minigameUI.jsx'
import { isSpeechAvailable, startListening, classifyMatch, isPermissionError } from '../../lib/speech.js'
import { getReadAloudPool, pickReadAloudWords } from '../../lib/readAloudWords.js'
import { getFirstNodeId } from '../../lib/curriculum.js'

const G = MINIGAMES.readaloud
const WORDS_PER_GAME = 5
const MAX_TRIES = 2

export default function ReadAloud({ navigate }) {
  const { state, dispatch } = useAppState()
  const [phase, setPhase] = useState('ready') // ready | micIntro | playing | done
  const [subject, setSubject] = useState(null)
  const [words, setWords] = useState([])
  const [wordIdx, setWordIdx] = useState(0)
  const [tryNum, setTryNum] = useState(0) // 0 = not yet attempted this word
  const [wordPhase, setWordPhase] = useState('prompt') // prompt | listening | feedback
  const [feedback, setFeedback] = useState(null) // { tier, heard, match } | { tier } for listening-mode
  const [matchedCount, setMatchedCount] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [listeningChoices, setListeningChoices] = useState(null)
  // Some browsers (notably iOS Safari across various versions) expose the
  // SpeechRecognition constructor — isSpeechAvailable() reports true — but
  // recognition itself silently fails every time (permission denied, no mic,
  // or the platform's speech service refusing). Once we see that kind of
  // error for real, there's no point letting the child keep tapping a mic
  // button that can never work — permanently fall back to listening mode for
  // the rest of this round rather than repeatedly scoring them "incorrect"
  // for a systemic failure that isn't their fault.
  const [speechBroken, setSpeechBroken] = useState(false)
  const stopRef = useRef(null)

  const lives = livesRemaining(state, 'readaloud')
  const speechOk = isSpeechAvailable() && !speechBroken
  const currentWord = words[wordIdx]

  useEffect(() => {
    if (phase === 'ready' && lives <= 0) playSFX('lives_empty')
  }, [phase, lives])

  function startGame() {
    if (lives <= 0) return
    dispatch({ type: ACTIONS.READALOUD_DEDUCT_LIFE })
    const subj = Math.random() < 0.5 ? 'thai' : 'eng'
    const activeNodeId = state.activeNodes?.[subj] || getFirstNodeId(subj)
    setSubject(subj)
    setWords(pickReadAloudWords(subj, activeNodeId, WORDS_PER_GAME))
    setWordIdx(0)
    setTryNum(0)
    setMatchedCount(0)
    setWordPhase('prompt')
    setFeedback(null)
    setListeningChoices(null)
    setSpeechBroken(false) // a fresh round gets a fresh chance — a previous round's failure isn't assumed permanent
    setPhase(isSpeechAvailable() ? 'micIntro' : 'playing')
  }

  function confirmMicIntro() {
    playTone('start')
    setPhase('playing')
  }

  // Voice the target word whenever a fresh prompt appears.
  useEffect(() => {
    if (phase !== 'playing' || !currentWord || wordPhase !== 'prompt') return
    const t = setTimeout(() => {
      if (subject === 'thai') speakTh(currentWord.text)
      else speakEn(currentWord.text)
    }, 250)
    return () => clearTimeout(t)
  }, [phase, wordIdx, wordPhase]) // eslint-disable-line

  // Listening-mode fallback (no SpeechRecognition available, OR a mid-game
  // fallback triggered by a real permission-type recognition error — see
  // speechBroken above): build 3 picture choices (target + 2 distractors from
  // the same node pool). Depends on `speechOk` (not just phase/wordIdx) so
  // that a mid-game flip from mic mode to broken correctly builds the choices
  // for whatever word was current when the failure happened, not just future
  // words.
  useEffect(() => {
    if (phase !== 'playing' || speechOk || !currentWord || !subject) return
    const activeNodeId = state.activeNodes?.[subject] || getFirstNodeId(subject)
    const pool = getReadAloudPool(subject, activeNodeId)
    const distractors = pool.filter(w => w.text !== currentWord.text)
      .sort(() => Math.random() - 0.5).slice(0, 2)
    setListeningChoices([currentWord, ...distractors].sort(() => Math.random() - 0.5))
  }, [phase, wordIdx, speechOk]) // eslint-disable-line

  function advanceWord(gotIt) {
    if (gotIt) setMatchedCount(c => c + 1)
    const nextIdx = wordIdx + 1
    if (nextIdx >= words.length) {
      finishGame(gotIt ? matchedCount + 1 : matchedCount)
    } else {
      setWordIdx(nextIdx)
      setTryNum(0)
      setWordPhase('prompt')
      setFeedback(null)
      setListeningChoices(null)
    }
  }

  function finishGame(finalMatched) {
    const coins = finalMatched * 3
    setCoinsEarned(coins)
    if (coins > 0) dispatchAddCoins(dispatch, coins)
    dispatch({ type: ACTIONS.ADD_XP, payload: { world: subject === 'thai' ? 'thai' : 'eng', amount: finalMatched * 4 } })
    dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak: 0, score: finalMatched / WORDS_PER_GAME } })
    if (finalMatched >= 4) spawnConfetti(20)
    setPhase('done')
  }

  // ── Speech-recognition path ────────────────────────────────────────────────
  function handleMicDown() {
    if (wordPhase !== 'prompt') return
    playTone('tap')
    setWordPhase('listening')
    const { promise, stop } = startListening(currentWord.text, {
      lang: subject === 'thai' ? 'th-TH' : 'en-US', timeoutMs: 6000,
    })
    stopRef.current = stop
    promise.then((result) => { stopRef.current = null; handleSpeechResult(result) })
  }
  function handleMicUp() { stopRef.current?.() }

  function handleSpeechResult({ heard, match, unavailable, errorCode }) {
    if (unavailable) { setWordPhase('prompt'); return } // defensive — speechOk already gates this path
    if (isPermissionError(errorCode)) {
      // A real permission/no-mic/service failure, not just "didn't catch
      // that" — recognition can never succeed for the rest of this round.
      // Don't burn one of the child's 2 tries on a systemic failure that
      // isn't their fault; flip to listening mode and re-prompt the SAME
      // word fresh (the listening-choices effect above rebuilds for it).
      setSpeechBroken(true)
      setWordPhase('prompt')
      setFeedback(null)
      return
    }
    const tier = classifyMatch(match)
    const nextTry = tryNum + 1
    setTryNum(nextTry)
    setFeedback({ tier, heard, match })
    setWordPhase('feedback')

    if (tier === 'correct') {
      playTone('correct'); playSFX('item_collect')
      setTimeout(() => advanceWord(true), 1400)
      return
    }
    if (nextTry >= MAX_TRIES) {
      // Never trap the child — model the pronunciation once more, then move on
      // regardless of this final attempt's result.
      playTone('miss')
      if (subject === 'thai') speakTh(currentWord.text); else speakEn(currentWord.text)
      setTimeout(() => advanceWord(false), 1800)
      return
    }
    // One retry available (spec: 0.4-0.7 "almost" retries once; <0.4 "incorrect"
    // models the pronunciation first, then also gets a repeat attempt).
    playTone(tier === 'almost' ? 'combo' : 'miss')
    if (tier === 'incorrect') { if (subject === 'thai') speakTh(currentWord.text); else speakEn(currentWord.text) }
    setTimeout(() => { setWordPhase('prompt'); setFeedback(null) }, 1600)
  }

  // ── Listening-mode fallback path ─────────────────────────────────────────────
  function handleListeningChoice(choice) {
    if (wordPhase !== 'prompt') return
    const correct = choice.text === currentWord.text
    const nextTry = tryNum + 1
    setTryNum(nextTry)
    setFeedback({ tier: correct ? 'correct' : 'incorrect' })
    setWordPhase('feedback')
    if (correct) {
      playTone('correct'); playSFX('item_collect')
      setTimeout(() => advanceWord(true), 1200)
      return
    }
    playTone('miss')
    if (nextTry >= MAX_TRIES) { setTimeout(() => advanceWord(false), 1400); return }
    setTimeout(() => { setWordPhase('prompt'); setFeedback(null) }, 1200)
  }

  // ── ready ────────────────────────────────────────────────────────────────
  if (phase === 'ready') return (
    <div style={{ width:'100%', maxWidth:480, padding:20, fontFamily:'Mitr,sans-serif' }}>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, textAlign:'center', marginBottom:10 }}>{G.title}</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--muted)', marginBottom:16 }}>อ่านคำให้ไข่ฟังนะ! ไข่จะฟังว่าหนูพูดถูกมั้ย 🎤</div>
      <div style={{ display:'flex', justifyContent:'center', padding:'10px 14px', background:'var(--purple-l)', borderRadius:12, marginBottom:16, fontSize:20 }}>
        {heartsStr(lives, G.max)}
      </div>
      {lives <= 0
        ? <div style={{ textAlign:'center', padding:20, color:'var(--muted)' }}>มาเล่นใหม่พรุ่งนี้นะ! 🌙</div>
        : <button onClick={startGame} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:12, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer' }}>🎤 เริ่มเล่น!</button>
      }
    </div>
  )

  // ── mic-permission intro (skipped entirely when SpeechRecognition is unavailable) ──
  if (phase === 'micIntro') return (
    <div style={{ width:'100%', maxWidth:480, padding:24, fontFamily:'Mitr,sans-serif', textAlign:'center' }}>
      <div style={{ fontSize:56, marginBottom:12 }}>🥚🎤</div>
      <div style={{ fontSize:16, marginBottom:20, lineHeight:1.6 }}>ไข่อยากฟังหนูพูดนะ!<br/>ให้ไมค์ไข่หน่อยได้มั้ย? 🎤</div>
      <button onClick={confirmMicIntro} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:12, padding:14, fontSize:16, fontWeight:600, cursor:'pointer' }}>ตกลง! 🎤</button>
    </div>
  )

  if (phase === 'done') return (
    <MinigameResult
      gameKey="readaloud" emoji={matchedCount >= 4 ? '🌟' : '🎉'} title="อ่านจบแล้ว!"
      stats={[`อ่านถูก ${matchedCount}/${WORDS_PER_GAME} คำ`]}
      coins={coinsEarned} livesRemaining={lives} maxLives={G.max}
      onRetry={() => setPhase('ready')} onHome={() => navigate?.('home')}
    />
  )

  // ── playing ──────────────────────────────────────────────────────────────
  if (!currentWord) return <div style={{ padding:40, color:'var(--muted)', textAlign:'center' }}>กำลังโหลด...</div>

  return (
    <div style={{ position:'relative', width:'100%', maxWidth:480, padding:16, fontFamily:'Mitr,sans-serif', borderRadius:16, overflow:'hidden' }}>
      <MinigameBg gameKey="readaloud" radius={16} />
      <InGameHUD gameKey="readaloud" hearts={lives} maxHearts={G.max}
        coins={matchedCount * 3} center={`คำที่ ${wordIdx + 1}/${WORDS_PER_GAME}`} />
      <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'10px 0' }}>
        <div style={{ fontSize:64, marginBottom:8 }}>{currentWord.emoji}</div>
        <div style={{
          fontSize:30, color:'#fff', marginBottom:20,
          fontFamily: subject === 'thai' ? 'var(--font-thai, Mitr, sans-serif)' : "'Fredoka One',cursive",
        }}>{currentWord.text}</div>

        {speechOk ? (
          <>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:14 }}>
              {wordPhase === 'listening' ? 'ไข่กำลังฟังอยู่นะ... 👂' : 'กดค้างแล้วพูดคำนี้นะ!'}
            </div>
            <button
              onPointerDown={handleMicDown}
              onPointerUp={handleMicUp}
              onPointerLeave={handleMicUp}
              disabled={wordPhase === 'feedback'}
              style={{
                width:96, height:96, borderRadius:'50%', border:'none',
                background: wordPhase === 'listening' ? '#EF9F27' : 'var(--purple)',
                color:'#fff', fontSize:40, cursor:'pointer',
                boxShadow: wordPhase === 'listening' ? '0 0 0 8px rgba(239,159,39,0.3)' : 'none',
                transition:'box-shadow .2s',
                WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
              }}
            >🎤</button>
          </>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>แตะรูปที่ตรงกับเสียงที่ได้ยินนะ</div>
            <div style={{ display:'flex', gap:10 }}>
              {(listeningChoices || []).map((c, i) => (
                <button key={i} onClick={() => handleListeningChoice(c)} disabled={wordPhase === 'feedback'} style={{
                  fontSize:36, width:70, height:70, borderRadius:14, border:'2px solid rgba(255,255,255,0.25)',
                  background:'rgba(255,255,255,0.08)', cursor:'pointer',
                }}>{c.emoji}</button>
              ))}
            </div>
          </div>
        )}

        {feedback && wordPhase === 'feedback' && (
          <div style={{ marginTop:18, fontSize:15, color: feedback.tier === 'correct' ? '#7CFC7C' : '#fff' }}>
            {feedback.tier === 'correct' && 'เก่งมาก! 🎉'}
            {feedback.tier === 'almost' && 'อีกทีนึงนะ 😊'}
            {feedback.tier === 'incorrect' && 'ฟังไข่พูดแล้วลองอีกทีนะ 💛'}
          </div>
        )}
      </div>
    </div>
  )
}
