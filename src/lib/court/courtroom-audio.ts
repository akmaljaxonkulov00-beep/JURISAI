/**
 * Courtroom Web Audio Synthesizer
 * 100% native Web Audio API — zero external files, zero latency, works offline.
 */

class CourtroomAudioSynthesizer {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        this.ctx = new AudioContextClass()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /**
   * Authentic wooden gavel double-strike sound
   * (Sudya bolg‘asi zarbasi)
   */
  playGavelSound() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Two rapid strikes: first at t=0, second at t=0.22s
    const strikes = [now, now + 0.22]

    strikes.forEach(time => {
      // 1. Low body thud (wood resonance: 140Hz decaying to 50Hz)
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(140, time)
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.12)

      oscGain.gain.setValueAtTime(0.8, time)
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14)

      osc.connect(oscGain)
      oscGain.connect(ctx.destination)

      osc.start(time)
      osc.stop(time + 0.15)

      // 2. High snap (strike impact noise burst)
      const bufferSize = ctx.sampleRate * 0.05
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }

      const whiteNoise = ctx.createBufferSource()
      whiteNoise.buffer = noiseBuffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1200, time)
      filter.Q.setValueAtTime(2.5, time)

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.6, time)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

      whiteNoise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      whiteNoise.start(time)
      whiteNoise.stop(time + 0.06)
    })
  }

  /**
   * Dramatic chord alert for Courtroom Objection
   * (E’tiroz signali)
   */
  playObjectionChime() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    // Suspenseful diminished chord notes: F#4 (370Hz), A4 (440Hz), C5 (523Hz), Eb5 (622Hz)
    const freqs = [370, 440, 523.25, 622.25]

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.02)

      gain.gain.setValueAtTime(0.25, now + idx * 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.02)
      osc.stop(now + 0.65)
    })
  }

  /**
   * Dignified ceremonial bell for Stage Advancements & Decisions
   * (Bosqich qo‘ng‘irog‘i)
   */
  playStageBell() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now) // A5
    osc.frequency.exponentialRampToValueAtTime(875, now + 0.8)

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.85)
  }
}

export const courtroomAudio = new CourtroomAudioSynthesizer()
