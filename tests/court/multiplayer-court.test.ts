import { describe, it, expect, beforeEach } from 'vitest'
import {
  createCourtRoom,
  getCourtRoom,
  listPublicCourtRooms,
  joinCourtRoom,
  assignParticipantRole,
  startTrial,
  advanceTrialStage,
  updateSpeakingQueue,
  grantSpeakingTurn,
  raiseObjection,
  ruleOnObjection,
  sendCourtMessage,
  submitEvidence,
  ruleOnEvidence,
  issueVerdict,
  leaveCourtRoom,
  kickParticipant,
  getUserCompletedTrials,
  getUserCompletedTrialDetail,
} from '@/lib/court/multiplayer-db'
import type { CreateRoomInput } from '@/lib/court/multiplayer-types'

describe('Multiplayer Virtual Court — Room Creation & Joining', () => {
  const hostUser = { id: '00000000-0000-0000-0000-000000000001', name: 'Sud Raisi Alisher' }

  it('Yangi sud zali yaratiladi va xona kodi generatsiya qilinadi', async () => {
    const input: CreateRoomInput = {
      title: 'Toshkent shahar sudi: O‘g‘rilik ishi',
      caseCategory: 'criminal',
      maxParticipants: 8,
      isPublic: true,
      voiceEnabled: true,
    }

    const room = await createCourtRoom(hostUser, input)

    expect(room).toBeDefined()
    expect(room.id).toBeTruthy()
    expect(room.code).toMatch(/^JUR-[A-Z0-9]{4}$/)
    expect(room.status).toBe('waiting')
    expect(room.hostId).toBe(hostUser.id)
    expect(room.participants.length).toBe(1)
    expect(room.participants[0].role).toBe('SUDYA')
    expect(room.evidence.length).toBeGreaterThan(0)
    expect(room.messages.length).toBe(1)
  })

  it('Ikkinchi foydalanuvchi sud zaliga qo‘shiladi va rol oladi', async () => {
    const room = await createCourtRoom(hostUser, {
      title: 'Fuqarolik ishi',
      caseCategory: 'civil',
    })

    const user2 = { id: '00000000-0000-0000-0000-000000000002', name: 'Advokat Karim' }
    const res = await joinCourtRoom(room.code, user2, 'ADVOKAT')

    expect(res.room.participants.length).toBe(2)
    expect(res.participant.userId).toBe(user2.id)
    expect(res.participant.role).toBe('ADVOKAT')

    // System announce message
    const lastMsg = res.room.messages[res.room.messages.length - 1]
    expect(lastMsg.content).toContain('Advokat Karim')
  })

  it('Bir xil hisob qayta qo‘shilganda dublikat yaratilmaydi (Idempotent join)', async () => {
    const room = await createCourtRoom(hostUser, {
      title: 'Mehnat nizosi',
      caseCategory: 'labor',
    })

    const user2 = { id: '00000000-0000-0000-0000-000000000002', name: 'Advokat Karim' }
    await joinCourtRoom(room.code, user2, 'ADVOKAT')
    const reJoin = await joinCourtRoom(room.code, user2, 'ADVOKAT')

    expect(reJoin.room.participants.length).toBe(2)
  })

  it('Noyob rol (SUDYA) boshqa foydalanuvchi tomonidan egallangan bo‘lsa, xatolik qaytariladi (band)', async () => {
    const room = await createCourtRoom(hostUser, {
      title: 'Jinoyat ishi',
      caseCategory: 'criminal',
    })

    const user3 = { id: '00000000-0000-0000-0000-000000000003', name: 'Husan Jo‘rayev' }
    // Host is already SUDYA
    await expect(joinCourtRoom(room.code, user3, 'SUDYA')).rejects.toThrow('band')
  })
})

