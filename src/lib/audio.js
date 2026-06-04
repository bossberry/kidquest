let audioCtx = null
let _soundOn = true
let _phonicsAudio = null
let currentPhonicsAudio = null

export function setSoundOn(v) {
  _soundOn = v
  if (!v && window.speechSynthesis) window.speechSynthesis.cancel()
}
export function getSoundOn() { return _soundOn }

export function getACtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function toggleSound(btn) {
  _soundOn = !_soundOn
  if (btn) { btn.textContent = _soundOn ? '🔊' : '🔇'; btn.style.opacity = _soundOn ? '1' : '.5' }
  if (!_soundOn && window.speechSynthesis) window.speechSynthesis.cancel()
  return _soundOn
}

export function playTone(type) {
  if (!_soundOn) return
  try {
    const ctx = getACtx()
    const t = (f,d,v,dur,tp='sine') => {
      const o=ctx.createOscillator(),g=ctx.createGain()
      o.connect(g);g.connect(ctx.destination)
      o.type=tp;o.frequency.value=f
      const st=ctx.currentTime+d
      g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(v,st+.02);g.gain.exponentialRampToValueAtTime(.001,st+dur)
      o.start(st);o.stop(st+dur+.02)
    }
    if(type==='correct'){t(523,0,.28,.28);t(659,.12,.28,.28);t(784,.24,.28,.28)}
    else if(type==='wrong'){t(220,0,.2,.22,'sawtooth');t(180,.15,.2,.22,'sawtooth')}
    else if(type==='streak'){t(523,0,.3,.32,'triangle');t(659,.1,.3,.32,'triangle');t(784,.2,.3,.32,'triangle');t(1047,.32,.3,.32,'triangle')}
    else if(type==='fanfare'){[523,659,784,1047,784,1047].forEach((f,i)=>t(f,i*.09,.25,.45))}
    else if(type==='click'){t(660,0,.14,.08)}
    else if(type==='next'){t(440,0,.11,.09)}
    // Interaction tones
    else if(type==='tap'){t(523,0,.12,.09,'sine');t(660,.05,.09,.07,'sine')}
    else if(type==='open'){t(440,0,.12,.1,'triangle');t(660,.09,.12,.12,'triangle')}
    else if(type==='unlock'){[523,659,784,1047].forEach((f,i)=>t(f,i*.1,.22,.28,'triangle'))}
    else if(type==='item'){[659,784,988,1175].forEach((f,i)=>t(f,i*.06,.14,.12,'triangle'))}
    else if(type==='eggReady'){t(523,0,.2,.35,'sine');t(659,.22,.2,.3,'sine');t(784,.44,.22,.28,'sine')}
    else if(type==='reveal'){[523,659,784,1047,1319].forEach((f,i)=>t(f,i*.08,.18,.28,'triangle'));t(1568,.5,.16,.35,'sine')}
    else if(type==='start'){t(440,0,.16,.1,'square');t(659,.08,.16,.12,'square');t(880,.16,.18,.14,'sine')}
    else if(type==='complete'){[523,784,659,1047].forEach((f,i)=>t(f,i*.1,.2,.35,'triangle'))}
    else if(type==='cardOpen'){t(880,0,.12,.07,'sine');t(1047,.05,.1,.08,'sine')}
  } catch(e) {}
}

