import React, { useState, useCallback } from 'react'
import EggCanvasCore from '../egg/EggCanvas.jsx'
import { EYE_STYLE_KEYS, EYE_STYLES } from '../egg/eggEyeLayer.js'
import { useCompanion } from '../context/CompanionContext.jsx'

const ELEMENTS = [
  { key: 'fire',    label: 'ไฟ',      emoji: '🔥', color: '#ef5420' },
  { key: 'water',   label: 'น้ำ',      emoji: '💧', color: '#3a6f95' },
  { key: 'thunder', label: 'สายฟ้า',   emoji: '⚡', color: '#e0a81a' },
  { key: 'nature',  label: 'ไม้',      emoji: '🌿', color: '#5d9c55' },
  { key: 'shadow',  label: 'เงา',      emoji: '🌑', color: '#6a5f86' },
  { key: 'light',   label: 'แสง',      emoji: '✨', color: '#e8c060' },
]

const GENDERS = [
  { key: 'male',   label: '♂ ชาย' },
  { key: 'female', label: '♀ หญิง' },
]

const EYE_LABELS_TH = {
  gba:       'โปเกมอน',
  tama:      'ทามาก็อตชิ',
  sanrio:    'ซันริโอ',
  summoners: 'วอร์ริเออร์',
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'linear-gradient(160deg,#1a1040 0%,#0d2240 60%,#1a3020 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    overflowY: 'auto', padding: '24px 16px 40px',
  },
  title: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 13, color: '#ffe9a8', marginBottom: 4, textAlign: 'center', letterSpacing: 1,
  },
  subtitle: {
    fontFamily: "'Sarabun', sans-serif",
    fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 18, textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: "'Sarabun', sans-serif",
    fontSize: 15, fontWeight: 700, color: '#fff8d8', marginBottom: 8, alignSelf: 'flex-start',
  },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 18, width: '100%', maxWidth: 340 },
  elementBtn: (active, color) => ({
    flex: '1 1 80px', minWidth: 80, padding: '10px 6px', borderRadius: 8,
    border: active ? `2.5px solid ${color}` : '2.5px solid rgba(255,255,255,0.15)',
    background: active ? `${color}30` : 'rgba(255,255,255,0.05)',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    boxShadow: active ? `0 0 12px ${color}66` : 'none',
    transition: 'all .15s',
  }),
  elementEmoji: { fontSize: 22 },
  elementLabel: {
    fontFamily: "'Sarabun', sans-serif", fontSize: 12, color: '#fff', fontWeight: 700,
  },
  eyeBtn: (active) => ({
    flex: '1 1 70px', padding: '8px 4px', borderRadius: 8,
    border: active ? '2.5px solid #ffe9a8' : '2.5px solid rgba(255,255,255,0.15)',
    background: active ? 'rgba(255,233,168,0.15)' : 'rgba(255,255,255,0.05)',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    transition: 'all .15s',
  }),
  eyeLabel: {
    fontFamily: "'Sarabun', sans-serif", fontSize: 10, color: '#fff8d8', fontWeight: 600, textAlign: 'center',
  },
  genderBtn: (active) => ({
    flex: 1, padding: '12px 8px', borderRadius: 8,
    border: active ? '2.5px solid #ff8fa8' : '2.5px solid rgba(255,255,255,0.15)',
    background: active ? 'rgba(255,143,168,0.15)' : 'rgba(255,255,255,0.05)',
    cursor: 'pointer', fontFamily: "'Sarabun', sans-serif",
    fontSize: 16, fontWeight: 700, color: '#fff',
    transition: 'all .15s',
  }),
  confirmBtn: {
    width: '100%', maxWidth: 300, padding: '14px 16px', marginTop: 8,
    background: 'linear-gradient(135deg,#6a34c8,#4a1890)',
    border: '2px solid #9b6bff', borderRadius: 8, cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#ffe9a8', lineHeight: 1.6,
    boxShadow: '0 0 16px rgba(106,52,200,0.5)',
  },
  warning: {
    fontFamily: "'Sarabun', sans-serif", fontSize: 12, color: 'rgba(255,200,100,0.8)',
    textAlign: 'center', marginTop: 6, maxWidth: 280,
  },
  confirmDialog: {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dialogBox: {
    background: '#1a1040', border: '2px solid #9b6bff', borderRadius: 12,
    padding: '28px 24px', maxWidth: 300, width: '90%', textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  dialogText: {
    fontFamily: "'Sarabun', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8,
  },
  dialogSub: {
    fontFamily: "'Sarabun', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20,
  },
  dialogOk: {
    width: '100%', padding: '12px', borderRadius: 8, marginBottom: 8,
    background: '#6a34c8', border: 'none', cursor: 'pointer',
    fontFamily: "'Sarabun', sans-serif", fontSize: 16, fontWeight: 700, color: '#ffe9a8',
  },
  dialogBack: {
    width: '100%', padding: '10px', borderRadius: 8,
    background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
    fontFamily: "'Sarabun', sans-serif", fontSize: 14, color: '#fff',
  },
  error: {
    fontFamily: "'Sarabun', sans-serif", fontSize: 13, color: '#ff6b6b',
    marginTop: 8, textAlign: 'center',
  },
}

export default function CompanionCreation() {
  const { createCompanion } = useCompanion()
  const [element, setElement] = useState('fire')
  const [eye,     setEye]     = useState(EYE_STYLE_KEYS[0])
  const [gender,  setGender]  = useState('male')
  const [confirming, setConfirming] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  const handleConfirm = useCallback(async () => {
    setSaving(true)
    setError(null)
    const { error: err } = await createCompanion(eye, gender, element)
    if (err) {
      setSaving(false)
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setConfirming(false)
    }
    // On success, CompanionContext updates companion → App re-renders → modal unmounts
  }, [eye, gender, element, createCompanion])

  // Prevent any escape / outside click from closing
  const eatEvent = useCallback((e) => { e.stopPropagation() }, [])

  const previewSize = 160

  return (
    <div style={styles.overlay} onKeyDown={eatEvent}>
      {/* Confirm dialog */}
      {confirming && (
        <div style={styles.confirmDialog} onClick={eatEvent}>
          <div style={styles.dialogBox}>
            <div style={styles.dialogText}>แน่ใจไหม?</div>
            <div style={styles.dialogSub}>เลือกแล้วแก้ไขไม่ได้อีก</div>
            <button style={styles.dialogOk} onClick={handleConfirm} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'ตกลง'}
            </button>
            <button style={styles.dialogBack} onClick={() => setConfirming(false)} disabled={saving}>
              ย้อนกลับ
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.title}>เลือกคู่หูของคุณ</div>
      <div style={styles.subtitle}>เลือกแล้วจะอยู่กับคุณตลอดไป</div>

      {/* Live preview */}
      <div style={{ marginBottom: 20 }}>
        <EggCanvasCore
          element={element}
          eye={eye}
          gender={gender}
          mood="normal"
          anim="idle"
          stage={1}
          aura={0}
          size={previewSize}
          style={{ borderRadius: 12, boxShadow: '0 0 32px rgba(106,52,200,0.4)' }}
        />
      </div>

      {/* Element picker */}
      <div style={styles.sectionLabel}>🌟 ธาตุ</div>
      <div style={styles.row}>
        {ELEMENTS.map(el => (
          <button
            key={el.key}
            style={styles.elementBtn(element === el.key, el.color)}
            onClick={() => setElement(el.key)}
          >
            <span style={styles.elementEmoji}>{el.emoji}</span>
            <span style={styles.elementLabel}>{el.label}</span>
          </button>
        ))}
      </div>

      {/* Eye picker */}
      <div style={styles.sectionLabel}>👁 ตา</div>
      <div style={styles.row}>
        {EYE_STYLE_KEYS.map(k => (
          <button key={k} style={styles.eyeBtn(eye === k)} onClick={() => setEye(k)}>
            <EggCanvasCore
              element={element}
              eye={k}
              gender={gender}
              mood="normal"
              anim="idle"
              stage={1}
              aura={0}
              size={52}
              style={{ borderRadius: 6 }}
            />
            <span style={styles.eyeLabel}>{EYE_LABELS_TH[k] || k}</span>
          </button>
        ))}
      </div>

      {/* Gender picker */}
      <div style={styles.sectionLabel}>✨ เพศ</div>
      <div style={{ ...styles.row, gap: 12 }}>
        {GENDERS.map(g => (
          <button key={g.key} style={styles.genderBtn(gender === g.key)} onClick={() => setGender(g.key)}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Confirm button */}
      <button style={styles.confirmBtn} onClick={() => setConfirming(true)}>
        ยืนยันคู่หู
      </button>
      <div style={styles.warning}>เลือกแล้วเปลี่ยนไม่ได้นะ</div>
      {error && <div style={styles.error}>{error}</div>}
    </div>
  )
}
