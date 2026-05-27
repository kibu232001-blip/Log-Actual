/**
 * LOG ACTUAL — Audio Engine
 * Procedural Web Audio API — no files required.
 * Generates all game audio synthetically.
 */

type AlertLevel = 'ROUTINE' | 'PRIORITY' | 'FLASH' | 'IMMEDIATE'

class AudioEngineClass {
  private ctx: AudioContext | null = null
  private ambientGain: GainNode | null = null
  private stressGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private ambientNodes: OscillatorNode[] = []
  private running = false
  private currentSigma = 3.0

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.4
      this.masterGain.connect(this.ctx.destination)
    }
    return this.ctx
  }

  // ── AMBIENT COMMAND CENTER ──────────────────────────────────────────────────
  startAmbient() {
    if (this.running) return
    try {
      const ctx = this.getCtx()
      this.ambientGain = ctx.createGain()
      this.ambientGain.gain.value = 0.06
      this.ambientGain.connect(this.masterGain!)

      this.stressGain = ctx.createGain()
      this.stressGain.gain.value = 0
      this.stressGain.connect(this.masterGain!)

      // Low room hum — 60Hz and harmonics
      const hums = [60, 120, 180]
      hums.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.value = 0.4 / (i + 1)
        osc.connect(gain)
        gain.connect(this.ambientGain!)
        osc.start()
        this.ambientNodes.push(osc)
      })

      // Subtle noise floor — air conditioning / equipment hum
      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.02
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 200
      filter.Q.value = 0.5
      noise.connect(filter)
      filter.connect(this.ambientGain!)
      noise.start()

      // Stress oscillator — rises as sigma falls
      const stressOsc = ctx.createOscillator()
      stressOsc.type = 'sawtooth'
      stressOsc.frequency.value = 40
      const stressFilter = ctx.createBiquadFilter()
      stressFilter.type = 'lowpass'
      stressFilter.frequency.value = 150
      stressOsc.connect(stressFilter)
      stressFilter.connect(this.stressGain!)
      stressOsc.start()

      this.running = true
    } catch(e) { /* audio not supported */ }
  }

  stopAmbient() {
    this.ambientNodes.forEach(n => { try { n.stop() } catch(e) {} })
    this.ambientNodes = []
    this.running = false
  }

  // Update ambient intensity based on sigma — lower sigma = more stress
  setSigma(sigma: number) {
    if (!this.running || !this.stressGain || !this.ambientGain) return
    this.currentSigma = sigma
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      // Stress intensity: 0 at σ≥3, peaks at σ<1
      const stressLevel = Math.max(0, Math.min(1, (3.0 - sigma) / 2.0))
      this.stressGain.gain.setTargetAtTime(stressLevel * 0.12, t, 2.0)
      // Ambient gets quieter as stress rises
      this.ambientGain.gain.setTargetAtTime(0.06 - stressLevel * 0.03, t, 2.0)
    } catch(e) {}
  }

  // ── ALERT TONES ─────────────────────────────────────────────────────────────
  playAlert(level: AlertLevel) {
    try {
      const ctx = this.getCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const t = ctx.currentTime

      if (level === 'FLASH' || level === 'IMMEDIATE') {
        this._playTone(800, 0.3, 'square', 0.18, t)
        this._playTone(600, 0.15, 'square', 0.18, t + 0.22)
        this._playTone(800, 0.3, 'square', 0.18, t + 0.44)
        this._radioClick(t + 0.1)
      } else if (level === 'PRIORITY') {
        this._playTone(660, 0.2, 'sine', 0.12, t)
        this._playTone(880, 0.2, 'sine', 0.12, t + 0.18)
      } else {
        this._playTone(440, 0.08, 'sine', 0.08, t)
      }
    } catch(e) {}
  }

  // ── COUNTDOWN TICK ──────────────────────────────────────────────────────────
  playTick(urgent = false) {
    try {
      const ctx = this.getCtx()
      if (ctx.state === 'suspended') ctx.resume()
      this._playTone(urgent ? 1200 : 900, urgent ? 0.15 : 0.08, 'square', 0.04, ctx.currentTime)
    } catch(e) {}
  }

  // ── DAY ADVANCE ─────────────────────────────────────────────────────────────
  playDayAdvance() {
    try {
      const ctx = this.getCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const t = ctx.currentTime
      // Two-note chime: operational transition
      this._playTone(440, 0.12, 'sine', 0.15, t)
      this._playTone(660, 0.10, 'sine', 0.15, t + 0.12)
      this._radioClick(t + 0.05)
    } catch(e) {}
  }

  // ── CONVOY DISPATCH ─────────────────────────────────────────────────────────
  playConvoyDispatch() {
    try {
      const ctx = this.getCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const t = ctx.currentTime
      this._radioClick(t)
      this._playTone(330, 0.1, 'sawtooth', 0.08, t + 0.08)
      this._playTone(440, 0.1, 'sawtooth', 0.1, t + 0.16)
    } catch(e) {}
  }

  // ── DECISION CORRECT ────────────────────────────────────────────────────────
  playDecisionCorrect() {
    try {
      const ctx = this.getCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const t = ctx.currentTime
      this._playTone(523, 0.12, 'sine', 0.1, t)
      this._playTone(659, 0.10, 'sine', 0.1, t + 0.1)
      this._playTone(784, 0.12, 'sine', 0.15, t + 0.2)
    } catch(e) {}
  }

  // ── DECISION WRONG ──────────────────────────────────────────────────────────
  playDecisionWrong() {
    try {
      const ctx = this.getCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const t = ctx.currentTime
      this._playTone(220, 0.2, 'sawtooth', 0.12, t)
      this._playTone(196, 0.2, 'sawtooth', 0.15, t + 0.15)
    } catch(e) {}
  }

  // ── STONEWALL ALARM ─────────────────────────────────────────────────────────
  playStonewallAlarm() {
    try {
      const ctx = this.getCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const t = ctx.currentTime
      for (let i = 0; i < 3; i++) {
        this._playTone(440, 0.3, 'square', 0.2, t + i * 0.35)
        this._playTone(220, 0.3, 'square', 0.2, t + i * 0.35 + 0.18)
      }
    } catch(e) {}
  }

  // ── ENEMY ATTACK ────────────────────────────────────────────────────────────
  playEnemyAttack() {
    try {
      const ctx = this.getCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const t = ctx.currentTime
      // Low thud + static burst
      this._playTone(80, 0.4, 'sine', 0.08, t)
      this._playTone(120, 0.3, 'square', 0.06, t + 0.02)
      this._radioClick(t + 0.08)
      this._radioClick(t + 0.14)
    } catch(e) {}
  }

  // ── PRIVATE HELPERS ─────────────────────────────────────────────────────────
  private _playTone(freq: number, vol: number, type: OscillatorType, dur: number, start: number) {
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(vol * 0.35, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  }

  private _radioClick(t: number) {
    const ctx = this.getCtx()
    const bufLen = Math.floor(ctx.sampleRate * 0.04)
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1800
    filter.Q.value = 2
    const gain = ctx.createGain()
    gain.gain.value = 0.15
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)
    src.start(t)
  }

  resume() {
    try { this.ctx?.resume() } catch(e) {}
  }
}

export const AudioEngine = new AudioEngineClass()
export default AudioEngine
