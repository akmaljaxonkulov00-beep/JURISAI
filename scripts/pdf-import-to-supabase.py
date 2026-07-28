#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF to Supabase import script for Uzbekistan legal codes.

Requirements:
    pip install PyPDF2 pdfminer.six requests python-dotenv

Usage:
    python scripts/pdf-import-to-supabase.py "C:/Users/ANUBIS PC/Desktop/35 TA QONUNCHILIK"

This script:
    1. Reads PDF files using pdfminer.six (fallback: PyPDF2)
    2. Identifies the legal code by filename + content analysis
    3. Parses articles (article_number, title, content, chapter)
    4. Imports to Supabase via REST API (categories + articles tables)
    5. Uses ON CONFLICT DO UPDATE for idempotent imports
"""

import os
import sys
import re
import argparse
from pathlib import Path


# ============================================================================
# PDF TEXT EXTRACTION
# ============================================================================

def extract_text_with_pdfminer(filepath):
    """Extract text from PDF using pdfminer.six (primary parser)."""
    from pdfminer.high_level import extract_text
    text = extract_text(filepath)
    # Normalize Unicode apostrophes
    text = text.replace('\u2018', "'").replace('\u2019', "'").replace('\u02bb', "'")
    return text


def extract_text_with_pypdf2(filepath):
    """Extract text from PDF using PyPDF2 (fallback parser)."""
    import PyPDF2
    parts = []
    with open(filepath, 'rb') as fh:
        reader = PyPDF2.PdfReader(fh)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                parts.append(t)
    return '\n'.join(parts)


def extract_text(filepath):
    """Extract text from PDF. Uses pdfminer.six first, falls back to PyPDF2."""
    try:
        return extract_text_with_pdfminer(filepath)
    except Exception as e:
        print(f"  [WARN] pdfminer.six failed: {e}, trying PyPDF2...", file=sys.stderr)
        try:
            return extract_text_with_pypdf2(filepath)
        except Exception as e2:
            raise RuntimeError(f"PDF parsing failed: {e2}") from e2


# ============================================================================
# REGEX PATTERNS (matching the JS parser in scripts/import-legal-to-supabase.js)
# ============================================================================

# Matches "1-modda", "1- modda", "97-modda" etc.
ARTICLE_RE = re.compile(
    r'^(\d+)\s*[-\u2013]\s*modda\b\s*\.?\s*(.*)',
    re.IGNORECASE | re.DOTALL
)

# Matches "1-BOB", "1-bob.", "2-BOB" etc.
CHAPTER_RE = re.compile(r'^(\d+)\s*[-\u2013]?\s*bob', re.IGNORECASE)

# Metadata lines to skip
SKIP_RE = re.compile(
    r'^(Oldingi tahrirga qarang|Eski tahrir|\([^)]*modda)',
    re.IGNORECASE
)
FOOTNOTE_RE = re.compile(r'^\([^)]*\)\s*$')


# ============================================================================
# CODE IDENTIFICATION
# ============================================================================

# ── SIGNATURE DATABASE ────────────────────────────────────────────────────
# Each code has:
#   - CODE_KEYWORDS: (keyword, code_id, display_name)
#   - key_articles: {article_number: description} — known landmark articles
#   - article_range_expected: (min_articles, max_articles) — typical article count
#   - chapters_expected: typical chapter count
#   - unique_terms: terms strongly associated with this code
#   - chapter_name_hints: chapter name patterns unique to this code

CODE_SIGNATURES = [
    {
        "keyword": "Jinoyat kodeksi", "id": "criminal_code",
        "name": "O'zbekiston Respublikasi Jinoyat kodeksi",
        "key_articles": {"97": "Qasddan odam o'ldirish", "98": "Jahl ustida odam o'ldirish",
                         "104": "Tan jarohati yetkazish", "169": "O'g'irlik",
                         "243": "Giyohvandlik", "276": "Firibgarlik"},
        "article_range": (300, 500),
        "chapters": (12, 20),
        "unique_terms": ["jinoyat", "jazo", "ozodlikdan mahrum qilish",
                         "ayblanuvchi", "jinoiy javobgarlik", "jinoyat turlari",
                          "hukm", "jazoni yengillashtirish", "sudlanganlik"],
        "chapter_hints": ["Jinoyat", "jazo tayinlash", "javobgarlik"]
    },
    {
        "keyword": "Fuqarolik kodeksi", "id": "civil_code",
        "name": "O'zbekiston Respublikasi Fuqarolik kodeksi",
        "key_articles": {"1": "Fuqarolik qonunchiligining vazifalari",
                         "342": "Shartnoma tushunchasi",
                         "367": "Shartnoma shakliy talablari"},
        "article_range": (1000, 1300),
        "chapters": (25, 40),
        "unique_terms": ["fuqarolik", "shartnoma", "majburiyatlar", "mulk",
                         "da'vo muddati", "bitim", "tashkilot", "yuridik shaxs",
                          "meros", "garov", "qarz"],
        "chapter_hints": ["Fuqarolik", "majburiyat", "mulk huquqi", "shartnoma"]
    },
    {
        "keyword": "Mehnat kodeksi", "id": "labor_code",
        "name": "O'zbekiston Respublikasi Mehnat kodeksi",
        "key_articles": {"1": "Mehnat qonunchiligining vazifalari",
                         "77": "Mehnat shartnomasi", "161": "Ishdan bo'shatish"},
        "article_range": (500, 700),
        "chapters": (15, 25),
        "unique_terms": ["mehnat", "ish beruvchi", "xodim", "ish haqi",
                         "mehnat shartnomasi", "ta'til", "ish staji",
                          "ishdan bo'shatish", "ish vaqti", "dam olish"],
        "chapter_hints": ["Mehnat", "ish haqi", "ish vaqti", "ta'til"]
    },
    {
        "keyword": "Oila kodeksi", "id": "family_code",
        "name": "O'zbekiston Respublikasi Oila kodeksi",
        "key_articles": {"1": "Oila qonunchiligi vazifalari",
                         "15": "Nikoh yoshi", "22": "Nikohni bekor qilish",
                         "105": "Aliment"},
        "article_range": (150, 300),
        "chapters": (8, 15),
        "unique_terms": ["oila", "nikoh", "er-xotin", "ajrim", "aliment",
                         "bola", "farzandlik", "ota-ona", "vasiylik",
                          "nikoh shartnomasi", "mulk"],
        "chapter_hints": ["Oila", "nikoh", "er-xotin", "farzand"]
    },
    {
        "keyword": "Soliq kodeksi", "id": "tax_code",
        "name": "O'zbekiston Respublikasi Soliq kodeksi",
        "key_articles": {"1": "Soliq qonunchiligining vazifalari",
                         "41": "Daromad solig'i"},
        "article_range": (400, 600),
        "chapters": (10, 20),
        "unique_terms": ["soliq", "daromad", "soliq to'lovchi", "stavka",
                         "soliq davri", "QQS", "foyda", "yakka tartibdagi",
                          "soliq nazorati", "soliq imtiyozi"],
        "chapter_hints": ["Soliq", "soliq tizimi", "soliq to'lovchi", "soliq nazorati"]
    },
    {
        "keyword": "Yer kodeksi", "id": "land_code",
        "name": "O'zbekiston Respublikasi Yer kodeksi",
        "key_articles": {"1": "Yer to'g'risidagi qonunchilik vazifalari",
                         "8": "Yer fondi toifalari"},
        "article_range": (80, 200),
        "chapters": (5, 12),
        "unique_terms": ["yer", "yer uchastkasi", "yer fondi", "qishloq xo'jaligi",
                         "tuproq", "sug'oriladigan", "dalolatnoma",
                          "yer maydoni", "kadastr"],
        "chapter_hints": ["Yer", "yer fondi", "qishloq xo'jaligi", "yer tuzish"]
    },
    {
        "keyword": "Ma'muriy", "id": "admin_code",
        "name": "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi kodeksi",
        "key_articles": {"48": "Yo'l harakati qoidalarini buzish",
                         "101": "Mayda bezorilik", "183": "Jamoat tartibini buzish"},
        "article_range": (400, 600),
        "chapters": (10, 15),
        "unique_terms": ["ma'muriy", "jarima", "ogohlantirish", "huquqbuzarlik",
                         "ma'muriy javobgarlik", "yo'l harakati", "transport",
                          "bezorilik", "nazorat qilish"],
        "chapter_hints": ["Ma'muriy", "huquqbuzarlik", "javobgarlik", "jarima"]
    },
    {
        "keyword": "Konstitutsiya", "id": "constitution",
        "name": "O'zbekiston Respublikasi Konstitutsiyasi",
        "key_articles": {"1": "O'zbekiston suveren respublika",
                         "13": "Inson huquqlari kafolatlari"},
        "article_range": (80, 200),
        "chapters": (6, 15),
        "unique_terms": ["konstitutsiya", "asosiy qonun", "respublika", "fuqarolar",
                         "prezident", "oliy majlis", "vazirlar mahkamasi",
                          "sud hokimiyati", "inson huquqlari", "demokratik"],
        "chapter_hints": ["Davlat", "fuqarolar", "prezident", "oliy majlis",
                          "sud hokimiyati", "mahalliy"]
    },
    {
        "keyword": "Fuqarolik protsessual", "id": "civil_procedure_code",
        "name": "O'zbekiston Respublikasi Fuqarolik protsessual kodeksi",
        "key_articles": {}, "article_range": (200, 400),
        "unique_terms": ["protsessual", "fuqarolik ishi", "da'vo arizasi",
                         "sud majlisi", "apellyatsiya", "kassatsiya",
                          "sud qarori", "ijro", "da'vogar", "javobgar"],
        "chapters": (10, 15),
        "chapter_hints": ["Protsessual", "da'vo", "apellyatsiya"]
    },
    {
        "keyword": "Jinoyat-protsessual", "id": "criminal_procedure_code",
        "name": "O'zbekiston Respublikasi Jinoyat-protsessual kodeksi",
        "key_articles": {}, "article_range": (300, 500),
        "unique_terms": ["protsessual", "tergov", "jinoyat ishi", "himoya",
                         "ayblov", "prokuror", "sanksiya", "tintuv",
                          "ehtiyot chorasi", "gumon qilinuvchi"],
        "chapters": (10, 15),
        "chapter_hints": ["Protsessual", "tergov", "ayblov", "himoya"]
    },
    {
        "keyword": "Iqtisodiy protsessual", "id": "economic_procedure_code",
        "name": "O'zbekiston Respublikasi Iqtisodiy protsessual kodeksi",
        "key_articles": {}, "article_range": (200, 400),
        "unique_terms": ["iqtisodiy", "iqtisodiy sud", "xo'jalik", "nizolar",
                         "tadbirkorlik", "bankrotlik", "majlis"],
        "chapters": (8, 15),
        "chapter_hints": ["Iqtisodiy", "xo'jalik", "tadbirkorlik", "nizolar"]
    },
]


def _get_dname(code_id):
    """Get display name from code_id."""
    for sig in CODE_SIGNATURES:
        if sig["id"] == code_id:
            return sig["name"]
    return code_id


def _is_generic_filename(filename):
    """Check if the filename is generic (e.g. file.pdf, file(5).pdf, document.pdf)."""
    name = filename.lower().rsplit('.', 1)[0]
    generic_patterns = [
        r'^file', r'^document', r'^scan', r'^photo', r'^image',
        r'^img', r'^doc', r'^page', r'^untitled', r'^new',
    ]
    for pattern in generic_patterns:
        if re.match(pattern, name):
            return True
    # Also check if filename is very generic (only digits/symbols + extension)
    if re.match(r'^[\d\s()\-._]+$', name):
        return True
    return False


def _analyze_chapters(text):
    """
    Extract chapter headers and count them.
    Returns (chapter_count, [chapter_names], detected_hints)
    """
    lines = text.replace('\r\n', '\n').split('\n')
    chapters = []
    for line in lines:
        if CHAPTER_RE.match(line.strip()):
            # Extract chapter name after the number
            clean = line.strip()
            chapters.append(clean)
    # Extract unique meaningful words from chapter names
    hints = []
    for ch in chapters:
        parts = ch.lower().split()
        hints.extend([w.strip('.') for w in parts if len(w) > 3 and not w.isdigit()])
    return len(chapters), chapters, hints


def _count_articles_in_text(text):
    """Count articles and find min/max article numbers."""
    numbers = []
    lines = text.replace('\r\n', '\n').split('\n')
    for line in lines:
        m = ARTICLE_RE.match(line.strip())
        if m:
            try:
                numbers.append(int(m.group(1)))
            except ValueError:
                pass
    if not numbers:
        return 0, 0, 0
    return len(numbers), min(numbers), max(numbers)


def _keyword_density(text, terms):
    """Score how frequently the given terms appear in the text."""
    text_lower = text.lower()
    score = 0
    matched = 0
    for term in terms:
        count = text_lower.count(term.lower())
        if count > 0:
            score += min(count, 10)  # Cap each term at 10 occurrences
            matched += 1
    # Bonus for variety (more unique terms matched)
    if matched > 3:
        score += matched * 2
    return score, matched


def _check_key_articles(text, key_articles):
    """Check if known landmark articles appear in the text."""
    found = 0
    total_possible = max(len(key_articles), 1)
    for art_num, _ in key_articles.items():
        # Look for article number references — only at line beginnings to avoid false positives
        patterns = [
            f"{art_num}-modda",             # "97-modda"
            f"\n{art_num}.",                 # "\n97." at line start
        ]
        for p in patterns:
            if p in text:
                found += 1
                break
    return found / total_possible if total_possible > 0 else 0


def _chapter_name_match(chapter_hints, detected_hints):
    """Score how well chapter names match a code's expected patterns."""
    if not chapter_hints or not detected_hints:
        return 0
    score = 0
    for hint in chapter_hints:
        if hint.lower() in detected_hints:
            score += 3
        # Also check if hint appears in any chapter name
    return score


