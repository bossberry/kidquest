// src/wordfactory/WordFactoryScreen.jsx — "โรงงานประกอบคำ" (Word Factory).
// A fully self-contained mini-game teaching consonant+vowel BLENDING. Reads
// only two things from the rest of the app: playTone/speakTh (shared audio
// infra) and spawnConfetti (shared celebration overlay, already mounted
// globally in App.jsx). Everything else — data, state, progress — is local
// to this file/folder. No dependency on src/context/StateContext.jsx,
// src/lib/state.js, or any main-game save data.
//
// v1 scope: Level 1 only (สระอา, 6 words) — see data.js's header comment.
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { playTone, speakTh } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'
import {
  WORDS, LEVEL_1_WORD_IDS, ALL_CONSONANTS, ALL_VOWELS,
  ROUNDS_PER_SESSION, MAX_REQUEUE_PER_WORD, shuffle, pickChoices, vowelGlyph,
} from './data.js'
import { recordMiss, recordListenReplay, recordSessionComplete } from './storage.js'

const INK = '#4a2f0e'
const WOOD = '#F2B838'
const WOOD_D = '#c98f1e'
const TEAL = '#2A9D8F'
const CARD = '#FFF7E6'

function LetterTile({ char, displayChar, onTap, shaking, disabled }) {
  return (
    <button
      onClick={() => !disabled && onTap(char)}
      disabled={disabled}
      style={{
        width: 68, height: 68, borderRadius: 16,
        background: '#fff', border: `3px solid ${WOOD_D}`,
        boxShadow: '0 3px 0 rgba(0,0,0,0.15)',
        fontFamily: 'var(--font-thai)', fontSize: 34, fontWeight: 700, color: INK,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        animation: shaking ? 'wf-shake 0.4s ease' : 'none',
        transition: 'transform .1s',
      }}
    >
      {displayChar ?? char}
    </button>
  )
}

