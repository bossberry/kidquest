import React, { useState } from 'react'
import { useAppState, ACTIONS } from '../context/StateContext.jsx'
import { playTone } from '../lib/audio.js'
import { spawnConfetti } from '../components/Toasts.jsx'
import { shuffle } from '../config/gameConfig.js'

const SHOP_ITEMS = [
  { emoji: '🍎', thai: 'แอปเปิ้ล', eng: 'apple' },
  { emoji: '🍌', thai: 'กล้วย',    eng: 'banana' },
  { emoji: '🍊', thai: 'ส้ม',      eng: 'orange' },
]

// 4 Thai choices: the 3 shop items + 1 fixed distractor
const THAI_CHOICES = [...SHOP_ITEMS.map(i => i.thai), 'ขนมปัง']

const TOTAL = 6

function buildQuestions() {
  // Step 1 — 3 Thai matching sub-questions (one per item, randomised order)
  const matchItems = shuffle([...SHOP_ITEMS])
  const q1 = matchItems.map(item => ({
    type: 'match',
    subject: 'thai',
    prompt: 'ชื่ออะไร?',
    display: item.emoji,
    answer: item.thai,
    choices: shuffle([...THAI_CHOICES]),
  }))

  // Step 2 — English vocabulary (random item)
  const engItem = SHOP_ITEMS[Math.floor(Math.random() * SHOP_ITEMS.length)]
  const q2 = {
    type: 'multipleChoice',
    subject: 'eng',
    prompt: 'What is this?',
    display: engItem.emoji,
    answer: engItem.eng,
    choices: shuffle([engItem.eng, ...['apple', 'banana', 'orange', 'bread'].filter(e => e !== engItem.eng)]),
  }

  // Step 3 — Counting 1–5 (random item, random count)
  const countItem = SHOP_ITEMS[Math.floor(Math.random() * SHOP_ITEMS.length)]
  const count = Math.floor(Math.random() * 5) + 1
  const distractors = new Set()
  while (distractors.size < 3) {
    const v = Math.floor(Math.random() * 5) + 1
    if (v !== count) distractors.add(v)
  }
  const q3 = {
    type: 'counting',
    subject: 'math',
    prompt: `มี${countItem.thai}กี่อัน?`,
    objects: Array(count).fill(countItem.emoji),
    answer: count,
    choices: shuffle([count, ...distractors]),
  }

  // Step 4 — Social phrase (accept both polite forms)
  const q4 = {
    type: 'multipleChoice',
    subject: 'thai',
    prompt: 'บอกว่าอะไรตอนซื้อของเสร็จ?',
    display: '🛍️',
    answer: 'ขอบคุณครับ',
    altAnswers: ['ขอบคุณค่ะ'],
    choices: ['ขอบคุณครับ', 'ขอบคุณค่ะ', 'สวัสดี', 'หิวข้าว'],
  }

  return [...q1, q2, q3, q4]
}

const STEP_LABELS = ['จับคู่ภาษาไทย 🇹🇭', 'จับคู่ภาษาไทย 🇹🇭', 'จับคู่ภาษาไทย 🇹🇭', 'คำศัพท์อังกฤษ 🔤', 'นับของในร้าน 🔢', 'มารยาทดี 🙏']
const CORRECT_MSGS = ['เก่งมาก! 🎉', 'ถูกต้อง! ✅', 'ยอดเยี่ยม! 🌟']