def identify_code(text, filename):
    """
    Identify legal code from PDF text content and filename.
    Uses multi-layer analysis for generic filenames like file(N).pdf

    Layers:
      1. Filename matching (named PDFs)
      2. Direct content keyword match (fast path)
      3. Chapter structure analysis
      4. Article number range analysis
      5. Keyword density scoring with weighted terms
      6. Known article reference detection
      7. Chapter name pattern matching

    Returns:
        (code_id, display_name) tuple, or (None, None) if unidentified.
    """
    fname_lower = filename.lower()
    is_generic = _is_generic_filename(filename)
    text_lower = text.lower()

    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 1: Filename matching (fast path for named PDFs)
    # ═══════════════════════════════════════════════════════════════════════
    if not is_generic:
        for sig in CODE_SIGNATURES:
            if sig["keyword"].lower() in fname_lower:
                return sig["id"], sig["name"]

    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 2: Direct keyword match in first 3000 chars (fast path)
    # ═══════════════════════════════════════════════════════════════════════
    head = text_lower[:3000]
    for sig in CODE_SIGNATURES:
        if sig["keyword"].lower() in head:
            return sig["id"], sig["name"]
        # Also check name
        if sig["name"].lower()[:20] in head:
            return sig["id"], sig["name"]

    # ═══════════════════════════════════════════════════════════════════════
    # LAYER 3-7: Deep content analysis (for generic filenames)
    # ═══════════════════════════════════════════════════════════════════════

    # Pre-compute text features
    art_count, art_min, art_max = _count_articles_in_text(text)
    chap_count, chap_names, detected_hints = _analyze_chapters(text)

    if art_count < 5 and chap_count < 2:
        # Not enough structure to analyze — try broader search
        full_text = text_lower[:10000]
        best_score = 0
        best_match = (None, None)
        for sig in CODE_SIGNATURES:
            kw = sig["keyword"].lower()
            score = sum(1 for w in kw.split() if w in full_text)
            if kw in full_text:
                score += 4
            if score > best_score:
                best_score = score
                best_match = (sig["id"], sig["name"])
        if best_score >= 2:
            return best_match
        return (None, None)

    # Score each code
    scored = []
    text_sample = text_lower[:20000]  # Use first 20K chars for scoring

    for sig in CODE_SIGNATURES:
        score = 0.0
        reasons = []

        # ── Layer 3: Chapter count match ──
        ch_min, ch_max = sig.get("chapters", (5, 20))
        if ch_min <= chap_count <= ch_max:
            closeness = 1.0 - abs(chap_count - (ch_min + ch_max) / 2) / ((ch_max - ch_min) / 2 + 1)
            score += max(0, closeness) * 8
            reasons.append(f"chapters({chap_count})")

        # ── Layer 4: Article count range match ──
        a_min, a_max = sig.get("article_range", (100, 1500))
        if a_min <= art_count <= a_max:
            closeness = 1.0 - abs(art_count - (a_min + a_max) / 2) / ((a_max - a_min) / 2 + 1)
            score += max(0, closeness) * 15
            reasons.append(f"articles({art_count})")

        # ── Layer 5: Keyword density scoring ──
        if "unique_terms" in sig:
            kw_score, kw_matched = _keyword_density(text_sample, sig["unique_terms"])
            score += kw_score * 2
            if kw_matched > 2:
                reasons.append(f"terms({kw_matched})")

        # ── Layer 6: Known article references ──
        if sig.get("key_articles"):
            ref_ratio = _check_key_articles(text, sig["key_articles"])
            score += ref_ratio * 20
            if ref_ratio > 0:
                reasons.append(f"key_arts({ref_ratio:.0%})")

        # ── Layer 7: Chapter name matching ──
        if "chapter_hints" in sig and detected_hints:
            ch_score = _chapter_name_match(sig["chapter_hints"], detected_hints)
            score += ch_score * 1.5
            if ch_score > 0:
                reasons.append(f"ch_hints({ch_score})")

        # ── Penalty: max article mismatch ──
        a_max_expected = a_max * 1.3
        if art_count > a_max_expected:
            penalty = (art_count - a_max_expected) / a_max_expected
            score -= penalty * 10

        scored.append((score, sig["id"], sig["name"], reasons))

    # Sort by score descending
    scored.sort(key=lambda x: -x[0])

    if not scored:
        return (None, None)

    best_score, best_id, best_name, reasons = scored[0]
    second_score = scored[1][0] if len(scored) > 1 else 0

    # Require minimum score and significant margin over 2nd place
    MIN_SCORE = 25
    MARGIN_RATIO = 0.5

    if best_score >= MIN_SCORE and (best_score - second_score) / max(best_score, 1) > MARGIN_RATIO:
        if is_generic:
            print(f"  [IDENTIFY] {best_name} (score={best_score:.0f}, reasons: {', '.join(reasons)})")
        return best_id, best_name

    # Not confident enough — return None
    if best_score >= 10:
        if is_generic:
            print(f"  [IDENTIFY] {best_name} (score={best_score:.0f}, reasons: {', '.join(reasons)}) — low confidence, will retry")
        # Try broader text sample for low-confidence matches
        text_sample2 = text_lower[:50000]
        scored2 = []
        for sig in CODE_SIGNATURES:
            score2 = 0.0
            reasons2 = []
            a_min, a_max = sig.get("article_range", (100, 1500))
            if a_min <= art_count <= a_max:
                closeness = 1.0 - abs(art_count - (a_min + a_max) / 2) / ((a_max - a_min) / 2 + 1)
                score2 += max(0, closeness) * 12
            if "unique_terms" in sig:
                kw_score2, kw_matched2 = _keyword_density(text_sample2, sig["unique_terms"])
                score2 += kw_score2 * 3
            scored2.append((score2, sig["id"], sig["name"]))
        scored2.sort(key=lambda x: -x[0])
        if scored2 and scored2[0][0] >= MIN_SCORE:
            best2_id, best2_name = scored2[0][1], scored2[0][2]
            print(f"  [IDENTIFY] Retry: {best2_name} (score={scored2[0][0]:.0f})")
            return best2_id, best2_name

    # Not confident enough — return None
    print(f"  [IDENTIFY] Best: {best_name}({best_score:.0f}) vs {scored[1][1]}({second_score:.0f}) — insufficient confidence (text has {art_count} articles, {chap_count} chapters)")
    return (None, None)


