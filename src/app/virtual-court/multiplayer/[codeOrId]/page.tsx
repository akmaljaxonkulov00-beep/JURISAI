'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Gavel,
  Users,
  FileText,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Scale,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useMultiplayerCourt } from '@/hooks/useMultiplayerCourt'
import CourtroomTopBar from '@/components/court/multiplayer/CourtroomTopBar'
import CourtroomStageProgress from '@/components/court/multiplayer/CourtroomStageProgress'
import CourtroomParticipantsSidebar from '@/components/court/multiplayer/CourtroomParticipantsSidebar'
import CourtroomCenterStage from '@/components/court/multiplayer/CourtroomCenterStage'
import CourtroomEvidencePanel from '@/components/court/multiplayer/CourtroomEvidencePanel'
import CourtroomChatSidebar from '@/components/court/multiplayer/CourtroomChatSidebar'
import CourtroomBottomControls from '@/components/court/multiplayer/CourtroomBottomControls'
import CourtroomVerdictModal from '@/components/court/multiplayer/CourtroomVerdictModal'
import CourtroomPostTrialResults from '@/components/court/multiplayer/CourtroomPostTrialResults'

export default function MultiplayerCourtroomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const codeOrId = (params?.codeOrId as string) || ''

  const {
    room,
    loading,
    error,
    connected,
    connectionState,
    onlineUserIds,
    myParticipant,
    isHost,
    isJudge,
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
    endSession,
    cancelSession,
    kick,
    leave,
  } = useMultiplayerCourt({
    codeOrId,
    currentUser: user,
  })

  // Mobile / Tablet navigation tab
  const [activeMobileTab, setActiveMobileTab] = useState<
    'stage' | 'evidence' | 'participants' | 'chat'
  >('stage')
  const [showVerdictModal, setShowVerdictModal] = useState(false)
  const [centerSubTab, setCenterSubTab] = useState<'arena' | 'evidence'>('arena')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  const handleLeaveRoom = async () => {
    try {
      await leave()
    } finally {
      router.push('/virtual-court/multiplayer')
    }
  }

  // ── Loading Screen ──
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 space-y-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-pulse">
          <Gavel className="w-7 h-7" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold">Virtual Sud Zali yuklanmoqda...</h2>
          <p className="text-xs text-zinc-400 font-mono">Xona kodi: {codeOrId}</p>
        </div>
      </div>
    )
  }

  // ── Error Screen ──
  if (error || !room) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">Sud zaliga kirish imkoni bo‘lmadi</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {error || 'Xona topilmadi yoki sessiya vaqti tugagan.'}
          </p>
          <div className="pt-2">
            <Link
              href="/virtual-court/multiplayer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Multiplayer lobbiyga qaytish</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Completed Trial: Post-Trial Results Screen ──
  if (room.status === 'completed') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col text-white">
        <CourtroomTopBar
          room={room}
          myParticipant={myParticipant}
          connected={connected}
          connectionState={connectionState}
          onlineCount={onlineUserIds.size || 1}
          isMicMuted={isMicMuted}
          isVideoOn={isVideoOn}
          isAudioConnected={isAudioConnected}
          mediaError={mediaError}
          autoplayBlocked={autoplayBlocked}
          elapsedSeconds={elapsedSeconds}
          soundEffectsEnabled={soundEffectsEnabled}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleSoundEffects={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
          onUnlockAudio={unlockAudio}
          onLeave={handleLeaveRoom}
        />
        <CourtroomPostTrialResults
          room={room}
          onReturnToLobby={() => router.push('/virtual-court/multiplayer')}
        />
      </div>
    )
  }

  // ── Active Courtroom Workspace ──
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col h-screen overflow-hidden">
      {/* 1. Authoritative Top Bar */}
      <CourtroomTopBar
        room={room}
        myParticipant={myParticipant}
        isJudge={isJudge}
        connected={connected}
        connectionState={connectionState}
        onlineCount={onlineUserIds.size || 1}
        isMicMuted={isMicMuted}
        isVideoOn={isVideoOn}
        isAudioConnected={isAudioConnected}
        mediaError={mediaError}
        autoplayBlocked={autoplayBlocked}
        elapsedSeconds={elapsedSeconds}
        soundEffectsEnabled={soundEffectsEnabled}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleSoundEffects={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
        onUnlockAudio={unlockAudio}
        onLeave={handleLeaveRoom}
        onEndSession={endSession}
      />

      {/* 2. Trial Stage Stepper */}
      <CourtroomStageProgress
        currentStageId={room.currentStageId}
        currentStageOrder={room.currentStageOrder}
        isJudge={isJudge}
        onAdvanceStage={advanceStage}
      />

      {/* 3. Main Split View: Left (Participants), Center (Arena/Evidence), Right (Chat/Log) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Toggle Button (Desktop) */}
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-4 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 items-center justify-center rounded-r-md border-y border-r border-slate-700 transition-all ${
            leftPanelOpen ? 'left-[288px]' : 'left-0'
          }`}
          title={leftPanelOpen ? 'Ishtirokchilar panelini yashirish' : 'Ishtirokchilar panelini ko‘rsatish'}
        >
          <span className="text-[10px] font-bold">{leftPanelOpen ? '◀' : '▶'}</span>
        </button>

        {/* Left Sidebar: Participants (Desktop) */}
        {leftPanelOpen && (
          <div className="hidden lg:flex transition-all">
            <CourtroomParticipantsSidebar
              room={room}
              myParticipant={myParticipant}
              onlineUserIds={onlineUserIds}
              speakingParticipants={speakingParticipants}
              isHost={isHost}
              isJudge={isJudge}
              onAssignRole={assignRole}
              onKick={kick}
            />
          </div>
        )}

        {/* Center Panel (Desktop and Mobile) */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden relative">
          {/* Sub-tab switcher for Arena vs Evidence */}
          <div className="hidden sm:flex items-center justify-between px-6 py-2 bg-slate-900/60 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCenterSubTab('arena')}
                className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                  centerSubTab === 'arena'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Sud Zali Arenasi
              </button>
              <button
                onClick={() => setCenterSubTab('evidence')}
                className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                  centerSubTab === 'evidence'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Dalillar ({room.evidence.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span>JPK & FPK Protsessual Simulyator</span>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="hidden sm:flex flex-1 overflow-hidden">
            {centerSubTab === 'arena' ? (
              <CourtroomCenterStage
                room={room}
                myParticipant={myParticipant}
                isHost={isHost}
                isJudge={isJudge}
                localStream={localStream}
                remoteStreams={remoteStreams}
                videoEnabledUserIds={videoEnabledUserIds}
                speakingParticipants={speakingParticipants}
                liveSubtitles={liveSubtitles}
                onStartTrial={startTrial}
                onRuleObjection={ruleOnObjection}
                onAdvanceStage={advanceStage}
                onGrantSpeaking={grantSpeaking}
              />
            ) : (
              <div className="flex-1 p-4 overflow-hidden">
                <CourtroomEvidencePanel
                  room={room}
                  myParticipant={myParticipant}
                  isJudge={isJudge}
                  onSubmitEvidence={submitEvidence}
                  onRuleEvidence={ruleOnEvidence}
                />
              </div>
            )}
          </div>

          {/* Mobile Tab Content */}
          <div className="flex sm:hidden flex-1 overflow-hidden">
            {activeMobileTab === 'stage' && (
              <CourtroomCenterStage
                room={room}
                myParticipant={myParticipant}
                isHost={isHost}
                isJudge={isJudge}
                localStream={localStream}
                remoteStreams={remoteStreams}
                videoEnabledUserIds={videoEnabledUserIds}
                speakingParticipants={speakingParticipants}
                liveSubtitles={liveSubtitles}
                onStartTrial={startTrial}
                onRuleObjection={ruleOnObjection}
                onAdvanceStage={advanceStage}
                onGrantSpeaking={grantSpeaking}
              />
            )}
            {activeMobileTab === 'evidence' && (
              <div className="flex-1 p-3 overflow-hidden">
                <CourtroomEvidencePanel
                  room={room}
                  myParticipant={myParticipant}
                  isJudge={isJudge}
                  onSubmitEvidence={submitEvidence}
                  onRuleEvidence={ruleOnEvidence}
                />
              </div>
            )}
            {activeMobileTab === 'participants' && (
              <CourtroomParticipantsSidebar
                room={room}
                myParticipant={myParticipant}
                onlineUserIds={onlineUserIds}
                speakingParticipants={speakingParticipants}
                isHost={isHost}
                isJudge={isJudge}
                onAssignRole={assignRole}
                onKick={kick}
              />
            )}
            {activeMobileTab === 'chat' && (
              <CourtroomChatSidebar
                room={room}
                myParticipant={myParticipant}
                isJudge={isJudge}
                onGrantSpeaking={grantSpeaking}
                onRequestSpeaking={requestSpeaking}
              />
            )}
          </div>

          {/* 4. Bottom Controls */}
          <CourtroomBottomControls
            room={room}
            myParticipant={myParticipant}
            isJudge={isJudge}
            canSpeak={canSpeak}
            isListeningSTT={isListeningSTT}
            liveTranscript={liveTranscript}
            onToggleSTT={toggleSTT}
            onSpeak={speak}
            onRaiseObjection={raiseObjection}
            onRequestSpeaking={requestSpeaking}
            onAdvanceStage={advanceStage}
            onOpenVerdictModal={() => setShowVerdictModal(true)}
          />
        </div>

        {/* Right Sidebar Toggle Button (Desktop) */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-4 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 items-center justify-center rounded-l-md border-y border-l border-slate-700 transition-all ${
            rightPanelOpen ? 'right-[320px]' : 'right-0'
          }`}
          title={rightPanelOpen ? 'Chat va ma’lumotlar panelini yashirish' : 'Chat va ma’lumotlar panelini ko‘rsatish'}
        >
          <span className="text-[10px] font-bold">{rightPanelOpen ? '▶' : '◀'}</span>
        </button>

        {/* Right Sidebar: Chat & Log (Desktop) */}
        {rightPanelOpen && (
          <div className="hidden lg:flex transition-all">
            <CourtroomChatSidebar
              room={room}
              myParticipant={myParticipant}
              isJudge={isJudge}
              onGrantSpeaking={grantSpeaking}
              onRequestSpeaking={requestSpeaking}
            />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden bg-zinc-900 border-t border-zinc-800 flex items-center justify-around p-2 text-[11px] font-bold z-30">
        <button
          onClick={() => setActiveMobileTab('stage')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            activeMobileTab === 'stage' ? 'text-blue-400' : 'text-zinc-500'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Sud zali</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('evidence')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            activeMobileTab === 'evidence' ? 'text-blue-400' : 'text-zinc-500'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Dalillar</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('participants')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            activeMobileTab === 'participants' ? 'text-blue-400' : 'text-zinc-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Ishtirokchilar</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('chat')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            activeMobileTab === 'chat' ? 'text-blue-400' : 'text-zinc-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat ({room.messages.length})</span>
        </button>
      </nav>

      {/* 5. Judge Verdict Modal */}
      <CourtroomVerdictModal
        room={room}
        isOpen={showVerdictModal}
        onClose={() => setShowVerdictModal(false)}
        onIssueVerdict={issueVerdict}
      />
    </div>
  )
}
