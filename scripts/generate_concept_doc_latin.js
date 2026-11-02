const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Times New Roman',
          size: 21, // 10.5 pt
          color: '1A202C',
        },
        paragraph: {
          spacing: { line: 250, before: 50, after: 50 }, // Fits exactly 1 A4 page
        },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1000,
            right: 1000,
            bottom: 1000,
            left: 1000,
          },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 },
          children: [
            new TextRun({
              text: "LOYIHA KONSEPSIYASI VA MAQSADI (CONCEPT NOTE)",
              bold: true,
              size: 26, // 13pt
              color: '1A365D',
            }),
            new TextRun({
              text: "\n«JURISAI» (JURISTIV) — Yuridik ta'lim va amaliy ko'nikmalar AI-simulyatori",
              bold: true,
              size: 22, // 11pt
              color: '2B6CB0',
            }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Loyihaning bosh maqsadi va g'oyasi: ",
              bold: true,
              color: '1A365D',
            }),
            new TextRun({
              text: "O'zbekiston yuridik ta'lim tizimida nazariya bilan amaliyot o'rtasidagi uzilishni bartaraf etish. Yuridik fakultet talabalari va yosh mutaxassislarga qonunlarni quruq yodlashdan amaliy tahlil, sud muzokaralari va protsessual ko'nikmalarni shakllantirishga o'tish uchun sun'iy intellekt (Legal EdTech) asosidagi interaktiv o'quv-amaliyot trenajyorini taqdim etish.",
            }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Ta'lim tizimidagi qaysi muammolarni hal etadi? ",
              bold: true,
              color: '1A365D',
            }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 15, after: 15 },
          children: [
            new TextRun({ text: "Amaliyot va sud tajribasi yetishmasligi: ", bold: true }),
            new TextRun({ text: "Talabalar oliygohni bitirguncha real sud muhitida qatnasha olmaydi, sudya yoki qarshi taraf advokati bilan bahslashish tajribasiga ega bo'lmaydi." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 15, after: 15 },
          children: [
            new TextRun({ text: "Hujjat va tahlil ko'nikmasi zaifligi: ", bold: true }),
            new TextRun({ text: "Murakkab huquqiy muammolarni xalqaro IRAC metodi bo'yicha tahlil qilish va protsessual hujjatlarni (da'vo, shikoyat) to'g'ri shakllantirishda ko'plab xatoliklarga yo'l qo'yiladi." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 15, after: 30 },
          children: [
            new TextRun({ text: "Interaktiv ta'lim vositalari yo'qligi: ", bold: true }),
            new TextRun({ text: "Mavjud o'quv qo'llanmalari faqat ma'ruza va testlardan iborat bo'lib, talabaning mustaqil fikrlashi va dalil keltirish salohiyatini sinash imkonini bermaydi." }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Loyihaning asosiy o'quv-amaliy modullari: ",
              bold: true,
              color: '1A365D',
            }),
            new TextRun({
              text: "Platforma O'zbekiston Respublikasi qonunchiligi (4 000+ modda) va Groq AI (Llama 3.3 70B) modeli asosida ishlaydi:",
            }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 15, after: 15 },
          children: [
            new TextRun({ text: "Virtual Sud Simulyatori (Virtual Court): ", bold: true }),
            new TextRun({ text: "Talaba sudya, prokuror yoki advokat rolida qatnashadi. Sun'iy intellekt esa raqib taraf yoki sudya bo'lib, real vaqtda qarshi argumentlar keltiradi va foydalanuvchini baholaydi." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 15, after: 15 },
          children: [
            new TextRun({ text: "IRAC Keys Tahlilchisi (IRAC Analyzer): ", bold: true }),
            new TextRun({ text: "Har qanday hayotiy keysni xalqaro yuridik standart bo'yicha bosqichma-bosqich: Muammo (Issue) -> Norma (Rule) -> Qo'llash (Application) -> Xulosa (Conclusion) ko'rinishida tahlil qilishni o'rgatadi." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 15, after: 15 },
          children: [
            new TextRun({ text: "Zaifliklarni aniqlash vositasi (Weakness Detector): ", bold: true }),
            new TextRun({ text: "Foydalanuvchi keltirgan vajlar va dalillardagi mantiqiy xatolar hamda qonuniy kamchiliklarni sun'iy intellekt orqali aniqlab beradi." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 15, after: 15 },
          children: [
            new TextRun({ text: "Keyslar generatori (Scenario Generator): ", bold: true }),
            new TextRun({ text: "Turli murakkablik darajasidagi (fuqarolik, mehnat, jinoyat) interaktiv mashq keyslarini generatsiya qiladi." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 15, after: 30 },
          children: [
            new TextRun({ text: "Ta'limiy gamifikatsiya (XP, Level, Badges): ", bold: true }),
            new TextRun({ text: "Har bir yechilgan keys, muvaffaqiyatli sud jarayoni uchun talabaga tajriba ballari (XP), darajalar (Level) va yutuqlar berilib, o'quv jarayoni qiziqarli qilinadi." }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Maqsadli auditoriya: ",
              bold: true,
              color: '1A365D',
            }),
            new TextRun({
              text: "1) Yuridik OTMlar talabalari (TDYuU, JIDU, Huquqni muhofaza qilish akademiyasi va b.); 2) Yosh mutaxassislar, stajyorlar va yuristlar; 3) O'qituvchilar va kafedralar (amaliy seminar va darslar uchun).",
            }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "5. Kutilayotgan natija va samara: ",
              bold: true,
              color: '1A365D',
            }),
            new TextRun({
              text: "Talabalar va bitiruvchilarning real sud amaliyotiga tayyorlik darajasini 80% gacha oshirish, amaliy malaka oshirish xarajatlari va vaqtini tejash hamda O'zbekistonda yuridik kadrlar tayyorlash sifatini jahon standartlari darajasiga olib chiqish.",
            }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const desktopPath = path.join('C:', 'Users', 'ANUBIS PC', 'Desktop', 'JURISAI_Haqiqiy_Konsepsiyasi.docx');
  fs.writeFileSync(desktopPath, buffer);
  console.log('DOCX written to:', desktopPath);
}).catch(err => {
  console.error('Error creating docx:', err);
  process.exit(1);
});
