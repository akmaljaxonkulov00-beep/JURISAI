const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } = require('docx');

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Times New Roman',
          size: 22, // 11pt
          color: '2D3748',
        },
        paragraph: {
          spacing: { line: 260, before: 60, after: 60 }, // Compact line spacing to fit exactly 1 page
        },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1100, // ~2cm
            right: 1100,
            bottom: 1100,
            left: 1100,
          },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 140 },
          children: [
            new TextRun({
              text: "ЛОЙИҲА КОНЦЕПЦИЯСИ ВА ТАВСИФИ",
              bold: true,
              size: 28, // 14pt
              color: '1A365D',
            }),
            new TextRun({
              text: "\n«JURISAI» (JURISTIV) — Ўзбекистон миллий юридик сунъий интеллект платформаси",
              bold: true,
              size: 24, // 12pt
              color: '2B6CB0',
            }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "1. Лойиҳанинг бош мақсади: ",
              bold: true,
              color: '1A202C',
            }),
            new TextRun({
              text: "Аҳоли ва тадбиркорларнинг ҳуқуқий саводхонлигини ошириш, сифатли ва малакали юридик ёрдамни барча учун тенг, арзон ва тезкор (24/7) қилиш ҳамда сунъий интеллект (AI/LegalTech) воситасида юристлар, адвокатлар ва ҳуқуқшунослик талабаларининг иш самарадорлигини кескин ошириш.",
            }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "2. Ечилаётган муаммолар: ",
              bold: true,
              color: '1A202C',
            }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: "Фуқаролар ва бизнес учун: ", bold: true }),
            new TextRun({ text: "Адвокат хизмати нархининг юқорилиги, оддий ҳуқуқий саволларга тез жавоб топиш қийинлиги ва ҳужжатларни (ариза, шартнома, даъво) хатосиз расмийлаштириш муаммоси." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: "Амалиётчи юрист ва адвокатлар учун: ", bold: true }),
            new TextRun({ text: "Бир хил турдаги қоғозбозлик ва ҳужжат ёзишга кетган ортиқча вақт, қонун ҳужжатлари базасида керакли нормаларни қўлда излаш мураккаблиги." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 20, after: 40 },
          children: [
            new TextRun({ text: "Талабалар учун: ", bold: true }),
            new TextRun({ text: "Назарий билимларни суд амалиёти билан боғлаш ва реал ҳуқуқий кейсларни таҳлил қилиш учун симуляция воситаларининг етишмаслиги." }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "3. Лойиҳанинг асосий имкониятлари ва мазмуни: ",
              bold: true,
              color: '1A202C',
            }),
            new TextRun({
              text: "Платформа Ўзбекистон қонунчилиги (4 000+ дан ортиқ қонун ва кодекслар) асосида қурилган ягона рақамли экотизим бўлиб, қуйидаги модулларни ўз ичига олади:",
            }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: "AI Юридик Маслаҳатчи (Chat Agent): ", bold: true }),
            new TextRun({ text: "Миллий қонунчиликка таянган ҳолда фуқароларнинг саволларига содда ва аниқ тушунтириш беради." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: "Ақлли ҳужжатлар генератори: ", bold: true }),
            new TextRun({ text: "Даъво аризалари, шикоятлар ва шартномаларни фойдаланувчи маълумотлари асосида бир неча дақиқада автоматик тайёрлайди." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: "Семантик қонунлар базаси (Smart Search): ", bold: true }),
            new TextRun({ text: "Ҳуқуқий сўровларни мазмун-моҳиятига қараб тушуниб, тегишли модда ва прецедентларни топиб беради." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: "Виртуал суд ва IRAC таҳлил тизими: ", bold: true }),
            new TextRun({ text: "Суд жараёнлари симуляцияси (судья, адвокат, прокурор) ҳамда халқаро IRAC услубида ишларни таҳлил қилиш." }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 20, after: 40 },
          children: [
            new TextRun({ text: "Адвокатлар маркетплейси (Advocate Ecosystem): ", bold: true }),
            new TextRun({ text: "Фуқароларни ихтисослашган адвокатлар билан боғлаш, онлайн навбат ва маслаҳат олиш тизими." }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "4. Мақсадли гуруҳлар: ",
              bold: true,
              color: '1A202C',
            }),
            new TextRun({
              text: "1) Аҳоли ва кичик бизнес субъектлари; 2) Олийгоҳларнинг юриспруденция талабалари; 3) Амалиётчи адвокатлар ва юридик фирмалар.",
            }),
          ],
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "5. Кутилаётган ижтимоий-иқтисодий самара: ",
              bold: true,
              color: '1A202C',
            }),
            new TextRun({
              text: "Юридик масалаларни ҳал этиш вақтини 70% гача тежаш, аҳолининг ҳуқуқий ҳимояга эришишини енгиллаштириш, судгача низоларни тинч йўл билан ҳал этиш кўрсаткичини ошириш ҳамда Ўзбекистонда замонавий миллий LegalTech саноати пойдеворини яратиш.",
            }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outputPath = path.join(__dirname, '..', 'JURISAI_Loyihasi_Kontseptsiyasi.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('DOCX successfully created at:', outputPath);
}).catch(err => {
  console.error('Error creating docx:', err);
  process.exit(1);
});
