'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { getAuthHeaders } from '@/lib/api-auth-client'
import { courtroomAudio } from '@/lib/court/courtroom-audio'
import { getSpeechRecognitionCtor, type SpeechRecognitionInstance } from '@/lib/speech-types'
import type {
  MultiplayerRoom,
  MultiplayerParticipant,
  MultiplayerRole,
  MultiplayerEvidenceItem,
} from '@/lib/court/multiplayer-types'

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'

interface UseMultiplayerCourtOptions {
  codeOrId: string
  currentUser?: {
    id: string
    name: string
    avatarUrl?: string
  } | null
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export function useMultiplayerCourt({ codeOrId, currentUser }: UseMultiplayerCourtOptions) {
  const [room, setRoom] = useState<MultiplayerRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())

  // WebRTC Audio & Video State
  const [isMicMuted, setIsMicMuted] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isAudioConnected, setIsAudioConnected] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set())
  const [videoEnabledUserIds, setVideoEnabledUserIds] = useState<Set<string>>(new Set())
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})

  // Speech-To-Text (STT) Live Transcription State
  const [isListeningSTT, setIsListeningSTT] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [liveSubtitles, setLiveSubtitles] = useState<
    Record<string, { text: string; role?: string; updatedAt: number }>
  >({})

  // Sound Effects
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true)

  // Authoritative Session Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Stable internal references
  const roomRef = useRef<MultiplayerRoom | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const iceCandidatesBufferRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sttRecognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const lastObjectionIdRef = useRef<string | null>(null)
  const lastStageIdRef = useRef<string | null>(null)

  // Keep roomRef updated without causing re-renders
  useEffect(() => {
    roomRef.current = room
  }, [room])

  // Stable User Identity: Authenticated User or persistent Guest
  const [myIdentity, setMyIdentity] = useState<{ id: string; name: string }>({
    id: '',
    name: '',
  })
  const myIdentityRef = useRef<{ id: string; name: string }>({ id: '', name: '' })

  useEffect(() => {
    if (typeof window === 'undefined') return

    let identity = { id: '', name: '' }
    if (currentUser?.id) {
      identity = {
        id: currentUser.id,
        name: currentUser.name || 'Ishtirokchi',
      }
    } else {
      // Persistent Guest Identity for dual-browser simulation
      let guestId = sessionStorage.getItem('juristiv_mp_guest_id')
      let guestName = sessionStorage.getItem('juristiv_mp_guest_name')

      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 10)
        sessionStorage.setItem('juristiv_mp_guest_id', guestId)
      }
      if (!guestName) {
        guestName = 'Mehmon ' + Math.floor(Math.random() * 900 + 100)
        sessionStorage.setItem('juristiv_mp_guest_name', guestName)
      }

      identity = { id: guestId, name: guestName }
    }

    setMyIdentity(identity)
    myIdentityRef.current = identity
  }, [currentUser])

  // Get Custom Request Headers
  const getHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const authHeaders = await getAuthHeaders()
    const identity = myIdentityRef.current
    return {
      ...authHeaders,
      'Content-Type': 'application/json',
      'x-guest-id': identity.id,
      'x-guest-name': encodeURIComponent(identity.name || 'Ishtirokchi'),
    }
  }, [])

  // ── Fetch Room State from API (Server Authoritative) ──
  const fetchRoomState = useCallback(async () => {
    if (!codeOrId) return
    try {
      const headers = await getHeaders()
      const res = await fetch(`/api/court/multiplayer/rooms/${codeOrId}`, { headers })
      const data = await res.json()
      if (data.success && data.room) {
        const newRoom = data.room as MultiplayerRoom

        // Play sound cues on external stage changes or objections
        if (
          newRoom.pendingObjection &&
          newRoom.pendingObjection.id !== lastObjectionIdRef.current
        ) {
          lastObjectionIdRef.current = newRoom.pendingObjection.id
          courtroomAudio.playObjectionChime()
        }

        if (
          lastStageIdRef.current &&
          lastStageIdRef.current !== newRoom.currentStageId
        ) {
          courtroomAudio.playGavelSound()
        }
        lastStageIdRef.current = newRoom.currentStageId

        setRoom(newRoom)
        setError(null)
      } else if (!roomRef.current) {
        setError(data.error || 'Sud zali ma’lumotlarini yuklab bo‘lmadi')
      }
    } catch (e: any) {
      console.error('fetchRoomState error:', e)
      if (!roomRef.current) setError(e.message || 'Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }, [codeOrId, getHeaders])

  const fetchRoomStateRef = useRef(fetchRoomState)
  useEffect(() => {
    fetchRoomStateRef.current = fetchRoomState
  }, [fetchRoomState])

  // ── Perform Server Authoritative Action ──
  const performAction = useCallback(
    async (action: string, payload: Record<string, any> = {}) => {
      try {
        const headers = await getHeaders()
        const res = await fetch(`/api/court/multiplayer/rooms/${codeOrId}/action`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action, ...payload }),
        })
        const data = await res.json()
        if (!data.success) {
          throw new Error(data.error || 'Harakatni bajarishda xatolik yuz berdi')
        }

        if (data.room) {
          const updated = data.room as MultiplayerRoom
          setRoom(updated)
          lastStageIdRef.current = updated.currentStageId

          // Sound triggers based on action
          if (
            action === 'start' ||
            action === 'advance_stage' ||
            action === 'issue_verdict' ||
            action === 'rule_objection'
          ) {
            courtroomAudio.playGavelSound()
          } else if (action === 'raise_objection') {
            courtroomAudio.playObjectionChime()
          }

          // Broadcast instant update to all peer clients
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'court_state_update',
              payload: { room: updated, action },
            })
          }
        }
        return data.room
      } catch (err: any) {
        console.error(`Action [${action}] failed:`, err)
        throw err
      }
    },
    [codeOrId, getHeaders]
  )

  // ── WebRTC ICE Candidate Buffer Helper ──
  const addOrQueueIceCandidate = useCallback(
    async (peerUserId: string, pc: RTCPeerConnection, candidate: RTCIceCandidateInit) => {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.warn(`ICE candidate add error (${peerUserId}):`, err)
        }
      } else {
        if (!iceCandidatesBufferRef.current.has(peerUserId)) {
          iceCandidatesBufferRef.current.set(peerUserId, [])
        }
        iceCandidatesBufferRef.current.get(peerUserId)!.push(candidate)
      }
    },
    []
  )

  const drainQueuedIceCandidates = useCallback(
    async (peerUserId: string, pc: RTCPeerConnection) => {
      const queued = iceCandidatesBufferRef.current.get(peerUserId)
      if (queued && queued.length > 0) {
        for (const cand of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand))
          } catch (err) {
            console.warn(`ICE candidate drain error (${peerUserId}):`, err)
          }
        }
        iceCandidatesBufferRef.current.delete(peerUserId)
      }
    },
    []
  )

  // ── WebRTC Peer Connection Setup ──
  const setupPeerConnection = useCallback(
    (peerUserId: string, isInitiator: boolean): RTCPeerConnection | null => {
      if (typeof window === 'undefined' || !window.RTCPeerConnection) return null

      if (peerConnectionsRef.current.has(peerUserId)) {
        return peerConnectionsRef.current.get(peerUserId)!
      }

      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
      })

      // Attach existing local tracks (mic and/or camera)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }

      // Handle local ICE candidates
      pc.onicecandidate = event => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              targetUserId: peerUserId,
              senderUserId: myIdentityRef.current.id,
              candidate: event.candidate.toJSON(),
            },
          })
        }
      }

      // Handle remote incoming tracks (Audio & Video)
      pc.ontrack = event => {
        const stream = event.streams[0]
        if (!stream) return

        setRemoteStreams(prev => ({
          ...prev,
          [peerUserId]: stream,
        }))

        // Handle remote audio playback
        if (event.track.kind === 'audio') {
          let audioEl = remoteAudioElementsRef.current.get(peerUserId)
          if (!audioEl) {
            audioEl = new Audio()
            audioEl.autoplay = true
            remoteAudioElementsRef.current.set(peerUserId, audioEl)
          }
          audioEl.srcObject = stream
          audioEl.play().catch(playErr => {
            if (playErr.name === 'NotAllowedError') {
              setAutoplayBlocked(true)
            }
          })
        }
      }

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          // Attempt graceful cleanup of dead peer
          if (peerConnectionsRef.current.get(peerUserId) === pc) {
            peerConnectionsRef.current.delete(peerUserId)
          }
        }
      }

      peerConnectionsRef.current.set(peerUserId, pc)

      if (isInitiator) {
        pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            if (channelRef.current) {
              channelRef.current.send({
                type: 'broadcast',
                event: 'webrtc_signal',
                payload: {
                  targetUserId: peerUserId,
                  senderUserId: myIdentityRef.current.id,
                  offer: pc.localDescription,
                },
              })
            }
          })
          .catch(e => console.error('Error creating WebRTC offer:', e))
      }

      return pc
    },
    []
  )

  const setupPeerConnectionRef = useRef(setupPeerConnection)
  useEffect(() => {
    setupPeerConnectionRef.current = setupPeerConnection
  }, [setupPeerConnection])

  // ── Acquire or expand local media stream ──
  const getOrCreateLocalStream = useCallback(
    async (withVideo = false): Promise<MediaStream | null> => {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        setMediaError('Brauzeringiz audio/video qurilmalarini qo‘llab-quvvatlamaydi.')
        return null
      }

      try {
        setMediaError(null)

        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: withVideo
              ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 24 } }
              : false,
          })

          localStreamRef.current = stream
          setLocalStream(stream)
          setIsAudioConnected(true)

          // Attach tracks to all existing peer connections
          peerConnectionsRef.current.forEach(pc => {
            stream.getTracks().forEach(track => pc.addTrack(track, stream))
          })

          return stream
        } else if (withVideo && localStreamRef.current.getVideoTracks().length === 0) {
          // Add video track to existing stream
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 24 } },
          })
          const videoTrack = videoStream.getVideoTracks()[0]
          if (videoTrack) {
            localStreamRef.current.addTrack(videoTrack)
            const updated = new MediaStream(localStreamRef.current.getTracks())
            setLocalStream(updated)

            // Attach new track and renegotiate with all peers
            peerConnectionsRef.current.forEach(async (pc, peerId) => {
              pc.addTrack(videoTrack, localStreamRef.current!)
              try {
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)
                if (channelRef.current) {
                  channelRef.current.send({
                    type: 'broadcast',
                    event: 'webrtc_signal',
                    payload: {
                      targetUserId: peerId,
                      senderUserId: myIdentityRef.current.id,
                      offer: pc.localDescription,
                    },
                  })
                }
              } catch (renegErr) {
                console.warn('Renegotiation error on adding video track:', renegErr)
              }
            })
          }
          return localStreamRef.current
        }

        return localStreamRef.current
      } catch (err: any) {
        console.warn('getUserMedia error:', err)
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMediaError('Mikrofon yoki kameradan foydalanishga ruxsat berilmadi. Iltimos, brauzer sozlamalarida ruxsatni yoqing.')
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMediaError('Qurilmangizda mikrofon yoki kamera topilmadi.')
        } else if (err.name === 'NotReadableError') {
          setMediaError('Mikrofon yoki kamera boshqa dastur tomonidan band qilingan.')
        } else {
          setMediaError('Qurilmaga ulanishda xatolik yuz berdi: ' + (err.message || ''))
        }
        return null
      }
    },
    []
  )

  // Toggle Microphone
  const toggleMute = useCallback(async () => {
    try {
      const stream = await getOrCreateLocalStream(false)
      if (!stream) {
        setIsAudioConnected(false)
        setIsMicMuted(true)
        return
      }

      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        const nextEnabled = !audioTrack.enabled
        audioTrack.enabled = nextEnabled
        setIsMicMuted(!nextEnabled)

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'mic_status',
            payload: { userId: myIdentityRef.current.id, isMuted: !nextEnabled },
          })
        }
      }
    } catch (err) {
      console.warn('Microphone toggle failed:', err)
      setIsMicMuted(true)
    }
  }, [getOrCreateLocalStream])

  // Toggle Camera
  const toggleVideo = useCallback(async () => {
    try {
      if (!isVideoOn) {
        // Turn video ON
        const stream = await getOrCreateLocalStream(true)
        if (!stream) return

        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.enabled = true
          setIsVideoOn(true)
          setVideoEnabledUserIds(prev => new Set(prev).add(myIdentityRef.current.id))

          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'video_status',
              payload: { userId: myIdentityRef.current.id, isVideoOn: true },
            })
          }
        }
      } else {
        // Turn video OFF
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(t => {
            t.enabled = false
            t.stop()
            localStreamRef.current?.removeTrack(t)
          })
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
        }
        setIsVideoOn(false)
        setVideoEnabledUserIds(prev => {
          const next = new Set(prev)
          next.delete(myIdentityRef.current.id)
          return next
        })

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'video_status',
            payload: { userId: myIdentityRef.current.id, isVideoOn: false },
          })
        }
      }
    } catch (err) {
      console.warn('Camera toggle failed:', err)
      setIsVideoOn(false)
    }
  }, [getOrCreateLocalStream, isVideoOn])

  // Unlock Autoplay Audio
  const unlockAudio = useCallback(() => {
    remoteAudioElementsRef.current.forEach(audio => {
      audio.play().catch(() => {})
    })
    setAutoplayBlocked(false)
  }, [])

  // ── Speech-To-Text (STT) Live Transcription Engine ──
  const startSTT = useCallback(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = getSpeechRecognitionCtor()
    if (!SpeechRecognition) {
      alert(
        'Brauzeringizda ovozni matnga aylantirish (Speech-to-Text) qo‘llab-quvvatlanmaydi. Google Chrome tavsiya etiladi.'
      )
      return
    }

    try {
      if (sttRecognitionRef.current) {
        sttRecognitionRef.current.stop()
      }

      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'uz-UZ'
      rec.maxAlternatives = 1

      rec.onstart = () => {
        setIsListeningSTT(true)
      }

      rec.onresult = (event: any) => {
        let interimText = ''
        let finalText = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalText += transcript
          } else {
            interimText += transcript
          }
        }

        const currentText = finalText || interimText
        if (currentText) {
          setLiveTranscript(currentText)

          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'live_speech_subtitle',
              payload: {
                userId: myIdentityRef.current.id,
                userName: myIdentityRef.current.name,
                text: currentText,
                isFinal: Boolean(finalText),
              },
            })
          }
        }
      }

      rec.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('STT Error:', e.error)
        }
      }

      rec.onend = () => {
        setIsListeningSTT(false)
      }

      rec.start()
      sttRecognitionRef.current = rec
    } catch (e) {
      console.error('Failed to start STT:', e)
      setIsListeningSTT(false)
    }
  }, [])

  const stopSTT = useCallback(() => {
    if (sttRecognitionRef.current) {
      sttRecognitionRef.current.stop()
      sttRecognitionRef.current = null
    }
    setIsListeningSTT(false)
  }, [])

  const toggleSTT = useCallback(() => {
    if (isListeningSTT) {
      stopSTT()
    } else {
      startSTT()
    }
  }, [isListeningSTT, startSTT, stopSTT])

  // ── Authoritative Session Timer Loop (Derived from Server Timestamps) ──
  useEffect(() => {
    const updateTimer = () => {
      const current = roomRef.current
      if (!current) return

      if (current.status === 'waiting') {
        setElapsedSeconds(0)
        return
      }

      if (current.status === 'in_progress') {
        const start = current.startedAt
          ? new Date(current.startedAt).getTime()
          : new Date(current.createdAt).getTime()
        const diff = Math.max(0, Math.floor((Date.now() - start) / 1000))
        setElapsedSeconds(diff)
        return
      }

      if (current.status === 'completed') {
        if (current.durationSeconds !== undefined && current.durationSeconds > 0) {
          setElapsedSeconds(current.durationSeconds)
          return
        }
        const start = current.startedAt
          ? new Date(current.startedAt).getTime()
          : new Date(current.createdAt).getTime()
        const end = current.completedAt
          ? new Date(current.completedAt).getTime()
          : new Date(current.updatedAt).getTime()
        const diff = Math.max(0, Math.floor((end - start) / 1000))
        setElapsedSeconds(diff)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  // ── Main Supabase Realtime Channel & WebRTC Signaling ──
  // STABLE: Only runs when codeOrId or myIdentity.id changes
  useEffect(() => {
    if (!codeOrId || !myIdentity.id) return

    setConnectionState('connecting')
    fetchRoomStateRef.current()

    const channelName = `court_room_${codeOrId.toUpperCase().trim()}`
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: myIdentity.id,
        },
      },
    })

    channelRef.current = channel

    // 1. Presence Sync (Online participants)
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const userIds = new Set<string>()
        for (const [key] of Object.entries(presenceState)) {
          userIds.add(key)
        }
        setOnlineUserIds(userIds)
        setConnectionState('connected')
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds(prev => new Set(prev).add(key))
        if (key !== myIdentity.id && localStreamRef.current) {
          setupPeerConnectionRef.current(key, true)
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUserIds(prev => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
        const pc = peerConnectionsRef.current.get(key)
        if (pc) {
          pc.close()
          peerConnectionsRef.current.delete(key)
        }
        iceCandidatesBufferRef.current.delete(key)
        const audioEl = remoteAudioElementsRef.current.get(key)
        if (audioEl) {
          audioEl.srcObject = null
          remoteAudioElementsRef.current.delete(key)
        }
        setRemoteStreams(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      })

    // 2. Broadcast Events (Instant State Updates across all peer browsers)
    channel.on('broadcast', { event: 'court_state_update' }, ({ payload }) => {
      if (payload?.room) {
        const updated = payload.room as MultiplayerRoom
        setRoom(updated)
        lastStageIdRef.current = updated.currentStageId

        if (
          payload.action === 'advance_stage' ||
          payload.action === 'issue_verdict' ||
          payload.action === 'start'
        ) {
          courtroomAudio.playGavelSound()
        } else if (payload.action === 'raise_objection') {
          courtroomAudio.playObjectionChime()
        }
      }
    })

    // 3. WebRTC Audio & Video Signaling with Candidate Buffering
    channel.on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
      if (!payload || payload.targetUserId !== myIdentity.id) return
      const senderId = payload.senderUserId
      if (!senderId) return

      let pc = peerConnectionsRef.current.get(senderId)
      if (!pc) {
        pc = setupPeerConnectionRef.current(senderId, false)!
      }

      if (payload.offer) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
          await drainQueuedIceCandidates(senderId, pc)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          channel.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              targetUserId: senderId,
              senderUserId: myIdentity.id,
              answer: pc.localDescription,
            },
          })
        } catch (err) {
          console.error(`Error handling WebRTC offer from ${senderId}:`, err)
        }
      } else if (payload.answer) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer))
          await drainQueuedIceCandidates(senderId, pc)
        } catch (err) {
          console.error(`Error handling WebRTC answer from ${senderId}:`, err)
        }
      } else if (payload.candidate) {
        await addOrQueueIceCandidate(senderId, pc, payload.candidate)
      }
    })

    // 4. Mic & Video Status Indicators
    channel.on('broadcast', { event: 'mic_status' }, ({ payload }) => {
      if (payload?.userId) {
        setSpeakingParticipants(prev => {
          const next = new Set(prev)
          if (!payload.isMuted) next.add(payload.userId)
          else next.delete(payload.userId)
          return next
        })
      }
    })

    channel.on('broadcast', { event: 'video_status' }, ({ payload }) => {
      if (payload?.userId) {
        setVideoEnabledUserIds(prev => {
          const next = new Set(prev)
          if (payload.isVideoOn) next.add(payload.userId)
          else next.delete(payload.userId)
          return next
        })
      }
    })

    // 5. Live Speech-to-Text Subtitles
    channel.on('broadcast', { event: 'live_speech_subtitle' }, ({ payload }) => {
      if (payload?.userId && payload?.text) {
        setLiveSubtitles(prev => ({
          ...prev,
          [payload.userId]: {
            text: payload.text,
            role: payload.role,
            updatedAt: Date.now(),
          },
        }))
      }
    })

    // Subscribe to channel
    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        setConnectionState('connected')
        await channel.track({
          userId: myIdentity.id,
          userName: myIdentity.name,
          onlineAt: new Date().toISOString(),
        })
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        setConnectionState('reconnecting')
      } else if (status === 'CLOSED') {
        setConnectionState('disconnected')
      }
    })

    // Periodic Heartbeat Sync fallback (stable reference, no re-triggering)
    pollTimerRef.current = setInterval(() => {
      fetchRoomStateRef.current()
    }, 5000)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      if (sttRecognitionRef.current) {
        sttRecognitionRef.current.stop()
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
        localStreamRef.current = null
      }
      peerConnectionsRef.current.forEach(pc => pc.close())
      peerConnectionsRef.current.clear()
      iceCandidatesBufferRef.current.clear()
      remoteAudioElementsRef.current.forEach(audio => {
        audio.srcObject = null
      })
      remoteAudioElementsRef.current.clear()
      supabase.removeChannel(channel)
    }
  }, [codeOrId, myIdentity.id, addOrQueueIceCandidate, drainQueuedIceCandidates])

  // Current Participant Record
  const myParticipant: MultiplayerParticipant | undefined = room?.participants.find(
    p => p.userId === myIdentity.id
  )

  const isHost = myParticipant?.isHost || room?.hostId === myIdentity.id
  const isJudge = myParticipant?.role === 'SUDYA'
  const isObserver = myParticipant?.role === 'KUZATUVCHI'
  const canSpeak =
    isJudge ||
    myParticipant?.canSpeak ||
    room?.currentSpeakerId === myIdentity.id ||
    room?.status === 'waiting'

  // ── Exposed Action Callbacks ──
  const startTrial = () => performAction('start')
  const assignRole = (targetUserId: string, newRole: MultiplayerRole) =>
    performAction('assign_role', { targetUserId, newRole })
  const advanceStage = (nextStageId?: string) => performAction('advance_stage', { nextStageId })
  const speak = (content: string) => performAction('speak', { content })
  const requestSpeaking = (queueAction: 'request' | 'cancel') =>
    performAction('speaking_queue', { queueAction })
  const grantSpeaking = (targetUserId: string | null) =>
    performAction('grant_speech', { targetUserId })
  const raiseObjection = (reason: string, targetRole?: string) =>
    performAction('raise_objection', { reason, targetRole })
  const ruleOnObjection = (ruling: 'sustained' | 'overruled', reasoning: string) =>
    performAction('rule_objection', { ruling, reasoning })
  const submitEvidence = (data: {
    title: string
    type: any
    description: string
    content: string
    referenceNumber?: string
    fileUrl?: string
    visibility?: any
  }) => performAction('submit_evidence', data)
  const ruleOnEvidence = (evidenceId: string, status: 'admitted' | 'rejected', reason: string) =>
    performAction('rule_evidence', { evidenceId, status, reason })
  const issueVerdict = (data: {
    verdictDecision: any
    title: string
    summary: string
    legalReasoning: string
    penaltyOrRemedy: string
  }) => performAction('issue_verdict', data)
  const kick = (targetUserId: string) => performAction('kick', { targetUserId })
  const leave = () => performAction('leave')

  return {
    room,
    loading,
    error,
    connected: connectionState === 'connected',
    connectionState,
    onlineUserIds,
    myIdentity,
    myParticipant,
    isHost,
    isJudge,
    isObserver,
    canSpeak,
    isMicMuted,
    isVideoOn,
    isAudioConnected,
    mediaError,
    autoplayBlocked,
    unlockAudio,
    speakingParticipants,
    videoEnabledUserIds,
    localStream,
    remoteStreams,
    isListeningSTT,
    liveTranscript,
    liveSubtitles,
    elapsedSeconds,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
    toggleMute,
    toggleVideo,
    toggleSTT,
    setLiveTranscript,
    refetch: fetchRoomState,
    startTrial,
    assignRole,
    advanceStage,
    speak,
    requestSpeaking,
    grantSpeaking,
    raiseObjection,
    ruleOnObjection,
    submitEvidence,
    ruleOnEvidence,
    issueVerdict,
    kick,
    leave,
  }
}
