/**
 * VoiceService — ElevenLabs TTS for commander briefing lines
 * Generates audio on demand, caches in memory and sessionStorage
 */

const API_KEY = 'sk_7e58560210bb47fb5a38f9e8251c32995e02fb959e9eed88'
const API_URL = 'https://api.elevenlabs.io/v1/text-to-speech'
const MODEL   = 'eleven_multilingual_v2'

// ── VOICE ASSIGNMENTS PER CHARACTER ──────────────────────────────────────────
// Free-tier ElevenLabs pre-made voices — swap IDs to match your chosen voices
export const CHARACTER_VOICES: Record<string, string> = {
  // Campaign 1 — Europe
  LTG_HAYES:     'pNInz6obpgDQGcFmaJgB',  // Adam — deep authoritative American
  SGM_FORD:      'VR6AewLTigWG4xSOukaG',  // Arnold — gruff, experienced
  MAJ_CHEN:      '21m00Tcm4TlvDq8ikWAM',  // Rachel — precise, professional female

  // Campaign 2 — Baltic
  BG_WALSH:      'ErXwobaYiN019PkySvjV',  // Antoni — measured, coalition tone
  COL_ANDERS:    'yoZ06aMxZJJ28mfd3POQ',  // Sam — direct, proud
  CW3_BANKS:     'TxGEqnHWrfWFTfGW9XjX',  // Josh — quiet, weathered

  // Campaign 3 — Desert
  COL_PETERSEN:  'pNInz6obpgDQGcFmaJgB',  // Adam
  SGM_RIVERS:    'VR6AewLTigWG4xSOukaG',  // Arnold — hardened desert vet
  LT_COLE:       'AZnzlk1XvdvUeBnXmlld',  // Domi — young, eager female

  // Campaign 4 — Gulf
  COL_MARTINEZ:  'EXAVITQu4vr4xnSDxMaL',  // Bella — diplomatic female commander
  LTC_AL_RASHID: 'ErXwobaYiN019PkySvjV',  // Antoni — formal, Middle Eastern context
  CW4_NGUYEN:    'TxGEqnHWrfWFTfGW9XjX',  // Josh — technical, precise

  // Campaign 5 — Korea
  MG_HARRIS:     'pNInz6obpgDQGcFmaJgB',  // Adam — senior, deliberate
  BG_KIM:        'yoZ06aMxZJJ28mfd3POQ',  // Sam — formal allied officer
  CPT_PARK:      '21m00Tcm4TlvDq8ikWAM',  // Rachel — sharp bilingual officer

  // Campaign 6 — Pacific
  RDML_FLETCHER: 'ErXwobaYiN019PkySvjV',  // Antoni — naval officer
  COL_SANTOS:    'VR6AewLTigWG4xSOukaG',  // Arnold — marine energy
  CW2_TAFAO:     'TxGEqnHWrfWFTfGW9XjX',  // Josh — quiet Pacific Islander
}

// Voice settings per character type
const VOICE_SETTINGS: Record<string, {stability:number;similarity_boost:number;style:number}> = {
  CDR:     { stability:0.75, similarity_boost:0.80, style:0.15 },  // Commanding
  SGM:     { stability:0.80, similarity_boost:0.75, style:0.10 },  // Gruff/direct
  S4:      { stability:0.70, similarity_boost:0.85, style:0.20 },  // Precise/technical
  WARRANT: { stability:0.82, similarity_boost:0.78, style:0.08 },  // Quiet/measured
  ALLIED:  { stability:0.72, similarity_boost:0.82, style:0.18 },  // Formal/proud
  DEFAULT: { stability:0.75, similarity_boost:0.80, style:0.15 },
}

// ── AUDIO CACHE ───────────────────────────────────────────────────────────────
const memCache = new Map<string, string>()  // cacheKey → objectURL

function cacheKey(speakerId: string, lineIdx: number) {
  return `el_${speakerId}_${lineIdx}`
}

// ── GENERATE SPEECH ───────────────────────────────────────────────────────────
export async function generateSpeech(
  speakerId: string,
  text: string,
  lineIdx: number,
  portraitStyle: string = 'CDR'
): Promise<string | null> {
  const key = cacheKey(speakerId, lineIdx)

  // Check memory cache
  if (memCache.has(key)) return memCache.get(key)!

  // Check sessionStorage cache
  try {
    const cached = sessionStorage.getItem(key)
    if (cached) {
      memCache.set(key, cached)
      return cached
    }
  } catch(e) {}

  const voiceId = CHARACTER_VOICES[speakerId]
  if (!voiceId) return null

  const settings = VOICE_SETTINGS[portraitStyle] || VOICE_SETTINGS.DEFAULT

  try {
    const res = await fetch(`${API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: settings,
        output_format: 'mp3_44100_128',
      }),
    })

    if (!res.ok) {
      console.warn(`ElevenLabs ${res.status} for ${speakerId}`)
      return null
    }

    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    memCache.set(key, url)

    // Cache in sessionStorage as base64 for persistence within session
    try {
      const reader = new FileReader()
      reader.onload = () => {
        try { sessionStorage.setItem(key, reader.result as string) } catch(e) {}
      }
      reader.readAsDataURL(blob)
    } catch(e) {}

    return url
  } catch(e) {
    console.warn('VoiceService error:', e)
    return null
  }
}

// Pre-generate first line for all characters in a scenario so there's no delay
export async function prefetchOpeningLines(
  sections: Array<{ speakerId: string; lines: string[] }>,
  characters: Array<{ id: string; portraitStyle: string }>
) {
  const charMap: Record<string, string> = {}
  characters.forEach(c => { charMap[c.id] = c.portraitStyle })

  // Only prefetch first line of first section — don't burn credits on unused lines
  const first = sections[0]
  if (first?.lines[0]) {
    await generateSpeech(first.speakerId, first.lines[0], 0, charMap[first.speakerId])
  }
}
