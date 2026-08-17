# -*- coding: utf-8 -*-
"""Qaysi sahifada 1031-modda borligini pypdf orqali topib, pdfplumber bilan o'sha sahifani ko'rsatish."""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from pypdf import PdfReader
import pdfplumber

pdf_path = r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)/file (30).pdf'

# 1) find page index via pypdf
reader = PdfReader(pdf_path)
target = None
for i, page in enumerate(reader.pages):
    t = page.extract_text() or ''
    if '1031-modda' in t:
        target = i
        break
print('pypdf page index:', target)

# 2) dump that page with pdfplumber
with pdfplumber.open(pdf_path) as pdf:
    p = pdf.pages[target]
    print('page w/h:', p.width, p.height)
    # group chars into lines
    chars = p.chars or []
    lines = {}
    for c in chars:
        key = round(c['top'], 1)
        lines.setdefault(key, []).append(c)
    printed = 0
    for top in sorted(lines.keys()):
        cs = sorted(lines[top], key=lambda c: c['x0'])
        txt = ''.join(c['text'] for c in cs)
        if 'modda' in txt or '103' in txt:
            print('TOP', top, '|', repr(txt))
            sizes = {}
            for c in cs:
                if c['text'].strip():
                    sizes.setdefault(round(c['size'], 1), 0)
                    sizes[round(c['size'], 1)] += 1
            print('   font size histogram:', sizes)
            printed += 1
            if printed > 12:
                break
