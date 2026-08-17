/**
 * Minimal SpeechRecognition tipi — brauzer Web Speech API (webkit-prefixed
 * versiyalari ham) uchun. `any` ishlatilishini oldini oladi.
 */
export interface SpeechRecognitionEvent {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence?: number } }>
}

export interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onnomatch: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}
