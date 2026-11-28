# P1.7 Legal Content Reliability Report

## 1. Citation Validation Coverage
- `validateCitations()` in `src/lib/legal-rag.ts` checks AI-generated article references against the 7,201-article local corpus (`src/data/full-legal-codes.json`) across:
  - `/api/ai/chat`
  - `/api/ai/irac-analyze` & `/api/ai/irac-evaluate`
  - `/api/decision-tree/analyze`
  - `/api/scenario-generator/generate`
  - `/api/ai/document-generate`
  - `src/lib/court/ai-engine.ts`
- Unsupported/fabricated citations are flagged via `appendCitationNote()` or `validation.notes` (**VERIFIED**).

## 2. Official Documents vs. Educational Samples
- Official court templates (`OFFICIAL_DOCUMENTS_REGISTRY`) are kept separate from AI-generated custom templates (`DocumentGenerator.tsx`).
- Custom generated `.docx` exports carry `isEducationalSample: true` (`O'QUV NAMUNASI`) and UI displays `O‘quv namunasi (Rasmiy blank emas)`.
- Virtual Court PDF minutes (`Sud_Bayonnomasi_*.pdf`) explicitly state `O'quv simulyatsiya bayonnomasi (haqiqiy sud hujjati emas)`.

## 3. Known Limitations
- `validateCitations()` verifies that `Code + Article Number` exists in the local corpus; it does **not** semantically verify whether an existing article is repealed/outdated or misapplied in context.
- External live `lex.uz` currency checks are not performed at runtime.