# ============================================================================
# ARTICLE PARSING
# ============================================================================

def parse_articles(text, code_id):
    """
    Parse legal articles from extracted PDF text.

    Args:
        text: Raw text from PDF
        code_id: Identified code identifier

    Returns:
        List of dicts: [{code_id, article_number, title, content, chapter}]
    """
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    lines = text.split('\n')

    articles = []
    current = None
    chapter = "Umumiy qoidalar"
    body = []
    in_article = False
    seen_nums = set()

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            if in_article and current:
                body.append('')
            continue

        # Detect chapter headers
        ch_match = CHAPTER_RE.match(line)
        if ch_match:
            if in_article and current:
                _finalize_article(current, body, articles, seen_nums)
                current = None
                body = []
                in_article = False
            chapter = raw_line[:300]
            continue

        # Detect article headers
        art_match = ARTICLE_RE.match(line)
        if art_match:
            if in_article and current:
                _finalize_article(current, body, articles, seen_nums)
                body = []

            current = {
                'code_id': code_id,
                'article_number': art_match.group(1).strip(),
                'title': (art_match.group(2) or '').strip(),
                'content': '',
                'chapter': chapter,
            }
            in_article = True
            continue

        # Collect body content
        if in_article and current:
            if SKIP_RE.match(line) or FOOTNOTE_RE.match(line):
                continue
            body.append(line)

    # Flush last article
    if in_article and current:
        _finalize_article(current, body, articles, seen_nums)

    return articles


