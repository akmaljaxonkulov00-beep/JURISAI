import {
  CourtStage,
  ProcedureType,
  CourtRole,
  UserActionPayload,
  EvidenceItem,
  SessionEvent,
} from './court-types'

// ═══════════════════════════════════════════════════════════════════════════
// 1) SUD JARAYONI (TRIAL) BOSQICHLARI (JPK & FPK asosida)
// ═══════════════════════════════════════════════════════════════════════════
export const TRIAL_STAGES: CourtStage[] = [
  {
    id: 'open_hearing',
    order: 1,
    title: 'Majlisning ochilishi',
    legalName: 'Sud majlisining ochilishi va taraflar shaxsini aniqlash (JPK 405-410)',
    description:
      'Sud raisi majlisni ochiq deb e’lon qiladi, kotib ishtirokchilar kelganligini bildiradi, taraflarning shaxsi va vakolatlari tekshiriladi.',
    allowedRoles: ['SUDYA', 'PROKUROR', 'ADVOKAT'],
    availableActions: [
      {
        id: 'announce_court_open',
        label: 'Majlisni ochish',
        actionType: 'ruling',
        description: 'Sud majlisini ochiq deb e’lon qilish va ish mohiyatini aytish',
      },
      {
        id: 'verify_presence',
        label: 'Kelganlarni tekshirish',
        actionType: 'speak',
        description: 'Kotibadan taraflar kelganligi to‘g‘risida ma’lumot so‘rash',
      },
      {
        id: 'confirm_attendance',
        label: 'Ishtirokni tasdiqlash',
        actionType: 'speak',
        description: 'Sudga o‘z shaxsi va vakolatini ma’lum qilish',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Taraflar tanishtirilib, sud majlisi qonuniy ochilgan bo‘lishi kerak.',
    nextStageId: 'rights_and_petitions',
  },
  {
    id: 'rights_and_petitions',
    order: 2,
    title: 'Huquqlar va Iltimosnomalar',
    legalName: 'Protsessual huquqlarni tushuntirish va iltimosnomalarni hal etish (JPK 411-417)',
    description:
      'Ishtirokchilarga huquq va majburiyatlari tushuntiriladi. Taraflar rad qilish (otvod) yoki yangi dalil/guvoh chaqirish bo‘yicha iltimosnoma kiritishi mumkin.',
    allowedRoles: ['SUDYA', 'PROKUROR', 'ADVOKAT'],
    availableActions: [
      {
        id: 'explain_rights',
        label: 'Huquqlarni tushuntirish',
        actionType: 'ruling',
        description:
          'Taraflarga Konstitutsiya va protsessual kodeks bo‘yicha huquqlarini bildirish',
      },
      {
        id: 'file_petition',
        label: 'Iltimosnoma kiritish',
        actionType: 'speak',
        description: 'Dalil qo‘shish yoki ekspertiza tayinlash haqida iltimosnoma berish',
      },
      {
        id: 'respond_to_petition',
        label: 'Iltimosnomaga munosabat',
        actionType: 'speak',
        description: 'Ikkinchi taraf iltimosnomasiga rozilik yoki e’tiroz bildirish',
      },
      {
        id: 'resolve_petition',
        label: 'Iltimosnomani hal qilish',
        actionType: 'ruling',
        description: 'Iltimosnomani qanoatlantirish yoki rad etish haqida ajrim chiqarish',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Barcha dastlabki iltimosnomalar ko‘rib chiqilgan bo‘lishi kerak.',
    nextStageId: 'judicial_investigation',
  },
  {
    id: 'judicial_investigation',
    order: 3,
    title: 'Sud tergovi / Ayblov bayoni',
    legalName: 'Sud tergovi boshlanishi va ayblov/da’voni e’lon qilish (JPK 438-442)',
    description:
      'Prokuror ayblov xulosasi xulosaviy qismini o‘qiydi (fuqarolikda da’vogar talabini bayon qiladi). Sudlanuvchidan o‘z aybiga iqrorligi so‘raladi. Himoyachi dastlabki pozitsiyasini aytadi.',
    allowedRoles: ['SUDYA', 'PROKUROR', 'ADVOKAT'],
    availableActions: [
      {
        id: 'read_indictment',
        label: 'Ayblov xulosasini o‘qish',
        actionType: 'speak',
        description: 'JK moddalari bo‘yicha qo‘yilgan ayblov mazmunini bayon etish',
      },
      {
        id: 'plead_position',
        label: 'Himoya pozitsiyasini bildirish',
        actionType: 'speak',
        description: 'Ayblovga nisbatan munosabat va himoya argumentlarini keltirish',
      },
      {
        id: 'ask_plea',
        label: 'Aybiga iqrorlikni so‘rash',
        actionType: 'question',
        description: 'Sudlanuvchidan o‘z aybiga iqror yoki yo‘qligini aniqlash',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition:
      'Ayblov mazmuni e’lon qilinib, himoya tarafi pozitsiyasi eshitilgan bo‘lishi lozim.',
    nextStageId: 'evidence_and_examination',
  },
  {
    id: 'evidence_and_examination',
    order: 4,
    title: 'Dalillarni tekshirish & So‘roq',
    legalName: 'Dalillarni bevosita tekshirish va ishtirokchilarni so‘roq qilish (JPK 443-448)',
    description:
      'Hujjatlar, ashyoviy dalillar ko‘zdan kechiriladi. Sudlanuvchi, guvohlar va ekspertlar so‘roq qilinadi. Dalillarning maqbulligi (dopustimost) tekshiriladi.',
    allowedRoles: ['SUDYA', 'PROKUROR', 'ADVOKAT'],
    availableActions: [
      {
        id: 'present_evidence',
        label: 'Dalil taqdim qilish',
        actionType: 'present_evidence',
        evidenceRequired: true,
        description: 'Ishga oid hujjat, fotosurat yoki ekspert xulosasini taqdim etish',
      },
      {
        id: 'examine_witness',
        label: 'Guvoh / Ekspertga savol',
        actionType: 'question',
        targetRequired: true,
        description: 'Guvoh, jabrlanuvchi yoki sudlanuvchiga aniqlashtiruvchi savol berish',
      },
      {
        id: 'object_evidence',
        label: 'Dalilga e’tiroz bildirish',
        actionType: 'object',
        description:
          'Noqonuniy olingan yoki ishga aloqasiz dalilga JPK 95-moddaga asosan e’tiroz kiritish',
      },
      {
        id: 'rule_on_evidence',
        label: 'Dalilni qabul qilish/rad etish',
        actionType: 'ruling',
        description: 'Sudya sifatida dalilning maqbulligi bo‘yicha ajrim chiqarish',
      },
    ],
    requiredActions: ['present_evidence', 'question', 'speak'],
    transitionCondition:
      'Kamida asosiy dalillar ko‘zdan kechirilib, so‘roq jarayoni o‘tkazilgan bo‘lishi kerak.',
    nextStageId: 'judicial_pleadings',
  },
  {
    id: 'judicial_pleadings',
    order: 5,
    title: 'Sud muzokaralari (Pleadings)',
    legalName: 'Sud muzokaralari va taraflar nutqlari (JPK 449-453)',
    description:
      'Prokuror ayblov nutqi bilan chiqadi, jazo turini va muddatini asoslaydi. Advokat himoya nutqini so‘zlaydi, oqlovchi yoki yengillashtiruvchi holatlarni ilgari suradi.',
    allowedRoles: ['PROKUROR', 'ADVOKAT', 'SUDYA'],
    availableActions: [
      {
        id: 'prosecution_speech',
        label: 'Ayblov nutqi',
        actionType: 'speak',
        description: 'Dalillar tahlili asosida jazo chorasini talab qilish',
      },
      {
        id: 'defense_speech',
        label: 'Himoya nutqi',
        actionType: 'speak',
        description: 'Mijoz manfaatida oqlov yoki yengil jazo tayinlashni asoslash',
      },
      {
        id: 'rejoinder',
        label: 'Replika (Qisqa e’tiroz)',
        actionType: 'speak',
        description: 'Qarshi tarafning nutqidagi faktik xatolarga qisqa ruxsatli javob',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Har ikki taraf o‘z muzokara nutqini to‘liq taqdim etgan bo‘lishi kerak.',
    nextStageId: 'final_word',
  },
  {
    id: 'final_word',
    order: 6,
    title: 'Sudlanuvchining oxirgi so‘zi',
    legalName: 'Sudlanuvchining oxirgi so‘zi (JPK 454-455)',
    description:
      'Sudlanuvchiga hech qanday vaqt cheklovisiz oxirgi so‘z beriladi. Unga bu vaqtda savollar berish qat’iyan man etiladi.',
    allowedRoles: ['SUDLANUVCHI', 'SUDYA', 'ADVOKAT'],
    availableActions: [
      {
        id: 'grant_final_word',
        label: 'Oxirgi so‘z berish',
        actionType: 'ruling',
        description: 'Sudlanuvchiga oxirgi so‘z huquqini taqdim etish',
      },
      {
        id: 'deliver_final_word',
        label: 'Oxirgi so‘zni aytish',
        actionType: 'speak',
        description: 'Sud hay’atiga tavba, tushuntirish yoki adolatli qaror so‘rab murojaat',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Sudlanuvchi oxirgi so‘zini aytganidan keyin sud maslahatxonaga kiradi.',
    nextStageId: 'deliberation_and_verdict',
  },
  {
    id: 'deliberation_and_verdict',
    order: 7,
    title: 'Alohida xona & Hukm',
    legalName: 'Sud maslahatxonasi va Hukmni e’lon qilish (JPK 456-470)',
    description:
      'Sud maslahatxonaga kiradi. Ayblov yoki oqlov hukmi shakllantiriladi va sud zalida barcha hozir bo‘lganlar tik turgan holda e’lon qilinadi.',
    allowedRoles: ['SUDYA'],
    availableActions: [
      {
        id: 'deliberate_case',
        label: 'Hukmni shakllantirish',
        actionType: 'ruling',
        description: 'Dalillar majmui asosida ayb yoki oqlov xulosasini tayyorlash',
      },
      {
        id: 'pronounce_verdict',
        label: 'Hukmni e’lon qilish',
        actionType: 'conclude',
        description: 'O‘zbekiston Respublikasi nomidan sud hukmini to‘liq o‘qib eshittirish',
      },
    ],
    requiredActions: ['ruling', 'conclude'],
    transitionCondition: 'Hukm chiqarilib, e’lon qilingandan so‘ng simulyatsiya yakunlanadi.',
    nextStageId: 'verdict_review',
  },
  {
    id: 'verdict_review',
    order: 8,
    title: 'Natija va Baholash',
    legalName: 'Protsessual xatolar tahlili va mahorat bahosi',
    description:
      'Simulyatsiya yakunlandi. Foydalanuvchining protsessual harakatlari, huquqiy asoslari, etika va dalillar bilan ishlashi tahlil qilinadi.',
    allowedRoles: ['SUDYA', 'PROKUROR', 'ADVOKAT'],
    availableActions: [
      {
        id: 'complete_simulation',
        label: 'Tahlilni ko‘rish',
        actionType: 'conclude',
        description: 'Batafsil tahliliy hisobot va ballar bilan tanishish',
      },
    ],
    requiredActions: [],
    transitionCondition: 'Yakunlangan',
    nextStageId: null,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 2) MUZOKARA (NEGOTIATION) BOSQICHLARI
// ═══════════════════════════════════════════════════════════════════════════
export const NEGOTIATION_STAGES: CourtStage[] = [
  {
    id: 'opening_stances',
    order: 1,
    title: 'Pozitsiyalarni bayon etish',
    legalName: 'Muzokaralarni ochish va dastlabki huquqiy talablar',
    description:
      'Tomonlar nizoli shartnoma yoki zarar bo‘yicha dastlabki da’vo va e’tirozlarini o‘rtaga tashlaydi.',
    allowedRoles: ['ADVOKAT', 'SUDYA', 'PROKUROR'],
    availableActions: [
      {
        id: 'present_claim',
        label: 'Talabni bayon qilish',
        actionType: 'speak',
        description: 'FK va shartnoma shartlariga asoslangan talabni aytish',
      },
      {
        id: 'listen_counterpart',
        label: 'Qarshi tarafni tinglash',
        actionType: 'speak',
        description: 'Ikkinchi tarafning tushuntirishlarini qayd etish',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Tomonlar o‘z dastlabki pozitsiyalarini tushuntirgan bo‘lishi lozim.',
    nextStageId: 'dispute_analysis',
  },
  {
    id: 'dispute_analysis',
    order: 2,
    title: 'Nizo va Xatarlar Tahlili',
    legalName: 'Sud xarajatlari, foizlar va huquqiy xatarlarni baholash',
    description:
      'Agar ish sudga borsa nima bo‘lishi, davlat boji, penya va obro‘ xatarlari tahlil qilinadi.',
    allowedRoles: ['ADVOKAT', 'SUDYA', 'PROKUROR'],
    availableActions: [
      {
        id: 'show_legal_risks',
        label: 'Huquqiy xatarlarni ko‘rsatish',
        actionType: 'speak',
        description: 'Sud amaliyoti va qonuniy oqibatlarni tushuntirish',
      },
      {
        id: 'examine_documents',
        label: 'Moliyaviy hujjatlarni ko‘rsatish',
        actionType: 'present_evidence',
        evidenceRequired: true,
        description: 'To‘lov topshiriqnomalari, solishtirma dalolatnomalarini taqdim etish',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Nizoning moddiy va huquqiy asosi ko‘rib chiqilgan bo‘lishi kerak.',
    nextStageId: 'compromise_bargaining',
  },
  {
    id: 'compromise_bargaining',
    order: 3,
    title: 'Kompromiss Takliflari',
    legalName: 'Qarzni to‘lash grafigi, diskont yoki shartlarni yumshatish',
    description:
      'Tomonlar o‘zaro maqbul kelishuv variantlarini (masalan, asosiy qarzni bo‘lib to‘lash, jarimadan voz kechish) muhokama qiladi.',
    allowedRoles: ['ADVOKAT', 'SUDYA', 'PROKUROR'],
    availableActions: [
      {
        id: 'propose_settlement',
        label: 'Kelishuv taklif qilish',
        actionType: 'speak',
        description: 'Aniq muddat va summa ko‘rsatilgan to‘lov shartini taklif etish',
      },
      {
        id: 'negotiate_terms',
        label: 'Shartlarni qayta ko‘rish',
        actionType: 'speak',
        description: 'Qarshi taraf taklifiga tuzatish kiritish',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Kamida bitta aniq kompromiss yechim ustida to‘xtalgan bo‘lishi lozim.',
    nextStageId: 'drafting_agreement',
  },
  {
    id: 'drafting_agreement',
    order: 4,
    title: 'Kelishuv Matnini Shakllantirish',
    legalName: 'Kelishuv bitimi (Mediativ kelishuv) loyihasini tayyorlash',
    description: 'Qonun talablariga mos yozma kelishuv bandlari ishlab chiqiladi.',
    allowedRoles: ['ADVOKAT', 'SUDYA', 'PROKUROR'],
    availableActions: [
      {
        id: 'formulate_clauses',
        label: 'Bandlarni tasdiqlash',
        actionType: 'speak',
        description: 'Majburiyatlar, muddatlar va javobgarlik shartlarini yozish',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Bitim bandlari kelishilgan bo‘lishi lozim.',
    nextStageId: 'closing_settlement',
  },
  {
    id: 'closing_settlement',
    order: 5,
    title: 'Kelishuvni Tasdiqlash & Yakun',
    legalName: 'Kelishuv bitimini imzolash va yakuniy natija',
    description: 'Kelishuv bitimi imzolandi va nizoga tinch yo‘l bilan chek qo‘yildi.',
    allowedRoles: ['ADVOKAT', 'SUDYA', 'PROKUROR'],
    availableActions: [
      {
        id: 'sign_agreement',
        label: 'Bitimni imzolash',
        actionType: 'settle',
        description: 'Muzokarani muvaffaqiyatli kelishuv bilan yakunlash',
      },
    ],
    requiredActions: ['settle'],
    transitionCondition: 'Yakunlangan',
    nextStageId: null,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// 3) TERGOV (INVESTIGATION) BOSQICHLARI
// ═══════════════════════════════════════════════════════════════════════════
export const INVESTIGATION_STAGES: CourtStage[] = [
  {
    id: 'incident_briefing',
    order: 1,
    title: 'Hodisa Tavsifi & Dastlabki Holat',
    legalName: 'Jinoyat ishi qo‘zg‘atish va dastlabki tekshiruv (JPK 322-328)',
    description:
      'Hodisa joyini ko‘zdan kechirish bayonnomasi, jabrlanuvchi arizasi va voqea xronologiyasi tahlil qilinadi.',
    allowedRoles: ['PROKUROR', 'SUDYA', 'ADVOKAT'],
    availableActions: [
      {
        id: 'inspect_scene_report',
        label: 'Hodisa bayonnomasini tekshirish',
        actionType: 'speak',
        description: 'Dastlabki ashyoviy dalillar va fotosuratlarni ko‘rib chiqish',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Dastlabki hodisa ma’lumotlari o‘rganilgan bo‘lishi lozim.',
    nextStageId: 'witness_interrogation',
  },
  {
    id: 'witness_interrogation',
    order: 2,
    title: 'So‘roq Qilish & Ziddiyatlarni Aniqlash',
    legalName: 'Guvoh, jabrlanuvchi va gumonlanuvchini so‘roq qilish (JPK 96-124)',
    description:
      'Guvohlar va gumonlanuvchining ko‘rsatmalari olinadi. Ko‘rsatmalardagi qarama-qarshiliklar yuzlashtirish orqali fosh etiladi.',
    allowedRoles: ['PROKUROR', 'SUDYA', 'ADVOKAT'],
    availableActions: [
      {
        id: 'interrogate_person',
        label: 'Savol berish / So‘roq',
        actionType: 'question',
        targetRequired: true,
        description: 'Aniq vaqt, joy va shaxslar bo‘yicha savollar berish',
      },
      {
        id: 'confront_contradiction',
        label: 'Ziddiyatni ko‘rsatish',
        actionType: 'speak',
        description: 'Oldingi ko‘rsatma va yangi faktlar o‘rtasidagi farqni so‘rash',
      },
    ],
    requiredActions: ['question', 'speak'],
    transitionCondition: 'Asosiy shaxslar so‘roq qilingan bo‘lishi kerak.',
    nextStageId: 'evidence_forensics',
  },
  {
    id: 'evidence_forensics',
    order: 3,
    title: 'Ekspertiza & Ashyoviy Dalillar',
    legalName: 'Sud ekspertizasi xulosalari va dalillar tahlili (JPK 173-187)',
    description:
      'Barmoq izlari, ballistika, buxgalteriya auditi yoki sud-tibbiy ekspertiza xulosalari ko‘rib chiqiladi.',
    allowedRoles: ['PROKUROR', 'SUDYA', 'ADVOKAT'],
    availableActions: [
      {
        id: 'analyze_forensic_report',
        label: 'Ekspert xulosasini tahlil qilish',
        actionType: 'present_evidence',
        evidenceRequired: true,
        description: 'Ekspert xulosasini ish materiallariga kiritish va baholash',
      },
    ],
    requiredActions: ['speak'],
    transitionCondition: 'Ekspert xulosalari baholangan bo‘lishi kerak.',
    nextStageId: 'investigative_conclusion',
  },
  {
    id: 'investigative_conclusion',
    order: 4,
    title: 'Tergov Yakuni / Ayblov Xulosasi',
    legalName: 'Ayblov xulosasini tuzish yoki ishni tugatish (JPK 379-388)',
    description:
      'Yetarli dalillar to‘plangan taqdirda ayblov xulosasi tuzilib, sudga yuborish uchun prokurorga taqdim etiladi.',
    allowedRoles: ['PROKUROR', 'SUDYA', 'ADVOKAT'],
    availableActions: [
      {
        id: 'issue_indictment',
        label: 'Ayblov xulosasini tasdiqlash',
        actionType: 'conclude',
        description: 'Jinoyat ishi bo‘yicha tergov harakatlarini yakunlash',
      },
    ],
    requiredActions: ['conclude'],
    transitionCondition: 'Yakunlangan',
    nextStageId: null,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNKTSIYALARI
// ═══════════════════════════════════════════════════════════════════════════

export function getStagesForProcedure(procedureType: ProcedureType): CourtStage[] {
  switch (procedureType) {
    case 'negotiation':
      return NEGOTIATION_STAGES
    case 'investigation':
      return INVESTIGATION_STAGES
    case 'trial':
    default:
      return TRIAL_STAGES
  }
}

export function getStageById(
  procedureType: ProcedureType,
  stageId: string
): CourtStage | undefined {
  const stages = getStagesForProcedure(procedureType)
  return stages.find(s => s.id === stageId)
}

export function getNextStage(
  procedureType: ProcedureType,
  currentStageId: string
): CourtStage | null {
  const stages = getStagesForProcedure(procedureType)
  const current = stages.find(s => s.id === currentStageId)
  if (!current || !current.nextStageId) return null
  return stages.find(s => s.id === current.nextStageId) || null
}

/**
 * Foydalanuvchi amalga oshirmoqchi bo‘lgan harakatning protsessual qonuniyligini tekshiradi.
 */
export function validateProceduralAction(
  stage: CourtStage,
  role: CourtRole,
  action: UserActionPayload,
  availableEvidence: EvidenceItem[]
): { valid: boolean; penalty: number; reason?: string; hint?: string } {
  // 1. Rolga ruxsat bormi?
  if (!stage.allowedRoles.includes(role)) {
    return {
      valid: false,
      penalty: 15,
      reason: `"${stage.title}" bosqichida ${role} rolida to‘g‘ridan-to‘g‘ri bu harakatni qilish vakolati cheklangan.`,
      hint: `Ushbu bosqichda asosan quyidagi tomonlar faoliyat olib boradi: ${stage.allowedRoles.join(', ')}`,
    }
  }

  // 2. Dalil taqdim etilayotgan bo'lsa, u mavjudmi va ruxsat berilganmi?
  if (action.type === 'present_evidence') {
    if (!action.evidenceId) {
      return {
        valid: false,
        penalty: 10,
        reason: 'Taqdim etish uchun dalil tanlanmadi.',
        hint: "O‘ng tomondagi 'Dalillar' ro‘yxatidan aniq hujjat yoki ashyoni tanlang.",
      }
    }
    const item = availableEvidence.find(e => e.id === action.evidenceId)
    if (!item) {
      return {
        valid: false,
        penalty: 10,
        reason: 'Ko‘rsatilgan dalil topilmadi yoki bu bosqichda foydalanishga ruxsat berilmagan.',
      }
    }
    if (item.status === 'admitted') {
      return {
        valid: true,
        penalty: 0,
        hint: 'Ushbu dalil allaqachon sud tomonidan ish materiallariga qo‘shilgan.',
      }
    }
  }

  // 3. E'tiroz noto'g'ri bosqichda berilsa
  if (action.type === 'object') {
    if (stage.id === 'open_hearing' || stage.id === 'deliberation_and_verdict') {
      return {
        valid: false,
        penalty: 8,
        reason: `Ushbu bosqichda (${stage.title}) e'tiroz bildirish protsessual qoidalarga to‘g‘ri kelmaydi.`,
        hint: "E'tirozlar odatda dalillar tekshiruvi yoki tomonlar nutqi jarayonida bildiriladi.",
      }
    }
  }

  // 4. Sudya hukm chiqarish bosqichida bo'lmasa-yu, yakuniy ruling qilsa
  if (action.type === 'ruling' && role === 'SUDYA') {
    if (
      stage.id !== 'open_hearing' &&
      stage.id !== 'rights_and_petitions' &&
      stage.id !== 'evidence_and_examination' &&
      stage.id !== 'deliberation_and_verdict'
    ) {
      return {
        valid: true,
        penalty: 0,
        hint: 'Sudya sifatida tartibni saqlash bo‘yicha ogohlantirish berishingiz mumkin.',
      }
    }
  }

  return { valid: true, penalty: 0 }
}

/**
 * Keyingi bosqichga o'tish shartlari bajarilganligini tekshiradi.
 */
export function canTransitionToNextStage(
  stage: CourtStage,
  stageEvents: SessionEvent[],
  userRole: CourtRole
): { canTransition: boolean; missingRequirement?: string } {
  if (stageEvents.length === 0) {
    return {
      canTransition: false,
      missingRequirement: `"${stage.title}" bosqichida kamida 1 marta protsessual harakat yoki nutq amalga oshirilishi shart.`,
    }
  }

  // Masalan: Sud tergovi bosqichida dalillar ko'rib chiqilganmi yoki savol berilganmi
  if (stage.id === 'evidence_and_examination') {
    const hasEvidenceOrQuestion = stageEvents.some(
      e =>
        e.eventType === 'evidence_presented' ||
        e.eventType === 'user_action' ||
        e.eventType === 'participant_spoke'
    )
    if (!hasEvidenceOrQuestion) {
      return {
        canTransition: false,
        missingRequirement:
          'Dalillar tekshiruvi bosqichida kamida biror dalil o‘rganilishi yoki savol berilishi zarur.',
      }
    }
  }

  // Alohida xonaga faqat Sudya o'ta oladi yoki barcha nutqlar tugagach
  if (stage.id === 'final_word' && userRole !== 'SUDYA') {
    const userSpoke = stageEvents.some(e => e.eventType === 'user_action')
    if (!userSpoke) {
      return {
        canTransition: false,
        missingRequirement: 'Oxirgi so‘z tinglanmasdan sud maslahatxonaga o‘ta olmaydi.',
      }
    }
  }

  return { canTransition: true }
}