describe('Multiplayer Virtual Court — Authorization & Permissions', () => {
  const hostJudge = { id: '00000000-0000-0000-0000-000000000001', name: 'Sudya Farhod' }
  const prosecutor = { id: '00000000-0000-0000-0000-000000000002', name: 'Prokuror Akbar' }
  const observer = { id: '00000000-0000-0000-0000-000000000003', name: 'Tinglovchi Said' }

  it('Faqat Sudya yoki Host majlisni boshlashi mumkin', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'Protsess boshlash testi',
      caseCategory: 'criminal',
    })
    await joinCourtRoom(room.code, prosecutor, 'PROKUROR')
    await joinCourtRoom(room.code, observer, 'KUZATUVCHI')

    // Observer cannot start trial
    await expect(startTrial(room.code, observer.id)).rejects.toThrow(
      'Faqat Sud Raisi majlisni boshlashi mumkin.'
    )

    // Judge starts trial
    const started = await startTrial(room.code, hostJudge.id)
    expect(started.status).toBe('in_progress')
    expect(started.currentStageId).toBe('open_hearing')
  })

  it('Faqat Sudya protsessual bosqichni o‘zgartirishi mumkin', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'Bosqich testi',
      caseCategory: 'criminal',
    })
    await startTrial(room.code, hostJudge.id)
    await joinCourtRoom(room.code, prosecutor, 'PROKUROR')

    // Prosecutor cannot advance stage
    await expect(advanceTrialStage(room.code, prosecutor.id)).rejects.toThrow(
      'Faqat Sudya protsessual bosqichni o‘zgartirish vakolatiga ega.'
    )

    // Judge advances stage
    const advanced = await advanceTrialStage(room.code, hostJudge.id)
    expect(advanced.currentStageId).toBe('rights_and_petitions')
    expect(advanced.currentStageOrder).toBe(2)
  })

  it('Kuzatuvchilar nutq so‘zlay olmaydi', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'Nutq ruxsati testi',
      caseCategory: 'criminal',
    })
    await startTrial(room.code, hostJudge.id)
    await joinCourtRoom(room.code, observer, 'KUZATUVCHI')

    await expect(sendCourtMessage(room.code, observer, 'Men ham gapirmoqchiman')).rejects.toThrow(
      'Kuzatuvchilar sud zali umumiy majlisida nutq so‘zlay olmaydi.'
    )
  })

  it('Sudya boshqa ishtirokchiga so‘z berishi va to‘xtatishi mumkin', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'So‘z navbati testi',
      caseCategory: 'criminal',
    })
    await startTrial(room.code, hostJudge.id)
    await joinCourtRoom(room.code, prosecutor, 'PROKUROR')

    // Grant speech to prosecutor
    const granted = await grantSpeakingTurn(room.code, hostJudge.id, prosecutor.id)
    expect(granted.currentSpeakerId).toBe(prosecutor.id)
    expect(granted.currentSpeakerRole).toBe('PROKUROR')

    // Prosecutor speaks
    const afterSpeech = await sendCourtMessage(room.code, prosecutor, 'Hurmatli sud, ayblov bayon etiladi.')
    const lastMsg = afterSpeech.messages[afterSpeech.messages.length - 1]
    expect(lastMsg.content).toBe('Hurmatli sud, ayblov bayon etiladi.')
    expect(lastMsg.role).toBe('PROKUROR')

    // Revoke speech
    const revoked = await grantSpeakingTurn(room.code, hostJudge.id, null)
    expect(revoked.currentSpeakerId).toBeNull()
  })
})

describe('Multiplayer Virtual Court — Objections & Evidence', () => {
  const hostJudge = { id: '00000000-0000-0000-0000-000000000001', name: 'Sudya Farhod' }
  const lawyer = { id: '00000000-0000-0000-0000-000000000004', name: 'Advokat Sardor' }

  it('Ishtirokchi e’tiroz bildiradi va Sudya ajrim chiqaradi', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'E’tiroz testi',
      caseCategory: 'criminal',
    })
    await startTrial(room.code, hostJudge.id)
    await joinCourtRoom(room.code, lawyer, 'ADVOKAT')

    // Raise objection
    const objRoom = await raiseObjection(
      room.code,
      { id: lawyer.id, name: lawyer.name, role: 'ADVOKAT' },
      'Asossiz vaj bildirilmoqda'
    )
    expect(objRoom.pendingObjection).toBeDefined()
    expect(objRoom.pendingObjection?.reason).toBe('Asossiz vaj bildirilmoqda')

    // Judge sustains objection
    const ruledRoom = await ruleOnObjection(
      room.code,
      hostJudge.id,
      'sustained',
      'Taraf o‘z so‘zini qonun doirasida davom ettirsin.'
    )
    expect(ruledRoom.pendingObjection).toBeNull()

    const rulingMsg = ruledRoom.messages[ruledRoom.messages.length - 1]
    expect(rulingMsg.messageType).toBe('ruling')
    expect(rulingMsg.content).toContain('E’tiroz QANOATLANTIRILDI')
  })

  it('Dalil taqdim etiladi va Sudya uni ish materiallariga qabul qiladi', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'Dalil testi',
      caseCategory: 'criminal',
    })
    await startTrial(room.code, hostJudge.id)
    await joinCourtRoom(room.code, lawyer, 'ADVOKAT')

    // Submit new evidence
    const submitted = await submitEvidence(room.code, lawyer, {
      title: 'Bank kvitansiyasi',
      type: 'receipt',
      description: 'Zarar qoplangani haqida to‘lov kvitansiyasi',
      content: '1 850 000 so‘m to‘liq to‘langan.',
      referenceNumber: 'DALIL-KV-01',
    })

    const newEvidence = submitted.evidence.find(e => e.referenceNumber === 'DALIL-KV-01')
    expect(newEvidence).toBeDefined()
    expect(newEvidence?.status).toBe('pending')

    // Judge admits evidence
    const admitted = await ruleOnEvidence(
      room.code,
      hostJudge.id,
      newEvidence!.id,
      'admitted',
      'JPK talablariga mos kelgani sababli ishga qo‘shildi'
    )

    const updatedEv = admitted.evidence.find(e => e.id === newEvidence!.id)
    expect(updatedEv?.status).toBe('admitted')
    expect(updatedEv?.judgeDecisionReason).toContain('JPK talablariga mos kelgani')
  })
})

