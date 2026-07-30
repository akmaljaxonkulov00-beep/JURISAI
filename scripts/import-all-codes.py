#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EXACT PDF-to-Supabase import script.
Each file is manually mapped to the correct legal code (NO auto-identification).

Mapping (verified by reading first pages):
  file (29).pdf                    → constitution   (Konstitutsiya)
  30.04.1998. Oila kodeksi (2).pdf → family_code     (Oila kodeksi)
  file (34).pdf                    → admin_code      (Ma'muriy javobgarlik kodeksi)
  file (30).pdf                    → criminal_code   (Jinoyat kodeksi)
  file (31).pdf                    → criminal_procedure_code (Jinoyat-protsessual kodeksi)
  file (32).pdf                    → civil_code      (Fuqarolik kodeksi 1-qism)
  file (33).pdf                    → civil_code      (Fuqarolik kodeksi 2-qism)
  30.12.2019. Soliq kodeksi (2).pdf → tax_code       (Soliq kodeksi)
  file (35).pdf                    → labor_code      (Mehnat kodeksi)
"""

import os, sys, re, json, io, warnings
from pathlib import Path
warnings.filterwarnings('ignore')

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ============================================================
# EXACT FILE-TO-CODE MAPPING (manually verified)
# ============================================================

FILE_MAP = [
    # (filename_pattern, code_id, display_name)
    ("file (29)",                "constitution",             "O'zbekiston Respublikasi Konstitutsiyasi"),
    ("Oila kodeksi",                "family_code",              "O'zbekiston Respublikasi Oila kodeksi"),
    ("file (34)",                "admin_code",               "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi kodeksi"),
    ("file (30)",                "criminal_code",            "O'zbekiston Respublikasi Jinoyat kodeksi"),
    ("file (31)",                "criminal_procedure_code",  "O'zbekiston Respublikasi Jinoyat-protsessual kodeksi"),
    ("file (32)",                "civil_code",               "O'zbekiston Respublikasi Fuqarolik kodeksi (1-qism)"),
    ("file (33)",                "civil_code",               "O'zbekiston Respublikasi Fuqarolik kodeksi (2-qism)"),
    ("Soliq kodeksi",               "tax_code",                 "O'zbekiston Respublikasi Soliq kodeksi"),
    ("file (35)",                "labor_code",               "O'zbekiston Respublikasi Mehnat kodeksi"),
]

# ============================================================
# PDF TEXT EXTRACTION
# ============================================================

def extract_text(filepath):
    try:
        from pdfminer.high_level import extract_text
        text = extract_text(filepath)
        text = text.replace('\u2018', "'").replace('\u2019', "'").replace('\u02bb', "'")
        return text, 'pdfminer'
    except Exception as e:
        try:
            import PyPDF2
            with open(filepath, 'rb') as fh:
                reader = PyPDF2.PdfReader(fh)
                parts = []
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        parts.append(t)
            return '\n'.join(parts), 'PyPDF2'
        except Exception as e2:
            raise RuntimeError(f"All parsers failed: {e}, {e2}")

# ============================================================
# ARTICLE PARSING
# ============================================================

ARTICLE_RE = re.compile(r'^(\d+)\s*[-\u2013]\s*modda\b\s*\.?\s*(.*)', re.IGNORECASE | re.DOTALL)
CHAPTER_RE = re.compile(r'^(\d+)\s*[-\u2013]?\s*bob', re.IGNORECASE)
SKIP_RE = re.compile(r'^(Oldingi tahrirga qarang|Eski tahrir|\([^)]*modda)', re.IGNORECASE)
FOOTNOTE_RE = re.compile(r'^\([^)]*\)\s*$')

def parse_articles(text, code_id):
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    # Remove image marker lines
    text = re.sub(r'^Page \d+ of \d+$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$', '', text, flags=re.MULTILINE)
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

        ch_match = CHAPTER_RE.match(line)
        if ch_match:
            if in_article and current:
                _finalize(current, body, articles, seen_nums)
                current = None
                body = []
                in_article = False
            chapter = raw_line[:300]
            continue

        art_match = ARTICLE_RE.match(line)
        if art_match:
            if in_article and current:
                _finalize(current, body, articles, seen_nums)
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

        if in_article and current:
            if SKIP_RE.match(line) or FOOTNOTE_RE.match(line):
                continue
            body.append(line)

    if in_article and current:
        _finalize(current, body, articles, seen_nums)

    return articles

def _finalize(cur, body, articles, seen):
    content = '\n'.join(body)
    content = re.sub(r'\n{3,}', '\n\n', content).strip()
    if content and cur['article_number'] not in seen:
        cur['content'] = content
        articles.append(dict(cur))
        seen.add(cur['article_number'])

# ============================================================
# SUPABASE IMPORT
# ============================================================

def find_file_in_folder(folder, pattern):
    """Find a file in the folder that matches a pattern.
    Normalizes Unicode characters for robust matching."""
    import unicodedata
    for f in os.listdir(folder):
        if not f.lower().endswith('.pdf'):
            continue
        # Normalize both pattern and filename (NFKC handles Unicode chars)
        f_norm = unicodedata.normalize('NFKC', f)
        pat_norm = unicodedata.normalize('NFKC', pattern)
        if pat_norm in f_norm:
            return f
    return None

def upsert_category(api_url, service_key, code_id, name, article_count):
    import requests
    endpoint = f'{api_url}/rest/v1/categories'
    payload = {
        'code_id': code_id,
        'name': name,
        'description': name,
        'article_count': article_count,
        'icon': 'book',
        'color': '#3B82F6',
    }
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
    }
    resp = requests.post(endpoint, json=payload, headers=headers)
    if resp.status_code not in (200, 201):
        print(f"    [ERR] Category ({code_id}): {resp.status_code} {resp.text[:200]}", file=sys.stderr)
        return False
    print(f"    [OK] Category: {name}")
    return True

def upsert_articles(api_url, service_key, articles):
    import requests
    endpoint = f'{api_url}/rest/v1/articles'
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
    }
    BATCH_SIZE = 50
    ok, errors = 0, 0
    for i in range(0, len(articles), BATCH_SIZE):
        batch = articles[i:i + BATCH_SIZE]
        resp = requests.post(endpoint, json=batch, headers=headers)
        if resp.status_code in (200, 201):
            ok += len(batch)
        elif resp.status_code == 409:
            for art in batch:
                r2 = requests.post(endpoint, json=[art], headers=headers)
                if r2.status_code in (200, 201):
                    ok += 1
                else:
                    errors += 1
                    print(f"    [ERR] Article {art['article_number']}: {r2.status_code}", file=sys.stderr)
        else:
            errors += len(batch)
            print(f"    [ERR] Batch ({resp.status_code}): {resp.text[:150]}", file=sys.stderr)
    return ok, errors

# ============================================================
# MAIN
# ============================================================

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Import legal codes from PDFs to Supabase')
    parser.add_argument('folder', help='Folder with PDF files')
    parser.add_argument('--url', help='Supabase URL')
    parser.add_argument('--key', help='Supabase service_role key')
    parser.add_argument('--output-json', default='', help='Write parsed data to JSON file')
    parser.add_argument('--skip-supabase', action='store_true', help='Skip Supabase import')
    args = parser.parse_args()

    folder = Path(args.folder)
    if not folder.is_dir():
        print(f"[FATAL] Folder not found: {folder}")
        sys.exit(1)

    # Load Supabase credentials from .env.local if not provided
    supabase_url, service_key = args.url, args.key
    if (not supabase_url or not service_key) and not args.skip_supabase:
        env_file = Path(__file__).resolve().parent.parent / '.env.local'
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if '=' in line and not line.startswith('#'):
                        k, _, v = line.partition('=')
                        v = v.strip('"\'')
                        if k.strip() == 'NEXT_PUBLIC_SUPABASE_URL':
                            supabase_url = v
                        elif k.strip() == 'SUPABASE_SERVICE_ROLE_KEY':
                            service_key = v

    has_supabase = bool(supabase_url and service_key) and not args.skip_supabase
    has_json = bool(args.output_json)

    if not has_supabase and not has_json:
        print("[FATAL] No Supabase credentials and no --output-json")
        sys.exit(1)

    print("=" * 60)
    print("LEGAL CODES IMPORT — WITH EXACT MAPPING")
    print(f"Source: {folder}")
    if has_supabase:
        print(f"Supabase: {supabase_url}")
    if has_json:
        print(f"JSON: {args.output_json}")
    print("=" * 60)

    # Process each mapped file
    all_results = []  # For JSON output
    grand_total = 0
    grand_errors = 0

    for pattern, code_id, dname in FILE_MAP:
        filename = find_file_in_folder(folder, pattern)
        if not filename:
            print(f"\n[SKIP] No file matching '{pattern}' found")
            continue

        filepath = folder / filename
        size_kb = filepath.stat().st_size / 1024
        print(f"\n--- {filename} ({size_kb:.0f} KB)")
        print(f"    -> {dname} ({code_id})")

        print("    Extracting text...", end=' ', flush=True)
        try:
            text, method = extract_text(str(filepath))
            print(f"{len(text)} chars ({method})")
        except Exception as e:
            print(f"[FAILED] {e}")
            continue

        if len(text) < 100:
            print(f"    [SKIP] Too short ({len(text)} chars)")
            continue

        articles = parse_articles(text, code_id)
        print(f"    Articles: {len(articles)}")

        if not articles:
            print(f"    [SKIP] No articles found")
            continue

        result = {
            'code_id': code_id,
            'display_name': dname,
            'articles': articles,
            'article_count': len(articles),
        }
        all_results.append(result)

        if has_supabase:
            print(f"    Importing to Supabase...")
            upsert_category(supabase_url, service_key, code_id, dname, len(articles))
            imported, errors = upsert_articles(supabase_url, service_key, articles)
            grand_total += imported
            grand_errors += errors
            if errors == 0:
                print(f"    [OK] {imported} imported")
            else:
                print(f"    [PARTIAL] {imported} imported, {errors} errors")
        else:
            grand_total += len(articles)

    # Summary
    print(f"\n{'=' * 60}")
    print(f"IMPORT COMPLETE")
    print(f"  Codes imported: {len(all_results)}")
    print(f"  Total articles: {grand_total}")
    if grand_errors > 0:
        print(f"  Errors: {grand_errors}")
    print()

    for r in all_results:
        print(f"  [OK] {r['display_name']}: {r['article_count']} articles")

    # Write JSON
    if has_json and all_results:
        from collections import OrderedDict
        collapsed = OrderedDict()
        for r in all_results:
            cid = r['code_id']
            if cid not in collapsed:
                collapsed[cid] = {
                    'display_name': r['display_name'],
                    'articles': [],
                    'seen': set(),
                }
            seen = collapsed[cid]['seen']
            for a in r['articles']:
                if a['article_number'] not in seen:
                    collapsed[cid]['articles'].append(a)
                    seen.add(a['article_number'])

        entries = []
        ORDER = ['constitution', 'criminal_code', 'criminal_procedure_code', 'civil_code',
                 'family_code', 'admin_code', 'tax_code', 'labor_code']
        for cid in ORDER:
            if cid not in collapsed:
                continue
            data = collapsed[cid]
            entries.append({
                'id': cid,
                'name': data['display_name'],
                'shortName': data['display_name'],
                'description': data['display_name'],
                'totalArticles': len(data['articles']),
                'effectiveDate': '01.01.2024',
                'articles': [{
                    'number': a['article_number'],
                    'title': a.get('title', '') or '',
                    'content': (a.get('content', '') or '')[:1500],
                    'category': a.get('chapter', 'Umumiy qoidalar'),
                } for a in data['articles']],
            })

        out_path = Path(args.output_json)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False, indent=0)
        total_a = sum(e.get('totalArticles', 0) for e in entries)
        print(f"\n  [JSON] {len(entries)} codes ({total_a} articles) -> {out_path}")

    print(f"\n{'=' * 60}")

if __name__ == '__main__':
    main()