def _finalize_article(cur, body, articles, seen):
    """Finalize and store a parsed article."""
    content = '\n'.join(body)
    content = re.sub(r'\n{3,}', '\n\n', content).strip()
    if content and cur['article_number'] not in seen:
        cur['content'] = content
        articles.append(dict(cur))
        seen.add(cur['article_number'])


# ============================================================================
# SUPABASE REST API CLIENT
# ============================================================================

class SupabaseImporter:
    """Handles Supabase REST API operations."""

    def __init__(self, url, service_key):
        self.url = url.rstrip('/')
        self.headers = {
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
            'Content-Type': 'application/json',
        }

    def upsert_category(self, code_id, name, article_count):
        """Create or update a category (legal code) entry."""
        import requests
        endpoint = f'{self.url}/rest/v1/categories'
        payload = {
            'code_id': code_id,
            'name': name,
            'description': name,
            'article_count': article_count,
        }
        headers = {**self.headers, 'Prefer': 'resolution=merge-duplicates'}
        resp = requests.post(endpoint, json=payload, headers=headers)
        if resp.status_code not in (200, 201):
            print(f"    [ERR] Category ({code_id}): {resp.status_code} {resp.text[:200]}", file=sys.stderr)
            return False
        return True

    def upsert_articles(self, articles):
        """
        Batch upsert articles into Supabase.

        Returns:
            (imported_count, error_count)
        """
        import requests
        endpoint = f'{self.url}/rest/v1/articles'
        headers = {**self.headers, 'Prefer': 'resolution=merge-duplicates'}

        BATCH_SIZE = 50
        ok = 0
        errors = 0

        for i in range(0, len(articles), BATCH_SIZE):
            batch = articles[i:i + BATCH_SIZE]
            resp = requests.post(endpoint, json=batch, headers=headers)

            if resp.status_code in (200, 201):
                ok += len(batch)
            elif resp.status_code == 409:
                # Conflict — upsert individual articles
                for art in batch:
                    r2 = requests.post(endpoint, json=[art], headers=headers)
                    if r2.status_code in (200, 201):
                        ok += 1
                    else:
                        errors += 1
                        sample = (art.get('content', '') or '')[:80].replace('\n', ' ')
                        print(f"    [ERR] Article {art['article_number']}: {r2.status_code} {sample}...", file=sys.stderr)
            else:
                errors += len(batch)
                sample = (batch[0].get('content', '') or '')[:80].replace('\n', ' ')
                print(f"    [ERR] Batch ({resp.status_code}): {resp.text[:200]} | {sample}...", file=sys.stderr)

        return (ok, errors)


