import React, { useState } from 'react'
import { useAppState } from '../context/StateContext.jsx'
import { computeReadiness } from '../lib/subjectReadiness.js'

// ─── Constants ─────────────────────────────────────────────────────────────────

const SUBJECT_LEVEL_MAP = {
  thai: {
    1: { name:'พยัญชนะ ก-ฮ',   grade:'อนุบาล 1-2', gradeEn:'K1-K2' },
    2: { name:'พยัญชนะ+สระ',    grade:'อนุบาล 3',   gradeEn:'K3'    },
    3: { name:'คำสัตว์',        grade:'ป.1',         gradeEn:'G1'    },
    4: { name:'คำ 3 พยางค์',    grade:'ป.1-2',       gradeEn:'G1-G2' },
    5: { name:'ประโยคสั้น',     grade:'ป.2',         gradeEn:'G2'    },
  },
  math: {
    0: { name:'นับของ 1-5',     grade:'อนุบาล 1',    gradeEn:'K1'    },
    1: { name:'บวก 1-5',        grade:'อนุบาล 2-3',  gradeEn:'K2-K3' },
    2: { name:'บวก 1-10',       grade:'ป.1',         gradeEn:'G1'    },
    3: { name:'บวก 1-20',       grade:'ป.1',         gradeEn:'G1'    },
    4: { name:'ลบ 1-10',        grade:'ป.1-2',       gradeEn:'G1-G2' },
    5: { name:'บวกลบผสม',       grade:'ป.2',         gradeEn:'G2'    },
    6: { name:'โจทย์คำ',        grade:'ป.2-3',       gradeEn:'G2-G3' },
    7: { name:'เปรียบเทียบ',    grade:'ป.2',         gradeEn:'G2'    },
    8: { name:'รูปแบบ AB',      grade:'ป.1-2',       gradeEn:'G1-G2' },
  },
  eng: {
    1: { name:'A-Z Phonics',    grade:'อนุบาล 2-3',  gradeEn:'K2-K3' },
    2: { name:'CVC Words',      grade:'ป.1',         gradeEn:'G1'    },
    3: { name:'Sight Words',    grade:'ป.1-2',       gradeEn:'G1-G2' },
    4: { name:'Sentences',      grade:'ป.2-3',       gradeEn:'G2-G3' },
  },
}

const SUBJECT_COLORS = {
  thai: '#E24B4A',
  math: '#378ADD',
  eng:  '#EF9F27',
}

const SUBJECT_LABELS = {
  thai: 'ภาษาไทย',
  math: 'คณิตศาสตร์',
  eng:  'ภาษาอังกฤษ',
}

const READINESS_LABELS = {
  strong:      'แข็งแรงมาก',
  comfortable: 'กำลังมั่นใจ',
  exploring:   'กำลังสำรวจ',
  notready:    'ยังไม่มีข้อมูล',
}
const READINESS_COLORS = {
  strong:      '#44ee44',
  comfortable: '#378ADD',
  exploring:   '#EF9F27',
  notready:    'rgba(255,255,255,0.3)',
}

const avgSec = arr => arr.length ? arr.reduce((s, x) => s + x.timeMs, 0) / arr.length / 1000 : null

// ─── Shared section label ──────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-pixel)', fontSize: 9,
      color: 'rgba(255,255,255,0.4)', letterSpacing: 2,
      marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

// ─── Section 1 — stat card ─────────────────────────────────────────────────────

