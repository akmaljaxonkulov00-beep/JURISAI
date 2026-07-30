'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechToTextOptions {
  /** Language code, default 'uz-UZ' */
  lang?: string
  /** Whether to auto-restart on silence after a pause */
  continuous?: boolean
  /** Interim results callback */
  onInterim?: (text: string) => void
  /** Final result callback */
  onResult?: (text: string) => void
  /** Error callback */
  onError?: (error: string) => void
}

interface SpeechToTextState {
  isListening: boolean
  isSupported: boolean
  isProcessing: boolean
  interimText: string
  finalText: string
  /** Visualizer data: array of volume levels (0-100) for wave animation */
  audioLevel: number
  error: string | null
}

const SILENCE_TIMEOUT_MS = 2000 // Stop after 2s of silence

export function useSpeechToText(options: SpeechToTextOptions = {}): SpeechToTextState & {
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  reset: () => void
} {
  const { lang = 'uz-UZ', continuous = false, onInterim, onResult, onError } = options

  const [state, setState] = useState<SpeechToTextState>({
    isListening: false,
    isSupported: false,
    isProcessing: false,
    interimText: '',
    finalText: '',
    audioLevel: 0,
    error: null,
  })

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioAnimFrameRef = useRef<number>(0)
  const isListeningRef = useRef(false)

  // Check support on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setState(prev => ({ ...prev, isSupported: supported }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListeningInternal()
      if (audioAnimFrameRef.current) {
        cancelAnimationFrame(audioAnimFrameRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Simulate audio levels for visualizer when listening.
  // Uses fake random values rather than real AnalyserNode data from Web Audio API
  // because the Web Speech API does not expose audio levels.
  // In a production upgrade, replace with getUserMedia + AnalyserNode for real VU levels.
  const startAudioVisualizer = () => {
    const animate = () => {
      if (!isListeningRef.current) return // stop the loop when idle
      // Vary randomly in 20-90 range for natural-looking wave motion
      const level = Math.floor(Math.random() * 50) + 25
      setState(prev => ({ ...prev, audioLevel: level }))
      audioAnimFrameRef.current = requestAnimationFrame(animate)
    }
    audioAnimFrameRef.current = requestAnimationFrame(animate)
  }

  const stopListeningInternal = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    isListeningRef.current = false
  }, [])

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: "Brauzer ovozli kiritishni qo'llab-quvvatlamaydi" }))
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: 'Speech Recognition API mavjud emas',
      }))
      return
    }

    // Stop any existing recognition
    stopListeningInternal()

    const recognition = new SpeechRecognition()
    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.lang = lang
    (recognition as any).maxAlternatives = 1

    recognition.onstart = () => {
      isListeningRef.current = true
      setState(prev => ({
        ...prev,
        isListening: true,
        isProcessing: false,
        error: null,
      }))
      startAudioVisualizer()
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      setState(prev => ({
        ...prev,
        interimText: interim,
        finalText: prev.finalText + (final ? (prev.finalText ? ' ' : '') + final : ''),
        audioLevel: Math.floor(Math.random() * 40) + 40, // spike on speech
      }))

      if (final) {
        onResult?.(final)
        // Silence timeout only needed in continuous mode;
        // in non-continuous mode the API auto-stops after each utterance.
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }
        if (continuous) {
          silenceTimerRef.current = setTimeout(() => {
            stopListening()
          }, SILENCE_TIMEOUT_MS)
        }
      } else if (interim) {
        onInterim?.(interim)
      }
    }

    recognition.onerror = (event: any) => {
      const errorMsg =
        event.error === 'no-speech'
          ? 'Ovoz eshitilmadi'
          : event.error === 'aborted'
            ? "To'xtatildi"
            : event.error === 'audio-capture'
              ? 'Mikrofon topilmadi'
              : event.error === 'not-allowed'
                ? 'Mikrofonga ruxsat berilmagan'
                : `Xatolik: ${event.error}`
      setState(prev => ({
        ...prev,
        isListening: false,
        error: errorMsg,
        audioLevel: 0,
      }))
      isListeningRef.current = false
      onError?.(errorMsg)
    }

    recognition.onend = () => {
      isListeningRef.current = false
      setState(prev => ({
        ...prev,
        isListening: false,
        audioLevel: 0,
      }))
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [state.isSupported, continuous, lang, onResult, onInterim, onError, stopListeningInternal])

  const stopListening = useCallback(() => {
    stopListeningInternal()
    setState(prev => ({
      ...prev,
      isListening: false,
      interimText: '',
      audioLevel: 0,
    }))
  }, [stopListeningInternal])

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening()
    } else {
      startListening()
    }
  }, [startListening, stopListening])

  const reset = useCallback(() => {
    stopListening()
    setState(prev => ({
      ...prev,
      interimText: '',
      finalText: '',
      audioLevel: 0,
      error: null,
    }))
  }, [stopListening])

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    reset,
  }
}
