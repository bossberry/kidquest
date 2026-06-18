import React from 'react'

const THAI_NUMS = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า',
  'สิบ','สิบเอ็ด','สิบสอง','สิบสาม','สิบสี่','สิบห้า','สิบหก','สิบเจ็ด','สิบแปด','สิบเก้า','ยี่สิบ']

export function numTh(n) { return THAI_NUMS[n] ?? String(n) }

export function mathToThai(q) {
  if (!q) return ''
  if (q.isCount) return 'มีกี่อัน'
  if (q.isPattern) return 'อะไรมาต่อ'
  if (q.isWord || q.a === undefined) return ''
  const opTh = q.op === '+' ? 'บวก' : q.op === '-' ? 'ลบ' : ''
  return opTh ? `${numTh(q.a)} ${opTh} ${numTh(q.b)} เท่ากับ เท่าไหร่` : ''
}

export default function HintBar({ q, subject }) {
  if (subject !== 'math') return null
  if (!q || q.isCount || q.isPattern || q.isWord || q.a === undefined) return null
  const numA = Math.min(q.a, 10)
  const numB = Math.min(q.b, 10)
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
      <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'center', maxWidth:80 }}>
        {Array.from({ length: numA }, (_, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:'50%', background:'#4488ff', boxShadow:'0 0 4px #4488ff88' }} />
        ))}
      </div>
      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:18, fontWeight:'bold' }}>{q.op}</div>
      <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'center', maxWidth:80 }}>
        {Array.from({ length: numB }, (_, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:'50%', background:'#ff8844', boxShadow:'0 0 4px #ff884488' }} />
        ))}
      </div>
      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:18 }}>= ?</div>
    </div>
  )
}
