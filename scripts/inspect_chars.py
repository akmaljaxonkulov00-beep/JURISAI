# -*- coding: utf-8 -*-
"""Sahifa 69 dagi 103-modda qatoridagi barcha charlarni, font o'lchami bilan ko'rsatish."""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import pdfplumber

with pdfplumber.open(r'C:/Users/ANUBIS PC/Desktop/Новая папка (3)/file (30).pdf') as pdf:
    p = pdf.pages[69]
    chars = p.chars or []
    # dump chars with top between 195 and 220 (the marker line region)
    region = [c for c in chars if 190 <= c['top'] <= 225]
    region.sort(key=lambda c: (round(c['top'], 1), c['x0']))
    for c in region:
        if c['text'].strip():
            print('top', round(c['top'], 2), 'x', round(c['x0'], 1), 'size', round(c['size'], 2), 'font', c['fontname'], 'char', repr(c['text']))
