// TeachingVisual.jsx — renders the small animated explanation for a teaching
// template (src/lib/teachingMoments.js's TEACHING_TEMPLATES). Each visual is a
// simple staged reveal (a step counter ticking on an interval) rather than a
// bespoke canvas animation per type, matching this project's established
// "reuse simple primitives over new bespoke systems" pattern for celebratory/
// explanatory UI (e.g. Phase 1.1's NODE_MASTERED celebration reused
// spawnConfetti/showToast rather than a new cutscene component).
import React, { useState, useEffect } from 'react'
import { playTone } from '../lib/audio.js'

function useStep(maxStep, intervalMs = 700) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    setStep(0)
    if (maxStep <= 0) return
    const t = setInterval(() => {
      setStep(s => {
        if (s + 1 >= maxStep) { clearInterval(t); return maxStep }
        playTone('tap')
        return s + 1
      })
    }, intervalMs)
    return () => clearInterval(t)
  }, [maxStep]) // eslint-disable-line
  return step
}

const dotStyle = (visible) => ({
  fontSize: 32, transition: 'opacity .3s, transform .3s',
  opacity: visible ? 1 : 0.15, transform: visible ? 'scale(1)' : 'scale(0.6)',
  display: 'inline-block', margin: '0 3px',
})

function CountingObjects({ template }) {
  const n = template.example.items
  const step = useStep(n)
  return (
    <div>
      <div>{Array.from({ length: n }, (_, i) => (
        <span key={i} style={dotStyle(i <= step)}>{template.emoji}</span>
      ))}</div>
      <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>{template.example.label}</div>
    </div>
  )
}

function CountingSequence({ template, up }) {
  const { a, b, answer } = template.example
  const nums = up
    ? [a, ...Array.from({ length: b }, (_, i) => a + i + 1)]
    : [a, ...Array.from({ length: b }, (_, i) => a - i - 1)]
  const step = useStep(nums.length)
  return (
    <div style={{ fontSize: 30, fontFamily: "'Fredoka One',cursive", display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
      {nums.map((n, i) => (
        <span key={i} style={{
          ...dotStyle(i <= step),
          fontSize: 30,
          color: i === step ? '#FFD700' : '#fff',
        }}>{n}</span>
      ))}
      {step >= nums.length - 1 && <span style={{ opacity: 0.7, fontSize: 20, alignSelf: 'center' }}>= {answer}</span>}
    </div>
  )
}

function SkipCounting({ template }) {
  const { groupSize, groupCount, answer } = template.example
  const step = useStep(groupCount)
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {Array.from({ length: groupCount }, (_, g) => (
          <div key={g} style={{ ...dotStyle(g <= step), display: 'inline-flex', gap: 3 }}>
            {Array.from({ length: groupSize }, (_, d) => <span key={d}>⚪</span>)}
          </div>
        ))}
      </div>
      {step >= groupCount - 1 && <div style={{ marginTop: 8, fontSize: 18, color: '#FFD700' }}>รวม = {answer}</div>}
    </div>
  )
}

function SharingGroups({ template }) {
  const { total, groups, perGroup } = template.example
  const step = useStep(total)
  return (
    <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
      {Array.from({ length: groups }, (_, g) => {
        const filled = Array.from({ length: perGroup }, (_, i) => g + i * groups).filter(idx => idx <= step).length
        return (
          <div key={g} style={{ border: '2px dashed rgba(255,255,255,0.3)', borderRadius: 10, padding: 8, minWidth: 50 }}>
            {Array.from({ length: filled }, (_, i) => <div key={i}>🟡</div>)}
          </div>
        )
      })}
    </div>
  )
}

function ConfusablePair({ template }) {
  const [entryA, entryB] = template.example.entries
  const step = useStep(2, 900)
  return (
    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center' }}>
      {[entryA, entryB].map((e, i) => e && (
        <div key={i} style={{
          fontSize: 40, fontFamily: "'Fredoka One',cursive",
          padding: '10px 18px', borderRadius: 12,
          background: i === step ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)',
          border: i === step ? '2px solid #FFD700' : '2px solid transparent',
          transition: 'all .3s',
        }}>
          {e.c}
          <div style={{ fontSize: 12, opacity: 0.7 }}>{e.exampleWord} {e.emoji}</div>
        </div>
      ))}
    </div>
  )
}

function VowelLength({ template }) {
  const { short, long } = template.example
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, animation: 'teach-quick-pulse .5s ease infinite' }}>{short.example}</div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>สั้น {short.emoji}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, textShadow: '0 0 10px rgba(255,215,0,0.8)' }}>{long.example}</div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>ยาว {long.emoji}</div>
      </div>
      <style>{'@keyframes teach-quick-pulse{0%,100%{opacity:1}50%{opacity:.4}}'}</style>
    </div>
  )
}

function ToneContrast({ template }) {
  const { set } = template.example
  const step = useStep(set.set.length, 800)
  return (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
      {set.set.map((w, i) => (
        <div key={i} style={{ ...dotStyle(i <= step), fontSize: 26 }}>{w}</div>
      ))}
    </div>
  )
}

function LetterBlend({ template, word, emoji }) {
  const chars = [...word]
  const step = useStep(chars.length + 1, 550)
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', fontSize: 30, fontFamily: "'Fredoka One',cursive" }}>
        {chars.map((c, i) => <span key={i} style={dotStyle(i <= step)}>{c}</span>)}
      </div>
      {step >= chars.length && <div style={{ marginTop: 10, fontSize: 26 }}>{word} {emoji}</div>}
    </div>
  )
}

function LetterReveal({ template }) {
  useStep(1, 400)
  return <div style={{ fontSize: 64, fontFamily: "'Fredoka One',cursive" }}>{template.example.letter}</div>
}

export default function TeachingVisual({ template }) {
  switch (template.visual) {
    case 'counting_objects': return <CountingObjects template={template} />
    case 'counting_up': return <CountingSequence template={template} up />
    case 'counting_down': return <CountingSequence template={template} up={false} />
    case 'skip_counting': return <SkipCounting template={template} />
    case 'sharing_groups': return <SharingGroups template={template} />
    case 'confusable_pair': return <ConfusablePair template={template} />
    case 'vowel_length': return <VowelLength template={template} />
    case 'tone_contrast': return <ToneContrast template={template} />
    case 'cvc_blend': return <LetterBlend template={template} word={template.example.w} emoji={template.example.emoji} />
    case 'phonics_sequence': return <LetterBlend template={template} word={template.example.w} emoji={template.example.emoji} />
    case 'letter_reveal': return <LetterReveal template={template} />
    default: return <div style={{ fontSize: 48 }}>{template.emoji}</div>
  }
}
