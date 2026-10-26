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

  it('Noyob rol (SUDYA) boshqa foydalanuvchi tomonidan egallangan bo‘lsa, boshqa rol beriladi', async () => {
    const room = await createCourtRoom(hostUser, {
      title: 'Jinoyat ishi',
      caseCategory: 'criminal',
    })

    const user3 = { id: '00000000-0000-0000-0000-000000000003', name: 'Husan Jo‘rayev' }
    // Host is already SUDYA
    const res = await joinCourtRoom(room.code, user3, 'SUDYA')

    expect(res.participant.role).not.toBe('SUDYA')
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
