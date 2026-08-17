#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import ONLY the 3 codes from the user's 9 PDF files:
1. family_code (Oila kodeksi) - 212 articles
2. tax_code (Soliq kodeksi) - 471 articles
3. criminal_code (Jinoyat kodeksi) - 3,652 articles

Clears existing data first, then imports fresh.
Uses small batches and individual article insert for reliability.
"""

import json
import os
import requests
import sys
import time
from pathlib import Path

# ── Supabase credentials — FAQAT muhit o'zgaruvchilaridan (.env.local) ──
# Hech qachon kalitni kodga yozmang!
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SERVICE_KEY:
    # .env.local dan o'qish (agar env sozlanmagan bo'lsa)
    env_file = Path(__file__).resolve().parent.parent / '.env.local'
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, _, v = line.partition('=')
                    v = v.strip('"\'')
                    if k.strip() == 'NEXT_PUBLIC_SUPABASE_URL':
                        SUPABASE_URL = v
                    elif k.strip() == 'SUPABASE_SERVICE_ROLE_KEY':
                        SERVICE_KEY = v

if not SUPABASE_URL or not SERVICE_KEY:
    print('[FATAL] Supabase kredensiallari topilmadi! .env.local ni tekshiring.')
    sys.exit(1)

HEADERS = {
    'apikey': SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type': 'application/json',
}

CODES_TO_IMPORT = ['family_code', 'tax_code', 'criminal_code']

# ── Step 1: Clear existing data ───────────────────────────────────────────
print("=" * 60)
print("  STEP 1: Clearing existing data")
print("=" * 60)

r1 = requests.delete(f"{SUPABASE_URL}/rest/v1/articles?id=neq.00000000-0000-0000-0000-000000000000", headers=HEADERS)
print(f"  DELETE articles: {r1.status_code}")

r2 = requests.delete(f"{SUPABASE_URL}/rest/v1/categories?id=neq.00000000-0000-0000-0000-000000000000", headers=HEADERS)
print(f"  DELETE categories: {r2.status_code}")

# Verify empty
r3 = requests.get(f"{SUPABASE_URL}/rest/v1/articles?select=count", headers=HEADERS)
print(f"  Articles remaining: {r3.json()}")
r4 = requests.get(f"{SUPABASE_URL}/rest/v1/categories?select=count", headers=HEADERS)
print(f"  Categories remaining: {r4.json()}")
print()

# ── Step 2: Read JSON ─────────────────────────────────────────────────────
print("=" * 60)
print("  STEP 2: Reading full-legal-codes.json")
print("=" * 60)

json_path = Path(__file__).resolve().parent.parent / "src" / "data" / "full-legal-codes.json"
with open(json_path, 'r', encoding='utf-8') as f:
    all_codes = json.load(f)

# Filter only the 3 codes we want
codes_to_import = [c for c in all_codes if c.get('id') in CODES_TO_IMPORT]
print(f"  Found {len(codes_to_import)} of {len(CODES_TO_IMPORT)} requested codes in JSON:")
for c in codes_to_import:
    print(f"    {c.get('id')}: {c.get('name', '?')[:50]} — {len(c.get('articles', []))} articles")
print()

# ── Step 3: Import categories ─────────────────────────────────────────────
print("=" * 60)
print("  STEP 3: Importing categories")
print("=" * 60)

for code in codes_to_import:
    code_id = code.get('id')
    name = code.get('name', '')
    articles = code.get('articles', [])
    payload = {
        'code_id': code_id,
        'name': name,
        'description': code.get('description', name),
        'article_count': len(articles),
    }
    
    # Use PUT to upsert by unique constraint
    upsert_headers = {**HEADERS, 'Prefer': 'resolution=merge-duplicates'}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/categories", json=payload, headers=upsert_headers)
    if r.status_code in (200, 201):
        print(f"  [OK] {code_id}: category created/updated")
    else:
        print(f"  [ERR] {code_id}: {r.status_code} {r.text[:150]}")
print()

# ── Step 4: Import articles (one by one, with timing) ─────────────────────
print("=" * 60)
print("  STEP 4: Importing articles (one at a time)")
print("=" * 60)

total_ok = 0
total_err = 0

for code in codes_to_import:
    code_id = code.get('id')
    articles = code.get('articles', [])
    
    if not articles:
        print(f"  [{code_id}] No articles to import")
        continue
    
    print(f"  [{code_id}] Importing {len(articles)} articles...")
    imported = 0
    errors = 0
    
    # Use Prefer header for upsert
    upsert_headers = {**HEADERS, 'Prefer': 'resolution=merge-duplicates'}
    
    # Batch in small groups of 10
    BATCH = 10
    for i in range(0, len(articles), BATCH):
        batch = articles[i:i + BATCH]
        payload = []
        for a in batch:
            payload.append({
                'code_id': code_id,
                'article_number': str(a.get('number', '')),
                'title': (a.get('title', '') or '')[:500],
                'content': (a.get('content', '') or '')[:10000],
                'chapter': (a.get('category', 'Umumiy qoidalar') or 'Umumiy qoidalar')[:300],
            })
        
        try:
            r = requests.post(f"{SUPABASE_URL}/rest/v1/articles", json=payload, headers=upsert_headers)
            if r.status_code in (200, 201):
                imported += len(batch)
            elif r.status_code == 409:
                # Try individual insert for conflict resolution
                for p in payload:
                    r2 = requests.post(f"{SUPABASE_URL}/rest/v1/articles", json=[p], headers=upsert_headers)
                    if r2.status_code in (200, 201):
                        imported += 1
                    else:
                        errors += 1
            else:
                errors += len(batch)
        except Exception as e:
            errors += len(batch)
            print(f"    [ERR] Batch at {i}: {e}")
        
        # Progress indicator
        if (i // BATCH + 1) % 10 == 0:
            print(f"    ... {imported + errors}/{len(articles)} ({imported} ok, {errors} err)")
    
    total_ok += imported
    total_err += errors
    print(f"  [{'OK' if errors == 0 else 'PARTIAL'}] {code_id}: {imported} ok, {errors} err")
    print()

# ── Step 5: Verify ────────────────────────────────────────────────────────
print("=" * 60)
print("  STEP 5: Verification")
print("=" * 60)

r = requests.get(f"{SUPABASE_URL}/rest/v1/categories?select=*&order=code_id.asc", headers=HEADERS)
cats = r.json()
print(f"  Categories: {len(cats)}")
for c in cats:
    print(f"    {c.get('code_id')}: {c.get('name','?')[:40]} — {c.get('article_count',0)}")

r2 = requests.get(f"{SUPABASE_URL}/rest/v1/articles?select=id,code_id,article_number&order=code_id.asc&limit=5000", headers=HEADERS)
arts = r2.json()
print(f"  Total articles: {len(arts)}")

from collections import Counter
codes_found = Counter(a.get('code_id') for a in arts)
for code_id, count in codes_found.most_common():
    print(f"    {code_id}: {count} articles")

# Check for any remaining codes NOT in our 3
remaining = set(codes_found.keys()) - set(CODES_TO_IMPORT)
if remaining:
    print(f"  WARNING: Unexpected codes found: {remaining}")

print()
print(f"  TOTAL: {total_ok} imported, {total_err} errors")
print("=" * 60)
