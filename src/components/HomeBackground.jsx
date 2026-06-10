import React from 'react'

// Static star positions for night sky
const STAR_DEFS = [
  [4,8,2,0],[6,20,1.5,0.8],[3,36,2.5,1.4],[9,55,1.5,0.4],
  [5,72,2,2.0],[12,85,1.5,1.1],[15,15,1.5,1.8],[18,48,2,0.6],
  [14,64,1.5,2.3],[20,30,1.5,1.6],[22,78,2,0.9],[25,5,1.5,2.1],
]

// Flower positions along the grass edge
const FLOWER_DEFS = [
  { l:'13%', b:'34.5%', c:'#FF88AA' },
  { l:'27%', b:'35.0%', c:'#FFCC44' },
  { l:'61%', b:'35.2%', c:'#99DDFF' },
  { l:'76%', b:'34.7%', c:'#FFAACC' },
  { l:'45%', b:'36.2%', c:'#FFEE88' },
  { l:'88%', b:'35.0%', c:'#AAF088' },
]

// Night magic particle positions
const MAGIC_DEFS = [
  ['22%','42%','0s'],['74%','38%','1.2s'],['44%','35%','2.5s'],
  ['60%','47%','0.6s'],['35%','51%','1.9s'],
]

export default function HomeBackground({ hour }) {
  const h = hour ?? new Date().getHours()
  const isDay = h >= 6 && h < 19
  const isSunset = h >= 17 && h < 19
  const isDawn = h >= 5 && h < 8

  // Sky gradient
  const sky = isDay
    ? isSunset
      ? 'linear-gradient(180deg,#E87040 0%,#F5A060 20%,#FFC888 45%,#FFE4C0 70%,#FFF4E8 100%)'
      : isDawn
      ? 'linear-gradient(180deg,#F08860 0%,#F8B870 22%,#FFD898 46%,#FFF0D8 72%,#FFFAEE 100%)'
      : 'linear-gradient(180deg,#62C8E8 0%,#90D8F8 24%,#C0ECFF 54%,#FFF8E8 78%,#FFECD8 100%)'
    : 'linear-gradient(180deg,#050C1C 0%,#0C1C38 32%,#162848 62%,#1E1A3A 82%,#26183E 100%)'

  const sunBg = isSunset
    ? 'radial-gradient(circle at 40% 36%,#FF9060 0%,#FF5818 55%,#FF3800 85%)'
    : 'radial-gradient(circle at 40% 34%,#FFF888 0%,#FFD700 50%,#FFC400 85%)'
  const sunGlow = isSunset
    ? '0 0 28px 12px rgba(255,120,30,0.42),0 0 55px 26px rgba(255,70,0,0.15)'
    : '0 0 28px 12px rgba(255,215,50,0.48),0 0 65px 30px rgba(255,195,30,0.18)'

  // Hill colors
  const hFar = isDay ? 'rgba(118,192,88,0.40)' : 'rgba(18,35,60,0.62)'
  const hNear = isDay ? 'rgba(98,178,68,0.50)' : 'rgba(14,28,50,0.70)'

  // Ground colors
  const grass = isDay
    ? 'linear-gradient(180deg,#78C848 0%,#5EB032 25%,#489820 55%,#3A8018 100%)'
    : 'linear-gradient(180deg,#142C16 0%,#0E2010 45%,#0A1A0E 100%)'
  const trunkC = isDay ? '#5A3808' : '#182818'
  const leafC1 = isDay
    ? 'radial-gradient(ellipse,#6EC040 0%,#4A9828 55%,#388020 100%)'
    : 'radial-gradient(ellipse,#1C3C1E 0%,#122816 100%)'
  const leafC2 = isDay
    ? 'radial-gradient(ellipse,#76CC4A 0%,#54A632 55%,#3E8C22 100%)'
    : 'radial-gradient(ellipse,#182E1A 0%,#101E10 100%)'
  const bushC = isDay ? 'rgba(84,172,48,0.82)' : 'rgba(14,38,16,0.78)'
  const pathC = isDay
    ? 'linear-gradient(180deg,rgba(210,180,120,0.55) 0%,rgba(190,158,100,0.32) 100%)'
    : 'linear-gradient(180deg,rgba(35,55,80,0.52) 0%,rgba(25,42,65,0.30) 100%)'
  const nestGlow = isDay
    ? 'radial-gradient(ellipse,rgba(255,230,90,0.22) 0%,rgba(255,200,50,0.08) 55%,transparent 78%)'
    : 'radial-gradient(ellipse,rgba(90,65,180,0.20) 0%,rgba(55,35,130,0.08) 55%,transparent 78%)'

  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:-1 }}>

      {/* Sky */}
      <div style={{ position:'absolute', inset:0, background:sky }} />

      {/* Sun (day) */}
      {isDay && (
        <div style={{
          position:'absolute', top:'5%', right:'11%',
          width:56, height:56, borderRadius:'50%',
          background:sunBg, boxShadow:sunGlow,
        }} />
      )}

      {/* Moon + crescent (night) */}
      {!isDay && (
        <>
          <div style={{
            position:'absolute', top:'6%', right:'14%',
            width:44, height:44, borderRadius:'50%',
            background:'radial-gradient(circle at 38% 32%,#F8F0C0 0%,#EADC70 52%,#D8C840 82%)',
            boxShadow:'0 0 22px 9px rgba(240,220,95,0.28),0 0 48px 22px rgba(240,218,80,0.10)',
          }} />
          <div style={{
            position:'absolute', top:'7%', right:'11%',
            width:34, height:34, borderRadius:'50%',
            background:'#0C1C38', opacity:0.88,
          }} />
        </>
      )}

      {/* Stars (night) */}
      {!isDay && STAR_DEFS.map(([top, left, sz, delay], i) => (
        <div key={i} style={{
          position:'absolute', top:`${top}%`, left:`${left}%`,
          width:sz, height:sz, borderRadius:'50%',
          background:'rgba(255,252,230,0.92)',
          animation:`hbg-twinkle ${2.8+(i%3)*0.6}s ease-in-out ${delay}s infinite`,
        }} />
      ))}

      {/* Clouds (day) — shape + drift via CSS class */}
      {isDay && (
        <>
          <div className="hbg-cloud hbg-cloud-1" />
          <div className="hbg-cloud hbg-cloud-2" />
          <div className="hbg-cloud hbg-cloud-3" />
        </>
      )}

      {/* Distant hills */}
      <div style={{
        position:'absolute', bottom:'36%', left:'-8%',
        width:'65%', height:'14%',
        borderRadius:'50% 50% 0 0 / 100% 100% 0 0',
        background:`linear-gradient(180deg,${hFar} 0%,transparent 100%)`,
      }} />
      <div style={{
        position:'absolute', bottom:'34%', right:'-6%',
        width:'55%', height:'11%',
        borderRadius:'50% 50% 0 0 / 100% 100% 0 0',
        background:`linear-gradient(180deg,${hFar} 0%,transparent 100%)`,
      }} />
      <div style={{
        position:'absolute', bottom:'32%', left:'-4%',
        width:'50%', height:'10%',
        borderRadius:'50% 50% 0 0 / 100% 100% 0 0',
        background:`linear-gradient(180deg,${hNear} 0%,transparent 100%)`,
      }} />

      {/* Grass / ground — covers bottom 36% with gentle hill curve */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'36%',
        background:grass, borderRadius:'44% 44% 0 0 / 22% 22% 0 0',
      }} />

      {/* Left tree */}
      <div style={{ position:'absolute', bottom:'26%', left:'5%' }}>
        <div style={{ position:'relative', width:40, height:50 }}>
          <div style={{
            position:'absolute', bottom:0, left:14,
            width:12, height:38, background:trunkC, borderRadius:3,
          }} />
          <div style={{
            position:'absolute', bottom:26, left:0,
            width:40, height:44,
            background:leafC1, borderRadius:'50% 50% 42% 42%',
          }} />
        </div>
      </div>

      {/* Right tree */}
      <div style={{ position:'absolute', bottom:'27%', right:'6%' }}>
        <div style={{ position:'relative', width:34, height:42 }}>
          <div style={{
            position:'absolute', bottom:0, left:11,
            width:10, height:30, background:trunkC, borderRadius:3,
          }} />
          <div style={{
            position:'absolute', bottom:22, left:0,
            width:34, height:38,
            background:leafC2, borderRadius:'50% 50% 42% 42%',
          }} />
        </div>
      </div>

      {/* Small bushes */}
      <div style={{
        position:'absolute', bottom:'31%', left:'20%',
        width:28, height:18, borderRadius:'50% 50% 40% 40%', background:bushC,
      }} />
      <div style={{
        position:'absolute', bottom:'30%', right:'21%',
        width:24, height:16, borderRadius:'50% 50% 40% 40%', background:bushC,
      }} />

      {/* Nest glow — soft aura behind egg */}
      <div style={{
        position:'absolute', top:'45%', left:'50%',
        width:260, height:180,
        transform:'translate(-50%,-50%)',
        background:nestGlow, borderRadius:'50%',
      }} />

      {/* Path toward adventure — tapered, wider at bottom */}
      <div style={{
        position:'absolute', bottom:'28%', left:'50%',
        width:48, height:'16%',
        transform:'translateX(-50%)',
        background:pathC,
        clipPath:'polygon(20% 0%,80% 0%,100% 100%,0% 100%)',
      }} />

      {/* Flowers (day) */}
      {isDay && FLOWER_DEFS.map((f, i) => (
        <div key={i} style={{ position:'absolute', bottom:f.b, left:f.l }}>
          <div style={{
            width:6, height:6, borderRadius:'50%', background:f.c,
            boxShadow:`0 -5px 0 0 ${f.c},0 5px 0 0 ${f.c},-5px 0 0 0 ${f.c},5px 0 0 0 ${f.c}`,
          }} />
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            width:4, height:4, transform:'translate(-50%,-50%)',
            borderRadius:'50%', background:'#FFE866',
          }} />
        </div>
      ))}

      {/* Night magic particles — soft floating lights */}
      {!isDay && MAGIC_DEFS.map(([l, t, d], i) => (
        <div key={i} style={{
          position:'absolute', left:l, top:t,
          width:3, height:3, borderRadius:'50%',
          background:'rgba(155,135,255,0.82)',
          animation:`hbg-float-magic 4.5s ease-in-out ${d} infinite`,
        }} />
      ))}
    </div>
  )
}
