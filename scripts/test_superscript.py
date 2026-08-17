# -*- coding: utf-8 -*-
"""pdfplumber orqali sub-modda (superscript) raqamlarini aniqlash testi."""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import pdfplumber

pdf = pdfplumber.open(r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)/file (30).pdf')
found = False
for i, p in enumerate(pdf.pages):
    chars = p.chars or []
    if not chars:
        continue
    # group by line top
    lines = {}
    for c in chars:
        key = round(c['top'], 1)
        lines.setdefault(key, []).append(c)
    for top, cs in sorted(lines.items()):
        cs = sorted(cs, key=lambda c: c['x0'])
        txt = ''.join(c['text'] for c in cs)
        if '1031-modda' in txt.replace(' ', ''):
            found = True
            print('PAGE', i, 'LINE top', top, 'TEXT:', repr(txt))
            for c in cs:
                if c['text'].strip():
                    print('   char', repr(c['text']), 'size', round(c['size'], 2), 'font', c['fontname'])
            break
    if found:
        break

if not found:
    print('NOT FOUND 1031-modda via pdfplumber; trying pypdf page search')
