#!/usr/bin/env python3
"""Clear all articles and categories from Supabase via REST API."""
import os, sys, json
from pathlib import Path

# Load credentials from .env.local
env_file = Path(__file__).resolve().parent.parent / '.env.local'
supabase_url = None
service_key = None

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

if not supabase_url or not service_key:
    print("[FATAL] Could not load Supabase credentials from .env.local")
    sys.exit(1)

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
}

import requests

# Delete all articles first (foreign key constraints)
# Need a filter that matches all rows - id != 0000... works for UUID
print("Deleting all articles...")
# Force DELETE by using a filter that matches all rows
headers_with_prefer = {**headers, 'Prefer': 'resolution=merge-duplicates'}
resp = requests.delete(
    f'{supabase_url}/rest/v1/articles?id=neq.00000000-0000-0000-0000-000000000000',
    headers=headers
)
print(f"  Articles DELETE: {resp.status_code}")
if resp.status_code not in (200, 204):
    print(f"  Response: {resp.text[:200]}")

# Delete all categories
print("Deleting all categories...")
resp = requests.delete(
    f'{supabase_url}/rest/v1/categories?id=neq.00000000-0000-0000-0000-000000000000',
    headers=headers
)
print(f"  Categories DELETE: {resp.status_code}")
if resp.status_code not in (200, 204):
    print(f"  Response: {resp.text[:200]}")

# Verify counts
print("\nVerifying...")
resp = requests.get(f'{supabase_url}/rest/v1/articles?select=id&limit=1', headers=headers)
art_count = len(resp.json()) if resp.ok else 'error'
print(f"  Articles remaining: {art_count}")

resp = requests.get(f'{supabase_url}/rest/v1/categories?select=id&limit=1', headers=headers)
cat_count = len(resp.json()) if resp.ok else 'error'
print(f"  Categories remaining: {cat_count}")

if art_count == 0 and cat_count == 0:
    print("\nDONE - Database cleared successfully!")
else:
    print(f"\n[WARN] Still have {art_count} articles, {cat_count} categories")
    print("Trying Supabase SQL query via REST...")
    # Try using RPC if available
    from requests import post as rpc_post
    
    # Try direct DELETE without filter (some versions allow it)
    print("  Attempting unfiltered DELETE...")
    resp = requests.delete(f'{supabase_url}/rest/v1/articles', headers=headers_with_prefer)
    print(f"  Articles DELETE (unfiltered): {resp.status_code}")
    
    resp = requests.delete(f'{supabase_url}/rest/v1/categories', headers=headers_with_prefer)
    print(f"  Categories DELETE (unfiltered): {resp.status_code}")
    
    # Final verification
    resp = requests.get(f'{supabase_url}/rest/v1/articles?select=id&limit=1', headers=headers)
    print(f"  Final articles: {len(resp.json()) if resp.ok else 'error'}")
    resp = requests.get(f'{supabase_url}/rest/v1/categories?select=id&limit=1', headers=headers)
    print(f"  Final categories: {len(resp.json()) if resp.ok else 'error'}")