describe('Multiplayer Virtual Court — Verdict & Completion', () => {
  const hostJudge = { id: '00000000-0000-0000-0000-000000000001', name: 'Sudya Farhod' }
  const lawyer = { id: '00000000-0000-0000-0000-000000000004', name: 'Advokat Sardor' }

  it('Sudya yakuniy hukm chiqaradi va ishtirokchilarga reyting hisoblanadi', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'Yakuniy Hukm Testi',
      caseCategory: 'criminal',
    })
    await startTrial(room.code, hostJudge.id)
    await joinCourtRoom(room.code, lawyer, 'ADVOKAT')

    // Lawyer speaks
    await grantSpeakingTurn(room.code, hostJudge.id, lawyer.id)
    await sendCourtMessage(room.code, lawyer, 'Hurmatli sud, yetkazilgan zarar to‘liq qoplangan.')

    // Issue verdict
    const verdictRoom = await issueVerdict(room.code, hostJudge.id, {
      verdictDecision: 'aybdor',
      title: 'O‘zbekiston Respublikasi Nomi Bilan Sud HUKMI',
      summary: 'Sudlanuvchi JK 169-moddasi bilan aybdor deb topilsin.',
      legalReasoning: 'JK 55 va 169-moddalari qo‘llanildi.',
      penaltyOrRemedy: 'BHMning 20 baravari miqdorida jarima tayinlansin.',
    })

    expect(verdictRoom.status).toBe('completed')
    expect(verdictRoom.verdictData).toBeDefined()
    expect(verdictRoom.verdictData?.verdictDecision).toBe('aybdor')

    // Participant score
    const lawyerScore = verdictRoom.verdictData?.scores[lawyer.id]
    expect(lawyerScore).toBeDefined()
    expect(lawyerScore?.totalScore).toBeGreaterThan(60)
    expect(lawyerScore?.xpEarned).toBeGreaterThan(100)
  })

  it('Xona boshqaruvchisi (Host) tark etganda boshqaruv xavfsiz o‘tadi', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'Host Transfer Testi',
      caseCategory: 'criminal',
    })
    await joinCourtRoom(room.code, lawyer, 'ADVOKAT')

    // Host leaves
    const leftRoom = await leaveCourtRoom(room.code, hostJudge.id)
    expect(leftRoom).toBeDefined()

    const newHost = leftRoom?.participants.find(p => p.isHost)
    expect(newHost?.userId).toBe(lawyer.id)
  })
})

