import React from 'react'
import { useAppState } from '../context/StateContext.jsx'

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
  const domSub = thaiPct>=engPct&&thaiPct>=mathPct?'ภาษาไทย 📖':engPct>=mathPct?'English 🔤':'Math 🔢'
  const weakSub = thaiPct<=engPct&&thaiPct<=mathPct?'ภาษาไทย 📖':engPct<=mathPct?'English 🔤':'Math 🔢'
  const speedLabel = (state.speed||50)>70?'เร็วมาก ⚡':(state.speed||50)>45?'ปานกลาง 👍':'ช้าแต่คิดดี 🤔'
  const accLabel = acc>85?'แม่นมาก 🎯':acc>65?'ดี 👍':'ยังพัฒนาอยู่ 💪'
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
      <div className="page-header"><div className="page-title">📊 รีพอร์ต</div></div>
      <div className="report-body">
        <div className="report-card">
          <div className="rc-title"><span className="rc-icon">👤</span>ภาพรวมของ {state.name||'ลูก'}</div>
          <div className="time-grid">
            <div className="time-item"><div className="time-val">{totalTime}</div><div className="time-lbl">นาทีทั้งหมด</div></div>
            <div className="time-item"><div className="time-val">{rounds}</div><div className="time-lbl">ด่านที่ผ่าน</div></div>
            <div className="time-item"><div className="time-val">{acc}%</div><div className="time-lbl">ความแม่นยำ</div></div>
            <div className="time-item"><div className="time-val">{streak}🔥</div><div className="time-lbl">Streak</div></div>
          </div>
        </div>
        <div className="report-card">
          <div className="rc-title"><span className="rc-icon">⏱️</span>เวลาที่ใช้ต่อวิชา</div>
          <BarRow label="📖 ภาษาไทย" pct={thaiPct} mins={thaiMins} color="var(--green)" />
          <BarRow label="🔤 English" pct={engPct} mins={engMins} color="var(--blue)" />
          <BarRow label="🔢 Math" pct={mathPct} mins={mathMins} color="var(--purple)" />
        </div>
        <div className="report-card">
          <div className="rc-title"><span className="rc-icon">💡</span>จุดแข็ง & ความถนัด</div>
          {[
            {icon:'🌟', text:`วิชาที่ถนัดที่สุด: ${domSub}`, tag:'var(--green-l)', tagColor:'var(--green-d)'},
            {icon:'🎯', text:`ความเร็วในการตอบ: ${speedLabel}`, tag:'var(--amber-l)', tagColor:'var(--amber-d)'},
            {icon:'✅', text:`ความแม่นยำ: ${accLabel}`, tag:'var(--blue-l)', tagColor:'var(--blue-d)'},
            {icon:'⚖️', text:`ความสมดุลระหว่างวิชา: ${balance}%${balance>75?' (เรียนรอบด้านดีมาก!)':balance>50?' (กำลังพัฒนา)':' (ควรเพิ่มวิชาที่ขาด)'}`, tag:'var(--purple-l)', tagColor:'var(--purple-d)'},
          ].map(r => (
            <div key={r.icon} className="insight-row">
              <div className="insight-icon">{r.icon}</div>
              <div className="insight-text">{r.text}</div>
            </div>
          ))}
        </div>
        <div className="report-card" style={{ background:'var(--purple-l)', borderColor:'var(--purple)' }}>
          <div className="rc-title" style={{ color:'var(--purple-d)' }}><span className="rc-icon">📈</span>เทียบกับเด็กวัยเดียวกัน</div>
          <div style={{ fontSize:13, color:'var(--purple-d)', lineHeight:1.7 }}>
            เด็กอายุ 5-6 ขวบส่วนใหญ่จะเล่นได้ประมาณ <strong>5-10 นาที/วัน</strong> —{' '}
            {state.name||'ลูก'}เล่นไป <strong>{totalTime} นาที</strong> รวม {rounds} รอบ{' '}
            {totalTime > 15 ? ' ซึ่งสูงกว่าค่าเฉลี่ย 👏' : ' ยังมีพื้นที่พัฒนาได้อีก'}
          </div>
          <div style={{ fontSize:12, color:'var(--purple-d)', marginTop:8, opacity:.8 }}>* ข้อมูลอ้างอิงจากงานวิจัยด้านพัฒนาการเด็ก 5-6 ขวบ</div>
        </div>
      </div>
    </div>
  )
}