# ============================================================================
# JSON OUTPUT
# ============================================================================

def write_output_json(output_path, parsed_codes, merge=True):
    """
    Write parsed codes to a TypeScript-compatible JSON file.
    Matches the format expected by src/data/legal-codes.ts.

    COLLAPSES MULTIPLE PDFs OF THE SAME CODE into a single entry.
    Articles are deduplicated by article_number.

    Args:
        output_path: Path to the output JSON file
        parsed_codes: List of {code_id, display_name, articles, sig} dicts
        merge: If True, merge with existing JSON file (update matching codes)
    """
    import json

    # ── COLLAPSE: group all articles by code_id, putting multiple PDFs into one entry ──
    from collections import OrderedDict
    collapsed = OrderedDict()  # code_id -> {articles, sig, display_name}

    for pc in parsed_codes:
        cid = pc['code_id']
        if cid not in collapsed:
            collapsed[cid] = {
                'display_name': pc['display_name'],
                'articles': [],
                'sig': pc.get('sig', {}) or {},
                'seen_nums': set(),
            }
        # Append new articles (deduplicate by article_number)
        seen = collapsed[cid]['seen_nums']
        for a in pc['articles']:
            if a['article_number'] not in seen:
                collapsed[cid]['articles'].append(a)
                seen.add(a['article_number'])

    # Build new entries from collapsed groups
    new_entries = []
    for cid, data in collapsed.items():
        sig = data.get('sig', {})
        # Build description from key articles
        desc = ''
        if sig and sig.get('key_articles'):
            keys = list(sig['key_articles'].values())
            if keys:
                desc = keys[0] if len(keys) == 1 else ', '.join(keys[:3]) + '...'
        entry = {
            'id': cid,
            'name': data['display_name'],
            'shortName': data['display_name'],
            'description': desc,
            'totalArticles': len(data['articles']),
            'effectiveDate': '01.01.2024',
            'articles': [
                {
                    'number': a['article_number'],
                    'title': a.get('title', '') or '',
                    'content': (a.get('content', '') or '')[:1500],
                    'category': a.get('chapter', 'Umumiy qoidalar'),
                }
                for a in data['articles']
            ],
        }
        new_entries.append(entry)

    # Read existing JSON if merging
    out_path = Path(output_path)
    existing = []
    if merge and out_path.exists():
        try:
            with open(out_path, 'r', encoding='utf-8') as f:
                existing = json.load(f)
            if not isinstance(existing, list):
                existing = []
        except (json.JSONDecodeError, IOError):
            existing = []

    # Merged: keep existing codes NOT in new entries, then add new entries
    new_ids = {e['id'] for e in new_entries}
    merged = [e for e in existing if e['id'] not in new_ids]
    merged.extend(new_entries)

    # Sort by a fixed order (constitution first, then codes by name)
    def sort_key(e):
        order = [
            'constitution', 'criminal_code', 'civil_code', 'labor_code',
            'family_code', 'tax_code', 'land_code', 'admin_code',
            'civil_procedure_code', 'criminal_procedure_code', 'economic_procedure_code',
        ]
        try:
            return order.index(e['id'])
        except ValueError:
            return 99
    merged.sort(key=sort_key)

    # Write
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=0)

    total_articles = sum(e.get('totalArticles', 0) or len(e.get('articles', [])) for e in merged)
    print(f"  [JSON] Written {len(merged)} unique codes ({total_articles} articles) to {out_path}")
    return merged


