'use client'

import { PieceSculptType } from './game-types'

// Procedural AAA Web Audio Synthesizer for LUDO WAR®
// Includes Dedicated Horror / Creepy Elimination Sounds per Piece Type (Alien, Human, Horse, Crown)
class SoundEngine {
  private ctx: AudioContext | null = null
  public enabled: boolean = true

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public playStudioIntro() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(95, now)
    osc.frequency.exponentialRampToValueAtTime(32, now + 1.8)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.45, now + 0.12)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 2.25)

    const freqs = [220, 330, 440, 659.25]
    freqs.forEach((f, idx) => {
      const hOsc = ctx.createOscillator()
      const hGain = ctx.createGain()
      hOsc.type = 'triangle'
      hOsc.frequency.setValueAtTime(f, now + 0.15 + idx * 0.06)
      hGain.gain.setValueAtTime(0.001, now + 0.15 + idx * 0.06)
      hGain.gain.linearRampToValueAtTime(0.06, now + 0.4 + idx * 0.06)
      hGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1)
      hOsc.connect(hGain)
      hGain.connect(ctx.destination)
      hOsc.start(now + 0.15 + idx * 0.06)
      hOsc.stop(now + 2.15)
    })
  }

  public playUiClick() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(620, now)
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.065)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.075)
  }

  public playDiceRoll() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const hits = [0, 0.08, 0.16, 0.25, 0.34, 0.44, 0.54]
    hits.forEach((offset, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = i % 2 === 0 ? 'square' : 'triangle'
      osc.frequency.setValueAtTime(280 + Math.random() * 220, now + offset)
      osc.frequency.exponentialRampToValueAtTime(90, now + offset + 0.055)
      gain.gain.setValueAtTime(0.14 * (1 - i * 0.08), now + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.065)
    })
  }

  public playDiceSix() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [440, 554.37, 659.25, 880]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.055)
      gain.gain.setValueAtTime(0.14, now + idx * 0.055)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.055)
      osc.stop(now + idx * 0.055 + 0.36)
    })
  }

  public playPieceStep() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(340, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.09)
    gain.gain.setValueAtTime(0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.11)
  }

  public playPieceSpawn() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [293.66, 440, 587.33]
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, now + i * 0.07)
      gain.gain.setValueAtTime(0.16, now + i * 0.07)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.07)
      osc.stop(now + i * 0.07 + 0.32)
    })
  }

  /**
   * Dedicated Creepy / Horror Elimination Sound Effect per Piece Type:
   * - 'alien': Eerie extraterrestrial shriek with FM horror modulation + abyssal sub-drone
   * - 'human': Haunting phantom reaper groan & guillotine soul-rip resonance
   * - 'horse': Demonic nightmare stallion screeching neigh + double hell-hoof thunder stomp
   * - 'crown': Cursed tritone ("Devil's interval") execution bell toll + dark shattering choir
   */
  public playPieceEliminationHorror(killerSculpt: PieceSculptType) {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    // Shared deep horror sub-bass dread drop
    const subOsc = ctx.createOscillator()
    const subGain = ctx.createGain()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(88, now)
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.95)
    subGain.gain.setValueAtTime(0.38, now)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.98)
    subOsc.connect(subGain)
    subGain.connect(ctx.destination)
    subOsc.start(now)
    subOsc.stop(now + 1.0)

    if (killerSculpt === 'alien') {
      // ALIEN HORROR: High-pitched FM extraterrestrial void shriek + eerie warble
      const carrier = ctx.createOscillator()
      const mod = ctx.createOscillator()
      const modGain = ctx.createGain()
      const mainGain = ctx.createGain()

      carrier.type = 'sawtooth'
      carrier.frequency.setValueAtTime(1180, now)
      carrier.frequency.exponentialRampToValueAtTime(310, now + 0.45)
      carrier.frequency.exponentialRampToValueAtTime(1640, now + 0.72)
      carrier.frequency.exponentialRampToValueAtTime(140, now + 0.95)

      mod.type = 'sine'
      mod.frequency.setValueAtTime(48, now)
      mod.frequency.linearRampToValueAtTime(19, now + 0.9)
      modGain.gain.setValueAtTime(240, now)

      mainGain.gain.setValueAtTime(0.01, now)
      mainGain.gain.linearRampToValueAtTime(0.28, now + 0.06)
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.96)

      mod.connect(modGain)
      modGain.connect(carrier.frequency)
      carrier.connect(mainGain)
      mainGain.connect(ctx.destination)

      mod.start(now)
      carrier.start(now)
      mod.stop(now + 0.98)
      carrier.stop(now + 0.98)
      return
    }

    if (killerSculpt === 'horse') {
      // HORSE HORROR: Demonic Nightmare Stallion Shrieking Neigh + 2 Heavy Hoof Slams
      const neigh = ctx.createOscillator()
      const vibrato = ctx.createOscillator()
      const vibGain = ctx.createGain()
      const neighGain = ctx.createGain()

      neigh.type = 'sawtooth'
      neigh.frequency.setValueAtTime(680, now)
      neigh.frequency.linearRampToValueAtTime(1120, now + 0.14)
      neigh.frequency.exponentialRampToValueAtTime(260, now + 0.78)

      vibrato.type = 'square'
      vibrato.frequency.setValueAtTime(28, now)
      vibGain.gain.setValueAtTime(85, now)

      neighGain.gain.setValueAtTime(0.01, now)
      neighGain.gain.linearRampToValueAtTime(0.26, now + 0.05)
      neighGain.gain.exponentialRampToValueAtTime(0.001, now + 0.82)

      vibrato.connect(vibGain)
      vibGain.connect(neigh.frequency)
      neigh.connect(neighGain)
      neighGain.connect(ctx.destination)

      vibrato.start(now)
      neigh.start(now)
      vibrato.stop(now + 0.84)
      neigh.stop(now + 0.84)

      // Double demonic hoof stomp
      ;[0.22, 0.42].forEach((offset) => {
        const stomp = ctx.createOscillator()
        const sGain = ctx.createGain()
        stomp.type = 'triangle'
        stomp.frequency.setValueAtTime(160, now + offset)
        stomp.frequency.exponentialRampToValueAtTime(36, now + offset + 0.18)
        sGain.gain.setValueAtTime(0.32, now + offset)
        sGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2)
        stomp.connect(sGain)
        sGain.connect(ctx.destination)
        stomp.start(now + offset)
        stomp.stop(now + offset + 0.21)
      })
      return
    }

    if (killerSculpt === 'human') {
      // HUMAN HORROR: Haunting Soul-Reaper Phantom Groan (dissonant minor second) + Blade Slash
      const slash = ctx.createOscillator()
      const slashGain = ctx.createGain()
      slash.type = 'sawtooth'
      slash.frequency.setValueAtTime(920, now)
      slash.frequency.exponentialRampToValueAtTime(110, now + 0.22)
      slashGain.gain.setValueAtTime(0.28, now)
      slashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
      slash.connect(slashGain)
      slashGain.connect(ctx.destination)
      slash.start(now)
      slash.stop(now + 0.25)

      // Eerie phantom wail chord (minor second dissonance descending into abyss)
      const phantomFreqs = [233.08, 246.94, 311.13]
      phantomFreqs.forEach((f) => {
        const vOsc = ctx.createOscillator()
        const vGain = ctx.createGain()
        vOsc.type = 'sawtooth'
        vOsc.frequency.setValueAtTime(f, now + 0.1)
        vOsc.frequency.exponentialRampToValueAtTime(f * 0.52, now + 0.92)
        vGain.gain.setValueAtTime(0.001, now + 0.1)
        vGain.gain.linearRampToValueAtTime(0.11, now + 0.26)
        vGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.95)
        vOsc.connect(vGain)
        vGain.connect(ctx.destination)
        vOsc.start(now + 0.1)
        vOsc.stop(now + 0.96)
      })
      return
    }

    // CROWN HORROR: Cursed Imperial Execution Bell (Tritone Devil's Interval + Dark Shatter)
    const tritoneFreqs = [196.0, 277.18, 392.0, 554.37, 830.61]
    tritoneFreqs.forEach((f, idx) => {
      const bell = ctx.createOscillator()
      const bGain = ctx.createGain()
      bell.type = idx % 2 === 0 ? 'triangle' : 'sawtooth'
      bell.frequency.setValueAtTime(f, now)
      bell.frequency.exponentialRampToValueAtTime(f * 0.84, now + 0.92)
      bGain.gain.setValueAtTime(0.14 / (idx * 0.45 + 1), now)
      bGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.95)
      bell.connect(bGain)
      bGain.connect(ctx.destination)
      bell.start(now)
      bell.stop(now + 0.96)
    })
  }

  public playBlackHoleAbsorb() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.65)
    osc.frequency.exponentialRampToValueAtTime(48, now + 1.15)
    gain.gain.setValueAtTime(0.01, now)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.5)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 1.25)
  }

  public playVictoryFanfare() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]
    chord.forEach((f, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, now + idx * 0.1)
      gain.gain.setValueAtTime(0.18, now + idx * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.1 + 1.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.1)
      osc.stop(now + idx * 0.1 + 1.45)
    })
  }

  public playWheelTick() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(920, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.04)
  }
}

export const soundEngine = new SoundEngine()
