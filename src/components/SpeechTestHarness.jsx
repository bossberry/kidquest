// SpeechTestHarness.jsx — dev-only tool for verifying real speech-recognition
// quality on a real phone (Thai + English), since this environment has no
// microphone/live-browser access to test src/lib/speech.js against. Opened
// via ?speechtest=1 (wired in App.jsx, checked before any auth/state gate —
// this page needs no login and touches no app state). NOT part of the child-
// facing app; never linked from anywhere in the normal UI.
//
// Privacy: identical guarantee as the real ReadAloud minigame — recognition
// runs entirely through the browser's own SpeechRecognition API. This page
// only ever displays the transcript text + similarity score on screen; it
// never records, stores, or transmits audio anywhere.
import React, { useState } from 'react'
import { isSpeechAvailable, startListening, similarity, classifyMatch, isPermissionError } from '../lib/speech.js'

const PRESETS = {
  'th-TH': ['แมว', 'สวัสดี', 'ขอบคุณ', 'กา', 'ปลา', 'ช้าง'],
  'en-US': ['cat', 'hello', 'thank you', 'dog', 'fish', 'elephant'],
}

export default function SpeechTestHarness() {
  const [lang, setLang] = useState('th-TH')
  const [expected, setExpected] = useState(PRESETS['th-TH'][0])
  const [customExpected, setCustomExpected] = useState('')
  const [listening, setListening] = useState(false)
  const [log, setLog] = useState([])
  const speechOk = isSpeechAvailable()

  function runTest() {
    if (!speechOk || listening) return
    const target = customExpected.trim() || expected
    setListening(true)
    const { promise } = startListening(target, { lang, timeoutMs: 6000 })
    promise.then(({ heard, match, unavailable, errorCode }) => {
      setListening(false)
      const tier = classifyMatch(match)
      setLog(l => [{
        ts: new Date().toLocaleTimeString(),
        lang, expected: target, heard, match: match.toFixed(2), tier, unavailable,
        errorCode, isPermissionIssue: isPermissionError(errorCode),
      }, ...l].slice(0, 30))
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'auto', background: '#111',
      color: '#eee', fontFamily: 'monospace', padding: 16, boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🔧 Speech Test Harness (dev only)</div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
        Not part of the app — opened via ?speechtest=1. Tests src/lib/speech.js's
        real SpeechRecognition wrapper against real mic input. Nothing is
        recorded/uploaded — this page only reads the transcript the browser's
        own speech API returns.
      </div>

      <div style={{ marginBottom: 8 }}>
        SpeechRecognition available on this device: <b style={{ color: speechOk ? '#7CFC7C' : '#ff6666' }}>{String(speechOk)}</b>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['th-TH', 'en-US'].map(l => (
          <button key={l} onClick={() => { setLang(l); setExpected(PRESETS[l][0]) }}
            style={{ padding: '8px 14px', background: lang === l ? '#4444aa' : '#333', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>Expected phrase (preset):</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {PRESETS[lang].map(p => (
          <button key={p} onClick={() => { setExpected(p); setCustomExpected('') }}
            style={{
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              background: expected === p && !customExpected ? '#4444aa' : '#222',
              color: '#fff', border: '1px solid #444',
            }}>{p}</button>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        or custom: <input
          value={customExpected}
          onChange={e => setCustomExpected(e.target.value)}
          placeholder="type an expected phrase..."
          style={{ padding: 6, background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 6, width: 220 }}
        />
      </div>

      <button
        onClick={runTest}
        disabled={!speechOk || listening}
        style={{
          padding: '14px 28px', fontSize: 16, borderRadius: 8, border: 'none', cursor: 'pointer',
          background: listening ? '#EF9F27' : '#4444aa', color: '#fff', marginBottom: 20,
        }}
      >
        {listening ? '🎤 Listening...' : '🎤 Tap to test'}
      </button>

      <div style={{ fontSize: 13, color: '#999', marginBottom: 6 }}>Log (newest first):</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {log.map((entry, i) => (
          <div key={i} style={{
            padding: 10, borderRadius: 6, background: '#1c1c1c',
            border: `1px solid ${entry.tier === 'correct' ? '#2e6b2e' : entry.tier === 'almost' ? '#6b5e2e' : '#6b2e2e'}`,
          }}>
            <div>{entry.ts} · {entry.lang}</div>
            <div>expected: <b>{entry.expected}</b></div>
            <div>heard: <b>{entry.unavailable ? '(unavailable)' : entry.heard || '(nothing heard)'}</b></div>
            <div>match: <b>{entry.match}</b> → <span style={{
              color: entry.tier === 'correct' ? '#7CFC7C' : entry.tier === 'almost' ? '#FFD700' : '#ff6666',
            }}>{entry.tier}</span></div>
            {entry.errorCode && (
              <div>errorCode: <b style={{ color: entry.isPermissionIssue ? '#ff6666' : '#999' }}>
                {entry.errorCode}{entry.isPermissionIssue ? ' (PERMISSION/HARDWARE ISSUE — app would fall back to listening mode here)' : ''}
              </b></div>
            )}
          </div>
        ))}
        {log.length === 0 && <div style={{ color: '#666' }}>No attempts yet.</div>}
      </div>
    </div>
  )
}