describe('Multiplayer Virtual Court — Lifecycle Timestamps, Lobby Exclusion & History', () => {
  const hostJudge = { id: '00000000-0000-0000-0000-000000000001', name: 'Sud Raisi Anvar' }
  const prosecutor = { id: '00000000-0000-0000-0000-000000000002', name: 'Davlat Ayblovchisi' }
  const defense = { id: '00000000-0000-0000-0000-000000000003', name: 'Himoyachi Otabek' }
  const outsider = { id: '00000000-0000-0000-0000-000000000099', name: 'Begona Shaxs' }

  it('Sud majlisi boshlanganda startedAt o‘rnatiladi va qayta boshlash taqiqlanadi', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'Fuqarolik nizosi: Mulk huquqi',
      caseCategory: 'civil',
      isPublic: true,
    })

    expect(room.startedAt).toBeUndefined()
    expect(room.status).toBe('waiting')

    const started = await startTrial(room.code, hostJudge.id)
    expect(started.status).toBe('in_progress')
    expect(started.startedAt).toBeDefined()
    expect(new Date(started.startedAt!).getTime()).toBeGreaterThan(0)

    // Cannot start again
    await expect(startTrial(room.code, hostJudge.id)).rejects.toThrow('faqat kutilayotgan holatda')
  }, 15000)

  it('Hukm chiqarilganda completedAt va durationSeconds o‘rnatiladi, zal lobbydan chiqariladi', async () => {
    const room = await createCourtRoom(hostJudge, {
      title: 'Mehnat nizosi: Ishga tiklash',
      caseCategory: 'labor',
      isPublic: true,
    })
    await joinCourtRoom(room.code, defense, 'ADVOKAT')
    await startTrial(room.code, hostJudge.id)

    // Verify room is in public lobby while in_progress
    const lobbyBefore = await listPublicCourtRooms()
    const foundBefore = lobbyBefore.find(r => r.id === room.id)
    expect(foundBefore).toBeDefined()

    // Issue verdict
    const completed = await issueVerdict(room.code, hostJudge.id, {
      verdictDecision: 'qanoatlantirildi',
      title: 'Sud Hal Qiluv Qarori',
      summary: 'Da’vo to‘liq qanoatlantirilsin, ishga tiklansin.',
      legalReasoning: 'Mehnat kodeksining 161-moddasi talablari buzilgan.',
      penaltyOrRemedy: 'Majburiy progul uchun 12 000 000 so‘m kompensatsiya undirilsin.',
    })

    expect(completed.status).toBe('completed')
    expect(completed.completedAt).toBeDefined()
    expect(typeof completed.durationSeconds).toBe('number')

    // Verify room is EXCLUDED from public lobby
    const lobbyAfter = await listPublicCourtRooms()
    const foundAfter = lobbyAfter.find(r => r.id === room.id)
    expect(foundAfter).toBeUndefined()

    // Verify joining completed room is strictly REJECTED
    await expect(joinCourtRoom(room.code, outsider, 'KUZATUVCHI')).rejects.toThrow(
      'Ushbu sud majlisi yakunlangan'
    )
  }, 30000)

  it('Foydalanuvchining shaxsiy yakunlangan sud ishlari ro‘yxati (getUserCompletedTrials) to‘g‘ri filtrlanadi', async () => {
    const userHistory = await getUserCompletedTrials(defense.id)
    expect(userHistory).toBeDefined()
    expect(userHistory.trials.length).toBeGreaterThan(0)

    const trial = userHistory.trials[0]
    expect(trial.myRole).toBe('ADVOKAT')
    expect(trial.completedAt).toBeDefined()
    expect(trial.durationFormatted).toBeTruthy()
    expect(trial.verdictSummary).toContain('Da’vo to‘liq qanoatlantirilsin')

    // Begona shaxsda yakunlangan ishlar mavjud emas
    const outsiderHistory = await getUserCompletedTrials(outsider.id)
    expect(outsiderHistory.trials.length).toBe(0)
  }, 30000)

  it('Yakunlangan sud dosyesi (getUserCompletedTrialDetail) faqat ishtirokchiga ochiladi, begonaga rad etiladi', async () => {
    const userHistory = await getUserCompletedTrials(defense.id)
    const completedCode = userHistory.trials[0].code

    // Participant accesses detail
    const detail = await getUserCompletedTrialDetail(completedCode, defense.id)
    expect(detail).toBeDefined()
    expect(detail.room.code).toBe(completedCode)
    expect(detail.myParticipant.userId).toBe(defense.id)
    expect(detail.myScore).toBeDefined()
    expect(detail.durationFormatted).toBeTruthy()

    // Non-participant is forbidden (403 / error)
    await expect(getUserCompletedTrialDetail(completedCode, outsider.id)).rejects.toThrow(
      'vakolati yo‘q'
    )
  }, 15000)

  it('Mehnat va fuqarolik ishlari uchun taqrizda FPK va MK qonun moddalari aks etadi (jinoyat kodi emas)', async () => {
    const userHistory = await getUserCompletedTrials(defense.id)
    const completedCode = userHistory.trials[0].code
    const detail = await getUserCompletedTrialDetail(completedCode, defense.id)

    expect(detail.myScore).toBeDefined()
    // Should reference FPK or MK, not JPK/JK
    const articles = detail.myScore?.correctArticles || []
    const hasProceduralCivilCode = articles.some(a => a.includes('FPK') || a.includes('MK'))
    expect(hasProceduralCivilCode).toBe(true)
  }, 15000)
})
