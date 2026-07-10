import React from 'react'
import EggCanvasCore from '../egg/EggCanvas.jsx'
import { useAppState } from '../context/StateContext.jsx'
import { useCompanion } from '../context/CompanionContext.jsx'
import { EGG_STAGE_NAMES } from '../lib/eggAlgorithm.js'

function stageToAura(s) {
  if (s >= 8) return 4
  if (s >= 6) return 3
  if (s >= 4) return 2
  if (s >= 2) return 1
  return 0
}

const AFFINITY_LABEL_TH = {
  sage: 'สายปราชญ์ · ภาษาไทย',
  architect: 'สายสถาปนิก · คณิตศาสตร์',
  explorer: 'สายนักผจญภัย · ภาษาอังกฤษ',
  prism: 'สายรุ้ง · สมดุลทุกวิชา',
}

function formatDate(ms) {
  if (!ms) return ''
  try {
    return new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}

/**
 * EvolutionAlbum — SPEC GAME-A §A.2 permanent record of every stage-up the
 * companion has gone through. Opened from Room.jsx's bookshelf detail sheet.
 * Renders each evolutionAlbum entry with a live re-render of that historical
 * form (element/eye/gender never change, so only stage+affinityLine differ
 * per entry — no stored pixel snapshot needed).
 */
export default function EvolutionAlbum({ open, onClose }) {
  const { state } = useAppState()
  const { resolved } = useCompanion()
  if (!open) return null

  const album = state.evolutionAlbum || []
  const entries = [...album].reverse() // newest first

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9200,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }}
      />
      <div style={{
        position: 'relative', zIndex: 1,
        height: '72vh', display: 'flex', flexDirection: 'column',
        background: 'rgba(26,16,64,0.94)', backdropFilter: 'blur(14px)',
        borderRadius: '24px 24px 0 0',
        padding: '16px 16px 0',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        animation: 'fadeInUp 0.22s ease both',
        boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10, flexShrink: 0,
        }}>
          <div style={{ fontFamily: 'var(--font-thai)', fontSize: 16, fontWeight: 700, color: '#FFD23F' }}>
            📔 อัลบั้มวิวัฒนาการ
          </div>
          <button
            onClick={onClose}
            aria-label="ปิด"
            style={{
              border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: 8,
              width: 30, height: 30, color: 'rgba(255,255,255,0.7)', fontSize: 14,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 12 }}>
          {entries.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 8, textAlign: 'center', padding: '0 20px',
            }}>
              <div style={{ fontSize: 36 }}>🥚</div>
              <div style={{ fontFamily: 'var(--font-thai)', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                ยังไม่มีวิวัฒนาการ ทำภารกิจต่อไปเพื่อดูไข่เติบโต!
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entries.map((entry, i) => (
                <div
                  key={entry.date ?? i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'rgba(255,255,255,0.05)', borderRadius: 14,
                    padding: 10,
                  }}
                >
                  <div style={{ flexShrink: 0, lineHeight: 0 }}>
                    <EggCanvasCore
                      element={resolved.element} eye={resolved.eye} gender={resolved.gender}
                      stage={entry.stage} aura={stageToAura(entry.stage)}
                      affinityLine={entry.affinityLine}
                      size={56}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-thai)', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                      {EGG_STAGE_NAMES[entry.stage] || `ระดับ ${entry.stage}`}
                    </div>
                    {entry.affinityLine && (
                      <div style={{ fontFamily: 'var(--font-thai)', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                        {AFFINITY_LABEL_TH[entry.affinityLine] || entry.affinityLine}
                      </div>
                    )}
                    <div style={{ fontFamily: 'var(--font-thai)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {formatDate(entry.date)} · เก่งขึ้นแล้ว {entry.masteredCount ?? 0} เรื่อง
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
