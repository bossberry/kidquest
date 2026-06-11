import React from 'react'

const STAR_DEFS = [
  [4,8,2,0],[6,20,1.5,0.8],[3,36,2.5,1.4],[9,55,1.5,0.4],
  [5,72,2,2.0],[12,85,1.5,1.1],[15,15,1.5,1.8],[18,48,2,0.6],
  [14,64,1.5,2.3],[20,30,1.5,1.6],[22,78,2,0.9],[25,5,1.5,2.1],
]

const FLOWER_DEFS = [
  { l:'11%', b:'34%',   c:'#FF88CC', d:'0s'   },
  { l:'25%', b:'34.5%', c:'#FFDD44', d:'0.4s' },
  { l:'59%', b:'34.8%', c:'#88AAFF', d:'0.8s' },
  { l:'74%', b:'34.3%', c:'#FFAACC', d:'0.2s' },
  { l:'43%', b:'35.5%', c:'#FFEE88', d:'1.2s' },
  { l:'86%', b:'34.6%', c:'#AAFFA8', d:'0.6s' },
]

const LEAF_DEFS = [
  { l:'18%', c:'#88BB44', anim:'hbg-leaf1', dur:'7s',   delay:'0s'   },
  { l:'54%', c:'#CC8833', anim:'hbg-leaf2', dur:'9.5s', delay:'2.8s' },
  { l:'80%', c:'#88BB44', anim:'hbg-leaf3', dur:'6s',   delay:'5.5s' },
]

const FIREFLY_DEFS = [
  { l:'22%', t:'42%', anim:'hbg-ff1', dur:'5s',   delay:'0s'   },
  { l:'68%', t:'38%', anim:'hbg-ff2', dur:'7s',   delay:'1.8s' },
  { l:'44%', t:'50%', anim:'hbg-ff3', dur:'4.5s', delay:'3.2s' },
  { l:'78%', t:'46%', anim:'hbg-ff4', dur:'6.5s', delay:'0.9s' },
]

const MAGIC_DEFS = [
  ['22%','42%','0s'],['74%','38%','1.2s'],['44%','35%','2.5s'],
  ['60%','47%','0.6s'],['35%','51%','1.9s'],
]

function Butterfly({ color, flightAnim, flightDur, flightDelay, top }) {
  return (
    <div style={{
      position:'absolute', top, left:0,
      animation:`${flightAnim} ${flightDur} linear ${flightDelay} infinite`,
      willChange:'transform', pointerEvents:'none',
    }}>
      <div style={{ position:'relative', width:20, height:16 }}>
        <div style={{
          position:'absolute', left:0, top:2,
          width:9, height:10, borderRadius:'50% 0 50% 50%',
          background:color, transformOrigin:'right center',
          animation:'hbg-flap-l 0.4s linear infinite',
          willChange:'transform', opacity:0.88,
        }} />
        <div style={{
          position:'absolute', right:0, top:2,
          width:9, height:10, borderRadius:'0 50% 50% 50%',
          background:color, transformOrigin:'left center',
          animation:'hbg-flap-r 0.4s linear infinite',
          willChange:'transform', opacity:0.88,
        }} />
        <div style={{
          position:'absolute', top:3, left:'50%',
          width:3, height:10,
          transform:'translateX(-50%)',
          background:'#443322', borderRadius:2,
        }} />
      </div>
    </div>
  )
}

function Bird() {
  return (
    <div style={{
      position:'absolute', top:'7%', left:0,
      animation:'hbg-bird-fly 15s linear 2s infinite',
      willChange:'transform', pointerEvents:'none',
    }}>
      <div style={{ position:'relative', width:22, height:10 }}>
        <div style={{
          position:'absolute', left:7, top:3,
          width:9, height:5, background:'#554433', borderRadius:'50%',
        }} />
        <div style={{
          position:'absolute', left:1, top:1,
          width:9, height:6, background:'#554433',
          borderRadius:'50% 0 50% 50%',
          transformOrigin:'right bottom',
          animation:'hbg-bird-flap 0.25s ease-in-out infinite',
          willChange:'transform',
        }} />
        <div style={{
          position:'absolute', right:1, top:1,
          width:9, height:6, background:'#554433',
          borderRadius:'0 50% 50% 50%',
          transformOrigin:'left bottom',
          animation:'hbg-bird-flap 0.25s ease-in-out 0.125s infinite',
          willChange:'transform',
        }} />
      </div>
    </div>
  )
}

