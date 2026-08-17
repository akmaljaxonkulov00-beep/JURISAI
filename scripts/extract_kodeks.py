# -*- coding: utf-8 -*-
"""JURISAI: PDF kodekslardan moddalarni ajratib olish va hisoblash."""
import os
import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from pypdf import PdfReader

FOLDER = r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)'
OUT_DIR = os.path.join(os.path.dirname(__file__), 'kodeks_text')
os.makedirs(OUT_DIR, exist_ok=True)

FILES = {
    'constitution': 'file (29).pdf',
    'criminal_code': 'file (30).pdf',
    'criminal_procedure_code': 'file (31).pdf',
    'civil_code_part1': 'file (32).pdf',
    'civil_code_part2': 'file (33).pdf',
    'admin_code': 'file (34).pdf',
    'labor_code': 'file (35).pdf',
    'family_code': '30.04.1998. O‘zbekiston Respublikasining Oila kodeksi (2).pdf',
    'tax_code': '30.12.2019. O‘zbekiston Respublikasining Soliq kodeksi (2).pdf',
}

def extract(pdf_path):
    reader = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages):
        try:
            t = page.extract_text() or ''
        except Exception as e:
            t = ''
            print(f'  page {i+1} error: {e}')
        pages.append(t)
    return '\n\f'.join(pages)

def parse_articles(text):
    """Moddalarni topish: N-modda. yoki N- modda shakllari."""
    # normalize weird chars
    t = text.replace('–', '-').replace('—', '-')
    # find all article markers with numbers
    matches = []
    # pattern: number followed by -modda / - modda
    pat = re.compile(r'(?m)^\s*(\d{1,4})\s*-\s*modda\b', re.IGNORECASE)
    for m in pat.finditer(t):
        num = int(m.group(1))
        matches.append((m.start(), num))
    return matches

report = {}
for key, fname in FILES.items():
    path = os.path.join(FOLDER, fname)
    if not os.path.exists(path):
        print(f'!! MISSING: {fname}')
        continue
    print(f'=== {key}: {fname} ===')
    text = extract(path)
    out_txt = os.path.join(OUT_DIR, key + '.txt')
    with open(out_txt, 'w', encoding='utf-8') as f:
        f.write(text)
    matches = parse_articles(text)
    nums = [n for _, n in matches]
    uniq = sorted(set(nums))
    gaps = []
    if uniq:
        for i in range(1, len(uniq)):
            if uniq[i] - uniq[i-1] > 1:
                gaps.append((uniq[i-1], uniq[i]))
    print(f'  chars: {len(text)}, pages text extracted: {len(text.split(chr(12)))}')
    print(f'  article markers: {len(nums)}, unique: {len(uniq)}')
    if uniq:
        print(f'  range: {uniq[0]}..{uniq[-1]}')
    if gaps:
        print(f'  gaps (prev,next): {gaps[:30]}')
    report[key] = {
        'markers': len(nums),
        'unique': len(uniq),
        'min': uniq[0] if uniq else None,
        'max': uniq[-1] if uniq else None,
        'gaps': gaps[:40],
    }
    print()

with open(os.path.join(OUT_DIR, 'report.json'), 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print(json.dumps(report, ensure_ascii=False, indent=2))
