/**
 * LOG ACTUAL — Voice Over Text Engine
 * Uses Web Speech API (built into Chrome/Edge — zero cost, zero library)
 *
 * Each character has a distinct voice profile:
 *   CDR:   Slow, authoritative, low pitch
 *   SGM:   Measured, gruff, slightly lower
 *   S4:    Clear, normal rate, neutral
 *   SPO:   Deliberate, slightly slower
 *   INTEL: Crisp, faster, higher pitch
 */

import { useRef, useState, useCallback } from 'react'

export type SpeakerKey = 'CDR' | 'SGM' | 'S4' | 'SPO' | 'INTEL' | 'NARRATOR'

export interface VoiceProfile {
  rate:  number   // 0.5 – 2.0
  pitch: number   // 0.5 – 2.0
  volume: number  // 0.0 – 1.0
}

export const VOICE_PROFILES: Record<SpeakerKey, VoiceProfile> = {
  NARRATOR: { rate: 0.88, pitch: 1.00, volume: 1.0 },
  CDR:      { rate: 0.82, pitch: 0.88, volume: 1.0 },  // Colonel — slow, command voice
  SGM:      { rate: 0.85, pitch: 0.82, volume: 1.0 },  // SGM — gruff, measured
  S4:       { rate: 0.95, pitch: 1.00, volume: 1.0 },  // CPT — clear, professional
  SPO:      { rate: 0.88, pitch: 0.95, volume: 1.0 },  // MAJ — deliberate
  INTEL:    { rate: 1.05, pitch: 1.10, volume: 1.0 },  // LT — crisp, faster
}

// Character name prefixes stripped before speaking
const STRIP_PREFIXES = [/^[A-Z\s]+:\s*/]

function cleanText(text: string): string {
  let t = text
  STRIP_PREFIXES.forEach(re => { t = t.replace(re, '') })
  // Military acronym expansions for natural TTS
  return t
    .replace(/\bCL I\b/g,  'Class One')
    .replace(/\bCL II\b/g, 'Class Two')
    .replace(/\bCL III\b/g,'Class Three')
    .replace(/\bCL IV\b/g, 'Class Four')
    .replace(/\bCL V\b/g,  'Class Five')
    .replace(/\bCL IX\b/g, 'Class Nine')
    .replace(/\bRCT\b/g,   'Request Cycle Time')
    .replace(/\bUSL\b/g,   'Upper Spec Limit')
    .replace(/\bLOC\b/g,   'Line of Communication')
    .replace(/\bFOB\b/g,   'Forward Operating Base')
    .replace(/\bASP\b/g,   'Ammo Supply Point')
    .replace(/\bAPS\b/g,   'Aerial Port of Embarkation')
    .replace(/\bOPFOR\b/g, 'opposing force')
    .replace(/\bMSR\b/g,   'Main Supply Route')
    .replace(/\bPOL\b/g,   'Petroleum, Oils, and Lubricants')
    .replace(/\bSIGACT\b/g,'Significant Activity')
    .replace(/\bDTG\b/g,   'Date Time Group')
    .replace(/σ/g,         'sigma')
    .replace(/\bD\+(\d+)\b/g, 'Day plus $1')
}

export function useVoice() {
  const [speaking, setSpeaking] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<SpeakerKey | null>(null)
  const queueRef = useRef<SpeechSynthesisUtterance[]>([])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    setCurrentSpeaker(null)
    queueRef.current = []
  }, [])

  const speak = useCallback((text: string, speaker: SpeakerKey = 'NARRATOR', onDone?: () => void) => {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel()
    const profile = VOICE_PROFILES[speaker]
    const utter   = new SpeechSynthesisUtterance(cleanText(text))
    utter.rate    = profile.rate
    utter.pitch   = profile.pitch
    utter.volume  = profile.volume

    // Try to pick a male/female voice based on character
    const voices  = window.speechSynthesis.getVoices()
    const femaleChars = new Set<SpeakerKey>(['INTEL'])
    const wantFemale  = femaleChars.has(speaker)

    const preferred = voices.find(v =>
      v.lang.startsWith('en') &&
      (wantFemale ? /female|woman|zira|samantha/i.test(v.name) : /male|man|david|daniel|mark/i.test(v.name))
    ) ?? voices.find(v => v.lang.startsWith('en')) ?? voices[0]

    if (preferred) utter.voice = preferred

    utter.onstart = () => { setSpeaking(true); setCurrentSpeaker(speaker) }
    utter.onend   = () => { setSpeaking(false); setCurrentSpeaker(null); onDone?.() }
    utter.onerror = () => { setSpeaking(false); setCurrentSpeaker(null) }

    window.speechSynthesis.speak(utter)
  }, [])

  // Speak a queue of lines with speakers sequentially
  const speakQueue = useCallback((lines: Array<{ text: string; speaker: SpeakerKey }>, onDone?: () => void) => {
    if (!window.speechSynthesis || lines.length === 0) return
    window.speechSynthesis.cancel()

    let index = 0

    const speakNext = () => {
      if (index >= lines.length) { onDone?.(); setSpeaking(false); setCurrentSpeaker(null); return }
      const { text, speaker } = lines[index++]
      const profile = VOICE_PROFILES[speaker]
      const utter   = new SpeechSynthesisUtterance(cleanText(text))
      utter.rate    = profile.rate
      utter.pitch   = profile.pitch
      utter.volume  = profile.volume

      const voices  = window.speechSynthesis.getVoices()
      const preferred = voices.find(v => v.lang.startsWith('en')) ?? voices[0]
      if (preferred) utter.voice = preferred

      utter.onstart = () => { setSpeaking(true); setCurrentSpeaker(speaker) }
      utter.onend   = () => speakNext()
      utter.onerror = () => speakNext()

      window.speechSynthesis.speak(utter)
    }

    speakNext()
  }, [])

  return { speak, speakQueue, stop, speaking, currentSpeaker }
}
