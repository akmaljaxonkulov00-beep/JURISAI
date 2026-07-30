#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fast import: reads full-legal-codes.json and imports ALL codes to Supabase.
Much faster than re-parsing PDFs since it uses pre-parsed JSON data.

Usage:
    python scripts/import-json-to-supabase.py
"""

import json
import requests
import sys
from pathlib import Path

# ── Supabase credentials (from .env.local) ────────────────────────────────
SUPABASE_URL = "https://blayqzykzlmrjuvhzvsk.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYXlxenlremxtcmp1dmh6dnNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDczMDM3MCwiZXhwIjoyMTAwMzA2MzcwfQ.PxS4umHEdnJpz_iaVSsxEVok0sPsiLGtXo-IL2XMMgg"

HEADERS = {
    'apikey': SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',
}

# ── Read JSON ─────────────────────────────────────────────────────────────
json_path = Path(__file__).resolve().parent.parent / "src" / "data" / "full-legal-codes.json"
with open(json_path, 'r', encoding='utf-8') as f:
    codes = json.load(f)

print(f"Loaded {len(codes)} codes from {json_path}")
print()

total_imported = 0
total_errors = 0

for code in codes:
    code_id = code.get('id', '')
    name = code.get('name', '')
    articles_raw = code.get('articles', [])
    total = code.get('totalArticles', len(articles_raw))

    if not code_id or not articles_raw:
        print(f"  [SKIP] {name}: no articles")
        continue

    print(f"  [{code_id}] {name[:50]}... — {len(articles_raw)} articles")

    # ── Upsert category ───────────────────────────────────────────────────
    cat_payload = {
        'code_id': code_id,
        'name': name,
        'description': code.get('description', name),
        'article_count': len(articles_raw),
    }
    cat_url = f"{SUPABASE_URL}/rest/v1/categories"
    cat_resp = requests.post(cat_url, json=cat_payload, headers=HEADERS)
    if cat_resp.status_code not in (200, 201):
        print(f"    [ERR] Category: {cat_resp.status_code} {cat_resp.text[:150]}")
    else:
        print(f"    [OK] Category upserted")

    # ── Upsert articles in batches ────────────────────────────────────────
    BATCH_SIZE = 50
    imported = 0
    errors = 0

    for i in range(0, len(articles_raw), BATCH_SIZE):
        batch = articles_raw[i:i + BATCH_SIZE]
        articles_payload = []
        for a in batch:
            art = {
                'code_id': code_id,
                'article_number': str(a.get('number', '')),
                'title': a.get('title', '') or '',
                'content': a.get('content', '') or '',
                'chapter': a.get('category', 'Umumiy qoidalar'),
            }
            articles_payload.append(art)

        art_url = f"{SUPABASE_URL}/rest/v1/articles"
        art_resp = requests.post(art_url, json=articles_payload, headers=HEADERS)

        if art_resp.status_code in (200, 201):
            imported += len(batch)
        elif art_resp.status_code == 409:
            # Try individual upsert
            for art in articles_payload:
                r2 = requests.post(art_url, json=[art], headers=HEADERS)
                if r2.status_code in (200, 201):
                    imported += 1
                else:
                    errors += 1
        else:
            errors += len(batch)
            print(f"    [ERR] Batch {i}: {art_resp.status_code} {art_resp.text[:120]}")

    total_imported += imported
    total_errors += errors
    print(f"    [{'OK' if errors == 0 else 'PARTIAL'}] {imported} imported, {errors} errors")

print()
print("=" * 60)
print(f"  IMPORT COMPLETE")
print(f"  Total: {total_imported} articles imported, {total_errors} errors")
print("=" * 60)

# ── Verify ────────────────────────────────────────────────────────────────
print()
print("  -- Verifying --")
verify_headers = {'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}'}
r = requests.get(f"{SUPABASE_URL}/rest/v1/categories?select=*&order=code_id.asc", headers=verify_headers)
cats = r.json()
print(f"  Categories: {len(cats)}")
for c in cats:
    print(f"    {c.get('code_id','?')}: {c.get('name','?')[:40]} — {c.get('article_count',0)} articles")

r2 = requests.get(f"{SUPABASE_URL}/rest/v1/articles?select=count", headers=verify_headers)
count_data = r2.json()
article_count = count_data[0]['count'] if count_data else 0
print(f"  Total articles: {article_count}")
print()
