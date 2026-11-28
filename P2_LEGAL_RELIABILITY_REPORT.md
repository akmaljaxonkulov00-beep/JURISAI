# P2 Legal Reliability Report

- **Citation Validation:** `validateCitations()` in `src/lib/legal-rag.ts` validates AI-generated article citations against the 7,201-article local corpus (`src/data/full-legal-codes.json`) across IRAC, Decision Tree, Scenario Generator, Document Generator, Chat, and Virtual Court, flagging unverified citations via `appendCitationNote()` / `validation.notes`.
- **Official Forms vs. Educational Samples:** `OFFICIAL_DOCUMENTS_REGISTRY` templates are cleanly separated from custom AI-generated samples (`isEducationalSample: true`).
- **Limitation:** Corpus validation verifies `Code + Article Number` existence, not repeal/amendment currency against live `lex.uz`.
