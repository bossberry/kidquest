import React from 'react'

// ErrorBoundary — wraps the whole app (main.jsx) AND each top-level screen
// (App.jsx) so a crash in one screen shows a friendly fallback instead of a
// white screen, and can't take the rest of the app down with it.
//
// Child-facing rule (CLAUDE.md): NEVER show a stack trace or technical error
// text to the child. The on-screen copy is always the same friendly Thai line;
// the real error only ever goes to console.error (Sentry later — not now).
//
// Props:
//   name     — optional label for logs (e.g. the screen name)
//   fallback — optional custom fallback node
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, retries: 0 }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Enough detail for debugging; never surfaced to the child.
    console.error(
      `[KidQuest crash]${this.props.name ? ' screen=' + this.props.name : ''}`,
      error,
      info?.componentStack || info,
    )
    // TODO(Phase 5.3): report to Sentry here.
  }

  retry = () => {
    // Try re-rendering the same screen. If it crashes again it'll just re-show
    // the fallback (the reload button below is the guaranteed escape hatch).
    this.setState(s => ({ hasError: false, retries: s.retries + 1 }))
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', padding: 24, textAlign: 'center',
        fontFamily: 'Mitr,sans-serif', color: '#3C3489',
      }}>
        {/* egg with a little bandage 🩹 — friendly, on-brand, no scary iconography */}
        <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 12 }}>
          <div style={{ fontSize: 76, lineHeight: '96px' }}>🥚</div>
          <div style={{ position: 'absolute', right: 6, top: 30, fontSize: 34, transform: 'rotate(18deg)' }}>🩹</div>
        </div>
        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, marginBottom: 6 }}>
          อุ๊ปส์! ลองใหม่นะ
        </div>
        <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 20 }}>
          ไข่น้อยสะดุดนิดหน่อย เดี๋ยวก็หายดี 💛
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={this.retry}
            style={{ background: '#7F77DD', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 26px', fontFamily: 'Mitr,sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            🔄 ลองใหม่
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#EFEDFB', color: '#3C3489', border: 'none', borderRadius: 14, padding: '12px 22px', fontFamily: 'Mitr,sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            🏠 เริ่มใหม่
          </button>
        </div>
      </div>
    )
  }
}