function SlotBox({ label, value, placeholder, filled }) {
  return (
    <div style={{
      width: 92, height: 112, borderRadius: 18,
      background: filled ? '#fff' : 'rgba(255,255,255,0.35)',
      border: filled ? `3px solid ${TEAL}` : `3px dashed ${WOOD_D}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-thai)', fontSize: 52, fontWeight: 700, color: INK,
      animation: filled ? 'wf-pop-in 0.4s ease' : 'none',
      boxShadow: filled ? '0 4px 0 rgba(0,0,0,0.1)' : 'none',
    }}>
      {value || <span style={{ fontSize: 30, opacity: 0.35 }}>{placeholder}</span>}
    </div>
  )
}

function Mascot({ mood }) {
  const emoji = mood === 'happy' ? '🤖' : mood === 'thinking' ? '🤖' : '🤖'
  return (
    <div style={{
      fontSize: 52, lineHeight: 1,
      animation: mood === 'happy' ? 'wf-mascot-bounce 0.6s ease' : 'wf-mascot-idle 2.4s ease-in-out infinite',
      filter: mood === 'happy' ? 'drop-shadow(0 0 8px rgba(255,210,63,0.8))' : 'none',
    }}>
      {emoji}
    </div>
  )
}

export default function WordFactoryScreen({ navigate }) {
  const [phase, setPhase] = useState('intro') // intro | playing | reward
  const [currentWordId, setCurrentWordId] = useState(null)
  const [piecePhase, setPiecePhase] = useState('consonant') // consonant | vowel | assembled
  const [lockedConsonant, setLockedConsonant] = useState(null)
  const [lockedVowel, setLockedVowel] = useState(null)
  const [shakeChar, setShakeChar] = useState(null)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [starsThisSession, setStarsThisSession] = useState(0)
  const [roundDisplayNum, setRoundDisplayNum] = useState(1)
  const [mascotMood, setMascotMood] = useState('idle')

  const sessionRef = useRef({ queue: [], idx: 0, requeued: {} })
  const roundHadMissRef = useRef(false)
  const starsRef = useRef(0)
  const timersRef = useRef([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])
  const after = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const currentWord = currentWordId ? WORDS[currentWordId] : null

  const consonantChoices = useMemo(() => {
    if (!currentWord) return []
    return pickChoices(currentWord.consonant, ALL_CONSONANTS, 4)
  }, [currentWordId]) // eslint-disable-line

  const vowelChoices = useMemo(() => {
    if (!currentWord) return []
    return pickChoices(currentWord.vowel, ALL_VOWELS, 3)
  }, [currentWordId]) // eslint-disable-line

  function startRoundFor(wordId) {
    clearTimers()
    roundHadMissRef.current = false
    setCurrentWordId(wordId)
    setPiecePhase('consonant')
    setLockedConsonant(null)
    setLockedVowel(null)
    setShakeChar(null)
    setMascotMood('idle')
    setFeedbackMsg('ฟังคำนี้นะ แล้วแตะพยัญชนะที่ใช่!')
    const w = WORDS[wordId]
    after(() => speakTh(w.displayWord), 400)
  }

  function startSession() {
    const queue = shuffle(LEVEL_1_WORD_IDS).slice(0, ROUNDS_PER_SESSION)
    sessionRef.current = { queue, idx: 0, requeued: {} }
    starsRef.current = 0
    setStarsThisSession(0)
    setRoundDisplayNum(1)
    setPhase('playing')
    playTone('start')
    startRoundFor(queue[0])
  }

  function replayCurrent() {
    recordListenReplay()
    if (!currentWord) return
    if (piecePhase === 'assembled') {
      playPhoneticSequence(currentWord)
    } else {
      speakTh(currentWord.displayWord)
    }
  }

  function playPhoneticSequence(word) {
    clearTimers()
    let t = 0
    word.phoneticSteps.forEach((step) => {
      after(() => speakTh(step), t)
      t += 700
    })
    after(() => speakTh(word.finalSound), t + 200)
  }

  function handleConsonantTap(char) {
    if (!currentWord) return
    clearTimers()
    if (char === currentWord.consonant) {
      playTone('cardOpen')
      setLockedConsonant(char)
      setPiecePhase('vowel')
      setFeedbackMsg('เก่งมาก! ตอนนี้แตะสระที่ใช่นะ')
    } else {
      playTone('next')
      roundHadMissRef.current = true
      recordMiss(currentWord.id, 'consonant', char)
      setShakeChar(char)
      setFeedbackMsg('ยังไม่ใช่ ลองฟังอีกทีนะ')
      after(() => setShakeChar(null), 420)
      after(() => speakTh(currentWord.displayWord), 550)
    }
  }

  function handleVowelTap(char) {
    if (!currentWord) return
    clearTimers()
    if (char === currentWord.vowel) {
      playTone('cardOpen')
      setLockedVowel(char)
      setPiecePhase('assembled')
      setFeedbackMsg('ประกอบสำเร็จ!')
      runAssemblyCelebration(currentWord)
    } else {
      playTone('next')
      roundHadMissRef.current = true
      recordMiss(currentWord.id, 'vowel', char)
      setShakeChar(char)
      setFeedbackMsg('ยังไม่ใช่ ลองฟังอีกทีนะ')
      after(() => setShakeChar(null), 420)
      after(() => speakTh(currentWord.displayWord), 550)
    }
  }

  function runAssemblyCelebration(word) {
    setMascotMood('happy')
    playTone('correct')
    let t = 300
    word.phoneticSteps.forEach((step) => {
      after(() => speakTh(step), t)
      t += 700
    })
    after(() => speakTh(word.finalSound), t + 200)
    t += 1800
    after(() => completeRound(word), t)
  }

  function completeRound(word) {
    starsRef.current += 1
    setStarsThisSession(starsRef.current)

    const sess = sessionRef.current
    if (roundHadMissRef.current) {
      const timesRequeued = sess.requeued[word.id] || 0
      if (timesRequeued < MAX_REQUEUE_PER_WORD) {
        for (let i = sess.queue.length - 1; i > sess.idx; i--) {
          sess.queue[i] = word.id
          sess.requeued[word.id] = timesRequeued + 1
          break
        }
      }
    }

    if (sess.idx + 1 >= sess.queue.length) {
      recordSessionComplete(starsRef.current)
      playTone('complete')
      spawnConfetti(28)
      setPhase('reward')
    } else {
      sess.idx += 1
      setRoundDisplayNum(sess.idx + 1)
      startRoundFor(sess.queue[sess.idx])
    }
  }

  const goHome = () => { clearTimers(); if (window.speechSynthesis) window.speechSynthesis.cancel(); navigate('home') }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #FFE9B8 0%, #FFD98A 55%, #F5C56A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: 'hidden', touchAction: 'manipulation',
    }}>
      <style>{`
        @keyframes wf-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes wf-pop-in { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes wf-mascot-idle { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-6px) rotate(2deg)} }
        @keyframes wf-mascot-bounce { 0%{transform:scale(1)} 30%{transform:scale(1.3) rotate(-8deg)} 60%{transform:scale(0.95) rotate(6deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes wf-fade-in { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Top bar */}
      <div style={{
        width: '100%', maxWidth: 480, padding: '14px 16px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={goHome} aria-label="กลับ" style={{
          width: 40, height: 40, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.55)', fontSize: 18, cursor: 'pointer',
        }}>←</button>
        <div style={{ fontFamily: 'var(--font-thai)', fontWeight: 800, fontSize: 15, color: INK }}>
          🏭 โรงงานประกอบคำ
        </div>
        <div style={{
          minWidth: 40, height: 40, borderRadius: 20, padding: '0 10px',
          background: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'var(--font-thai)', fontWeight: 700, fontSize: 14, color: INK,
        }}>
          ⭐ {starsThisSession}
        </div>
      </div>

      {phase === 'intro' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 18, padding: 24, textAlign: 'center', width: '100%', maxWidth: 420,
        }}>
          <div style={{ fontSize: 72 }}>🏭🤖</div>
          <div style={{ fontFamily: 'var(--font-thai)', fontWeight: 800, fontSize: 20, color: INK }}>
            มาลองประกอบคำกันเถอะ!
          </div>
          <div style={{ fontFamily: 'var(--font-thai)', fontSize: 14, color: INK, opacity: 0.8, lineHeight: 1.6 }}>
            แตะพยัญชนะ แล้วแตะสระ<br />ให้ประกอบกันเป็นคำ 🔤
          </div>
          <button onClick={startSession} style={{
            fontFamily: 'var(--font-thai)', fontWeight: 700, fontSize: 18,
            background: TEAL, color: '#fff', border: 'none', borderRadius: 30,
            padding: '14px 40px', boxShadow: '0 4px 0 #1c6f65', cursor: 'pointer',
          }}>
            เริ่มเล่น ▶
          </button>
        </div>
      )}

      {phase === 'playing' && currentWord && (
        <div style={{
          flex: 1, width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '4px 16px 20px', overflow: 'hidden',
        }}>
          {/* progress dots */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            {sessionRef.current.queue.map((_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: i < roundDisplayNum - 1 ? TEAL : i === roundDisplayNum - 1 ? WOOD_D : 'rgba(255,255,255,0.6)',
              }} />
            ))}
          </div>

          {/* meaning image + listen button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '6px 0 10px' }}>
            <div style={{
              width: 76, height: 76, borderRadius: 20, background: CARD,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
              border: `3px solid ${WOOD_D}`,
            }}>
              {currentWord.emoji}
            </div>
            <button onClick={replayCurrent} aria-label="ฟังอีกครั้ง" style={{
              width: 56, height: 56, borderRadius: '50%', border: 'none',
              background: WOOD, boxShadow: '0 3px 0 rgba(0,0,0,0.15)', fontSize: 26, cursor: 'pointer',
            }}>
              🔊
            </button>
          </div>

          {/* feedback text */}
          <div key={feedbackMsg} style={{
            fontFamily: 'var(--font-thai)', fontSize: 14, fontWeight: 600, color: INK,
            minHeight: 20, marginBottom: 10, animation: 'wf-fade-in 0.25s ease',
          }}>
            {feedbackMsg}
          </div>

          {/* assembly stage */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
            <SlotBox placeholder="?" value={lockedConsonant} filled={!!lockedConsonant} label="พยัญชนะ" />
            <SlotBox placeholder="?" value={lockedVowel ? vowelGlyph(lockedVowel) : null} filled={!!lockedVowel} label="สระ" />
          </div>

          {/* choices */}
          {piecePhase === 'consonant' && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {consonantChoices.map(c => (
                <LetterTile key={c} char={c} onTap={handleConsonantTap} shaking={shakeChar === c} />
              ))}
            </div>
          )}
          {piecePhase === 'vowel' && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {vowelChoices.map(v => (
                <LetterTile key={v} char={v} displayChar={vowelGlyph(v)} onTap={handleVowelTap} shaking={shakeChar === v} />
              ))}
            </div>
          )}
          {piecePhase === 'assembled' && (
            <div style={{
              fontFamily: 'var(--font-thai)', fontSize: 15, color: INK, textAlign: 'center',
              animation: 'wf-fade-in 0.3s ease',
            }}>
              {currentWord.soundPractice
                ? 'ฝึกออกเสียง 🔤'
                : `${currentWord.displayWord} = ${currentWord.meaningTh}`}
            </div>
          )}

          <div style={{ flex: 1 }} />
          <Mascot mood={mascotMood} />
        </div>
      )}

      {phase === 'reward' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: 24, textAlign: 'center', width: '100%', maxWidth: 420,
        }}>
          <div style={{ fontSize: 64, animation: 'wf-mascot-bounce 0.8s ease' }}>🎉🤖🎉</div>
          <div style={{ fontFamily: 'var(--font-thai)', fontWeight: 800, fontSize: 20, color: INK }}>
            เก่งมาก! ประกอบคำครบแล้ว!
          </div>
          <div style={{ fontFamily: 'var(--font-thai)', fontSize: 16, color: INK }}>
            ได้ดาว {starsThisSession} ดวง ⭐
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={startSession} style={{
              fontFamily: 'var(--font-thai)', fontWeight: 700, fontSize: 15,
              background: TEAL, color: '#fff', border: 'none', borderRadius: 24,
              padding: '12px 22px', boxShadow: '0 4px 0 #1c6f65', cursor: 'pointer',
            }}>
              เล่นอีกรอบ 🔁
            </button>
            <button onClick={goHome} style={{
              fontFamily: 'var(--font-thai)', fontWeight: 700, fontSize: 15,
              background: '#fff', color: INK, border: `2px solid ${WOOD_D}`, borderRadius: 24,
              padding: '12px 22px', cursor: 'pointer',
            }}>
              กลับหน้าหลัก 🏠
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
