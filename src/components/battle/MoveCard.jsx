import React from 'react'

export default function MoveCard({ content, isSelected, isMiss, onTap, disabled }) {
  const str = String(content)
  const isEmoji = str.length <= 2
  const fs = isEmoji ? 30 : str.length <= 4 ? 26 : str.length <= 8 ? 18 : 14
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      className={`move-card-btn px-answer-card${isMiss ? ' wrong' : ''}`}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        touchAction: 'manipulation',
        animation: isSelected ? 'move-pulse .22s ease' : undefined,
        opacity: isMiss ? 0.4 : 1,
        userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
      <div style={{
        fontFamily: isEmoji ? 'system-ui,sans-serif' : "'Fredoka One',Sarabun,Mitr,sans-serif",
        fontSize: fs, color: '#fff', lineHeight: 1.2,
      }}>
        {content}
      </div>
    </button>
  )
}