export function speakTh(text) {
  if (!_soundOn || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang='th-TH';u.rate=.85;u.pitch=1.1
  const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('th'))
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

export function speakEn(text, rate=.82) {
  if (!_soundOn || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang='en-US';u.rate=rate;u.pitch=1.1
  const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('en'))
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

export async function playPhonicsSound(q, onEnd) {
  if (!_soundOn) return
  if (!_phonicsAudio) {
    try {
      const mod = await import('../assets/phonicsAudio.js')
      _phonicsAudio = mod.PHONICS_AUDIO
    } catch(e) { if (onEnd) speakEn(q.word, .78); return }
  }
  if (currentPhonicsAudio) { currentPhonicsAudio.pause(); currentPhonicsAudio = null }
  const key = q.letter?.toLowerCase()
  const dataUri = _phonicsAudio?.[key]
  if (!dataUri) { if (onEnd) speakEn(q.word, .78); return }
  const audio = new Audio(dataUri)
  currentPhonicsAudio = audio
  try {
    const ctx = getACtx()
    const src = ctx.createMediaElementSource(audio)
    const gain = ctx.createGain(); gain.gain.value = 4.0
    src.connect(gain); gain.connect(ctx.destination)
  } catch(e) { audio.volume = 1.0 }
  audio.onended = () => { if (onEnd) setTimeout(() => speakEn(q.word, .82), 50) }
  audio.onerror = () => { speakEn(q.word, .78) }
  audio.play().catch(() => speakEn(q.word, .78))
}

export function playEatSound() {
  if (!_soundOn) return
  try {
    const ctx = getACtx()
    for(let i=0;i<3;i++){
      setTimeout(()=>{
        const buf=ctx.createBuffer(1,ctx.sampleRate*.06,ctx.sampleRate)
        const data=buf.getChannelData(0)
        for(let j=0;j<data.length;j++) data[j]=(Math.random()*2-1)*Math.exp(-j/(data.length*.4))
        const src=ctx.createBufferSource()
        const gain=ctx.createGain(); gain.gain.value=.18
        const filter=ctx.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=800+i*200
        src.buffer=buf; src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
        src.start(ctx.currentTime)
      }, i*120)
    }
    setTimeout(()=>{
      const o=ctx.createOscillator(),g=ctx.createGain()
      o.connect(g);g.connect(ctx.destination)
      o.type='sine';o.frequency.value=880
      g.gain.setValueAtTime(0,ctx.currentTime);g.gain.linearRampToValueAtTime(.2,ctx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.3)
      o.start(ctx.currentTime);o.stop(ctx.currentTime+.32)
    }, 400)
  } catch(e) {}
}

// Egg Run SFX
export function erSfxJump(){if(!_soundOn)return;try{const ctx=getACtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.setValueAtTime(200,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(600,ctx.currentTime+.12);g.gain.setValueAtTime(.22,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.18);o.start(ctx.currentTime);o.stop(ctx.currentTime+.2)}catch(e){}}
export function erSfxRing(){if(!_soundOn)return;try{const ctx=getACtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=1047;g.gain.setValueAtTime(.18,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);o.start(ctx.currentTime);o.stop(ctx.currentTime+.13)}catch(e){}}
export function erSfxHit(){if(!_soundOn)return;try{const ctx=getACtx();[80,60,40].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sawtooth';o.frequency.value=f;const t=ctx.currentTime+i*.06;g.gain.setValueAtTime(.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.start(t);o.stop(t+.2)})}catch(e){}}
export function erSfxSpeedUp(){if(!_soundOn)return;try{const ctx=getACtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sawtooth';o.frequency.setValueAtTime(150,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(400,ctx.currentTime+.25);g.gain.setValueAtTime(.14,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.3);o.start(ctx.currentTime);o.stop(ctx.currentTime+.32)}catch(e){}}
export function erSfxMilestone(){if(!_soundOn)return;try{const ctx=getACtx();[523,659,784,1047].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='triangle';o.frequency.value=f;const t=ctx.currentTime+i*.08;g.gain.setValueAtTime(.22,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.start(t);o.stop(t+.27)})}catch(e){}}
export function erSfxGameOver(){if(!_soundOn)return;try{const ctx=getACtx();[600,400,250,150].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=f;const t=ctx.currentTime+i*.14;g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.start(t);o.stop(t+.22)})}catch(e){}}
export function erSfxRecord(){if(!_soundOn)return;try{const ctx=getACtx();[523,659,784,1047,1319,1568].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='triangle';o.frequency.value=f;const t=ctx.currentTime+i*.07;g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.start(t);o.stop(t+.24)})}catch(e){}}
export function erSfxCountdown(n){if(!_soundOn)return;try{const ctx=getACtx(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=n===0?880:440+n*80;g.gain.setValueAtTime(.25,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+(n===0?.4:.2));o.start(ctx.currentTime);o.stop(ctx.currentTime+(n===0?.45:.25))}catch(e){}}
export function playTapCrackSound(tapNum){if(!_soundOn)return;try{const ctx=getACtx(),buf=ctx.createBuffer(1,ctx.sampleRate*.06,ctx.sampleRate),data=buf.getChannelData(0);for(let j=0;j<data.length;j++)data[j]=(Math.random()*2-1)*Math.exp(-j/(data.length*.35));const src=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=.1+tapNum*.06;const filt=ctx.createBiquadFilter();filt.type='bandpass';filt.frequency.value=500+tapNum*120;src.buffer=buf;src.connect(filt);filt.connect(gain);gain.connect(ctx.destination);src.start(ctx.currentTime);const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=300+tapNum*80;g.gain.setValueAtTime(0,ctx.currentTime+.05);g.gain.linearRampToValueAtTime(.15,ctx.currentTime+.07);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.25);o.start(ctx.currentTime+.05);o.stop(ctx.currentTime+.27)}catch(e){}}
export function playHatchSound(){if(!_soundOn)return;try{const ctx=getACtx();const t=(f,d,v,dur,tp='sine')=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=tp;o.frequency.value=f;const st=ctx.currentTime+d;g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(v,st+.02);g.gain.exponentialRampToValueAtTime(.001,st+dur);o.start(st);o.stop(st+dur+.02)};[0,.15,.3,.5,.7,.9].forEach((d,i)=>{const buf=ctx.createBuffer(1,ctx.sampleRate*.05,ctx.sampleRate),data=buf.getChannelData(0);for(let j=0;j<data.length;j++)data[j]=(Math.random()*2-1)*Math.exp(-j/(data.length*.3));const src=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=.12+i*.03;const filt=ctx.createBiquadFilter();filt.type='bandpass';filt.frequency.value=600+i*150;src.buffer=buf;src.connect(filt);filt.connect(gain);gain.connect(ctx.destination);src.start(ctx.currentTime+d)});t(80,1.2,.4,.6,'sawtooth');t(120,1.2,.3,.5,'sawtooth');[523,587,659,698,784,880,988,1047].forEach((f,i)=>t(f,1.5+i*.1,.25,.4));[523,659,784,1047,1319,1568].forEach((f,i)=>t(f,2.5+i*.08,.3,.5))}catch(e){}}

export function initVoices() {
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
  }
}
