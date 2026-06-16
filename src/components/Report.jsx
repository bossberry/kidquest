import React from 'react'
import { useAppState } from '../context/StateContext.jsx'
import { computeReadiness } from '../lib/subjectReadiness.js'

const WORLD_LABELS = { thai: 'ภาษาไทย', math: 'Math', eng: 'English', shop: 'ร้านค้า' }

const READINESS_LABELS = {
  strong:    'แข็งแรงมาก',
  comfortable: 'กำลังมั่นใจ',
  exploring: 'กำลังสำรวจ',
  notready:  'ยังไม่มีข้อมูลพอ',
}
const READINESS_COLORS = {
  strong:    { bg: 'var(--green-l)',  text: 'var(--green-d)' },
  comfortable: { bg: 'var(--blue-l)', text: 'var(--blue-d)' },
  exploring: { bg: 'var(--amber-l)', text: 'var(--amber-d)' },
  notready:  { bg: 'var(--border)',   text: 'var(--muted)' },
}
const READINESS_SUBJECTS = [
  { world: 'thai', label: 'ภาษาไทย' },
  { world: 'math', label: 'คณิต'    },
  { world: 'eng',  label: 'อังกฤษ'  },
]

function SubjectReadiness({ sessionLog }) {
  return (
    <div className="report-card">
      <div className="rc-title">ความพร้อมรายวิชา</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        ดูจากการเล่นล่าสุด ไม่ใช่เลเวลที่ปลดล็อก
      </div>
      {READINESS_SUBJECTS.map(({ world, label }) => {
        const r = computeReadiness(sessionLog, world)
        const c = READINESS_COLORS[r]
        return (
          <div key={world} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{label}</span>
            <span style={{ background: c.bg, color: c.text, borderRadius: 12, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              {READINESS_LABELS[r]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function fmtDur(ms) {
  const m = Math.floor(ms / 60000)
  const s = Math.round((ms % 60000) / 1000)
  return m > 0 ? `${m} นาที ${s} วิ` : `${s} วิ`
}

function MissionAnalytics({ shopV1, name }) {
  if (!shopV1 || shopV1.runs === 0) return null
  const { runs, mastered, totalHints = 0, totalDuration = 0, phaseStats = {} } = shopV1

  const ps = phaseStats
  const phaseLabels = { 1: 'จับคู่ภาษาไทย', 2: 'คำศัพท์อังกฤษ', 3: 'นับของในร้าน', 4: 'มารยาทดี' }
  const phaseAccs = [1,2,3,4].map(ph => {
    const d = ps[ph]
    return d && d.total > 0 ? d.correct / d.total : null
  })

  const validAccs = phaseAccs.map((a, i) => a !== null ? { ph: i+1, acc: a } : null).filter(Boolean)
  const challengePhase = validAccs.length ? validAccs.reduce((a, b) => a.acc <= b.acc ? a : b) : null
  const easiestPhase   = validAccs.length ? validAccs.reduce((a, b) => a.acc >= b.acc ? a : b) : null

  const totalCorrect = [1,2,3,4].reduce((sum, ph) => sum + (ps[ph]?.correct || 0), 0)
  const totalQs = [1,2,3,4].reduce((sum, ph) => sum + (ps[ph]?.total || 0), 0)
  const avgScore = totalQs > 0 ? Math.round(totalCorrect / totalQs * 100) : null
  const avgDur = totalDuration > 0 && runs > 0 ? Math.round(totalDuration / runs) : null
  const avgHints = runs > 0 ? (totalHints / runs).toFixed(1) : '0'

  const replayText = runs === 1
    ? 'เล่นครั้งแรกสำเร็จ'
    : runs === 2
    ? 'เล่นสองครั้งแล้ว'
    : mastered
    ? `เลือกเล่นซ้ำ ${runs - 1} ครั้งหลังจากผ่านครั้งแรก — สัญญาณการมีส่วนร่วมที่ดีมาก`
    : `เล่นไป ${runs} ครั้ง — ยังคงพยายามอยู่`

  let nudge = null
  if (mastered) {
    nudge = `${name} ผ่านเกณฑ์ mastery แล้ว — Shop Stretch พร้อมเมื่อถึงเวลา`
  } else if (avgScore !== null && avgScore >= 90 && runs >= 3) {
    nudge = `${name} ทำได้ดีสม่ำเสมอ`
  } else if (challengePhase && challengePhase.acc < 0.6 && runs >= 2) {
    nudge = `${phaseLabels[challengePhase.ph]} คือจุดที่ท้าทายอยู่ตอนนี้ — เล่น Shop Mission ซ้ำหรือฝึกวิชานั้นเพิ่มจะช่วยได้`
  } else if (runs === 1) {
    nudge = `เริ่มต้นดี — เล่นอีกสักสองสามครั้งจะเห็นภาพชัดขึ้น`
  }

  return (
    <div className="report-card">
      <div className="rc-title">Shop Mission</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px', marginBottom:12 }}>
        <div><span style={{ color:'var(--muted)', fontSize:12 }}>จำนวนครั้ง</span><div style={{ fontWeight:700 }}>{runs} ครั้ง</div></div>
        <div><span style={{ color:'var(--muted)', fontSize:12 }}>คะแนนเฉลี่ย</span><div style={{ fontWeight:700 }}>{avgScore !== null ? `${avgScore}%` : '—'}</div></div>
        <div><span style={{ color:'var(--muted)', fontSize:12 }}>เวลาเฉลี่ย</span><div style={{ fontWeight:700 }}>{avgDur !== null ? fmtDur(avgDur) : '—'}</div></div>
        <div><span style={{ color:'var(--muted)', fontSize:12 }}>Hint ที่ใช้</span><div style={{ fontWeight:700 }}>{totalHints} ครั้ง (เฉลี่ย {avgHints}/เล่น)</div></div>
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4 }}>ความยากแต่ละช่วง:</div>
      {[1,2,3,4].map(ph => {
        const acc = phaseAccs[ph-1]
        const pct = acc !== null ? Math.round(acc * 100) : null
        const isChallenge = challengePhase?.ph === ph
        const isEasiest   = easiestPhase?.ph === ph && validAccs.length > 1
        return (
          <div key={ph} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, fontSize:13 }}>
            <span style={{ fontSize:10, color: isChallenge ? 'var(--amber-d)' : 'var(--green-d)' }}>{isChallenge ? '!' : 'OK'}</span>
            <span style={{ flex:1 }}>{phaseLabels[ph]}</span>
            <span style={{ color: isChallenge ? 'var(--amber-d)' : 'var(--green-d)', fontWeight:600 }}>
              {pct !== null ? `${pct}%` : '—'}
            </span>
            {isChallenge && <span style={{ fontSize:11, color:'var(--amber-d)' }}>(จุดท้าทาย)</span>}
            {isEasiest    && <span style={{ fontSize:11, color:'var(--green-d)' }}>(ง่ายที่สุด)</span>}
          </div>
        )
      })}
      <div style={{ marginTop:10, fontSize:13, color:'var(--text)', lineHeight:1.6 }}>{replayText}</div>
      {nudge && (
        <div style={{ marginTop:8, fontSize:12, color:'var(--purple-d)', background:'var(--purple-l)', borderRadius:8, padding:'6px 10px' }}>{nudge}</div>
      )}
    </div>
  )
}

const SPEED_SUBJECT_LABELS = { thai: 'ภาษาไทย', math: 'คณิต', eng: 'อังกฤษ' }
const avgSec = arr => arr.length ? arr.reduce((s, x) => s + x.timeMs, 0) / arr.length / 1000 : null

function ResponseSpeed({ responseTimeLogs }) {
  const subjects = ['thai', 'math', 'eng']
  const hasAny = subjects.some(s => (responseTimeLogs?.[s]?.length ?? 0) >= 5)
  if (!hasAny) return null
  return (
    <div className="report-card">
      <div className="rc-title">ความเร็วในการตอบ</div>
      {subjects.map(sub => {
        const logs = responseTimeLogs?.[sub] ?? []
        if (logs.length < 5) return null
        const recent   = logs.slice(-10)
        const prev     = logs.slice(-20, -10)
        const recentAvg = avgSec(recent)
        const prevAvg   = avgSec(prev)
        let trend = null
        if (recentAvg !== null && prevAvg !== null && prev.length >= 5) {
          const diff = prevAvg - recentAvg  // positive = faster
          if (diff > 0.3)       trend = { text: `เร็วขึ้น ${diff.toFixed(1)} วิ`, color: 'var(--green-d)', icon: '⚡' }
          else if (diff < -0.3) trend = { text: `ช้าลง ${Math.abs(diff).toFixed(1)} วิ`, color: 'var(--amber-d)', icon: '🐢' }
          else                  trend = { text: 'เท่าเดิม', color: 'var(--muted)', icon: '→' }
        }
        return (
          <div key={sub} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ flex:1, fontWeight:600, fontSize:14 }}>{SPEED_SUBJECT_LABELS[sub]}</span>
            {recentAvg !== null && (
              <span style={{ fontSize:12, color:'var(--muted)' }}>{recentAvg.toFixed(1)} วิ/ข้อ</span>
            )}
            {trend && (
              <span style={{ fontSize:12, color:trend.color }}>{trend.icon} {trend.text}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Report() {
  const { state, totalXP } = useAppState()
  const totalTime = Math.round(state.mins || 0)
  const rounds = state.rounds || 0
  const acc = state.acc || 0
  const streak = state.streak || 0
  const tSum = totalXP || 1
  const thaiPct = Math.round((state.xpThai||0) / tSum * 100)
  const engPct  = Math.round((state.xpEng||0)  / tSum * 100)
  const mathPct = Math.round((state.xpMath||0) / tSum * 100)
  const thaiMins = Math.round(totalTime * (state.xpThai||0) / tSum)
  const engMins  = Math.round(totalTime * (state.xpEng||0)  / tSum)
  const mathMins = Math.round(totalTime * (state.xpMath||0) / tSum)
  const domSub = thaiPct>=engPct&&thaiPct>=mathPct?'ภาษาไทย':engPct>=mathPct?'English':'Math'
  const weakSub = thaiPct<=engPct&&thaiPct<=mathPct?'ภาษาไทย':engPct<=mathPct?'English':'Math'
  const speedLabel = (state.speed||50)>70?'เร็วมาก':(state.speed||50)>45?'ปานกลาง':'ช้าแต่คิดดี'
  const accLabel = acc>85?'แม่นมาก':acc>65?'ดี':'ยังพัฒนาอยู่'
  const balance = totalXP > 0 ? Math.round((1 - (Math.abs((state.xpThai||0)-(state.xpEng||0))+Math.abs((state.xpEng||0)-(state.xpMath||0))+Math.abs((state.xpThai||0)-(state.xpMath||0))) / (tSum*2)) * 100) : 0

  const BarRow = ({ label, pct, mins, color }) => (
    <div className="bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track"><div className="bar-fill" style={{ width:`${pct}%`, background:color }} /></div>
      <div className="bar-val">{mins} นาที</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%', height:'100%', overflowY:'auto', background:'var(--bg)', paddingBottom:80 }}>
      <div className="page-header"><div className="page-title">รีพอร์ต</div></div>
      <div className="report-body">
        <div className="report-card">
          <div className="rc-title">ภาพรวมของ {state.name||'ลูก'}</div>
          <div className="time-grid">
            <div className="time-item"><div className="time-val">{totalTime}</div><div className="time-lbl">นาทีทั้งหมด</div></div>
            <div className="time-item"><div className="time-val">{rounds}</div><div className="time-lbl">ด่านที่ผ่าน</div></div>
            <div className="time-item"><div className="time-val">{acc}%</div><div className="time-lbl">ความแม่นยำ</div></div>
            <div className="time-item"><div className="time-val">{streak}</div><div className="time-lbl">Streak</div></div>
          </div>
        </div>
        <div className="report-card">
          <div className="rc-title">เวลาที่ใช้ต่อวิชา</div>
          <BarRow label="ภาษาไทย" pct={thaiPct} mins={thaiMins} color="var(--green)" />
          <BarRow label="English" pct={engPct} mins={engMins} color="var(--blue)" />
          <BarRow label="Math" pct={mathPct} mins={mathMins} color="var(--purple)" />
        </div>
        <div className="report-card">
          <div className="rc-title">จุดแข็ง & ความถนัด</div>
          {[
            {key:'best',    text:`วิชาที่ถนัดที่สุด: ${domSub}`, tag:'var(--green-l)', tagColor:'var(--green-d)'},
            {key:'speed',   text:`ความเร็วในการตอบ: ${speedLabel}`, tag:'var(--amber-l)', tagColor:'var(--amber-d)'},
            {key:'acc',     text:`ความแม่นยำ: ${accLabel}`, tag:'var(--blue-l)', tagColor:'var(--blue-d)'},
            {key:'balance', text:`ความสมดุลระหว่างวิชา: ${balance}%${balance>75?' (เรียนรอบด้านดีมาก!)':balance>50?' (กำลังพัฒนา)':' (ควรเพิ่มวิชาที่ขาด)'}`, tag:'var(--purple-l)', tagColor:'var(--purple-d)'},
          ].map(r => (
            <div key={r.key} className="insight-row">
              <div className="insight-text">{r.text}</div>
            </div>
          ))}
        </div>
        <MissionAnalytics shopV1={state.shopV1} name={state.name || 'ลูก'} />
        <SubjectReadiness sessionLog={state.sessionLog} />
        <ResponseSpeed responseTimeLogs={state.responseTimeLogs} />
        <div className="report-card">
          <div className="rc-title">ประวัติการเล่น</div>
          {(!state.sessionLog || state.sessionLog.length === 0) ? (
            <div style={{ fontSize:13, color:'var(--muted)' }}>ยังไม่มีประวัติ — เล่นเกมแล้วจะแสดงที่นี่</div>
          ) : (
            [...state.sessionLog].reverse().slice(0, 10).map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom: i < 9 ? '1px solid var(--border)' : 'none', fontSize:13 }}>
                <span style={{ minWidth:110 }}>{WORLD_LABELS[s.world] || s.world}</span>
                <span style={{ flex:1, color:'var(--muted)', fontSize:11 }}>
                  {new Date(s.ts).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}
                </span>
                <span style={{ fontSize:10, color: s.completed ? 'var(--green-d)' : 'var(--muted)' }}>{s.completed ? 'ผ่าน' : 'ล้ม'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