function StatCard({ value, label, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}44`,
      padding: '12px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 18, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-thai)', fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{label}</div>
    </div>
  )
}

// ─── Section 2 — XP bar row ────────────────────────────────────────────────────

function XPBar({ label, xp, maxXP, color, readiness }) {
  const pct = maxXP > 0 ? Math.round(xp / maxXP * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-thai)', fontSize: 13, color: '#fff' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>{xp} XP</span>
      </div>
      <div style={{ height: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width .4s' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 7, color: READINESS_COLORS[readiness], letterSpacing: 0.5 }}>
        {READINESS_LABELS[readiness]}
      </span>
    </div>
  )
}

// ─── Section: Subject Level Card ──────────────────────────────────────────────

function SubjectLevelCard({ subject, currentLevel }) {
  const [expanded, setExpanded] = useState(false)
  const map      = SUBJECT_LEVEL_MAP[subject]
  const color    = SUBJECT_COLORS[subject]
  const label    = SUBJECT_LABELS[subject]
  const current  = map[currentLevel]
  const allLevels = Object.entries(map).map(([lv, data]) => ({ lv: Number(lv), ...data }))

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color, letterSpacing: 1, marginBottom: 3 }}>
            {label.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--font-thai)', fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
            {current?.name ?? '—'}
          </div>
        </div>

        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            background: `${color}22`, border: `1px solid ${color}66`,
            padding: '4px 10px',
            fontFamily: 'var(--font-thai)', fontSize: 12, color,
          }}>
            {current?.grade ?? '—'}
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            Lv.{currentLevel}
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {/* Expanded level table */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {allLevels.map(({ lv, name, grade }) => {
            const isCurrent = lv === currentLevel
            const isPast    = lv < currentLevel
            return (
              <div
                key={lv}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 14px',
                  background: isCurrent ? `${color}18` : 'transparent',
                  borderLeft: isCurrent ? `2px solid ${color}` : '2px solid transparent',
                  opacity: isPast ? 0.5 : 1,
                }}
              >
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: isCurrent ? color : isPast ? '#44ee44' : 'rgba(255,255,255,0.2)', width: 14, flexShrink: 0 }}>
                  {isCurrent ? '►' : isPast ? '✓' : '·'}
                </div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 8, color: isCurrent ? color : 'rgba(255,255,255,0.3)', width: 28, flexShrink: 0 }}>
                  Lv.{lv}
                </div>
                <div style={{ flex: 1, fontFamily: 'var(--font-thai)', fontSize: 12, color: isCurrent ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)', fontWeight: isCurrent ? 600 : 400 }}>
                  {name}
                </div>
                <div style={{ fontFamily: 'var(--font-thai)', fontSize: 11, color: isCurrent ? color : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                  {grade}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Section 3 — Response Speed ────────────────────────────────────────────────

function ResponseSpeed({ responseTimeLogs }) {
  const subjects = ['thai', 'math', 'eng']
  const subLabels = { thai: 'ภาษาไทย', math: 'คณิต', eng: 'อังกฤษ' }
  const hasAny = subjects.some(s => (responseTimeLogs?.[s]?.length ?? 0) >= 5)
  if (!hasAny) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionTitle>ความเร็วในการตอบ</SectionTitle>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px' }}>
        {subjects.map(sub => {
          const logs = responseTimeLogs?.[sub] ?? []
          if (logs.length < 5) return null
          const recent = logs.slice(-10)
          const prev   = logs.slice(-20, -10)
          const recentAvg = avgSec(recent)
          const prevAvg   = avgSec(prev)
          let trend = null
          if (recentAvg !== null && prevAvg !== null && prev.length >= 5) {
            const diff = prevAvg - recentAvg
            if (diff > 0.3)       trend = { icon: '⚡', text: `เร็วขึ้น ${diff.toFixed(1)} วิ`, color: '#44ee44' }
            else if (diff < -0.3) trend = { icon: '🐢', text: `ช้าลง ${Math.abs(diff).toFixed(1)} วิ`, color: '#EF9F27' }
            else                  trend = { icon: '→', text: 'เท่าเดิม', color: 'rgba(255,255,255,0.4)' }
          }
          return (
            <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ flex: 1, fontFamily: 'var(--font-thai)', fontSize: 13, color: '#fff' }}>{subLabels[sub]}</span>
              {recentAvg !== null && (
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
                  {recentAvg.toFixed(1)} วิ/ข้อ
                </span>
              )}
              {trend && (
                <span style={{ fontFamily: 'var(--font-thai)', fontSize: 11, color: trend.color }}>
                  {trend.icon} {trend.text}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Report() {
  const { state, totalXP } = useAppState()

  const mins   = Math.round(state.mins || 0)
  const rounds = state.rounds || 0
  const acc    = state.acc    || 0
  const streak = state.streak || 0

  const xpThai = state.xpThai || 0
  const xpMath = state.xpMath || 0
  const xpEng  = state.xpEng  || 0
  const maxXP  = Math.max(xpThai, xpMath, xpEng, 1)

  const thaiReadiness = computeReadiness(state.sessionLog, 'thai')
  const mathReadiness = computeReadiness(state.sessionLog, 'math')
  const engReadiness  = computeReadiness(state.sessionLog, 'eng')

  // Section 4 — natural Thai sentences for parents
  const reportLines = (() => {
    const name = state.name || 'ลูก'
    const lines = []
    const xps = { ไทย: xpThai, คณิต: xpMath, อังกฤษ: xpEng }
    const dom  = Object.entries(xps).sort((a, b) => b[1] - a[1])[0]
    const weak = Object.entries(xps).sort((a, b) => a[1] - b[1])[0]

    if (dom[1] > 0) lines.push(`${name}ถนัด${dom[0]}มากที่สุด (XP ${dom[1]} คะแนน)`)

    if (acc >= 85)      lines.push(`ตอบถูกต้อง ${acc}% — แม่นยำมาก แสดงว่าเข้าใจเนื้อหาได้ดี`)
    else if (acc >= 65) lines.push(`ตอบถูกต้อง ${acc}% — อยู่ในเกณฑ์ดี กำลังพัฒนา`)
    else if (acc > 0)   lines.push(`ตอบถูกต้อง ${acc}% — ควรทบทวน${weak[0]}เพิ่มเติม`)

    if (streak >= 10)     lines.push(`Streak ยาวสุด ${streak} วัน — เล่นสม่ำเสมอมาก ดีมาก!`)
    else if (streak >= 3) lines.push(`Streak ${streak} วัน — กำลังสร้างนิสัยการเรียนที่ดี`)

    const logs = state.responseTimeLogs
    if (logs) {
      const subLabels = { thai: 'ไทย', math: 'คณิต', eng: 'อังกฤษ' }
      ;['thai', 'math', 'eng'].forEach(sub => {
        const arr = logs[sub] ?? []
        if (arr.length >= 10) {
          const recent = arr.slice(-5).reduce((s, x) => s + x.timeMs, 0) / 5 / 1000
          const prev   = arr.slice(-10, -5).reduce((s, x) => s + x.timeMs, 0) / 5 / 1000
          if (prev - recent > 0.5) lines.push(`${subLabels[sub]}: คิดเร็วขึ้น ${(prev - recent).toFixed(1)} วินาที/ข้อ`)
        }
      })
    }

    if (weak[1] < dom[1] * 0.5 && dom[1] > 0) {
      lines.push(`แนะนำ: ลอง${weak[0]}เพิ่มขึ้นบ้าง เพื่อให้พัฒนารอบด้าน`)
    }

    return lines
  })()

  // Section 5 — actionable suggestion
  const nextSuggestion = (() => {
    const readMap  = { thai: thaiReadiness, math: mathReadiness, eng: engReadiness }
    const labelMap = { thai: 'ภาษาไทย', math: 'คณิต', eng: 'อังกฤษ' }
    const allStrong = Object.values(readMap).every(r => r === 'strong')
    if (allStrong && (xpThai + xpMath + xpEng) > 0) return 'พร้อมสำหรับระดับถัดไปแล้ว!'
    if (streak === 0 && rounds > 0) return 'เล่นทุกวันสักนิด ช่วยสร้างนิสัยการเรียนได้มาก'
    const readOrder = { notready: 0, exploring: 1, comfortable: 2, strong: 3 }
    const weakSub = Object.entries(readMap).sort((a, b) => readOrder[a[1]] - readOrder[b[1]])[0]
    if (weakSub[1] === 'notready' || weakSub[1] === 'exploring') {
      return `ลองเล่น${labelMap[weakSub[0]]}เพิ่มขึ้น — ยังมีพื้นที่พัฒนาอีกมาก`
    }
    return 'เล่นต่อเนื่องทุกวัน แล้วผลลัพธ์จะดีขึ้นเรื่อยๆ'
  })()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden',
      background: 'var(--px-darkest, #0a0a12)', paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: 11, color: 'var(--px-yellow)',
        letterSpacing: 2, padding: '14px 20px 10px',
        borderBottom: '2px solid var(--px-border)',
        width: '100%', boxSizing: 'border-box',
      }}>
        REPORT
      </div>

      <div style={{ width: '100%', maxWidth: 480, padding: '16px 16px 0' }}>

        {/* Section 1 — Overview */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>ภาพรวม</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <StatCard value={mins}   label="เวลาเล่นทั้งหมด (นาที)" color="#EF9F27" />
            <StatCard value={rounds} label="ด่านที่ผ่าน"              color="#378ADD" />
            <StatCard
              value={`${acc}%`}
              label="ความแม่นยำ"
              color={acc >= 85 ? '#44ee44' : acc >= 65 ? '#EF9F27' : '#E24B4A'}
            />
            <StatCard value={streak} label="Streak สูงสุด (วัน)"    color="#f0c040" />
          </div>
        </div>

        {/* Section 2 — Subject XP */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>วิชาที่เก่ง</SectionTitle>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 14px 6px' }}>
            <XPBar label="ภาษาไทย"      xp={xpThai} maxXP={maxXP} color="#E24B4A" readiness={thaiReadiness} />
            <XPBar label="คณิตศาสตร์"   xp={xpMath} maxXP={maxXP} color="#378ADD" readiness={mathReadiness} />
            <XPBar label="ภาษาอังกฤษ"   xp={xpEng}  maxXP={maxXP} color="#EF9F27" readiness={engReadiness} />
          </div>
        </div>

        {/* Section 3 — Subject Levels */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 16px',
          marginBottom: 24,
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--px-yellow)', letterSpacing: 2, marginBottom: 12 }}>
            LEVEL · GRADE
          </div>
          <div style={{ fontFamily: 'var(--font-thai)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
            กดแต่ละวิชาเพื่อดูตารางระดับทั้งหมด
          </div>
          {['thai', 'math', 'eng'].map(subject => (
            <SubjectLevelCard
              key={subject}
              subject={subject}
              currentLevel={state.subjectLevels?.[subject] ?? 1}
            />
          ))}
        </div>

        {/* Section 4 — Response Speed */}
        <ResponseSpeed responseTimeLogs={state.responseTimeLogs} />

        {/* Section 4 — Parent Report */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>รายงานสำหรับพ่อแม่</SectionTitle>
          {reportLines.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-thai)', fontSize: 13, color: 'rgba(255,255,255,0.4)', padding: 12 }}>
              ยังไม่มีข้อมูลพอ — เล่นเพิ่มแล้วจะมีรายงานให้อ่าน
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reportLines.map((line, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: '3px solid var(--px-yellow)',
                  padding: '8px 12px',
                  fontFamily: 'var(--font-thai)',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.6,
                }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5 — What to do next */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>ควรเล่นอะไรต่อ</SectionTitle>
          <div style={{
            background: 'rgba(240,192,64,0.08)',
            border: '2px solid rgba(240,192,64,0.35)',
            padding: '12px 14px',
            fontFamily: 'var(--font-thai)',
            fontSize: 13,
            color: '#f0c040',
            lineHeight: 1.7,
          }}>
            {nextSuggestion}
          </div>
        </div>

      </div>
    </div>
  )
}
