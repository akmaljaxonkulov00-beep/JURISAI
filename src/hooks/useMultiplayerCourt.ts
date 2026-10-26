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

interface UseMultiplayerCourtOptions {
  codeOrId: string
  currentUser?: {
    id: string
    name: string
    avatarUrl?: string
  } | null
}

export function useMultiplayerCourt({ codeOrId, currentUser }: UseMultiplayerCourtOptions) {
  const [room, setRoom] = useState<MultiplayerRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())

  // WebRTC Audio & Video State
  const [isMicMuted, setIsMicMuted] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isAudioConnected, setIsAudioConnected] = useState(false)
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

  // Session Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sttRecognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const lastObjectionIdRef = useRef<string | null>(null)

  // Stable User Identity: Authenticated User or persistent Guest
  const [myIdentity, setMyIdentity] = useState<{ id: string; name: string }>({
    id: '',
    name: '',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (currentUser?.id) {
      setMyIdentity({
        id: currentUser.id,
        name: currentUser.name || 'Ishtirokchi',
      })
      return
    }

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

    setMyIdentity({ id: guestId, name: guestName })
  }, [currentUser])

  // Get Custom Request Headers
  const getHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const authHeaders = await getAuthHeaders()
    return {
      ...authHeaders,
      'Content-Type': 'application/json',
      'x-guest-id': myIdentity.id,
      'x-guest-name': encodeURIComponent(myIdentity.name),
    }
  }, [myIdentity])

  // Fetch Room State from API
  const fetchRoomState = useCallback(async () => {
    if (!codeOrId) return
    try {
      const headers = await getHeaders()
      const res = await fetch(`/api/court/multiplayer/rooms/${codeOrId}`, { headers })
      const data = await res.json()
      if (data.success && data.room) {
        setRoom(prev => {
          // Play sound cues on external stage changes or objections
          if (
            data.room.pendingObjection &&
            data.room.pendingObjection.id !== lastObjectionIdRef.current
          ) {
            lastObjectionIdRef.current = data.room.pendingObjection.id
            courtroomAudio.playObjectionChime()
          }
          if (prev && prev.currentStageId !== data.room.currentStageId) {
            courtroomAudio.playGavelSound()
          }
          return data.room
        })
        setError(null)
      } else if (!room) {
        setError(data.error || 'Sud zali ma’lumotlarini yuklab bo‘lmadi')
      }
    } catch (e: any) {
      console.error('fetchRoomState error:', e)
      if (!room) setError(e.message || 'Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }, [codeOrId, getHeaders, room])

  // Perform Server Authoritative Action
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
          setRoom(data.room)

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
              payload: { room: data.room, action },
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

  // ── WebRTC Voice & Video Signaling Setup ──
  const setupPeerConnection = useCallback(
    (peerUserId: string, isInitiator: boolean) => {
      if (typeof window === 'undefined' || !window.RTCPeerConnection) return null
      if (peerConnectionsRef.current.has(peerUserId)) {
        return peerConnectionsRef.current.get(peerUserId)!
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      })

      // Attach local stream tracks (audio and/or video)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }

      // Handle ICE Candidates
      pc.onicecandidate = event => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              targetUserId: peerUserId,
              senderUserId: myIdentity.id,
              candidate: event.candidate,
            },
          })
        }
      }

      // Handle incoming remote media tracks (Audio & Video)
      pc.ontrack = event => {
        const stream = event.streams[0]
        if (!stream) return

        setRemoteStreams(prev => ({
          ...prev,
          [peerUserId]: stream,
        }))

        // Play audio if track is audio
        if (event.track.kind === 'audio') {
          const remoteAudio = new Audio()
          remoteAudio.srcObject = stream
          remoteAudio.play().catch(() => {
            // Autoplay policy handling
          })
        }
      }

      peerConnectionsRef.current.set(peerUserId, pc)

      if (isInitiator) {
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            if (channelRef.current) {
              channelRef.current.send({
                type: 'broadcast',
                event: 'webrtc_signal',
                payload: {
                  targetUserId: peerUserId,
                  senderUserId: myIdentity.id,
                  offer: pc.localDescription,
                },
              })
            }
          })
          .catch(e => console.error('Error creating WebRTC offer:', e))
      }

      return pc
    },
    [myIdentity.id]
  )

  // Ensure Local Media Stream (Audio / Video)
  const getOrCreateLocalStream = useCallback(
    async (withVideo = false): Promise<MediaStream | null> => {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) return null

      try {
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
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
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
            peerConnectionsRef.current.forEach(pc => {
              pc.addTrack(videoTrack, localStreamRef.current!)
            })
          }
          return localStreamRef.current
        }
        return localStreamRef.current
      } catch (err) {
        console.warn('getUserMedia error:', err)
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
        const newMuted = !audioTrack.enabled
        audioTrack.enabled = !audioTrack.enabled
        setIsMicMuted(!audioTrack.enabled)

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'mic_status',
            payload: { userId: myIdentity.id, isMuted: !audioTrack.enabled },
          })
        }
      }
    } catch (err) {
      console.warn('Microphone toggle failed:', err)
      setIsMicMuted(true)
    }
  }, [getOrCreateLocalStream, myIdentity.id])

  // Toggle Camera (Video)
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
          setVideoEnabledUserIds(prev => new Set(prev).add(myIdentity.id))

          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'video_status',
              payload: { userId: myIdentity.id, isVideoOn: true },
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
          next.delete(myIdentity.id)
          return next
        })

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'video_status',
            payload: { userId: myIdentity.id, isVideoOn: false },
          })
        }
      }
    } catch (err) {
      console.warn('Camera toggle failed:', err)
      setIsVideoOn(false)
    }
  }, [getOrCreateLocalStream, isVideoOn, myIdentity.id])

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

          // Broadcast live subtitle to all participants
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'live_speech_subtitle',
              payload: {
                userId: myIdentity.id,
                userName: myIdentity.name,
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
  }, [myIdentity.id, myIdentity.name])

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

  // ── Supabase Realtime Channel & Presence Subscription ──
  useEffect(() => {
    if (!codeOrId || !myIdentity.id) return

    fetchRoomState()

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
        setConnected(true)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds(prev => new Set(prev).add(key))
        if (key !== myIdentity.id && localStreamRef.current) {
          setupPeerConnection(key, true)
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
        setRemoteStreams(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      })

    // 2. Broadcast Events (Instant State Updates across all peer browsers)
    channel.on('broadcast', { event: 'court_state_update' }, ({ payload }) => {
      if (payload?.room) {
        setRoom(prev => {
          if (
            payload.action === 'advance_stage' ||
            payload.action === 'issue_verdict' ||
            payload.action === 'start'
          ) {
            courtroomAudio.playGavelSound()
          } else if (payload.action === 'raise_objection') {
            courtroomAudio.playObjectionChime()
          }
          return payload.room
        })
      }
    })

    // 3. WebRTC Audio & Video Signaling
    channel.on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
      if (payload.targetUserId !== myIdentity.id) return
      const senderId = payload.senderUserId

      let pc = peerConnectionsRef.current.get(senderId)
      if (!pc) {
        pc = setupPeerConnection(senderId, false)!
      }

      if (payload.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
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
      } else if (payload.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer))
      } else if (payload.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
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
        setConnected(true)
        await channel.track({
          userId: myIdentity.id,
          userName: myIdentity.name,
          onlineAt: new Date().toISOString(),
        })
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setConnected(false)
      }
    })

    // Periodic Heartbeat Sync fallback
    pollTimerRef.current = setInterval(() => {
      fetchRoomState()
    }, 4000)

    // Courtroom Session Timer interval
    const sessionTimer = setInterval(() => {
      setElapsedSeconds(s => s + 1)
    }, 1000)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      clearInterval(sessionTimer)
      if (sttRecognitionRef.current) {
        sttRecognitionRef.current.stop()
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
      }
      peerConnectionsRef.current.forEach(pc => pc.close())
      peerConnectionsRef.current.clear()
      supabase.removeChannel(channel)
    }
  }, [codeOrId, myIdentity.id, myIdentity.name, fetchRoomState, setupPeerConnection])

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
    connected,
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
