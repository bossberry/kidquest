import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('KidQuest crash:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', padding:24, fontFamily:'Mitr,sans-serif', textAlign:'center', background:'#FFFDF7' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>😵</div>
          <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:'#3C3489', marginBottom:8 }}>เกิดข้อผิดพลาด</div>
          <div style={{ fontSize:13, color:'#6b6b6b', marginBottom:20, maxWidth:360, lineHeight:1.6 }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => { this.setState({ hasError:false, error:null }); window.location.reload() }}
            style={{ background:'#7F77DD', color:'#fff', border:'none', borderRadius:12, padding:'12px 28px', fontFamily:'Mitr,sans-serif', fontSize:15, fontWeight:600, cursor:'pointer' }}
          >
            🔄 โหลดใหม่
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