export default function HomeBackground({ hour }) {
  const h = hour ?? new Date().getHours()
  const isDay = h >= 6 && h < 19
  const isSunset = h >= 17 && h < 19
  const isDawn = h >= 5 && h < 8

  // Sky — vivid Pokémon FireRed/LeafGreen palette
  const sky = isDay
    ? isSunset
      ? 'linear-gradient(180deg,#E87040 0%,#F5A060 20%,#FFC888 45%,#FFE4C0 70%,#FFF4E8 100%)'
      : isDawn
      ? 'linear-gradient(180deg,#F08860 0%,#F8B870 22%,#FFD898 46%,#FFF0D8 72%,#FFFAEE 100%)'
      : 'linear-gradient(180deg,#4ec8f0 0%,#87ddff 45%,#c8f0ff 75%,#d4f7c0 100%)'
    : 'linear-gradient(180deg,#0a1a3a 0%,#1a2a5a 35%,#2a3a7a 68%,#0d2a1a 100%)'

  const sunBg = isSunset
    ? 'radial-gradient(circle at 40% 36%,#FF9060 0%,#FF5818 55%,#FF3800 85%)'
    : 'radial-gradient(circle at 40% 34%,#FFF888 0%,#FFD700 50%,#FFC400 85%)'
  const sunGlow = isSunset
    ? '0 0 28px 14px rgba(255,120,30,0.42),0 0 55px 26px rgba(255,70,0,0.15)'
    : '0 0 28px 14px rgba(255,215,50,0.52),0 0 65px 30px rgba(255,195,30,0.18)'

  // Mountains — vivid with distance tint
  const mtn1 = isDay ? '#a8d4a8' : 'rgba(18,35,60,0.75)'
  const mtn2 = isDay ? '#90c490' : 'rgba(14,28,50,0.65)'

  // Ground + detail colors
  const grass = isDay
    ? 'linear-gradient(180deg,#5ac85a 0%,#3a9a3a 40%,#2a7a2a 100%)'
    : 'linear-gradient(180deg,#142C16 0%,#0E2010 45%,#0A1A0E 100%)'
  const groundMound = isDay ? '#5ac85a' : '#142C16'
  const trunkC = isDay ? '#5A3808' : '#182818'
  const leafC1 = isDay
    ? 'radial-gradient(ellipse,#6EC040 0%,#4A9828 55%,#388020 100%)'
    : 'radial-gradient(ellipse,#1C3C1E 0%,#122816 100%)'
  const leafC2 = isDay
    ? 'radial-gradient(ellipse,#76CC4A 0%,#54A632 55%,#3E8C22 100%)'
    : 'radial-gradient(ellipse,#182E1A 0%,#101E10 100%)'
  const bushC = isDay ? 'rgba(74,162,38,0.82)' : 'rgba(14,38,16,0.78)'
  const pathC = isDay
    ? 'linear-gradient(180deg,rgba(210,180,120,0.55) 0%,rgba(190,158,100,0.32) 100%)'
    : 'linear-gradient(180deg,rgba(35,55,80,0.52) 0%,rgba(25,42,65,0.30) 100%)'
  const nestGlow = isDay
    ? 'radial-gradient(ellipse,rgba(255,230,90,0.22) 0%,rgba(255,200,50,0.08) 55%,transparent 78%)'
    : 'radial-gradient(ellipse,rgba(90,65,180,0.20) 0%,rgba(55,35,130,0.08) 55%,transparent 78%)'

  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:-1 }}>

      {/* Layer 1 — Sky */}
      <div style={{ position:'absolute', inset:0, background:sky }} />

      {/* Layer 2 — Sun (day) */}
      {isDay && (
        <div style={{
          position:'absolute', top:'5%', right:'11%',
          width:56, height:56, borderRadius:'50%',
          background:sunBg, boxShadow:sunGlow,
          animation:'hbg-sun-pulse 4s ease-in-out infinite',
          willChange:'transform',
        }} />
      )}

      {/* Layer 2 — Moon + crescent (night) */}
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
            background:'#0a1a3a', opacity:0.90,
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

      {/* Layer 3 — Clouds (day) */}
      {isDay && (
        <>
          <div className="hbg-cloud hbg-cloud-1" />
          <div className="hbg-cloud hbg-cloud-2" />
          <div className="hbg-cloud hbg-cloud-3" />
        </>
      )}

      {/* Layer 4 — Mountains */}
      <div style={{
        position:'absolute', bottom:'34%', left:'-10%',
        width:'62%', height:'28%',
        borderRadius:'50% 50% 0 0 / 100% 100% 0 0',
        background:mtn1,
      }} />
      <div style={{
        position:'absolute', bottom:'32%', right:'-8%',
        width:'55%', height:'22%',
        borderRadius:'50% 50% 0 0 / 100% 100% 0 0',
        background:mtn2,
      }} />

      {/* Layer 5 — Ground */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'36%',
        background:grass,
        borderRadius:'50% 50% 0 0 / 30px 30px 0 0',
      }} />

      {/* Ground mounds for depth */}
      <div style={{
        position:'absolute', bottom:'33%', left:'30%',
        width:48, height:12, borderRadius:'50%', background:groundMound,
      }} />
      <div style={{
        position:'absolute', bottom:'33%', right:'25%',
        width:36, height:10, borderRadius:'50%', background:groundMound,
      }} />

      {/* Layer 6 — Bushes */}
      <div style={{
        position:'absolute', bottom:'31%', left:'18%',
        width:32, height:20, borderRadius:'50% 50% 40% 40%', background:bushC,
      }} />
      <div style={{
        position:'absolute', bottom:'30%', right:'19%',
        width:26, height:17, borderRadius:'50% 50% 40% 40%', background:bushC,
      }} />

      {/* Trees */}
      <div style={{ position:'absolute', bottom:'27%', left:'5%' }}>
        <div style={{ position:'relative', width:40, height:50 }}>
          <div style={{ position:'absolute', bottom:0, left:14, width:12, height:38, background:trunkC, borderRadius:3 }} />
          <div style={{ position:'absolute', bottom:26, left:0, width:40, height:44, background:leafC1, borderRadius:'50% 50% 42% 42%' }} />
        </div>
      </div>
      <div style={{ position:'absolute', bottom:'28%', right:'6%' }}>
        <div style={{ position:'relative', width:34, height:42 }}>
          <div style={{ position:'absolute', bottom:0, left:11, width:10, height:30, background:trunkC, borderRadius:3 }} />
          <div style={{ position:'absolute', bottom:22, left:0, width:34, height:38, background:leafC2, borderRadius:'50% 50% 42% 42%' }} />
        </div>
      </div>

      {/* Path toward adventure */}
      <div style={{
        position:'absolute', bottom:'28%', left:'50%',
        width:48, height:'16%',
        transform:'translateX(-50%)',
        background:pathC,
        clipPath:'polygon(20% 0%,80% 0%,100% 100%,0% 100%)',
      }} />

      {/* Nest glow — soft aura behind egg */}
      <div style={{
        position:'absolute', top:'45%', left:'50%',
        width:260, height:180,
        transform:'translate(-50%,-50%)',
        background:nestGlow, borderRadius:'50%',
      }} />

      {/* Layer 6b — Flowers (day) */}
      {isDay && FLOWER_DEFS.map((f, i) => (
        <div key={i} style={{
          position:'absolute', bottom:f.b, left:f.l,
          animation:`hbg-flower-float 2.5s ease-in-out ${f.d} infinite`,
          willChange:'transform',
        }}>
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

      {/* Layer 7 — CSS Butterflies (day) */}
      {isDay && (
        <>
          <Butterfly color="#ff99dd" flightAnim="hbg-bf1" flightDur="8s"  flightDelay="1s" top="32%" />
          <Butterfly color="#ffcc44" flightAnim="hbg-bf2" flightDur="12s" flightDelay="6s" top="42%" />
        </>
      )}

      {/* Layer 7 — CSS Bird (day) */}
      {isDay && <Bird />}

      {/* Layer 7 — Leaf particles (always) */}
      {LEAF_DEFS.map((l, i) => (
        <div key={i} style={{
          position:'absolute', top:'-2%', left:l.l,
          width:7, height:7,
          background:l.c,
          borderRadius:'50% 0 50% 0',
          animation:`${l.anim} ${l.dur} ease-in ${l.delay} infinite`,
          willChange:'transform', pointerEvents:'none',
        }} />
      ))}

      {/* Layer 7 — Fireflies (night) */}
      {!isDay && FIREFLY_DEFS.map((f, i) => (
        <div key={i} style={{
          position:'absolute', left:f.l, top:f.t,
          width:4, height:4, borderRadius:'50%',
          background:'#ffffaa',
          boxShadow:'0 0 6px 3px rgba(255,255,170,0.55)',
          animation:`${f.anim} ${f.dur} ease-in-out ${f.delay} infinite`,
          willChange:'transform', pointerEvents:'none',
        }} />
      ))}

      {/* Night magic particles */}
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