export default function GameShop({ navigate }) {
  const { state, dispatch } = useAppState()
  const [questions, setQuestions] = useState(buildQuestions)
  const [cur, setCur] = useState(0)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [streak, setStreak] = useState(0)
  const [xp, setXp] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [done, setDone] = useState(false)

  const q = questions[cur]

  const isCorrect = (val) =>
    val === q.answer || (q.altAnswers && q.altAnswers.includes(val))

  const check = (val) => {
    if (answered) return
    if (isCorrect(val)) {
      setAnswered(true)
      const ns = streak + 1; setStreak(ns)
      const earned = 8 + (ns >= 3 ? 5 : 0)
      setXp(x => x + earned)
      setScore(s => s + 1)
      const world = q.subject === 'eng' ? 'eng' : q.subject === 'math' ? 'math' : 'thai'
      dispatch({ type: ACTIONS.ADD_XP, payload: { world, amount: earned, accDelta: 100 } })
      setFeedback({ type: 'win', msg: CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)] + ` +${earned} XP` })
      if (ns >= 3) { playTone('streak'); spawnConfetti(5) } else playTone('correct')
    } else {
      const na = attempts + 1; setAttempts(na)
      setStreak(0); playTone('wrong')
      if (na < 2) {
        setFeedback({ type: 'lose', msg: 'ไม่ถูก ลองอีกครั้ง! 🤔' })
      } else {
        setAnswered(true)
        setWrong(w => w + 1)
        setFeedback({ type: 'lose', msg: `คำตอบคือ ${q.answer}` })
      }
    }
  }

  const next = () => {
    playTone('next')
    if (cur + 1 >= TOTAL) {
      const p = score / TOTAL
      dispatch({ type: ACTIONS.ROUND_COMPLETE, payload: { streak, score: p } })
      dispatch({ type: ACTIONS.UPDATE_SHOP_V1, payload: { score: p, wrong } })
      if (p >= 0.9) { playTone('fanfare'); spawnConfetti(30) }
      else if (p >= 0.8) spawnConfetti(15)
      setDone(true)
    } else {
      setAnswered(false); setAttempts(0); setFeedback(null)
      setCur(c => c + 1)
    }
  }

  const replay = () => {
    setQuestions(buildQuestions())
    setCur(0); setScore(0); setWrong(0); setStreak(0)
    setXp(0); setAnswered(false); setAttempts(0)
    setFeedback(null); setDone(false)
  }

  if (done) {
    const p = score / TOTAL
    const passed = p >= 0.8
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:24, textAlign:'center', width:'100%', maxWidth:480 }}>
        <div style={{ fontSize:64, marginBottom:10 }}>{p >= .9 ? '🏆' : p >= .7 ? '🎉' : '😊'}</div>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'var(--purple-d)', marginBottom:8 }}>
          {p >= .9 ? 'เยี่ยมมาก! 🌟' : p >= .8 ? 'ผ่านแล้ว! 🎊' : 'ลองอีกครั้งนะ 💪'}
        </div>
        <div style={{ fontSize:14, color:'var(--muted)', marginBottom:12 }}>
          {score}/{TOTAL} ถูก · +{xp} XP
        </div>
        {passed && (
          <div style={{ fontSize:13, color:'var(--green-d)', background:'var(--green-l)', borderRadius:8, padding:'6px 14px', marginBottom:12 }}>
            ✅ ผ่านภารกิจร้านค้าแล้ว!
          </div>
        )}
        {!passed && (
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12 }}>
            ต้องถูกอย่างน้อย {Math.ceil(TOTAL * 0.8)}/{TOTAL} ข้อ
          </div>
        )}
        <button onClick={replay} style={{ width:'100%', background:'var(--purple)', color:'#fff', border:'none', borderRadius:10, padding:14, fontFamily:'Mitr,sans-serif', fontSize:16, fontWeight:600, cursor:'pointer', marginBottom:8 }}>🔄 เล่นอีกครั้ง</button>
        <button onClick={() => navigate('home')} style={{ width:'100%', background:'var(--purple-l)', color:'var(--purple-d)', border:'none', borderRadius:10, padding:13, fontFamily:'Mitr,sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}>← หน้าหลัก</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div style={{ width:'100%', maxWidth:480, padding:'8px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'0 20px 4px', fontSize:12, color:'var(--muted)' }}>
        <span>ข้อ {cur + 1}/{TOTAL}</span>
        <span>{streak >= 3 ? `${streak}🔥` : ''}</span>
        <span>+{xp} XP</span>
      </div>
      <div style={{ padding:'0 20px 8px' }}>
        <div style={{ height:6, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:6, background:'var(--amber)', borderRadius:4, width:`${(cur / TOTAL) * 100}%`, transition:'width .4s' }} />
        </div>
      </div>

      <div style={{ textAlign:'center', fontSize:11, color:'var(--muted)', marginBottom:4 }}>
        {STEP_LABELS[cur]}
      </div>

      <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16, margin:'8px 20px', padding:'18px 16px' }}>
        <div style={{ textAlign:'center', fontSize:14, color:'var(--text)', fontFamily:'Mitr,sans-serif', fontWeight:600, marginBottom:12 }}>
          {q.prompt}
        </div>

        {q.type === 'counting' ? (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', padding:'8px 0', marginBottom:12 }}>
            {q.objects.map((e, i) => <span key={i} style={{ fontSize:44, lineHeight:1 }}>{e}</span>)}
          </div>
        ) : (
          <div style={{ fontSize:80, textAlign:'center', marginBottom:12, lineHeight:1 }}>{q.display}</div>
        )}

        <div className="choices">
          {q.choices.map((c, i) => (
            <button
              key={i}
              className={`choice-btn${answered && isCorrect(c) ? ' correct' : ''}`}
              style={{
                fontSize: typeof c === 'number' ? 28 : 18,
                fontFamily: q.subject === 'eng' ? "'Fredoka One',cursive" : 'Mitr,sans-serif',
              }}
              onClick={() => check(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {feedback && <div className={`feedback show ${feedback.type}`}>{feedback.msg}</div>}
        {answered && (
          <button className="next-btn show" style={{ background:'var(--purple)', color:'#fff' }} onClick={next}>
            {cur + 1 >= TOTAL ? 'ดูผล 🎊' : 'ต่อไป →'}
          </button>
        )}
      </div>
    </div>
  )
}