# ============================================================================
# PDF PROCESSOR
# ============================================================================

def process_pdf(filepath, importer=None, skip_supabase=False):
    """
    Process a single PDF file: extract, parse, and optionally import to Supabase.

    Args:
        filepath: Path to the PDF file
        importer: SupabaseImporter instance (None if skip_supabase=True)
        skip_supabase: If True, skip Supabase import (only parse)

    Returns:
        Dict with status information. If 'status' == 'imported', includes
        'articles' key with the parsed article data for JSON output.
    """
    filename = os.path.basename(filepath)
    size_kb = os.path.getsize(filepath) / 1024

    print(f"\n  [PDF] {filename} ({size_kb:.1f} KB)")
    print(f"  Extracting text...", end=' ', flush=True)

    try:
        text = extract_text(filepath)
        print(f"{len(text)} chars")
    except Exception as e:
        print(f"[FAILED] {e}")
        return {'status': 'error', 'reason': str(e)}

    if len(text) < 100:
        print(f"  [SKIP] Text too short ({len(text)} chars)")
        return {'status': 'skipped', 'reason': 'too_short'}

    # Identify the legal code
    code_id, display_name = identify_code(text, filename)
    if not code_id:
        head = text[:500].replace('\n', ' ').strip()
        print(f"  [SKIP] Could not identify code. First chars: {head[:150]}...")
        return {'status': 'unidentified', 'reason': 'no_code_match', 'text_head': head[:200]}

    print(f"  Code: {display_name} ({code_id})")

    # Parse articles
    articles = parse_articles(text, code_id)
    print(f"  Found {len(articles)} articles")

    if not articles:
        print(f"  [SKIP] No articles parsed")
        return {'status': 'skipped', 'reason': 'no_articles'}

    # Find matching signature for metadata
    sig = {}
    for s in CODE_SIGNATURES:
        if s['id'] == code_id:
            sig = s
            break

    result = {
        'status': 'imported',
        'code_id': code_id,
        'display_name': display_name,
        'articles_found': len(articles),
        'articles': articles,
        'sig': sig,
    }

    # Import to Supabase (if not skipped)
    if not skip_supabase and importer:
        print(f"  Importing to Supabase...")
        cat_ok = importer.upsert_category(code_id, display_name, len(articles))
        if not cat_ok:
            print(f"  [WARN] Category upsert failed, continuing...")

        imported, errors = importer.upsert_articles(articles)
        result['imported'] = imported
        result['errors'] = errors
        status_icon = "[OK]" if errors == 0 else "[PARTIAL]"
        print(f"  {status_icon} {imported} imported, {errors} errors")
    else:
        result['imported'] = len(articles)
        result['errors'] = 0
        if skip_supabase:
            print(f"  [SKIP] Supabase import skipped (--skip-supabase)")

    return result


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Import Uzbekistan legal codes from PDF files to Supabase"
    )
    parser.add_argument('folder', help='Path to folder containing PDF files')
    parser.add_argument('--url', help='Supabase project URL (overrides .env)')
    parser.add_argument('--key', help='Supabase service_role key (overrides .env)')
    parser.add_argument('--env', default='.env.local', help='Path to .env file')
    parser.add_argument('--limit', type=int, default=0,
                        help='Only process first N PDF files')
    parser.add_argument('--output-json', default='',
                        help='Write parsed data to this JSON file (e.g. src/data/full-legal-codes.json)')
    parser.add_argument('--no-merge', action='store_true',
                        help='When set, overwrite output JSON instead of merging with existing data')
    parser.add_argument('--skip-supabase', action='store_true',
                        help='Skip Supabase import entirely (useful with --output-json only)')
    args = parser.parse_args()

    # Resolve .env file path
    script_dir = Path(__file__).resolve().parent
    env_file = (script_dir / '..' / args.env).resolve()

    # Load environment variables from .env.local
    supabase_url = args.url
    service_key = args.key

    if not supabase_url or not service_key:
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('#') or '=' not in line:
                        continue
                    key, _, val = line.partition('=')
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key == 'NEXT_PUBLIC_SUPABASE_URL':
                        supabase_url = val
                    elif key == 'SUPABASE_SERVICE_ROLE_KEY':
                        service_key = val

    has_supabase = bool(supabase_url and service_key)
    has_json_output = bool(args.output_json)
    skip_supabase = args.skip_supabase or not has_supabase

    if not has_supabase and not has_json_output:
        print("\n  [FATAL] Supabase credentials not found and no --output-json specified!")
        print(f"  Checked: {env_file}")
        print("\n  Options:")
        print("    1. Set --url and --key, or configure .env.local")
        print("    2. Use --output-json to write parsed data to a JSON file")
        print("    3. Use both together to import to Supabase AND write JSON")
        print()
        sys.exit(1)

    if not has_supabase and has_json_output:
        skip_supabase = True
        print("  [INFO] No Supabase credentials — running in JSON-only mode")

    # Validate folder
    folder = Path(args.folder)
    if not folder.is_dir():
        print(f"\n  [FATAL] Folder not found: {folder}\n")
        sys.exit(1)

    # Print header
    print()
    print("=" * 60)
    header_title = "  Uzbekistan Legal Codes: PDF Importer"
    if has_json_output and not skip_supabase:
        header_title += " (Supabase + JSON)"
    elif skip_supabase and has_json_output:
        header_title += " (JSON only)"
    elif not skip_supabase:
        header_title += " (Supabase only)"
    print(header_title)
    print("=" * 60)
    print()
    print(f"  Source folder: {folder}")
    if has_supabase:
        print(f"  Supabase URL:  {supabase_url}")
    if has_json_output:
        print(f"  Output JSON:   {args.output_json}")
    print()

    # Load dotenv for supplementary env vars
    try:
        from dotenv import load_dotenv
        load_dotenv(str(env_file))
    except ImportError:
        pass

    # Collect PDF files
    all_files = sorted(os.listdir(str(folder)))
    pdf_files = [f for f in all_files if f.lower().endswith('.pdf')]

    print(f"  Total files: {len(all_files)}, PDFs: {len(pdf_files)}")
    if args.limit > 0:
        pdf_files = pdf_files[:args.limit]
        print(f"  Limit: first {args.limit} files")
    print()

    # Initialize importer (only if needed)
    importer = SupabaseImporter(supabase_url, service_key) if has_supabase and not skip_supabase else None
    if importer:
        print("  Supabase importer initialized")
    print()

    # Process each PDF
    results = []
    total_imported = 0
    total_errors = 0
    parsed_codes = []  # For JSON output

    for pdf_file in pdf_files:
        filepath = folder / pdf_file
        result = process_pdf(str(filepath), importer, skip_supabase)
        results.append(result)
        if result.get('status') == 'imported':
            total_imported += result.get('imported', 0)
            total_errors += result.get('errors', 0)
            # Collect for JSON output
            if has_json_output and 'articles' in result:
                parsed_codes.append({
                    'code_id': result['code_id'],
                    'display_name': result['display_name'],
                    'articles': result['articles'],
                    'sig': result.get('sig', {}),
                })

    # Summary
    print()
    print("=" * 60)
    print("  PROCESSING COMPLETE")
    print()

    imported_count = sum(1 for r in results if r.get('status') == 'imported')
    skipped_count = sum(1 for r in results if r.get('status') in ('skipped', 'unidentified'))
    error_count = sum(1 for r in results if r.get('status') == 'error')

    print(f"  Imported codes:   {imported_count}")
    print(f"  Skipped:          {skipped_count}")
    print(f"  Errors:           {error_count}")
    print(f"  Total articles:   {total_imported}")
    if total_errors > 0:
        print(f"  Article errors:   {total_errors}")

    print()
    print("  -- Results --")
    for r in results:
        s = r.get('status', 'unknown')
        if s == 'imported':
            print(f"    [OK] {r.get('display_name', '?')}: {r.get('imported', 0)} articles")
        elif s == 'skipped':
            print(f"    [--] {r.get('reason', '?')}")
        elif s == 'unidentified':
            preview = (r.get('text_head', '') or '')[:80]
            print(f"    [?] Unidentified: {preview}...")
        elif s == 'error':
            print(f"    [!!] {r.get('reason', '?')}")

    # Write JSON output if requested
    if has_json_output and parsed_codes:
        print()
        merge = not args.no_merge
        write_output_json(args.output_json, parsed_codes, merge=merge)

    print()
    print("=" * 60)
    print()


if __name__ == '__main__':
    main()
